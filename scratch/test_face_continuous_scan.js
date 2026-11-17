/**
 * Test Suite: Verifikasi Pemindaian Wajah Berkelanjutan (Continuous Scanning Tanpa Limit Gagal)
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
  crypto: {
    getRandomValues(arr) {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    }
  },
  dispatchEvent() {},
  CustomEvent: class {}
};
global.window = window;
global.localStorage = window.localStorage;
global.crypto = window.crypto;

// Load face_auth.js
eval(fs.readFileSync('js/face_auth.js', 'utf8'));

console.log('=== TEST SUITE: CONTINUOUS FACE SCAN (NO FAILURE LIMIT) ===');

const manager = window.FaceAuthManager;
assert(manager, 'FaceAuthManager must be instantiated');

// Test 1: Check initial rate limit
const initialStatus = manager.checkRateLimit('admin-1');
console.log('1. Initial checkRateLimit:', initialStatus);
assert.strictEqual(initialStatus.allowed, true);
assert.strictEqual(initialStatus.remaining, Infinity);
console.log('[PASS] Rate limit is disabled, remaining is Infinity');

// Test 2: Simulate 10 failed scans (previously capped at 3)
for (let i = 1; i <= 10; i++) {
  manager.recordFailedAttempt('admin-1');
}

const statusAfter10 = manager.checkRateLimit('admin-1');
console.log('2. Status after 10 failed attempts:', statusAfter10);
assert.strictEqual(statusAfter10.allowed, true, 'checkRateLimit must still be allowed after 10 attempts');
assert.strictEqual(statusAfter10.remaining, Infinity);
console.log('[PASS] Continuous scanning remains active without locking out');

// Test 3: Check reset attempts
manager.resetAttempts('admin-1');
const statusAfterReset = manager.checkRateLimit('admin-1');
assert.strictEqual(statusAfterReset.allowed, true);
console.log('[PASS] Reset attempts functions properly');

// Test 4: Verify verifyFaceMatch threshold
const dummyVector = new Array(128).fill(0.1);
const matchResult = manager.verifyFaceMatch({
  featureVector: dummyVector,
  algorithm: 'pln-facenet-v2'
}, dummyVector);
console.log('4. Face match test result:', matchResult);
assert.strictEqual(matchResult.success, true);
assert.strictEqual(matchResult.similarity, 1);
console.log('[PASS] Exact face match succeeds');

console.log('\nALL CONTINUOUS FACE SCANNING TESTS PASSED! ✅');
