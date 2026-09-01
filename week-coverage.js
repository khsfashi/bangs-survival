const week = require('./week.js');

const HALF_HOUR_MS = 30 * 60 * 1000;

function expectedDaytimeHours(date, now = new Date()) {
  const key = String(date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return [];

  const nowParts = week.kstNowParts(now);
  if (key < nowParts.day) return [];

  const thresholdMs = now.getTime() - HALF_HOUR_MS;
  const result = [];
  for (let hour = week.DAY_START_HOUR; hour <= week.DAY_END_HOUR; hour += 1) {
    if (key === nowParts.day) {
      const forecastMs = new Date(`${key}T${String(hour).padStart(2, '0')}:00:00+09:00`).getTime();
      if (forecastMs < thresholdMs) continue;
    }
    result.push(hour);
  }
  return result;
}

function filterCompleteDaytimeDates(hours, now = new Date()) {
  if (!Array.isArray(hours) || !hours.length) return [];

  const groups = new Map();
  hours.forEach((entry) => {
    const date = week.dayKey(entry?.time);
    const hour = week.hourOf(entry?.time);
    if (!date || !Number.isFinite(hour)) return;
    const observed = groups.get(date) || new Set();
    if (hour >= week.DAY_START_HOUR && hour <= week.DAY_END_HOUR) observed.add(hour);
    groups.set(date, observed);
  });

  const completeDates = new Set();
  groups.forEach((observed, date) => {
    const expected = expectedDaytimeHours(date, now);
    if (expected.length && expected.every((hour) => observed.has(hour))) completeDates.add(date);
  });

  return hours.filter((entry) => completeDates.has(week.dayKey(entry?.time)));
}

module.exports = {
  HALF_HOUR_MS,
  expectedDaytimeHours,
  filterCompleteDaytimeDates
};
