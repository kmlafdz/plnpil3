/**
 * Backend Server Evaluasi Level 3 UP3 Metro
 * Database: MariaDB Server KemzKun Server (pln_pil_3)
 * Keamanan: JWT Auth, Token Revocation, Bcrypt Hashing, Rate Limiting, RBAC & Hardened Security Headers
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool, testConnection, initSchema } = require('./db');
const {
  mountEnterpriseAuthRoutes,
  encryptBiometricVector,
  decryptBiometricVector
} = require('./auth_enterprise');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const PUBLIC_DIR = __dirname;
const JWT_SECRET = process.env.JWT_SECRET || 'pln_pil3_super_secret_jwt_key_2026_9b8f2a1c4e7d5a';

// Sembunyikan fingerprint server & aktifkan reverse proxy support
app.disable('x-powered-by');
app.set('trust proxy', 1);

// =====================================================================
// SECURITY MIDDLEWARES & HEADERS
// =====================================================================

// 1. CORS Hardening: Batasi hanya origin lokal, IP jaringan KemzKun Server / Tailscale, dan domain Cloudflare
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
  'http://10.10.23.26:5000',
  'http://10.10.23.27:5000',
  'http://100.98.152.11:5000',
  'http://100.98.152.11',
  ...extraOrigins
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('http://10.10.23.') ||
      origin.startsWith('http://100.') ||
      origin === 'https://plncorpu.web.app' ||
      origin === 'https://plncorpu.firebaseapp.com' ||
      /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/i.test(origin) ||
      /^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS_BLOCKED'));
  },
  credentials: true
}));

// CORS Error Handler
app.use((err, req, res, next) => {
  if (err && err.message === 'CORS_BLOCKED') {
    return res.status(403).json({ success: false, error: 'Akses diblokir oleh kebijakan keamanan CORS.' });
  }
  next(err);
});

// 2. Request body parser dengan limit aman
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 3. Security Response Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  next();
});

// 4. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Terlalu banyak permintaan API. Silakan coba kembali beberapa saat lagi.' }
});
app.use('/api', apiLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan masuk sistem. Demi keamanan, silakan coba kembali setelah 15 menit.'
  }
});

// Helper: Parse JSON aman
function safeParseJson(str, defaultVal = {}) {
  if (!str) return defaultVal;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultVal;
  }
}

// Helper: Hitung Cosine Similarity antara dua vektor biometrik di sisi server
function calculateCosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  const len = Math.min(vecA.length, vecB.length);
  if (len === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

// Helper: Sensor seluruh data sensitif (password & hash) dari respon publik
function sanitizeUser(u) {
  if (!u) return u;
  const copy = typeof u === 'object' ? { ...u } : safeParseJson(u);
  delete copy.password;
  delete copy.passwordHash;
  return copy;
}

// =====================================================================
// AUTHENTICATION & AUTHORIZATION GUARDS (JWT RBAC + TOKEN BLACKLIST)
// =====================================================================

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Akses ditolak: Token autentikasi diperlukan.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Sesi telah berakhir atau token tidak valid. Silakan masuk kembali.' });
    }

    if (decoded.type === '2fa_challenge') {
      return res.status(403).json({ success: false, error: 'Otorisasi belum lengkap: Verifikasi biometrik wajah (2FA) diperlukan.' });
    }

    // Periksa apakah token telah dicabut (blacklist) di MariaDB
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const [revoked] = await pool.query('SELECT 1 FROM revoked_tokens WHERE token_hash = ? LIMIT 1', [tokenHash]);
      if (revoked.length > 0) {
        return res.status(401).json({ success: false, error: 'Sesi telah dicabut (keluar sesi). Silakan masuk kembali.' });
      }
    } catch (dbErr) {
      console.warn('[Auth] Gagal memeriksa blacklist token:', dbErr.message);
    }

    req.user = decoded;
    req.rawToken = token;
    next();
  });
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'developer')) {
      return res.status(403).json({ success: false, error: 'Akses ditolak: Operasi ini membutuhkan hak akses Administrator atau Developer.' });
    }
    next();
  });
}

// =====================================================================
// API ROUTES: MariaDB Backend (pln_pil_3)
// =====================================================================

// 1. Health & Status Check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result, NOW() as server_time');
    res.json({
      status: 'ok',
      database: process.env.DB_NAME || 'pln_pil_3',
      host: process.env.DB_HOST || '10.10.23.26',
      server_time: rows[0].server_time,
      db_connected: true,
      security: {
        jwt: 'active',
        rate_limit: 'active',
        password_hashing: 'bcrypt',
        cors_hardened: true
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      db_connected: false
    });
  }
});

// 2. Full Sync (Ambil seluruh state awal aplikasi dalam 1 request cepat dengan data pengguna tersanitasi)
// Memerlukan token autentikasi valid agar data pribadi responden (PII) tidak bocor ke publik
app.get('/api/sync/all', authenticateToken, async (req, res) => {
  try {
    const [respondentsRows] = await pool.query('SELECT data FROM respondents');
    const [evaluationsRows] = await pool.query('SELECT respondentId, data FROM evaluations');
    const [updlsRows] = await pool.query('SELECT data FROM updls');
    const [unitsRows] = await pool.query('SELECT data FROM units');
    const [programsRows] = await pool.query('SELECT data FROM programs');
    const [periodsRows] = await pool.query('SELECT data FROM periods');
    const [formTemplatesRows] = await pool.query('SELECT data FROM form_templates');
    const [usersRows] = await pool.query('SELECT data FROM users');
    const [settingsRows] = await pool.query('SELECT data FROM settings WHERE id = "system_config" LIMIT 1');
    const [bankButirRows] = await pool.query('SELECT data FROM bank_butir');

    const respondents = respondentsRows.map(r => safeParseJson(r.data));
    const evaluations = {};
    evaluationsRows.forEach(r => {
      evaluations[String(r.respondentId)] = safeParseJson(r.data);
    });
    const updls = updlsRows.map(r => safeParseJson(r.data));
    const units = unitsRows.map(r => safeParseJson(r.data));
    const programs = programsRows.map(r => safeParseJson(r.data));
    const periods = periodsRows.map(r => safeParseJson(r.data));
    const form_templates = formTemplatesRows.map(r => safeParseJson(r.data));

    // Sensor password dari seluruh daftar user sebelum dikirim ke klien
    const users = usersRows.map(r => sanitizeUser(safeParseJson(r.data)));
    const settings = settingsRows.length > 0 ? safeParseJson(settingsRows[0].data) : null;
    const bank_butir = bankButirRows.map(r => safeParseJson(r.data));

    res.json({
      success: true,
      data: {
        respondents,
        evaluations,
        updls,
        units,
        programs,
        periods,
        form_templates,
        users,
        settings,
        bank_butir
      }
    });
  } catch (err) {
    console.error('[API /sync/all] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- RESPONDENTS ---
app.get('/api/respondents', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM respondents ORDER BY id ASC');
    res.json(rows.map(r => safeParseJson(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/respondents', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    if (!d || !d.id) return res.status(400).json({ error: 'ID responden wajib diisi.' });

    const id = String(d.id);
    const nip = String(d.nip || '');
    const nama = String(d.nama || '');
    const jabatan = String(d.jabatan || '');
    const unit = String(d.unit || '');
    const unitId = String(d.unitId || '');
    const updlId = String(d.updlId || '');
    const programId = String(d.programId || '');
    const periodId = String(d.periodId || '');
    const telepon = String(d.telepon || '');
    const email = String(d.email || '');
    const itemCount = parseInt(d.itemCount, 10) || 11;
    const atasan = d.atasan ? JSON.stringify(d.atasan) : null;
    const koorInt = d.koordinatorInternal ? JSON.stringify(d.koordinatorInternal) : null;
    const koorEks = d.koordinatorEksternal ? JSON.stringify(d.koordinatorEksternal) : null;
    const fullJson = JSON.stringify(d);

    await pool.query(`
      INSERT INTO respondents (id, nip, nama, jabatan, unit, unitId, updlId, programId, periodId, telepon, email, itemCount, atasan, koordinatorInternal, koordinatorEksternal, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nip=VALUES(nip), nama=VALUES(nama), jabatan=VALUES(jabatan), unit=VALUES(unit),
        unitId=VALUES(unitId), updlId=VALUES(updlId), programId=VALUES(programId), periodId=VALUES(periodId),
        telepon=VALUES(telepon), email=VALUES(email), itemCount=VALUES(itemCount), atasan=VALUES(atasan),
        koordinatorInternal=VALUES(koordinatorInternal), koordinatorEksternal=VALUES(koordinatorEksternal), data=VALUES(data)
    `, [id, nip, nama, jabatan, unit, unitId, updlId, programId, periodId, telepon, email, itemCount, atasan, koorInt, koorEks, fullJson]);

    res.json({ success: true, id, respondent: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/respondents/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM respondents WHERE id = ?', [id]);
    await pool.query('DELETE FROM evaluations WHERE respondentId = ?', [id]);
    res.json({ success: true, message: `Responden #${id} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EVALUATIONS ---
app.get('/api/evaluations', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT respondentId, data FROM evaluations');
    const evals = {};
    rows.forEach(r => {
      evals[String(r.respondentId)] = safeParseJson(r.data);
    });
    res.json(evals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/evaluations', authenticateToken, async (req, res) => {
  try {
    const d = req.body;
    const respondentId = String(d.respondentId || req.query.respondentId || '');
    if (!respondentId) return res.status(400).json({ error: 'respondentId wajib diisi.' });

    // 1. Otorisasi Objek (BOLA / IDOR Protection)
    const currentUser = req.user;
    const isSuperAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer');

    // Ambil data responden terkait dari database untuk validasi otorisasi
    const [respRows] = await pool.query('SELECT data FROM respondents WHERE id = ? LIMIT 1', [respondentId]);
    if (respRows.length === 0) {
      return res.status(404).json({ error: `Responden #${respondentId} tidak ditemukan.` });
    }
    const respondent = safeParseJson(respRows[0].data);

    // Ambil evaluasi eksisting jika sudah ada untuk mempertahankan bagian perspektif lain
    const [existingRows] = await pool.query('SELECT data, peserta, atasan, koordinator, validation, ringkasan FROM evaluations WHERE respondentId = ? LIMIT 1', [respondentId]);
    const existingData = existingRows.length > 0 ? safeParseJson(existingRows[0].data) : {};

    let peserta = d.peserta ? JSON.stringify(d.peserta) : (existingRows[0]?.peserta || null);
    let atasan = d.atasan ? JSON.stringify(d.atasan) : (existingRows[0]?.atasan || null);
    let koordinator = d.koordinator ? JSON.stringify(d.koordinator) : (existingRows[0]?.koordinator || null);
    let validation = d.validation ? JSON.stringify(d.validation) : (existingRows[0]?.validation || null);
    let ringkasan = d.ringkasan ? JSON.stringify(d.ringkasan) : (existingRows[0]?.ringkasan || null);

    if (!isSuperAdmin) {
      const userNip = String(currentUser.nip || currentUser.id || '').trim().toLowerCase();
      const respNip = String(respondent.nip || respondent.id || '').trim().toLowerCase();

      if (currentUser.role === 'peserta') {
        // Peserta HANYA boleh mengisi evaluasi untuk dirinya sendiri
        if (userNip !== respNip) {
          return res.status(403).json({
            error: 'Akses ditolak: Anda hanya berhak mengisi atau mengubah evaluasi atas nama akun Anda sendiri.'
          });
        }
        // Cegah peserta mengubah atau menimpa nilai penilaian atasan & koordinator
        atasan = existingRows[0]?.atasan || null;
        koordinator = existingRows[0]?.koordinator || null;
      } else if (currentUser.role === 'atasan') {
        // Atasan hanya boleh mengisi untuk bawahannya
        const atasanNip = String(respondent.atasan?.nip || respondent.atasanNip || '').trim().toLowerCase();
        if (atasanNip && atasanNip !== userNip) {
          return res.status(403).json({
            error: 'Akses ditolak: Anda tidak terdaftar sebagai atasan penilai untuk responden ini.'
          });
        }
        // Atasan tidak boleh menimpa jawaban self-assessment peserta
        peserta = existingRows[0]?.peserta || null;
      } else if (currentUser.role === 'koordinator') {
        // Koordinator tidak boleh menimpa self-assessment peserta
        peserta = existingRows[0]?.peserta || null;
      }
    }

    const mergedFullJson = JSON.stringify({
      ...existingData,
      ...d,
      respondentId,
      peserta: safeParseJson(peserta, null),
      atasan: safeParseJson(atasan, null),
      koordinator: safeParseJson(koordinator, null),
      validation: safeParseJson(validation, null),
      ringkasan: safeParseJson(ringkasan, null),
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: currentUser.nip || currentUser.id || 'system'
    });

    await pool.query(`
      INSERT INTO evaluations (respondentId, peserta, atasan, koordinator, validation, ringkasan, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        peserta=VALUES(peserta), atasan=VALUES(atasan), koordinator=VALUES(koordinator),
        validation=VALUES(validation), ringkasan=VALUES(ringkasan), data=VALUES(data)
    `, [respondentId, peserta, atasan, koordinator, validation, ringkasan, mergedFullJson]);

    res.json({
      success: true,
      respondentId,
      evaluation: safeParseJson(mergedFullJson)
    });
  } catch (err) {
    console.error('[API /evaluations] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- UPDL ---
app.get('/api/updls', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM updls');
    res.json(rows.map(r => safeParseJson(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/updls', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    const id = String(d.id);
    const kode = String(d.kode || '');
    const nama = String(d.nama || '');
    const wilayah = String(d.wilayah || '');
    const alamat = String(d.alamat || '');
    const telepon = String(d.telepon || '');
    const status = String(d.status || 'AKTIF');
    const fullJson = JSON.stringify(d);

    await pool.query(`
      INSERT INTO updls (id, kode, nama, wilayah, alamat, telepon, status, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        kode=VALUES(kode), nama=VALUES(nama), wilayah=VALUES(wilayah), alamat=VALUES(alamat),
        telepon=VALUES(telepon), status=VALUES(status), data=VALUES(data)
    `, [id, kode, nama, wilayah, alamat, telepon, status, fullJson]);

    res.json({ success: true, updl: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/updls/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM updls WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- UNITS ---
app.get('/api/units', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM units');
    res.json(rows.map(r => safeParseJson(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/units', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    const id = String(d.id);
    const kode = String(d.kode || '');
    const nama = String(d.nama || '');
    const induk = String(d.induk || '');
    const kota = String(d.kota || '');
    const alamat = String(d.alamat || '');
    const updlId = String(d.updlId || '');
    const status = String(d.status || 'AKTIF');
    const atasan = d.atasan ? JSON.stringify(d.atasan) : null;
    const fullJson = JSON.stringify(d);

    await pool.query(`
      INSERT INTO units (id, kode, nama, induk, kota, alamat, updlId, status, atasan, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        kode=VALUES(kode), nama=VALUES(nama), induk=VALUES(induk), kota=VALUES(kota),
        alamat=VALUES(alamat), updlId=VALUES(updlId), status=VALUES(status), atasan=VALUES(atasan), data=VALUES(data)
    `, [id, kode, nama, induk, kota, alamat, updlId, status, atasan, fullJson]);

    res.json({ success: true, unit: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/units/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM units WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROGRAMS ---
app.get('/api/programs', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM programs');
    res.json(rows.map(r => safeParseJson(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/programs', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    const id = String(d.id);
    const kode = String(d.kode || '');
    const nama = String(d.nama || '');
    const deskripsi = String(d.deskripsi || '');
    const kategori = String(d.kategori || '');
    const status = String(d.status || 'AKTIF');
    const updlIds = d.updlIds ? JSON.stringify(d.updlIds) : null;
    const koorEks = d.koordinatorEksternal ? JSON.stringify(d.koordinatorEksternal) : null;
    const fullJson = JSON.stringify(d);

    await pool.query(`
      INSERT INTO programs (id, kode, nama, deskripsi, kategori, status, updlIds, koordinatorEksternal, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        kode=VALUES(kode), nama=VALUES(nama), deskripsi=VALUES(deskripsi), kategori=VALUES(kategori),
        status=VALUES(status), updlIds=VALUES(updlIds), koordinatorEksternal=VALUES(koordinatorEksternal), data=VALUES(data)
    `, [id, kode, nama, deskripsi, kategori, status, updlIds, koorEks, fullJson]);

    res.json({ success: true, program: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/programs/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM programs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PERIODS ---
app.get('/api/periods', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM periods');
    res.json(rows.map(r => safeParseJson(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/periods', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    const id = String(d.id);
    const nama = String(d.nama || '');
    const programIdsArr = Array.isArray(d.programIds) && d.programIds.length > 0
      ? d.programIds
      : (d.programId ? [d.programId] : []);
    const programId = String(programIdsArr[0] || d.programId || '');
    const programIds = JSON.stringify(programIdsArr);
    const tenggatPengisian = String(d.tenggatPengisian || '');
    const status = String(d.status || 'AKTIF');
    const updlIds = d.updlIds ? JSON.stringify(d.updlIds) : null;
    const completionRate = parseFloat(d.completionRate) || 0;
    const deskripsi = String(d.deskripsi || '');
    const fullJson = JSON.stringify({ ...d, programIds: programIdsArr, programId });

    await pool.query(`
      INSERT INTO periods (id, nama, programId, programIds, tenggatPengisian, status, updlIds, completionRate, deskripsi, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nama=VALUES(nama), programId=VALUES(programId), programIds=VALUES(programIds), tenggatPengisian=VALUES(tenggatPengisian),
        status=VALUES(status), updlIds=VALUES(updlIds), completionRate=VALUES(completionRate), deskripsi=VALUES(deskripsi), data=VALUES(data)
    `, [id, nama, programId, programIds, tenggatPengisian, status, updlIds, completionRate, deskripsi, fullJson]);

    res.json({ success: true, period: { ...d, programIds: programIdsArr, programId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/periods/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM periods WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FORM TEMPLATES ---
app.get('/api/form_templates', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM form_templates');
    res.json(rows.map(r => safeParseJson(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/form_templates', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    const id = String(d.id);
    const programId = String(d.programId || '');
    const judul = String(d.judul || '');
    const petunjuk = String(d.petunjuk || '');
    const items = d.items ? JSON.stringify(d.items) : null;
    const fullJson = JSON.stringify(d);

    await pool.query(`
      INSERT INTO form_templates (id, programId, judul, petunjuk, items, data)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        programId=VALUES(programId), judul=VALUES(judul), petunjuk=VALUES(petunjuk),
        items=VALUES(items), data=VALUES(data)
    `, [id, programId, judul, petunjuk, items, fullJson]);

    res.json({ success: true, template: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/form_templates/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM form_templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USERS ---
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM users');
    // Selalu sensor password sebelum dikirim ke klien
    res.json(rows.map(r => sanitizeUser(safeParseJson(r.data))));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    const id = String(d.id);
    const nip = String(d.nip || id);
    const nama = String(d.nama || '');
    const email = String(d.email || '');
    const role = String(d.role || 'peserta');
    const jabatan = String(d.jabatan || '');
    const unitId = String(d.unitId || '');
    const unitName = String(d.unitName || '');
    const updlId = String(d.updlId || '');
    const status = String(d.status || 'AKTIF');
    const isAdminPusat = d.isAdminPusat ? 1 : 0;
    const avatar = String(d.avatar || '');

    // Hashing password dengan Bcrypt jika disediakan atau buat default yang ter-hash
    let passwordHash;
    if (d.password) {
      if (d.password.startsWith('$2a$') || d.password.startsWith('$2b$')) {
        passwordHash = d.password;
      } else {
        passwordHash = await bcrypt.hash(d.password, 10);
      }
    } else {
      // Pertahankan hash lama jika user sudah ada di database
      const [existing] = await pool.query('SELECT password FROM users WHERE id = ?', [id]);
      if (existing.length > 0 && existing[0].password) {
        passwordHash = existing[0].password;
      } else {
        passwordHash = await bcrypt.hash(role === 'peserta' ? 'pln123' : '1234', 10);
      }
    }

    // Bersihkan password mentah dari objek JSON sebelum disimpan
    const sanitizedObj = sanitizeUser(d);
    const fullJson = JSON.stringify(sanitizedObj);

    await pool.query(`
      INSERT INTO users (id, nip, nama, email, password, role, jabatan, unitId, unitName, updlId, status, isAdminPusat, avatar, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nama=VALUES(nama), email=VALUES(email), password=VALUES(password), role=VALUES(role),
        jabatan=VALUES(jabatan), unitId=VALUES(unitId), unitName=VALUES(unitName), updlId=VALUES(updlId),
        status=VALUES(status), isAdminPusat=VALUES(isAdminPusat), avatar=VALUES(avatar), data=VALUES(data)
    `, [id, nip, nama, email, passwordHash, role, jabatan, unitId, unitName, updlId, status, isAdminPusat, avatar, fullJson]);

    res.json({ success: true, user: sanitizedObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM users WHERE id = ? OR nip = ?', [id, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUTH LOGIN (RATE LIMITED & BCRYPT VERIFIED & JWT ISSUER) ---
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'NIP/Username dan kata sandi wajib diisi.' });
    }

    const cleanUsername = String(username).trim();
    const [rows] = await pool.query(
      'SELECT data, password FROM users WHERE LOWER(nip) = LOWER(?) OR LOWER(id) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1',
      [cleanUsername, cleanUsername, cleanUsername]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Kredensial atau kata sandi tidak valid.' });
    }

    const user = safeParseJson(rows[0].data);
    const storedPwd = rows[0].password || user.password;

    let isPasswordValid = false;
    if (storedPwd && (storedPwd.startsWith('$2a$') || storedPwd.startsWith('$2b$'))) {
      isPasswordValid = await bcrypt.compare(password, storedPwd);
    } else if (storedPwd) {
      // Migrasi aman dari plaintext lama jika ada
      isPasswordValid = (password === storedPwd);
      if (isPasswordValid) {
        // Otomatis upgrade ke hash Bcrypt di MariaDB
        const newHash = await bcrypt.hash(password, 10);
        delete user.password;
        await pool.query('UPDATE users SET password = ?, data = ? WHERE id = ?', [newHash, JSON.stringify(user), user.id]).catch(() => { });
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Kredensial atau kata sandi tidak valid.' });
    }

    // Cek apakah akun Admin / Dev ini memiliki enrollment biometrik (WebAuthn atau Webcam AES-256)
    const isAdminOrDev = (user.role === 'admin' || user.role === 'developer');
    if (isAdminOrDev) {
      const uidLower = String(user.id).toLowerCase();
      const [rlRows] = await pool.query('SELECT locked_until FROM auth_rate_limits WHERE identifier = ? LIMIT 1', [uidLower]).catch(() => [[]]);
      if (rlRows && rlRows.length > 0 && rlRows[0].locked_until && new Date(rlRows[0].locked_until) > new Date()) {
        return res.status(423).json({
          success: false,
          locked: true,
          lockedUntil: new Date(rlRows[0].locked_until).toISOString(),
          requireOtpFallback: true,
          message: 'Verifikasi biometrik terkunci sementara 15 menit. Silakan gunakan jalur Password + OTP.'
        });
      }

      const [waRows] = await pool.query('SELECT id, attachmentType FROM webauthn_credentials WHERE LOWER(userId) = ?', [uidLower]).catch(() => [[]]);
      const [bioRows] = await pool.query(
        'SELECT status, featureVector, encrypted_embedding FROM admin_biometrics WHERE (LOWER(userId) = LOWER(?) OR LOWER(username) = LOWER(?)) AND status = "AKTIF" LIMIT 1',
        [user.id, user.nip || user.id]
      );
      const hasFace = bioRows.length > 0 && Boolean(bioRows[0].encrypted_embedding || bioRows[0].featureVector);
      const hasWebAuthn = waRows && waRows.length > 0;

      if (hasFace || hasWebAuthn) {
        const challengeToken = jwt.sign(
          {
            id: user.id,
            nip: user.nip || user.id,
            role: user.role,
            nama: user.nama,
            type: '2fa_challenge'
          },
          JWT_SECRET,
          { expiresIn: '10m' }
        );
        const safeUser = sanitizeUser(user);
        return res.json({
          success: true,
          requireFaceVerification: hasFace && !hasWebAuthn,
          requireBiometricVerification: true,
          hasWebAuthn,
          hasFace,
          challengeToken,
          user: safeUser
        });
      }
    }

    // Terbitkan JWT Token bertanda tangan HMAC-SHA256 untuk akses penuh (7 hari)
    const token = jwt.sign(
      {
        id: user.id,
        nip: user.nip,
        role: user.role,
        nama: user.nama,
        isAdminPusat: user.isAdminPusat || false
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = sanitizeUser(user);
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('[API /auth/login] Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi gangguan sistem saat otentikasi.' });
  }
});

// Mount Enterprise Hybrid Adaptive Authentication Routes (WebAuthn, AES-256 Face, Liveness 15s, RateLimit, OTP)
mountEnterpriseAuthRoutes(app, {
  pool,
  JWT_SECRET,
  loginLimiter,
  authenticateToken,
  requireAdmin,
  calculateCosineSimilarity
});

// Verifikasi Tantangan Biometrik 2FA Wajah / Kode Pemulihan (Mendukung AES-256 Encrypted Embedding)
app.post('/api/auth/verify-face', loginLimiter, async (req, res) => {
  try {
    const { challengeToken, featureVector, recoveryCode } = req.body;
    if (!challengeToken) {
      return res.status(400).json({ success: false, message: 'Token tantangan 2FA wajib disertakan.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(challengeToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Sesi verifikasi biometrik kedaluwarsa atau tidak valid.' });
    }

    if (decoded.type !== '2fa_challenge') {
      return res.status(400).json({ success: false, message: 'Token tidak valid untuk otentikasi 2FA.' });
    }

    const [uRows] = await pool.query('SELECT data FROM users WHERE id = ? OR nip = ? LIMIT 1', [decoded.id, decoded.nip]);
    if (uRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    const user = safeParseJson(uRows[0].data);

    let verified = false;
    let matchSimilarity = 0;

    const [bioRows] = await pool.query(
      'SELECT status, featureVector, encrypted_embedding, algorithm, salt, recoveryCodeHash FROM admin_biometrics WHERE (LOWER(userId) = LOWER(?) OR LOWER(username) = LOWER(?)) AND status = "AKTIF" LIMIT 1',
      [user.id, user.nip || user.id]
    );

    if (bioRows.length === 0) {
      return res.status(403).json({ success: false, message: 'Data pendaftaran biometrik tidak ditemukan atau tidak aktif untuk akun ini.' });
    }

    if (Array.isArray(featureVector) && featureVector.length > 0) {
      let storedVector = null;
      if (bioRows[0].encrypted_embedding) {
        storedVector = decryptBiometricVector(bioRows[0].encrypted_embedding, JWT_SECRET);
      } else if (bioRows[0].featureVector) {
        storedVector = safeParseJson(bioRows[0].featureVector, []);
      }

      if (Array.isArray(storedVector) && storedVector.length > 0) {
        matchSimilarity = calculateCosineSimilarity(storedVector, featureVector);
        const requiredThreshold = (bioRows[0].algorithm && (bioRows[0].algorithm.includes('v2') || bioRows[0].algorithm.includes('v3'))) ? 0.62 : 0.52;
        if (matchSimilarity >= requiredThreshold) {
          verified = true;
        }
      }
    } else if (recoveryCode) {
      const cleanCode = String(recoveryCode).trim().toUpperCase();
      const { salt, recoveryCodeHash } = bioRows[0];
      const hash = crypto.createHash('sha256').update(cleanCode + (salt || '')).digest('hex');
      if (hash === recoveryCodeHash) {
        verified = true;
      }
    }

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Verifikasi biometrik wajah atau kode pemulihan tidak valid atau tidak cocok.',
        similarity: parseFloat(matchSimilarity.toFixed(4))
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        nip: user.nip,
        role: user.role,
        nama: user.nama,
        isAdminPusat: user.isAdminPusat || false
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user: sanitizeUser(user), similarity: matchSimilarity });
  } catch (err) {
    console.error('[API /auth/verify-face] Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi gangguan verifikasi biometrik.' });
  }
});

// Logout: Revokasi Token ke Tabel revoked_tokens
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    if (req.rawToken) {
      const tokenHash = crypto.createHash('sha256').update(req.rawToken).digest('hex');
      const expSeconds = req.user.exp ? req.user.exp : Math.floor(Date.now() / 1000) + 7 * 86400;
      const expiresAt = new Date(expSeconds * 1000);
      await pool.query(
        'INSERT IGNORE INTO revoked_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
        [tokenHash, req.user.id, expiresAt]
      ).catch(() => { });
    }
    res.json({ success: true, message: 'Sesi berhasil diakhiri.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function sanitizeBiometricMetadata(row) {
  const parsed = safeParseJson(row.data, {});
  return {
    userId: row.userId || parsed.userId,
    username: row.username || parsed.username,
    nama: row.nama || parsed.nama,
    role: row.role || parsed.role,
    status: row.status || parsed.status || 'AKTIF',
    algorithm: row.algorithm || parsed.algorithm || 'AES-256-GCM-L3-v3',
    qualityScore: row.qualityScore || parsed.qualityScore || 95,
    pdpConsent: Boolean(row.pdp_consent || parsed.pdpConsent),
    pdpConsentAt: row.pdp_consent_at || parsed.pdpConsentAt || null,
    enrolledAt: row.enrolledAt || parsed.enrolledAt || '',
    updatedAt: row.updatedAt || parsed.updatedAt || '',
    enrolled: true
  };
}

// --- ADMIN BIOMETRICS (ZERO VECTOR EXPOSURE) ---
app.get('/api/admin_biometrics', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT userId, username, nama, role, status, algorithm, qualityScore, pdp_consent, pdp_consent_at, enrolledAt, updatedAt, data FROM admin_biometrics'
    );
    res.json(rows.map(sanitizeBiometricMetadata));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin_biometrics/:userId', requireAdmin, async (req, res) => {
  try {
    const uid = req.params.userId;
    const [rows] = await pool.query(
      'SELECT userId, username, nama, role, status, algorithm, qualityScore, pdp_consent, pdp_consent_at, enrolledAt, updatedAt, data FROM admin_biometrics WHERE LOWER(userId) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1',
      [uid, uid]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Biometrik tidak ditemukan.' });
    res.json(sanitizeBiometricMetadata(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin_biometrics', requireAdmin, async (req, res) => {
  try {
    const d = req.body || {};
    if (d.pdpConsent !== true) {
      return res.status(400).json({ error: 'Persetujuan UU PDP (pdpConsent) wajib disetujui.' });
    }
    const userId = String(d.userId || d.username || req.user.id);
    const username = String(d.username || userId);
    const nama = String(d.nama || '');
    const role = String(d.role || '');
    const status = String(d.status || 'AKTIF');
    const algorithm = 'AES-256-GCM-L3-v3';
    const encryptedEmbedding = Array.isArray(d.featureVector) ? encryptBiometricVector(d.featureVector, JWT_SECRET) : null;
    const qualityScore = parseFloat(d.qualityScore) || 0;
    const salt = String(d.salt || crypto.randomBytes(16).toString('hex'));
    const recoveryCodeHash = String(d.recoveryCodeHash || '');
    const pdpConsentAt = String(d.pdpConsentAt || new Date().toISOString());
    const enrolledAt = String(d.enrolledAt || pdpConsentAt);
    const updatedAt = new Date().toISOString();

    const safeMeta = { userId, username, nama, role, status, algorithm, qualityScore, pdpConsent: true, pdpConsentAt, enrolledAt, updatedAt };
    const fullJson = JSON.stringify(safeMeta);

    await pool.query(`
      INSERT INTO admin_biometrics (userId, username, nama, role, status, algorithm, featureVector, encrypted_embedding, qualityScore, salt, recoveryCodeHash, pdp_consent, pdp_consent_at, pdp_consent_ip, enrolledAt, updatedAt, data)
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        username=VALUES(username), nama=VALUES(nama), role=VALUES(role), status=VALUES(status),
        algorithm=VALUES(algorithm), featureVector=NULL, encrypted_embedding=VALUES(encrypted_embedding), qualityScore=VALUES(qualityScore),
        salt=VALUES(salt), recoveryCodeHash=VALUES(recoveryCodeHash), pdp_consent=1, pdp_consent_at=VALUES(pdp_consent_at),
        pdp_consent_ip=VALUES(pdp_consent_ip), enrolledAt=VALUES(enrolledAt), updatedAt=VALUES(updatedAt), data=VALUES(data)
    `, [userId, username, nama, role, status, algorithm, encryptedEmbedding, qualityScore, salt, recoveryCodeHash, pdpConsentAt, req.ip || '', enrolledAt, updatedAt, fullJson]);

    res.json({ success: true, biometrics: safeMeta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin_biometrics/:userId', requireAdmin, async (req, res) => {
  try {
    const uid = req.params.userId;
    await pool.query('DELETE FROM admin_biometrics WHERE LOWER(userId) = LOWER(?) OR LOWER(username) = LOWER(?)', [uid, uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUDIT LOGS ---
app.get('/api/audit_logs', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '200', 10);
    const [rows] = await pool.query('SELECT data FROM audit_logs ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(rows.map(r => safeParseJson(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit_logs', authenticateToken, async (req, res) => {
  try {
    const d = req.body;
    const id = String(d.id || `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
    const action = String(d.action || 'ACTIVITY');
    const target = String(d.target || '');
    const details = String(d.details || '');
    // Pakai identitas terverifikasi dari token JWT, cegah spoofing
    const user = req.user.nama || req.user.nip || String(d.user || 'Unknown');
    const role = req.user.role || String(d.role || 'user');
    const timestamp = String(d.timestamp || new Date().toISOString());
    const fullJson = JSON.stringify({ ...d, id, action, target, details, user, role, timestamp });

    await pool.query(`
      INSERT INTO audit_logs (id, action, target, details, user, role, timestamp, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        action=VALUES(action), target=VALUES(target), details=VALUES(details),
        user=VALUES(user), role=VALUES(role), timestamp=VALUES(timestamp), data=VALUES(data)
    `, [id, action, target, details, user, role, timestamp, fullJson]);

    res.json({ success: true, log: { id, action, target, details, user, role, timestamp } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BANK BUTIR ---
app.get('/api/bank_butir', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM bank_butir');
    res.json(rows.map(r => safeParseJson(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bank_butir', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    const id = String(d.id);
    const kompetensi = String(d.kompetensi || '');
    const pertanyaan = String(d.pertanyaan || '');
    const skala = d.skala ? JSON.stringify(d.skala) : null;
    const fullJson = JSON.stringify(d);

    await pool.query(`
      INSERT INTO bank_butir (id, kompetensi, pertanyaan, skala, data)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        kompetensi=VALUES(kompetensi), pertanyaan=VALUES(pertanyaan),
        skala=VALUES(skala), data=VALUES(data)
    `, [id, kompetensi, pertanyaan, skala, fullJson]);

    res.json({ success: true, bankButir: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bank_butir/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bank_butir WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM settings WHERE id = "system_config" LIMIT 1');
    if (rows.length === 0) return res.json({});
    res.json(safeParseJson(rows[0].data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', requireAdmin, async (req, res) => {
  try {
    const d = req.body;
    const id = 'system_config';
    const fullJson = JSON.stringify(d);

    await pool.query(`
      INSERT INTO settings (id, data)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE data=VALUES(data)
    `, [id, fullJson]);

    res.json({ success: true, settings: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// STATIC ASSETS & SPA ROUTING (HARDENED SECURITY)
// =====================================================================

// 1. Strict Security Guard: Blokir seluruh akses langsung ke file konfigurasi & kode server
const SENSITIVE_EXTENSIONS = /\.(env|env\..+|json|sql|lock|md|rules|xlsx|bak|log|yml|yaml|ts|gitignore|gitattributes|assetsignore)$/i;
const ALLOWED_ROOT_FILES = new Set([
  'favicon.ico', 'favicon.png', 'favicon-16x16.png', 'favicon-32x32.png',
  'favicon-192x192.png', 'apple-touch-icon.png', 'logo.png', 'index.html', 'robots.txt'
]);

app.use((req, res, next) => {
  // A. Tolak akses ke file tersembunyi (dotfiles: .env, .git, .firebaserc, dll)
  if (req.path.includes('/.') || req.path.startsWith('.')) {
    return res.status(404).type('text/plain').send('Not found');
  }

  // B. Tolak akses ke root server script (misal: /server.js, /db.js, /migrate_to_new_server.js)
  if (req.path.endsWith('.js') && !req.path.startsWith('/js/')) {
    return res.status(404).type('text/plain').send('Not found');
  }

  // C. Jika request mengarah ke file root langsung (/package.json, /lengkap.md, dll)
  const isDirectRootFile = /^\/[^/]+$/.test(req.path);
  if (isDirectRootFile) {
    const filename = req.path.replace('/', '');
    if (!ALLOWED_ROOT_FILES.has(filename.toLowerCase()) && SENSITIVE_EXTENSIONS.test(filename)) {
      return res.status(404).type('text/plain').send('Not found');
    }
  }

  next();
});

// 2. Layani folder statis resmi saja (/css, /js, /images, /fonts)
app.use('/css', express.static(path.join(PUBLIC_DIR, 'css'), { dotfiles: 'deny' }));
app.use('/js', express.static(path.join(PUBLIC_DIR, 'js'), { dotfiles: 'deny' }));
app.use('/images', express.static(path.join(PUBLIC_DIR, 'images'), { dotfiles: 'deny' }));
if (fs.existsSync(path.join(PUBLIC_DIR, 'fonts'))) {
  app.use('/fonts', express.static(path.join(PUBLIC_DIR, 'fonts'), { dotfiles: 'deny' }));
}

// 3. Smart Static File Resolver untuk rute bersarang SPA (misal /plncorpuadmin/css/style.css -> /css/style.css)
app.use((req, res, next) => {
  // Cek apakah URL merujuk ke folder statis bersarang
  const match = req.path.match(/\/(css|js|images|fonts)\/(.+)$/i);
  if (match) {
    const relPath = path.posix.join(match[1], match[2]);
    const fullPath = path.join(PUBLIC_DIR, match[1], match[2]);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return res.sendFile(relPath, { root: PUBLIC_DIR });
    }
  }

  // Cek jika URL berakhiran file aset publik root (favicon.ico, logo.png, dll)
  const extMatch = req.path.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/i);
  if (extMatch) {
    const filename = path.basename(req.path);
    if (ALLOWED_ROOT_FILES.has(filename.toLowerCase())) {
      const fullPath = path.join(PUBLIC_DIR, filename);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return res.sendFile(filename, { root: PUBLIC_DIR });
      }
    }
    // Wajib 404 plain text, JANGAN kirim index.html agar browser tidak menolak CSS/JS karena MIME type mismatch
    return res.status(404).type('text/plain').send('Asset not found');
  }

  next();
});

// 4. SPA Fallback: seluruh rute yang bukan /api dan bukan file statis dikembalikan ke index.html
app.use((req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) {
      res.status(500).send('Internal Server Error: Gagal membaca index.html');
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.send(html);
  });
});

// =====================================================================
// SERVER INITIALIZATION
// =====================================================================

async function start() {
  console.log('\n======================================================');
  console.log('⚡ PLN Corporate University - Sistem Evaluasi Level 3');
  console.log(`🔌 MariaDB KemzKun Server: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log('🛡️ Keamanan: JWT Auth, Bcrypt, Rate Limiter & RBAC Aktif');
  console.log('======================================================');

  await testConnection();
  await initSchema();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📡 REST API Endpoint: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ Database Terhubung: MariaDB [${process.env.DB_NAME || 'pln_pil_3'}]\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = PORT + 1;
      console.log(`⚠️  Port ${PORT} sedang dipakai, otomatis beralih ke port ${nextPort}...`);
      app.listen(nextPort, () => {
        console.log(`🚀 Server berjalan di http://localhost:${nextPort}\n`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
