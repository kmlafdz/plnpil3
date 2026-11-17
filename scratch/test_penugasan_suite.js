/**
 * Test Suite: Verifikasi Pembuatan Akun Otomatis dari Penugasan,
 * Pencegahan Ghost Data Atasan Terhapus, dan Pop-up Konfirmasi Penugasan
 */
const fs = require('fs');
const assert = require('assert');

// Mock browser environment
const window = {
  location: { pathname: '/', search: '', hash: '' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  dispatchEvent() {},
  CustomEvent: class {}
};
global.window = window;
global.localStorage = window.localStorage;

// Load app core modules
eval(fs.readFileSync('js/data.js', 'utf8'));
eval(fs.readFileSync('js/auth.js', 'utf8'));
eval(fs.readFileSync('js/store.js', 'utf8'));

console.log('--- TEST SUITE: PENUGASAN AUTO-ACCOUNT & SUPERVISOR CLEANUP ---');

let passedCount = 0;
async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err);
  }
}

(async () => {
  // Test 1: Akun peserta & atasan otomatis dibuat saat tambah penugasan (addRespondent)
  await runAsyncTest('1. Akun peserta dan atasan otomatis dibuat di master users saat tambah penugasan', async () => {
    const resp = window.appStore.addRespondent({
      nama: 'Doni Kurniawan',
      nip: '19960515',
      jabatan: 'Junior Operator GI',
      unit: 'PLN UP3 Metro',
      modules: ['A', 'B'],
      password: 'pln123',
      atasan: {
        nama: 'Bambang Soediro',
        nip: '19750820',
        jabatan: 'Manager UP3 Metro'
      }
    });

    assert.ok(resp, 'Respondent harus berhasil dibuat');
    
    // Cek di memory appStore.users
    const userPeserta = window.appStore.users.find(u => u.nip === '19960515');
    const userAtasan = window.appStore.users.find(u => u.nip === '19750820');

    assert.ok(userPeserta, 'Akun peserta harus terdaftar di window.appStore.users');
    assert.strictEqual(userPeserta.role, 'peserta');
    assert.strictEqual(userPeserta.status, 'AKTIF');
    assert.strictEqual(userPeserta.unitName, 'PLN UP3 Metro');
    assert.ok(userPeserta.updlId, 'updlId peserta harus terisi');

    assert.ok(userAtasan, 'Akun atasan harus terdaftar di window.appStore.users');
    assert.strictEqual(userAtasan.role, 'atasan');
    assert.strictEqual(userAtasan.status, 'AKTIF');
    assert.strictEqual(userAtasan.unitName, 'PLN UP3 Metro');
    assert.ok(userAtasan.updlId, 'updlId atasan harus terisi');

    // Cek penyimpanan localStorage
    const storedUsers = JSON.parse(window.localStorage.getItem('pln_eval3_users_v1') || '[]');
    assert.ok(storedUsers.some(u => u.nip === '19960515'), 'Akun peserta tersimpan di localStorage');
    assert.ok(storedUsers.some(u => u.nip === '19750820'), 'Akun atasan tersimpan di localStorage');
  });

  // Test 2: Akun peserta & atasan baru dapat langsung login
  await runAsyncTest('2. Akun peserta & atasan yang dibuat otomatis dapat langsung login dengan NIP & password default', async () => {
    // Login Peserta
    const authPeserta = await window.authManager.authenticate('19960515', 'pln123');
    assert.strictEqual(authPeserta.success, true, 'Peserta baru harus bisa login');
    assert.strictEqual(authPeserta.user.role, 'peserta');

    // Login Atasan
    const authAtasan = await window.authManager.authenticate('19750820', 'pln123');
    assert.strictEqual(authAtasan.success, true, 'Atasan baru harus bisa login');
    assert.strictEqual(authAtasan.user.role, 'atasan');
  });

  // Test 3: getSupervisorByUnit mengembalikan atasan yang aktif
  await runAsyncTest('3. getSupervisorByUnit mengembalikan atasan aktif yang baru dibuat', async () => {
    const sup = window.appStore.getSupervisorByUnit('PLN UP3 Metro');
    assert.ok(sup, 'Supervisor harus ditemukan');
    assert.strictEqual(sup.nama, 'Bambang Soediro');
    assert.strictEqual(sup.nip, '19750820');
  });

  // Test 4: Hapus atasan -> data atasan bersih dari users, units, respondents & tidak ghosting
  await runAsyncTest('4. Setelah atasan dihapus, tidak ada ghosting saat cari atasan di penugasan', async () => {
    const atasanUser = window.appStore.users.find(u => u.nip === '19750820');
    assert.ok(atasanUser, 'Atasan harus ada sebelum dihapus');

    // Hapus Atasan
    window.appStore.deleteUser(atasanUser.id);

    // Pastikan tidak ada di users
    const checkUser = window.appStore.users.find(u => u.nip === '19750820');
    assert.strictEqual(checkUser, undefined, 'Atasan harus terhapus dari window.appStore.users');

    // Pastikan referensi atasan di units terhapus
    const unitObj = window.appStore.units.find(u => u.nama === 'PLN UP3 Metro');
    if (unitObj) {
      assert.strictEqual(unitObj.atasan, undefined, 'Unit tidak boleh lagi menyimpan referensi atasan yang sudah dihapus');
    }

    // Pastikan referensi atasan di respondents yang diawasi terhapus
    const resp = window.appStore.respondents.find(r => r.nip === '19960515');
    assert.strictEqual(resp.atasan, null, 'Responden tidak boleh lagi menyimpan atasan yang terhapus');

    // Panggilan getSupervisorByUnit('PLN UP3 Metro') HARUS return null, TIDAK BOLEH ghosting!
    const ghostCheck = window.appStore.getSupervisorByUnit('PLN UP3 Metro');
    assert.strictEqual(ghostCheck, null, 'getSupervisorByUnit HARUS return null dan tidak boleh menampilkan atasan terhapus');
  });

  // Test 5: Tambah penugasan baru dengan atasan pengganti
  await runAsyncTest('5. Menambah penugasan dengan atasan baru menautkan atasan baru secara bersih', async () => {
    const resp2 = window.appStore.addRespondent({
      nama: 'Siti Rahma',
      nip: '19980312',
      jabatan: 'Staff Niaga',
      unit: 'PLN UP3 Metro',
      modules: ['A'],
      password: 'pln123',
      atasan: {
        nama: 'Ir. Agus Wijaya',
        nip: '19780102',
        jabatan: 'Manager UP3 Metro Baru'
      }
    });

    const newSup = window.appStore.getSupervisorByUnit('PLN UP3 Metro');
    assert.ok(newSup, 'Supervisor baru harus terdeteksi');
    assert.strictEqual(newSup.nama, 'Ir. Agus Wijaya');
    assert.strictEqual(newSup.nip, '19780102');

    // Cek login atasan baru
    const authNewSup = await window.authManager.authenticate('19780102', 'pln123');
    assert.strictEqual(authNewSup.success, true, 'Atasan baru harus bisa login');
  });

  // Test 6: NIP PLN Alfanumerik pada penugasan
  await runAsyncTest('6. Penugasan peserta dengan NIP PLN Alfanumerik (misal 9419002ZY) otomatis aktif & dapat login', async () => {
    window.appStore.addRespondent({
      nama: 'Rian Pratama',
      nip: '9419002ZY',
      jabatan: 'Teknisi PDKB',
      unit: 'PLN UP3 Metro',
      modules: ['A', 'B'],
      password: 'pln123',
      atasan: {
        nama: 'Ir. Agus Wijaya',
        nip: '19780102',
        jabatan: 'Manager UP3 Metro Baru'
      }
    });

    const userAlphanum = window.appStore.users.find(u => u.nip === '9419002ZY');
    assert.ok(userAlphanum, 'User alfanumerik harus dibuat');
    assert.strictEqual(userAlphanum.status, 'AKTIF');

    const authRes = await window.authManager.authenticate('9419002ZY', 'pln123');
    assert.strictEqual(authRes.success, true, 'Peserta alfanumerik dari penugasan harus bisa login');
  });

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS PASSED: ${passedCount}/6`);
  console.log(`========================================\n`);

  if (passedCount !== 6) {
    process.exit(1);
  }
})();
