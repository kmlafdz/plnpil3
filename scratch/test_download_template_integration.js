/**
 * Test: Download Template Integration & Parsing Compatibility
 */
const assert = require('assert');

// Mock browser environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

let capturedDownloads = [];
global.document = {
  createElement: (tag) => {
    return {
      tagName: tag,
      href: '',
      download: '',
      click: function () {
        capturedDownloads.push({ href: this.href, download: this.download });
      }
    };
  },
  body: {
    appendChild: () => {},
    removeChild: () => {}
  }
};
global.URL = {
  createObjectURL: (blob) => 'blob://' + Math.random(),
  revokeObjectURL: () => {}
};
global.Blob = class Blob {
  constructor(content, opts) {
    this.content = content;
    this.opts = opts;
  }
};

let writtenWorkbooks = [];
global.window = {
  localStorage: global.localStorage,
  App: {
    showToast: (msg, type) => { console.log(`[Toast ${type}]:`, msg); },
    showModal: () => document.createElement('div')
  },
  XLSX: {
    utils: {
      book_new: () => ({ SheetNames: [], Sheets: {} }),
      aoa_to_sheet: (data) => ({ __data: data }),
      book_append_sheet: (wb, ws, name) => {
        wb.SheetNames.push(name);
        wb.Sheets[name] = ws;
      },
      sheet_to_json: (ws, opts) => ws.__data || []
    },
    writeFile: (wb, filename) => {
      writtenWorkbooks.push({ wb, filename });
    }
  }
};

require('../js/data.js');
require('../js/store.js');
require('../js/views/penugasan.js');

async function runTest() {
  console.log('--- TEST 1: downloadExcelTemplateMatrix() ---');
  assert(typeof window.PenugasanView.downloadExcelTemplateMatrix === 'function', 'Method downloadExcelTemplateMatrix harus ada');
  
  window.PenugasanView.downloadExcelTemplateMatrix();
  assert(writtenWorkbooks.length === 1, 'File XLSX harus berhasil digenerate');
  const generated = writtenWorkbooks[0];
  assert(generated.filename === 'Template_Matriks_Penugasan_Evaluasi_Level_3.xlsx', 'Nama file harus Template_Matriks_Penugasan_Evaluasi_Level_3.xlsx');
  
  const wb = generated.wb;
  assert(wb.SheetNames.includes('DAFTAR RESPONDEN'), 'Sheet DAFTAR RESPONDEN harus ada');
  assert(wb.SheetNames.includes('PETUNJUK PENGISIAN'), 'Sheet PETUNJUK PENGISIAN harus ada');

  const sheetRespondenData = wb.Sheets['DAFTAR RESPONDEN'].__data;
  const header = sheetRespondenData[0];
  console.log('Header DAFTAR RESPONDEN:', header);
  assert.deepStrictEqual(
    header,
    ['No', 'NIP', 'Nama Peserta', 'Jabatan', 'Unit Kerja', 'Bagian A', 'Bagian B', 'Bagian C'],
    'Header kolom harus 100% sesuai spesifikasi sistem'
  );

  const sampleRows = sheetRespondenData.slice(1);
  assert(sampleRows.length >= 5, 'Minimal harus ada 5 baris sample responden');
  console.log(`Sample rows count: ${sampleRows.length}`);

  console.log('--- TEST 2: Parsing Compatibility dengan Parser Penugasan ---');
  // Simulasikan parser penugasan membaca sheet DAFTAR RESPONDEN ini
  const rawRows = sheetRespondenData;
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
    const rowStr = (rawRows[i] || []).map(c => String(c || '').toLowerCase()).join(' ');
    if (rowStr.includes('nip') && (rowStr.includes('nama') || rowStr.includes('peserta'))) {
      headerIndex = i;
      break;
    }
  }
  assert(headerIndex === 0, 'Header harus terdeteksi di index 0');

  const parsed = [];
  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    let nip = String(row[1] || '').trim();
    let nama = String(row[2] || '').trim();
    let jabatan = String(row[3] || '').trim();
    let unit = String(row[4] || '').trim();
    const modA = !!(row[5] && String(row[5]).trim() !== '' && String(row[5]).trim() !== '0');
    const modB = !!(row[6] && String(row[6]).trim() !== '' && String(row[6]).trim() !== '0');
    const modC = !!(row[7] && String(row[7]).trim() !== '' && String(row[7]).trim() !== '0');

    const modules = [];
    if (modA || (!modB && !modC)) modules.push('A');
    if (modB) modules.push('B');
    if (modC) modules.push('C');

    parsed.push({ nip, nama, jabatan, unit, modules });
  }

  assert.strictEqual(parsed.length, 5, 'Semua 5 sample harus sukses diparse');
  assert.strictEqual(parsed[0].nama, 'Ahmad Santoso, S.T.');
  assert.deepStrictEqual(parsed[0].modules, ['A', 'B', 'C'], 'Peserta 1 modul A, B, C');
  assert.strictEqual(parsed[1].nama, 'Gita Permatasari');
  assert.deepStrictEqual(parsed[1].modules, ['A', 'B'], 'Peserta 2 modul A, B');
  assert.strictEqual(parsed[2].nama, 'Budi Prasetyo, A.Md.');
  assert.deepStrictEqual(parsed[2].modules, ['A'], 'Peserta 3 modul A');
  console.log('Hasil parse contoh data:', parsed);

  console.log('--- TEST 3: Fallback CSV Template ---');
  window.PenugasanView.downloadCsvFallbackTemplate();
  assert(capturedDownloads.length >= 1, 'Download CSV fallback harus terpanggil');
  const lastDl = capturedDownloads[capturedDownloads.length - 1];
  assert.strictEqual(lastDl.download, 'Template_Matriks_Penugasan_Evaluasi_Level_3.csv');
  console.log('CSV fallback download:', lastDl.download);

  console.log('=== SEMUA PENGUJIAN TEMPLATE SUKSES (100% PASS) ===');
}

runTest();
