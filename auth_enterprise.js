/**
 * Enterprise Hybrid Adaptive Authentication Module
 * Standar Keamanan BUMN / Enterprise PT PLN (Persero)
 *
 * Fitur Utama:
 * 1. WebAuthn / FIDO2 Passkeys (@simplewebauthn/server): Windows Hello, Touch ID, & Cross-Device QR Passkey.
 * 2. Identifier-First Adaptive Auth Resolution (/api/auth/identify).
 * 3. AES-256-GCM Encrypted Face Embeddings (tanpa foto mentah & tanpa eksposur vektor plaintext ke klien).
 * 4. Server-Issued 15-Second Randomized Active Liveness Challenges (BLINK_2X, TURN_RIGHT, TURN_LEFT).
 * 5. Virtual Camera Server-Side Rejection Guard & Audit Logging.
 * 6. Persistent DB Rate Limiting (Max 3x Gagal -> Lockout 15 Menit -> Alih ke Password + OTP).
 * 7. UU No. 27 Tahun 2022 (UU PDP) Explicit Biometric Consent & Timestamp Recording.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const MAX_BIOMETRIC_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;
const LIVENESS_TTL_MS = 15 * 1000;
const WEBAUTHN_TTL_MS = 3 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const PDP_CONSENT_VERSION = 'UU-PDP-27-2022-PLN-v1';

const VIRTUAL_CAM_KEYWORDS_REGEX = /\b(obs|virtual|manycam|snap\s*cam(era)?|camtwist|xsplit|splitcam|youcam|droidcam\s*virtual|iriun|epoccam|ndi|vdo\.ninja|fake|dummy)\b/i;

const LIVENESS_CHALLENGES = [
  {
    code: 'BLINK_2X',
    label: 'Kedipkan mata 2 kali',
    instruction: 'Tatap kamera lalu kedipkan kedua mata Anda sebanyak 2 kali dengan jelas dalam 15 detik.'
  },
  {
    code: 'TURN_RIGHT',
    label: 'Tengok ke kanan',
    instruction: 'Tengokkan kepala/wajah Anda sedikit ke arah kanan lalu kembali menghadap kamera dalam 15 detik.'
  },
  {
    code: 'TURN_LEFT',
    label: 'Tengok ke kiri',
    instruction: 'Tengokkan kepala/wajah Anda sedikit ke arah kiri lalu kembali menghadap kamera dalam 15 detik.'
  }
];

function getAes256Key(jwtSecret) {
  const configured = (process.env.BIOMETRIC_AES_KEY || '').trim();
  if (/^[a-f0-9]{64}$/i.test(configured)) {
    return Buffer.from(configured, 'hex');
  }
  const seed = configured || `${jwtSecret}:pln_corpu_biometric_aes256_v1`;
  return crypto.createHash('sha256').update(seed, 'utf8').digest();
}

function encryptBiometricVector(vector, jwtSecret) {
  if (!Array.isArray(vector) || vector.length < 32) {
    throw new Error('Vektor fitur wajah tidak valid atau terlalu pendek.');
  }
  const cleanVec = vector.map(v => Number(v) || 0);
  const key = getAes256Key(jwtSecret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(cleanVec);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: encrypted.toString('base64')
  });
}

function decryptBiometricVector(encryptedPayload, jwtSecret) {
  if (!encryptedPayload) return null;
  const parsed = typeof encryptedPayload === 'string' ? JSON.parse(encryptedPayload) : encryptedPayload;
  if (!parsed || parsed.alg !== 'aes-256-gcm' || !parsed.iv || !parsed.tag || !parsed.ct) {
    throw new Error('Format enkripsi biometrik tidak valid.');
  }
  const key = getAes256Key(jwtSecret);
  const iv = Buffer.from(parsed.iv, 'base64');
  const tag = Buffer.from(parsed.tag, 'base64');
  const ct = Buffer.from(parsed.ct, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  return JSON.parse(decrypted);
}

function isVirtualCameraLabel(label) {
  return Boolean(label && VIRTUAL_CAM_KEYWORDS_REGEX.test(String(label)));
}

function validateLivenessProof(expectedActionCode, proof) {
  if (!proof || typeof proof !== 'object') {
    return { valid: false, reason: 'Bukti active liveness tidak disertakan.' };
  }
  if (proof.actionCode !== expectedActionCode || proof.actionCompleted !== true) {
    return { valid: false, reason: 'Tantangan liveness tidak sesuai atau belum diselesaikan.' };
  }
  const frameCount = Number(proof.frameCount || 0);
  const motionVariance = Number(proof.motionVariance || 0);
  if (frameCount < 4 || motionVariance <= 0) {
    return { valid: false, reason: 'Aktivitas frame kamera dinamis tidak mencukupi (terindikasi frame statis).' };
  }
  if (expectedActionCode === 'BLINK_2X' && Number(proof.blinkCount || 0) < 2) {
    return { valid: false, reason: 'Kedipan mata belum mencapai 2 kali sesuai tantangan.' };
  }
  if (expectedActionCode === 'TURN_RIGHT' && Number(proof.yawDelta || 0) < 0.06) {
    return { valid: false, reason: 'Gerakan menengok ke kanan belum terdeteksi cukup jelas.' };
  }
  if (expectedActionCode === 'TURN_LEFT' && Number(proof.yawDelta || 0) > -0.06) {
    return { valid: false, reason: 'Gerakan menengok ke kiri belum terdeteksi cukup jelas.' };
  }
  return { valid: true };
}

function resolveWebAuthnContext(req) {
  const hostHeader = (req.get('host') || 'localhost').split(':')[0];
  const rpID = (process.env.WEBAUTHN_RP_ID || hostHeader || 'localhost').trim();
  const rpName = (process.env.WEBAUTHN_RP_NAME || 'PLN Corporate University Admin').trim();

  const origins = new Set();
  if (process.env.WEBAUTHN_ORIGIN) {
    process.env.WEBAUTHN_ORIGIN.split(',').map(s => s.trim()).filter(Boolean).forEach(o => origins.add(o));
  }
  const reqOrigin = req.get('origin');
  if (reqOrigin) origins.add(reqOrigin);
  if (req.get('host')) {
    origins.add(`${req.protocol}://${req.get('host')}`);
    origins.add(`https://${req.get('host')}`);
    origins.add(`http://${req.get('host')}`);
  }
  return { rpID, rpName, expectedOrigin: Array.from(origins) };
}

function safeJson(str, fallback = {}) {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch (_) { return fallback; }
}

function sanitizeUserObj(u) {
  if (!u) return u;
  const copy = { ...u };
  delete copy.password;
  delete copy.passwordHash;
  return copy;
}

function issueFullJwt(user, jwtSecret) {
  return jwt.sign(
    {
      id: user.id,
      nip: user.nip,
      role: user.role,
      nama: user.nama,
      isAdminPusat: Boolean(user.isAdminPusat)
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

function mountEnterpriseAuthRoutes(app, deps) {
  const {
    pool,
    JWT_SECRET,
    loginLimiter,
    authenticateToken,
    requireAdmin,
    calculateCosineSimilarity
  } = deps;

  async function writeSecurityAudit(action, userOrTarget, details, req) {
    try {
      const id = `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const userName = typeof userOrTarget === 'object' ? (userOrTarget.nama || userOrTarget.nip || userOrTarget.id || 'System') : String(userOrTarget || 'System');
      const role = typeof userOrTarget === 'object' ? (userOrTarget.role || 'admin') : 'security';
      const ts = new Date().toISOString();
      const ip = req?.ip || '';
      const payload = { id, action, target: userName, details: `${details}${ip ? ` [IP: ${ip}]` : ''}`, user: userName, role, timestamp: ts };
      await pool.query(
        `INSERT INTO audit_logs (id, action, target, details, user, role, timestamp, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, action, userName, payload.details, userName, role, ts, JSON.stringify(payload)]
      );
    } catch (_) { }
  }

  async function findAdminUserByIdentifier(identifier) {
    const clean = String(identifier || '').trim();
    if (!clean) return null;
    const [rows] = await pool.query(
      'SELECT data, password FROM users WHERE LOWER(nip) = LOWER(?) OR LOWER(id) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1',
      [clean, clean, clean]
    );
    if (rows.length === 0) return null;
    const user = safeJson(rows[0].data);
    return { user, passwordHash: rows[0].password || user.password };
  }

  async function getRateLimitStatus(identifierKey) {
    const key = String(identifierKey || '').toLowerCase().trim();
    const [rows] = await pool.query(
      'SELECT failed_attempts, locked_until, otp_required FROM auth_rate_limits WHERE identifier = ? LIMIT 1',
      [key]
    );
    if (rows.length === 0) {
      return { failedAttempts: 0, attemptsRemaining: MAX_BIOMETRIC_ATTEMPTS, locked: false, lockedUntil: null, remainingSeconds: 0, otpRequired: false };
    }
    const row = rows[0];
    const now = Date.now();
    const lockedUntilMs = row.locked_until ? new Date(row.locked_until).getTime() : 0;

    if (lockedUntilMs && lockedUntilMs > now) {
      const remainingSeconds = Math.ceil((lockedUntilMs - now) / 1000);
      return {
        failedAttempts: row.failed_attempts,
        attemptsRemaining: 0,
        locked: true,
        lockedUntil: new Date(lockedUntilMs).toISOString(),
        remainingSeconds,
        otpRequired: Boolean(row.otp_required)
      };
    }

    // Jika periode lockout sudah kedaluwarsa, bersihkan otomatis
    if (lockedUntilMs && lockedUntilMs <= now) {
      await pool.query('UPDATE auth_rate_limits SET failed_attempts = 0, locked_until = NULL, otp_required = 0 WHERE identifier = ?', [key]);
      return { failedAttempts: 0, attemptsRemaining: MAX_BIOMETRIC_ATTEMPTS, locked: false, lockedUntil: null, remainingSeconds: 0, otpRequired: false };
    }

    const failed = Number(row.failed_attempts || 0);
    return {
      failedAttempts: failed,
      attemptsRemaining: Math.max(0, MAX_BIOMETRIC_ATTEMPTS - failed),
      locked: false,
      lockedUntil: null,
      remainingSeconds: 0,
      otpRequired: Boolean(row.otp_required)
    };
  }

  async function recordBiometricFailure(identifierKey, user, req) {
    const key = String(identifierKey || '').toLowerCase().trim();
    const status = await getRateLimitStatus(key);
    const nextAttempts = (status.failedAttempts || 0) + 1;
    const isNowLocked = nextAttempts >= MAX_BIOMETRIC_ATTEMPTS;
    const lockedUntilDate = isNowLocked ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;

    await pool.query(
      `INSERT INTO auth_rate_limits (identifier, failed_attempts, locked_until, otp_required, last_attempt_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         failed_attempts = VALUES(failed_attempts),
         locked_until = VALUES(locked_until),
         otp_required = VALUES(otp_required),
         last_attempt_at = NOW()`,
      [key, nextAttempts, lockedUntilDate, isNowLocked ? 1 : 0]
    );

    if (isNowLocked) {
      await writeSecurityAudit('BIOMETRIC_LOCKOUT_15M', user, `Akun dikunci 15 menit setelah ${MAX_BIOMETRIC_ATTEMPTS}x gagal verifikasi biometrik.`, req);
    }

    return {
      failedAttempts: nextAttempts,
      attemptsRemaining: Math.max(0, MAX_BIOMETRIC_ATTEMPTS - nextAttempts),
      locked: isNowLocked,
      lockedUntil: lockedUntilDate ? lockedUntilDate.toISOString() : null,
      remainingSeconds: isNowLocked ? LOCKOUT_MINUTES * 60 : 0,
      requireOtpFallback: isNowLocked
    };
  }

  async function resetRateLimit(identifierKey) {
    const key = String(identifierKey || '').toLowerCase().trim();
    await pool.query('DELETE FROM auth_rate_limits WHERE identifier = ?', [key]).catch(() => { });
  }

  async function getUserAuthMethods(user) {
    const uid = String(user.id).toLowerCase();
    const uname = String(user.nip || user.id).toLowerCase();

    const [credRows] = await pool.query(
      'SELECT id, attachmentType, deviceType, transports, friendlyName, created_at, last_used_at FROM webauthn_credentials WHERE LOWER(userId) = ?',
      [uid]
    );
    const [bioRows] = await pool.query(
      'SELECT status, algorithm, qualityScore, encrypted_embedding, featureVector, pdp_consent, pdp_consent_at, preferred_method, enrolledAt FROM admin_biometrics WHERE (LOWER(userId) = ? OR LOWER(username) = ?) AND status = "AKTIF" LIMIT 1',
      [uid, uname]
    );

    const hasPlatformPasskey = credRows.some(c => c.attachmentType === 'platform');
    const hasCrossPlatformPasskey = credRows.some(c => c.attachmentType === 'cross-platform');
    const hasWebAuthn = credRows.length > 0;
    const bioRow = bioRows[0] || null;
    const hasWebcamFace = Boolean(bioRow && (bioRow.encrypted_embedding || bioRow.featureVector));

    let primaryMethod = 'password';
    if (hasPlatformPasskey || hasWebAuthn) {
      primaryMethod = 'webauthn';
    } else if (hasWebcamFace) {
      primaryMethod = 'webcam';
    }

    return {
      hasWebAuthn,
      hasPlatformPasskey,
      hasCrossPlatformPasskey,
      passkeyCount: credRows.length,
      hasWebcamFace,
      pdpConsentAt: bioRow?.pdp_consent_at || null,
      primaryMethod,
      credentialsSummary: credRows.map(c => ({
        id: c.id,
        attachmentType: c.attachmentType,
        deviceType: c.deviceType,
        friendlyName: c.friendlyName,
        createdAt: c.created_at,
        lastUsedAt: c.last_used_at
      }))
    };
  }

  // =========================================================================
  // 1. IDENTIFIER-FIRST RESOLUTION (/api/auth/identify)
  // =========================================================================
  app.post('/api/auth/identify', loginLimiter, async (req, res) => {
    try {
      const { identifier } = req.body || {};
      if (!identifier || String(identifier).trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Masukkan username, email, atau NIP Administrator.' });
      }

      const found = await findAdminUserByIdentifier(identifier);
      if (!found || (found.user.role !== 'admin' && found.user.role !== 'developer')) {
        return res.status(401).json({ success: false, message: 'Kredensial Administrator tidak dikenali atau tidak memiliki akses konsol.' });
      }

      if (String(found.user.status || 'AKTIF').toUpperCase() === 'NONAKTIF') {
        return res.status(403).json({ success: false, message: 'Akun Administrator ini berstatus NONAKTIF. Hubungi Super Admin.' });
      }

      const rateLimit = await getRateLimitStatus(found.user.id);
      const methods = await getUserAuthMethods(found.user);

      res.json({
        success: true,
        identifier: found.user.nip || found.user.id,
        displayName: found.user.nama || found.user.nip,
        role: found.user.role,
        locked: rateLimit.locked,
        lockedUntil: rateLimit.lockedUntil,
        remainingSeconds: rateLimit.remainingSeconds,
        attemptsRemaining: rateLimit.attemptsRemaining,
        requireOtpFallback: rateLimit.locked || rateLimit.otpRequired,
        authMethods: methods
      });
    } catch (err) {
      console.error('[API /auth/identify] Error:', err);
      res.status(500).json({ success: false, message: 'Gagal memproses identifikasi akun.' });
    }
  });

  // =========================================================================
  // 2. WEBAUTHN / PASSKEYS (WINDOWS HELLO, TOUCH ID, & PHONE QR PASSKEY)
  // =========================================================================
  app.get('/api/auth/webauthn/credentials', requireAdmin, async (req, res) => {
    try {
      const methods = await getUserAuthMethods(req.user);
      const rateLimit = await getRateLimitStatus(req.user.id);
      res.json({
        success: true,
        ...methods,
        rateLimit
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/auth/webauthn/register-options', requireAdmin, async (req, res) => {
    try {
      const { attachment = 'platform', friendlyName } = req.body || {};
      const { rpID, rpName } = resolveWebAuthnContext(req);
      const uid = String(req.user.id);

      const [existingCreds] = await pool.query(
        'SELECT id, transports FROM webauthn_credentials WHERE LOWER(userId) = LOWER(?)',
        [uid]
      );

      const authenticatorSelection = {
        userVerification: 'required',
        residentKey: attachment === 'cross-platform' ? 'required' : 'preferred'
      };
      if (attachment === 'platform' || attachment === 'cross-platform') {
        authenticatorSelection.authenticatorAttachment = attachment;
      }

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: req.user.nip || req.user.id,
        userID: Buffer.from(uid, 'utf8'),
        userDisplayName: req.user.nama || req.user.nip || uid,
        attestationType: 'none',
        excludeCredentials: existingCreds.map(c => ({
          id: c.id,
          transports: safeJson(c.transports, undefined)
        })),
        authenticatorSelection,
        preferredAuthenticatorType: attachment === 'cross-platform' ? 'remoteDevice' : 'localDevice'
      });

      const challengeId = 'wa_reg_' + crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + WEBAUTHN_TTL_MS);

      await pool.query(
        'INSERT INTO auth_challenges (id, userId, purpose, challenge_data, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)',
        [challengeId, uid.toLowerCase(), 'webauthn_reg', JSON.stringify({ challenge: options.challenge, attachment, friendlyName }), expiresAt]
      );

      res.json({ success: true, challengeId, options });
    } catch (err) {
      console.error('[WebAuthn register-options] Error:', err);
      res.status(500).json({ success: false, message: 'Gagal membuat opsi pendaftaran Passkey: ' + err.message });
    }
  });

  app.post('/api/auth/webauthn/register-verify', requireAdmin, async (req, res) => {
    try {
      const { challengeId, response, attachment = 'platform', friendlyName } = req.body || {};
      if (!challengeId || !response) {
        return res.status(400).json({ success: false, message: 'Data pendaftaran Passkey tidak lengkap.' });
      }

      const uid = String(req.user.id).toLowerCase();
      const [cRows] = await pool.query(
        'SELECT * FROM auth_challenges WHERE id = ? AND LOWER(userId) = ? AND purpose = "webauthn_reg" AND used = 0 LIMIT 1',
        [challengeId, uid]
      );
      if (cRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Tantangan pendaftaran Passkey tidak ditemukan atau sudah digunakan.' });
      }

      const chalRow = cRows[0];
      await pool.query('UPDATE auth_challenges SET used = 1 WHERE id = ?', [challengeId]);

      if (new Date() > new Date(chalRow.expires_at)) {
        return res.status(400).json({ success: false, message: 'Waktu pendaftaran Passkey habis. Silakan ulangi.' });
      }

      const chalData = safeJson(chalRow.challenge_data);
      const { rpID, expectedOrigin } = resolveWebAuthnContext(req);

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: chalData.challenge,
        expectedOrigin,
        expectedRPID: rpID,
        requireUserVerification: true
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ success: false, message: 'Verifikasi tanda tangan kriptografi Passkey gagal.' });
      }

      const { credential, credentialDeviceType, credentialBackedUp, aaguid } = verification.registrationInfo;
      const publicKeyB64 = Buffer.from(credential.publicKey).toString('base64');
      const transportsJson = JSON.stringify(credential.transports || response?.response?.transports || []);
      const attachType = chalData.attachment || attachment || 'platform';
      const labelName = friendlyName || chalData.friendlyName || (attachType === 'cross-platform' ? 'Passkey HP (QR Hybrid)' : 'Windows Hello / Passkey Perangkat');

      await pool.query(
        `INSERT INTO webauthn_credentials (id, userId, publicKey, counter, deviceType, backedUp, transports, attachmentType, friendlyName, aaguid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           publicKey = VALUES(publicKey), counter = VALUES(counter), deviceType = VALUES(deviceType),
           backedUp = VALUES(backedUp), transports = VALUES(transports), attachmentType = VALUES(attachmentType),
           friendlyName = VALUES(friendlyName)`,
        [credential.id, uid, publicKeyB64, credential.counter || 0, credentialDeviceType || 'singleDevice', credentialBackedUp ? 1 : 0, transportsJson, attachType, labelName, aaguid || '']
      );

      await writeSecurityAudit('WEBAUTHN_ENROLL_SUCCESS', req.user, `Pendaftaran Passkey berhasil (${labelName}).`, req);
      res.json({ success: true, credentialId: credential.id, friendlyName: labelName, attachmentType: attachType });
    } catch (err) {
      console.error('[WebAuthn register-verify] Error:', err);
      res.status(400).json({ success: false, message: 'Gagal memverifikasi Passkey: ' + err.message });
    }
  });

  app.delete('/api/auth/webauthn/credentials/:credId', requireAdmin, async (req, res) => {
    try {
      const uid = String(req.user.id).toLowerCase();
      const credId = decodeURIComponent(req.params.credId);
      const [result] = await pool.query('DELETE FROM webauthn_credentials WHERE id = ? AND LOWER(userId) = ?', [credId, uid]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Kredensial Passkey tidak ditemukan.' });
      }
      await writeSecurityAudit('WEBAUTHN_CREDENTIAL_REVOKED', req.user, `Penghapusan Passkey ID ${credId.slice(0, 12)}...`, req);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/auth/webauthn/auth-options', loginLimiter, async (req, res) => {
    try {
      const { identifier, mode = 'any' } = req.body || {};
      const found = await findAdminUserByIdentifier(identifier);
      if (!found || (found.user.role !== 'admin' && found.user.role !== 'developer')) {
        return res.status(401).json({ success: false, message: 'Akun Administrator tidak ditemukan.' });
      }

      const rateLimit = await getRateLimitStatus(found.user.id);
      if (rateLimit.locked) {
        return res.status(423).json({
          success: false,
          locked: true,
          lockedUntil: rateLimit.lockedUntil,
          remainingSeconds: rateLimit.remainingSeconds,
          requireOtpFallback: true,
          message: 'Akses biometrik dikunci sementara 15 menit karena 3x percobaan gagal. Silakan masuk dengan Password + OTP.'
        });
      }

      const uid = String(found.user.id).toLowerCase();
      const [credRows] = await pool.query(
        'SELECT id, transports, attachmentType FROM webauthn_credentials WHERE LOWER(userId) = ?',
        [uid]
      );

      let filteredCreds = credRows;
      if (mode === 'platform') {
        const platformOnly = credRows.filter(c => c.attachmentType === 'platform');
        if (platformOnly.length > 0) filteredCreds = platformOnly;
      } else if (mode === 'hybrid') {
        const crossOnly = credRows.filter(c => c.attachmentType === 'cross-platform');
        filteredCreds = crossOnly; // Kosong memicu browser menampilkan pilihan QR Code / Passkey HP lintas perangkat
      }

      if (mode !== 'hybrid' && filteredCreds.length === 0) {
        return res.status(404).json({ success: false, message: 'Belum ada Passkey perangkat terdaftar pada akun ini.' });
      }

      const { rpID } = resolveWebAuthnContext(req);
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: filteredCreds.map(c => ({
          id: c.id,
          transports: safeJson(c.transports, undefined)
        })),
        userVerification: 'required',
        ...(mode === 'hybrid' ? { hints: ['hybrid'] } : {})
      });

      const challengeId = 'wa_auth_' + crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + WEBAUTHN_TTL_MS);

      await pool.query(
        'INSERT INTO auth_challenges (id, userId, purpose, challenge_data, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)',
        [challengeId, uid, 'webauthn_auth', JSON.stringify({ challenge: options.challenge, mode }), expiresAt]
      );

      res.json({ success: true, challengeId, options });
    } catch (err) {
      console.error('[WebAuthn auth-options] Error:', err);
      res.status(500).json({ success: false, message: 'Gagal memulai tantangan Passkey: ' + err.message });
    }
  });

  app.post('/api/auth/webauthn/auth-verify', loginLimiter, async (req, res) => {
    try {
      const { identifier, challengeId, response } = req.body || {};
      if (!challengeId || !response || !response.id) {
        return res.status(400).json({ success: false, message: 'Respon Passkey tidak lengkap.' });
      }

      const found = await findAdminUserByIdentifier(identifier);
      if (!found || (found.user.role !== 'admin' && found.user.role !== 'developer')) {
        return res.status(401).json({ success: false, message: 'Akun tidak valid.' });
      }

      const uid = String(found.user.id).toLowerCase();
      const [cRows] = await pool.query(
        'SELECT * FROM auth_challenges WHERE id = ? AND LOWER(userId) = ? AND purpose = "webauthn_auth" AND used = 0 LIMIT 1',
        [challengeId, uid]
      );
      if (cRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Tantangan Passkey tidak valid atau telah digunakan.' });
      }

      const chalRow = cRows[0];
      await pool.query('UPDATE auth_challenges SET used = 1 WHERE id = ?', [challengeId]);

      if (new Date() > new Date(chalRow.expires_at)) {
        return res.status(400).json({ success: false, message: 'Sesi tantangan Passkey telah kedaluwarsa.' });
      }

      const [credRows] = await pool.query(
        'SELECT * FROM webauthn_credentials WHERE id = ? AND LOWER(userId) = ? LIMIT 1',
        [response.id, uid]
      );
      if (credRows.length === 0) {
        const failInfo = await recordBiometricFailure(uid, found.user, req);
        return res.status(failInfo.locked ? 423 : 401).json({
          success: false,
          message: 'Passkey tidak terdaftar pada akun Administrator ini.',
          ...failInfo
        });
      }

      const dbCred = credRows[0];
      const chalData = safeJson(chalRow.challenge_data);
      const { rpID, expectedOrigin } = resolveWebAuthnContext(req);

      let verification;
      try {
        verification = await verifyAuthenticationResponse({
          response,
          expectedChallenge: chalData.challenge,
          expectedOrigin,
          expectedRPID: rpID,
          credential: {
            id: dbCred.id,
            publicKey: new Uint8Array(Buffer.from(dbCred.publicKey, 'base64')),
            counter: Number(dbCred.counter || 0),
            transports: safeJson(dbCred.transports, undefined)
          },
          requireUserVerification: true
        });
      } catch (verifyErr) {
        const failInfo = await recordBiometricFailure(uid, found.user, req);
        return res.status(failInfo.locked ? 423 : 401).json({
          success: false,
          message: 'Verifikasi kriptografi Passkey gagal: ' + verifyErr.message,
          ...failInfo
        });
      }

      if (!verification.verified) {
        const failInfo = await recordBiometricFailure(uid, found.user, req);
        return res.status(failInfo.locked ? 423 : 401).json({
          success: false,
          message: 'Autentikasi Passkey ditolak.',
          ...failInfo
        });
      }

      await pool.query(
        'UPDATE webauthn_credentials SET counter = ?, last_used_at = NOW() WHERE id = ?',
        [verification.authenticationInfo.newCounter, dbCred.id]
      );
      await resetRateLimit(uid);

      const token = issueFullJwt(found.user, JWT_SECRET);
      await writeSecurityAudit('WEBAUTHN_LOGIN_SUCCESS', found.user, `Login berhasil menggunakan Passkey (${dbCred.friendlyName}).`, req);

      res.json({
        success: true,
        verified: true,
        token,
        user: sanitizeUserObj(found.user),
        method: dbCred.attachmentType === 'cross-platform' ? 'webauthn_hybrid' : 'webauthn_platform'
      });
    } catch (err) {
      console.error('[WebAuthn auth-verify] Error:', err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan verifikasi Passkey.' });
    }
  });

  // =========================================================================
  // 3. WEBCAM FACE FALLBACK: 15s ACTIVE LIVENESS + AES-256 + UU PDP + LOCKOUT
  // =========================================================================
  app.post('/api/auth/face/liveness-challenge', loginLimiter, async (req, res) => {
    try {
      const { identifier, purpose = 'login' } = req.body || {};
      let targetUser = null;

      if (identifier) {
        const found = await findAdminUserByIdentifier(identifier);
        targetUser = found ? found.user : null;
      } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(req.headers.authorization.substring(7), JWT_SECRET);
          const found = await findAdminUserByIdentifier(decoded.id);
          targetUser = found ? found.user : decoded;
        } catch (_) { }
      }

      if (!targetUser || (targetUser.role !== 'admin' && targetUser.role !== 'developer')) {
        return res.status(401).json({ success: false, message: 'Akun Administrator tidak valid untuk tantangan liveness.' });
      }

      const uid = String(targetUser.id).toLowerCase();
      if (purpose !== 'enroll') {
        const rateLimit = await getRateLimitStatus(uid);
        if (rateLimit.locked) {
          return res.status(423).json({
            success: false,
            locked: true,
            lockedUntil: rateLimit.lockedUntil,
            remainingSeconds: rateLimit.remainingSeconds,
            requireOtpFallback: true,
            message: 'Verifikasi wajah dikunci sementara 15 menit karena 3x percobaan gagal. Gunakan login Password + OTP.'
          });
        }
      }

      const picked = LIVENESS_CHALLENGES[crypto.randomInt(0, LIVENESS_CHALLENGES.length)];
      const challengeId = 'live_' + crypto.randomBytes(16).toString('hex');
      const nonce = crypto.randomBytes(12).toString('hex');
      const expiresAt = new Date(Date.now() + LIVENESS_TTL_MS);

      await pool.query(
        'INSERT INTO auth_challenges (id, userId, purpose, challenge_data, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)',
        [challengeId, uid, 'face_liveness', JSON.stringify({ actionCode: picked.code, nonce, purpose }), expiresAt]
      );

      res.json({
        success: true,
        challengeId,
        actionCode: picked.code,
        label: picked.label,
        instruction: picked.instruction,
        expiresInSeconds: 15,
        expiresAt: expiresAt.toISOString()
      });
    } catch (err) {
      console.error('[Face liveness-challenge] Error:', err);
      res.status(500).json({ success: false, message: 'Gagal membuat tantangan liveness acak.' });
    }
  });

  app.post('/api/auth/face/enroll', requireAdmin, async (req, res) => {
    try {
      const { featureVector, qualityScore = 95, pdpConsent, challengeId, livenessProof, deviceInfo } = req.body || {};

      if (pdpConsent !== true) {
        return res.status(400).json({
          success: false,
          message: 'Persetujuan eksplisit UU No. 27 Tahun 2022 (UU PDP) wajib dicentang sebelum menyimpan data biometrik.'
        });
      }

      if (deviceInfo && (deviceInfo.isVirtualCamera || isVirtualCameraLabel(deviceInfo.cameraLabel))) {
        await writeSecurityAudit('SECURITY_VIRTUAL_CAMERA_BLOCKED', req.user, `Pendaftaran ditolak: Kamera virtual terdeteksi (${deviceInfo.cameraLabel || 'Unknown'}).`, req);
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak: Penggunaan kamera virtual (OBS / Virtual Camera) tidak diizinkan untuk biometrik.'
        });
      }

      if (!Array.isArray(featureVector) || featureVector.length < 32) {
        return res.status(400).json({ success: false, message: 'Vektor fitur biometrik wajah tidak valid.' });
      }

      const uid = String(req.user.id).toLowerCase();

      // Validasi challenge liveness jika disertakan (wajib untuk enrollment aman)
      if (challengeId) {
        const [cRows] = await pool.query(
          'SELECT * FROM auth_challenges WHERE id = ? AND LOWER(userId) = ? AND purpose = "face_liveness" AND used = 0 LIMIT 1',
          [challengeId, uid]
        );
        if (cRows.length === 0) {
          return res.status(400).json({ success: false, message: 'Tantangan liveness pendaftaran tidak valid.' });
        }
        const chalRow = cRows[0];
        await pool.query('UPDATE auth_challenges SET used = 1 WHERE id = ?', [challengeId]);
        if (new Date() > new Date(chalRow.expires_at)) {
          return res.status(400).json({ success: false, message: 'Waktu tantangan liveness (15 detik) telah habis.' });
        }
        const chalData = safeJson(chalRow.challenge_data);
        const livenessCheck = validateLivenessProof(chalData.actionCode, livenessProof);
        if (!livenessCheck.valid) {
          return res.status(400).json({ success: false, message: livenessCheck.reason });
        }
      }

      // Enkripsi AES-256-GCM pada face embedding — foto mentah & plaintext vector TIDAK disimpan
      const encryptedEmbedding = encryptBiometricVector(featureVector, JWT_SECRET);
      const salt = crypto.randomBytes(16).toString('hex');
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let recoveryCode = '';
      for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) recoveryCode += '-';
        recoveryCode += chars.charAt(crypto.randomInt(0, chars.length));
      }
      const recoveryCodeHash = crypto.createHash('sha256').update(recoveryCode + salt).digest('hex');

      const nowIso = new Date().toISOString();
      const pdpIp = req.ip || '';
      const metadataPayload = {
        userId: uid,
        username: req.user.nip || uid,
        nama: req.user.nama || 'Administrator',
        role: req.user.role || 'admin',
        status: 'AKTIF',
        algorithm: 'AES-256-GCM-L3-v3',
        qualityScore: Number(qualityScore) || 95,
        pdpConsent: true,
        pdpConsentVersion: PDP_CONSENT_VERSION,
        pdpConsentAt: nowIso,
        enrolledAt: nowIso,
        updatedAt: nowIso
      };

      await pool.query(
        `INSERT INTO admin_biometrics (
          userId, username, nama, role, status, algorithm, featureVector, encrypted_embedding,
          qualityScore, salt, recoveryCodeHash, pdp_consent, pdp_consent_at, pdp_consent_ip,
          preferred_method, enrolledAt, updatedAt, data
        ) VALUES (?, ?, ?, ?, 'AKTIF', ?, NULL, ?, ?, ?, ?, 1, ?, ?, 'webcam', ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          username = VALUES(username), nama = VALUES(nama), role = VALUES(role), status = 'AKTIF',
          algorithm = VALUES(algorithm), featureVector = NULL, encrypted_embedding = VALUES(encrypted_embedding),
          qualityScore = VALUES(qualityScore), salt = VALUES(salt), recoveryCodeHash = VALUES(recoveryCodeHash),
          pdp_consent = 1, pdp_consent_at = VALUES(pdp_consent_at), pdp_consent_ip = VALUES(pdp_consent_ip),
          preferred_method = 'webcam', enrolledAt = VALUES(enrolledAt), updatedAt = VALUES(updatedAt), data = VALUES(data)`,
        [
          uid, metadataPayload.username, metadataPayload.nama, metadataPayload.role,
          metadataPayload.algorithm, encryptedEmbedding, metadataPayload.qualityScore,
          salt, recoveryCodeHash, nowIso, pdpIp, nowIso, nowIso, JSON.stringify(metadataPayload)
        ]
      );

      await resetRateLimit(uid);
      await writeSecurityAudit('ENROLL_FACE_AES256_SUCCESS', req.user, `Pendaftaran wajah AES-256 berhasil dengan persetujuan UU PDP (${nowIso}).`, req);

      res.json({
        success: true,
        recoveryCode,
        pdpConsentAt: nowIso,
        algorithm: metadataPayload.algorithm
      });
    } catch (err) {
      console.error('[Face enroll] Error:', err);
      res.status(500).json({ success: false, message: 'Gagal menyimpan template biometrik terenkripsi: ' + err.message });
    }
  });

  app.post('/api/auth/face/verify', loginLimiter, async (req, res) => {
    try {
      const { identifier, challengeId, featureVector, livenessProof, deviceInfo, purpose = 'login', recoveryCode } = req.body || {};

      // Validasi identitas baik dari body identifier (login) atau JWT (step-up)
      let targetUser = null;
      if (identifier) {
        const found = await findAdminUserByIdentifier(identifier);
        targetUser = found ? found.user : null;
      } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(req.headers.authorization.substring(7), JWT_SECRET);
          const found = await findAdminUserByIdentifier(decoded.id);
          targetUser = found ? found.user : decoded;
        } catch (_) { }
      }

      if (!targetUser || (targetUser.role !== 'admin' && targetUser.role !== 'developer')) {
        return res.status(401).json({ success: false, message: 'Akun Administrator tidak ditemukan.' });
      }

      const uid = String(targetUser.id).toLowerCase();
      const rateLimit = await getRateLimitStatus(uid);
      if (rateLimit.locked) {
        return res.status(423).json({
          success: false,
          locked: true,
          lockedUntil: rateLimit.lockedUntil,
          remainingSeconds: rateLimit.remainingSeconds,
          requireOtpFallback: true,
          message: 'Akses wajah dikunci sementara 15 menit setelah 3x percobaan gagal. Gunakan Password + OTP.'
        });
      }

      // 1. Cek Blokir Kamera Virtual di server
      if (deviceInfo && (deviceInfo.isVirtualCamera || isVirtualCameraLabel(deviceInfo.cameraLabel))) {
        await writeSecurityAudit('SECURITY_VIRTUAL_CAMERA_BLOCKED', targetUser, `Percobaan login kamera virtual diblokir: ${deviceInfo.cameraLabel || 'Unknown'}.`, req);
        return res.status(403).json({
          success: false,
          virtualCameraBlocked: true,
          message: 'Akses kamera virtual (OBS / Virtual Camera) ditolak oleh kebijakan keamanan.'
        });
      }

      const [bioRows] = await pool.query(
        'SELECT status, algorithm, encrypted_embedding, featureVector, salt, recoveryCodeHash FROM admin_biometrics WHERE (LOWER(userId) = ? OR LOWER(username) = ?) AND status = "AKTIF" LIMIT 1',
        [uid, String(targetUser.nip || uid).toLowerCase()]
      );
      if (bioRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data biometrik wajah belum terdaftar untuk akun ini.' });
      }
      const bio = bioRows[0];

      // Opsi emergency recovery key
      if (recoveryCode) {
        const cleanCode = String(recoveryCode).trim().toUpperCase();
        const hash = crypto.createHash('sha256').update(cleanCode + (bio.salt || '')).digest('hex');
        if (hash !== bio.recoveryCodeHash) {
          const failInfo = await recordBiometricFailure(uid, targetUser, req);
          return res.status(failInfo.locked ? 423 : 401).json({
            success: false,
            message: 'Kode Pemulihan Darurat tidak valid.',
            ...failInfo
          });
        }
        await resetRateLimit(uid);
        const token = issueFullJwt(targetUser, JWT_SECRET);
        await writeSecurityAudit('EMERGENCY_RECOVERY_LOGIN', targetUser, 'Login menggunakan Recovery Key tervalidasi backend.', req);
        return res.json({ success: true, verified: true, token, user: sanitizeUserObj(targetUser) });
      }

      // 2. Validasi Challenge Liveness 15 Detik (Anti-Replay & Strict TTL)
      if (!challengeId) {
        return res.status(400).json({ success: false, message: 'Challenge ID liveness wajib disertakan.' });
      }
      const [cRows] = await pool.query(
        'SELECT * FROM auth_challenges WHERE id = ? AND LOWER(userId) = ? AND purpose = "face_liveness" AND used = 0 LIMIT 1',
        [challengeId, uid]
      );
      if (cRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Tantangan liveness tidak valid atau telah kedaluwarsa.' });
      }
      const chalRow = cRows[0];
      await pool.query('UPDATE auth_challenges SET used = 1 WHERE id = ?', [challengeId]);

      if (new Date() > new Date(chalRow.expires_at)) {
        return res.status(408).json({
          success: false,
          challengeExpired: true,
          message: 'Batas waktu liveness challenge (15 detik) telah habis. Silakan ulangi tantangan baru.'
        });
      }

      const chalData = safeJson(chalRow.challenge_data);
      const livenessCheck = validateLivenessProof(chalData.actionCode, livenessProof);
      if (!livenessCheck.valid) {
        const failInfo = await recordBiometricFailure(uid, targetUser, req);
        return res.status(failInfo.locked ? 423 : 401).json({
          success: false,
          message: livenessCheck.reason,
          ...failInfo
        });
      }

      // 3. Dekripsi Vektor AES-256-GCM di Backend & Pencocokan Cosine Similarity
      if (!Array.isArray(featureVector) || featureVector.length < 32) {
        return res.status(400).json({ success: false, message: 'Vektor fitur wajah tidak valid.' });
      }

      let storedVector = null;
      if (bio.encrypted_embedding) {
        storedVector = decryptBiometricVector(bio.encrypted_embedding, JWT_SECRET);
      } else if (bio.featureVector) {
        storedVector = safeJson(bio.featureVector, null);
        // Auto-upgrade record legacy plaintext menjadi AES-256-GCM
        if (Array.isArray(storedVector) && storedVector.length >= 32) {
          const upgradedEnc = encryptBiometricVector(storedVector, JWT_SECRET);
          await pool.query('UPDATE admin_biometrics SET encrypted_embedding = ?, featureVector = NULL, algorithm = "AES-256-GCM-L3-v3" WHERE LOWER(userId) = ?', [upgradedEnc, uid]).catch(() => { });
        }
      }

      if (!Array.isArray(storedVector) || storedVector.length === 0) {
        return res.status(500).json({ success: false, message: 'Template biometrik terenkripsi korup atau tidak terbaca.' });
      }

      const similarity = calculateCosineSimilarity(storedVector, featureVector);
      const threshold = (bio.algorithm && (bio.algorithm.includes('v2') || bio.algorithm.includes('v3'))) ? 0.62 : 0.54;

      if (similarity < threshold) {
        const failInfo = await recordBiometricFailure(uid, targetUser, req);
        await writeSecurityAudit('FACE_VERIFY_FAILED', targetUser, `Verifikasi wajah ditolak backend (Kemiripan: ${Math.round(similarity * 100)}%). Sisa percobaan: ${failInfo.attemptsRemaining}.`, req);
        return res.status(failInfo.locked ? 423 : 401).json({
          success: false,
          verified: false,
          similarity: parseFloat(similarity.toFixed(4)),
          message: failInfo.locked
            ? 'Verifikasi wajah gagal 3 kali. Akun dikunci 15 menit dan dialihkan ke Password + OTP.'
            : `Wajah tidak cocok (${Math.round(similarity * 100)}%). Sisa percobaan: ${failInfo.attemptsRemaining} dari ${MAX_BIOMETRIC_ATTEMPTS}.`,
          ...failInfo
        });
      }

      // 4. Sukses: Reset Rate Limit, Catat Audit & Terbitkan JWT Penuh
      await resetRateLimit(uid);
      const token = issueFullJwt(targetUser, JWT_SECRET);
      await writeSecurityAudit('FACE_VERIFY_SUCCESS', targetUser, `Verifikasi wajah & active liveness (${chalData.actionCode}) sukses di backend (${Math.round(similarity * 100)}%).`, req);

      res.json({
        success: true,
        verified: true,
        token,
        user: sanitizeUserObj(targetUser),
        similarity: parseFloat(similarity.toFixed(4)),
        purpose
      });
    } catch (err) {
      console.error('[Face verify] Error:', err);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan saat verifikasi wajah di server.' });
    }
  });

  // =========================================================================
  // 4. PASSWORD + OTP FALLBACK (AKTIF SAAT LOCKOUT 15 MENIT / FALLBACK)
  // =========================================================================
  app.post('/api/auth/otp/request', loginLimiter, async (req, res) => {
    try {
      const { identifier, password } = req.body || {};
      if (!identifier || !password) {
        return res.status(400).json({ success: false, message: 'Username/NIP dan kata sandi wajib diisi untuk meminta OTP.' });
      }

      const found = await findAdminUserByIdentifier(identifier);
      if (!found || (found.user.role !== 'admin' && found.user.role !== 'developer')) {
        return res.status(401).json({ success: false, message: 'Kredensial atau kata sandi tidak valid.' });
      }

      let isPwdValid = false;
      const storedPwd = found.passwordHash;
      if (storedPwd && (storedPwd.startsWith('$2a$') || storedPwd.startsWith('$2b$'))) {
        isPwdValid = await bcrypt.compare(password, storedPwd);
      } else if (storedPwd) {
        isPwdValid = (password === storedPwd);
      }

      if (!isPwdValid) {
        return res.status(401).json({ success: false, message: 'Kredensial atau kata sandi tidak valid.' });
      }

      const uid = String(found.user.id).toLowerCase();
      const otpCode = String(crypto.randomInt(100000, 999999));
      const otpSalt = crypto.randomBytes(8).toString('hex');
      const otpHash = crypto.createHash('sha256').update(otpCode + otpSalt).digest('hex');
      const challengeId = 'otp_' + crypto.randomBytes(14).toString('hex');
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);

      await pool.query(
        'INSERT INTO auth_challenges (id, userId, purpose, challenge_data, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)',
        [challengeId, uid, 'otp_fallback', JSON.stringify({ otpHash, otpSalt }), expiresAt]
      );

      // Kirim via webhook eksternal jika dikonfigurasi
      if (process.env.OTP_WEBHOOK_URL) {
        fetch(process.env.OTP_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: found.user.email || found.user.nip,
            nama: found.user.nama,
            otp: otpCode,
            expiresInMinutes: 5
          })
        }).catch(() => { });
      } else {
        console.log(`\n🔐 [PLN Corpu Auth OTP] Kode OTP untuk ${found.user.nip} (${found.user.nama}): ${otpCode} (Berlaku 5 menit)\n`);
      }

      await writeSecurityAudit('OTP_FALLBACK_ISSUED', found.user, 'Permintaan OTP Login Fallback berhasil diterbitkan (TTL 5 menit).', req);

      const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || process.env.OTP_SANDBOX_PREVIEW === 'true';
      const maskedEmail = found.user.email
        ? found.user.email.replace(/(.{2}).+(@.+)/, '$1***$2')
        : `${(found.user.nip || '').slice(0, 3)}***@pln.co.id`;

      res.json({
        success: true,
        challengeId,
        maskedTarget: maskedEmail,
        expiresInSeconds: 300,
        ...(isLocal && !process.env.OTP_WEBHOOK_URL ? { sandboxOtpPreview: otpCode } : {})
      });
    } catch (err) {
      console.error('[OTP request] Error:', err);
      res.status(500).json({ success: false, message: 'Gagal menerbitkan OTP verifikasi.' });
    }
  });

  app.post('/api/auth/otp/verify', loginLimiter, async (req, res) => {
    try {
      const { identifier, password, challengeId, otpCode } = req.body || {};
      if (!identifier || !password || !challengeId || !otpCode) {
        return res.status(400).json({ success: false, message: 'Lengkapi kata sandi dan 6-digit kode OTP.' });
      }

      const found = await findAdminUserByIdentifier(identifier);
      if (!found || (found.user.role !== 'admin' && found.user.role !== 'developer')) {
        return res.status(401).json({ success: false, message: 'Kredensial tidak valid.' });
      }

      let isPwdValid = false;
      const storedPwd = found.passwordHash;
      if (storedPwd && (storedPwd.startsWith('$2a$') || storedPwd.startsWith('$2b$'))) {
        isPwdValid = await bcrypt.compare(password, storedPwd);
      } else if (storedPwd) {
        isPwdValid = (password === storedPwd);
      }
      if (!isPwdValid) {
        return res.status(401).json({ success: false, message: 'Kata sandi tidak valid.' });
      }

      const uid = String(found.user.id).toLowerCase();
      const [cRows] = await pool.query(
        'SELECT * FROM auth_challenges WHERE id = ? AND LOWER(userId) = ? AND purpose = "otp_fallback" AND used = 0 LIMIT 1',
        [challengeId, uid]
      );
      if (cRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Sesi OTP tidak ditemukan atau sudah digunakan.' });
      }

      const chalRow = cRows[0];
      if (new Date() > new Date(chalRow.expires_at)) {
        return res.status(400).json({ success: false, message: 'Kode OTP telah kedaluwarsa. Silakan minta ulang.' });
      }

      const { otpHash, otpSalt } = safeJson(chalRow.challenge_data);
      const checkHash = crypto.createHash('sha256').update(String(otpCode).trim() + (otpSalt || '')).digest('hex');

      if (checkHash !== otpHash) {
        return res.status(401).json({ success: false, message: 'Kode OTP tidak sesuai.' });
      }

      await pool.query('UPDATE auth_challenges SET used = 1 WHERE id = ?', [challengeId]);
      await resetRateLimit(uid);

      const token = issueFullJwt(found.user, JWT_SECRET);
      await writeSecurityAudit('OTP_FALLBACK_LOGIN_SUCCESS', found.user, 'Login via Password + OTP Fallback berhasil.', req);

      res.json({
        success: true,
        token,
        user: sanitizeUserObj(found.user)
      });
    } catch (err) {
      console.error('[OTP verify] Error:', err);
      res.status(500).json({ success: false, message: 'Gagal memverifikasi kode OTP.' });
    }
  });
}

module.exports = {
  mountEnterpriseAuthRoutes,
  encryptBiometricVector,
  decryptBiometricVector,
  isVirtualCameraLabel,
  validateLivenessProof,
  MAX_BIOMETRIC_ATTEMPTS,
  LOCKOUT_MINUTES,
  LIVENESS_TTL_MS,
  PDP_CONSENT_VERSION
};
