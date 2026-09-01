(function initBangsWeek(root, factory) {
  const isCommonJs = typeof module === 'object' && module.exports;
  const logic = isCommonJs ? require('./logic.js') : root.BangsLogic;
  const api = factory(logic);
  if (isCommonJs) module.exports = api;
  else {
    root.BangsWeek = api;
    if (root.document) api.install(root);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, (logic) => {
  'use strict';

  const USER_STORAGE_KEY = 'bangs-survival-v1';
  const DAY_START_HOUR = 7;
  const DAY_END_HOUR = 22;
  const MAX_DAYS = 7;
  const KMA_MAX_HOURS = 120;
  const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

  function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function dayKey(time) {
    const match = String(time || '').match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }

  function hourOf(time) {
    const match = String(time || '').match(/T(\d{2}):/);
    return match ? Number(match[1]) : NaN;
  }

  function kstNowParts(now = new Date()) {
    const shifted = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return {
      day: shifted.toISOString().slice(0, 10),
      hour: shifted.getUTCHours(),
      minute: shifted.getUTCMinutes()
    };
  }

  function createDateKeys(startDay, count = MAX_DAYS) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startDay || ''))) return [];
    const [year, month, day] = startDay.split('-').map(Number);
    const start = Date.UTC(year, month - 1, day, 12, 0, 0);
    return Array.from({ length: Math.max(0, Number(count) || 0) }, (_, index) =>
      new Date(start + (index * 86400000)).toISOString().slice(0, 10));
  }

  function parseKmaForecastItems(items, now = new Date(), maxHours = KMA_MAX_HOURS) {
    if (!logic || !Array.isArray(items)) return [];
    const groups = new Map();
    items.forEach((item) => {
      const date = String(item?.fcstDate || '');
      const time = String(item?.fcstTime || '').padStart(4, '0');
      if (!/^\d{8}$/.test(date) || !/^\d{4}$/.test(time)) return;
      const key = `${date}${time}`;
      const group = groups.get(key) || { date, time, categories: {} };
      group.categories[item.category] = Number(item.fcstValue);
      groups.set(key, group);
    });

    const nowMs = now.getTime() - (30 * 60 * 1000);
    const limit = Math.max(1, Math.min(KMA_MAX_HOURS, Number(maxHours) || KMA_MAX_HOURS));
    return [...groups.values()].map((group) => {
      const { date, time, categories } = group;
      if (!Number.isFinite(categories.TMP) || !Number.isFinite(categories.REH)) return null;
      const temperature = categories.TMP;
      const humidity = categories.REH;
      return {
        time: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:00+09:00`,
        metrics: {
          temperature,
          humidity,
          dewPoint: logic.calculateDewPoint(temperature, humidity),
          precipitation: Number.isFinite(categories.POP) ? categories.POP : 0,
          wind: Number.isFinite(categories.WSD) ? categories.WSD * 3.6 : 0
        }
      };
    }).filter((entry) => entry && new Date(entry.time).getTime() >= nowMs)
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .slice(0, limit);
  }

  function parseOpenMeteoHourly(data, now = new Date()) {
    const hourly = data?.hourly;
    if (!hourly?.time?.length) return [];
    const nowParts = kstNowParts(now);
    const result = [];
    for (let index = 0; index < hourly.time.length; index += 1) {
      const time = String(hourly.time[index] || '');
      const date = dayKey(time);
      const hour = hourOf(time);
      if (!date || !Number.isFinite(hour)) continue;
      if (date < nowParts.day || (date === nowParts.day && hour < nowParts.hour)) continue;
      result.push({
        time: `${time}:00+09:00`,
        metrics: {
          temperature: safeNumber(hourly.temperature_2m?.[index]),
          humidity: safeNumber(hourly.relative_humidity_2m?.[index]),
          dewPoint: safeNumber(hourly.dew_point_2m?.[index]),
          precipitation: safeNumber(hourly.precipitation_probability?.[index]),
          wind: safeNumber(hourly.wind_speed_10m?.[index])
        }
      });
    }
    return result;
  }

  function readScoringOffsets(storage) {
    if (!logic) return { sensitivity: 0, calibration: 0 };
    try {
      const parsed = JSON.parse(storage?.getItem(USER_STORAGE_KEY) || '{}');
      const feedback = Array.isArray(parsed.feedback)
        ? parsed.feedback.map(logic.normalizeFeedbackSample).filter(Boolean).slice(-30)
        : [];
      return {
        sensitivity: logic.getSensitivityOffset(parsed.sensitivity),
        calibration: logic.getCalibrationOffset(feedback)
      };
    } catch {
      return { sensitivity: 0, calibration: 0 };
    }
  }

  function scoreHours(hours, offsets = {}) {
    if (!logic || !Array.isArray(hours)) return [];
    const sensitivity = safeNumber(offsets.sensitivity);
    const calibration = safeNumber(offsets.calibration);
    return hours.map((hour) => {
      const baseRisk = logic.calculateBaseRisk(hour.metrics || {});
      const risk = logic.clamp(baseRisk + sensitivity + calibration, 0, 1);
      return { ...hour, baseRisk, risk, score: Math.round((1 - risk) * 100) };
    });
  }

  function relevantDayHours(hours) {
    if (!Array.isArray(hours)) return [];
    const daytime = hours.filter((hour) => {
      const value = hourOf(hour?.time);
      return Number.isFinite(value) && value >= DAY_START_HOUR && value <= DAY_END_HOUR;
    });
    return daytime.length ? daytime : hours;
  }

  function summarizeDay(date, hours, source, offsets = {}) {
    const scoped = relevantDayHours(scoreHours(hours, offsets));
    if (!scoped.length) return null;
    const best = scoped.reduce((current, hour) => hour.score > current.score ? hour : current, scoped[0]);
    const worst = scoped.reduce((current, hour) => hour.score < current.score ? hour : current, scoped[0]);
    const maxMetric = (key) => scoped.reduce((max, hour) => Math.max(max, safeNumber(hour?.metrics?.[key])), 0);
    return {
      date,
      source,
      minScore: worst.score,
      maxScore: best.score,
      best,
      worst,
      maxRain: maxMetric('precipitation'),
      maxHumidity: maxMetric('humidity'),
      maxWind: maxMetric('wind'),
      samples: scoped.length,
      verdict: logic.getVerdict(worst.score)
    };
  }

  function groupByDay(hours) {
    const groups = new Map();
    (Array.isArray(hours) ? hours : []).forEach((hour) => {
      const key = dayKey(hour?.time);
      if (!key) return;
      const list = groups.get(key) || [];
      list.push(hour);
      groups.set(key, list);
    });
    return groups;
  }

  function mergeDailySources(kmaHours, fallbackHours, dateKeys, offsets = {}) {
    const kma = groupByDay(kmaHours);
    const fallback = groupByDay(fallbackHours);
    return (Array.isArray(dateKeys) ? dateKeys : []).map((date) => {
      const official = kma.get(date) || [];
      if (official.length) return summarizeDay(date, official, 'KMA', offsets);
      const extended = fallback.get(date) || [];
      if (extended.length) return summarizeDay(date, extended, 'OPEN_METEO', offsets);
      return null;
    }).filter(Boolean);
  }

  function findLatestForecastPosition(performanceApi, baseHref, storage) {
    try {
      const entries = performanceApi?.getEntriesByType?.('resource') || [];
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const url = new URL(entries[index]?.name, baseHref);
        if (url.pathname !== '/api/weather') continue;
        const latitude = Number(url.searchParams.get('lat'));
        const longitude = Number(url.searchParams.get('lon'));
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
      }
    } catch {}

    try {
      const parsed = JSON.parse(storage?.getItem(USER_STORAGE_KEY) || '{}');
      const saved = logic?.normalizeSavedLocation?.(parsed.savedLocation);
      if (saved) return { latitude: saved.latitude, longitude: saved.longitude };
    } catch {}
    return null;
  }

  function formatDateLabel(date, options) {
    const parsed = new Date(`${date}T12:00:00+09:00`);
    return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', ...options }).format(parsed);
  }

  function formatHourLabel(time) {
    const value = hourOf(time);
    return Number.isFinite(value) ? `${value}시` : '시간 미정';
  }

  async function fetchWeekData(root, position) {
    const params = new URLSearchParams({
      lat: String(position.latitude),
      lon: String(position.longitude),
      range: 'week'
    });
    const meteoParams = new URLSearchParams({
      latitude: String(position.latitude),
      longitude: String(position.longitude),
      hourly: 'temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,wind_speed_10m',
      forecast_days: '7',
      timezone: 'Asia/Seoul'
    });

    const [kmaResult, meteoResult] = await Promise.allSettled([
      root.fetch(`/api/weather?${params}`),
      root.fetch(`${OPEN_METEO_URL}?${meteoParams}`)
    ]);

    let kmaHours = [];
    if (kmaResult.status === 'fulfilled' && kmaResult.value.ok) {
      const payload = await kmaResult.value.json();
      if (payload?.source === 'KMA' && Array.isArray(payload.hours)) kmaHours = payload.hours;
    }

    let fallbackHours = [];
    if (meteoResult.status === 'fulfilled' && meteoResult.value.ok) {
      fallbackHours = parseOpenMeteoHourly(await meteoResult.value.json(), new Date());
    }

    if (!kmaHours.length && !fallbackHours.length) throw new Error('week_forecast_unavailable');
    const dateKeys = createDateKeys(kstNowParts(new Date()).day, MAX_DAYS);
    return { kmaHours, fallbackHours, dateKeys };
  }

  function install(root) {
    const document = root?.document;
    if (!document || !logic) return false;
    const button = document.querySelector('#weekForecastButton');
    const status = document.querySelector('#weekForecastStatus');
    const content = document.querySelector('#weekForecastContent');
    const tabs = document.querySelector('#weekDayTabs');
    const detail = document.querySelector('#weekDayDetail');
    if (!button || !status || !content || !tabs || !detail) return false;

    let rawCache = null;
    let cacheKey = '';

    function renderDetail(summary) {
      if (!summary) return;
      const sourceText = summary.source === 'KMA' ? '기상청 단기예보' : 'Open-Meteo 연장 전망';
      const sourceNote = summary.source === 'KMA'
        ? '기상청 단기예보가 제공하는 날짜입니다.'
        : '기상청 단기예보 범위를 넘는 날짜라 대체 연장 전망을 사용합니다.';
      detail.innerHTML = '';

      const heading = document.createElement('div');
      heading.className = 'week-detail-heading';
      const titleWrap = document.createElement('div');
      const kicker = document.createElement('p');
      kicker.className = 'card-kicker';
      kicker.textContent = formatDateLabel(summary.date, { month: 'long', day: 'numeric', weekday: 'short' });
      const title = document.createElement('h3');
      title.textContent = summary.verdict.title;
      titleWrap.append(kicker, title);
      const badge = document.createElement('span');
      badge.className = `week-source-badge${summary.source === 'KMA' ? '' : ' fallback'}`;
      badge.textContent = sourceText;
      heading.append(titleWrap, badge);

      const score = document.createElement('p');
      score.className = 'week-score-range';
      score.innerHTML = `<strong>${summary.minScore}–${summary.maxScore}점</strong><span>낮 시간 생존점수 범위</span>`;

      const metrics = document.createElement('div');
      metrics.className = 'week-metrics';
      [
        `비 최대 ${Math.round(summary.maxRain)}%`,
        `습도 최대 ${Math.round(summary.maxHumidity)}%`,
        `바람 최대 ${Math.round(summary.maxWind)}km/h`
      ].forEach((text) => {
        const chip = document.createElement('span');
        chip.textContent = text;
        metrics.appendChild(chip);
      });

      const best = document.createElement('p');
      best.className = 'week-best-time';
      best.textContent = `가장 유리한 시간은 ${formatHourLabel(summary.best.time)} 전후이며 예상 생존점수는 ${summary.best.score}점입니다.`;
      const note = document.createElement('p');
      note.className = 'week-source-note';
      note.textContent = `${sourceNote} 날짜 비교는 07–22시 예보만 사용하며, 현재 민감도와 누적 개인 보정을 동일하게 반영합니다.`;
      detail.append(heading, score, metrics, best, note);
    }

    function render(data) {
      const offsets = readScoringOffsets(root.localStorage);
      const summaries = mergeDailySources(data.kmaHours, data.fallbackHours, data.dateKeys, offsets);
      tabs.replaceChildren();
      summaries.forEach((summary, index) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'week-day-tab';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', String(index === 0));
        tab.innerHTML = `<span>${formatDateLabel(summary.date, { weekday: 'short' })}</span><small>${formatDateLabel(summary.date, { month: 'numeric', day: 'numeric' })}</small><strong>${summary.minScore}–${summary.maxScore}</strong><em>${summary.verdict.badge}</em>`;
        tab.addEventListener('click', () => {
          tabs.querySelectorAll('[role="tab"]').forEach((item) => item.setAttribute('aria-selected', 'false'));
          tab.setAttribute('aria-selected', 'true');
          renderDetail(summary);
        });
        tabs.appendChild(tab);
      });
      if (summaries[0]) renderDetail(summaries[0]);
      content.classList.remove('hidden');
      status.textContent = summaries.length >= MAX_DAYS
        ? '오늘부터 7일을 비교합니다. 뒤 날짜는 예보 공급원이 달라질 수 있습니다.'
        : `현재 ${summaries.length}일 전망까지 확인할 수 있습니다.`;
    }

    button.addEventListener('click', async () => {
      const position = findLatestForecastPosition(root.performance, root.location?.href, root.localStorage);
      if (!position) {
        status.textContent = '먼저 현재 위치나 서울 예시로 오늘 예보를 확인해 주세요.';
        return;
      }
      const nextKey = `${position.latitude.toFixed(4)},${position.longitude.toFixed(4)}`;
      button.disabled = true;
      button.textContent = '7일 전망 불러오는 중…';
      status.textContent = '기상청 단기예보를 우선 확인하고, 부족한 날짜만 연장 전망으로 채우는 중입니다.';
      try {
        if (!rawCache || cacheKey !== nextKey) {
          rawCache = await fetchWeekData(root, position);
          cacheKey = nextKey;
        }
        render(rawCache);
        button.textContent = '7일 전망 새로 보기';
      } catch (error) {
        console.error(error);
        status.textContent = '7일 전망을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
        button.textContent = '7일 전망 다시 시도';
      } finally {
        button.disabled = false;
      }
    });
    return true;
  }

  return {
    USER_STORAGE_KEY,
    DAY_START_HOUR,
    DAY_END_HOUR,
    MAX_DAYS,
    KMA_MAX_HOURS,
    dayKey,
    hourOf,
    kstNowParts,
    createDateKeys,
    parseKmaForecastItems,
    parseOpenMeteoHourly,
    readScoringOffsets,
    scoreHours,
    relevantDayHours,
    summarizeDay,
    mergeDailySources,
    findLatestForecastPosition,
    fetchWeekData,
    install
  };
}));