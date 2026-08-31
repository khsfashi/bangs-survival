(function initBangsFairyGacha(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.BangsFairyGacha = api;
    const start = () => api.bind(root.document, root.localStorage, root.crypto);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const STORAGE_KEY = 'bangs-fairy-gacha-v1';
  const LEGACY_WEATHER_KEYS = ['rain', 'wind', 'humid', 'clear', 'cloud'];
  const ORDER = [
    'drop', 'breeze', 'puff', 'sunny', 'cloudy', 'roller',
    'dew', 'peach', 'moon', 'ribbon', 'rainbow', 'stardust'
  ];

  const DEFINITIONS = Object.freeze({
    drop: { name: '톡톡방울 요정', rarity: 'common', affinities: ['rain'], body: '#8bcaf2', accent: '#4f78b8', message: '빗방울이 와도 너무 낙담하지 말아요. 오늘은 우산과 함께 천천히 가요.', shape: 'drop' },
    breeze: { name: '살랑바람 요정', rarity: 'common', affinities: ['wind'], body: '#a8e1d4', accent: '#558f8a', message: '바람이 장난치는 날이에요. 이동할 때만 핀으로 살짝 지켜줘요.', shape: 'bunny' },
    puff: { name: '보송솜 요정', rarity: 'common', affinities: ['humid'], body: '#dcc3ee', accent: '#9571ad', message: '습기가 많은 날에는 완벽함보다 보송함을 지키는 쪽이 이득이에요.', shape: 'puff' },
    sunny: { name: '햇살리본 요정', rarity: 'common', affinities: ['clear'], body: '#ffd77a', accent: '#df8c77', message: '오늘은 앞머리가 비교적 편안한 날이에요. 가볍게 세팅하고 나가요.', shape: 'sun' },
    cloudy: { name: '구름빗 요정', rarity: 'common', affinities: ['cloud'], body: '#c9c7ed', accent: '#7773aa', message: '애매한 날에는 작은 빗 하나만 챙겨도 마음이 꽤 든든해져요.', shape: 'cloud' },
    roller: { name: '몽글롤 요정', rarity: 'common', affinities: ['clear', 'cloud'], body: '#f4b6cf', accent: '#c95c86', message: '헤어롤 속에서 제일 먼저 나온 친구예요. 오늘의 볼륨을 가볍게 응원해요.', shape: 'roller' },
    dew: { name: '새벽이슬 요정', rarity: 'rare', affinities: ['humid', 'rain'], body: '#a8d8f0', accent: '#597fa5', message: '이슬이 많은 날에는 수분 변화를 먼저 봐요. 조급하게 고데기를 덧대지 않아도 괜찮아요.', shape: 'drop' },
    peach: { name: '복숭아솜 요정', rarity: 'rare', affinities: ['cloud', 'humid'], body: '#ffc1c9', accent: '#d66f80', message: '오늘은 부드럽게 정돈하는 날이에요. 손으로 자꾸 만지는 횟수만 줄여도 좋아요.', shape: 'puff' },
    moon: { name: '달빛핀 요정', rarity: 'rare', affinities: ['wind', 'cloud'], body: '#b9b7e8', accent: '#6e6ca6', message: '긴 외출이라면 작은 핀 하나가 큰 도움이 돼요. 필요할 때만 꺼내 쓰면 돼요.', shape: 'moon' },
    ribbon: { name: '리본바람 요정', rarity: 'rare', affinities: ['wind', 'clear'], body: '#f8aec8', accent: '#c65380', message: '바람이 있어도 예쁘게 다녀올 수 있어요. 세팅보다 이동 중 보호가 더 중요할 수 있어요.', shape: 'ribbon' },
    rainbow: { name: '무지개롤 요정', rarity: 'special', affinities: ['rain', 'clear'], body: '#ffe59a', accent: '#bd6f9e', message: '비와 햇빛이 같이 오는 날에 잘 나타나는 특별한 친구예요. 오늘도 기분 좋은 일 하나는 생길 거예요.', shape: 'rainbow' },
    stardust: { name: '별가루빗 요정', rarity: 'special', affinities: ['humid', 'wind', 'cloud'], body: '#d5c5f2', accent: '#8066b0', message: '조금 까다로운 날씨를 견디고 나온 특별한 친구예요. 완벽하지 않아도 충분히 예뻐요.', shape: 'star' }
  });

  const RARITY_LABEL = Object.freeze({ common: '일반', rare: '희귀', special: '반짝' });
  const BASE_WEIGHTS = Object.freeze({ common: 10, rare: 4, special: 3 });

  function definitionFor(key) { return DEFINITIONS[key] || DEFINITIONS.cloudy; }
  function rarityLabel(rarity) { return RARITY_LABEL[rarity] || RARITY_LABEL.common; }

  function clampRandom(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(0.999999999, Math.max(0, number));
  }

  function secureRandom01(cryptoObject) {
    if (cryptoObject?.getRandomValues) {
      const values = new Uint32Array(1);
      cryptoObject.getRandomValues(values);
      return values[0] / 4294967296;
    }
    return Math.random();
  }

  function weightFor(definition, weatherKind) {
    const base = BASE_WEIGHTS[definition.rarity] || BASE_WEIGHTS.common;
    return definition.affinities.includes(weatherKind) ? base * 1.8 : base;
  }

  function drawFairy(weatherKind, randomValue) {
    const weather = LEGACY_WEATHER_KEYS.includes(weatherKind) ? weatherKind : 'cloud';
    const weighted = ORDER.map((key) => ({ key, weight: weightFor(DEFINITIONS[key], weather) }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = clampRandom(randomValue) * total;
    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor < 0) return entry.key;
    }
    return weighted.at(-1).key;
  }

  function face(accent) {
    return `<g fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M43 66q6 6 12 0M67 66q6 6 12 0"/><path d="M53 80q7 7 14 0"/></g><g fill="#f290ad" opacity=".7"><ellipse cx="40" cy="76" rx="6" ry="3"/><ellipse cx="82" cy="76" rx="6" ry="3"/></g>`;
  }

  function shapeSvg(definition) {
    const { shape, body, accent } = definition;
    if (shape === 'drop') return `<path d="M60 18C48 36 31 52 31 72c0 19 13 32 29 32s29-13 29-32c0-20-17-36-29-54Z" fill="${body}"/><path d="M42 45c7-9 15-14 23-15" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>${face(accent)}`;
    if (shape === 'bunny') return `<path d="M34 44c-8-20 2-30 16-11l9 13c3-16 8-27 16-27 10 0 11 14 4 30 10 5 17 15 17 28 0 19-14 30-35 30S27 96 27 77c0-15 8-27 21-31l-14-2Z" fill="${body}"/><path d="M86 31c7 3 13 7 17 13M91 21c7 2 14 6 19 11" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>${face(accent)}`;
    if (shape === 'puff') return `<g fill="${body}"><circle cx="43" cy="50" r="22"/><circle cx="69" cy="43" r="25"/><circle cx="86" cy="62" r="20"/><circle cx="38" cy="75" r="22"/><circle cx="65" cy="78" r="30"/></g>${face(accent)}`;
    if (shape === 'sun') return `<g fill="none" stroke="${body}" stroke-width="7" stroke-linecap="round"><path d="M60 10v12M60 99v12M10 60h12M99 60h12M25 25l9 9M86 86l9 9M95 25l-9 9M34 86l-9 9"/></g><circle cx="60" cy="60" r="38" fill="${body}"/>${face(accent)}`;
    if (shape === 'cloud') return `<path d="M31 88c-13 0-20-9-20-20 0-12 9-21 21-21 3-16 15-26 29-26 16 0 28 11 30 28 11 1 18 9 18 19 0 12-9 20-22 20H31Z" fill="${body}"/><path d="M29 42l8-13 10 16M91 45l-5-16-11 14" fill="${body}" stroke="${accent}" stroke-width="3" stroke-linejoin="round"/>${face(accent)}`;
    if (shape === 'roller') return `<g transform="translate(21 29) rotate(-7 39 31)"><rect x="4" y="10" width="70" height="47" rx="20" fill="${body}"/><rect x="12" y="15" width="54" height="37" rx="16" fill="#fff" opacity=".28"/><g stroke="${accent}" stroke-width="2.4" opacity=".75"><path d="M16 18v31M25 15v37M34 14v39M43 14v39M52 15v37M61 18v31"/></g><circle cx="5" cy="33" r="8" fill="${accent}"/><circle cx="73" cy="33" r="8" fill="${accent}"/></g>${face(accent)}`;
    if (shape === 'moon') return `<path d="M78 20c-24 5-39 23-39 44 0 23 18 40 41 40 9 0 17-3 24-8-8 2-14 2-20 0-20-6-31-27-24-46 4-12 10-22 18-30Z" fill="${body}"/><path d="M91 36l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="${accent}"/>${face(accent)}`;
    if (shape === 'ribbon') return `<circle cx="60" cy="68" r="34" fill="${body}"/><g transform="translate(60 34)"><path d="M0 8C12-7 28-3 27 8 26 19 12 22 0 8Z" fill="#ffcadb"/><path d="M0 8C-12-7-28-3-27 8-26 19-12 22 0 8Z" fill="#ffcadb"/><circle cy="8" r="8" fill="${accent}"/></g>${face(accent)}`;
    if (shape === 'rainbow') return `<path d="M20 72a40 40 0 0 1 80 0" fill="none" stroke="#f08ca9" stroke-width="12" stroke-linecap="round"/><path d="M30 72a30 30 0 0 1 60 0" fill="none" stroke="#ffd879" stroke-width="11" stroke-linecap="round"/><path d="M40 72a20 20 0 0 1 40 0" fill="none" stroke="#91d6c3" stroke-width="10" stroke-linecap="round"/><circle cx="60" cy="79" r="27" fill="${body}"/>${face(accent)}`;
    return `<path d="M60 14l12 25 28 4-20 20 5 28-25-13-25 13 5-28-20-20 28-4Z" fill="${body}"/><g fill="#fff" opacity=".85"><circle cx="27" cy="27" r="4"/><circle cx="96" cy="26" r="3"/><circle cx="100" cy="91" r="4"/></g>${face(accent)}`;
  }

  function getFairySvg(key, options = {}) {
    const safeKey = ORDER.includes(key) ? key : 'cloudy';
    const definition = definitionFor(safeKey);
    const locked = options.locked === true;
    const label = locked ? '아직 만나지 못한 앞머리 요정' : definition.name;
    return `<svg class="fairy-svg${locked ? ' is-locked' : ''}" viewBox="0 0 120 120" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><g class="fairy-artwork">${shapeSvg(definition)}</g>${locked ? '<circle cx="60" cy="60" r="42" fill="#fff" opacity=".35"/><path d="M39 60h42" stroke="#887c84" stroke-width="7" stroke-linecap="round" opacity=".38"/>' : ''}</svg>`;
  }

  // SVG Repo의 CC0 Hair Rollers(https://www.svgrepo.com/svg/9646/hair-rollers)를 참고했지만,
  // 앱에는 27KB 원본 대신 동일 개념을 단순 도형으로 다시 그린 로컬 1KB 이하 버전을 사용합니다.
  function getHairRollerSvg() {
    return `<svg class="hair-roller-svg" viewBox="0 0 160 110" role="img" aria-label="핑크 헤어롤" xmlns="http://www.w3.org/2000/svg"><g class="hair-roller-body" transform="translate(15 20)"><rect x="13" y="16" width="104" height="54" rx="25" fill="#f5a9c6"/><rect x="22" y="22" width="86" height="42" rx="19" fill="#ffd4e4"/><g stroke="#ce5c87" stroke-width="2.5" opacity=".75"><path d="M31 24v38M42 22v42M53 21v44M64 21v44M75 21v44M86 22v42M97 24v38"/></g><circle cx="14" cy="43" r="13" fill="#d96892"/><circle cx="116" cy="43" r="13" fill="#d96892"/><path d="M5 43h18M107 43h18" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></g><g class="hair-roller-sparkles" fill="#ffd35b"><path d="M137 17l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><path d="M24 10l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g></svg>`;
  }

  function readState(storage) {
    try {
      const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) || '{}');
      const draws = Array.isArray(parsed.draws) ? parsed.draws.filter((entry) => entry && ORDER.includes(entry.key) && /^\d{4}-\d{2}-\d{2}$/.test(entry.day || '')) : [];
      return { draws: draws.slice(-120) };
    } catch {
      return { draws: [] };
    }
  }

  function writeState(storage, state) {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify({ draws: state.draws.slice(-120) })); } catch { /* localStorage unavailable */ }
  }

  function dayKey(date = new Date()) {
    try { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
    catch { return date.toISOString().slice(0, 10); }
  }

  function getDrawForDay(state, day) { return state.draws.find((entry) => entry.day === day) || null; }

  function upsertDraw(state, draw) {
    const draws = Array.isArray(state?.draws) ? state.draws.slice() : [];
    const index = draws.findIndex((entry) => entry.day === draw.day);
    if (index >= 0) draws[index] = draw;
    else draws.push(draw);
    return { draws: draws.slice(-120) };
  }

  function unlockedKeys(state) { return new Set((state?.draws || []).map((entry) => entry.key).filter((key) => ORDER.includes(key))); }

  function createBook(document, card) {
    let book = card.querySelector('#fairyGachaBook');
    if (book) return book;
    const legacy = card.querySelector('#fairyBook');
    if (legacy) legacy.hidden = true;
    book = document.createElement('details');
    book.id = 'fairyGachaBook';
    book.className = 'fairy-book fairy-gacha-book';
    book.innerHTML = '<summary><span>앞머리 요정 도감</span><strong id="fairyGachaBookCount">0/12</strong></summary><p class="fairy-book-note">하루 한 번 헤어롤에서 요정을 뽑아요. 날씨와 어울리는 친구의 확률이 조금 올라가지만, 결과는 랜덤이에요. 재화·결제·재뽑기는 없어요.</p><div id="fairyGachaCollection" class="fairy-collection" aria-live="polite"></div>';
    card.appendChild(book);
    return book;
  }

  function renderBook(document, state, card) {
    createBook(document, card);
    const collection = card.querySelector('#fairyGachaCollection');
    const count = card.querySelector('#fairyGachaBookCount');
    if (!collection || !count) return;
    const unlocked = unlockedKeys(state);
    count.textContent = `${unlocked.size}/${ORDER.length}`;
    collection.replaceChildren(...ORDER.map((key) => {
      const definition = DEFINITIONS[key];
      const found = unlocked.has(key);
      const item = document.createElement('article');
      item.className = `fairy-book-item${found ? ' is-unlocked' : ' is-locked'}`;
      item.innerHTML = `<div class="fairy-book-art">${getFairySvg(key, { locked: !found })}</div><strong>${found ? definition.name : '??? 요정'}</strong><span>${found ? rarityLabel(definition.rarity) : '아직 비밀'}</span>`;
      return item;
    }));
  }

  function setText(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }

  function bind(document, storage, cryptoObject) {
    const card = document.querySelector('#companionCard');
    const host = document.querySelector('#companionIllustration');
    const name = document.querySelector('#companionName');
    const message = document.querySelector('#companionMessage');
    const badge = document.querySelector('#companionBadge');
    const countText = document.querySelector('#companionCount');
    if (!card || !host || !name || !message || !badge) return;

    let action = card.querySelector('#fairyGachaAction');
    if (!action) {
      action = document.createElement('div');
      action.id = 'fairyGachaAction';
      action.className = 'fairy-gacha-action';
      action.innerHTML = '<button id="fairyGachaButton" class="primary-button fairy-gacha-button" type="button">헤어롤 굴려서 요정 뽑기</button><span class="fairy-gacha-rule">하루 1회 무료 · 재뽑기 없음</span>';
      card.querySelector('.companion-copy')?.insertAdjacentElement('afterend', action);
    }
    const button = action.querySelector('#fairyGachaButton');
    let drawing = false;

    const sync = () => {
      const currentWeather = card.dataset.kind;
      if (LEGACY_WEATHER_KEYS.includes(currentWeather)) card.dataset.weatherKind = currentWeather;
      const state = readState(storage);
      const today = dayKey();
      const draw = getDrawForDay(state, today);
      renderBook(document, state, card);

      if (!draw) {
        card.dataset.gachaState = 'ready';
        setText(badge, '오늘 1회 무료');
        setText(name, '오늘의 앞머리 요정 뽑기');
        setText(message, '핑크 헤어롤을 굴리면 오늘 함께할 요정이 뿅 하고 나와요.');
        host.innerHTML = getHairRollerSvg();
        button.disabled = false;
        setText(button, '헤어롤 굴려서 요정 뽑기');
        setText(countText, `도감은 ${unlockedKeys(state).size}/${ORDER.length}종 열렸어요.`);
        return;
      }

      const definition = definitionFor(draw.key);
      card.dataset.gachaState = 'revealed';
      setText(badge, `${rarityLabel(definition.rarity)} · 오늘의 요정`);
      setText(name, definition.name);
      setText(message, definition.message);
      host.innerHTML = getFairySvg(draw.key);
      button.disabled = true;
      setText(button, '오늘의 요정을 만났어요');
      setText(countText, `지금까지 ${state.draws.length}번 뽑았고, 도감은 ${unlockedKeys(state).size}/${ORDER.length}종 열렸어요.`);
    };

    button.addEventListener('click', () => {
      if (drawing) return;
      const state = readState(storage);
      const today = dayKey();
      if (getDrawForDay(state, today)) { sync(); return; }
      drawing = true;
      button.disabled = true;
      card.dataset.gachaState = 'drawing';
      host.innerHTML = getHairRollerSvg();
      action.classList.add('is-drawing');
      host.classList.add('is-drawing');
      const weatherKind = LEGACY_WEATHER_KEYS.includes(card.dataset.weatherKind) ? card.dataset.weatherKind : 'cloud';
      const randomValue = secureRandom01(cryptoObject);
      const key = drawFairy(weatherKind, randomValue);
      const definition = definitionFor(key);
      const next = upsertDraw(state, {
        day: today,
        key,
        rarity: definition.rarity,
        weatherKind,
        drawnAt: new Date().toISOString()
      });
      window.setTimeout(() => {
        writeState(storage, next);
        host.classList.remove('is-drawing');
        host.classList.add('is-pop');
        action.classList.remove('is-drawing');
        drawing = false;
        sync();
        window.setTimeout(() => host.classList.remove('is-pop'), 650);
      }, 900);
    });

    let syncQueued = false;
    const queueSync = () => {
      if (drawing || syncQueued) return;
      syncQueued = true;
      window.setTimeout(() => { syncQueued = false; sync(); }, 0);
    };
    const observer = new MutationObserver(queueSync);
    observer.observe(card, { attributes: true, attributeFilter: ['data-kind'] });
    observer.observe(name, { childList: true, characterData: true, subtree: true });
    observer.observe(message, { childList: true, characterData: true, subtree: true });
    sync();
  }

  return {
    ORDER: ORDER.slice(), DEFINITIONS, RARITY_LABEL, drawFairy, getFairySvg, getHairRollerSvg,
    readState, writeState, dayKey, getDrawForDay, upsertDraw, unlockedKeys, bind
  };
}));
