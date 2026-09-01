(function initBangsFairyDetails(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.BangsFairyDetails = api;
    const start = () => api.bind(root.document);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, (root) => {
  'use strict';

  const WEATHER_LABELS = Object.freeze({
    rain: '비 오는 날',
    wind: '바람 부는 날',
    humid: '습한 날',
    clear: '맑은 날',
    cloud: '구름 낀 날'
  });

  const DETAILS = Object.freeze({
    drop: {
      story: '빗소리를 작은 물방울 구슬에 모으는 요정이에요. 비가 시작되면 우산 끝에서 톡톡 뛰어다니며 앞머리가 너무 축 처지지 않게 응원해 줘요.',
      favorite: '투명 우산에 맺힌 빗방울'
    },
    breeze: {
      story: '바람 사이를 토끼처럼 폴짝폴짝 뛰어다니는 요정이에요. 바람이 세질수록 리본을 꼭 잡고, 앞머리도 같이 살짝 지켜준대요.',
      favorite: '살랑살랑 흔들리는 리본'
    },
    puff: {
      story: '몽글몽글한 솜구름을 모아 다니는 요정이에요. 습기가 많은 날에는 완벽하게 고정하기보다 보송한 느낌을 지키는 걸 더 좋아해요.',
      favorite: '폭신한 파우치와 보송한 수건'
    },
    sunny: {
      story: '햇빛을 리본 끝에 조금씩 담아 다니는 요정이에요. 날씨가 편안한 날에 자주 나타나서 “오늘은 가볍게 해도 돼!” 하고 웃어 줘요.',
      favorite: '햇볕을 살짝 받은 헤어롤'
    },
    cloudy: {
      story: '작은 구름 사이에 빗을 숨겨 두는 요정이에요. 애매한 날씨를 제일 잘 알아서, 필요할 때 꺼내 쓸 작은 빗 하나를 늘 챙겨 다녀요.',
      favorite: '주머니에 쏙 들어가는 작은 빗'
    },
    roller: {
      story: '핑크 헤어롤 안을 자기 집처럼 쓰는 요정이에요. 아침마다 둥글둥글 굴러 나오면서 오늘의 볼륨이 오래가길 응원해 줘요.',
      favorite: '말랑한 핑크 헤어롤'
    },
    dew: {
      story: '아주 이른 아침에만 반짝이는 이슬을 모으는 요정이에요. 머리카락이 수분에 예민한 날을 잘 알아채서, 너무 여러 번 손대지 말라고 살짝 알려줘요.',
      favorite: '새벽 공기와 반짝이는 이슬'
    },
    peach: {
      story: '복숭아빛 솜털처럼 부드러운 요정이에요. 머리를 자꾸 만지기보다 한 번 정돈하고 편하게 두는 걸 좋아해요.',
      favorite: '은은한 복숭아 향과 부드러운 빗질'
    },
    moon: {
      story: '작은 머리핀에 달빛을 담아 다니는 요정이에요. 오래 밖에 있는 날이면 조용히 나타나서 “필요할 때 이 핀을 써!” 하고 챙겨 줘요.',
      favorite: '조용한 밤과 반짝이는 작은 핀'
    },
    ribbon: {
      story: '바람을 타고 리본처럼 빙글빙글 도는 요정이에요. 세게 고정하는 것보다 이동할 때 잠깐 보호하는 방법을 더 좋아해요.',
      favorite: '바람에 살짝 흔들리는 리본'
    },
    rainbow: {
      story: '비가 그치고 햇빛이 비칠 때 가끔 나타나는 특별한 요정이에요. 작은 무지개를 헤어롤에 걸어 두고 기분 좋은 일이 하나 생기길 빌어 줘요.',
      favorite: '비 그친 뒤 처음 보이는 햇빛'
    },
    stardust: {
      story: '밤공기에서 아주 작은 별가루를 모으는 반짝 요정이에요. 날씨가 조금 까다로운 날에도 “완벽하지 않아도 괜찮아” 하고 옆에 있어 줘요.',
      favorite: '조용한 밤공기와 반짝이는 별빛'
    }
  });

  function detailFor(key) {
    return DETAILS[key] || DETAILS.cloudy;
  }

  function weatherText(affinities) {
    const list = Array.isArray(affinities) ? affinities : [];
    return list.map((key) => WEATHER_LABELS[key] || key).join(' · ');
  }

  function rarityText(gacha, rarity) {
    const meta = gacha?.RARITY_META?.[rarity];
    if (meta) return `${meta.stars} ${meta.label} · ${meta.hint}`;
    if (gacha?.RARITY_LABEL && gacha.RARITY_LABEL[rarity]) return gacha.RARITY_LABEL[rarity];
    return ({ common: '일반', rare: '희귀', special: '반짝' })[rarity] || '일반';
  }

  function keyFromName(gacha, name) {
    if (!gacha?.ORDER || !gacha?.DEFINITIONS) return null;
    return gacha.ORDER.find((key) => gacha.DEFINITIONS[key]?.name === name) || null;
  }

  function ensureDialog(document) {
    let dialog = document.querySelector('#fairyDetailDialog');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.id = 'fairyDetailDialog';
    dialog.className = 'fairy-detail-dialog';
    dialog.setAttribute('aria-labelledby', 'fairyDetailName');
    dialog.innerHTML = `
      <div class="fairy-detail-shell">
        <button class="fairy-detail-close" type="button" aria-label="요정 이야기 닫기">×</button>
        <div id="fairyDetailArt" class="fairy-detail-art" aria-hidden="true"></div>
        <span id="fairyDetailRarity" class="fairy-detail-rarity"></span>
        <h2 id="fairyDetailName"></h2>
        <p class="fairy-detail-subtitle">앞머리 요정 이야기</p>
        <p id="fairyDetailStory" class="fairy-detail-story"></p>
        <div class="fairy-detail-facts">
          <div class="fairy-detail-fact"><span>자주 만나는 날</span><strong id="fairyDetailWeather"></strong></div>
          <div class="fairy-detail-fact"><span>좋아하는 것</span><strong id="fairyDetailFavorite"></strong></div>
        </div>
        <p id="fairyDetailTip" class="fairy-detail-tip"></p>
      </div>`;
    document.body.appendChild(dialog);

    dialog.querySelector('.fairy-detail-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  function openFairy(document, key) {
    const gacha = root?.BangsFairyGacha;
    if (!gacha?.DEFINITIONS?.[key] || !gacha?.getFairySvg) return false;

    const definition = gacha.DEFINITIONS[key];
    const detail = detailFor(key);
    const dialog = ensureDialog(document);
    const art = dialog.querySelector('#fairyDetailArt');
    if (art) art.innerHTML = gacha.getFairySvg(key);
    dialog.querySelector('#fairyDetailRarity').textContent = rarityText(gacha, definition.rarity);
    dialog.querySelector('#fairyDetailName').textContent = definition.name;
    dialog.querySelector('#fairyDetailStory').textContent = detail.story;
    dialog.querySelector('#fairyDetailWeather').textContent = weatherText(definition.affinities) || '어느 날이든';
    dialog.querySelector('#fairyDetailFavorite').textContent = detail.favorite;
    dialog.querySelector('#fairyDetailTip').textContent = `오늘의 응원 · ${definition.message}`;

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    return true;
  }

  function decorate(document) {
    const gacha = root?.BangsFairyGacha;
    const card = document.querySelector('#companionCard');
    if (!card || !gacha?.ORDER || !gacha?.DEFINITIONS) return;

    const items = card.querySelectorAll('#fairyGachaCollection .fairy-book-item');
    items.forEach((item, index) => {
      const key = gacha.ORDER[index];
      if (!key) return;
      item.dataset.fairyKey = key;
      const definition = gacha.DEFINITIONS[key];
      if (item.classList.contains('is-unlocked')) {
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.setAttribute('aria-label', `${definition.name} 이야기 보기`);
      } else {
        item.removeAttribute('role');
        item.removeAttribute('tabindex');
        item.removeAttribute('aria-label');
      }
    });

    const host = card.querySelector('#companionIllustration');
    const name = card.querySelector('#companionName')?.textContent || '';
    const key = keyFromName(gacha, name);
    if (host && card.dataset.gachaState === 'revealed' && key) {
      host.dataset.fairyKey = key;
      host.setAttribute('aria-hidden', 'false');
      host.setAttribute('role', 'button');
      host.tabIndex = 0;
      host.setAttribute('aria-label', `${gacha.DEFINITIONS[key].name} 이야기 보기`);
      host.title = '눌러서 요정 이야기 보기';
    } else if (host) {
      delete host.dataset.fairyKey;
      host.setAttribute('aria-hidden', 'true');
      host.removeAttribute('role');
      host.removeAttribute('tabindex');
      host.removeAttribute('aria-label');
      host.removeAttribute('title');
    }
  }

  function bind(document) {
    const card = document.querySelector('#companionCard');
    if (!card || card.dataset.fairyDetailsBound === 'true') return;
    card.dataset.fairyDetailsBound = 'true';

    const activate = (target) => {
      const interactive = target?.closest?.('.fairy-book-item.is-unlocked, #companionIllustration[role="button"]');
      if (!interactive || !card.contains(interactive)) return false;
      const key = interactive.dataset.fairyKey;
      return key ? openFairy(document, key) : false;
    };

    card.addEventListener('click', (event) => activate(event.target));
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (activate(event.target)) event.preventDefault();
    });

    let queued = false;
    const queueDecorate = () => {
      if (queued) return;
      queued = true;
      setTimeout(() => {
        queued = false;
        decorate(document);
      }, 0);
    };
    const observer = new MutationObserver(queueDecorate);
    observer.observe(card, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-gacha-state', 'class'] });
    decorate(document);
  }

  return { DETAILS, WEATHER_LABELS, detailFor, weatherText, rarityText, keyFromName, bind, openFairy };
}));
