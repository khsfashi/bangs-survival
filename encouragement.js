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

  const MESSAGES = Object.freeze([
    "오늘도 잘 준비했어요. 이제 가볍게 나가요 🌷",
    "앞머리가 조금 흔들려도 하루까지 흔들리진 않아요.",
    "오늘은 완벽함보다 편안함을 챙겨도 좋아요.",
    "날씨를 확인했으니 걱정은 조금 덜어도 돼요.",
    "작은 우산 하나가 마음까지 든든하게 해줄 거예요 ☂️",
    "세팅이 잘 됐다면 그 기분을 오래 즐겨요.",
    "조금 흐트러져도 자연스러운 모습이라 괜찮아요.",
    "오늘은 거울보다 바깥 풍경을 한 번 더 봐요.",
    "앞머리는 다시 정리할 수 있어요. 좋은 기분은 지금 챙겨요.",
    "준비는 충분해요. 이제 즐거운 일만 만나면 돼요.",
    "오늘도 예쁘게 하고 싶은 마음을 응원해요 🎀",
    "바람이 불면 잠깐 정리하고 다시 가면 돼요.",
    "비가 와도 약속의 즐거움까지 젖지는 않아요.",
    "습한 날에는 조금 편한 스타일도 좋은 선택이에요.",
    "오늘은 앞머리보다 내 기분을 먼저 챙겨요.",
    "잘 안 풀리는 아침도 금방 지나가요.",
    "조금 덜 손대면 오히려 더 편할 때도 있어요.",
    "오늘은 작은 행운 하나쯤 기대해도 좋아요 ✨",
    "앞머리가 잘 버티면 기분 좋게 웃어줘요.",
    "앞머리가 무너지면 날씨 탓으로 넘겨도 괜찮아요.",
    "오늘 하루는 머리 모양보다 훨씬 많은 일로 채워질 거예요.",
    "급하게 고데기를 여러 번 하지 않아도 괜찮아요.",
    "내가 편한 스타일이 오늘의 좋은 스타일이에요.",
    "지금 모습 그대로도 충분히 외출 준비가 됐어요.",
    "오늘은 스스로에게 조금 부드럽게 대해줘요.",
    "앞머리를 내리든 넘기든 내 분위기는 그대로예요.",
    "조금 흐트러져도 웃는 얼굴은 그대로 예뻐요.",
    "오늘의 목표는 앞머리 사수보다 기분 사수예요.",
    "외출 준비가 끝났다면 이제 출발해요 🚶",
    "오늘은 걱정보다 기대를 하나 더 챙겨가요.",
    "좋은 날씨라면 가볍게 준비하고 즐겨요.",
    "날씨가 까다롭다면 편한 방법을 골라도 돼요.",
    "작은 빗 하나만 있어도 꽤 든든해요.",
    "오늘은 머리보다 일정이 더 잘 풀리길 바라요.",
    "조금 망가져도 다시 정리하면 그만이에요.",
    "바쁜 아침에는 쉬운 선택이 좋은 선택일 수 있어요.",
    "예보를 봤으니 오늘은 이미 한발 먼저 준비했어요.",
    "너무 오래 거울 앞에 서 있지 않아도 돼요.",
    "오늘은 좋은 대화 하나가 오래 기억에 남길 바라요.",
    "앞머리가 마음에 들면 자신 있게 나가요.",
    "마음에 안 들면 빠르게 다른 스타일로 바꿔도 괜찮아요.",
    "작은 준비 하나가 큰 스트레스를 줄여줄 수 있어요.",
    "비 오는 날에는 우산이 제일 든든한 친구예요 ☔",
    "바람 부는 날에는 이동할 때만 살짝 보호해줘요.",
    "습기가 높으면 손으로 자꾸 만지지 않는 게 더 편해요.",
    "날씨가 좋아도 과하게 손대지 않아도 괜찮아요.",
    "오늘도 내 방식대로 준비하면 돼요.",
    "앞머리는 하루의 일부일 뿐이에요.",
    "오늘의 좋은 순간 하나를 꼭 챙겨가요.",
    "작은 실수는 작게 넘겨도 돼요.",
    "오늘은 사진 한 장쯤 마음에 들게 나오길 바라요 📷",
    "기분 좋은 음악 한 곡과 함께 나가요.",
    "좋아하는 향 하나만 있어도 하루가 조금 달라져요.",
    "따뜻한 음료 한 잔처럼 편안한 하루가 되길 바라요.",
    "오늘은 서두르지 말고 천천히 준비해요.",
    "앞머리가 말을 안 들어도 너무 오래 씨름하지 말아요.",
    "지금 이 정도면 충분히 괜찮아요.",
    "나가기 전에 어깨 한 번 펴고 출발해요.",
    "좋은 일은 날씨와 상관없이 생길 수 있어요.",
    "조금 귀여운 기분으로 하루를 시작해봐요 🐰",
    "오늘의 요정도 옆에서 응원하고 있어요.",
    "헤어롤을 굴렸다면 걱정도 같이 굴려 보내요.",
    "조금 덜 완벽해도 충분히 사랑스러워요.",
    "편한 표정이 오래 남는 날도 많아요.",
    "오늘은 나를 너무 세게 평가하지 말아요.",
    "날씨가 변해도 내 계획은 천천히 조절하면 돼요.",
    "앞머리가 잘 됐다면 괜히 한 번 더 기분 좋아해도 돼요.",
    "작은 자신감 하나 챙겨서 나가요.",
    "오늘도 충분히 단정하고 괜찮아요.",
    "준비할 수 있는 건 준비했어요. 나머지는 날씨에 맡겨요.",
    "비가 와도 재미있는 일은 생길 수 있어요.",
    "바람이 세도 좋은 기억은 날아가지 않아요.",
    "오늘은 어제보다 조금 덜 걱정해봐요.",
    "앞머리보다 편안한 하루가 더 중요할 때도 있어요.",
    "내가 편하면 그걸로 충분해요.",
    "지금 필요한 건 한 번의 정리일 수도, 그냥 출발하는 것일 수도 있어요.",
    "오늘은 작은 선택 하나만 잘해도 충분해요.",
    "잘 버티는 것보다 잘 즐기는 날이어도 좋아요.",
    "작은 요정을 만났으니 작은 행운도 기대해봐요.",
    "오늘의 귀여움은 머리카락 몇 가닥으로 정해지지 않아요.",
    "아침부터 너무 애쓰지 않아도 괜찮아요.",
    "조금 여유롭게 출발하면 하루가 더 편할 수 있어요.",
    "피곤한 날에는 쉬운 스타일로 보내줘도 돼요.",
    "예쁘게 하고 싶은 마음도, 편하게 있고 싶은 마음도 둘 다 괜찮아요.",
    "오늘은 기준을 조금 느슨하게 잡아도 좋아요.",
    "앞머리가 살아남으면 축하하고, 아니면 내일 다시 해요.",
    "한 번쯤 '오늘 나 괜찮은데?' 하고 생각해봐요.",
    "사람들은 앞머리보다 표정을 더 오래 기억해요.",
    "조금 흐트러진 순간도 충분히 자연스러워요.",
    "날씨가 말썽이어도 좋은 대화는 계속돼요.",
    "준비를 끝냈다면 이제 거울에서 눈을 떼도 돼요.",
    "다시 손대고 싶어도 한 번만 더 생각해봐요.",
    "오늘은 좋은 소식 하나쯤 찾아오길 바라요 💌",
    "작은 즐거움 하나를 챙겨서 나가요.",
    "좋은 향, 좋은 음악, 좋은 표정 중 하나면 충분해요.",
    "요정이 사소한 행운 하나를 데려오면 좋겠어요 ✨",
    "앞머리가 마음에 들면 그 기분을 다른 일에도 써봐요.",
    "조금 과감하게 넘겨도 의외로 잘 어울릴 수 있어요.",
    "계획을 바꿨다면 그건 더 편한 방법을 찾은 거예요.",
    "오늘도 준비는 끝났어요. 이제 즐길 차례예요.",
    "습도가 높아도 내 기분까지 눅눅해질 필요는 없어요.",
    "바람이 세도 마음은 천천히 가도 돼요.",
    "비 올 확률이 높아도 좋은 일 확률은 그대로예요.",
    "오늘은 좋은 순간을 하나 모아봐요.",
    "헤어롤에서 요정도 나오는데 좋은 일 하나쯤 생길 수 있죠.",
    "예상보다 잘 풀리는 일이 하나쯤 생길 거예요.",
    "오늘은 덜 피곤한 방법을 골라도 좋아요.",
    "나에게 편한 선택이 가장 좋은 선택일 수 있어요.",
    "머리카락이 말을 안 들으면 잠깐 쉬어도 돼요.",
    "앞머리 정리는 짧게, 좋은 하루는 길게 보내요.",
    "이 정도면 충분해요. 이제 출발해요.",
    "거울 앞에서 한 번 더 손대기보다 한 걸음 먼저 나가봐요.",
    "오늘은 계획대로 안 돼도 괜찮은 여유를 조금 남겨둬요.",
    "지금 모습으로도 충분히 약속에 나갈 수 있어요.",
    "앞머리 상태와 상관없이 오늘의 주인공은 나예요.",
    "기분이 처지면 어깨부터 한 번 펴봐요.",
    "부드럽게 시작한 하루도 충분히 좋은 하루가 될 수 있어요.",
    "작은 행운을 기대하는 마음은 마음껏 가져도 돼요.",
    "무리해서 완벽하게 만들지 않아도 좋아요.",
    "계속 신경 쓰지 않아도 되는 스타일이 제일 편한 스타일이에요.",
    "밖에 나가면 생각보다 앞머리는 금방 잊게 돼요.",
    "오늘은 나를 즐겁게 하는 일을 더 많이 봐요.",
    "헤어롤은 굴리고, 걱정은 조금 내려놓고 나가요 🎀"
  ]);

  function clampRandom(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(0.999999999, Math.max(0, number));
  }

  function pickMessage(randomValue) {
    return MESSAGES[Math.floor(clampRandom(randomValue) * MESSAGES.length)];
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
    if (!hero || !score) return;
    let strip = document.querySelector('#encouragementStrip');
    if (!strip) {
      strip = document.createElement('aside');
      strip.id = 'encouragementStrip';
      strip.className = 'encouragement-strip';
      strip.innerHTML = '<span>오늘의 작은 응원</span><strong id="encouragementText"></strong>';
      hero.appendChild(strip);
    }
    const text = strip.querySelector('#encouragementText');
    let lastScore = null;
    const render = () => {
      const numeric = Number(score.textContent);
      if (!Number.isFinite(numeric)) return;
      if (lastScore === numeric && text.textContent) return;
      lastScore = numeric;
      text.textContent = pickMessage(secureRandom01(cryptoObject));
    };
    const observer = new MutationObserver(render);
    observer.observe(score, { childList: true, characterData: true, subtree: true });
    render();
  }

  return { MESSAGES: MESSAGES.slice(), pickMessage, bind };
}));