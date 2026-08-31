# Prior Art / Research Notes

새 기능은 구현 전에 상용 앱, 오픈소스, 연구, 공식 API를 확인합니다.

## Hair weather / frizz 서비스

### Frizz Forecast: Hair Weather

- 이슬점을 중심으로 일일 frizz level을 보여줍니다.
- 시간대별 위험도, 가장 차분한 시간, 주간 wash day 추천을 제공합니다.
- hair type과 porosity에 따라 위험 구간을 조정하고 optional morning briefing을 제공합니다.
- 참고: https://play.google.com/store/apps/details?id=com.moon.frizzcast

### Frizzometer — Hair Forecast

- 습도, 이슬점, 온도, 풍속을 이용해 1–100 frizz score를 계산합니다.
- 장기 예보와 hair-care tip을 제공합니다.
- 참고: https://apps.apple.com/us/app/frizzometer-hair-forecast/id6761673373

### CurlCast - Hair Weather Guide

- porosity와 curl pattern을 hair profile로 받습니다.
- 지역 이슬점을 이용해 성분 및 styling guidance를 개인화합니다.
- wash-day log에 사용 제품, styling method, 결과를 남겨 이후 판단에 활용합니다.
- 참고: https://apps.apple.com/us/app/curlcast-hair-weather-guide/id6761350441

### 제품 차별화 가설

- 범용 frizz 앱을 다시 만들지 않습니다.
- 한국 사용자의 `앞머리` 유지 여부라는 좁은 의사결정에 집중합니다.
- 앞으로 12시간 중 유리한 시간을 보여줍니다.
- 현재 값만 보지 않고 이후 강수·습도·바람의 변화까지 행동 조언에 사용합니다.
- 실제 결과 피드백으로 사용자별 bias를 로컬에서 보정합니다.
- 향후 개인화 입력은 범용 curl type 전체보다 `앞머리 형태 / 세팅 방법 / 평소 유지 성향 / 야외 체류 시간`처럼 앞머리 결정에 직접 필요한 신호를 우선 검증합니다.

## 모발과 수분에 대한 연구 근거

현재 앱에서 습도와 이슬점을 주요 변수로 사용하는 방향은 모발의 수분 의존적 기계 특성에 관한 연구와 정합적입니다. 아래 연구가 현재 앱의 가중치나 점수 임계값을 직접 검증하는 것은 아닙니다.

### Zuidema et al., 2003 — The influence of humidity on the viscoelastic behaviour of human hair

- 서로 다른 습도 조건에서 bending relaxation과 curl recovery를 다룹니다.
- PubMed: https://pubmed.ncbi.nlm.nih.gov/12775909/

### Wortmann et al., 2006 — The effect of water on the glass transition of human hair

- 물 함량과 사람 모발의 glass transition 관계를 조사합니다.
- PubMed: https://pubmed.ncbi.nlm.nih.gov/16358248/

### Yu et al., 2017 — Structure and mechanical behavior of human hair

- 모발의 인장 특성이 상대습도와 온도에 유의하게 의존함을 보고합니다.
- PubMed: https://pubmed.ncbi.nlm.nih.gov/28183593/

### 현재 해석

- 습도/이슬점을 위험 변수로 사용하는 것은 선행 연구와 일치합니다.
- 비와 바람은 앞머리에 대한 직접적인 외부 교란으로 제품 휴리스틱에 포함합니다.
- `0–100 생존점수`, 변수별 가중치, 임계값, 조언 우선순위는 아직 deterministic product hypothesis입니다.
- 실제 사용자의 결과 피드백으로 calibration과 분류 성능을 검증해야 합니다.

## 행동 조언의 prior art와 구현 결정

상용 hair-weather 앱들은 보통 날씨 값을 hair-care tip으로 번역합니다. 이 프로젝트는 단순 문구 풀을 무작위로 돌리지 않고 다음 순서로 조언을 선택합니다.

1. 실제 현재 강수·습도/이슬점·풍속을 평가합니다.
2. 앞으로 12시간의 최대 강수확률, 최대 풍속, 습도 상승을 확인합니다.
3. 더 유리한 시간대가 현재보다 유의하게 좋은지 확인합니다.
4. 3일 이상 실제 결과가 있을 때만 개인 calibration 경향을 조언에 노출합니다.
5. 우선순위가 높은 최대 3개 조언만 보여줍니다.

이 로직은 LLM을 호출하지 않으며 동일한 입력에는 동일한 결과를 냅니다.

