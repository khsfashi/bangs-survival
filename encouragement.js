(function initBangsEncouragement(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.BangsEncouragement = api;
    const start = () => api.bind(root.document, root.crypto);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const MESSAGE_GROUPS = Object.freeze({
    bright: Object.freeze([
      '오늘은 앞머리 걱정 잠깐 내려놔도 되겠어요 ✨',
      '날씨가 편안해요. 가볍게 준비하고 나가요 🎀',
      '오늘은 헤어롤도 기분 좋게 쉬어갈 수 있겠어요.',
      '세팅이 잘 됐다면 그 기분 그대로 출발해요 🌷',
      '오늘은 거울보다 바깥 풍경을 더 많이 봐도 좋겠어요.',
      '앞머리 컨디션이 좋아 보여요. 이제 즐길 차례예요.',
      '가볍게 정리하고 바로 나가도 괜찮은 날이에요.',
      '오늘은 작은 자신감 하나 챙겨서 나가요 ✨',
      '날씨가 도와주는 날이에요. 기분 좋게 다녀와요.',
      '오늘은 사진 한 장쯤 마음에 들게 나올 것 같아요 📷',
      '앞머리가 잘 버티면 괜히 한 번 더 웃어도 돼요.',
      '좋은 날씨에 좋은 약속까지 있으면 더 좋겠어요.',
      '오늘은 준비를 조금 덜 해도 마음이 놓이는 날이에요.',
      '앞머리도 기분도 산뜻하게 시작해봐요.',
      '오늘의 작은 행운도 같이 챙겨가요 ★',
      '세팅은 이 정도면 충분해요. 이제 출발!',
      '날씨가 얌전한 날엔 우리도 조금 여유롭게 가요.',
      '오늘은 “오, 괜찮은데?” 하고 나가도 되는 날이에요.'
    ]),
    rain: Object.freeze([
      '비 오는 날엔 우산이 제일 든든한 친구예요 ☔',
      '빗방울은 우산에게 맡기고 우리는 천천히 가요.',
      '오늘은 완벽한 고정보다 젖지 않게 지키는 게 먼저예요.',
      '비가 와도 약속의 즐거움까지 젖지는 않아요.',
      '우산 챙겼다면 준비의 절반은 이미 끝났어요.',
      '비 오는 날엔 편한 스타일도 충분히 좋은 선택이에요.',
      '앞머리가 조금 내려앉아도 오늘 분위기랑 잘 어울릴 수 있어요.',
      '빗소리 들으면서 너무 서두르지 말고 다녀와요 🌧️',
      '오늘은 작은 빗 하나도 같이 챙기면 든든해요.',
      '비 때문에 흐트러지면 살짝 정리하고 다시 가면 돼요.',
      '젖은 머리에 급하게 열을 여러 번 주지는 말아요.',
      '비 오는 날의 목표는 앞머리 사수보다 기분 사수예요.',
      '우산 아래에서는 앞머리도 잠깐 쉬어가도 돼요.',
      '비 올 확률이 높아도 좋은 일 확률은 그대로예요.',
      '오늘은 조금 덜 완벽하고 조금 더 편하게 가요.',
      '빗방울 몇 개쯤은 날씨 탓으로 웃고 넘겨요.',
      '비가 그치면 생각보다 금방 다시 정리할 수 있어요.',
      '오늘의 요정도 우산 안쪽에서 같이 갈 거예요 ☂️'
    ]),
    wind: Object.freeze([
      '바람 부는 날엔 이동할 때만 살짝 보호해줘요 🍃',
      '바람이 장난쳐도 하루까지 흔들리진 않아요.',
      '오늘은 작은 핀 하나가 꽤 든든할 수 있어요.',
      '바람 센 구간만 지나면 다시 가볍게 정리하면 돼요.',
      '세게 고정하기보다 이동할 때 지켜주는 쪽도 좋아요.',
      '바람이 불면 앞머리보다 고개를 먼저 편하게 들어요.',
      '조금 흐트러져도 자연스러운 느낌이라 괜찮아요.',
      '오늘은 손으로 자꾸 누르기보다 한 번 정리하고 가요.',
      '바람은 세도 좋은 기억은 날아가지 않아요.',
      '리본도 앞머리도 살짝 흔들리는 날이에요 🎀',
      '밖에 나가기 전 핀 하나만 챙겨두면 마음이 편해요.',
      '바람과 오래 씨름하지 말고 편한 방법을 골라요.',
      '앞머리 정리는 짧게, 좋은 하루는 길게 보내요.',
      '바람이 지나가면 거울 한 번 보고 다시 출발하면 돼요.',
      '오늘은 완벽한 모양보다 편하게 유지되는 쪽이 좋아요.',
      '바람 때문에 계획까지 바꿀 필요는 없어요.',
      '살랑바람이면 귀엽게, 센 바람이면 단단하게 준비해요.',
      '오늘도 내 방식대로 가볍게 대응하면 충분해요.'
    ]),
    humid: Object.freeze([
      '습한 날엔 조금 덜 만지는 게 오히려 편해요.',
      '오늘은 보송함을 오래 지키는 쪽으로 가봐요 ☁️',
      '습기가 많으면 쉬운 스타일도 좋은 선택이에요.',
      '앞머리가 말을 안 들으면 잠깐 쉬어도 돼요.',
      '오늘은 한 번 정돈하고 손을 조금 덜 대봐요.',
      '습도가 높아도 내 기분까지 눅눅할 필요는 없어요.',
      '조금 뜨거나 처져도 너무 오래 씨름하지 말아요.',
      '가볍게 준비하고 필요할 때만 다시 정리해요.',
      '오늘은 헤어롤보다 작은 빗이 더 든든할 수도 있어요.',
      '보송하게 시작했다면 그걸로 이미 잘 준비했어요.',
      '습한 날에는 완벽함보다 편안함이 오래가요.',
      '조금 덜 손대면 오히려 모양이 더 잘 남을 때도 있어요.',
      '오늘은 무거운 제품을 많이 겹치지 않아도 괜찮아요.',
      '앞머리가 조금 차분해져도 자연스러운 날이에요.',
      '날씨가 끈적해도 하루는 가볍게 보내요 🌷',
      '지금 이 정도면 충분해요. 이제 거울에서 눈을 떼요.',
      '습기와 싸우기보다 편한 방법 하나만 챙겨가요.',
      '보송솜 요정처럼 마음만은 폭신하게 가요 ☁️'
    ]),
    careful: Object.freeze([
      '오늘은 편한 스타일로 가도 충분히 귀여워요 🌷',
      '날씨가 조금 까다로워요. 너무 애쓰지는 말아요.',
      '오늘은 앞머리보다 내 기분을 먼저 챙겨요.',
      '무리해서 완벽하게 만들지 않아도 좋아요.',
      '쉽게 흐트러질 날엔 플랜 B가 오히려 마음 편해요.',
      '앞머리가 무너지면 오늘만큼은 날씨 탓으로 해요.',
      '지금 모습으로도 충분히 약속에 나갈 수 있어요.',
      '잘 버티는 것보다 잘 즐기는 날이어도 좋아요.',
      '오늘은 덜 피곤한 방법을 골라도 괜찮아요.',
      '조금 과감하게 넘겨도 의외로 잘 어울릴 수 있어요.',
      '앞머리는 하루의 일부일 뿐이에요.',
      '계속 신경 쓰지 않아도 되는 스타일이 제일 편해요.',
      '작은 문제는 작게 해결하고 바로 출발해요.',
      '오늘은 기준을 조금 느슨하게 잡아도 좋아요.',
      '한 번쯤 “이 정도면 됐어!” 하고 끝내도 돼요.',
      '앞머리가 흔들려도 좋은 약속은 그대로예요.',
      '오늘은 요정에게 앞머리 걱정을 조금 맡겨봐요 ✨',
      '내가 편하면 그 스타일이 오늘의 정답이에요.'
    ]),
    gentle: Object.freeze([
      '오늘도 잘 준비했어요. 이제 가볍게 나가요 🌷',
      '날씨를 확인했으니 걱정은 조금 덜어도 돼요.',
      '오늘도 예쁘게 하고 싶은 마음을 응원해요 🎀',
      '앞머리는 다시 정리할 수 있어요. 좋은 기분은 지금 챙겨요.',
      '오늘은 걱정보다 기대를 하나 더 챙겨가요.',
      '작은 준비 하나가 마음을 꽤 편하게 해줄 거예요.',
      '내가 편한 스타일이 오늘의 좋은 스타일이에요.',
      '앞머리를 내리든 넘기든 내 분위기는 그대로예요.',
      '오늘은 좋은 순간 하나를 꼭 챙겨가요.',
      '기분 좋은 음악 한 곡과 함께 나가요 🎵',
      '좋아하는 향 하나만 있어도 하루가 조금 달라져요.',
      '조금 귀여운 기분으로 하루를 시작해봐요 🐰',
      '오늘의 요정도 옆에서 응원하고 있어요.',
      '작은 행운 하나쯤 기대해도 좋아요 ✨',
      '나가기 전에 어깨 한 번 펴고 출발해요.',
      '사람들은 앞머리보다 표정을 더 오래 기억해요.',
      '오늘은 좋은 소식 하나쯤 찾아오길 바라요 💌',
      '준비는 충분해요. 이제 즐길 차례예요.'
    ])
  });

  const MESSAGES = Object.freeze(Object.values(MESSAGE_GROUPS).flat());
  const LABELS = Object.freeze({
    bright: '오늘은 반짝반짝',
    rain: '비 오는 날 한마디',
    wind: '바람 부는 날 한마디',
    humid: '습한 날 한마디',
    careful: '오늘은 살살 가요',
    gentle: '오늘의 한마디'
  });

  function clampRandom(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(0.999999999, Math.max(0, number));
  }

  function pickMessage(randomValue, pool = MESSAGES) {
    const source = Array.isArray(pool) && pool.length ? pool : MESSAGES;
    return source[Math.floor(clampRandom(randomValue) * source.length)];
  }

  function contextKey(score, weatherKind) {
    const numericScore = Number(score);
    if (Number.isFinite(numericScore) && numericScore <= 44) return 'careful';
    if (weatherKind === 'rain') return 'rain';
    if (weatherKind === 'wind') return 'wind';
    if (weatherKind === 'humid') return 'humid';
    if (Number.isFinite(numericScore) && numericScore >= 80) return 'bright';
    return 'gentle';
  }

  function messagesForContext(score, weatherKind) {
    return MESSAGE_GROUPS[contextKey(score, weatherKind)] || MESSAGE_GROUPS.gentle;
  }

  function secureRandom01(cryptoObject) {
    if (cryptoObject?.getRandomValues) {
      const values = new Uint32Array(1);
      cryptoObject.getRandomValues(values);
      return values[0] / 4294967296;
    }
    return Math.random();
  }

  function bind(document, cryptoObject) {
    const hero = document.querySelector('.hero-card');
    const score = document.querySelector('#scoreValue');
    const companion = document.querySelector('#companionCard');
    if (!hero || !score) return;

    let strip = document.querySelector('#encouragementStrip');
    if (!strip) {
      strip = document.createElement('aside');
      strip.id = 'encouragementStrip';
      strip.className = 'encouragement-strip';
      strip.innerHTML = '<span id="encouragementLabel">오늘의 한마디</span><strong id="encouragementText"></strong>';
      hero.appendChild(strip);
    }

    const label = strip.querySelector('#encouragementLabel');
    const text = strip.querySelector('#encouragementText');
    let lastSignature = '';

    const render = () => {
      const numeric = Number(score.textContent);
      if (!Number.isFinite(numeric)) return;
      const weatherKind = companion?.dataset?.kind || 'cloud';
      const key = contextKey(numeric, weatherKind);
      const signature = `${numeric}:${weatherKind}`;
      if (signature === lastSignature && text.textContent) return;
      lastSignature = signature;
      label.textContent = LABELS[key] || LABELS.gentle;
      text.textContent = pickMessage(secureRandom01(cryptoObject), MESSAGE_GROUPS[key]);
      strip.dataset.context = key;
    };

    const scoreObserver = new MutationObserver(render);
    scoreObserver.observe(score, { childList: true, characterData: true, subtree: true });
    if (companion) {
      const weatherObserver = new MutationObserver(render);
      weatherObserver.observe(companion, { attributes: true, attributeFilter: ['data-kind'] });
    }
    render();
  }

  return {
    MESSAGE_GROUPS,
    MESSAGES: MESSAGES.slice(),
    LABELS,
    pickMessage,
    contextKey,
    messagesForContext,
    bind
  };
}));
