const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const gacha = require('../gacha.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('initial fairy UI matches the current random gacha model', () => {
  assert.match(html, /하루 한 번, 헤어롤에서 만나는 친구/);
  assert.match(html, /오늘의 앞머리 요정 뽑기/);
  assert.match(html, new RegExp(`0/${gacha.ORDER.length}`));
  assert.match(html, /결과는 랜덤/);
  assert.match(html, /재화·결제·재뽑기는 없어요/);

  assert.doesNotMatch(html, /날씨가 데려오는 친구/);
  assert.doesNotMatch(html, /오늘 날씨에 맞는 작은 친구를 만날 수 있어요/);
  assert.doesNotMatch(html, /0\/5/);
});
