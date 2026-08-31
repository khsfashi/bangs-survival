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
- 향후 개인화 입력을 늘린다면 범용 curl type 전체를 복제하기보다 `앞머리 형태 / 세팅 방법 / 평소 유지 성향 / 야외 체류 시간`처럼 앞머리 결정에 직접 필요한 신호를 우선 검증합니다.

## 모발과 수분에 대한 연구 근거

현재 앱에서 습도와 이슬점을 주요 변수로 사용하는 방향은 모발의 수분 의존적 기계 특성에 관한 연구와 정합적입니다. 다만 아래 연구가 현재 앱의 가중치나 점수 임계값을 직접 검증하는 것은 아닙니다.

### Zuidema et al., 2003 — The influence of humidity on the viscoelastic behaviour of human hair

- 모발의 기계적 특성이 시간, 온도, 습도에 의존한다는 전제에서 서로 다른 습도 조건의 bending relaxation을 측정했습니다.
- 습도에 따른 초기 탄성계수 변화와 curl recovery를 모델링했습니다.
- PubMed: https://pubmed.ncbi.nlm.nih.gov/12775909/

### Wortmann et al., 2006 — The effect of water on the glass transition of human hair

- 물 함량과 사람 모발의 glass transition 관계를 조사했습니다.
- 물이 alpha-keratin 내부에 분포하며 재료 거동을 바꾼다는 근거를 제공합니다.
- PubMed: https://pubmed.ncbi.nlm.nih.gov/16358248/

### Yu et al., 2017 — Structure and mechanical behavior of human hair

- 모발의 인장 특성이 상대습도와 온도에 유의하게 의존함을 보고합니다.
- PubMed: https://pubmed.ncbi.nlm.nih.gov/28183593/

### 현재 해석

- 습도/이슬점을 위험 변수로 사용하는 것은 선행 연구와 일치합니다.
- 비와 바람은 앞머리에 대한 직접적인 외부 교란으로 제품 휴리스틱에 포함합니다.
- `0–100 생존점수`, 변수별 가중치, 임계값, 조언 우선순위는 아직 deterministic product hypothesis입니다.
- 실제 사용자의 결과 피드백으로 calibration과 분류 성능을 계속 검증해야 합니다.

## 행동 조언의 prior art와 구현 결정

상용 hair-weather 앱들은 보통 날씨 값을 hair-care tip으로 번역합니다. 이 프로젝트는 단순한 문구 풀을 무작위로 돌리지 않고 다음 순서로 조언을 선택합니다.

1. 실제 현재 강수·습도/이슬점·풍속을 평가합니다.
2. 앞으로 12시간의 최대 강수확률, 최대 풍속, 습도 상승을 확인합니다.
3. 더 유리한 시간대가 현재보다 유의하게 좋은지 확인합니다.
4. 3일 이상 실제 결과가 있을 때만 개인 calibration 경향을 조언에 노출합니다.
5. 우선순위가 높은 최대 3개 조언만 보여줍니다.

이 로직은 LLM을 호출하지 않으며 동일한 입력에는 동일한 결과를 냅니다.

## 캐릭터 / 일일 수집 요소

### DiceBear

- 오픈소스 avatar library이며 동일 seed에 대해 결정론적으로 같은 SVG를 생성합니다.
- 소프트웨어는 MIT입니다. 단, 각 style의 라이선스는 별도로 확인해야 합니다.
- GitHub: https://github.com/dicebear/dicebear
- License overview: https://www.dicebear.com/licenses/

### Lorelei

- 손그림 계열의 인물 avatar style이며 헤어스타일과 표정 표현이 포함됩니다.
- 현재 DiceBear 문서 기준 CC0 1.0입니다.
- 기존 직접 제작한 mascot SVG를 계속 확장하지 않고 메인 안내 캐릭터에 사용합니다.
- https://www.dicebear.com/styles/lorelei/

### Critters

- 둥근 몸, 큰 눈, 귀/뿔/더듬이 등을 조합한 작은 creature avatar style입니다.
- 현재 DiceBear 문서 기준 CC0 1.0입니다.
- 하루 한 번 만나는 `앞머리 요정`의 시각 자산에 사용합니다.
- https://www.dicebear.com/styles/critters/

### HTTP API 사용 결정과 한계

현재 앱은 번들러 의존성이 없는 정적 웹 구조이므로 v1에서는 DiceBear 10.x HTTP API를 `<img>` source로 사용합니다.

