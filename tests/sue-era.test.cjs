const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('Sue-era presentation layer loads after the generic UX refresh', () => {
  const html = read('index.html');
  const generic = html.indexOf('/ux-refresh.css');
  const sueEra = html.indexOf('/sue-era.css');
  assert.ok(generic >= 0 && sueEra > generic);
  assert.match(html, /\/intro-mascot\.svg/);
  assert.match(html, /TODAY'S BANGS/);
});

test('reference-inspired presentation remains local and does not embed source artwork', () => {
  const css = read('sue-era.css');
  const mascot = read('intro-mascot.svg');
  assert.doesNotMatch(css, /url\(['"]?https?:/i);
  assert.doesNotMatch(mascot, /(?:href|src)=["']https?:/i);
  assert.doesNotMatch(mascot, /Avatar Star Sue|아바타 스타 슈/i);
});

test('intro mascot is precached for installed/offline use', () => {
  const sw = read('sw.js');
  assert.match(sw, /['"]\/intro-mascot\.svg['"]/);
  assert.match(sw, /['"]\/sue-era\.css['"]/);
});
