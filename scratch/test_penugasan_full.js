/**
 * Test Penugasan & Impor Excel Logic
 */
const fs = require('fs');
const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Mock window
global.CustomEvent = class CustomEvent { constructor(name, opts) { this.name = name; this.opts = opts; } };
global.window = {
  localStorage: global.localStorage,
  dispatchEvent: () => {},
  addEventListener: () => {},
  App: {
    showToast: (msg, type) => console.log(`[TOAST ${type || 'info'}]: ${msg}`),
    showModal: (cfg) => console.log(`[MODAL]: ${cfg.title}`)
  }
};

// Load data.js and store.js
require('../js/data.js');
require('../js/store.js');

const store = window.appStore;
console.log('--- TEST 1: Initial Respondents Count ---');
// Catatan: Data dummy telah dihapus sebelumnya sesuai instruksi pengguna, sehingga respondents awal bisa 0.
if (store.getRespondents().length === 0) {
  store.addRespondent({
    nama: 'Peserta Baseline 1',
    nip: '1234567890',
    jabatan: 'Officer Distribusi',
    unit: 'PLN UID Sumsel',
    updlId: 'updl-plb',
    programId: 'prog-pil-susut',
    periodId: 'period-2026-1',
    modules: ['A', 'B']
  });
}
const initialRespondents = store.getRespondents();
console.log('Baseline count:', initialRespondents.length);
assert(initialRespondents.length > 0, 'Harus memiliki baseline responden');

const initialIds = new Set(initialRespondents.map(r => r.id));

console.log('--- TEST 2: Menambahkan Responden Manual (Non-destructive) ---');
const newResp = store.addRespondent({
  nama: 'Budi Santoso Test',
  nip: '9988776655',
  jabatan: 'Junior Engineer Test',
  unit: 'PLN UID Sumsel',
  updlId: 'updl-plb',
  programId: 'prog-pil-susut',
  periodId: 'period-2026-1',
  modules: ['A', 'B'],
  password: 'pln123'
});

assert(newResp.id, 'Responden baru harus punya ID');
assert.strictEqual(store.getRespondents().length, initialRespondents.length + 1, 'Panjang responden bertambah 1');

// Pastikan data lama tidak terhapus
initialIds.forEach(oldId => {
  assert(store.getRespondents().some(r => r.id === oldId), `Data lama dengan id ${oldId} harus tetap ada`);
});
console.log('PASSED: Data lama tetap utuh dan data baru bertambah');

console.log('--- TEST 3: Update Responden (Logika Timpa / Overwrite) ---');
const updated = store.updateRespondent(newResp.id, {
  nama: 'Budi Santoso Updated',
  jabatan: 'Senior Engineer Test',
  modules: ['A', 'B', 'C']
});

assert.strictEqual(updated.nama, 'Budi Santoso Updated');
assert.strictEqual(updated.jabatan, 'Senior Engineer Test');
assert.deepStrictEqual(updated.modules, ['A', 'B', 'C']);
console.log('PASSED: Update respondent (timpa) berhasil memperbarui field');

console.log('--- TEST 4: Simulasi Impor Excel (Skip Duplikat vs Timpa) ---');
// Skenario file excel berisi 2 baris:
// 1. NIP 9988776655 (Duplikat, nama beda: Budi Santoso Overwritten)
// 2. NIP 1122334455 (Baru: Siti Aminah Baru)

const rowsToImport = [
  { nip: '9988776655', nama: 'Budi Santoso Overwritten', jabatan: 'Lead Specialist', unit: 'PLN UID Sumsel', modules: ['A', 'C'] },
  { nip: '1122334455', nama: 'Siti Aminah Baru', jabatan: 'Officer Logistik', unit: 'PLN ULP Rivai', modules: ['A', 'B', 'C'] }
];

// Deteksi duplikat
const currentRespondents = store.getRespondents();
const dupMap = new Map();
currentRespondents.forEach(r => {
  if (r.nip) dupMap.set(String(r.nip).toLowerCase().trim(), r.id);
});

let detectedNew = [];
let detectedDup = [];

rowsToImport.forEach(row => {
  const existingId = dupMap.get(String(row.nip).toLowerCase().trim());
  if (existingId) {
    detectedDup.push({ ...row, existingId });
  } else {
    detectedNew.push(row);
  }
});

assert.strictEqual(detectedNew.length, 1, 'Harus terdeteksi 1 baris baru');
assert.strictEqual(detectedDup.length, 1, 'Harus terdeteksi 1 baris duplikat');
console.log('PASSED: Deteksi data baru & duplikat akurat');

// Case A: Mode Skip
console.log('--- Simulasi Mode SKIP ---');
const beforeSkipCount = store.getRespondents().length;
let addedSkipCount = 0;
let skippedCount = 0;

// Jalankan mode skip
detectedNew.forEach(r => {
  store.addRespondent({ ...r, updlId: 'updl-plb', programId: 'prog-pil-susut', periodId: 'period-2026-1' });
  addedSkipCount++;
});
skippedCount = detectedDup.length;

assert.strictEqual(store.getRespondents().length, beforeSkipCount + 1);
assert.strictEqual(addedSkipCount, 1);
assert.strictEqual(skippedCount, 1);
// Pastikan responden 9988776655 TIDAK ditimpa
const respNotOverwritten = store.getRespondents().find(r => r.nip === '9988776655');
assert.strictEqual(respNotOverwritten.nama, 'Budi Santoso Updated');
console.log('PASSED: Mode SKIP mempertahankan data lama');

// Case B: Mode TIMPA / OVERWRITE
console.log('--- Simulasi Mode TIMPA ---');
let overwrittenCount = 0;
detectedDup.forEach(dup => {
  store.updateRespondent(dup.existingId, {
    nama: dup.nama,
    jabatan: dup.jabatan,
    modules: dup.modules
  });
  overwrittenCount++;
});

assert.strictEqual(overwrittenCount, 1);
const respNowOverwritten = store.getRespondents().find(r => r.nip === '9988776655');
assert.strictEqual(respNowOverwritten.nama, 'Budi Santoso Overwritten');
assert.strictEqual(respNowOverwritten.jabatan, 'Lead Specialist');
assert.deepStrictEqual(respNowOverwritten.modules, ['A', 'C']);
console.log('PASSED: Mode TIMPA berhasil memperbarui data duplikat tanpa duplikasi record');

console.log('--- TEST 5: Sinkronisasi UPDL -> Unit ---');
store.addUnit({
  updlId: 'updl-plb',
  kode: 'ULP-PLB-TEST',
  nama: 'PLN ULP Palembang Test',
  status: 'AKTIF'
});
const updlUnits = store.getUnitsByUpdl('updl-plb', true);
assert(updlUnits.length > 0, 'Harus ada unit kerja di updl-plb');
updlUnits.forEach(u => {
  assert.strictEqual(u.updlId, 'updl-plb', 'Semua unit harus milik updl-plb');
});
console.log('PASSED: getUnitsByUpdl menyaring unit kerja dengan benar');

console.log('ALL TESTS PASSED SUCCESSFULLY! 🚀');
