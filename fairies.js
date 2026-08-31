(function initBangsFairies(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.BangsFairies = api;
    const start = () => api.bind(root.document, root.localStorage);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const STORAGE_KEY = 'bangs-survival-v1';
  const ORDER = ['rain', 'wind', 'humid', 'clear', 'cloud'];
  const DEFINITIONS = Object.freeze({
    rain: { name: '우산방울 요정', hint: '비가 앞머리를 노리는 날', body: '#86c8f4', accent: '#5577c9' },
    wind: { name: '살랑핀 요정', hint: '바람이 제법 장난치는 날', body: '#a8e1d4', accent: '#558f8a' },
    humid: { name: '보송솜 요정', hint: '공기 속 습기가 많은 날', body: '#d9b8ed', accent: '#9a6fb2' },
    clear: { name: '햇살리본 요정', hint: '앞머리가 편안한 날', body: '#ffd978', accent: '#e68d7b' },
    cloud: { name: '구름빗 요정', hint: '좋지도 나쁘지도 않은 날', body: '#c9c7ed', accent: '#7975ad' }
  });

  function definitionFor(key) { return DEFINITIONS[key] || DEFINITIONS.cloud; }

  function face(accent) {
    return `<g class="fairy-face" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M43 64q6 6 12 0M67 64q6 6 12 0"/><path d="M53 78q7 7 14 0"/></g><g fill="#f290ad" opacity=".72"><ellipse cx="40" cy="74" rx="6" ry="3"/><ellipse cx="82" cy="74" rx="6" ry="3"/></g>`;
  }

  function rainSvg(def) {
    return `<path d="M60 19C49 35 31 51 31 72c0 18 13 31 29 31s29-13 29-31c0-21-18-37-29-53Z" fill="${def.body}"/><path d="M29 50c8-13 20-20 31-20s23 7 31 20c-9-4-16-4-22 1-6-5-12-5-18 0-7-5-14-5-22-1Z" fill="#fff" opacity=".92"/><path d="M60 31v24" stroke="${def.accent}" stroke-width="4" stroke-linecap="round"/>${face(def.accent)}`;
  }

  function windSvg(def) {
    return `<path d="M31 42c-6-18 3-26 16-9l8 12c2-12 7-24 15-24 10 0 11 13 4 28 11 4 19 14 19 28 0 18-14 29-33 29S27 95 27 77c0-15 8-27 21-31l-17-4Z" fill="${def.body}"/><path d="M83 33c7 3 12 7 15 13M88 24c7 2 13 5 18 10" fill="none" stroke="${def.accent}" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="M31 53c7 3 12 8 15 14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>${face(def.accent)}`;
  }

  function humidSvg(def) {
    return `<g fill="${def.body}"><circle cx="43" cy="49" r="22"/><circle cx="69" cy="43" r="25"/><circle cx="85" cy="61" r="20"/><circle cx="38" cy="73" r="22"/><circle cx="65" cy="76" r="30"/></g><path d="M42 92c9 10 27 11 38 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".65"/><g transform="translate(77 24) rotate(12)"><path d="M0 9C8-2 16 0 17 7 18 14 9 15 0 9Z" fill="#f7a8c4"/><path d="M0 9C-8-2-16 0-17 7-18 14-9 15 0 9Z" fill="#f7a8c4"/><circle r="5" cy="9" fill="${def.accent}"/></g>${face(def.accent)}`;
  }

  function clearSvg(def) {
    return `<g fill="none" stroke="${def.body}" stroke-width="7" stroke-linecap="round" opacity=".85"><path d="M60 12v11M60 97v11M12 60h11M97 60h11M26 26l8 8M86 86l8 8M94 26l-8 8M34 86l-8 8"/></g><circle cx="60" cy="60" r="38" fill="${def.body}"/><g transform="translate(83 35) rotate(18)"><path d="M0 8C8-3 17 0 18 7 18 14 10 16 0 8Z" fill="#ff9cbc"/><path d="M0 8C-8-3-17 0-18 7-18 14-10 16 0 8Z" fill="#ff9cbc"/><circle cy="8" r="5" fill="${def.accent}"/></g>${face(def.accent)}`;
  }

  function cloudSvg(def) {
    return `<path d="M31 86c-13 0-20-9-20-20 0-12 9-21 21-21 3-15 15-25 29-25 16 0 28 11 30 27 11 1 18 9 18 19 0 12-9 20-22 20H31Z" fill="${def.body}"/><path d="M29 40l8-13 10 16M91 43l-5-16-11 14" fill="${def.body}" stroke="${def.accent}" stroke-width="3" stroke-linejoin="round"/><g transform="translate(88 84) rotate(-15)" stroke="${def.accent}" stroke-width="3" stroke-linecap="round"><path d="M0 0v19"/><path d="M-7 3h14M-7 8h14M-7 13h14"/></g>${face(def.accent)}`;
  }

  function getFairySvg(key, options = {}) {
    const safeKey = ORDER.includes(key) ? key : 'cloud';
    const def = definitionFor(safeKey);
    const artwork = ({ rain: rainSvg, wind: windSvg, humid: humidSvg, clear: clearSvg, cloud: cloudSvg })[safeKey](def);
    const locked = options.locked === true;
    const label = locked ? '아직 만나지 못한 앞머리 요정' : def.name;
    return `<svg class="fairy-svg${locked ? ' is-locked' : ''}" viewBox="0 0 120 120" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><g class="fairy-artwork">${artwork}</g>${locked ? '<path d="M35 60h50" stroke="#887c84" stroke-width="7" stroke-linecap="round" opacity=".38"/>' : ''}</svg>`;
  }

  function readUnlocked(storage) {
    try {
      const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) || '{}');
      return new Set((Array.isArray(parsed.companions) ? parsed.companions : []).map((entry) => entry?.key).filter((key) => ORDER.includes(key)));
    } catch {
      return new Set();
    }
  }

  function renderBook(document, storage) {
    const collection = document.querySelector('#fairyCollection');
    const count = document.querySelector('#fairyBookCount');
    if (!collection || !count) return;
    const unlocked = readUnlocked(storage);
    count.textContent = `${unlocked.size}/${ORDER.length}`;
    collection.replaceChildren(...ORDER.map((key) => {
      const def = definitionFor(key);
      const found = unlocked.has(key);
      const item = document.createElement('article');
      item.className = `fairy-book-item${found ? ' is-unlocked' : ' is-locked'}`;
      item.dataset.key = key;
      item.innerHTML = `<div class="fairy-book-art">${getFairySvg(key, { locked: !found })}</div><strong>${found ? def.name : '??? 요정'}</strong><span>${found ? def.hint : def.hint}</span>`;
      return item;
    }));
  }

  function bind(document, storage) {
    const card = document.querySelector('#companionCard');
    const host = document.querySelector('#companionIllustration');
    const book = document.querySelector('#fairyBook');
    if (!card || !host) return;

    const renderCurrent = () => {
      host.innerHTML = getFairySvg(card.dataset.kind || 'cloud');
      renderBook(document, storage);
    };

    renderCurrent();
    const observer = new MutationObserver(renderCurrent);
    observer.observe(card, { attributes: true, attributeFilter: ['data-kind'] });
    const name = document.querySelector('#companionName');
    if (name) new MutationObserver(() => renderBook(document, storage)).observe(name, { childList: true });
    book?.addEventListener('toggle', () => { if (book.open) renderBook(document, storage); });
  }

  return { ORDER: ORDER.slice(), DEFINITIONS, getFairySvg, readUnlocked, bind };
}));
