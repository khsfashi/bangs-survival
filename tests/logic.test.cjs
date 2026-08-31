const test = require('node:test');
const assert = require('node:assert/strict');
const logic = require('../logic.js');

test('harsh weather has higher base risk than mild weather', () => {
  const mild = logic.calculateBaseRisk({ humidity: 45, dewPoint: 6, precipitation: 0, wind: 2 });
  const harsh = logic.calculateBaseRisk({ humidity: 94, dewPoint: 25, precipitation: 80, wind: 30 });
  assert.ok(mild < harsh);
  assert.ok(harsh <= 1);
  assert.ok(mild >= 0);
});

test('KMA grid conversion matches published verification points', () => {
  assert.deepEqual(logic.toKmaGrid(37.5665, 126.9780), { nx: 60, ny: 127 });
  assert.deepEqual(logic.toKmaGrid(35.1796, 129.0756), { nx: 98, ny: 76 });
  assert.deepEqual(logic.toKmaGrid(33.4996, 126.5312), { nx: 53, ny: 38 });
  assert.deepEqual(logic.toKmaGrid(37.4979, 127.0276), { nx: 61, ny: 125 });
});

test('dew point rises with humidity at a fixed temperature', () => {
  const dry = logic.calculateDewPoint(25, 40);
  const humid = logic.calculateDewPoint(25, 85);
  assert.ok(dry < humid);
  assert.ok(Math.abs(humid - 22.3) < 1);
});

test('KMA base time selects the latest published slot with safety delay', () => {
  assert.deepEqual(logic.chooseKmaBaseDateTime(new Date('2026-08-31T05:20:00Z')), { baseDate: '20260831', baseTime: '1400' });
  assert.deepEqual(logic.chooseKmaBaseDateTime(new Date('2026-08-30T16:05:00Z')), { baseDate: '20260830', baseTime: '2300' });
});

test('KMA items are normalized to hair-risk metrics', () => {
  const items = [
    { fcstDate: '20260831', fcstTime: '1900', category: 'TMP', fcstValue: '27' },
    { fcstDate: '20260831', fcstTime: '1900', category: 'REH', fcstValue: '80' },
    { fcstDate: '20260831', fcstTime: '1900', category: 'POP', fcstValue: '60' },
    { fcstDate: '20260831', fcstTime: '1900', category: 'WSD', fcstValue: '5' }
  ];
  const hours = logic.parseKmaForecastItems(items, new Date('2026-08-31T09:30:00Z'));
  assert.equal(hours.length, 1);
  assert.equal(hours[0].metrics.temperature, 27);
  assert.equal(hours[0].metrics.humidity, 80);
  assert.equal(hours[0].metrics.precipitation, 60);
  assert.equal(hours[0].metrics.wind, 18);
});

test('advice reacts to rain, humidity and wind without using AI', () => {
  const advice = logic.getBangsAdvice(35, { humidity: 90, dewPoint: 23, precipitation: 70, wind: 25 });
  assert.equal(advice[0].key, 'rain-now');
  assert.ok(advice.some((entry) => entry.key === 'humidity-now'));
  assert.ok(advice.some((entry) => entry.key === 'wind-now'));
  assert.equal(advice.length, 3);
});

test('advice uses forecast trend instead of only fixed current thresholds', () => {
  const hours = [
    { score: 62, time: '2026-09-01T09:00:00+09:00', metrics: { humidity: 63, dewPoint: 15, precipitation: 10, wind: 8 } },
    { score: 58, time: '2026-09-01T10:00:00+09:00', metrics: { humidity: 70, dewPoint: 17, precipitation: 30, wind: 10 } },
    { score: 42, time: '2026-09-01T11:00:00+09:00', metrics: { humidity: 78, dewPoint: 19, precipitation: 65, wind: 12 } },
    { score: 37, time: '2026-09-01T12:00:00+09:00', metrics: { humidity: 84, dewPoint: 21, precipitation: 70, wind: 13 } }
  ];
  const advice = logic.getBangsAdvice(62, hours[0].metrics, { hours, best: hours[0] });
  assert.ok(advice.some((entry) => entry.key === 'rain-later'));
  assert.ok(advice.some((entry) => entry.key === 'humidity-rising'));
});

test('personal advice appears only after calibration evidence exists', () => {
  const metrics = { humidity: 60, dewPoint: 14, precipitation: 0, wind: 4 };
  const before = logic.getBangsAdvice(70, metrics, { feedbackCount: 2, calibration: .1 });
  const after = logic.getBangsAdvice(70, metrics, { feedbackCount: 5, calibration: .1 });
  assert.ok(!before.some((entry) => entry.key.startsWith('personal-')));
  assert.equal(after[0].key, 'personal-fragile');
});

