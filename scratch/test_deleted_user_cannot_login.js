/**
 * Test Verifikasi: User yang Sudah Dihapus TIDAK BISA LOGIN
 * dan CRUD Sinkron dengan Database
 */
const assert = require('assert');

// Mock localStorage
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
  App: { showToast: () => {}, showModal: () => {} },
  firebaseAuth: {
    signInWithEmailAndPassword: async () => ({ user: {} }),
    createUserWithEmailAndPassword: async () => ({ user: {} }),
    signOut: async () => {}
  }
};

require('../js/data.js');
require('../js/store.js');
require('../js/auth.js');

const store = window.appStore;
const auth = window.authManager;

async function runTest() {
  console.log('=== TEST 1: Registrasi User 1234456789 ===');
  const userTest = store.addUser({
    nip: '1234456789',
    nama: 'Peserta Uji Hapus',
    jabatan: 'Junior Engineer',
    unitName: 'PLN UP3 Metro',
    updlId: 'updl-plb',
    role: 'peserta',
    password: 'pln123'
  });

  assert(userTest && userTest.id, 'User harus berhasil dibuat');
  console.log('User created:', userTest.id, userTest.nip, userTest.nama);

  // Verifikasi login SEBELUM dihapus -> HARUS BERHASIL
  const loginBefore = await auth.authenticate('1234456789', 'pln123');
  assert(loginBefore.success === true, 'Sebelum dihapus, user harus bisa login');
  console.log('✅ [PASS] Sebelum dihapus, user 1234456789 berhasil login');

  console.log('\n=== TEST 2: Hapus User 1234456789 via store.deleteUser ===');
  store.deleteUser(userTest.id);

  // Verifikasi di store.users
  const inUsers = store.getUsers().find(u => u.nip === '1234456789');
  assert(!inUsers, 'User 1234456789 HARUS terhapus dari store.users');

  // Verifikasi di store.respondents
  const inResps = store.getRespondents().find(r => r.nip === '1234456789');
  assert(!inResps, 'Responden 1234456789 HARUS terhapus dari store.respondents');

  // Verifikasi login SETELAH dihapus -> HARUS GAGAL
  const loginAfter = await auth.authenticate('1234456789', 'pln123');
  assert(loginAfter.success === false, 'Setelah dihapus, user TIDAK BOLEH bisa login');
  assert(loginAfter.message.includes('tidak terdaftar'), 'Pesan error harus menyatakan tidak terdaftar');
  console.log('✅ [PASS] Setelah dihapus, user 1234456789 GAGAL login (Pesan:', loginAfter.message, ')');

  console.log('\n=== TEST 3: User Berstatus NONAKTIF Ditolak Login ===');
  const userNonaktif = store.addUser({
    nip: '9998887771',
    nama: 'Peserta Nonaktif',
    role: 'peserta',
    password: 'pln123'
  });
  store.toggleUserStatus(userNonaktif.id); // ubah status jadi NONAKTIF

  const loginNonaktif = await auth.authenticate('9998887771', 'pln123');
  assert(loginNonaktif.success === false, 'User nonaktif TIDAK BOLEH bisa login');
  assert(loginNonaktif.message.includes('dinonaktifkan'), 'Pesan error harus menyatakan akun dinonaktifkan');
  console.log('✅ [PASS] User berstatus NONAKTIF ditolak login (Pesan:', loginNonaktif.message, ')');

  console.log('\n=== TEST 4: Hapus Responden via store.deleteRespondent Menghapus Akun User ===');
  const respBaru = store.addRespondent({
    nip: '5554443332',
    nama: 'Peserta Impor Test',
    role: 'peserta',
    password: 'pln123'
  });
  assert(store.getUsers().some(u => u.nip === '5554443332'), 'Akun user harus otomatis dibuat saat tambah responden');

  // Hapus responden
  store.deleteRespondent(respBaru.id);

  // Verifikasi akun user ikut terhapus
  assert(!store.getUsers().some(u => u.nip === '5554443332'), 'Akun user harus ikut terhapus saat responden dihapus');
  const loginDeletedResp = await auth.authenticate('5554443332', 'pln123');
  assert(loginDeletedResp.success === false, 'User dari responden yang dihapus TIDAK BOLEH bisa login');
  console.log('✅ [PASS] Penghapusan responden otomatis membersihkan akun user dan mencegah login');

  console.log('\n======================================================');
  console.log('SEMUA PENGUJIAN SINKRONISASI CRUD & KEAMANAN LOGIN LOLOS! 🚀');
  console.log('======================================================');
}

runTest().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
