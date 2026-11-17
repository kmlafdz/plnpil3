/**
 * Test sinkronisasi 2 arah:
 * 1. Responden baru (dari impor excel / manual) otomatis dibuatkan akun User
 * 2. User ber-role peserta otomatis muncul di penugasan responden
 * 3. Menjelaskan dan memvalidasi kondisi Muhammad Kemal
 */
const assert = require('assert');

// Mock storage & environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.CustomEvent = class CustomEvent { constructor(name, opts) { this.name = name; this.opts = opts; } };
global.window = {
  localStorage: global.localStorage,
  dispatchEvent: () => {},
  addEventListener: () => {},
  App: {
    showToast: (m, t) => console.log(`[Toast ${t}]: ${m}`),
    showModal: () => {}
  }
};

require('../js/data.js');
require('../js/store.js');

const store = window.appStore;

console.log('=== TEST 1: Impor Excel / Tambah Responden Otomatis Buat Akun User ===');
const nipExcel = '8822334455';
const namaExcel = 'Ahmad Santoso Excel';

const respBaru = store.addRespondent({
  nip: nipExcel,
  nama: namaExcel,
  jabatan: 'Junior Engineer Distribusi',
  unit: 'PLN UID Sumsel',
  updlId: 'updl-plb',
  programId: 'prog-pil-susut',
  periodId: 'period-2026-1',
  modules: ['A', 'B'],
  password: 'pln123'
});

assert(respBaru && respBaru.id, 'Responden harus berhasil dibuat');

// Verifikasi akun user di store.users
const createdUser = store.getUsers().find(u => u.nip === nipExcel);
assert(createdUser, 'Akun User di Master Users HARUS otomatis terbuat untuk peserta impor');
assert.strictEqual(createdUser.nama, namaExcel);
assert.strictEqual(createdUser.role, 'peserta');
assert.strictEqual(createdUser.password, 'pln123');
assert.strictEqual(createdUser.status, 'AKTIF');
assert.strictEqual(createdUser.respondentId, respBaru.id);
console.log('✅ [PASS] User otomatis terbuat dengan role peserta, password pln123, dan terhubung ke respondentId');

console.log('\n=== TEST 2: User Peserta Baru "Muhammad Kemal" Otomatis Muncul di Penugasan ===');
const nipKemal = '9519001MK';
const namaKemal = 'Muhammad Kemal';

// Buat user di Master Users dengan role 'peserta'
const userKemal = store.addUser({
  nip: nipKemal,
  nama: namaKemal,
  jabatan: 'Officer Sistem Informasi',
  unitName: 'PLN UP3 Metro',
  updlId: 'updl-plb',
  role: 'peserta',
  password: 'pln123'
});

assert(userKemal, 'User Kemal berhasil dibuat');

// Verifikasi otomatis tercatat di penugasan (respondents)
const respKemal = store.getRespondents().find(r => r.nip === nipKemal);
assert(respKemal, 'Data Muhammad Kemal HARUS otomatis ada di matriks penugasan respondents');
assert.strictEqual(respKemal.nama, namaKemal);
assert.strictEqual(respKemal.unit, 'PLN UP3 Metro');
console.log('✅ [PASS] Data Muhammad Kemal dengan role peserta otomatis tersinkronisasi dan tampil di matriks penugasan');

console.log('\n=== TEST 3: User dengan Role "developer" atau "admin" Tidak Tercampur ke Penugasan ===');
// Developer utama kmlafdz
const devUser = store.getUsers().find(u => (u.nip || '').toLowerCase() === 'kmlafdz');
assert(devUser, 'Developer kmlafdz harus ada');
assert.strictEqual(devUser.role, 'developer');

// Cek apakah akun developer masuk ke respondents peserta evaluasi?
const devInRespondents = store.getRespondents().find(r => (r.nip || '').toLowerCase() === 'kmlafdz');
assert(!devInRespondents, 'Akun Developer kmlafdz BUKAN peserta evaluasi sehingga TIDAK boleh otomatis masuk ke daftar penugasan peserta');
console.log('✅ [PASS] Akun Developer / Administrator berposisi sebagai pengelola sistem dan tidak tercampur ke penugasan peserta');

console.log('\n=== TEST 4: Update Responden Otomatis Memperbarui Akun User ===');
store.updateRespondent(respBaru.id, {
  nama: 'Ahmad Santoso (Promosi Supervisor)',
  jabatan: 'Supervisor Pemeliharaan',
  unit: 'PLN ULP Rivai'
});

const updatedUser = store.getUsers().find(u => u.nip === nipExcel);
assert.strictEqual(updatedUser.nama, 'Ahmad Santoso (Promosi Supervisor)');
assert.strictEqual(updatedUser.jabatan, 'Supervisor Pemeliharaan');
assert.strictEqual(updatedUser.unitName, 'PLN ULP Rivai');
console.log('✅ [PASS] Perubahan data penugasan otomatis tersinkron ke akun user');

console.log('\n========================================');
console.log('SEMUA PENGUJIAN OTOMATIS BERHASIL (100% PASS)!');
console.log('========================================');
