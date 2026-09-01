const test = require('node:test');
const assert = require('node:assert/strict');
const week = require('../week.js');

test('seven date keys are consecutive', () => {
  assert.deepEqual(week.createDateKeys('2026-09-01', 7), [
    '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07'
  ]);
});

test('extended KMA parsing is not limited to the current 12-hour view', () => {
  const items = [];
  for (let hour = 0; hour < 16; hour += 1) {
    const time = String(hour).padStart(2, '0') + '00';
    items.push(
      { fcstDate: '20260902', fcstTime: time, category: 'TMP', fcstValue: '25' },
      { fcstDate: '20260902', fcstTime: time, category: 'REH', fcstValue: '70' },
      { fcstDate: '20260902', fcstTime: time, category: 'POP', fcstValue: '10' },
      { fcstDate: '20260902', fcstTime: time, category: 'WSD', fcstValue: '2' }
    );
  }
  const hours = week.parseKmaForecastItems(items, new Date('2026-09-01T00:00:00Z'), 120);
  assert.equal(hours.length, 16);
});

test('daily comparison ignores overnight conditions when daytime samples exist', () => {
  const hours = [
    { time: '2026-09-02T02:00:00+09:00', metrics: { humidity: 99, dewPoint: 25, precipitation: 90, wind: 30 } },
    { time: '2026-09-02T10:00:00+09:00', metrics: { humidity: 50, dewPoint: 10, precipitation: 0, wind: 4 } },
    { time: '2026-09-02T15:00:00+09:00', metrics: { humidity: 60, dewPoint: 13, precipitation: 10, wind: 6 } }
  ];
  const summary = week.summarizeDay('2026-09-02', hours, 'KMA');
  assert.equal(summary.samples, 2);
  assert.ok(summary.minScore > 50);
});

test('KMA wins for covered dates and fallback fills missing dates', () => {
  const kma = [{ time: '2026-09-01T12:00:00+09:00', metrics: { humidity: 60, dewPoint: 14, precipitation: 0, wind: 5 } }];
  const fallback = [
    { time: '2026-09-01T12:00:00+09:00', metrics: { humidity: 95, dewPoint: 24, precipitation: 80, wind: 25 } },
    { time: '2026-09-02T12:00:00+09:00', metrics: { humidity: 70, dewPoint: 17, precipitation: 20, wind: 7 } }
  ];
  const result = week.mergeDailySources(kma, fallback, ['2026-09-01', '2026-09-02']);
  assert.equal(result[0].source, 'KMA');
  assert.equal(result[1].source, 'OPEN_METEO');
});

test('latest weather resource reveals the already-used forecast coordinates', () => {
  const performanceApi = {
    getEntriesByType: () => [
      { name: 'https://example.com/app.js' },
      { name: 'https://example.com/api/weather?lat=37.322&lon=127.095' }
    ]
  };
  assert.deepEqual(week.findLatestForecastPosition(performanceApi, 'https://example.com/', null), {
    latitude: 37.322,
    longitude: 127.095
  });
});