## 캐릭터 / SVG / 수집 요소 prior art

### DiceBear

- seed 기반 deterministic SVG avatar library이며 software는 MIT입니다. 각 style 라이선스는 별도입니다.
- Lorelei는 CC0 1.0이고 헤어스타일 표현이 풍부합니다.
- DiceBear는 단일 `gender` switch를 제공하지 않으며 원하는 인상을 만들려면 style별 머리, 수염, 액세서리 variant를 직접 제한해야 합니다.
- 참고: https://github.com/dicebear/dicebear
- https://www.dicebear.com/styles/lorelei/
- https://www.dicebear.com/customize/gender/
- https://www.dicebear.com/licenses/

**검증 결과:** 고정 seed만 둔 Lorelei는 남성적으로 보이는 짧은 머리 조합이 나올 수 있었습니다. 브랜드의 주 캐릭터는 `앞머리 상태`를 시각적으로 전달해야 하므로 무작위 avatar 조합과 목적이 맞지 않습니다. 메인 마스코트에서는 DiceBear를 사용하지 않습니다.

### React Kawaii

- `elizabetdev/react-kawaii`, MIT.
- 귀여운 SVG component library이며 Cat, Ghost, HumanCat, HumanDinosaur, Planet 등 여러 component와 mood 변형을 제공합니다.
- color / size / mood를 파라미터화하는 방식이 작은 수집 캐릭터 시스템과 잘 맞습니다.
- GitHub: https://github.com/elizabetdev/react-kawaii

**검증 결과:** 시각 언어는 좋은 prior art입니다. 그러나 현재 앱은 framework/bundler 없는 vanilla 정적 웹이고, React 전체를 도입하거나 큰 TSX path를 그대로 vendoring하는 것은 5종 날씨 요정에 비해 비용이 큽니다. 따라서 런타임 의존성은 추가하지 않고 `작은 SVG + 공통 얼굴 + 색/형태 파라미터`라는 구조만 제품 설계에 반영합니다. 품질이 부족하면 향후 MIT 원본 SVG를 attribution과 함께 vendoring하는 선택지가 있습니다.

### Microsoft Fluent Emoji

- Microsoft의 대규모 친근한 emoji asset collection이며 repository license는 MIT입니다.
- SVG/PNG/3D 등 자산 품질과 범위가 매우 큽니다.
- GitHub: https://github.com/microsoft/fluentui-emoji

**검증 결과:** 개별 아이콘 품질은 높지만 `앞머리 요정`이라는 하나의 종족/세계관보다 범용 emoji 집합에 가깝고 asset 규모가 과합니다. 일반 UI/상태 아이콘이 필요할 때 다시 검토합니다.

### Crittericons

- 고양이, 강아지, 거북이, 공룡 등 작은 동물 SVG icon set이며 MIT입니다.
- raw SVG와 React component를 함께 제공합니다.
- GitHub: https://github.com/teamleaderleo/crittericons

**검증 결과:** 매우 가볍지만 24×24 line icon 중심이고 종류가 적어 현재 카드의 큰 캐릭터/도감 용도에는 표현력이 부족합니다.

### OpenMoji

- 매우 큰 오픈소스 emoji collection이며 SVG를 제공합니다.
- graphics는 CC BY-SA 4.0이고 code는 LGPL-3.0입니다.
- GitHub: https://github.com/hfg-gmuend/openmoji

**검증 결과:** 종류는 충분하지만 share-alike 의무와 범용 emoji 성격 때문에 이번 작은 캐릭터 시스템의 우선 후보에서 제외합니다.

### 현재 Build 결정

- **메인 캐릭터:** 프로젝트 고정 여성 캐릭터를 로컬 inline SVG로 유지합니다. 큰 눈/볼/리본 같은 장식보다 더 중요한 요구사항은 동일 인물이 생존점수에 따라 `표정 + 앞머리 변형`을 일관되게 보여주는 것입니다.
- **일일 요정:** 비/바람/고습/좋은 날/애매한 날 5종을 `fairies.js`의 작은 deterministic SVG generator로 렌더링합니다.
- **도감:** localStorage의 이미 존재하는 일일 companion 기록에서 `key`만 읽어 종류별 발견 여부를 표시합니다. 서버 DB를 추가하지 않습니다.
- **네트워크:** 캐릭터 때문에 DiceBear/CDN 등 외부 이미지 요청을 만들지 않습니다.
- **확장:** 종류가 10~20종 이상으로 늘어나 직접 SVG 유지비가 커질 때 React Kawaii 또는 Fluent Emoji 같은 기존 MIT 자산을 다시 평가합니다.

