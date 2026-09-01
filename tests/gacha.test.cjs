const test = require('node:test');
const assert = require('node:assert/strict');
const gacha = require('../gacha.js');

test('gacha exposes a 12-fairy catalog with multiple rarities', () => {
  assert.equal(gacha.ORDER.length, 12);
  assert.equal(new Set(gacha.ORDER).size, 12);
  const rarities = new Set(gacha.ORDER.map((key) => gacha.DEFINITIONS[key].rarity));
  assert.deepEqual([...rarities].sort(), ['common', 'rare', 'special']);
  assert.ok(gacha.ORDER.every((key) => gacha.DEFINITIONS[key].symbol), 'every fairy should have a daily companion symbol');
});

test('rarity presentation is understandable without exposing raw probabilities', () => {
  assert.equal(gacha.rarityPresentation('common'), '★ 일반 · 자주 만나요');
  assert.equal(gacha.rarityPresentation('rare'), '★★ 희귀 · 가끔 만나요');
  assert.equal(gacha.rarityPresentation('special'), '★★★ 반짝 · 아주 드물게 만나요');
  assert.equal(gacha.RARITY_META.special.stars, '★★★');
});

test('draw is deterministic for injected random value and weather changes weights', () => {
  assert.equal(gacha.drawFairy('rain', 0), 'drop');
  assert.equal(gacha.drawFairy('rain', 0), gacha.drawFairy('rain', 0));
  const samples = Array.from({ length: 1000 }, (_, index) => index / 1000);
  const rainyDrops = samples.filter((value) => gacha.DEFINITIONS[gacha.drawFairy('rain', value)].affinities.includes('rain')).length;
  const clearDrops = samples.filter((value) => gacha.DEFINITIONS[gacha.drawFairy('clear', value)].affinities.includes('rain')).length;
  assert.ok(rainyDrops > clearDrops);
});

test('fairy and hair roller render as local SVG without remote sources', () => {
  for (const key of gacha.ORDER) {
    const svg = gacha.getFairySvg(key);
    assert.match(svg, /^<svg/);
    assert.ok(!/(?:href|src)=["']https?:/.test(svg));
  }
  const roller = gacha.getHairRollerSvg();
  assert.match(roller, /^<svg/);
  assert.ok(!/(?:href|src)=["']https?:/.test(roller));
});

test('first discovery is tracked separately from repeated draws', () => {
  const empty = { draws: [] };
  assert.equal(gacha.isFirstDiscovery(empty, 'moon'), true);
  const found = gacha.upsertDraw(empty, { day: '2026-09-01', key: 'moon' });
  assert.equal(gacha.isFirstDiscovery(found, 'moon'), false);
  assert.equal(gacha.shouldCelebrate({ key: 'moon', firstDiscovery: true }), true);
  assert.equal(gacha.shouldCelebrate({ key: 'rainbow', firstDiscovery: true }), true);
  assert.equal(gacha.shouldCelebrate({ key: 'drop', firstDiscovery: true }), false);
  assert.equal(gacha.shouldCelebrate({ key: 'moon', firstDiscovery: false }), false);
});

test('one day is upserted instead of duplicated', () => {
  const first = gacha.upsertDraw({ draws: [] }, { day: '2026-09-01', key: 'drop' });
  const second = gacha.upsertDraw(first, { day: '2026-09-01', key: 'moon' });
  assert.equal(second.draws.length, 1);
  assert.equal(second.draws[0].key, 'moon');
});
