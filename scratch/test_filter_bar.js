const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const dom = {
  window: {
    localStorage: { getItem(){return null;}, setItem(){}, removeItem(){} },
    dispatchEvent(){}
  }
};
dom.window.window = dom.window;
global.window = dom.window;
global.localStorage = dom.window.localStorage;

vm.runInThisContext(fs.readFileSync('js/store.js', 'utf8'));
const html = window.FilterScopeBar.render();

assert(html.includes('id="select-dash-updl"'), 'Harus memuat select-dash-updl');
assert(html.includes('id="select-dash-program"'), 'Harus memuat select-dash-program');
assert(html.includes('id="select-dash-period"'), 'Harus memuat select-dash-period');
assert(html.includes('absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'), 'Select harus menutupi 100% kartu');
assert(html.includes('pointer-events-none'), 'Elemen visual harus pointer-events-none');
assert(html.includes('CAKUPAN UPDL'), 'Memuat label CAKUPAN UPDL');
assert(html.includes('PROGRAM PEMBELAJARAN'), 'Memuat label PROGRAM PEMBELAJARAN');
assert(html.includes('PERIODE EVALUASI'), 'Memuat label PERIODE EVALUASI');
assert(html.includes('expand_more'), 'Memuat ikon panah expand_more');

console.log('✅ SEMUA PENGUJIAN FILTER BAR LULUS!');