## Kawaii 관련 연구와 해석

Nittono et al. (2012)은 귀여운 동물 이미지를 본 뒤 일부 정밀 작업과 시각 탐색 과제의 수행이 개선되고 attentional focus가 좁아지는 결과를 보고했습니다.

- PLOS ONE 7(9): e46362
- DOI: https://doi.org/10.1371/journal.pone.0046362

이 결과를 `귀여운 캐릭터가 앱 retention을 높인다`는 근거로 확대 해석하지 않습니다. 현재 제품에서는 캐릭터를 예보 결과를 부드럽게 전달하고 하루 한 번 짧은 긍정적 환기를 주는 보조 UI로만 사용합니다.

## 일일 보상 / gamification 연구와 제품 결정

### Krath et al., 2021 — systematic review

Gamification 연구의 이론적 기반을 종합한 systematic review는 goal visibility, guided path, immediate feedback, positive reinforcement, user choice 등이 동기와 행동을 설명하는 반복적인 원리라고 정리합니다.

- Computers in Human Behavior 125, 106963
- DOI: https://doi.org/10.1016/j.chb.2021.106963

### Li et al., 2024 — meta-analysis

35개 intervention, 2500명을 포함한 meta-analysis에서는 gamification이 intrinsic motivation에 유의하지만 작은 효과를 보였고 autonomy와 relatedness에는 긍정적 효과가 관찰됐습니다. `보상이 있으면 무조건 retention이 오른다`고 가정하지 않습니다.

- Educational Technology Research and Development 72, 765–796
- DOI: https://doi.org/10.1007/s11423-023-10337-7

### Build / Don't Build

**Build**

- 예보를 확인하면 하루 한 번 자동으로 만나는 `오늘의 앞머리 요정`
- 실제 날씨 유형으로 결정되는 5종
- 만난 종류를 보여주는 작은 도감
- 같은 날짜에는 같은 결과를 유지하고 localStorage에 최대 60일 보관
- 빠진 날에 패널티 없음

**Don't Build now**

- 재화, 유료 뽑기, 반복 reroll, 확률형 희귀도
- 접속하지 않으면 끊기는 punitive streak
- 날씨/앞머리 경험과 무관한 별도 미니게임

## 한국 정밀 예보

### 기상청 동네예보

기상청 단기예보 API는 전국을 약 5km × 5km 격자로 나누고 읍·면·동 중심의 예보를 제공합니다. 이 프로젝트에서는 WGS84 좌표를 KMA DFS `(nx, ny)`로 변환하고 `getVilageFcst`를 사용합니다.

회귀 검증 좌표:

- 서울시청 37.5665, 126.9780 → (60, 127)
- 부산시청 35.1796, 129.0756 → (98, 76)
- 제주시청 33.4996, 126.5312 → (53, 38)
- 강남역 37.4979, 127.0276 → (61, 125)

### Open-Meteo

초기 MVP는 Open-Meteo를 사용했습니다. 한국 정밀 예보의 장기 기준 공급원은 공식 KMA API를 우선하고 Open-Meteo 일반 forecast 경로는 KMA 설정 누락/일시 장애의 명시적인 fallback으로만 유지합니다.

## 위치 보정

### Kakao Maps Web API

공식 Kakao Maps Web API의 draggable marker, `dragend`, geocoder를 사용해 사용자가 직접 예보 기준 위치를 확인하고 수정합니다.

1. 브라우저 위치로 초기 좌표를 얻습니다.
2. Kakao Maps에서 draggable marker를 표시합니다.
3. 사용자가 마커를 옮기거나 지도를 누르면 좌표를 갱신합니다.
4. 좌표를 행정동으로 변환합니다.
5. 같은 좌표를 KMA grid로 변환하여 날씨를 다시 조회합니다.

## 인증정보 정책

- `KAKAO_JAVASCRIPT_KEY`: 브라우저 노출을 전제로 하는 Web SDK 키입니다. Kakao Developers에서 허용 도메인을 제한합니다.
- `KMA_API_KEY`: 서버 전용입니다. Vercel 환경변수에서만 읽고 클라이언트나 public repository에 노출하지 않습니다.
- Kakao REST/Admin 키를 Web JavaScript 키 대신 사용하지 않습니다.
