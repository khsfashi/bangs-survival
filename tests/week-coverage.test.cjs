const test = require('node:test');
const assert = require('node:assert/strict');
const coverage = require('../week-coverage.js');

function hoursFor(date, startHour, endHour) {
  const result = [];
  for (let hour = startHour; hour <= endHour; hour += 1) {
    result.push({
      time: `${date}T${String(hour).padStart(2, '0')}:00:00+09:00`,
      metrics: {}
    });
  }
  return result;
}

test('future KMA date is kept only when 07-22 daytime coverage is complete', () => {
  const now = new Date('2026-09-01T01:56:00Z');
  const full = hoursFor('2026-09-02', 7, 22);
  const partial = hoursFor('2026-09-03', 7, 12);
  const filtered = coverage.filterCompleteDaytimeDates([...full, ...partial], now);

  assert.equal(filtered.length, 16);
  assert.ok(filtered.every((entry) => entry.time.startsWith('2026-09-02')));
});

test('current KST date only requires forecast hours that remain inside parser grace window', () => {
  const now = new Date('2026-09-01T01:56:00Z'); // 10:56 KST, parser keeps 11:00 onward.
  assert.deepEqual(coverage.expectedDaytimeHours('2026-09-01', now), [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);

  const remaining = hoursFor('2026-09-01', 11, 22);
  assert.equal(coverage.filterCompleteDaytimeDates(remaining, now).length, 12);
});

test('current date is rejected when a remaining daytime hour is missing', () => {
  const now = new Date('2026-09-01T01:56:00Z');
  const incomplete = hoursFor('2026-09-01', 11, 21);
  assert.deepEqual(coverage.filterCompleteDaytimeDates(incomplete, now), []);
});

test('past dates and dates with no remaining daytime window are not treated as complete', () => {
  const now = new Date('2026-09-01T14:40:00Z'); // 23:40 KST.
  assert.deepEqual(coverage.expectedDaytimeHours('2026-08-31', now), []);
  assert.deepEqual(coverage.expectedDaytimeHours('2026-09-01', now), []);
});
