const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(name) {
  return fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
}

test('fairy v1 closes the daily loop without adding monetized rerolls', () => {
  const gacha = read('gacha.js');
  assert.match(gacha, /NEW!/);
  assert.match(gacha, /다음 친구는 내일 만날 수 있어요/);
  assert.match(gacha, /하루 1회 · 다음 요정은 내일/);
  assert.match(gacha, /재뽑기 없음/);
});

test('rarity has distinct but restrained visual states', () => {
  const css = read('delight.css');
  assert.match(css, /data-rarity="rare"/);
  assert.match(css, /data-rarity="special"/);
  assert.match(css, /\.fairy-new-badge/);
  assert.match(css, /prefers-reduced-motion/);
});

test('revealed fairy can replace the generic encouragement message', () => {
  const encouragement = read('encouragement.js');
  assert.match(encouragement, /gachaState === 'revealed'/);
  assert.match(encouragement, /dataset\.context = 'fairy'/);
  assert.match(encouragement, /의 한마디/);
});

test('v1 version and service worker cache are bumped together', () => {
  const pkg = JSON.parse(read('package.json'));
  const sw = read('sw.js');
  assert.equal(pkg.version, '1.0.0');
  assert.match(sw, /bangs-survival-static-v10/);
});
