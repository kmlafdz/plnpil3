/**
 * Test: Add Bank Butir & Dynamic Penugasan Flow Verification
 */
const assert = require('assert');

// Mock browser environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

global.window = {
  localStorage: global.localStorage,
  dispatchEvent: () => {},
  addEventListener: () => {},
  App: {
    showToast: (msg, type) => { console.log(`[Toast ${type}]:`, msg); },
    showModal: () => ({ querySelector: () => null })
  }
};

require('../js/data.js');
require('../js/store.js');
const store = window.appStore;

async function runTest() {
  console.log('=== SETUP: Inisialisasi Master Data (UPDL & Program) ===');
  const updlPlb = store.addUpdl({ id: 'updl-plb', nama: 'PLN UPDL Palembang', kode: 'PLB', kota: 'Palembang' });
  const updlSmg = store.addUpdl({ id: 'updl-smg', nama: 'PLN UPDL Semarang', kode: 'SMG', kota: 'Semarang' });
  
  store.addUnit({ updlId: updlPlb.id, nama: 'PLN UP3 Metro', kode: 'UP3-MTR' });
  store.addUnit({ updlId: updlPlb.id, nama: 'PLN ULP Bandarjaya', kode: 'ULP-BDJ' });
  store.addUnit({ updlId: updlSmg.id, nama: 'PLN UP3 Semarang', kode: 'UP3-SMG' });

  const progSusut = store.addProgram({
    id: 'prog-pil-susut',
    kode: 'PIL-SUSUT',
    nama: 'PLN Impact Lab Penurunan Susut Distribusi',
    updlId: updlPlb.id,
    deskripsi: 'Program evaluasi efektivitas penurunan susut distribusi level 3'
  });

  const progK3 = store.addProgram({
    id: 'prog-k3-distribusi',
    kode: 'K3-DIST',
    nama: 'PLN Impact Lab Budaya K3L & Zero Accident Distribusi',
    updlId: updlPlb.id,
    deskripsi: 'Program implementasi keselamatan kerja distribusi'
  });

  console.log('Programs terdaftar:', store.getPrograms().map(p => p.nama));

  console.log('\n=== TEST 1: Add Bank Butir Baru dengan Program Fleksibel & Modul Awal ===');
  console.log('Target Program:', progK3.id, progK3.nama);

  const newBB = store.addBankButir({
    programId: progK3.id,
    nama: 'Bank Butir K3 & Manuver Kubikel 2026',
    kode: 'BB-K3-2026',
    deskripsi: 'Instrumen evaluasi perilaku keselamatan manuver dan proteksi distribusi',
    status: 'AKTIF',
    initialSectionTitle: 'Kepatuhan SOP & LOTO Manuver Kubikel',
    initialKodeDiklat: 'D.1.172.015.1',
    initialKeybe: '1.7.2.K3L.LOT.1.1'
  });

  assert(newBB && newBB.id, 'Bank Butir harus berhasil dibuat dan memiliki ID');
  assert.strictEqual(newBB.programId, progK3.id, 'Program ID harus cocok dengan yang dipilih');
  assert(newBB.sections && newBB.sections.A, 'Section A harus dibuat');
  assert.strictEqual(newBB.sections.A.title, 'Kepatuhan SOP & LOTO Manuver Kubikel');
  assert.strictEqual(newBB.sections.A.kodeDiklat, 'D.1.172.015.1');
  console.log('Bank butir berhasil dibuat:', newBB.id, newBB.nama);

  // Tambahkan 2 butir ke Section A
  store.addBankButirItem(newBB.id, {
    id: 'A1',
    partKey: 'A',
    perilaku: 'Saya menerapkan prosedur LOTO sebelum membuka pintu kubikel 20 kV.',
    contohBukti: 'Lembar kerja LOTO',
    kompetensi: 'Isolasi Energi'
  });
  store.addBankButirItem(newBB.id, {
    id: 'A2',
    partKey: 'A',
    perilaku: 'Saya memeriksa tegangan sisa dengan tester tegangan terkalibrasi.',
    contohBukti: 'Checklist uji tegangan',
    kompetensi: 'Pengujian Tegangan'
  });

  // Tambahkan Section B ke Bank Butir tersebut
  store.addBankButirItem(newBB.id, {
    id: 'B1',
    partKey: 'B',
    partTitle: 'Pemeriksaan APD & Komunikasi Manuver',
    kodeDiklat: 'D.1.172.016.2',
    keybe: '1.7.2.K3L.APD.1.2',
    perilaku: 'Saya memastikan seluruh tim mengenakan sarung tangan 20kV tahan uji.',
    contohBukti: 'Foto dan checklist APD',
    kompetensi: 'Kepatuhan APD'
  });

  const allItems = store.getAllBankButirItems(newBB.id);
  assert.strictEqual(allItems.length, 3, 'Harus ada 3 butir di bank butir baru');
  console.log(`Total butir di katalog ${newBB.nama}: ${allItems.length}`);

  console.log('\n=== TEST 2: Periode Evaluasi Sesuai Program ===');
  // Pastikan program K3 memiliki periode
  const existingPeriods = store.getPeriods(progK3.id);
  console.log(`Periode terikat ke ${progK3.id}: ${existingPeriods.length}`);
  if (existingPeriods.length === 0) {
    store.addPeriod({
      programId: progK3.id,
      nama: 'Periode K3 Semester 1 2026',
      status: 'AKTIF',
      tanggalMulai: '2026-03-01',
      tenggatPengisian: '2026-04-30'
    });
  }

  const progPeriods = store.getPeriods(progK3.id);
  assert(progPeriods.length > 0, 'Harus ada periode evaluasi untuk program K3');
  const activePeriod = store.getActivePeriod(progK3.id);
  assert(activePeriod && activePeriod.status === 'AKTIF', 'Periode aktif harus ditemukan');
  console.log('Periode aktif terpilih:', activePeriod.nama, `[Status: ${activePeriod.status}]`);

  console.log('\n=== TEST 3: Tambah Penugasan dengan Bank Butir & Modul Terpilih ===');
  const allUpdls = store.getUpdls();
  const targetUpdl = allUpdls.find(u => u.id === 'updl-plb') || allUpdls[0];
  const unitsInUpdl = store.getUnitsByUpdl(targetUpdl.id);
  const targetUnit = unitsInUpdl[0] ? unitsInUpdl[0].nama : 'PLN UP3 Metro';

  // Tambah peserta dengan hanya memilih Bagian A dari Bank Butir baru
  const resp1 = store.addRespondent({
    nama: 'Rizky Alamsyah, S.T.',
    nip: '9921001K3',
    jabatan: 'Pelaksana Manuver Gardu',
    unit: targetUnit,
    updlId: targetUpdl.id,
    programId: progK3.id,
    periodId: activePeriod.id,
    bankButirId: newBB.id,
    modules: ['A'], // Hanya modul A (2 butir)
    password: 'pln123',
    atasan: {
      nama: 'Ir. Surya Darmawan',
      nip: '8204991A',
      jabatan: `Manager ${targetUnit}`
    }
  });

  assert(resp1 && resp1.id, 'Peserta 1 harus berhasil ditugaskan');
  assert.strictEqual(resp1.programId, progK3.id, 'Program harus sesuai prog-k3');
  assert.strictEqual(resp1.periodId, activePeriod.id, 'Periode harus sesuai periode aktif');
  assert.strictEqual(resp1.bankButirId, newBB.id, 'Bank Butir ID harus tersimpan');
  assert.deepStrictEqual(resp1.modules, ['A'], 'Modul harus [A]');
  assert.strictEqual(resp1.itemCount, 2, 'ItemCount harus 2 (hanya butir di Bagian A)');
  console.log('Peserta 1 berhasil ditugaskan dengan 2 butir (Bagian A):', resp1.nama);

  // Tambah peserta kedua dengan memilih Bagian A dan B (total 3 butir)
  const resp2 = store.addRespondent({
    nama: 'Dewi Lestari',
    nip: '9820002K3',
    jabatan: 'Koordinator K3 Lapangan',
    unit: targetUnit,
    updlId: targetUpdl.id,
    programId: progK3.id,
    periodId: activePeriod.id,
    bankButirId: newBB.id,
    modules: ['A', 'B'], // Modul A dan B (2 + 1 = 3 butir)
    password: 'pln123'
  });

  assert.strictEqual(resp2.itemCount, 3, 'ItemCount peserta 2 harus 3 (Bagian A + Bagian B)');
  assert.deepStrictEqual(resp2.modules, ['A', 'B'], 'Modul harus [A, B]');
  console.log('Peserta 2 berhasil ditugaskan dengan 3 butir (Bagian A & B):', resp2.nama);

  console.log('\n=== TEST 4: Pemilihan UPDL Fleksibel & Reaktif Unit ===');
  // Pilih UPDL lain
  const otherUpdl = allUpdls.find(u => u.id !== targetUpdl.id) || targetUpdl;
  const otherUnits = store.getUnitsByUpdl(otherUpdl.id);
  console.log(`Units di ${otherUpdl.nama}: ${otherUnits.length} unit`);
  assert(Array.isArray(otherUnits), 'Units di UPDL lain harus berupa array');

  console.log('\n=== SEMUA PENGUJIAN INTEGRASI BERHASIL (100% PASS) ===');
}

runTest();
