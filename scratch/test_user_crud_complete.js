/**
 * Smoke Test: CRUD User Verification for Developer & Admin
 * Evaluates:
 * 1. Developer creation privileges (Admin, Dev, Koordinator, Atasan, Peserta)
 * 2. Admin Pusat creation privileges (All except Dev, Dev creation is rejected)
 * 3. Update User (Name, Role, Password)
 * 4. Toggle User Status (Aktif/Nonaktif)
 * 5. Delete User (Protected kmlafdz, Dev protection vs Admin, Normal delete)
 * 6. Auth integration (Created accounts can login)
 */

const fs = require('fs');
const path = require('path');

// Mock browser globals for Node.js test environment
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.window = {
  MASTER_DATA: {
    updls: [],
    units: [],
    programs: [],
    periods: [],
    formTemplates: [],
    bankButirList: [],
    respondents: []
  },
  CustomEvent: class CustomEvent {
    constructor(name, opts) { this.name = name; this.opts = opts; }
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  firebaseAuth: {
    signInWithEmailAndPassword: async () => ({ user: {} }),
    createUserWithEmailAndPassword: async () => ({ user: {} }),
    signOut: async () => {}
  },
  db: {
    collection: (col) => ({
      doc: (id) => ({
        set: async () => {},
        delete: async () => {},
        get: async () => ({ exists: false, data: () => ({}) }),
        onSnapshot: () => () => {}
      }),
      onSnapshot: () => () => {}
    })
  },
  App: {
    showToast: (msg, type) => console.log(`   [UI Toast ${type || 'info'}]: ${msg}`)
  }
};

// Load codebases
const storePath = path.join(__dirname, '..', 'js', 'store.js');
const authPath = path.join(__dirname, '..', 'js', 'auth.js');

// Execute store.js
const storeCode = fs.readFileSync(storePath, 'utf8');
eval(storeCode);

// Execute auth.js
const authCode = fs.readFileSync(authPath, 'utf8');
eval(authCode);

async function runTests() {
  console.log('=== STARTING CRUD USER SMOKE TESTS ===\n');
  let passCount = 0;
  let testCount = 0;

  function assert(condition, testName) {
    testCount++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // 1. Initial State Check
  const initialUsers = window.appStore.getUsers();
  assert(initialUsers.length >= 2, 'Store initialized with at least Dev and Admin Pusat');
  const devUser = initialUsers.find(u => u.nip.toLowerCase() === 'kmlafdz');
  const adminUser = initialUsers.find(u => u.nip.toLowerCase() === 'adminpusat');
  assert(!!devUser && devUser.role === 'developer', 'Akun Developer kmlafdz aktif & valid');
  assert(!!adminUser && adminUser.role === 'admin' && adminUser.isAdminPusat === true, 'Akun Admin Pusat adminpusat aktif & valid');

  // --- SCENARIO A: DEVELOPER LOGIN & CRUD ---
  console.log('\n--- SKENARIO A: PENGUJIAN OLEH DEVELOPER (kmlafdz) ---');
  window.authManager.saveSession(devUser);

  // A.1: Dev membuat Admin Pusat Baru
  let newAdmin = null;
  try {
    newAdmin = window.appStore.addUser({
      nip: 'ADM999',
      nama: 'Budi Santoso (Admin Regional)',
      email: 'budi.admin@pln.co.id',
      jabatan: 'Koordinator Evaluasi Regional',
      role: 'admin',
      password: 'adminregional123'
    });
    assert(newAdmin && newAdmin.nip === 'ADM999' && newAdmin.isAdminPusat === true, 'Developer berhasil membuat akun Admin Baru (ADM999)');
  } catch (err) {
    assert(false, `Developer gagal buat admin: ${err.message}`);
  }

  // A.2: Dev membuat Developer Tambahan
  let newDev = null;
  try {
    newDev = window.appStore.addUser({
      nip: 'DEV002',
      nama: 'Siti Rahma (Dev Ops)',
      email: 'siti.dev@pln.co.id',
      jabatan: 'Software Engineer',
      role: 'developer',
      password: 'devpass123'
    });
    assert(newDev && newDev.nip === 'DEV002' && newDev.role === 'developer', 'Developer berhasil membuat akun Developer Tambahan (DEV002)');
  } catch (err) {
    assert(false, `Developer gagal buat dev baru: ${err.message}`);
  }

  // A.3: Dev membuat Peserta Baru
  let newPeserta = null;
  try {
    newPeserta = window.appStore.addUser({
      nip: '9518001ZY',
      nama: 'Ahmad Fauzi, S.T.',
      email: 'ahmad.f@pln.co.id',
      jabatan: 'Junior Engineer',
      role: 'peserta',
      password: 'mypassword123'
    });
    assert(newPeserta && newPeserta.nip === '9518001ZY' && newPeserta.role === 'peserta', 'Developer berhasil membuat akun Peserta Baru (9518001ZY)');
    // Pastikan otomatis tercatat di responden
    const resp = window.appStore.respondents.find(r => r.nip === '9518001ZY');
    assert(!!resp && resp.nama === 'Ahmad Fauzi, S.T.', 'Peserta baru otomatis sinkron ke daftar responden evaluasi');
  } catch (err) {
    assert(false, `Developer gagal buat peserta: ${err.message}`);
  }

  // --- SCENARIO B: ADMIN PUSAT LOGIN & CRUD ---
  console.log('\n--- SKENARIO B: PENGUJIAN OLEH ADMIN PUSAT (adminpusat) ---');
  window.authManager.saveSession(adminUser);

  // B.1: Admin Pusat membuat Atasan Langsung
  let newAtasan = null;
  try {
    newAtasan = window.appStore.addUser({
      nip: 'SUP88801',
      nama: 'Ir. Hendro Wibowo',
      email: 'hendro.w@pln.co.id',
      jabatan: 'Manager Bagian Pemeliharaan',
      role: 'atasan',
      password: 'atasanpass123'
    });
    assert(newAtasan && newAtasan.nip === 'SUP88801' && newAtasan.role === 'atasan', 'Admin Pusat berhasil membuat akun Atasan (SUP88801)');
  } catch (err) {
    assert(false, `Admin Pusat gagal buat atasan: ${err.message}`);
  }

  // B.2: Admin Pusat membuat Koordinator
  let newKoord = null;
  try {
    newKoord = window.appStore.addUser({
      nip: 'KORD777',
      nama: 'Dewi Lestari',
      email: 'dewi.k@pln.co.id',
      jabatan: 'Koordinator Pelatihan',
      role: 'koordinator_internal',
      password: 'koordpass123'
    });
    assert(newKoord && newKoord.nip === 'KORD777' && newKoord.role === 'koordinator_internal', 'Admin Pusat berhasil membuat Koordinator (KORD777)');
  } catch (err) {
    assert(false, `Admin Pusat gagal buat koordinator: ${err.message}`);
  }

  // B.3: Admin Pusat DILARANG membuat akun Developer
  try {
    window.appStore.addUser({
      nip: 'DEV_ILLEGAL',
      nama: 'Fake Dev',
      role: 'developer',
      password: '123'
    });
    assert(false, 'Admin Pusat seharusnya DITOLAK saat mencoba membuat akun Developer');
  } catch (err) {
    assert(err.message.includes('Hanya Developer'), 'Admin Pusat berhasil dicegah membuat akun Developer (Akses Dibatasi)');
  }

  // --- SCENARIO C: UPDATE USER ---
  console.log('\n--- SKENARIO C: PENGUJIAN UPDATE DATA USER ---');
  try {
    const updatedPeserta = window.appStore.updateUser(newPeserta.id, {
      nama: 'Ahmad Fauzi, M.T. (Updated)',
      jabatan: 'Senior Engineer',
      password: 'newsecretpassword'
    });
    assert(updatedPeserta.nama === 'Ahmad Fauzi, M.T. (Updated)', 'Update nama pengguna berhasil');
    assert(updatedPeserta.password === 'newsecretpassword', 'Update kata sandi pengguna berhasil');
    // Sinkronisasi ke responden
    const respUpdated = window.appStore.respondents.find(r => r.nip === '9518001ZY');
    assert(respUpdated && respUpdated.nama === 'Ahmad Fauzi, M.T. (Updated)', 'Update nama peserta tersinkronisasi ke profil responden');
  } catch (err) {
    assert(false, `Update user gagal: ${err.message}`);
  }

  // --- SCENARIO D: TOGGLE STATUS USER ---
  console.log('\n--- SKENARIO D: PENGUJIAN TOGGLE STATUS AKUN ---');
  try {
    const toggled = window.appStore.toggleUserStatus(newAtasan.id);
    assert(toggled.status === 'NONAKTIF', 'Toggle status akun pertama kali menjadi NONAKTIF');
    const toggledAgain = window.appStore.toggleUserStatus(newAtasan.id);
    assert(toggledAgain.status === 'AKTIF', 'Toggle status akun kedua kali kembali AKTIF');
  } catch (err) {
    assert(false, `Toggle user gagal: ${err.message}`);
  }

  // --- SCENARIO E: DELETE USER & PROTECTIONS ---
  console.log('\n--- SKENARIO E: PENGUJIAN DELETE USER & PROTEKSI AKUN ---');
  // E.1: Akun kmlafdz tidak dapat dihapus
  try {
    window.appStore.deleteUser(devUser.id);
    assert(false, 'Akun kmlafdz seharusnya TIDAK BISA dihapus');
  } catch (err) {
    assert(err.message.includes('kmlafdz') && err.message.includes('dilindungi'), 'Akun kmlafdz berhasil diproteksi dari penghapusan');
  }

  // E.2: Admin Pusat tidak dapat menghapus akun Developer
  try {
    window.appStore.deleteUser(newDev.id);
    assert(false, 'Admin Pusat seharusnya tidak bisa menghapus akun Developer DEV002');
  } catch (err) {
    assert(err.message.includes('Developer dilindungi'), 'Akun Developer diproteksi dari penghapusan oleh Admin Pusat');
  }

  // E.3: Hapus Peserta (dan responden terkait terhapus)
  try {
    const delResult = window.appStore.deleteUser(newPeserta.id);
    assert(delResult && delResult.nip === '9518001ZY', 'Penghapusan user peserta berhasil');
    const userStillExists = window.appStore.getUserById(newPeserta.id);
    assert(!userStillExists, 'User peserta tidak lagi ada di daftar users');
    const respStillExists = window.appStore.respondents.find(r => r.nip === '9518001ZY');
    assert(!respStillExists, 'Responden terkait otomatis terhapus saat user peserta dihapus');
  } catch (err) {
    assert(false, `Hapus peserta gagal: ${err.message}`);
  }

  // --- SCENARIO F: AUTHENTICATION LOGIN TEST ---
  console.log('\n--- SKENARIO F: PENGUJIAN LOGIN USER BARU ---');
  // F.1: Login Admin Baru via Portal /plncorpuadmin
  const loginAdminRes = await window.authManager.authenticate('ADM999', 'adminregional123', 'admin', true);
  assert(loginAdminRes.success === true && loginAdminRes.user.nip === 'ADM999', 'Admin baru (ADM999) berhasil login via /plncorpuadmin');

  // F.2: Login Atasan Baru via Portal Utama
  const loginAtasanRes = await window.authManager.authenticate('SUP88801', 'atasanpass123');
  assert(loginAtasanRes.success === true && loginAtasanRes.user.nip === 'SUP88801', 'Atasan baru (SUP88801) berhasil login via portal utama');

  console.log(`\n========================================`);
  console.log(`HASIL SMOKE TEST: ${passCount} / ${testCount} UJI BERHASIL (${passCount === testCount ? '100% PASS' : 'FAILED'})`);
  console.log(`========================================`);

  if (passCount === testCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
