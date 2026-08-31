(function initBangsLogic(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BangsLogic = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const KMA_GRID = { RE: 6371.00877, GRID: 5.0, SLAT1: 30.0, SLAT2: 60.0, OLON: 126.0, OLAT: 38.0, XO: 43, YO: 136 };
  const COMPANION_KEYS = new Set(['rain', 'wind', 'humid', 'clear', 'cloud']);

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function smoothstep(edge0, edge1, value) {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - (2 * t));
  }

  function calculateBaseRisk({ humidity, dewPoint, precipitation, wind }) {
    const humidityRisk = smoothstep(50, 88, humidity);
    const dewPointRisk = smoothstep(8, 24, dewPoint);
    const rainRisk = clamp(precipitation / 100, 0, 1);
    const windRisk = smoothstep(6, 28, wind);
    let risk = (humidityRisk * .42) + (dewPointRisk * .25) + (rainRisk * .20) + (windRisk * .13);
    if (humidity >= 82 && precipitation >= 45) risk += .08;
    if (humidity >= 90) risk += .05;
    return clamp(risk, 0, 1);
  }

  function calculateDewPoint(temperatureC, relativeHumidity) {
    const humidity = clamp(Number(relativeHumidity), 1, 100);
    const temperature = Number(temperatureC);
    if (!Number.isFinite(temperature)) return 0;
    const a = 17.62;
    const b = 243.12;
    const gamma = Math.log(humidity / 100) + ((a * temperature) / (b + temperature));
    return (b * gamma) / (a - gamma);
  }

  function toKmaGrid(latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new TypeError('invalid_lat_lon');
    const DEGRAD = Math.PI / 180;
    const re = KMA_GRID.RE / KMA_GRID.GRID;
    const slat1 = KMA_GRID.SLAT1 * DEGRAD;
    const slat2 = KMA_GRID.SLAT2 * DEGRAD;
    const olon = KMA_GRID.OLON * DEGRAD;
    const olat = KMA_GRID.OLAT * DEGRAD;
    let sn = Math.tan((Math.PI * .25) + (slat2 * .5)) / Math.tan((Math.PI * .25) + (slat1 * .5));
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan((Math.PI * .25) + (slat1 * .5));
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
    let ro = Math.tan((Math.PI * .25) + (olat * .5));
    ro = (re * sf) / Math.pow(ro, sn);
    let ra = Math.tan((Math.PI * .25) + (lat * DEGRAD * .5));
    ra = (re * sf) / Math.pow(ra, sn);
    let theta = (lon * DEGRAD) - olon;
    if (theta > Math.PI) theta -= 2 * Math.PI;
    if (theta < -Math.PI) theta += 2 * Math.PI;
    theta *= sn;
    return {
      nx: Math.floor((ra * Math.sin(theta)) + KMA_GRID.XO + .5),
      ny: Math.floor((ro - (ra * Math.cos(theta))) + KMA_GRID.YO + .5)
    };
  }

  function chooseKmaBaseDateTime(now = new Date()) {
    const shifted = new Date(now.getTime() + (9 * 60 * 60 * 1000) - (10 * 60 * 1000));
    const year = shifted.getUTCFullYear();
    const month = shifted.getUTCMonth();
    const day = shifted.getUTCDate();
    const hour = shifted.getUTCHours();
    const candidates = [2, 5, 8, 11, 14, 17, 20, 23];
    const selected = candidates.filter((candidate) => candidate <= hour).at(-1);
    let base = new Date(Date.UTC(year, month, day, selected ?? 23, 0, 0));
    if (selected === undefined) base = new Date(base.getTime() - (24 * 60 * 60 * 1000));
    const yyyy = String(base.getUTCFullYear());
    const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(base.getUTCDate()).padStart(2, '0');
    const hh = String(base.getUTCHours()).padStart(2, '0');
    return { baseDate: `${yyyy}${mm}${dd}`, baseTime: `${hh}00` };
  }

  function parseKmaForecastItems(items, now = new Date()) {
    if (!Array.isArray(items)) return [];
    const groups = new Map();
    items.forEach((item) => {
      const date = String(item.fcstDate || '');
      const time = String(item.fcstTime || '').padStart(4, '0');
      if (!/^\d{8}$/.test(date) || !/^\d{4}$/.test(time)) return;
      const key = `${date}${time}`;
      const group = groups.get(key) || { date, time, categories: {} };
      group.categories[item.category] = Number(item.fcstValue);
      groups.set(key, group);
    });
    const nowMs = now.getTime() - (30 * 60 * 1000);
    return [...groups.values()].map((group) => {
      const { date, time, categories } = group;
      if (!Number.isFinite(categories.TMP) || !Number.isFinite(categories.REH)) return null;
      const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:00+09:00`;
      const humidity = categories.REH;
      const temperature = categories.TMP;
      return {
        time: iso,
        metrics: {
          temperature,
          humidity,
          dewPoint: calculateDewPoint(temperature, humidity),
          precipitation: Number.isFinite(categories.POP) ? categories.POP : 0,
          wind: Number.isFinite(categories.WSD) ? categories.WSD * 3.6 : 0
        }
      };
    }).filter((entry) => entry && new Date(entry.time).getTime() >= nowMs)
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .slice(0, 12);
  }

  function distanceKm(a, b) {
    const lat1 = Number(a?.latitude);
    const lon1 = Number(a?.longitude);
    const lat2 = Number(b?.latitude);
    const lon2 = Number(b?.longitude);
    if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;
    const toRad = (value) => value * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const p1 = toRad(lat1);
    const p2 = toRad(lat2);
    const h = Math.sin(dLat / 2) ** 2 + (Math.cos(p1) * Math.cos(p2) * (Math.sin(dLon / 2) ** 2));
    return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function isSuspiciousLocationJump(current, saved, thresholdKm = 10) {
    const threshold = Number(thresholdKm);
    if (!Number.isFinite(threshold) || threshold <= 0) return false;
    const distance = distanceKm(current, saved);
    return Number.isFinite(distance) && distance >= threshold;
  }

  function normalizeSavedLocation(value) {
    if (!value || typeof value !== 'object') return null;
    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    const label = typeof value.label === 'string' && value.label.trim() ? value.label.trim().slice(0, 120) : '저장한 위치';
    const region = value.region && typeof value.region === 'object' ? {
      label: typeof value.region.label === 'string' ? value.region.label.slice(0, 120) : label,
      district: typeof value.region.district === 'string' ? value.region.district.slice(0, 80) : '',
      neighborhood: typeof value.region.neighborhood === 'string' ? value.region.neighborhood.slice(0, 80) : '',
      code: typeof value.region.code === 'string' ? value.region.code.slice(0, 32) : ''
    } : null;
    const savedAt = typeof value.savedAt === 'string' && !Number.isNaN(Date.parse(value.savedAt)) ? value.savedAt : new Date().toISOString();
    return { latitude, longitude, label, region, source: 'saved', accuracy: null, savedAt };
  }

  function getSensitivityOffset(value) {
    if (value === 'low') return -.08;
    if (value === 'high') return .10;
    return 0;
  }

  function getVerdict(score) {
    if (score >= 78) return { key: 'great', badge: '오늘은 가능', title: '앞머리 해도 되겠어요', description: '현재 날씨 기준으로는 유지에 비교적 유리합니다. 그래도 장시간 야외 활동은 시간대별 점수를 확인해 주세요.' };
    if (score >= 58) return { key: 'okay', badge: '조금 애매함', title: '고정력 챙기면 도전 가능', description: '습기나 바람 중 하나가 방해할 수 있습니다. 오래 밖에 있다면 완벽하게 세팅할 날은 아닙니다.' };
    if (score >= 38) return { key: 'worried', badge: '주의', title: '오늘은 앞머리가 고생해요', description: '세팅해도 흐트러질 가능성이 높습니다. 고정 제품을 쓰거나 다른 스타일을 고려하는 편이 안전합니다.' };
    return { key: 'doomed', badge: '비추천', title: '오늘은 하지 마세요', description: '습기·비·바람 조건이 앞머리 유지에 불리합니다. 공들인 시간이 아까울 가능성이 큽니다.' };
  }

  function maxMetric(hours, key, fallback = 0) {
    if (!Array.isArray(hours) || !hours.length) return fallback;
    return hours.reduce((max, hour) => {
      const value = Number(hour?.metrics?.[key]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, fallback);
  }

  function metricAt(hours, index, key, fallback = 0) {
    const value = Number(hours?.[index]?.metrics?.[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function getBangsAdvice(score, metrics, context = {}) {
    const current = {
      humidity: Number(metrics?.humidity) || 0,
      dewPoint: Number(metrics?.dewPoint) || 0,
      precipitation: Number(metrics?.precipitation) || 0,
      wind: Number(metrics?.wind) || 0
    };
    const hours = Array.isArray(context.hours) ? context.hours : [];
    const candidates = [];
    const push = (priority, entry) => candidates.push({ priority, ...entry });

    const feedbackCount = Number(context.feedbackCount) || 0;
    const calibration = Number(context.calibration) || 0;
    if (feedbackCount >= 3 && calibration >= .04) {
      push(110, {
        key: 'personal-fragile',
        title: '내 기록에서는 조금 더 보수적으로 봐요',
        description: `최근 ${feedbackCount}일 결과에서 예보보다 쉽게 무너지는 경향이 반영됐어요. 오늘은 고정 제품을 한 단계 더 챙기는 편이 낫습니다.`
      });
    } else if (feedbackCount >= 3 && calibration <= -.04) {
      push(78, {
        key: 'personal-strong',
        title: '내 앞머리는 예상보다 잘 버티는 편이에요',
        description: `최근 ${feedbackCount}일 결과가 개인 보정에 반영됐어요. 다만 비나 강풍 경고가 있으면 그 조건을 우선해서 보세요.`
      });
    }

    const maxRain = maxMetric(hours, 'precipitation', current.precipitation);
    const maxWind = maxMetric(hours, 'wind', current.wind);
    const maxHumidity = maxMetric(hours, 'humidity', current.humidity);
    const futureHumidity = metricAt(hours, Math.min(3, Math.max(0, hours.length - 1)), 'humidity', current.humidity);
    const futureDewPoint = metricAt(hours, Math.min(3, Math.max(0, hours.length - 1)), 'dewPoint', current.dewPoint);

    if (current.precipitation >= 45) {
      push(105, {
        key: 'rain-now',
        title: '비 노출을 가장 먼저 막으세요',
        description: `현재 강수확률이 ${Math.round(current.precipitation)}%예요. 우산을 쓰더라도 바람에 젖기 쉬운 앞쪽을 가리고, 실외 체류 시간을 줄이는 편이 좋습니다.`
      });
    } else if (maxRain >= 45) {
      push(98, {
        key: 'rain-later',
        title: '뒤 시간대의 비까지 보고 준비하세요',
        description: `앞으로 12시간 안에 강수확률이 최대 ${Math.round(maxRain)}%까지 올라가요. 작은 우산이나 앞머리를 고정할 수단을 챙겨 두는 편이 안전합니다.`
      });
    }

    if (current.humidity >= 80 || current.dewPoint >= 20) {
      push(92, {
        key: 'humidity-now',
        title: '세팅은 외출 직전에 끝내세요',
        description: `현재 습도 ${Math.round(current.humidity)}%, 이슬점 ${Math.round(current.dewPoint)}℃라 수분 영향이 큰 조건이에요. 세팅 후 오래 기다리기보다 출발 직전에 마무리하세요.`
      });
    } else if ((futureHumidity - current.humidity) >= 10 || (futureDewPoint - current.dewPoint) >= 3 || maxHumidity >= 82) {
      push(84, {
        key: 'humidity-rising',
        title: '지금보다 뒤가 더 습해질 수 있어요',
        description: `현재 습도는 ${Math.round(current.humidity)}%지만 이후 최대 ${Math.round(maxHumidity)}%까지 예상돼요. 장시간 외출이라면 가벼운 재정돈 도구를 챙겨 주세요.`
      });
    }

    if (current.wind >= 20) {
      push(96, {
        key: 'wind-now',
        title: '바람을 직접 맞는 구간을 줄이세요',
        description: `현재 바람이 약 ${Math.round(current.wind)}km/h예요. 지하 통로나 실내 연결 동선을 우선하고, 필요하면 핀이나 집게로 이동 중 형태를 보호하세요.`
      });
    } else if (maxWind >= 22) {
      push(82, {
        key: 'wind-later',
        title: '뒤 시간대에는 바람이 더 강해져요',
        description: `앞으로 12시간 안에 바람이 최대 약 ${Math.round(maxWind)}km/h까지 예상돼요. 오래 밖에 있을 계획이면 고정 제품만 믿기보다 물리적으로 고정할 수단도 준비하세요.`
      });
    }

    const best = context.best;
    const bestScore = Number(best?.score);
    const improvement = Number.isFinite(bestScore) ? bestScore - Number(score) : 0;
    if (improvement >= 12 && best?.time) {
      push(88, {
        key: 'better-window',
        title: '가능하면 더 좋은 시간대로 미뤄도 좋아요',
        description: `앞으로의 가장 좋은 시간대는 현재보다 생존점수가 약 ${Math.round(improvement)}점 높아요. 일정 조정이 가능하다면 시간대별 생존도를 먼저 확인하세요.`
      });
    }

    if (score >= 78) {
      push(35, { key: 'base-good', title: '과한 고정보다 가볍게 마무리하세요', description: '현재 조건은 비교적 유리합니다. 평소 잘 맞는 방법으로 가볍게 세팅하고 불필요하게 제품을 많이 겹치지 않아도 됩니다.' });
    } else if (score >= 58) {
      push(40, { key: 'base-mid', title: '작은 빗이나 고정 도구를 하나 챙기세요', description: '완전히 나쁜 날은 아니지만 한 가지 변수만 올라가도 흔들릴 수 있습니다. 외출 중 한 번 정돈할 수 있게 준비해 두세요.' });
    } else {
      push(45, { key: 'base-bad', title: '대체 스타일을 먼저 생각해두세요', description: '오늘은 앞머리에 오래 공들이기보다 넘기거나 핀으로 고정하는 스타일이 시간을 아낄 가능성이 높습니다.' });
    }

    const seen = new Set();
    return candidates.sort((a, b) => b.priority - a.priority).filter((entry) => {
      if (seen.has(entry.key)) return false;
      seen.add(entry.key);
      return true;
    }).slice(0, 3).map(({ priority, ...entry }) => entry);
  }

  function getFeedbackLabel(type) { return { survived: '유지됨', shaky: '조금 무너짐', failed: '망함' }[type] || ''; }
  function feedbackDayKey(forecastTime) {
    if (typeof forecastTime === 'string' && /^\d{4}-\d{2}-\d{2}/.test(forecastTime)) return forecastTime.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  }
  function upsertDailyFeedback(samples, sample, maxSamples = 30) {
    const safeSamples = Array.isArray(samples) ? samples.slice() : [];
    const index = safeSamples.findIndex((entry) => entry.day === sample.day);
    if (index >= 0) safeSamples[index] = sample;
    else safeSamples.push(sample);
    return safeSamples.slice(-maxSamples);
  }
  function getDailyFeedback(samples, day) {
    if (!Array.isArray(samples)) return null;
    return samples.find((sample) => sample.day === day) || null;
  }
  function getCalibrationOffset(samples) {
    if (!Array.isArray(samples) || samples.length < 3) return 0;
    const averageError = samples.reduce((sum, sample) => sum + (sample.actualRisk - sample.predictedRisk), 0) / samples.length;
    return clamp(averageError * .55, -.15, .15);
  }
  function normalizeFeedbackSample(sample) {
    if (!sample || !Number.isFinite(sample.predictedRisk) || !Number.isFinite(sample.actualRisk)) return null;
    const at = typeof sample.at === 'string' ? sample.at : new Date().toISOString();
    return {
      at,
      day: typeof sample.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sample.day) ? sample.day : at.slice(0, 10),
      type: ['survived', 'shaky', 'failed'].includes(sample.type) ? sample.type : null,
      predictedRisk: sample.predictedRisk,
      actualRisk: sample.actualRisk
    };
  }

  function chooseCompanionKey(metrics, score) {
    const precipitation = Number(metrics?.precipitation) || 0;
    const wind = Number(metrics?.wind) || 0;
    const humidity = Number(metrics?.humidity) || 0;
    const dewPoint = Number(metrics?.dewPoint) || 0;
    if (precipitation >= 45) return 'rain';
    if (wind >= 20) return 'wind';
    if (humidity >= 80 || dewPoint >= 20) return 'humid';
    if (Number(score) >= 78) return 'clear';
    return 'cloud';
  }

  function createDailyCompanion(day, metrics, score) {
    const safeDay = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : feedbackDayKey();
    const key = chooseCompanionKey(metrics, score);
    const definitions = {
      rain: { name: '우산방울 요정', message: '빗방울 많은 날에 찾아오는 친구예요. 오늘은 앞머리보다 우산을 먼저 챙겨요.' },
      wind: { name: '살랑핀 요정', message: '바람 센 날에 나타나는 친구예요. 이동할 때는 핀이나 집게가 든든해요.' },
      humid: { name: '보송솜 요정', message: '습기 많은 날에 찾아와요. 오늘은 세팅을 출발 직전에 끝내는 편이 좋아요.' },
      clear: { name: '햇살리본 요정', message: '앞머리가 비교적 편안한 날에 만나는 친구예요. 가볍게 세팅하고 기분 좋게 나가요.' },
      cloud: { name: '구름빗 요정', message: '애매한 날씨를 함께 지켜보는 친구예요. 작은 빗 하나면 마음이 조금 편해져요.' }
    };
    const definition = definitions[key];
    return {
      day: safeDay,
      key,
      name: definition.name,
      message: definition.message,
      seed: `bangs-fairy-${safeDay}-${key}`
    };
  }

  function normalizeDailyCompanion(value) {
    if (!value || typeof value !== 'object') return null;
    const day = typeof value.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.day) ? value.day : null;
    const key = COMPANION_KEYS.has(value.key) ? value.key : null;
    const name = typeof value.name === 'string' ? value.name.trim().slice(0, 40) : '';
    const message = typeof value.message === 'string' ? value.message.trim().slice(0, 180) : '';
    const seed = typeof value.seed === 'string' ? value.seed.trim().slice(0, 100) : '';
    if (!day || !key || !name || !message || !seed) return null;
    return { day, key, name, message, seed };
  }

  function getCollectedCompanion(collection, day) {
    if (!Array.isArray(collection)) return null;
    return collection.find((entry) => entry?.day === day) || null;
  }

  function upsertDailyCompanion(collection, companion, maxItems = 60) {
    const safeCompanion = normalizeDailyCompanion(companion);
    if (!safeCompanion) return Array.isArray(collection) ? collection.map(normalizeDailyCompanion).filter(Boolean).slice(-maxItems) : [];
    const safe = Array.isArray(collection) ? collection.map(normalizeDailyCompanion).filter(Boolean) : [];
    const index = safe.findIndex((entry) => entry.day === safeCompanion.day);
    if (index >= 0) safe[index] = safeCompanion;
    else safe.push(safeCompanion);
    return safe.slice(-Math.max(1, Number(maxItems) || 60));
  }

  return {
    clamp,
    smoothstep,
    calculateBaseRisk,
    calculateDewPoint,
    toKmaGrid,
    chooseKmaBaseDateTime,
    parseKmaForecastItems,
    distanceKm,
    isSuspiciousLocationJump,
    normalizeSavedLocation,
    getSensitivityOffset,
    getVerdict,
    getBangsAdvice,
    getFeedbackLabel,
    feedbackDayKey,
    upsertDailyFeedback,
    getDailyFeedback,
    getCalibrationOffset,
    normalizeFeedbackSample,
    createDailyCompanion,
    normalizeDailyCompanion,
    getCollectedCompanion,
    upsertDailyCompanion
  };
}));
