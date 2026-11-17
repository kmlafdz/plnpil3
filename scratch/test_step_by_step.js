const assert = require('assert');

const storage = {};
global.localStorage = { 
  getItem: (k) => storage[k] || null, 
  setItem: (k, v) => { storage[k] = String(v); }, 
  removeItem: (k) => { delete storage[k]; } 
};
global.CustomEvent = class CustomEvent { constructor(name, opts) { this.name = name; this.opts = opts; } };
global.window = { 
  localStorage: global.localStorage, 
  dispatchEvent: () => {}, 
  addEventListener: () => {}, 
  App: { showToast: () => {}, showModal: () => {} } 
};

require('../js/data.js');
require('../js/store.js');
const store = window.appStore;

const nipExcel = '8822334455';
const namaExcel = 'Ahmad Santoso Excel';

const respBaru = store.addRespondent({
  nip: nipExcel,
  nama: namaExcel,
  jabatan: 'Junior Engineer Distribusi',
  unit: 'PLN UID Sumsel',
  updlId: 'updl-plb',
  programId: 'prog-pil-susut',
  periodId: 'period-2026-1',
  modules: ['A', 'B'],
  password: 'pln123'
});

console.log('respBaru.id is:', respBaru.id);

const nipKemal = '9519001MK';
const namaKemal = 'Muhammad Kemal';

const userKemal = store.addUser({
  nip: nipKemal,
  nama: namaKemal,
  jabatan: 'Officer Sistem Informasi',
  unitName: 'PLN UP3 Metro',
  updlId: 'updl-plb',
  role: 'peserta',
  password: 'pln123'
});

console.log('Before update, respondents are:', store.respondents.map(r => ({ id: r.id, nama: r.nama, nip: r.nip })));

const updatedResp = store.updateRespondent(respBaru.id, {
  nama: 'Ahmad Santoso (Promosi Supervisor)',
  jabatan: 'Supervisor Pemeliharaan',
  unit: 'PLN ULP Rivai'
});

console.log('updatedResp is:', updatedResp ? { id: updatedResp.id, nama: updatedResp.nama } : 'NULL');

const userAfter = store.getUsers().find(u => u.nip === nipExcel);
console.log('userAfter is:', userAfter ? { nip: userAfter.nip, nama: userAfter.nama } : 'NOT FOUND');
