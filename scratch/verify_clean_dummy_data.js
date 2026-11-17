// Mock browser environment
const localStorageData = {};
global.localStorage = {
  getItem: (key) => localStorageData[key] || null,
  setItem: (key, val) => { localStorageData[key] = String(val); },
  removeItem: (key) => { delete localStorageData[key]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

global.window = {
  MASTER_DATA: {},
  dispatchEvent: () => {},
  CustomEvent: class {}
};

// Simulasi data dummy lama tersimpan di localStorage (kondisi sebelum update)
localStorage.setItem('pln_eval3_updls_v1', JSON.stringify([{ id: 'updl-plb', nama: 'UPDL Palembang' }]));
localStorage.setItem('pln_eval3_units_v1', JSON.stringify([{ id: 'unit-mtr', nama: 'UP3 Metro', updlId: 'updl-plb' }]));
localStorage.setItem('pln_eval3_programs_v1', JSON.stringify([{ id: 'prog-pil-susut', nama: 'PIL Susut' }]));
localStorage.setItem('pln_eval3_periods_v1', JSON.stringify([{ id: 'period-2026-s1', nama: 'Siklus 1' }]));
localStorage.setItem('pln_eval3_resp_v1', JSON.stringify([{ id: 1, nip: '9518001Z', nama: 'Bambang Sudarsono', updlId: 'updl-plb' }]));
localStorage.setItem('pln_eval3_evaluations_v1', JSON.stringify({ '1': { status: 'SELESAI' } }));
localStorage.setItem('pln_eval3_users_v1', JSON.stringify([
  { id: 'usr-admin-1', nip: '8909014M', nama: 'Akkhita' },
  { id: 'usr-mgr-unit-mtr', nip: '8508111A', nama: 'Bambang Triyono' },
  { id: 'usr-dev-kmlafdz', nip: 'kmlafdz', nama: 'Developer Utama', role: 'developer' }
]));

// Load MASTER_DATA and Store
require('../js/data.js');
require('../js/store.js');

const store = window.appStore;

console.log('=== HASIL VERIFIKASI PEMBERSIHAN DATA DUMMY ===');
console.log('Total UPDL:', store.getUpdls().length, '(Expected: 0)');
console.log('Total Unit:', store.getUnits().length, '(Expected: 0)');
console.log('Total Program:', store.getPrograms().length, '(Expected: 0)');
console.log('Total Periode:', store.getPeriods().length, '(Expected: 0)');
console.log('Total Responden (Peserta):', store.getRespondents().length, '(Expected: 0)');
console.log('Evaluations keys:', Object.keys(store.evaluations).length, '(Expected: 0)');

const users = store.getUsers();
console.log('Total User:', users.length, '(Expected: 2)');
users.forEach(u => console.log(` - NIP: ${u.nip}, Role: ${u.role}, Password: ${u.password}`));

const isClean = 
  store.getUpdls().length === 0 &&
  store.getUnits().length === 0 &&
  store.getPrograms().length === 0 &&
  store.getPeriods().length === 0 &&
  store.getRespondents().length === 0 &&
  Object.keys(store.evaluations).length === 0 &&
  users.length === 2 &&
  users.some(u => u.nip.toLowerCase() === 'kmlafdz' && u.role === 'developer') &&
  users.some(u => u.nip.toLowerCase() === 'adminpusat' && u.role === 'admin');

if (isClean) {
  console.log('\n[PASS] SELURUH DATA DUMMY BERHASIL DIBERSIHKAN DENGAN SEMPURNA!');
  process.exit(0);
} else {
  console.error('\n[FAIL] Masih ada data dummy yang belum bersih.');
  process.exit(1);
}
