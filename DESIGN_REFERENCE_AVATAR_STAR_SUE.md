# Avatar Star Sue-era design reference

이 문서는 `앞머리 생존예보`의 2026-09 UI 개선에서 참고한 2000년대 한국 플래시게임 시각 언어를 기록합니다.

중요: `아바타 스타 슈`의 캐릭터, 로고, 원본 UI 이미지, SWF 그래픽을 프로젝트 자산으로 복제하거나 포함하지 않습니다. 아래 자료는 **구성·색감·상호작용 문법을 관찰하기 위한 시각적 prior art**입니다. 실제 앱에서는 기존 자체 캐릭터와 새 로컬 SVG/CSS만 사용합니다.

## Reference set

### 슈의 뷰티메이커

- Waflash archive: https://vidkidz.tistory.com/304
- Alternate gameplay screenshots: https://inter87.tistory.com/108
- 관찰:
  - 핫핑크 중심의 높은 채도와 연한 하늘색/연분홍 배경
  - 캐릭터를 화면 한쪽의 큰 진행자로 두고 도구/의상을 주변에 배치
  - 별, 하트, 리본, 둥근 보석형 컨트롤이 장식과 입력 장치를 동시에 담당
  - 굵은 외곽선과 안쪽 하이라이트가 버튼을 장난감처럼 보이게 함
  - 결과/선택 영역을 단순 사각형이 아니라 팔각형·캡슐·원형 패널로 표현

### 슈의 의상실

- Gameplay screenshots: https://inter87.tistory.com/148
- Game description/screenshots: https://inter87.tistory.com/376
- 관찰:
  - 스프링 노트/앨범 자체를 선택 UI로 사용
  - 하트 프레임, 레이스, 탭, 스티커형 아이콘이 정보 구조를 설명
  - 화면 전체가 하나의 작은 방/놀이 공간처럼 보이며 기능 카드가 독립적인 SaaS 패널처럼 느껴지지 않음

### 슈의 화장하기

- Gameplay screenshots: https://inter87.tistory.com/152
- Archive notes: https://flashgamemall.tistory.com/243
- 관찰:
  - 화장대와 캐릭터가 UI의 배경이 아니라 실제 기능 구조
  - 큰 캐릭터 얼굴, 작은 도구, 별 모양 버튼으로 명확한 시선 순서를 만듦
  - 안내 문구는 게임 세계 안의 말풍선/요청처럼 전달

### 슈의 미용실 2

- Web-Back-Then archive post: https://web-back-then.tumblr.com/post/721648815614115840/ive-added-some-avata-star-sue-games-on
- 관찰:
  - 연보라/핑크 바탕에 반복 별 패턴
  - 제목 로고가 크고, 캐릭터와 미용 도구 카트가 첫 화면의 대부분을 차지
  - 기능보다 캐릭터/놀이의 감정적 진입점이 먼저 보임

### Avatar Star Sue / franchise context

- StarSue game page: https://www.starsue.net/game/Avatar_Star_Sue.html
- Waflash/archival context and series information: https://www.namu.moe/w/%EC%95%84%EB%B0%94%ED%83%80%20%EC%8A%A4%ED%83%80%20%EC%8A%88
- Y8 preserved game listing: https://www.y8.com/games/avata_star_sue

## Extracted visual language

이번 앱에서 차용하는 것은 특정 화면의 복제가 아니라 아래의 반복적인 디자인 원칙입니다.

1. **Character-led entry**
   - 위치 권한 설명보다 자체 캐릭터가 먼저 사용자를 맞이합니다.
   - 캐릭터는 장식이 아니라 “오늘 결과를 알려주는 진행자” 역할을 합니다.

2. **Candy controls**
   - 주요 CTA에 흰 안쪽 테두리, 진한 핑크 외곽, 눌린 듯한 아래 그림자를 사용합니다.
   - 작은 라벨은 캡슐/스티커 형태로 보입니다.

3. **Sticker grammar**
   - 별, 하트, 리본은 장식으로만 흩뿌리지 않고 섹션 라벨과 강조점에 제한적으로 사용합니다.
   - 모바일 정보 밀도를 해치지 않도록 CSS pseudo-element 중심으로 구현합니다.

4. **Pastel room instead of white SaaS cards**
   - 모든 카드를 동일한 흰 패널로 두지 않습니다.
   - 결과는 핑크, 행동 조언은 하늘색, 추천 시간은 레몬, 요정은 핑크, 주간은 라일락처럼 기능별 작은 ‘놀이 패널’로 구분합니다.

5. **Verdict before score**
   - 원작 게임의 결과/평가 화면처럼 사용자가 먼저 읽어야 할 것은 숫자가 아니라 판정입니다.
   - 생존점수 원형은 보조 배지로 축소하고 판정 문장을 더 크게 둡니다.

6. **Short speech-like copy**
   - 한줄 문장은 현재 날씨 맥락에 맞는 그룹에서 랜덤 선택합니다.
   - `비 / 바람 / 습함 / 좋은 날 / 낮은 점수 / 일반`로 분류하되 LLM 호출 없이 결정론적으로 그룹을 선택합니다.

## Product-specific adaptation

### Build

- 첫 화면에 자체 리본 캐릭터 추가
- 결과 카드에 스티커/게임 결과판 시각 언어 적용
- 위치 카드를 한 줄에 가까운 compact utility strip으로 축소
- 판정 문장을 점수보다 강하게 표현
- 날씨·점수 맥락별 응원 문구 선택
- 기능별 파스텔 panel identity
- 모바일 340–560px 대응 유지

### Don't copy

- Avatar Star Sue 캐릭터 얼굴/헤어스타일/의상
- 원본 게임 로고 및 타이포 그래픽
- SWF에서 추출한 버튼, 배경, 아이콘, 패턴
- 원본 화면의 픽셀 단위 레이아웃

## Implementation files

- `sue-era.css`: reference-inspired presentation layer
- `intro-mascot.svg`: 기존 앱 캐릭터와 같은 계열의 신규 자체 SVG
- `encouragement.js`: weather/score-context message groups
- `tests/sue-era.test.cjs`: remote/source artwork 비포함 및 boot asset 회귀 검사
