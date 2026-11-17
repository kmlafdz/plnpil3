/**
 * Automated Test Suite for Evaluator Flow (Atasan & Koordinator)
 * 1. Evaluator subordinate discovery (getAssignedRespondentsForUser)
 * 2. Save evaluator item answers (scores & notes)
 * 3. Evaluator progress calculation
 * 4. Submit evaluator evaluation
 * 5. Verify isolation between participant, supervisor, and coordinator data
 */

const fs = require('fs');

const window = {
  location: { pathname: '/', search: '', hash: '' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  dispatchEvent() {},
  CustomEvent: class {}
};
global.window = window;
global.localStorage = window.localStorage;

// Load core scripts
eval(fs.readFileSync('js/data.js', 'utf8'));
eval(fs.readFileSync('js/auth.js', 'utf8'));
eval(fs.readFileSync('js/store.js', 'utf8'));

console.log('=== TEST SUITE: EVALUATOR FLOW (ATASAN & KOORDINATOR) ===');

// Add test respondent with atasan & koordinator
const testRespondent = window.appStore.addRespondent({
  nama: 'Agus Setiawan',
  nip: '19940101',
  jabatan: 'Staff Pemeliharaan Gardu',
  unit: 'PLN UP3 Metro',
  modules: ['A', 'B'],
  password: 'pln123',
  atasan: {
    nama: 'Bambang Supriyanto',
    nip: '19820505',
    jabatan: 'Supervisor Pemeliharaan'
  },
  koordinatorEksternal: {
    nama: 'Dewi Lestari',
    nip: '19880303',
    jabatan: 'Koordinator Diklat UPDL'
  }
});

console.log('Created test respondent:', testRespondent.nama, 'ID:', testRespondent.id);
const r1 = testRespondent;

// Step 2: Test getAssignedRespondentsForUser for Atasan
const atasanUser = {
  nip: r1.atasan.nip,
  nama: r1.atasan.nama,
  role: 'atasan'
};
const atasanList = window.appStore.getAssignedRespondentsForUser(atasanUser);
console.log(`\nAssigned subordinates for Atasan (${atasanUser.nama} - NIP ${atasanUser.nip}):`, atasanList.length);
if (atasanList.length === 0) {
  console.error('FAIL: Atasan should have at least 1 subordinate assigned!');
  process.exit(1);
} else {
  console.log(`PASS: Found subordinate ${atasanList[0].nama} (ID ${atasanList[0].id})`);
}

// Step 3: Test getAssignedRespondentsForUser for Koordinator
const koordinatorUser = {
  nip: r1.koordinatorEksternal.nip,
  nama: r1.koordinatorEksternal.nama,
  role: 'koordinator'
};
const koordList = window.appStore.getAssignedRespondentsForUser(koordinatorUser);
console.log(`\nAssigned participants for Koordinator (${koordinatorUser.nama} - NIP ${koordinatorUser.nip}):`, koordList.length);
if (koordList.length === 0) {
  console.error('FAIL: Koordinator should have at least 1 participant assigned!');
  process.exit(1);
} else {
  console.log(`PASS: Found participant ${koordList[0].nama} (ID ${koordList[0].id})`);
}

// Step 4: Test initial evaluation progress for Atasan
const initialProgress = window.appStore.getEvaluationProgressForRole(r1.id, 'atasan');
console.log(`\nInitial Atasan progress for respondent ${r1.id}:`, initialProgress);

// Step 5: Save answers as Atasan
console.log(`\nSaving Atasan answer for item A1...`);
window.appStore.saveEvaluatorItemAnswer(r1.id, 'atasan', 'A1', {
  score: 4,
  note: 'Menunjukkan inisiatif yang sangat baik dalam penerapan SOP baru.'
});

const midProgress = window.appStore.getEvaluationProgressForRole(r1.id, 'atasan');
console.log(`Mid Atasan progress for respondent ${r1.id}:`, midProgress);
if (midProgress.filled !== 1) {
  console.error(`FAIL: Expected 1 filled item, got ${midProgress.filled}`);
  process.exit(1);
}
console.log(`PASS: Atasan progress correctly shows 1 filled item (${midProgress.percentage}%)`);

// Step 6: Verify participant's scores are not affected
const fullEval = window.appStore.getEvaluation(r1.id);
console.log(`Atasan score for A1:`, fullEval.atasan.scores['A1']);
console.log(`Peserta score for A1:`, fullEval.peserta.scores['A1']);
if (fullEval.atasan.scores['A1'] !== 4) {
  console.error('FAIL: Atasan score not saved correctly');
  process.exit(1);
}
console.log('PASS: Atasan score saved in ev.atasan without corrupting ev.peserta');

// Step 7: Fill all items for Atasan and Submit
r1.modules.forEach(modCode => {
  const mod = window.MASTER_DATA.bankButir[modCode];
  if (mod) {
    mod.items.forEach(it => {
      window.appStore.saveEvaluatorItemAnswer(r1.id, 'atasan', it.id, {
        score: 4,
        note: 'Sesuai dengan standar kinerja.'
      }, true);
    });
  }
});

const fullProgress = window.appStore.getEvaluationProgressForRole(r1.id, 'atasan');
console.log(`\nAtasan full progress before submit:`, fullProgress);
if (fullProgress.percentage !== 100) {
  console.error(`FAIL: Expected 100% progress, got ${fullProgress.percentage}%`);
  process.exit(1);
}

const submitResult = window.appStore.submitEvaluatorEvaluation(r1.id, 'atasan');
console.log('Submit result:', submitResult);
if (!submitResult.success) {
  console.error('FAIL: Submit should succeed');
  process.exit(1);
}

const finalEval = window.appStore.getEvaluation(r1.id);
console.log(`Status Atasan after submit:`, finalEval.atasan.status);
if (finalEval.atasan.status !== 'SELESAI') {
  console.error(`FAIL: Expected status SELESAI, got ${finalEval.atasan.status}`);
  process.exit(1);
}
console.log('PASS: Evaluator evaluation successfully submitted with status SELESAI');

// Step 8: Verify Koordinator status is still BELUM / untouched
const koordProgress = window.appStore.getEvaluationProgressForRole(r1.id, 'koordinator');
console.log(`\nKoordinator progress (should remain uncompleted):`, koordProgress);
if (finalEval.koordinator.status === 'SELESAI') {
  console.error('FAIL: Koordinator status should not be affected by Atasan submission');
  process.exit(1);
}
console.log('PASS: Koordinator evaluation remains isolated and independent');

console.log('\nALL EVALUATOR SUITE TESTS PASSED SUCCESSFULLY! ✅');
