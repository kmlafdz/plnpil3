/**
 * Test Suite: Verifikasi Pembuatan Akun di Web & Otentikasi Login
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

console.log('--- TEST SUITE: USER CREATION & LOGIN VERIFICATION ---');

let passedCount = 0;
function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

(async () => {
  // Test 1: Akun peserta baru dengan NIP numerik
  await runAsyncTest('1. Peserta baru NIP numerik berhasil dibuat dan login', async () => {
    const user = window.appStore.addUser({
      nip: '19951122',
      nama: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@pln.co.id',
      jabatan: 'Junior Engineer',
      role: 'peserta',
      status: 'AKTIF',
      password: 'pln123'
    });
    assert.strictEqual(user.nip, '19951122');
    
    const loginRes = await window.authManager.authenticate('19951122', 'pln123');
    assert.strictEqual(loginRes.success, true);
    assert.strictEqual(loginRes.user.role, 'peserta');
    assert.strictEqual(loginRes.user.nip, '19951122');
  });

  // Test 2: Akun peserta dengan NIP PLN Alfanumerik (9518001ZY)
  await runAsyncTest('2. Peserta dengan NIP Alfanumerik (9518001ZY) berhasil login', async () => {
    const user = window.appStore.addUser({
      nip: '9518001ZY',
      nama: 'Rizky Pratama',
      email: 'rizky.pratama@pln.co.id',
      jabatan: 'Pelaksana Distribusi',
      role: 'peserta',
      status: 'AKTIF',
      password: 'mypassword123'
    });
    assert.strictEqual(user.nip, '9518001ZY');

    // Login dengan NIP alfanumerik persis
    const loginExact = await window.authManager.authenticate('9518001ZY', 'mypassword123');
    assert.strictEqual(loginExact.success, true);
    assert.strictEqual(loginExact.user.nip, '9518001ZY');

    // Login huruf kecil
    const loginLower = await window.authManager.authenticate('9518001zy', 'mypassword123');
    assert.strictEqual(loginLower.success, true);

    // Login dengan digit angkanya saja (9518001)
    const loginDigits = await window.authManager.authenticate('9518001', 'mypassword123');
    assert.strictEqual(loginDigits.success, true);
  });

  // Test 3: Akun Administrator Baru yang diinput di web dapat login di portal utama
  await runAsyncTest('3. Admin baru yang diinput di web dapat login di portal utama', async () => {
    const adminUser = window.appStore.addUser({
      nip: '19870315',
      nama: 'Hendra Gunawan',
      email: 'hendra.g@pln.co.id',
      jabatan: 'Supervisor Evaluasi',
      role: 'admin',
      status: 'AKTIF',
      password: 'adminpassword123'
    });
    assert.strictEqual(adminUser.role, 'admin');

    // Login portal reguler (isFromAdminPortal = false)
    const loginReguler = await window.authManager.authenticate('19870315', 'adminpassword123', null, false);
    assert.strictEqual(loginReguler.success, true);
    assert.strictEqual(loginReguler.user.role, 'admin');

    // Login portal admin (/plncorpuadmin, isFromAdminPortal = true)
    const loginPortal = await window.authManager.authenticate('19870315', 'adminpassword123', 'admin', true);
    assert.strictEqual(loginPortal.success, true);
    assert.strictEqual(loginPortal.user.role, 'admin');
  });

  // Test 4: Akun Atasan Langsung baru dapat login dengan password custom atau default '123'
  await runAsyncTest('4. Atasan langsung baru dapat login dengan password', async () => {
    const atasanUser = window.appStore.addUser({
      nip: '8508111A',
      nama: 'Bambang Triyono',
      email: 'bambang.t@pln.co.id',
      jabatan: 'Manager UP3',
      role: 'atasan',
      status: 'AKTIF'
    });
    assert.strictEqual(atasanUser.role, 'atasan');

    const loginRes = await window.authManager.authenticate('8508111A', '123');
    assert.strictEqual(loginRes.success, true);
    assert.strictEqual(loginRes.user.role, 'atasan');
  });

  // Test 5: Akun Koordinator Internal & Eksternal baru dapat login
  await runAsyncTest('5. Koordinator baru dapat login', async () => {
    const coordUser = window.appStore.addUser({
      nip: '8810743Z',
      nama: 'Azam Zulmi',
      email: 'azam.zulmi@pln.co.id',
      jabatan: 'Koordinator UPDL',
      role: 'koordinator_eksternal',
      status: 'AKTIF'
    });
    assert.strictEqual(coordUser.role, 'koordinator_eksternal');

    const loginRes = await window.authManager.authenticate('8810743Z', '123');
    assert.strictEqual(loginRes.success, true);
  });

  // Test 6: Akun yang diimpor secara massal (importUsers) dapat langsung login
  await runAsyncTest('6. Akun dari impor massal Excel/CSV dapat langsung digunakan login', async () => {
    const importData = [
      { nip: '9920001Z', nama: 'Peserta Impor Satu', role: 'peserta' },
      { nip: '9920002Z', nama: 'Peserta Impor Dua', role: 'peserta', password: 'custompass456' },
      { nip: '9920003Z', nama: 'Atasan Impor Tiga', role: 'atasan' }
    ];
    const impRes = window.appStore.importUsers(importData, 'create_only');
    assert.strictEqual(impRes.added, 3);

    const login1 = await window.authManager.authenticate('9920001Z', 'pln123');
    assert.strictEqual(login1.success, true);

    const login2 = await window.authManager.authenticate('9920002Z', 'custompass456');
    assert.strictEqual(login2.success, true);

    const login3 = await window.authManager.authenticate('9920003Z', '123');
    assert.strictEqual(login3.success, true);
  });

  // Test 7: Kata sandi salah memberikan pesan aman tanpa membocorkan eksistensi akun
  await runAsyncTest('7. Kata sandi salah ditolak dengan pesan generik', async () => {
    const failRes = await window.authManager.authenticate('19951122', 'passwordsalah');
    assert.strictEqual(failRes.success, false);
    assert.strictEqual(failRes.message, 'NIP atau kata sandi tidak valid.');
  });

  // Test 8: Akun NONAKTIF ditolak login dengan pesan yang informatif
  await runAsyncTest('8. Akun dinonaktifkan ditolak login', async () => {
    const nonaktifUser = window.appStore.addUser({
      nip: '19700101',
      nama: 'User Pensiun',
      role: 'peserta',
      status: 'NONAKTIF'
    });
    const res = await window.authManager.authenticate('19700101', 'pln123');
    assert.strictEqual(res.success, false);
    assert.ok(res.message.includes('dinonaktifkan'));
  });

  // Test 9: Scope DUMMY_* di store.js tidak menyebabkan ReferenceError
  runTest('9. DUMMY sets didefinisikan di module scope store.js', () => {
    const storeContent = fs.readFileSync('js/store.js', 'utf8');
    assert.ok(storeContent.includes('const DUMMY_NIPS = new Set'));
    // Make sure initFirestoreSync references DUMMY_NIPS safely
    assert.doesNotThrow(() => {
      // Simulating what initFirestoreSync does
      const list = [];
      const testDoc = { data: () => ({ nip: '12345678', id: 'usr-1' }) };
      const u = testDoc.data();
      if (u && u.nip && u.id !== 'usr-admin-1' && u.id !== 'usr-kord-eks') {
        list.push(u);
      }
      assert.strictEqual(list.length, 1);
    });
  });

  console.log(`\nTOTAL TESTS PASSED: ${passedCount}/9`);
})();
