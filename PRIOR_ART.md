# Prior Art / Research Notes

## 상용 앱

### Frizz Forecast: Hair Weather
- 이슬점 기반 frizz score
- 시간대별 위험도와 hair-care 조언 제공

### Frizzometer — Hair Forecast
- 습도, 이슬점, 온도, 풍속을 이용한 frizz score
- 장기 예보와 hair care tip 제공

### CurlCast
- 이슬점과 모발 타입에 맞춘 제품/성분 가이드 제공

## 우리가 그대로 만들지 않는 것

- 범용 frizz score 앱
- curly/wavy hair 제품 추천 앱
- 단순 습도 알림 앱

## 제품 차별화 가설

1. `앞머리`라는 좁은 사용 시나리오에 집중합니다.
2. "frizz가 얼마나 생기나" 대신 "지금 앞머리를 할 가치가 있나"를 직접 답합니다.
3. 앞으로 12시간 중 가장 생존 가능성이 높은 시간을 제안합니다.
4. 실제 결과 피드백으로 개인별 bias를 로컬에서 보정합니다.
5. 모델 가중치를 숨기지 않고 deterministic heuristic으로 시작합니다.

## 연구 근거

모발의 상대습도 변화에 따른 수분 흡수와 탄성 변화에 관한 연구는 `습도`를 예측 변수로 포함할 근거를 제공합니다. 다만 현재 가중치 자체는 제품 가설이며 실제 사용자 데이터로 재평가해야 합니다.

## 데이터 공급원

현재 MVP는 Open-Meteo를 사용합니다. 한국 지역 정밀도와 장기 운영 정책은 별도로 검토해야 합니다.
