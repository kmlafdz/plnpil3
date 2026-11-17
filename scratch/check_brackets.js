const fs = require('fs');

const code = fs.readFileSync('js/views/penugasan.js', 'utf8');

let stack = [];
let inString = false;
let strChar = '';
let inComment = false;
let inBlockComment = false;
let lineNum = 1;

for (let i = 0; i < code.length; i++) {
  const c = code[i];
  const next = code[i+1];
  
  if (c === '\n') { lineNum++; }
  
  if (inComment) {
    if (c === '\n') inComment = false;
    continue;
  }
  if (inBlockComment) {
    if (c === '*' && next === '/') { inBlockComment = false; i++; }
    continue;
  }
  if (inString) {
    if (c === '\\') { i++; continue; }
    if (c === strChar) {
      inString = false;
    }
    continue;
  }
  
  if (c === '/' && next === '/') { inComment = true; i++; continue; }
  if (c === '/' && next === '*') { inBlockComment = true; i++; continue; }
  if (c === '\'' || c === '"' || c === '`') { inString = true; strChar = c; continue; }
  
  if (c === '(' || c === '{' || c === '[') {
    stack.push({ char: c, line: lineNum, col: i });
  } else if (c === ')' || c === '}' || c === ']') {
    const last = stack.pop();
    const expected = c === ')' ? '(' : (c === '}' ? '{' : '[');
    if (!last || last.char !== expected) {
      console.log('Mismatch at line', lineNum, 'got', c, 'expected matching for', last ? last.char + ' from line ' + last.line : 'none');
    }
  }
}
console.log('Remaining on stack:');
stack.forEach(s => console.log(s.char, 'at line', s.line));
