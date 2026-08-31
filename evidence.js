(function initBangsEvidence(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.BangsEvidence = api;
    const start = () => api.bind(root.document);
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const SOURCES = Object.freeze({
    humidity: { label: 'Yu et al., 2017 · Structure and mechanical behavior of human hair', url: 'https://pubmed.ncbi.nlm.nih.gov/28183593/' },
    humidityResistance: { label: 'Evaluation of hair humidity resistance/moisturization from hair elasticity', url: 'https://pubmed.ncbi.nlm.nih.gov/17728940/' },
    fixative: { label: 'Jachowicz & Yao, 2001 · Dynamic hairspray analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/11567208/' },
    fixativeComposite: { label: 'Rafferty et al., 2008 · Polymer composite principles applied to hair styling gels', url: 'https://pubmed.ncbi.nlm.nih.gov/19156332/' },
    thermal: { label: 'Zhou et al., 2011 · Thermal damage by hot flat ironing', url: 'https://pubmed.ncbi.nlm.nih.gov/21635854/' },
    wetHeat: { label: 'The effects of water on heat-styling damage', url: 'https://pubmed.ncbi.nlm.nih.gov/21443842/' },
    conditioner: { label: 'Hair Cosmetics: An Overview', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4387693/' },
    friction: { label: 'Understanding and controlling the friction of human hair, 2025', url: 'https://pubmed.ncbi.nlm.nih.gov/40782659/' }
  });

  function getEvidenceTips(metrics = {}) {
    const humidity = Number(metrics.humidity) || 0;
    const dewPoint = Number(metrics.dewPoint) || 0;
    const precipitation = Number(metrics.precipitation) || 0;
    const wind = Number(metrics.wind) || 0;
    const score = Number(metrics.score);
    const tips = [];

    if (humidity >= 78 || dewPoint >= 19) {
      tips.push({
        key: 'high-humidity-fixative',
        title: '고습도에는 “고정제 종류”도 중요해요',
        description: '모발은 습도가 높아질수록 수분 흡수와 기계적 거동이 달라지고, 고정제도 폴리머 조성에 따라 높은 습도에서 유지력이 크게 달라집니다. 오늘은 단순히 많이 뿌리기보다 anti-humidity·습도 저항 목적의 고정제를 얇게 쓰는 편이 더 합리적입니다.',
        sources: ['humidity', 'humidityResistance', 'fixative', 'fixativeComposite']
      });
    }

    if (precipitation >= 35 || humidity >= 82 || (Number.isFinite(score) && score < 55)) {
      tips.push({
        key: 'dry-before-heat',
        title: '고데기를 쓴다면 완전히 말린 뒤 최소 횟수로 해요',
        description: '열기구는 높은 온도와 반복 사용에서 모발 keratin과 cuticle 손상을 늘릴 수 있고, 물기가 남은 상태의 heat styling은 구조적 손상이 더 커질 수 있습니다. 습한 날이라고 여러 번 덧대기보다 완전히 말린 뒤 필요한 만큼만 세팅하세요.',
        sources: ['thermal', 'wetHeat']
      });
    }

    if (wind >= 18 || humidity >= 70) {
      tips.push({
        key: 'reduce-friction',
        title: '계속 만지고 빗는 것보다 재정돈 횟수를 줄여요',
        description: '모발 손상과 거칠어짐은 마찰·빗질과도 관련이 있습니다. 컨디셔너는 모발 사이 마찰과 빗질 힘을 줄이는 데 도움이 되지만, 앞머리 뿌리에 leave-on 제품을 과하게 바르면 직모에서는 무겁고 번들거릴 수 있어 길이 위주로 쓰는 편이 낫습니다.',
        sources: ['conditioner', 'friction']
      });
    }

    if (!tips.length) {
      tips.push({
        key: 'light-touch',
        title: '오늘은 과한 세팅보다 평소 루틴을 유지해도 돼요',
        description: '날씨가 비교적 무난할 때는 고정 제품과 열기구를 더 많이 쓰는 것 자체가 이득이라고 볼 근거는 없습니다. 평소 잘 맞는 루틴을 유지하고 불필요한 열·마찰을 늘리지 않는 편이 안전합니다.',
        sources: ['thermal', 'friction']
      });
    }

    return tips.slice(0, 2);
  }

  function readMetrics(document) {
    const metrics = { humidity: 0, dewPoint: 0, precipitation: 0, wind: 0, score: Number(document.querySelector('#scoreValue')?.textContent) };
    document.querySelectorAll('#reasonChips .reason-chip').forEach((chip) => {
      const text = chip.textContent || '';
      const number = Number(text.match(/-?\d+(?:\.\d+)?/)?.[0]);
      if (!Number.isFinite(number)) return;
      if (text.startsWith('습도')) metrics.humidity = number;
      else if (text.startsWith('이슬점')) metrics.dewPoint = number;
      else if (text.startsWith('비')) metrics.precipitation = number;
      else if (text.startsWith('바람')) metrics.wind = number;
    });
    return metrics;
  }

  function bind(document) {
    const adviceList = document.querySelector('#adviceList');
    const reasonChips = document.querySelector('#reasonChips');
    if (!adviceList || !reasonChips) return;
    let section = document.querySelector('#evidenceAdvice');
    if (!section) {
      section = document.createElement('section');
      section.id = 'evidenceAdvice';
      section.className = 'evidence-advice';
      adviceList.insertAdjacentElement('afterend', section);
    }

    const render = () => {
      const tips = getEvidenceTips(readMetrics(document));
      const usedSources = [...new Set(tips.flatMap((tip) => tip.sources))];
      section.innerHTML = `<div class="evidence-heading"><span>연구 기반 보조 팁</span><small>직접적인 ‘앞머리 임상시험’이 아니라 모발 섬유·화장품 제형 연구를 실제 행동으로 보수적으로 번역한 내용이에요.</small></div><div class="evidence-tip-list">${tips.map((tip) => `<article class="evidence-tip"><strong>${tip.title}</strong><p>${tip.description}</p></article>`).join('')}</div><details class="evidence-sources"><summary>근거 논문 보기</summary><ul>${usedSources.map((key) => `<li><a href="${SOURCES[key].url}" target="_blank" rel="noopener noreferrer">${SOURCES[key].label}</a></li>`).join('')}</ul></details>`;
    };

    const observer = new MutationObserver(render);
    observer.observe(reasonChips, { childList: true, subtree: true });
    const score = document.querySelector('#scoreValue');
    if (score) observer.observe(score, { childList: true, characterData: true, subtree: true });
    render();
  }

  return { SOURCES, getEvidenceTips, readMetrics, bind };
}));
