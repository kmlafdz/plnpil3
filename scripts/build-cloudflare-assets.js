/**
 * Build script untuk menyiapkan aset statis publik ke folder ./dist
 * Memastikan berkas backend (server.js, db.js, .env, node_modules) TIDAK ikut ter-deploy ke Cloudflare.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PUBLIC_FILES = [
  'index.html',
  'logo.png',
  'apple-touch-icon.png',
  'favicon.ico',
  'favicon.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-192x192.png',
  'robots.txt'
];

const PUBLIC_DIRS = ['css', 'js', 'images', 'fonts'];

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

let copiedCount = 0;

for (const file of PUBLIC_FILES) {
  const src = path.join(ROOT, file);
  if (fs.existsSync(src) && fs.statSync(src).isFile()) {
    fs.copyFileSync(src, path.join(DIST, file));
    copiedCount++;
  }
}

for (const dir of PUBLIC_DIRS) {
  const srcDir = path.join(ROOT, dir);
  if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
    fs.cpSync(srcDir, path.join(DIST, dir), { recursive: true });
    copiedCount++;
  }
}

console.log(`✅ Build Cloudflare Assets selesai ke ./dist (${copiedCount} item publik disalin, berkas backend dikecualikan).`);
