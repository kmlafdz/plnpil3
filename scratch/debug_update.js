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

const r = store.addRespondent({ nip: '882233', nama: 'Nama Awal', unit: 'Unit A' });

console.log('store.users list length:', store.users.length);
store.users.forEach(u => {
  console.log('USER:', u.nip, u.nama, 'respondentId:', u.respondentId, 'role:', u.role);
});

console.log('Testing find in updateRespondent:');
const numId = Number(r.id);
const existing = r;
const foundUser = (store.users || []).find(u => {
  console.log('Checking user:', u.nip, 'respondentId === numId?', u.respondentId === numId, 'nip match?', (u.role === 'peserta' && u.nip && existing.nip && u.nip.toLowerCase() === existing.nip.toLowerCase()));
  return u.respondentId === numId || 
    (u.role === 'peserta' && u.nip && existing.nip && u.nip.toLowerCase() === existing.nip.toLowerCase());
});
console.log('Found user is:', foundUser ? foundUser.nama : 'NOT FOUND');
