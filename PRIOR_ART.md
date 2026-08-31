# Prior Art / Research Notes

새 기능은 구현 전에 상용 앱, 오픈소스, 연구, 공식 API를 확인합니다.

## Hair weather / frizz 서비스

### Frizz Forecast: Hair Weather
- 이슬점 기반 frizz score
- 시간대별 위험도와 hair-care 조언 제공

### Frizzometer — Hair Forecast
- 습도, 이슬점, 온도, 풍속을 이용한 frizz score
- 장기 예보와 hair care tip 제공

### CurlCast
- 이슬점과 모발 타입에 맞춘 제품/성분 가이드 제공

### 제품 차별화 가설

- 범용 frizz 앱을 다시 만들지 않습니다.
- 한국 사용자의 `앞머리` 유지 여부라는 좁은 의사결정에 집중합니다.
- 앞으로 12시간 중 유리한 시간을 보여줍니다.
- 점수뿐 아니라 날씨 원인에 따른 구체적인 행동 조언을 제공합니다.
- 실제 결과 피드백으로 사용자별 bias를 로컬에서 보정합니다.

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

## 연구 근거와 한계

상대습도 증가에 따라 모발의 수분 흡수와 탄성 특성이 변한다는 연구는 습도/이슬점을 위험 변수로 포함할 근거를 제공합니다. 하지만 현재의 변수 가중치와 생존점수 임계값을 직접 검증하는 것은 아닙니다.

따라서 현재 점수와 행동 조언은 deterministic product hypothesis이며, 실제 사용자 관측 데이터로 calibration과 분류 성능을 검증해야 합니다.
