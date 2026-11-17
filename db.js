/**
 * MariaDB Database Connection & Utility Module
 * Server: KemzKun Server (Database: pln_pil_3)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const config = {
  host: process.env.DB_HOST || '10.10.23.26',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'kemal',
  password: process.env.DB_PASSWORD || 'test123',
  database: process.env.DB_NAME || 'pln_pil_3',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

console.log(`[MariaDB] Menghubungkan ke ${config.user}@${config.host}:${config.port}/${config.database}...`);

const pool = mysql.createPool(config);

/**
 * Helper idempotent: tambahkan kolom baru ke tabel existing jika belum ada
 */
async function ensureColumn(conn, tableName, colName, colDefinition) {
  const [cols] = await conn.query(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
    [config.database, tableName, colName]
  );
  if (cols.length === 0) {
    await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${colDefinition}`);
  }
}

/**
 * Inisialisasi skema tabel jika belum ada & jalankan migrasi kolom
 */
async function initSchema() {
  try {
    const schemaPath = path.join(__dirname, 'scripts', 'schema_mariadb.sql');
    if (fs.existsSync(schemaPath)) {
      let sql = fs.readFileSync(schemaPath, 'utf8');
      // Bersihkan komentar baris SQL
      sql = sql.replace(/--.*$/gm, '');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const conn = await pool.getConnection();
      try {
        for (const stmt of statements) {
          if (stmt.toLowerCase().startsWith('use ') || stmt.toLowerCase().startsWith('create database')) {
            continue;
          }
          await conn.query(stmt);
        }

        // Migrasi aman kolom baru pada admin_biometrics untuk DB yang sudah ada
        await ensureColumn(conn, 'admin_biometrics', 'encrypted_embedding', 'LONGTEXT NULL');
        await ensureColumn(conn, 'admin_biometrics', 'pdp_consent', 'TINYINT(1) DEFAULT 0');
        await ensureColumn(conn, 'admin_biometrics', 'pdp_consent_at', 'VARCHAR(64) NULL');
        await ensureColumn(conn, 'admin_biometrics', 'pdp_consent_ip', 'VARCHAR(64) NULL');
        await ensureColumn(conn, 'admin_biometrics', 'preferred_method', "VARCHAR(32) DEFAULT 'auto'");

        // Pastikan akun Admin Pusat & Developer tersedia di MariaDB (INSERT IGNORE)
        const devHash = await bcrypt.hash('1234', 10);
        const admHash = await bcrypt.hash('adminpusat123', 10);
        const devObj = {
          id: 'dev-kmlafdz',
          nip: 'kmlafdz',
          username: 'kmlafdz',
          nama: 'Developer Superadmin (kmlafdz)',
          email: 'kmlafdz@pln.co.id',
          role: 'developer',
          jabatan: 'System Developer & Superadmin',
          unitId: 'pusat',
          unitName: 'PLN Corporate University',
          status: 'AKTIF',
          isAdminPusat: true
        };
        const admObj = {
          id: 'adm-pusat',
          nip: 'adminpusat',
          username: 'adminpusat',
          nama: 'Administrator Pusat PLN Corpu',
          email: 'adminpusat@pln.co.id',
          role: 'admin',
          jabatan: 'Super Admin Pengendali Evaluasi Nasional',
          unitId: 'pusat',
          unitName: 'PLN Corporate University (Pusat)',
          status: 'AKTIF',
          isAdminPusat: true
        };

        await conn.query(
          `INSERT IGNORE INTO users (id, nip, nama, email, password, role, jabatan, unitId, unitName, updlId, status, isAdminPusat, avatar, data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 1, '', ?)`,
          [devObj.id, devObj.nip, devObj.nama, devObj.email, devHash, devObj.role, devObj.jabatan, devObj.unitId, devObj.unitName, devObj.status, JSON.stringify(devObj)]
        );
        await conn.query(
          `INSERT IGNORE INTO users (id, nip, nama, email, password, role, jabatan, unitId, unitName, updlId, status, isAdminPusat, avatar, data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 1, '', ?)`,
          [admObj.id, admObj.nip, admObj.nama, admObj.email, admHash, admObj.role, admObj.jabatan, admObj.unitId, admObj.unitName, admObj.status, JSON.stringify(admObj)]
        );

        console.log('✅ [MariaDB] Skema & migrasi database berhasil diverifikasi/diinisialisasi.');
      } finally {
        conn.release();
      }
    }
  } catch (err) {
    console.error('❌ [MariaDB] Gagal inisialisasi skema:', err.message);
  }
}

/**
 * Uji koneksi database
 */
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('⚡ [MariaDB KemzKun Server] Terhubung dengan sukses! Result:', rows[0].result);
    return true;
  } catch (err) {
    console.error('❌ [MariaDB KemzKun Server] Gagal koneksi:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  initSchema
};
