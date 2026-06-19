# TDS 기반 디자인 시스템 리디자인 — 설계 문서

- 작성일: 2026-06-19
- 범위: **디자인 토큰 + `components/ui/` 8개 프리미티브**
- 대상 표면: **Admin 웹(라이트 테마)만** — 키오스크 다크 테마(`.kiosk-scope`)는 손대지 않음
- 브랜드 방향: **주황 `#FF6C37` primary 유지 + TDS(Toss Design System) 구조 적용**

## 1. 배경 / 목표

현재 Admin 웹은 Notion 풍의 그레이 팔레트(`#37352F`/`#787774`/`#E9E9E7`/`#F7F7F5`)와 작은 radius(`rounded-md` 4px)를 쓴다. 이를 TDS의 그레이스케일·타이포·radius·여백 체계로 교체해 "Toss다운" 정돈된 감성을 입히되, **브랜드 컬러(주황)는 그대로 둔다.**

핵심 원칙:
- **토큰 이름은 보존**한다. 값만 교체 + 신규 토큰(radius/typography) 추가 → 기존 사용처가 깨지지 않는다.
- 컴포넌트의 **하드코딩 hex를 의미론적 토큰 유틸리티로 교체**해 토큰 주도(token-driven) 시스템으로 만든다.
- 저장된 디자인 규칙을 준수한다: 입력 필드 안쪽 흰 배경 / DeleteButton 약화 빨강 텍스트 링크 / 동위 라벨 동일 굵기.

## 2. 디자인 토큰 (`app/globals.css` `@theme inline`)

### 2.1 그레이스케일 → TDS Grey scale (이름 보존, 값 교체)

| 토큰 | 현재 | → TDS | 용도 |
|---|---|---|---|
| `--color-text` | `#37352F` | `#191F28` | Grey 900, 본문 |
| `--color-text-secondary` | `#787774` | `#6B7684` | Grey 600, 보조 |
| `--color-border` | `#E9E9E7` | `#E5E8EB` | Grey 200, 보더 |
| `--color-sidebar` | `#F7F7F5` | `#F9FAFB` | Grey 50, 표면 |
| `--color-row-hover` | `#F7F7F5` | `#F2F4F6` | Grey 100, hover/fill |
| `--color-bg` | `#FFFFFF` | `#FFFFFF` | 변경 없음 |

신규 토큰:
- `--color-text-tertiary: #8B95A1` (Grey 500 — placeholder/caption)
- `--color-fill: #F2F4F6` (secondary 버튼·칩 배경)

### 2.2 브랜드 / 시맨틱

| 토큰 | 값 | 비고 |
|---|---|---|
| `--color-primary` | `#FF6C37` | 유지 |
| `--color-primary-hover` | `#E85A27` | 유지 |
| `--color-primary-light` | `#FFF1EC` | 유지 |
| `--color-danger` | `#EB5757` → `#F04452` | TDS 레드로 정렬 |
| `--color-success` | `#0F7B6C` | **유지** |

### 2.3 신규 radius 스케일

```css
--radius-sm: 8px;   /* 배지·인풋 */
--radius-md: 12px;  /* 버튼 */
--radius-lg: 16px;  /* 카드 */
--radius-xl: 20px;  /* 모달 */
```

### 2.4 타이포그래피 (Pretendard, TDS 가중치)

- 가중치: 본문 `400–500`, 강조/버튼/라벨 `600`, 헤딩 `700`
- 크기: 헤딩 19/22px, 본문 15px, 캡션 13px (TDS 스케일 근사)
- **동위 라벨은 동일 굵기 유지** — 특정 라벨만 볼드 금지(저장된 규칙).

## 3. 컴포넌트 리디자인 (`components/ui/`)

공통: 하드코딩 hex → 의미론적 토큰 유틸리티(`text-text`, `text-text-secondary`, `border-border`, `bg-sidebar`, `bg-fill`, `hover:bg-row-hover` 등 `@theme`가 생성하는 클래스)로 교체. arbitrary hex(`text-[#37352F]`)는 남기지 않는다.

| 컴포넌트 | 변경 | 보존 |
|---|---|---|
| **Button** | radius→`--radius-md`(12px), 패딩↑, weight 500→`600`, `active:` 상태 추가. secondary는 TDS 그레이(`bg-fill`/text Grey700 `#4E5968`) | 4 variant 유지 |
| **Input/Textarea/Select** | radius 12px, border `border`, placeholder `text-tertiary`, focus border 주황 유지, 높이↑ | **안쪽 bg 무조건 흰색** |
| **Card** | radius→`--radius-lg`(16px), 패딩 20–24px, border `border` | API/구조 유지 |
| **Modal** | radius→`--radius-xl`(20px), 패딩 정리, overlay 톤 유지 | props API 유지 |
| **Table** | header `bg-sidebar`, row hover `bg-row-hover`, 행 높이↑, 구분선 `border` | 구조/제네릭 유지 |
| **Badge** | radius→`--radius-sm`/full, 패딩 정리 | globals.css 배지 색 클래스 유지 |
| **DeleteButton** | danger 값만 `#F04452`로 따라감 | **약화 빨강 텍스트 링크 유지** |
| **DonutChart** | 변경 최소(필요 시 색만 토큰 정렬) | 로직 유지 |

추가: `AttendanceDot`의 하드코딩 색도 토큰/배지 색과 정렬.

## 4. 영향 범위 / 안전장치

- globals.css 배지 색 클래스(`.badge-*`)는 그대로 둔다(많은 페이지가 의존). 필요 시 danger 계열만 `#F04452`로 정렬.
- 페이지(.tsx)는 토큰 유틸리티/배지 클래스를 통해 **자동 반영**되며, 이 작업에서 페이지 레이아웃은 건드리지 않는다.
- 동시 세션 오염 방지: 이 작업의 파일만 **스코프 스테이징**, 커밋 전 확인.

## 5. 비범위 (YAGNI)

- 키오스크 다크 테마, primary 컬러 변경, 페이지 레이아웃 개편, 신규 컴포넌트 추가는 하지 않는다.

## 6. 검증

- `npm run build`(또는 typecheck) 통과.
- Admin 주요 화면(대시보드/학생/리드) 육안 확인: radius·여백·그레이 톤이 TDS로 바뀌고 기능 동작 유지.
