(function initBangsOutingHorizon(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BangsOutingHorizon = api;
  if (root.document) api.install(root);
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const STORAGE_KEY = 'bangs-outing-horizon-v1';
  const DEFAULT_HOURS = 12;
  const ALLOWED_HOURS = Object.freeze([4, 8, 12]);

  function normalizeOutingHours(value) {
    const hours = Number(value);
    return ALLOWED_HOURS.includes(hours) ? hours : DEFAULT_HOURS;
  }

  function scopeHours(hours, outingHours) {
    if (!Array.isArray(hours)) return [];
    return hours.slice(0, normalizeOutingHours(outingHours));
  }

  function findBestHour(hours, fallback = null) {
    if (!Array.isArray(hours) || !hours.length) return fallback;
    return hours.reduce((best, hour) => Number(hour?.score) > Number(best?.score) ? hour : best, hours[0]);
  }

  function rewriteAdviceHorizon(entries, actualHours) {
    if (!Array.isArray(entries)) return [];
    const horizon = Math.max(1, Number(actualHours) || DEFAULT_HOURS);
    return entries.map((entry) => ({
      ...entry,
      description: typeof entry?.description === 'string'
        ? entry.description.replace(/앞으로 12시간/g, `앞으로 ${horizon}시간`)
        : entry?.description
    }));
  }

  function readStoredHours(storage) {
    try {
      return normalizeOutingHours(storage?.getItem(STORAGE_KEY));
    } catch {
      return DEFAULT_HOURS;
    }
  }

  function writeStoredHours(storage, hours) {
    const normalized = normalizeOutingHours(hours);
    try {
      storage?.setItem(STORAGE_KEY, String(normalized));
    } catch {}
    return normalized;
  }

  function install(root) {
    const document = root?.document;
    const logic = root?.BangsLogic;
    if (!document || !logic || typeof logic.getBangsAdvice !== 'function') return false;
    if (logic.getBangsAdvice.__outingHorizonWrapped) return true;

    let outingHours = readStoredHours(root.localStorage);
    const originalAdvice = logic.getBangsAdvice.bind(logic);
    const wrappedAdvice = (score, metrics, context = {}) => {
      const hours = scopeHours(context.hours, outingHours);
      const best = findBestHour(hours, context.best);
      const entries = originalAdvice(score, metrics, { ...context, hours, best });
      return rewriteAdviceHorizon(entries, hours.length || outingHours);
    };
    wrappedAdvice.__outingHorizonWrapped = true;
    logic.getBangsAdvice = wrappedAdvice;

    const settingsDialog = document.querySelector('#settingsDialog');
    const saveButton = document.querySelector('#saveSettingsButton');
    const timeline = document.querySelector('#timeline');
    const bestWindowTitle = document.querySelector('#bestWindowTitle');
    const bestWindowDescription = document.querySelector('#bestWindowDescription');

    if (settingsDialog && saveButton && !settingsDialog.querySelector('[data-outing-horizon]')) {
      const group = document.createElement('div');
      group.dataset.outingHorizon = 'true';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-labelledby', 'outingHorizonLabel');

      const label = document.createElement('p');
      label.id = 'outingHorizonLabel';
      const strong = document.createElement('strong');
      strong.textContent = '오늘 예상 외출 시간';
      label.appendChild(strong);
      group.appendChild(label);

      const options = [
        { value: 4, title: '4시간', description: '짧은 약속이나 잠깐 외출할 때 봐요.' },
        { value: 8, title: '8시간', description: '출근·등교처럼 반나절 정도 밖에 있을 때 봐요.' },
        { value: 12, title: '12시간', description: '아침부터 저녁까지 길게 외출할 때 봐요.' }
      ];

      options.forEach((option) => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'setting-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'outingHours';
        input.value = String(option.value);
        input.checked = outingHours === option.value;
        const copy = document.createElement('span');
        const title = document.createElement('strong');
        title.textContent = option.title;
        const description = document.createElement('small');
        description.textContent = option.description;
        copy.append(title, description);
        optionLabel.append(input, copy);
        group.appendChild(optionLabel);
      });

      saveButton.insertAdjacentElement('beforebegin', group);
      saveButton.addEventListener('click', () => {
        const selected = settingsDialog.querySelector('input[name="outingHours"]:checked');
        outingHours = writeStoredHours(root.localStorage, selected?.value);
        root.queueMicrotask?.(applyTimelineScope);
      });
    }

    function applyTimelineScope() {
      if (!timeline) return;
      const items = [...timeline.querySelectorAll('.timeline-item')];
      if (!items.length) return;
      const visible = items.slice(0, outingHours);
      const actualHours = visible.length;

      items.forEach((item, index) => {
        item.hidden = index >= outingHours;
        item.classList.remove('best');
      });

      let bestItem = visible[0];
      visible.forEach((item) => {
        const score = Number(item.querySelector('.timeline-score')?.textContent);
        const bestScore = Number(bestItem?.querySelector('.timeline-score')?.textContent);
        if (score > bestScore) bestItem = item;
      });
      bestItem?.classList.add('best');

      const kicker = timeline.closest('.timeline-card')?.querySelector('.card-kicker');
      if (kicker) kicker.textContent = `앞으로 ${actualHours}시간`;

      const bestTime = bestItem?.querySelector('.timeline-time')?.textContent?.trim();
      const bestScore = Number(bestItem?.querySelector('.timeline-score')?.textContent);
      if (bestWindowTitle && bestTime) bestWindowTitle.textContent = `${bestTime} 전후가 가장 안전해요`;
      if (bestWindowDescription && Number.isFinite(bestScore)) {
        bestWindowDescription.textContent = `예상 생존점수 ${bestScore}점입니다. 외출 시간을 조절할 수 있다면 이 시간대가 앞으로 ${actualHours}시간 중 가장 유리합니다.`;
      }
    }

    if (timeline && root.MutationObserver) {
      const observer = new root.MutationObserver(applyTimelineScope);
      observer.observe(timeline, { childList: true });
    }

    applyTimelineScope();
    return true;
  }

  return {
    STORAGE_KEY,
    ALLOWED_HOURS,
    normalizeOutingHours,
    scopeHours,
    findBestHour,
    rewriteAdviceHorizon,
    readStoredHours,
    writeStoredHours,
    install
  };
}));