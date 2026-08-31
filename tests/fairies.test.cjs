const test = require('node:test');
const assert = require('node:assert/strict');
const fairies = require('../fairies.js');

test('fairy catalog exposes five deterministic weather companions', () => {
  assert.deepEqual(fairies.ORDER, ['rain', 'wind', 'humid', 'clear', 'cloud']);
  assert.equal(Object.keys(fairies.DEFINITIONS).length, 5);
});

test('each fairy renders local SVG without remote URLs', () => {
  for (const key of fairies.ORDER) {
    const first = fairies.getFairySvg(key);
    const second = fairies.getFairySvg(key);
    assert.equal(first, second);
    assert.match(first, /^<svg/);
    assert.ok(!/(?:href|src)=[\"']https?:/.test(first));
    assert.match(first, new RegExp(fairies.DEFINITIONS[key].name));
  }
});

test('locked fairy keeps its shape but hides the identity from accessibility label', () => {
  const svg = fairies.getFairySvg('rain', { locked: true });
  assert.match(svg, /is-locked/);
  assert.match(svg, /아직 만나지 못한 앞머리 요정/);
});

test('unknown fairy key falls back to cloud art', () => {
  assert.equal(fairies.getFairySvg('unknown'), fairies.getFairySvg('cloud'));
});
