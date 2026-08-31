(() => {
'use strict';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const DICEBEAR_API_BASE = 'https://api.dicebear.com/10.x';
const STORAGE_KEY = 'bangs-survival-v1';
const SEOUL = { latitude: 37.5665, longitude: 126.9780, label: '서울특별시 중구', source: 'demo' };
const GOOD_ACCURACY_METERS = 80;
const LOW_ACCURACY_METERS = 500;
const LOCATION_JUMP_KM = 10;
const REFINE_WINDOW_MS = 4500;
const GEO_HARD_TIMEOUT_MS = 18000;
const logic = window.BangsLogic;
const mapApi = window.BangsMap;

const state = {
  lastPosition: null,
  selectedPosition: null,
  lastForecast: null,
  mapPicker: null,
  autoOpenedFor: null,
  settings: loadSettings()
};

const el = {
  permissionCard: document.querySelector('#permissionCard'),
  loadingCard: document.querySelector('#loadingCard'),
  loadingText: document.querySelector('#loadingCard p'),
  errorCard: document.querySelector('#errorCard'),
  forecastView: document.querySelector('#forecastView'),
  locationButton: document.querySelector('#locationButton'),
  demoButton: document.querySelector('#demoButton'),
  retryButton: document.querySelector('#retryButton'),
  errorMessage: document.querySelector('#errorMessage'),
  locationLabel: document.querySelector('#locationLabel'),
  updatedLabel: document.querySelector('#updatedLabel'),
  gridLabel: document.querySelector('#gridLabel'),
  sourceBadge: document.querySelector('#sourceBadge'),
  editLocationButton: document.querySelector('#editLocationButton'),
  mapPanel: document.querySelector('#mapPanel'),
  mapContainer: document.querySelector('#map'),
  mapStatus: document.querySelector('#mapStatus'),
  applyMapPositionButton: document.querySelector('#applyMapPositionButton'),
  scoreRing: document.querySelector('#scoreRing'),
  scoreValue: document.querySelector('#scoreValue'),
  verdictBadge: document.querySelector('#verdictBadge'),
  verdictTitle: document.querySelector('#verdictTitle'),
  verdictDescription: document.querySelector('#verdictDescription'),
  reasonChips: document.querySelector('#reasonChips'),
  mascot: document.querySelector('#mascot'),
  mascotImage: document.querySelector('#mascotImage'),
  mascotStatus: document.querySelector('#mascotStatus'),
  adviceList: document.querySelector('#adviceList'),
  companionCard: document.querySelector('#companionCard'),
  companionImage: document.querySelector('#companionImage'),
  companionBadge: document.querySelector('#companionBadge'),
  companionName: document.querySelector('#companionName'),
  companionMessage: document.querySelector('#companionMessage'),
  companionCount: document.querySelector('#companionCount'),
  bestWindowTitle: document.querySelector('#bestWindowTitle'),
  bestWindowDescription: document.querySelector('#bestWindowDescription'),
  timeline: document.querySelector('#timeline'),
  feedbackStatus: document.querySelector('#feedbackStatus'),
  dataSourceLabel: document.querySelector('#dataSourceLabel'),
  settingsButton: document.querySelector('#settingsButton'),
  settingsDialog: document.querySelector('#settingsDialog'),
  saveSettingsButton: document.querySelector('#saveSettingsButton')
};

init();

function init() {
  if (!logic) {
    showError('앱 로직을 불러오지 못했습니다. 새로고침해 주세요.');
    return;
  }
  el.locationButton?.addEventListener('click', requestCurrentLocation);
  el.demoButton?.addEventListener('click', () => usePosition(SEOUL));
  el.retryButton?.addEventListener('click', () => state.lastPosition ? usePosition(state.lastPosition) : requestCurrentLocation());
  el.editLocationButton?.addEventListener('click', openLocationPicker);
  el.applyMapPositionButton?.addEventListener('click', applySelectedMapPosition);
  el.settingsButton?.addEventListener('click', openSettings);
  el.saveSettingsButton?.addEventListener('click', saveSettingsFromDialog);
  document.querySelectorAll('[data-feedback]').forEach((button) => button.addEventListener('click', () => saveFeedback(button.dataset.feedback)));
  setupRemoteImageFallback(el.mascotImage);
  setupRemoteImageFallback(el.companionImage);
  renderSavedLocationShortcut();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

function setupRemoteImageFallback(image) {
  if (!image) return;
  image.addEventListener('error', () => image.closest('.remote-art')?.classList.add('asset-failed'));
  image.addEventListener('load', () => image.closest('.remote-art')?.classList.remove('asset-failed'));
}

function requestCurrentLocation() {
  removeLocationMismatchChoice();
  if (!navigator.geolocation) {
    showError('이 브라우저에서는 위치 기능을 사용할 수 없습니다. 저장 위치나 서울 예시를 이용해 주세요.');
    return;
  }

  showLoading('현재 위치를 정확하게 잡는 중입니다. 잠시만 기다려 주세요.');
  if (el.locationButton) {
    el.locationButton.disabled = true;
    el.locationButton.textContent = '정확한 위치 확인 중…';
  }

  let best = null;
  let watchId = null;
  let refineTimer = null;
  let finished = false;

  const cleanup = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (refineTimer) clearTimeout(refineTimer);
    clearTimeout(hardTimer);
    if (el.locationButton) {
      el.locationButton.disabled = false;
      el.locationButton.textContent = '현재 위치로 확인하기';
    }
  };

  const finish = () => {
    if (finished || !best) return;
    finished = true;
    cleanup();
    const candidate = {
      latitude: best.coords.latitude,
      longitude: best.coords.longitude,
      accuracy: Number.isFinite(best.coords.accuracy) ? best.coords.accuracy : null,
      label: '현재 위치',
      source: 'geolocation'
    };
    handleGeolocationCandidate(candidate).catch((error) => {
      console.error(error);
      showError('현재 위치를 확인하는 중 오류가 났습니다. 저장 위치나 지도 보정을 이용해 주세요.');
    });
  };

  const fail = (error) => {
    if (finished) return;
    finished = true;
    cleanup();
    if (error?.code === error.PERMISSION_DENIED) {
      showError('위치 권한이 꺼져 있습니다. 브라우저의 위치 권한을 허용하거나 저장 위치를 이용해 주세요.');
    } else {
      showError('현재 위치를 충분히 정확하게 확인하지 못했습니다. 다시 시도하거나 저장 위치를 이용해 주세요.');
    }
  };

  const hardTimer = setTimeout(() => best ? finish() : fail(null), GEO_HARD_TIMEOUT_MS);

  watchId = navigator.geolocation.watchPosition((position) => {
    const accuracy = Number(position.coords.accuracy);
    const bestAccuracy = Number(best?.coords?.accuracy);
    if (!best || !Number.isFinite(bestAccuracy) || (Number.isFinite(accuracy) && accuracy < bestAccuracy)) best = position;

    if (el.loadingText && Number.isFinite(accuracy)) {
      el.loadingText.textContent = `현재 위치를 다듬는 중입니다. 브라우저가 보고한 정확도는 약 ±${formatDistance(accuracy)}입니다.`;
    }

    if (Number.isFinite(accuracy) && accuracy <= GOOD_ACCURACY_METERS) {
      finish();
      return;
    }

    if (!refineTimer) refineTimer = setTimeout(finish, REFINE_WINDOW_MS);
  }, (error) => {
    if (error?.code === error.PERMISSION_DENIED || !best) fail(error);
  }, {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0
  });
}

async function handleGeolocationCandidate(candidate) {
  const resolved = await resolvePositionLabel(candidate);
  const saved = state.settings.savedLocation;
  if (saved && logic.isSuspiciousLocationJump(resolved, saved, LOCATION_JUMP_KM)) {
    const distance = logic.distanceKm(resolved, saved);
    showLocationMismatchChoice(resolved, saved, distance);
    return;
  }
  await useResolvedPosition(resolved);
}

async function usePosition(position) {
  const resolved = await resolvePositionLabel(position);
  await useResolvedPosition(resolved);
}

async function useResolvedPosition(resolved) {
  removeLocationMismatchChoice();
  state.lastPosition = resolved;
  state.selectedPosition = resolved;
  await fetchForecast(resolved);
}

async function resolvePositionLabel(position) {
  if (position?.region?.label) return { ...position, label: position.region.label };
  if (!mapApi) return position;
  const region = await mapApi.resolveRegion(position);
  return region ? { ...position, label: region.label, region } : position;
}

function showLocationMismatchChoice(candidate, saved, distanceKm) {
  showOnly('permission');
  removeLocationMismatchChoice();
  const panel = document.createElement('div');
  panel.id = 'locationMismatchPanel';
  panel.className = 'location-choice-panel';

  const title = document.createElement('strong');
  title.textContent = '현재 위치가 마지막 확인 위치와 많이 달라요';
  const description = document.createElement('p');
  const distance = Number.isFinite(distanceKm) ? `${Math.round(distanceKm)}km` : '멀리';
  description.textContent = `브라우저는 '${candidate.label || '현재 위치'}'를 찾았지만, 마지막으로 지도에서 확인한 '${saved.label}'와 약 ${distance} 차이 납니다. PC 위치는 크게 틀릴 수 있으니 사용할 위치를 골라 주세요.`;

  const actions = document.createElement('div');
  actions.className = 'location-choice-actions';
  const savedButton = document.createElement('button');
  savedButton.type = 'button';
  savedButton.className = 'primary-button';
  savedButton.textContent = `저장 위치 사용 · ${saved.label}`;
  savedButton.addEventListener('click', () => usePosition({ ...saved, source: 'saved' }));

  const currentButton = document.createElement('button');
  currentButton.type = 'button';
  currentButton.className = 'secondary-button';
  currentButton.textContent = `브라우저 위치 사용 · ${candidate.label || '현재 위치'}`;
  currentButton.addEventListener('click', () => useResolvedPosition(candidate));

  actions.append(savedButton, currentButton);
  panel.append(title, description, actions);
  const privacyNote = el.permissionCard?.querySelector('.privacy-note');
  if (privacyNote) el.permissionCard.insertBefore(panel, privacyNote);
  else el.permissionCard?.appendChild(panel);
}

function removeLocationMismatchChoice() {
  document.querySelector('#locationMismatchPanel')?.remove();
}

function renderSavedLocationShortcut() {
  const saved = state.settings.savedLocation;
  let button = document.querySelector('#savedLocationButton');
  if (!saved) {
    button?.remove();
    return;
  }
  if (!button) {
    button = document.createElement('button');
    button.id = 'savedLocationButton';
    button.type = 'button';
    button.className = 'secondary-button saved-location-button';
    el.locationButton?.insertAdjacentElement('afterend', button);
  }
  button.textContent = `최근 확인 위치로 보기 · ${saved.label}`;
  button.onclick = () => usePosition({ ...saved, source: 'saved' });
}

function savePreferredLocation(position) {
  const saved = logic.normalizeSavedLocation({
    ...position,
    label: position.region?.label || position.label,
    savedAt: new Date().toISOString()
  });
  if (!saved) return;
  state.settings.savedLocation = saved;
  persistSettings();
  renderSavedLocationShortcut();
}

async function fetchForecast(position) {
  state.lastPosition = position;
  showLoading('동네 날씨를 읽고 앞머리 상태를 계산하는 중입니다.');
  try {
    const kma = await fetchKmaForecast(position);
    if (kma) {
      const forecast = buildForecastFromHours(kma.hours, position.label, 'KMA', kma.grid);
      state.lastForecast = forecast;
      renderForecast(forecast);
      return;
    }
    const fallback = await fetchOpenMeteoForecast(position);
    const forecast = buildForecastFromOpenMeteo(fallback, position.label);
    state.lastForecast = forecast;
    renderForecast(forecast);
  } catch (error) {
    console.error(error);
    showError('날씨 데이터를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
  }
}

async function fetchKmaForecast(position) {
  try {
    const params = new URLSearchParams({ lat: String(position.latitude), lon: String(position.longitude) });
    const response = await fetch(`/api/weather?${params}`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.source === 'KMA' && Array.isArray(payload.hours) ? payload : null;
  } catch {
    return null;
  }
}

async function fetchOpenMeteoForecast(position) {
  const params = new URLSearchParams({
    latitude: String(position.latitude),
    longitude: String(position.longitude),
    hourly: 'temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,wind_speed_10m',
    forecast_days: '2',
    timezone: 'auto'
  });
  const response = await fetch(`${OPEN_METEO_URL}?${params}`);
  if (!response.ok) throw new Error(`weather_http_${response.status}`);
  return response.json();
}

function buildForecastFromHours(rawHours, label, source, grid) {
  const calibration = logic.getCalibrationOffset(state.settings.feedback);
  const sensitivity = logic.getSensitivityOffset(state.settings.sensitivity);
  const hours = rawHours.slice(0, 12).map((hour) => {
    const metrics = {
      temperature: safeNumber(hour.metrics.temperature),
      humidity: safeNumber(hour.metrics.humidity),
      dewPoint: safeNumber(hour.metrics.dewPoint),
      precipitation: safeNumber(hour.metrics.precipitation),
      wind: safeNumber(hour.metrics.wind)
    };
    const baseRisk = logic.calculateBaseRisk(metrics);
    const risk = logic.clamp(baseRisk + sensitivity + calibration, 0, 1);
    return { time: hour.time, metrics, baseRisk, risk, score: Math.round((1 - risk) * 100) };
  });
  if (!hours.length) throw new Error('weather_hours_missing');
  return {
    label, source, grid, generatedAt: new Date(), current: hours[0], hours,
    best: hours.reduce((best, hour) => hour.score > best.score ? hour : best, hours[0]), calibration
  };
}

function buildForecastFromOpenMeteo(data, label) {
  const hourly = data.hourly;
  if (!hourly?.time?.length) throw new Error('weather_payload_invalid');
  const now = Date.now();
  let startIndex = hourly.time.findIndex((time) => new Date(time).getTime() >= now - 1800000);
  if (startIndex < 0) startIndex = 0;
  const rawHours = [];
  for (let i = startIndex; i < Math.min(startIndex + 12, hourly.time.length); i += 1) {
    rawHours.push({
      time: hourly.time[i],
      metrics: {
        temperature: safeNumber(hourly.temperature_2m[i]),
        humidity: safeNumber(hourly.relative_humidity_2m[i]),
        dewPoint: safeNumber(hourly.dew_point_2m[i]),
        precipitation: safeNumber(hourly.precipitation_probability[i]),
        wind: safeNumber(hourly.wind_speed_10m[i])
      }
    });
  }
  return buildForecastFromHours(rawHours, label, 'Open-Meteo fallback', logic.toKmaGrid(state.lastPosition.latitude, state.lastPosition.longitude));
}

function renderForecast(forecast) {
  state.lastForecast = forecast;
  showOnly('forecast');
  const current = forecast.current;
  const verdict = logic.getVerdict(current.score);
  const advice = logic.getBangsAdvice(current.score, current.metrics, {
    hours: forecast.hours,
    best: forecast.best,
    calibration: forecast.calibration,
    feedbackCount: state.settings.feedback.length
  });

  el.locationLabel.textContent = forecast.label || '선택한 위치';
  el.updatedLabel.textContent = `${formatTime(forecast.generatedAt)} 기준`;
  el.gridLabel.textContent = buildLocationMeta(forecast.grid, state.lastPosition);
  el.gridLabel.style.color = needsLocationVerification(state.lastPosition) ? '#b54757' : '';
  el.sourceBadge.textContent = forecast.source === 'KMA' ? '기상청 동네예보' : '대체 예보';
  el.dataSourceLabel.textContent = forecast.source === 'KMA' ? '기상청 동네예보' : 'Open-Meteo fallback';
  el.scoreValue.textContent = String(current.score);
  el.scoreRing.style.setProperty('--score-angle', `${current.score * 3.6}deg`);
  el.verdictBadge.textContent = verdict.badge;
  el.verdictTitle.textContent = verdict.title;
  el.verdictDescription.textContent = verdict.description;
  el.mascot.dataset.mood = verdict.key;
  el.mascotStatus.textContent = ({ great: '오늘은 리본도 안심이에요.', okay: '작은 빗 하나만 챙겨줘요.', worried: '습기랑 바람을 같이 볼게요.', doomed: '오늘은 편한 스타일도 괜찮아요.' })[verdict.key];
  el.reasonChips.replaceChildren(...getReasons(current.metrics).map((reason) => {
    const chip = document.createElement('span');
    chip.className = 'reason-chip';
    chip.textContent = reason;
    return chip;
  }));
  el.adviceList.replaceChildren(...advice.map((entry) => {
    const item = document.createElement('article');
    item.className = 'advice-item';
    const title = document.createElement('strong');
    title.textContent = entry.title;
    const description = document.createElement('p');
    description.textContent = entry.description;
    item.append(title, description);
    return item;
  }));
  renderDailyCompanion(forecast);
  const bestDate = new Date(forecast.best.time);
  el.bestWindowTitle.textContent = `${formatHour(bestDate)} 전후가 가장 안전해요`;
  el.bestWindowDescription.textContent = `예상 생존점수 ${forecast.best.score}점입니다. 외출 시간을 조절할 수 있다면 이 시간대가 앞으로 12시간 중 가장 유리합니다.`;
  el.timeline.replaceChildren(...forecast.hours.map((hour) => createTimelineItem(hour, hour === forecast.best)));
  renderFeedbackState(forecast);

  if (needsLocationVerification(state.lastPosition)) {
    el.editLocationButton.textContent = isLikelyDesktop()
      ? 'PC 위치는 추정값이에요 · 지도에서 확인'
      : '위치가 부정확해요 · 지도에서 보정';
    const key = positionKey(state.lastPosition);
    if (state.autoOpenedFor !== key) {
      state.autoOpenedFor = key;
      window.setTimeout(() => openLocationPicker(), 0);
    }
  } else {
    el.editLocationButton.textContent = '지도에서 위치 조정';
  }
}

function renderDailyCompanion(forecast) {
  if (!el.companionCard || !logic.createDailyCompanion) return;
  const day = logic.feedbackDayKey(forecast.current.time);
  let companion = logic.getCollectedCompanion(state.settings.companions, day);
  const isNew = !companion;
  if (!companion) {
    companion = logic.createDailyCompanion(day, forecast.current.metrics, forecast.current.score);
    state.settings.companions = logic.upsertDailyCompanion(state.settings.companions, companion, 60);
    persistSettings();
  }

  el.companionBadge.textContent = isNew ? '오늘 처음 만남' : '오늘의 친구';
  el.companionName.textContent = companion.name;
  el.companionMessage.textContent = companion.message;
  el.companionCount.textContent = `지금까지 ${state.settings.companions.length}마리를 만났어요. 빠진 날이 있어도 연속 기록은 끊기지 않아요.`;
  if (el.companionImage) {
    const seed = encodeURIComponent(companion.seed);
    const nextSrc = `${DICEBEAR_API_BASE}/critters/svg?seed=${seed}`;
    if (el.companionImage.src !== nextSrc) el.companionImage.src = nextSrc;
    el.companionImage.alt = companion.name;
  }
  el.companionCard.dataset.kind = companion.key;
}

function buildLocationMeta(grid, position) {
  const parts = [];
  if (grid) parts.push(`기상청 격자 ${grid.nx}, ${grid.ny}`);
  if (position?.source === 'manual') {
    parts.push('지도에서 직접 확인');
    parts.push('최근 위치로 이 브라우저에 저장됨');
  } else if (position?.source === 'saved') {
    parts.push('최근에 지도에서 확인한 위치');
  } else if (position?.source === 'geolocation') {
    if (Number.isFinite(position?.accuracy)) parts.push(`브라우저 보고 정확도 ±${formatDistance(position.accuracy)}`);
    if (isLikelyDesktop()) parts.push('PC 위치는 실제와 크게 다를 수 있음 · 지도 확인 권장');
    else if (Number.isFinite(position?.accuracy) && position.accuracy > LOW_ACCURACY_METERS) parts.push('지도 보정 권장');
  }
  return parts.join(' · ');
}

function needsLocationVerification(position) {
  if (position?.source !== 'geolocation') return false;
  if (isLikelyDesktop()) return true;
  return Number.isFinite(position?.accuracy) && position.accuracy > LOW_ACCURACY_METERS;
}

function isLikelyDesktop() {
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') return !navigator.userAgentData.mobile;
  return !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

function positionKey(position) {
  const lat = Number(position?.latitude);
  const lon = Number(position?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) ? `${lat.toFixed(4)},${lon.toFixed(4)}` : 'unknown';
}

function formatDistance(meters) {
  if (!Number.isFinite(Number(meters))) return '알 수 없음';
  const value = Math.max(0, Number(meters));
  if (value < 1000) return `${Math.round(value)}m`;
  return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}km`;
}

async function openLocationPicker() {
  if (!state.lastPosition) return;
  el.mapPanel.classList.remove('hidden');
  if (needsLocationVerification(state.lastPosition)) {
    el.mapStatus.textContent = isLikelyDesktop()
      ? 'PC 브라우저 위치는 정확도 숫자가 좋아 보여도 실제와 크게 다를 수 있습니다. 동네·주소 검색이나 지도로 실제 위치를 확인해 주세요.'
      : `브라우저 위치가 약 ±${formatDistance(state.lastPosition.accuracy)} 범위라 부정확할 수 있습니다. 마커를 실제 동네로 옮겨 주세요.`;
  } else {
    el.mapStatus.textContent = '마커를 끌거나 지도를 눌러 위치를 바꾸세요.';
  }
  if (!mapApi) {
    el.mapStatus.textContent = '지도 모듈을 불러오지 못했습니다.';
    return;
  }
  if (!state.mapPicker) {
    state.mapPicker = await mapApi.createPicker(el.mapContainer, state.lastPosition, ({ latitude, longitude, region }) => {
      state.selectedPosition = { latitude, longitude, label: region?.label || '지도에서 선택한 위치', region, source: 'manual', accuracy: null };
      const grid = logic.toKmaGrid(latitude, longitude);
      el.mapStatus.textContent = `${state.selectedPosition.label} · 기상청 격자 ${grid.nx}, ${grid.ny} · 이 위치를 확정하면 다음 방문에도 사용할 수 있어요.`;
    });
  } else {
    state.mapPicker.setPosition(state.lastPosition);
    state.mapPicker.relayout();
  }
  if (!state.mapPicker) {
    el.mapStatus.textContent = '카카오맵 JavaScript 키가 아직 설정되지 않았습니다. Vercel 환경변수를 확인해 주세요.';
    return;
  }
  const region = await mapApi.resolveRegion(state.lastPosition);
  const grid = logic.toKmaGrid(state.lastPosition.latitude, state.lastPosition.longitude);
  const accuracyText = Number.isFinite(state.lastPosition?.accuracy) ? ` · 브라우저 보고 정확도 ±${formatDistance(state.lastPosition.accuracy)}` : '';
  const warningText = needsLocationVerification(state.lastPosition) ? ' · 실제 위치를 지도에서 확인해 주세요' : '';
  el.mapStatus.textContent = `${region?.label || state.lastPosition.label} · 기상청 격자 ${grid.nx}, ${grid.ny}${accuracyText}${warningText}`;
}

async function applySelectedMapPosition() {
  if (!state.selectedPosition) return;
  const selected = { ...state.selectedPosition, source: 'manual', accuracy: null };
  savePreferredLocation(selected);
  el.mapPanel.classList.add('hidden');
  await usePosition(selected);
}

function renderFeedbackState(forecast) {
  const day = logic.feedbackDayKey(forecast.current.time);
  const today = logic.getDailyFeedback(state.settings.feedback, day);
  document.querySelectorAll('[data-feedback]').forEach((button) => {
    const selected = button.dataset.feedback === today?.type;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const count = state.settings.feedback.length;
  if (today) {
    el.feedbackStatus.textContent = `오늘 결과는 '${logic.getFeedbackLabel(today.type)}'으로 기록되어 있습니다. 다른 버튼을 누르면 수정됩니다. 총 ${count}일 기록.`;
    return;
  }
  el.feedbackStatus.textContent = count >= 3
    ? `총 ${count}일 결과를 반영해 약 ${Math.round(Math.abs(forecast.calibration) * 100)}점 범위에서 개인 보정 중입니다.`
    : `${count}/3일 기록됨. 3일부터 개인 보정을 시작합니다.`;
}

function createTimelineItem(hour, isBest) {
  const item = document.createElement('div');
  item.className = `timeline-item${isBest ? ' best' : ''}`;
  item.setAttribute('role', 'listitem');
  const riskLabel = hour.score >= 70 ? '안전' : hour.score >= 45 ? '주의' : '위험';
  item.innerHTML = `<span class="timeline-time">${formatHour(new Date(hour.time))}</span><strong class="timeline-score">${hour.score}</strong><span class="timeline-risk">${riskLabel}</span>`;
  return item;
}

function getReasons(metrics) {
  return [
    { severity: logic.smoothstep(50, 88, metrics.humidity), text: `습도 ${Math.round(metrics.humidity)}%` },
    { severity: logic.smoothstep(8, 24, metrics.dewPoint), text: `이슬점 ${Math.round(metrics.dewPoint)}℃` },
    { severity: logic.clamp(metrics.precipitation / 100, 0, 1), text: `비 ${Math.round(metrics.precipitation)}%` },
    { severity: logic.smoothstep(6, 28, metrics.wind), text: `바람 ${Math.round(metrics.wind)}km/h` }
  ].sort((a, b) => b.severity - a.severity).map((entry) => entry.text);
}

function saveFeedback(type) {
  if (!state.lastForecast) return;
  const actualRisk = { survived: .18, shaky: .55, failed: .9 }[type];
  if (actualRisk === undefined) return;
  const day = logic.feedbackDayKey(state.lastForecast.current.time);
  state.settings.feedback = logic.upsertDailyFeedback(state.settings.feedback, {
    at: new Date().toISOString(), day, type,
    predictedRisk: state.lastForecast.current.baseRisk,
    actualRisk
  });
  persistSettings();
  renderForecast(recalibrate(state.lastForecast));
}

function recalibrate(forecast) {
  const calibration = logic.getCalibrationOffset(state.settings.feedback);
  const sensitivity = logic.getSensitivityOffset(state.settings.sensitivity);
  const hours = forecast.hours.map((hour) => {
    const risk = logic.clamp(hour.baseRisk + sensitivity + calibration, 0, 1);
    return { ...hour, risk, score: Math.round((1 - risk) * 100) };
  });
  return {
    ...forecast,
    generatedAt: new Date(),
    current: hours[0],
    hours,
    best: hours.reduce((best, hour) => hour.score > best.score ? hour : best, hours[0]),
    calibration
  };
}

function openSettings() {
  const selected = el.settingsDialog.querySelector(`input[name="sensitivity"][value="${state.settings.sensitivity}"]`);
  if (selected) selected.checked = true;
  el.settingsDialog.showModal();
}

function saveSettingsFromDialog(event) {
  event.preventDefault();
  const selected = el.settingsDialog.querySelector('input[name="sensitivity"]:checked');
  state.settings.sensitivity = selected?.value || 'normal';
  persistSettings();
  el.settingsDialog.close();
  if (state.lastForecast) renderForecast(recalibrate(state.lastForecast));
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const feedback = Array.isArray(parsed.feedback)
      ? parsed.feedback.map(logic?.normalizeFeedbackSample || ((sample) => sample)).filter(Boolean).slice(-30)
      : [];
    const savedLocation = logic?.normalizeSavedLocation ? logic.normalizeSavedLocation(parsed.savedLocation) : null;
    const companions = Array.isArray(parsed.companions) && logic?.normalizeDailyCompanion
      ? parsed.companions.map(logic.normalizeDailyCompanion).filter(Boolean).slice(-60)
      : [];
    return {
      sensitivity: ['low', 'normal', 'high'].includes(parsed.sensitivity) ? parsed.sensitivity : 'normal',
      feedback,
      savedLocation,
      companions
    };
  } catch {
    return { sensitivity: 'normal', feedback: [], savedLocation: null, companions: [] };
  }
}

function persistSettings() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings)); }
function showLoading(message) { if (el.loadingText && message) el.loadingText.textContent = message; showOnly('loading'); }
function showError(message) { if (el.errorMessage) el.errorMessage.textContent = message; showOnly('error'); }
function showOnly(target) {
  el.permissionCard?.classList.toggle('hidden', target !== 'permission');
  el.loadingCard?.classList.toggle('hidden', target !== 'loading');
  el.errorCard?.classList.toggle('hidden', target !== 'error');
  el.forecastView?.classList.toggle('hidden', target !== 'forecast');
}
function safeNumber(value) { const number = Number(value); return Number.isFinite(number) ? number : 0; }
function formatTime(date) { return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(date); }
function formatHour(date) { return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', timeZone: 'Asia/Seoul' }).format(date); }
})();
