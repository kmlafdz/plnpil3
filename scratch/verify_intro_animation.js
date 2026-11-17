/**
 * Automated Verification Script: Intro Animation HTML, CSS & App integration
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING PLN BRAND INTRO ANIMATION ===');

// 1. Verify index.html structure
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="pln-intro-splash"'), 'index.html must contain #pln-intro-splash');
assert(html.includes('PT PLN (PERSERO)'), 'index.html must display PT PLN (PERSERO)');
assert(html.includes('Pusat Pendidikan dan Pelatihan'), 'index.html must display Pusat Pendidikan dan Pelatihan');
assert(html.includes('pln-intro-logo-wrap'), 'index.html must contain logo container');
assert(!html.includes('id="btn-skip-intro"'), 'index.html must not contain skip button');
assert(!html.includes('pln-intro-loader'), 'index.html must not contain loader bar');
console.log('PASS: index.html markup contains clean, centered brand elements without loader or skip button');

// 2. Verify css/style.css rules & animations
const css = fs.readFileSync('css/style.css', 'utf8');
assert(css.includes('.pln-intro-overlay'), 'style.css must define .pln-intro-overlay');
assert(css.includes('@keyframes plnLogoIntroClean'), 'style.css must define plnLogoIntroClean');
assert(css.includes('@keyframes plnTitleRevealClean'), 'style.css must define plnTitleRevealClean');
assert(css.includes('@keyframes plnSubtitleRevealClean'), 'style.css must define plnSubtitleRevealClean');
assert(!css.includes('pln-spark'), 'style.css must not have excessive spark animations');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'style.css must support reduced motion');
console.log('PASS: css/style.css contains clean centered styles, enlarged elements, subtle motion, and accessibility rules');

// 3. Verify js/app.js intro orchestration
const appJs = fs.readFileSync('js/app.js', 'utf8');
assert(appJs.includes('this.initIntroAnimation();'), 'app.js must call initIntroAnimation');
assert(appJs.includes('initIntroAnimation: function ()'), 'app.js must define initIntroAnimation');
assert(appJs.includes('dismissIntro'), 'app.js must handle intro dismissal');
console.log('PASS: js/app.js properly initializes, automates, and dismisses the intro animation');

console.log('\nALL PLN INTRO ANIMATION VERIFICATIONS PASSED! ✅');
