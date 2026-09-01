const test = require('node:test');
const assert = require('node:assert/strict');
const horizon = require('../horizon.js');

test('outing horizon accepts only supported values and defaults to 12 hours', () => {
  assert.equal(horizon.normalizeOutingHours(4), 4);
  assert.equal(horizon.normalizeOutingHours('8'), 8);
  assert.equal(horizon.normalizeOutingHours(12), 12);
  assert.equal(horizon.normalizeOutingHours(6), 12);
  assert.equal(horizon.normalizeOutingHours('bad'), 12);
});

test('scoping keeps only the selected number of forecast hours', () => {
  const hours = Array.from({ length: 12 }, (_, index) => ({ score: index }));
  assert.equal(horizon.scopeHours(hours, 4).length, 4);
  assert.equal(horizon.scopeHours(hours, 8).length, 8);
  assert.equal(horizon.scopeHours(hours, 12).length, 12);
  assert.deepEqual(horizon.scopeHours(null, 4), []);
});

test('best hour is chosen only from the scoped window', () => {
  const hours = [
    { score: 30, time: '09:00' },
    { score: 55, time: '10:00' },
    { score: 45, time: '11:00' },
    { score: 40, time: '12:00' },
    { score: 99, time: '13:00' }
  ];
  const scoped = horizon.scopeHours(hours, 4);
  assert.equal(horizon.findBestHour(scoped).time, '10:00');
  assert.equal(horizon.findBestHour([]), null);
});

test('advice copy reflects the actual forecast window', () => {
  const entries = [{ key: 'rain-later', description: '앞으로 12시간 안에 비가 와요.' }];
  const rewritten = horizon.rewriteAdviceHorizon(entries, 4);
  assert.equal(rewritten[0].description, '앞으로 4시간 안에 비가 와요.');
  assert.notEqual(rewritten[0], entries[0]);
});

test('storage helpers fail closed to the 12 hour default', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  assert.equal(horizon.readStoredHours(storage), 12);
  assert.equal(horizon.writeStoredHours(storage, 8), 8);
  assert.equal(horizon.readStoredHours(storage), 8);
  assert.equal(horizon.writeStoredHours(storage, 5), 12);
});