test('verdict thresholds also map to mascot moods', () => {
  assert.equal(logic.getVerdict(90).key, 'great');
  assert.equal(logic.getVerdict(70).key, 'okay');
  assert.equal(logic.getVerdict(50).key, 'worried');
  assert.equal(logic.getVerdict(20).key, 'doomed');
});

test('same-day feedback replaces previous value instead of growing forever', () => {
  const first = { day: '2026-08-31', at: '2026-08-31T09:00:00.000Z', type: 'survived', predictedRisk: .2, actualRisk: .18 };
  const correction = { day: '2026-08-31', at: '2026-08-31T10:00:00.000Z', type: 'failed', predictedRisk: .2, actualRisk: .9 };
  let samples = logic.upsertDailyFeedback([], first);
  samples = logic.upsertDailyFeedback(samples, correction);
  assert.equal(samples.length, 1);
  assert.equal(samples[0].type, 'failed');
});

test('calibration starts at three daily samples and remains bounded', () => {
  const two = [{ predictedRisk: .1, actualRisk: .9 }, { predictedRisk: .1, actualRisk: .9 }];
  assert.equal(logic.getCalibrationOffset(two), 0);
  assert.equal(logic.getCalibrationOffset([...two, { predictedRisk: .1, actualRisk: .9 }]), .15);
});

test('legacy feedback can be normalized into a daily sample', () => {
  const sample = logic.normalizeFeedbackSample({ at: '2026-08-30T12:34:56.000Z', predictedRisk: .4, actualRisk: .55 });
  assert.equal(sample.day, '2026-08-30');
  assert.equal(sample.type, null);
});

test('distance detects a large Seoul-Yongin jump but ignores nearby movement', () => {
  const seoul = { latitude: 37.4924, longitude: 127.0300 };
  const suji = { latitude: 37.3220, longitude: 127.0950 };
  const nearby = { latitude: 37.3230, longitude: 127.0960 };
  assert.ok(logic.distanceKm(seoul, suji) > 10);
  assert.ok(logic.distanceKm(suji, nearby) < 1);
  assert.equal(logic.isSuspiciousLocationJump(seoul, suji, 10), true);
  assert.equal(logic.isSuspiciousLocationJump(suji, nearby, 10), false);
});

test('saved locations are validated and stripped to local-safe fields', () => {
  const saved = logic.normalizeSavedLocation({
    latitude: '37.322', longitude: '127.095', label: '경기도 용인시 수지구 동천동',
    region: { label: '경기도 용인시 수지구 동천동', district: '수지구', neighborhood: '동천동', code: '4146510300' },
    savedAt: '2026-08-31T12:00:00.000Z', secret: 'drop-me'
  });
  assert.equal(saved.latitude, 37.322);
  assert.equal(saved.longitude, 127.095);
  assert.equal(saved.source, 'saved');
  assert.equal(saved.region.neighborhood, '동천동');
  assert.equal('secret' in saved, false);
  assert.equal(logic.normalizeSavedLocation({ latitude: 999, longitude: 127 }), null);
});

test('daily companion is deterministic and tied to the dominant weather', () => {
  const rainy = logic.createDailyCompanion('2026-09-01', { humidity: 92, dewPoint: 24, precipitation: 80, wind: 5 }, 20);
  const same = logic.createDailyCompanion('2026-09-01', { humidity: 92, dewPoint: 24, precipitation: 80, wind: 5 }, 20);
  assert.deepEqual(rainy, same);
  assert.equal(rainy.key, 'rain');
  assert.equal(rainy.name, '우산방울 요정');
});

test('daily companion collection keeps one entry per day and stays bounded', () => {
  const first = logic.createDailyCompanion('2026-09-01', { humidity: 50, dewPoint: 10, precipitation: 0, wind: 3 }, 90);
  const changed = logic.createDailyCompanion('2026-09-01', { humidity: 90, dewPoint: 23, precipitation: 80, wind: 3 }, 10);
  const second = logic.createDailyCompanion('2026-09-02', { humidity: 60, dewPoint: 14, precipitation: 0, wind: 3 }, 70);
  let collection = logic.upsertDailyCompanion([], first, 2);
  collection = logic.upsertDailyCompanion(collection, changed, 2);
  collection = logic.upsertDailyCompanion(collection, second, 2);
  assert.equal(collection.length, 2);
  assert.equal(logic.getCollectedCompanion(collection, '2026-09-01').key, 'rain');
});
