const test = require('node:test');
const assert = require('node:assert/strict');
const evidence = require('../evidence.js');

test('high humidity adds fixative and heat-safe evidence tips', () => {
  const tips = evidence.getEvidenceTips({ humidity: 90, dewPoint: 22, precipitation: 60, wind: 5, score: 20 });
  assert.ok(tips.some((tip) => tip.key === 'high-humidity-fixative'));
  assert.ok(tips.some((tip) => tip.key === 'dry-before-heat'));
});

test('mild weather still returns a conservative evidence tip', () => {
  const tips = evidence.getEvidenceTips({ humidity: 45, dewPoint: 7, precipitation: 0, wind: 3, score: 92 });
  assert.equal(tips.length, 1);
  assert.equal(tips[0].key, 'light-touch');
});

test('all cited source URLs are https and known', () => {
  for (const source of Object.values(evidence.SOURCES)) assert.match(source.url, /^https:\/\//);
});
