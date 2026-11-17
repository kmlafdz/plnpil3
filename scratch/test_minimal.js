const storage = {};
global.localStorage = { getItem: (k) => storage[k] || null, setItem: (k, v) => { storage[k] = String(v); }, removeItem: (k) => { delete storage[k]; } };
global.CustomEvent = class CustomEvent { constructor(name, opts) { this.name = name; this.opts = opts; } };
global.window = { localStorage: global.localStorage, dispatchEvent: () => {}, addEventListener: () => {}, App: { showToast: () => {}, showModal: () => {} } };

require('../js/data.js');
require('../js/store.js');
const store = window.appStore;

const r = store.addRespondent({
  nip: '8822334455',
  nama: 'Ahmad Santoso Excel',
  unit: 'PLN UID Sumsel'
});

const userDirect = store.users.find(u => u.nip === '8822334455');
console.log('Direct user object in store.users:', userDirect.nip, userDirect.nama);

userDirect.nama = 'DIUBAH LANGSUNG';
console.log('After direct mutation in store.users:', userDirect.nama);
console.log('In store.users array:', store.users.find(u => u.nip === '8822334455').nama);

const res = store.updateRespondent(r.id, {
  nama: 'Ahmad Santoso (Promosi Supervisor)'
});
console.log('Result from updateRespondent:', res.nama);
console.log('In store.users after updateRespondent:', store.users.find(u => u.nip === '8822334455').nama);
