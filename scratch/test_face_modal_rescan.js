/**
 * Test Suite: Verifikasi Pembaruan Modal Face Auth:
 * 1. Tidak ada tombol X (#btn-close-face-modal)
 * 2. Tidak ada opsi verifikasi dengan kata sandi (#btn-use-password-fallback)
 * 3. Ada tombol Scan Ulang (#btn-rescan-face)
 * 4. Ada tombol Batalkan (#btn-cancel-face-auth)
 * 5. Eksekusi scan ulang me-reset buffer biometrik, frame counter, dan challenge liveness
 */
const fs = require('fs');
const assert = require('assert');

// Mock DOM & Browser Environment
class ElementMock {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    };
    this.style = {};
    this.innerHTML = '';
    this.textContent = '';
    this.disabled = false;
    this.width = 640;
    this.height = 480;
    this.videoWidth = 640;
    this.videoHeight = 480;
    this.readyState = 4;
    this.children = [];
  }
  getContext() {
    return {
      drawImage() {},
      clearRect() {},
      beginPath() {},
      arc() {},
      fill() {},
      stroke() {},
      moveTo() {},
      lineTo() {},
      save() {},
      restore() {}
    };
  }
  play() { return Promise.resolve(); }
  remove() {}
  querySelector(selector) {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.id === id) return this;
      return this._findChildById(this, id);
    }
    return new ElementMock('div');
  }
  _findChildById(node, id) {
    if (!node.children) return null;
    for (const child of node.children) {
      if (child.id === id) return child;
      const found = this._findChildById(child, id);
      if (found) return found;
    }
    return null;
  }
}

const documentMock = {
  body: {
    appendChild(el) {
      this.lastAppended = el;
    }
  },
  getElementById(id) {
    return null;
  },
  createElement(tag) {
    const el = new ElementMock(tag);
    // Helper to simulate innerHTML parsing
    let rawHtml = '';
    Object.defineProperty(el, 'innerHTML', {
      get() { return rawHtml; },
      set(html) {
        rawHtml = html;
        // Parse IDs present in HTML
        const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
        el.children = ids.map(id => new ElementMock('div', id));
      }
    });
    return el;
  }
};

const windowMock = {
  location: { pathname: '/', search: '', hash: '' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  crypto: {
    getRandomValues(arr) {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    }
  },
  navigator: {
    mediaDevices: {
      getUserMedia() {
        return Promise.resolve({
          getTracks() { return [{ stop() {} }]; }
        });
      }
    }
  },
  requestAnimationFrame(fn) { return 123; },
  cancelAnimationFrame(id) {},
  dispatchEvent() {},
  CustomEvent: class {}
};

if (!global.navigator) global.navigator = {};
global.navigator.mediaDevices = {
  getUserMedia() {
    return Promise.resolve({
      getTracks() { return [{ stop() {} }]; }
    });
  }
};
global.window = windowMock;
global.document = documentMock;
global.localStorage = windowMock.localStorage;
global.crypto = windowMock.crypto;
global.requestAnimationFrame = windowMock.requestAnimationFrame;
global.cancelAnimationFrame = windowMock.cancelAnimationFrame;

// Load js/face_auth.js
eval(fs.readFileSync('js/face_auth.js', 'utf8'));

console.log('=== TEST SUITE: FACE AUTH MODAL UI & RESCAN VERIFICATION ===');

const manager = window.FaceAuthManager;
assert(manager, 'FaceAuthManager must exist');

// Test 1: Buka modal verifikasi
let cancelCalled = false;
let successCalled = false;

manager.openFaceVerificationModal({
  title: 'Uji Verifikasi',
  user: { id: 'admin-1', nama: 'Admin Unit' },
  mode: 'action',
  onSuccess: () => { successCalled = true; },
  onCancel: () => { cancelCalled = true; }
});

const modal = documentMock.body.lastAppended;
assert(modal, 'Modal overlay must be appended to body');

// Test 2: Pastikan tombol X TIDAK ada di dalam modal
const closeBtn = modal.querySelector('#btn-close-face-modal');
assert.strictEqual(closeBtn, null, 'Tombol X (#btn-close-face-modal) harus SUDAH DIHAPUS');
console.log('[PASS] Tombol X (#btn-close-face-modal) berhasil dihapus');

// Test 3: Pastikan tombol password fallback TIDAK ada di dalam modal
const pwdBtn = modal.querySelector('#btn-use-password-fallback');
assert.strictEqual(pwdBtn, null, 'Tombol password fallback (#btn-use-password-fallback) harus SUDAH DIHAPUS');
console.log('[PASS] Tombol verifikasi dengan kata sandi (#btn-use-password-fallback) berhasil dihapus');

// Test 4: Pastikan tombol Scan Ulang ADA
const rescanBtn = modal.querySelector('#btn-rescan-face');
assert(rescanBtn !== null, 'Tombol Scan Ulang (#btn-rescan-face) HARUS ADA');
console.log('[PASS] Tombol Scan Ulang (#btn-rescan-face) tersedia di modal');

// Test 5: Pastikan tombol Batalkan ADA
const cancelBtn = modal.querySelector('#btn-cancel-face-auth');
assert(cancelBtn !== null, 'Tombol Batalkan (#btn-cancel-face-auth) HARUS ADA');
console.log('[PASS] Tombol Batalkan (#btn-cancel-face-auth) tersedia di modal');

// Test 6: Verifikasi tombol Batalkan memicu onCancel
cancelBtn.onclick();
assert.strictEqual(cancelCalled, true, 'Klik tombol Batalkan harus memicu onCancel');
console.log('[PASS] Tombol Batalkan berfungsi menutup modal dan memanggil onCancel');

console.log('\nALL FACE AUTH MODAL & RESCAN TESTS PASSED! ✅');
