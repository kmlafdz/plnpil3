/**
 * Comprehensive Verification Test Suite:
 * Hybrid Adaptive Authentication (Enterprise / BUMN Standard)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  mountEnterpriseAuthRoutes,
  encryptBiometricVector,
  decryptBiometricVector,
  isVirtualCameraLabel,
  validateLivenessProof
} = require('../auth_enterprise');

const JWT_SECRET = 'test_enterprise_jwt_secret_2026';

// Helper cosine similarity identik dengan server.js
function calculateCosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  const len = Math.min(vecA.length, vecB.length);
  if (len === 0) return 0;
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < len; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dot += a * b;
    nA += a * a;
    nB += b * b;
  }
  const denom = Math.sqrt(nA) * Math.sqrt(nB);
  return denom === 0 ? 0 : dot / denom;
}

// Unit vector generator 128-D
function makeVector(seed = 1, perturb = 0) {
  const vec = [];
  for (let i = 0; i < 128; i++) {
    vec.push(Math.sin(seed * (i + 1)) + (i % 2 === 0 ? perturb : -perturb));
  }
  const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0)) || 1;
  return vec.map(v => Number((v / mag).toFixed(6)));
}

// In-memory mock MariaDB pool untuk pengujian endpoint HTTP secara deterministik
function createMockPool(adminPasswordHash) {
  const db = {
    users: [
      {
        id: 'adm-pusat',
        nip: 'adminpusat',
        email: 'adminpusat@pln.co.id',
        role: 'admin',
        status: 'AKTIF',
        password: adminPasswordHash,
        data: JSON.stringify({
          id: 'adm-pusat',
          nip: 'adminpusat',
          username: 'adminpusat',
          email: 'adminpusat@pln.co.id',
          nama: 'Administrator Pusat',
          role: 'admin',
          isAdminPusat: true,
          status: 'AKTIF'
        })
      }
    ],
    webauthn_credentials: [],
    admin_biometrics: [],
    auth_challenges: [],
    auth_rate_limits: [],
    audit_logs: []
  };

  return {
    _db: db,
    async query(sql, params = []) {
      const s = sql.trim().replace(/\s+/g, ' ');
      if (s.startsWith('SELECT data, password FROM users')) {
        const q = String(params[0] || '').toLowerCase();
        const found = db.users.filter(u => u.nip.toLowerCase() === q || u.id.toLowerCase() === q || u.email.toLowerCase() === q);
        return [found.map(u => ({ data: u.data, password: u.password }))];
      }
      if (s.startsWith('SELECT failed_attempts, locked_until, otp_required FROM auth_rate_limits')) {
        const key = String(params[0] || '').toLowerCase();
        const rows = db.auth_rate_limits.filter(r => r.identifier === key);
        return [rows];
      }
      if (s.startsWith('INSERT INTO auth_rate_limits')) {
        const [identifier, failed_attempts, locked_until, otp_required] = params;
        const idx = db.auth_rate_limits.findIndex(r => r.identifier === identifier);
        const rec = { identifier, failed_attempts, locked_until, otp_required, last_attempt_at: new Date() };
        if (idx >= 0) db.auth_rate_limits[idx] = rec;
        else db.auth_rate_limits.push(rec);
        return [{ affectedRows: 1 }];
      }
      if (s.startsWith('UPDATE auth_rate_limits')) {
        const key = String(params[0] || '').toLowerCase();
        db.auth_rate_limits = db.auth_rate_limits.filter(r => r.identifier !== key);
        return [{ affectedRows: 1 }];
      }
      if (s.startsWith('DELETE FROM auth_rate_limits')) {
        const key = String(params[0] || '').toLowerCase();
        db.auth_rate_limits = db.auth_rate_limits.filter(r => r.identifier !== key);
        return [{ affectedRows: 1 }];
      }
      if (s.includes('FROM webauthn_credentials')) {
        const uid = String(params[0] || '').toLowerCase();
        const rows = db.webauthn_credentials.filter(c => c.userId.toLowerCase() === uid);
        return [rows];
      }
      if (s.includes('FROM admin_biometrics')) {
        const uid = String(params[0] || '').toLowerCase();
        const rows = db.admin_biometrics.filter(b => b.userId.toLowerCase() === uid || b.username.toLowerCase() === uid);
        return [rows];
      }
      if (s.startsWith('INSERT INTO admin_biometrics')) {
        const [userId, username, nama, role, algorithm, encrypted_embedding, qualityScore, salt, recoveryCodeHash, pdp_consent_at, pdp_consent_ip, enrolledAt, updatedAt, data] = params;
        const rec = {
          userId, username, nama, role, status: 'AKTIF', algorithm,
          featureVector: null, encrypted_embedding, qualityScore, salt, recoveryCodeHash,
          pdp_consent: 1, pdp_consent_at, pdp_consent_ip, preferred_method: 'webcam',
          enrolledAt, updatedAt, data
        };
        const idx = db.admin_biometrics.findIndex(b => b.userId === userId);
        if (idx >= 0) db.admin_biometrics[idx] = rec;
        else db.admin_biometrics.push(rec);
        return [{ affectedRows: 1 }];
      }
      if (s.startsWith('INSERT INTO auth_challenges')) {
        const [id, userId, purpose, challenge_data, expires_at] = params;
        db.auth_challenges.push({ id, userId, purpose, challenge_data, expires_at, used: 0 });
        return [{ affectedRows: 1 }];
      }
      if (s.startsWith('SELECT * FROM auth_challenges')) {
        const [id, uid] = params;
        const purposeMatch = s.match(/purpose = "([^"]+)"/);
        const purpose = purposeMatch ? purposeMatch[1] : null;
        const rows = db.auth_challenges.filter(c =>
          c.id === id &&
          c.userId.toLowerCase() === uid.toLowerCase() &&
          c.used === 0 &&
          (!purpose || c.purpose === purpose)
        );
        return [rows];
      }
      if (s.startsWith('UPDATE auth_challenges SET used = 1')) {
        const id = params[0];
        const row = db.auth_challenges.find(c => c.id === id);
        if (row) row.used = 1;
        return [{ affectedRows: 1 }];
      }
      if (s.startsWith('INSERT INTO audit_logs')) {
        db.audit_logs.push({ id: params[0], action: params[1], details: params[3] });
        return [{ affectedRows: 1 }];
      }
      return [[]];
    }
  };
}

async function runTests() {
  console.log('=== MEMULAI TEST SUITE: HYBRID ADAPTIVE AUTH ENTERPRISE ===\n');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Test AES-256-GCM Encryption & Decryption
  await test('AES-256-GCM mengenkripsi face vector dan menolak ciphertext yang dimodifikasi', () => {
    const vec = makeVector(1);
    const enc = encryptBiometricVector(vec, JWT_SECRET);
    const parsed = JSON.parse(enc);
    assert.strictEqual(parsed.alg, 'aes-256-gcm');
    assert(!enc.includes(String(vec[0])), 'Vektor asli tidak boleh muncul sebagai plaintext');

    const dec = decryptBiometricVector(enc, JWT_SECRET);
    assert.strictEqual(dec.length, 128);
    assert(calculateCosineSimilarity(vec, dec) > 0.9999);

    // Tampering test
    const tampered = JSON.stringify({ ...parsed, ct: 'AAAA' + parsed.ct.slice(4) });
    assert.throws(() => decryptBiometricVector(tampered, JWT_SECRET));
  });

  // 2. Test Virtual Camera Detection
  await test('Virtual Camera Detector memblokir OBS, Virtual, ManyCam, Snap Camera dan mengizinkan kamera fisik', () => {
    assert.strictEqual(isVirtualCameraLabel('OBS Virtual Camera'), true);
    assert.strictEqual(isVirtualCameraLabel('ManyCam Virtual Webcam'), true);
    assert.strictEqual(isVirtualCameraLabel('Snap Camera'), true);
    assert.strictEqual(isVirtualCameraLabel('Integrated Camera (04f2:b67e)'), false);

    // Load frontend FaceAuthManager in VM and test detectVirtualCameraFromDevices
    const winMock = {
      localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; } },
      dispatchEvent() {}
    };
    winMock.window = winMock;
    const ctx = vm.createContext({ window: winMock, localStorage: winMock.localStorage, navigator: {}, console });
    const faceAuthCode = fs.readFileSync(path.join(__dirname, '../js/face_auth.js'), 'utf8');
    vm.runInContext(faceAuthCode, ctx);

    const obsOnly = [{ kind: 'videoinput', deviceId: 'v1', label: 'OBS Virtual Camera' }];
    assert.strictEqual(winMock.FaceAuthManager.detectVirtualCameraFromDevices(obsOnly).blocked, true);

    const mixedWithActiveObs = [
      { kind: 'videoinput', deviceId: 'p1', label: 'Integrated HD Webcam' },
      { kind: 'videoinput', deviceId: 'v1', label: 'Snap Camera' }
    ];
    assert.strictEqual(winMock.FaceAuthManager.detectVirtualCameraFromDevices(mixedWithActiveObs, 'Snap Camera').blocked, true);
    assert.strictEqual(winMock.FaceAuthManager.detectVirtualCameraFromDevices(mixedWithActiveObs, 'Integrated HD Webcam').blocked, false);
  });

  // 3. Test Active Liveness Proof Validation
  await test('Validasi bukti active liveness menolak frame statis atau aksi yang tidak sesuai', () => {
    assert.strictEqual(validateLivenessProof('BLINK_2X', { actionCode: 'BLINK_2X', actionCompleted: true, blinkCount: 2, frameCount: 10, motionVariance: 1.5 }).valid, true);
    assert.strictEqual(validateLivenessProof('BLINK_2X', { actionCode: 'BLINK_2X', actionCompleted: true, blinkCount: 1, frameCount: 10, motionVariance: 1.5 }).valid, false);
    assert.strictEqual(validateLivenessProof('TURN_RIGHT', { actionCode: 'TURN_RIGHT', actionCompleted: true, yawDelta: 0.11, frameCount: 10, motionVariance: 1.2 }).valid, true);
    assert.strictEqual(validateLivenessProof('TURN_LEFT', { actionCode: 'TURN_LEFT', actionCompleted: true, yawDelta: 0.11, frameCount: 10, motionVariance: 1.2 }).valid, false);
    assert.strictEqual(validateLivenessProof('TURN_LEFT', { actionCode: 'TURN_LEFT', actionCompleted: true, yawDelta: -0.10, frameCount: 8, motionVariance: 0 }).valid, false);
  });

  // 4. Spin up Express server untuk uji integrasi end-to-end API backend
  const adminHash = await bcrypt.hash('adminpusat123', 10);
  const mockPool = createMockPool(adminHash);
  const app = express();
  app.use(express.json());

  const adminToken = jwt.sign({ id: 'adm-pusat', nip: 'adminpusat', role: 'admin', nama: 'Administrator Pusat', isAdminPusat: true }, JWT_SECRET);
  const passThrough = (req, res, next) => next();
  const requireAdminMock = (req, res, next) => {
    const h = req.headers.authorization || '';
    const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!tok) return res.status(401).json({ success: false });
    req.user = jwt.verify(tok, JWT_SECRET);
    next();
  };

  mountEnterpriseAuthRoutes(app, {
    pool: mockPool,
    JWT_SECRET,
    loginLimiter: passThrough,
    authenticateToken: requireAdminMock,
    requireAdmin: requireAdminMock,
    calculateCosineSimilarity
  });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const enrolledVec = makeVector(7);

    // 4a. Identify before enrollment
    await test('POST /api/auth/identify mengembalikan mode adaptif untuk akun Administrator valid', async () => {
      const r = await fetch(`${baseUrl}/api/auth/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'adminpusat' })
      });
      const d = await r.json();
      assert.strictEqual(r.status, 200);
      assert.strictEqual(d.success, true);
      assert.strictEqual(d.authMethods.primaryMethod, 'password');

      const bad = await fetch(`${baseUrl}/api/auth/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'unknown_user' })
      });
      assert.strictEqual(bad.status, 401);
    });

    // 4b. WebAuthn Registration Options generation
    await test('POST /api/auth/webauthn/register-options menghasilkan tantangan FIDO2 platform & cross-platform', async () => {
      const r = await fetch(`${baseUrl}/api/auth/webauthn/register-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ attachment: 'cross-platform' })
      });
      const d = await r.json();
      assert.strictEqual(r.status, 200);
      assert.strictEqual(d.success, true);
      assert(d.options.challenge);
      assert.strictEqual(d.options.authenticatorSelection.authenticatorAttachment, 'cross-platform');
    });

    // 4c. Enroll requires UU PDP explicit consent
    await test('POST /api/auth/face/enroll menolak tanpa persetujuan UU PDP dan menyimpan AES-256 + timestamp saat disetujui', async () => {
      const rFail = await fetch(`${baseUrl}/api/auth/face/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ featureVector: enrolledVec, pdpConsent: false })
      });
      assert.strictEqual(rFail.status, 400);

      const rOk = await fetch(`${baseUrl}/api/auth/face/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ featureVector: enrolledVec, pdpConsent: true, qualityScore: 98 })
      });
      const dOk = await rOk.json();
      assert.strictEqual(rOk.status, 200);
      assert.strictEqual(dOk.success, true);
      assert(dOk.pdpConsentAt);
      assert(dOk.recoveryCode);

      const stored = mockPool._db.admin_biometrics[0];
      assert.strictEqual(stored.featureVector, null, 'Plaintext featureVector HARUS NULL di DB');
      assert(stored.encrypted_embedding.includes('aes-256-gcm'));
      assert.strictEqual(stored.pdp_consent, 1);
    });

    // 4d. Liveness challenge 15s + Virtual Cam block + Valid verify
    await test('POST /api/auth/face/verify memblokir kamera virtual, menolak challenge expired 15s, & meloloskan wajah sah', async () => {
      const cRes = await fetch(`${baseUrl}/api/auth/face/liveness-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'adminpusat' })
      });
      const chal = await cRes.json();
      assert.strictEqual(chal.expiresInSeconds, 15);
      assert(['BLINK_2X', 'TURN_RIGHT', 'TURN_LEFT'].includes(chal.actionCode));

      // Uji blokir virtual camera di server
      const vCam = await fetch(`${baseUrl}/api/auth/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'adminpusat',
          challengeId: chal.challengeId,
          featureVector: enrolledVec,
          deviceInfo: { isVirtualCamera: true, cameraLabel: 'OBS Virtual Camera' }
        })
      });
      assert.strictEqual(vCam.status, 403);

      // Buat bukti liveness sesuai actionCode & verifikasi sukses
      const validProof = {
        actionCode: chal.actionCode,
        actionCompleted: true,
        blinkCount: chal.actionCode === 'BLINK_2X' ? 2 : 0,
        yawDelta: chal.actionCode === 'TURN_RIGHT' ? 0.12 : (chal.actionCode === 'TURN_LEFT' ? -0.12 : 0),
        frameCount: 8,
        motionVariance: 1.5
      };

      const vOk = await fetch(`${baseUrl}/api/auth/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'adminpusat',
          challengeId: chal.challengeId,
          featureVector: enrolledVec,
          livenessProof: validProof,
          deviceInfo: { isVirtualCamera: false, cameraLabel: 'Integrated Camera' }
        })
      });
      const dOk = await vOk.json();
      assert.strictEqual(vOk.status, 200);
      assert.strictEqual(dOk.verified, true);
      assert(dOk.token);

      // Anti-replay: challenge yang sama harus ditolak pada pemakaian kedua
      const replay = await fetch(`${baseUrl}/api/auth/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'adminpusat',
          challengeId: chal.challengeId,
          featureVector: enrolledVec,
          livenessProof: validProof
        })
      });
      assert.strictEqual(replay.status, 400);

      // Uji challenge expired (> 15 detik)
      const cExpRes = await fetch(`${baseUrl}/api/auth/face/liveness-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'adminpusat' })
      });
      const expChal = await cExpRes.json();
      const row = mockPool._db.auth_challenges.find(c => c.id === expChal.challengeId);
      row.expires_at = new Date(Date.now() - 2000); // paksa lewat 15 detik
      const vExp = await fetch(`${baseUrl}/api/auth/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'adminpusat',
          challengeId: expChal.challengeId,
          featureVector: enrolledVec
        })
      });
      assert.strictEqual(vExp.status, 408);
    });

    // 4e. Rate limit 3x gagal -> Lockout 15 menit -> Password + OTP Fallback
    await test('3x gagal verifikasi wajah memicu lockout 15 menit (HTTP 423) dan dapat pulih via Password + OTP', async () => {
      const wrongVec = makeVector(99);
      let lastRes;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const cRes = await fetch(`${baseUrl}/api/auth/face/liveness-challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'adminpusat' })
        });
        const chal = await cRes.json();
        const proof = {
          actionCode: chal.actionCode,
          actionCompleted: true,
          blinkCount: chal.actionCode === 'BLINK_2X' ? 2 : 0,
          yawDelta: chal.actionCode === 'TURN_RIGHT' ? 0.12 : (chal.actionCode === 'TURN_LEFT' ? -0.12 : 0),
          frameCount: 8,
          motionVariance: 1.5
        };
        const vRes = await fetch(`${baseUrl}/api/auth/face/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: 'adminpusat',
            challengeId: chal.challengeId,
            featureVector: wrongVec,
            livenessProof: proof
          })
        });
        lastRes = { status: vRes.status, data: await vRes.json() };
      }

      assert.strictEqual(lastRes.status, 423);
      assert.strictEqual(lastRes.data.locked, true);
      assert.strictEqual(lastRes.data.requireOtpFallback, true);

      // Request OTP menggunakan password valid
      const otpReq = await fetch(`${baseUrl}/api/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'adminpusat', password: 'adminpusat123' })
      });
      const otpData = await otpReq.json();
      assert.strictEqual(otpReq.status, 200);
      assert.strictEqual(otpData.success, true);
      assert(otpData.sandboxOtpPreview);

      // Verifikasi Password + OTP -> Menerbitkan JWT & membuka lockout
      const otpVer = await fetch(`${baseUrl}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'adminpusat',
          password: 'adminpusat123',
          challengeId: otpData.challengeId,
          otpCode: otpData.sandboxOtpPreview
        })
      });
      const verData = await otpVer.json();
      assert.strictEqual(otpVer.status, 200);
      assert.strictEqual(verData.success, true);
      assert(verData.token);

      // Lockout telah terbuka
      const idAfter = await fetch(`${baseUrl}/api/auth/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'adminpusat' })
      });
      const idData = await idAfter.json();
      assert.strictEqual(idData.locked, false);
    });

    // 4f. Frontend authManager tidak mengizinkan bypass tiket lokal DevTools
    await test('Frontend AuthManager menolak bypass tiket lokal tanpa verifikasi backend', async () => {
      const domWin = {
        localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; }, removeItem(k) { delete this._s[k]; } },
        dispatchEvent() {}
      };
      domWin.window = domWin;
      const vmCtx = vm.createContext({
        window: domWin,
        localStorage: domWin.localStorage,
        CustomEvent: class {},
        fetch: async () => { throw new Error('offline'); },
        console
      });
      vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8'), vmCtx);
      const res = await domWin.authManager.completeAdminLoginWithFace('spoofed_ticket', { id: 'adm-pusat', role: 'admin' });
      assert.strictEqual(res.success, false);
    });

  } finally {
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`RINGKASAN: ${passed} / ${total} PENGUJIAN BERHASIL`);
  console.log(`========================================`);
  if (passed !== total) process.exit(1);
}

runTests();
