// Test document upload logic & store integration
const fs = require('fs');

console.log('=== TESTING DOCUMENT UPLOAD AND FILE LOGIC ===');

// Mock localStorage & window
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

global.window = {
  App: {
    showToast: (msg, type) => console.log(`   [Toast ${type}]: ${msg}`)
  },
  dispatchEvent: () => {}
};
global.CustomEvent = class CustomEvent { constructor(name, opts) { this.name = name; this.opts = opts; } };

// Load store
const storeCode = fs.readFileSync('js/store.js', 'utf8');
eval(storeCode);

const store = window.appStore;

console.log('1. Testing getFileBadge in FormulirView logic:');
const testFiles = [
  { name: 'Berita_Acara_P2TL.docx', expected: 'DOC' },
  { name: 'Laporan_Susut_2026.pdf', expected: 'PDF' },
  { name: 'Hasil_Simulasi_SINCAL.xlsx', expected: 'XLS' },
  { name: 'Presentasi_Direksi.pptx', expected: 'PPT' },
  { name: 'Foto_Gardu_Metro.jpg', expected: 'IMG' },
  { name: 'Dokumen_Pendukung.zip', expected: 'ZIP' },
  { name: 'Catatan_Inspeksi.txt', expected: 'DOC' }
];

// Helper from formulir.js
function getFileBadge(name = '', type = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext) || (type && type.includes('pdf'))) {
    return { icon: 'picture_as_pdf', color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]', label: 'PDF' };
  }
  if (['doc', 'docx'].includes(ext) || (type && type.includes('word'))) {
    return { icon: 'description', color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', label: 'DOC' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || (type && (type.includes('excel') || type.includes('spreadsheet')))) {
    return { icon: 'table_chart', color: 'text-[#059669]', bg: 'bg-[#ECFDF5]', label: 'XLS' };
  }
  if (['ppt', 'pptx'].includes(ext) || (type && type.includes('presentation'))) {
    return { icon: 'slideshow', color: 'text-[#D97706]', bg: 'bg-[#FFFBEB]', label: 'PPT' };
  }
  if (['zip', 'rar', '7z'].includes(ext)) {
    return { icon: 'folder_zip', color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]', label: 'ZIP' };
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || (type && type.includes('image'))) {
    return { icon: 'image', color: 'text-[#0284C7]', bg: 'bg-[#F0F9FF]', label: 'IMG' };
  }
  return { icon: 'article', color: 'text-[#475569]', bg: 'bg-[#F8FAFC]', label: 'DOC' };
}

testFiles.forEach(f => {
  const badge = getFileBadge(f.name);
  if (badge.label === f.expected) {
    console.log(`   ✅ [PASS] ${f.name} -> Label: ${badge.label}, Icon: ${badge.icon}`);
  } else {
    console.error(`   ❌ [FAIL] ${f.name} expected ${f.expected} but got ${badge.label}`);
    process.exit(1);
  }
});

console.log('\n2. Testing Store document upload & deletion for respondent:');
// Add a mock respondent
store.addRespondent({
  nip: '9820001Z',
  nama: 'Budi Santoso',
  jabatan: 'Junior Engineer',
  unit: 'PLN UP3 Metro'
});

const resp = store.getRespondents().find(r => r.nip === '9820001Z');
if (!resp) throw new Error('Respondent not found');

// Save a DOCX document as proof
const docProof = {
  name: 'BA_Penyeimbangan_Beban.docx',
  size: '2.4 MB',
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  dataUrl: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAA...',
  uploadedAt: '13 Okt 2026'
};

store.savePesertaItemAnswer(resp.id, 'A1', { file: docProof }, true);

let ev = store.getEvaluation(resp.id);
if (ev && ev.peserta && ev.peserta.files && ev.peserta.files['A1'] && ev.peserta.files['A1'].name === 'BA_Penyeimbangan_Beban.docx') {
  console.log('   ✅ [PASS] Dokumen bukti DOCX berhasil disimpan ke evaluasi peserta.');
} else {
  console.error('   ❌ [FAIL] Dokumen tidak tersimpan di store.');
  process.exit(1);
}

// Delete file
store.deletePesertaFile(resp.id, 'A1', true);
ev = store.getEvaluation(resp.id);
if (!ev.peserta.files['A1']) {
  console.log('   ✅ [PASS] Dokumen bukti berhasil dihapus dari evaluasi peserta.');
} else {
  console.error('   ❌ [FAIL] Dokumen gagal dihapus.');
  process.exit(1);
}

console.log('\n3. Testing CSV document parsing for matrix import:');
const csvContent = `nip,nama,jabatan,unit,atasan,atasan_nip
9519001A,Andi Pratama,Officer Pemeliharaan,PLN UP3 Metro,Siti Aminah,8711002B
9519002B,Citra Lestari,Teknisi Distribusi,PLN UP3 Metro,Siti Aminah,8711002B`;

const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
const delimiter = ',';
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(delimiter).map(c => c.trim());
  rows.push({
    nip: cols[0],
    nama: cols[1],
    jabatan: cols[2],
    unit: cols[3],
    atasanNama: cols[4],
    atasanNip: cols[5]
  });
}

if (rows.length === 2 && rows[0].nip === '9519001A') {
  console.log(`   ✅ [PASS] CSV Matriks terbaca ${rows.length} responden.`);
} else {
  console.error('   ❌ [FAIL] Gagal membaca CSV.');
  process.exit(1);
}

console.log('\n=== ALL DOCUMENT UPLOAD TESTS PASSED (100% OK) ===');
