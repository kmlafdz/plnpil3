/**
 * Test Suite: Fitur Ubah Avatar Profil PLN
 * Memverifikasi:
 * 1. Preset Karakter PLN tersedia dan berformat Data URI SVG valid
 * 2. Generator Gradien Inisial berfungsi dengan benar
 * 3. Update avatar di authManager dan sinkronisasi ke Store (Users & Respondents)
 * 4. Hapus avatar (reset ke default)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Mock Browser Environment
const dom = {
  window: {
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    },
    dispatchEvent(e) {
      if (this._events && this._events[e.name]) {
        this._events[e.name].forEach(fn => fn(e));
      }
    },
    addEventListener(name, fn) {
      if (!this._events) this._events = {};
      if (!this._events[name]) this._events[name] = [];
      this._events[name].push(fn);
    },
    location: { pathname: '/', hash: '' },
    CustomEvent: class { constructor(name, detail) { this.name = name; this.detail = detail; } },
    firebaseAuth: {
      signOut: async () => {},
      signInWithEmailAndPassword: async () => ({ user: { uid: 'mock' } }),
      createUserWithEmailAndPassword: async () => ({ user: { uid: 'mock' } })
    },
    document: {
      getElementById(id) {
        if (!this._elements) this._elements = {};
        if (!this._elements[id]) {
          this._elements[id] = { id, textContent: '', innerHTML: '', addEventListener() {}, setAttribute() {} };
        }
        return this._elements[id];
      },
      createElement(tag) {
        return { tag, innerHTML: '', appendChild() {}, addEventListener() {} };
      },
      body: { appendChild() {} }
    }
  }
};
dom.window.window = dom.window;
dom.window.document.window = dom.window;
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.CustomEvent = dom.window.CustomEvent;

// Load code
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
const authCode = fs.readFileSync(path.join(__dirname, '../js/auth.js'), 'utf8');
const avatarCode = fs.readFileSync(path.join(__dirname, '../js/avatar.js'), 'utf8');

vm.runInThisContext(storeCode);
vm.runInThisContext(authCode);
vm.runInThisContext(avatarCode);

async function runTests() {
  console.log('=== MEMULAI TEST SUITE: FITUR UBAH AVATAR PROFIL ===\n');
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

  // UJI 1: Koleksi Preset Avatar PLN
  test('Preset avatar PLN tersedia lengkap dan berformat data URI SVG valid', () => {
    assert(window.AvatarManager, 'AvatarManager harus terdefinisi di window');
    const presets = window.AvatarManager.getPresets();
    assert(Array.isArray(presets), 'Presets harus berupa array');
    assert(presets.length >= 6, `Jumlah preset harus minimal 6 (ditemukan: ${presets.length})`);
    
    presets.forEach(p => {
      assert(p.id, 'Setiap preset harus memiliki id');
      assert(p.name, 'Setiap preset harus memiliki name');
      assert(p.dataUri.startsWith('data:image/svg+xml'), 'Format data URI harus berupa SVG');
    });
  });

  // UJI 2: Palet Gradien Inisial
  test('Palet gradien inisial tersedia dan menghasilkan SVG yang tepat', () => {
    const gradients = window.AvatarManager.getGradients();
    assert(Array.isArray(gradients) && gradients.length > 0, 'Palet gradien harus ada');
    
    const gradUri = window.AvatarManager.generateGradientAvatar('Kemal Afif', '#006876', '#23C4DB');
    assert(gradUri.startsWith('data:image/svg+xml'), 'Output gradien inisial harus berupa data URI SVG');
    assert(decodeURIComponent(gradUri).includes('K'), 'Harus menyertakan inisial huruf "K" dari nama');
  });

  // UJI 3: Simulasi Login & Update Avatar di Sesi Auth
  test('Update avatar berhasil disimpan ke sesi pengguna aktif', () => {
    const mockUser = {
      id: 'usr-test-1',
      nip: '8909014',
      nama: 'Akkhita Nurrul',
      role: 'peserta',
      avatar: ''
    };
    window.authManager.saveSession(mockUser);
    assert.strictEqual(window.authManager.getUser().avatar, '', 'Awalnya belum ada avatar');

    // Terapkan avatar preset
    const preset = window.AvatarManager.getPresets()[0];
    const updated = window.authManager.updateCurrentUserAvatar(preset.dataUri);
    assert.strictEqual(updated.avatar, preset.dataUri, 'Avatar di sesi harus terupdate');
    assert.strictEqual(window.authManager.getUser().avatar, preset.dataUri, 'Avatar di getUser() harus terupdate');

    // Cek LocalStorage
    const savedSession = JSON.parse(window.localStorage.getItem(window.authManager.STORAGE_KEY_USER));
    assert.strictEqual(savedSession.avatar, preset.dataUri, 'Avatar harus tersimpan di LocalStorage');
  });

  // UJI 4: Sinkronisasi Avatar ke Master Users & Respondents di Store
  test('Sinkronisasi avatar otomatis tersimpan ke appStore.users dan appStore.respondents', () => {
    window.appStore.users = [
      { id: 'usr-test-1', nip: '8909014', nama: 'Akkhita Nurrul', avatar: '' }
    ];
    window.appStore.respondents = [
      { id: 10, nip: '8909014', nama: 'Akkhita Nurrul', avatar: '' }
    ];

    const newAvatar = 'data:image/jpeg;base64,mockCustomPhoto123';
    window.authManager.updateCurrentUserAvatar(newAvatar);

    const storeUser = window.appStore.users.find(u => u.nip === '8909014');
    assert.strictEqual(storeUser.avatar, newAvatar, 'User di appStore.users harus terupdate');

    const storeResp = window.appStore.respondents.find(r => r.nip === '8909014');
    assert.strictEqual(storeResp.avatar, newAvatar, 'Responden di appStore.respondents harus terupdate');
  });

  // UJI 5: Hapus Avatar (Reset ke Default)
  test('Hapus avatar mengembalikan properti avatar menjadi string kosong', () => {
    window.authManager.updateCurrentUserAvatar('');
    assert.strictEqual(window.authManager.getUser().avatar, '', 'Avatar harus kosong setelah di-reset');
    
    const storeUser = window.appStore.users.find(u => u.nip === '8909014');
    assert.strictEqual(storeUser.avatar, '', 'Store user avatar harus kosong');
  });

  // UJI 6: Simpan Avatar via AvatarManager.saveAvatar()
  test('AvatarManager.saveAvatar memproses penyimpanan dan mengembalikan hasil sukses', () => {
    const preset = window.AvatarManager.getPresets()[1];
    const res = window.AvatarManager.saveAvatar(preset.dataUri);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.user.avatar, preset.dataUri);
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