- 장점: 별도 캐릭터 SVG 제작과 유지보수를 하지 않아도 되고 seed만 저장하면 됩니다.
- seed에는 위치, 이름, 사용자 식별정보를 넣지 않습니다. 메인 캐릭터는 고정 app seed를, 일일 요정은 날짜와 날씨 유형만 사용합니다.
- 이미지 로드 실패 시 로컬 fallback emoji를 표시합니다.
- 외부 이미지 요청 자체는 DiceBear/CDN으로 네트워크 요청이 나간다는 뜻입니다. 완전한 local-first가 필요해지면 DiceBear API를 self-host하거나 build-time SVG 생성으로 옮기는 것을 후속 과제로 둡니다.

## 일일 보상 / gamification 연구와 제품 결정

### Krath et al., 2021 — systematic review

Gamification 연구의 이론적 기반을 종합한 systematic review는 goal visibility, guided path, immediate feedback, positive reinforcement, user choice 등이 동기와 행동을 설명하는 반복적인 원리라고 정리합니다.

- Computers in Human Behavior 125, 106963
- DOI: https://doi.org/10.1016/j.chb.2021.106963

### Li et al., 2024 — meta-analysis

35개 intervention, 2500명을 포함한 meta-analysis에서는 gamification이 intrinsic motivation에 유의하지만 작은 효과를 보였고, autonomy와 relatedness에는 긍정적인 효과가 관찰됐습니다. 따라서 `보상이 있으면 무조건 retention이 오른다`고 가정하지 않습니다.

- Educational Technology Research and Development 72, 765–796
- DOI: https://doi.org/10.1007/s11423-023-10337-7

### Build / Don't Build

**Build**

- 예보를 확인하면 하루에 한 번 자동으로 만나는 `오늘의 앞머리 요정`
- 날짜와 실제 날씨 유형으로 결정되는 캐릭터
- 같은 날짜에는 같은 결과를 유지하고 localStorage에 최대 60일 보관
- 수집 개수만 가볍게 보여주며 놓친 날에 패널티가 없습니다.

**Don't Build now**

- 재화, 유료 뽑기, 반복 reroll, 확률형 희귀도
- 접속하지 않으면 끊기는 punitive streak
- 날씨/앞머리 경험과 무관한 별도 미니게임

제품의 핵심 행동은 `오늘 앞머리를 어떻게 할지 판단한다`는 것이므로 수집 요소는 짧은 긍정적 환기 역할만 맡습니다.

## 한국 정밀 예보

### 기상청 동네예보

기상청 단기예보 API는 전국을 약 5km × 5km 격자로 나누고 읍·면·동 중심의 예보를 제공합니다. 이 프로젝트에서는 WGS84 좌표를 KMA DFS `(nx, ny)`로 변환하고 `getVilageFcst`를 사용합니다.

격자 변환은 공개된 KMA 변환식과 알려진 검증 좌표로 회귀 테스트합니다.

- 서울시청 37.5665, 126.9780 → (60, 127)
- 부산시청 35.1796, 129.0756 → (98, 76)
- 제주시청 33.4996, 126.5312 → (53, 38)
- 강남역 37.4979, 127.0276 → (61, 125)

### Open-Meteo

초기 MVP는 Open-Meteo를 사용했습니다. 다만 Open-Meteo의 KMA 모델 페이지는 2026년 3월 기상청의 KIM 전환 이후 해당 KMA 데이터 업데이트가 중단된 상태라고 안내하고 있습니다. 따라서 한국 정밀 예보의 장기 기준 공급원으로 Open-Meteo KMA feed에 의존하지 않고, 공식 KMA API를 우선 사용합니다.

현재 Open-Meteo 일반 forecast 경로는 KMA 설정 누락/일시 장애의 명시적인 fallback으로만 유지합니다.

## 위치 보정

### Kakao Maps Web API

공식 Kakao Maps Web API는 draggable marker와 `dragend` 이벤트를 지원합니다. `services` 라이브러리의 geocoder를 사용하면 좌표를 행정동으로 역지오코딩할 수 있습니다.

이 프로젝트에서는:

1. 브라우저 GPS로 초기 좌표를 얻습니다.
2. Kakao Maps에서 draggable marker를 표시합니다.
3. 사용자가 마커를 옮기거나 지도를 누르면 좌표를 갱신합니다.
4. 좌표를 행정동으로 변환합니다.
5. 같은 좌표를 KMA grid로 변환하여 날씨를 다시 조회합니다.

## 인증정보 정책

- `KAKAO_JAVASCRIPT_KEY`: 브라우저 노출을 전제로 하는 Web SDK 키입니다. Kakao Developers에서 허용 도메인을 제한합니다.
- `KMA_API_KEY`: 서버 전용입니다. Vercel 환경변수에서만 읽고 클라이언트나 public repository에 노출하지 않습니다.
- Kakao REST/Admin 키를 Web JavaScript 키 대신 사용하지 않습니다.
