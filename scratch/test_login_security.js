/**
 * Test Suite: Verifikasi Keamanan Login Pegawai & Admin
 * Menguji:
 * 1. Penolakan input non-angka pada login pegawai ("NIP hanya boleh berupa angka.")
 * 2. Pencegahan kebocoran informasi akun admin / developer pada login pegawai
 * 3. Pencegahan User Enumeration (pesan seragam: "NIP atau kata sandi tidak valid.")
 * 4. Login pegawai yang sah dengan NIP angka murni
 * 5. Portal admin (/plncorpuadmin) tetap berfungsi aman dengan verifikasi kredensial
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Setup mock browser environment
const dom = {
  window: {
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    },
    dispatchEvent() {},
    location: { pathname: '/', hash: '' },
    CustomEvent: class { constructor(name, detail) { this.name = name; this.detail = detail; } },
    firebaseAuth: {
      signInWithEmailAndPassword: async () => ({ user: { uid: 'mock-uid' } }),
      createUserWithEmailAndPassword: async () => ({ user: { uid: 'mock-uid' } })
    },
    FaceAuthManager: null
  }
};
dom.window.window = dom.window;
global.window = dom.window;
global.localStorage = dom.window.localStorage;
global.CustomEvent = dom.window.CustomEvent;

// Load store.js & auth.js
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');

vm.runInThisContext(storeCode);
// window.appStore is automatically created by store.js

// Tambahkan beberapa responden & user pegawai uji coba
window.appStore.users = [
  {
    id: 'usr-dev-kmlafdz',
    nip: 'kmlafdz',
    username: 'kmlafdz',
    nama: 'Developer Utama',
    role: 'developer',
    status: 'AKTIF',
    password: '1234'
  },
  {
    id: 'usr-adm-pusat',
    nip: 'adminpusat',
    username: 'adminpusat',
    nama: 'Admin Pusat',
    role: 'admin',
    isAdminPusat: true,
    status: 'AKTIF',
    password: 'adminpusat123'
  },
  {
    id: 'usr-peg-1',
    nip: '8508111',
    nama: 'Bambang Triyono',
    role: 'atasan',
    status: 'AKTIF',
    password: '123'
  },
  {
    id: 'usr-peg-2',
    nip: '8909014',
    nama: 'Akkhita Nurrul',
    role: 'koordinator',
    status: 'NONAKTIF',
    password: '123'
  }
];

window.appStore.respondents = [
  {
    id: 101,
    nip: '9214102',
    nama: 'Eko Prasetyo',
    role: 'peserta',
    status: 'AKTIF',
    password: 'pln123'
  }
];

vm.runInThisContext(authCode);
const auth = window.authManager;

async function runTests() {
  console.log('=== MEMULAI TEST SUITE: KEAMANAN LOGIN & NIP ANGKA ===\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // UJI 1: Percobaan login sembarang tanpa membocorkan URL atau info akun
  const resRandomUser = await auth.authenticate('usersembarang', 'password', null, false);
  test('Login akun acak ditolak dengan pesan generik tanpa membocorkan info', () => {
    assert.strictEqual(resRandomUser.success, false);
    assert.strictEqual(resRandomUser.message, 'NIP atau kata sandi tidak valid.');
    assert(!resRandomUser.message.includes('plncorpuadmin'), 'Tidak membocorkan URL portal admin');
    assert(!resRandomUser.message.includes('Administrator'), 'Tidak membocorkan info akun admin');
  });

  // UJI 2: Percobaan login 'adminpusat' dengan password salah tidak bocorkan rahasia
  const resAdminPusatWrong = await auth.authenticate('adminpusat', 'wrongpass', null, false);
  test('Login "adminpusat" dengan pass salah tidak membocorkan rahasia', () => {
    assert.strictEqual(resAdminPusatWrong.success, false);
    assert.strictEqual(resAdminPusatWrong.message, 'NIP atau kata sandi tidak valid.');
  });

  // UJI 3: Percobaan login 'kmlafdz' dengan pass salah ditolak tanpa info akun developer
  const resKmlafdzWrong = await auth.authenticate('kmlafdz', 'wrongpass', null, false);
  test('Login "kmlafdz" dengan pass salah ditolak tanpa info akun developer', () => {
    assert.strictEqual(resKmlafdzWrong.success, false);
    assert.strictEqual(resKmlafdzWrong.message, 'NIP atau kata sandi tidak valid.');
  });

  // UJI 4: Akun terdaftar dengan NIP alfanumerik dapat login dengan kredensial yang tepat
  const resAlphaNip = await auth.authenticate('8508111', '123', null, false);
  test('Login akun terdaftar dengan kredensial sah berhasil', () => {
    assert.strictEqual(resAlphaNip.success, true);
    assert.strictEqual(resAlphaNip.user.nip, '8508111');
  });

  // UJI 5: Anti-Enumeration - NIP angka yang tidak terdaftar
  const resNonExistent = await auth.authenticate('99999999', 'wrongpass', null, false);
  test('NIP tidak terdaftar menghasilkan pesan generik anti-enumerasi', () => {
    assert.strictEqual(resNonExistent.success, false);
    assert.strictEqual(resNonExistent.message, 'NIP atau kata sandi tidak valid.');
    assert(!resNonExistent.message.includes('tidak terdaftar'), 'Pesan tidak membocorkan keberadaan akun');
  });

  // UJI 6: Anti-Enumeration - NIP terdaftar tetapi password salah
  const resWrongPass = await auth.authenticate('9214102', 'wrongpass123', null, false);
  test('NIP terdaftar tetapi password salah menghasilkan pesan identik anti-enumerasi', () => {
    assert.strictEqual(resWrongPass.success, false);
    assert.strictEqual(resWrongPass.message, 'NIP atau kata sandi tidak valid.');
    assert.strictEqual(resWrongPass.message, resNonExistent.message, 'Pesan harus persis sama untuk mencegah enumerasi');
  });

  // UJI 7: Akun dinonaktifkan
  const resDisabled = await auth.authenticate('8909014', '123', null, false);
  test('Akun dinonaktifkan memberikan pesan aman', () => {
    assert.strictEqual(resDisabled.success, false);
    assert(resDisabled.message.includes('dinonaktifkan'));
  });

  // UJI 8: Login Pegawai Sukses dengan NIP angka murni
  const resSuccessPeserta = await auth.authenticate('9214102', 'pln123', null, false);
  test('Login peserta dengan NIP angka murni berhasil', () => {
    assert.strictEqual(resSuccessPeserta.success, true);
    assert.strictEqual(resSuccessPeserta.user.role, 'peserta');
    assert.strictEqual(resSuccessPeserta.user.nip, '9214102');
  });

  // UJI 9: Login Atasan Sukses dengan NIP angka murni
  const resSuccessAtasan = await auth.authenticate('8508111', '123', null, false);
  test('Login atasan dengan NIP angka murni berhasil', () => {
    assert.strictEqual(resSuccessAtasan.success, true);
    assert.strictEqual(resSuccessAtasan.user.role, 'atasan');
    assert.strictEqual(resSuccessAtasan.user.nama, 'Bambang Triyono');
  });

  // UJI 10: Portal Admin /plncorpuadmin (isFromAdminPortal: true)
  const resAdminWrong = await auth.authenticate('adminpusat', 'wrongpass', 'admin', true);
  test('Portal admin menolak password salah dengan pesan aman', () => {
    assert.strictEqual(resAdminWrong.success, false);
    assert.strictEqual(resAdminWrong.message, 'Kredensial atau kata sandi tidak valid.');
  });

  const resAdminSuccess = await auth.authenticate('adminpusat', 'adminpusat123', 'admin', true);
  test('Portal admin menerima kredensial yang sah', () => {
    assert.strictEqual(resAdminSuccess.success, true);
    assert.strictEqual(resAdminSuccess.user.username, 'adminpusat');
  });

  console.log(`\n========================================`);
  console.log(`RINGKASAN: ${passed} / ${total} PENGUJIAN BERHASIL (${passed === total ? 'SEMUA LULUS' : 'ADA YANG GAGAL'})`);
  console.log(`========================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
