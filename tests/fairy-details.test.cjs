const test = require('node:test');
const assert = require('node:assert/strict');
const gacha = require('../gacha.js');
const details = require('../fairy-details.js');

test('every gacha fairy has a readable story and favorite thing', () => {
  assert.deepEqual(Object.keys(details.DETAILS).sort(), [...gacha.ORDER].sort());
  for (const key of gacha.ORDER) {
    const item = details.detailFor(key);
    assert.ok(item.story.length >= 30, `${key} story should be descriptive`);
    assert.ok(item.favorite.length >= 5, `${key} favorite should be readable`);
    assert.ok(!/https?:\/\//.test(item.story));
  }
});

test('weather labels are friendly Korean copy', () => {
  assert.equal(details.weatherText(['rain']), '비 오는 날');
  assert.equal(details.weatherText(['wind', 'clear']), '바람 부는 날 · 맑은 날');
});

test('fairy key can be recovered from the displayed fairy name', () => {
  const fakeGacha = { ORDER: gacha.ORDER, DEFINITIONS: gacha.DEFINITIONS };
  for (const key of gacha.ORDER) {
    assert.equal(details.keyFromName(fakeGacha, gacha.DEFINITIONS[key].name), key);
  }
  assert.equal(details.keyFromName(fakeGacha, '없는 요정'), null);
});
