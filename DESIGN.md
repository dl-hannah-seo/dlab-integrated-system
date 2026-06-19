# D.LAB 통합시스템 디자인 시스템

이 문서는 D.LAB 통합시스템(가맹 포털·학생 포털·키오스크)의 디자인 하네스입니다.
**하나의 브랜드, 두 개의 트랙** — "디랩스러움"을 화면의 목적에 맞게 차등 적용합니다.

> 브랜드 1차 출처는 (주)디랩 인테리어·브랜딩 매뉴얼입니다.
> 캡처 원본 + 전사 인덱스: [`docs/design-reference/dlab-brand-manual/`](docs/design-reference/dlab-brand-manual/README.md)
> ⚠️ 해당 매뉴얼은 (주)디랩 대외비. 외부 유출 금지.

---

## 0. 브랜드 파운데이션

매뉴얼이 규정하는 D.LAB 브랜드의 시각 토대입니다. 모든 트랙이 여기서 파생됩니다.

### 0-1. 3색 체계

브랜드는 **딱 3색**으로 규정됩니다. 흰 바탕에 오렌지로 "포인트만" 줍니다.

| 역할 | 매뉴얼 규정 | 비고 |
|------|------------|------|
| **Core** | White & Black & Gray Scale | 메시지를 진중하게 전달, 콘텐츠에 집중 |
| **Point** | Orange — **Pantone 172 C/U** | "생기있고 생동감 있는 경험과 디지털 세상 속 인간미" |

규정 조합: **White + Pantone 172C/U + Black**. 인테리어·간판·인포데스크 모두 이 조합으로 통일.

### 0-2. 오렌지 값 (투트랙)

화면은 인쇄와 1:1 매핑되지 않으므로, 표면 목적에 따라 오렌지를 **2값**으로 운용합니다.

| 토큰 | Hex | 사용처 | 근거 |
|------|-----|--------|------|
| **Admin Orange** | `#FF6C37` | 관리자 웹(트랙 A) | 장시간 업무 화면 — 눈 피로 적은 디지털 튜닝값 |
| **Brand Orange** | `#FA4616` | 학생·키오스크·마케팅(트랙 B) | Pantone 172 C에 가까운 쨍한 레드오렌지, 매장 물리세계와 일치 |

> **인쇄/실물 기준값**: Pantone **172 C/U**, 유사 컬러 시트지 **3M MC 134G** (판매처 유경식 02-437-2733).
> 실물 제작물(간판·스티커·인포데스크)은 반드시 이 인쇄 기준을 따르고, 육안 판별이 어려우면 본사에 피드백 요청.

### 0-3. 로고 색 규정

로고는 White / Brand Orange(172C/U) / Black 조합으로만 사용. 로고 위 임의 색 사용 금지.

### 0-4. 브랜드 메시지 (카피 소스)

제품 카피·환영문구·엠프티스테이트에 끌어다 쓰는 공식 문구입니다. (트랙 B에서 적극 사용)

- **대표 슬로건**: `MAKE YOUR OWN WORLD` · `CODE YOUR DREAM` · `WELCOME GEEKS`
- **ESSENCE**: `ALIVE`
- **MISSION**: `WE CONSTANTLY CHALLENGE YOUR LIMIT`
- **VISION**: `A WORLD IN WHICH A LEADING LIFE BECOMES A COMMON THING`
- **VALUE**: `WE ARE ALL BORN CREATIVE` · `TECHNOLOGY HELPS US REALIZE OUR TRUE DIFFERENCE` · `BRIDGING DREAMS AND REALITY WITH CREATIVITY` · `CHALLENGES ARE LIKE YOUR COMPASS FOR SELF-DISCOVERY` · `FUN IN LEARNING MAKES LEARNING LAST LONGER` · `IMAGINATION FUELS INNOVATION IN THE DIGITAL AGE`
- **격려/키워드**: `YOU'RE DOING GREAT! KEEP IT UP!` · `GREAT GEEKS` · `BREAK THE RULES` · `Alive, Exciting, Creative, Unique, Lively`

---

## 1. 두 트랙 개요

| | **트랙 A — 관리자 (Admin)** | **트랙 B — 학생·키오스크 (Brand)** |
|---|---|---|
| 대상 | 원장·교사·SO 백오피스 | 학생 포털·키오스크·마케팅 화면 |
| 목적 | 정보 위계·가독성·장시간 사용 | 브랜드 경험·동기부여·임팩트 |
| 톤 | 차분한 웜그레이 미니멀 (Notion 영감) | 라우드·에너지 (포스터 감성) |
| 바탕 | White / Warm Gray | Dark `#0F0F14` |
| 오렌지 | `#FF6C37` (포인트만) | `#FA4616` (블록·CTA·슬로건) |
| 타이포 | Pretendard, 절제된 굵기 | Pretendard, 큰 볼드/extrabold |
| 모션 | `transition-colors`만 | scale·슬라이드·파형 등 플레이풀 |
| 슬로건 | 사용 안 함 | 적극 사용 (0-4) |
| 폰트 | Pretendard (공통) | Pretendard (공통) |

### "이 화면은 어느 트랙?" 판단 규칙

- **관리자가 업무로 들여다보는 화면** → 트랙 A. (`app/(admin)/*`, 로그인, 가맹 포털)
- **학생/학부모가 보거나, 매장에 노출되거나, 홍보가 목적인 화면** → 트랙 B. (`app/kiosk/*`, `app/me/*` 학생 포털, 포스터/배너)
- 애매하면 **트랙 A**(차분)를 기본값으로. 라우드는 "브랜드를 보여줘야 할 이유가 분명할 때"만.

> 두 트랙은 폰트(Pretendard)와 공통 불변 규칙(5장)을 공유합니다. 색·바탕·톤만 분기합니다.

---

## 2. 트랙 A — 관리자 (Admin)

Notion에서 영감받은 **따뜻한 회색 기반 미니멀 UI**. 장식을 배제하고 정보 위계와 가독성에 집중합니다.

### 2-1. 색상 토큰 (globals.css `@theme inline`)

```css
@theme inline {
  --color-bg:             #FFFFFF;   /* 페이지 배경 */
  --color-sidebar:        #F7F7F5;   /* 사이드바, 테이블 헤더, hover */
  --color-text:           #37352F;   /* 기본 텍스트 (따뜻한 거의 검정) */
  --color-text-secondary: #787774;   /* 보조 텍스트, 라벨 */
  --color-border:         #E9E9E7;   /* 기본 보더 */
  --color-primary:        #FF6C37;   /* Admin Orange (포인트) */
  --color-primary-hover:  #E85A27;
  --color-primary-light:  #FFF1EC;   /* 활성 nav 배경, 경고 배너 */
  --color-danger:         #EB5757;
  --color-success:        #0F7B6C;
  --color-row-hover:      #F7F7F5;
}
```

### 2-2. 전체 팔레트

| 역할 | Hex | 사용처 |
|------|-----|--------|
| 배경 | `#FFFFFF` | 페이지, 카드, 인풋 |
| 사이드바 | `#F7F7F5` | 사이드바 bg, 테이블 헤더, row hover |
| 기본 텍스트 | `#37352F` | 모든 본문·제목·인풋 값 |
| 보조 텍스트 | `#787774` | 플레이스홀더, 메타 정보, 비활성 |
| 보더 | `#E9E9E7` | 카드, 인풋, 테이블 구분선 |
| 미묘한 배경 | `#F1F1EF` | secondary 버튼, 로그아웃 버튼 |
| 더 미묘한 hover | `#EFEFEE` | secondary 버튼 hover, nav 기본 hover |
| Admin Orange | `#FF6C37` | primary 버튼, 활성 nav, 포인트 |
| Admin Orange hover | `#E85A27` | primary 버튼 hover |
| 연한 오렌지 | `#FFF1EC` | 활성 nav 배경, 경고 배너 배경 |
| 위험/오류 | `#EB5757` | danger, 인풋 에러 |
| 성공/확정 | `#0F7B6C` | 성공 배너, confirmed 배지 |
| 연한 성공 | `#EDF7F5` | 성공 배너 배경 |
| 진한 성공 | `#0B6E1A` | admin-reviewed 배지 텍스트 |
| 진한 성공 연한 | `#E3F2E6` | admin-reviewed 배지 배경 |
| 경고 (노랑) | `#D9A80A` | reviewing 배지 텍스트 |
| 연한 경고 | `#FFF8E6` | reviewing 배지 배경 |
| 완료 (회색) | `#787774` | completed 배지 텍스트 |
| 연한 완료 | `#F1F1EF` | completed 배지 배경 |
| 납입 (파랑) | `#1A73E8` | paid 배지 텍스트 |
| 연한 파랑 | `#E8F0FE` | paid 배지 배경 |
| 모달 오버레이 | `black/40` | 모달 딤 처리 |

### 2-3. 타이포그래피

```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
font-size: 16px;  /* base */
font-weight: 400;
-webkit-font-smoothing: antialiased;
```

Pretendard 로컬 폰트, 4웨이트: Regular(400) · Medium(500) · SemiBold(600) · Bold(700).

| Tailwind | 크기 | 사용처 |
|----------|------|--------|
| `text-xs` | 12px | 배지, 라벨, 메타, 에러, 보조 설명 |
| `text-sm` | 14px | 본문, 인풋 값, nav, 테이블 셀, 버튼 |
| `text-base` | 16px | 카드 제목, 모달 제목 |
| `text-lg` | 18px | 카드 내 지표 숫자 |
| `text-xl` | 20px | 페이지 제목 (h1) |

| 웨이트 | Tailwind | 사용처 |
|--------|----------|--------|
| 400 | `font-normal` | 기본 본문 |
| 500 | `font-medium` | 라벨, 버튼, 활성 nav, 강조 |
| 600 | `font-semibold` | 카드 제목, 테이블 헤더, 모달 제목 |
| 700 | `font-bold` | 페이지 h1, 카드 내 핵심 숫자 |

금액·숫자에는 `tabular-nums`(`font-variant-numeric: tabular-nums`)로 자릿수 정렬.

### 2-4. 간격 · 보더 · 그림자

| 용도 | Tailwind | 픽셀 |
|------|----------|------|
| 버튼, 인풋, nav 아이템 | `rounded-md` | 6px |
| 카드 | `rounded-lg` | 8px |
| 모달 | `rounded-xl` | 12px |
| 배지 | `rounded` | 4px |

- 모든 구분선은 `border-[#E9E9E7]`, 굵기 1px(`border`).
- 카드에는 그림자 없음. 모달에만 `shadow-xl`.

| 패턴 | 클래스 |
|------|--------|
| 페이지 섹션 간격 | `mb-6` |
| 그리드 간격 | `gap-6` |
| 카드 내부 패딩 | `p-6` |
| 카드 헤더 패딩 | `px-6 py-4` |
| 테이블 셀 패딩 | `px-4 py-3` |
| 모달 헤더/푸터 패딩 | `px-6 py-4` |
| 모달 콘텐츠 패딩 | `px-6 py-5` |
| 사이드바 너비 | `w-60` (240px) |
| 콘텐츠 최대 너비 | `max-w-[960px]` |
| 콘텐츠 패딩 | `px-10 py-10` |

### 2-5. 컴포넌트

#### Button

```tsx
const base = 'inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const variants = {
  primary:   'bg-[#FF6C37] text-white hover:bg-[#E85A27]',
  secondary: 'bg-[#F1F1EF] text-[#37352F] hover:bg-[#EFEFEE]',
  danger:    'bg-[#EB5757] text-white hover:bg-red-600',
  ghost:     'text-[#37352F] hover:bg-[#F7F7F5]',
};
const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1',
  md: 'px-4 py-2 text-sm gap-1.5',
  lg: 'px-5 py-2.5 text-sm gap-2',
};
```

Props: `variant`(primary|secondary|danger|ghost), `size`(sm|md|lg), `loading`. 로딩 중 spinner SVG + 비활성화.

#### Card

```tsx
// 컨테이너
'bg-white border border-[#E9E9E7] rounded-lg'
// 헤더 (title/action 있을 때)
'flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7]'
// 제목
'text-base font-semibold text-[#37352F]'
// 콘텐츠
'p-6'
```

Props: `title`, `action`(ReactNode), `className`, `titleClassName`.

#### Input / Textarea / Select

```tsx
'w-full bg-white border border-[#E9E9E7] rounded-md px-3 py-2 text-sm text-[#37352F]'
+ 'placeholder:text-[#787774]'
+ 'focus:outline-none focus:border-[#FF6C37] transition-colors'
+ 'disabled:bg-[#F7F7F5] disabled:text-[#787774]'
// 에러: 'border-[#EB5757]'  ·  레이블: 'text-sm font-medium text-[#37352F]'  ·  에러 메시지: 'text-xs text-[#EB5757]'
```

래퍼: `flex flex-col gap-1` → label → input → error. Input은 `suffix` prop으로 우측 단위(`원`,`%`) 표시.
배경 규칙은 5-3 참조(항상 흰색).

#### Table

```tsx
'overflow-x-auto'                                                  // 래퍼
'w-full text-sm'                                                   // 테이블
'bg-[#F7F7F5] border-b border-[#E9E9E7]'                          // 헤더 행
'px-4 py-3 text-left font-semibold text-[#37352F] whitespace-nowrap' // 헤더 셀
'border-b border-[#E9E9E7]'                                        // 데이터 행
'cursor-pointer hover:bg-[#F7F7F5]'                               // 클릭 가능 행
'px-4 py-3 text-[#37352F]'                                        // 데이터 셀
'px-4 py-8 text-center text-[#787774]'                            // 빈 상태
```

Column 정의: `{ key, header, render?, className? }`.

#### Modal

```tsx
'fixed inset-0 z-50 flex items-center justify-center'             // 오버레이
'absolute inset-0 bg-black/40 -z-10'                              // 딤
`relative bg-white rounded-xl shadow-xl w-full ${widths[size]} mx-4 max-h-[90vh] flex flex-col`
'flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7]' // 헤더
'text-base font-semibold text-[#37352F]'                         // 제목
'text-[#787774] hover:text-[#37352F] transition-colors'          // 닫기
'px-6 py-5 overflow-y-auto flex-1'                                // 콘텐츠
'px-6 py-4 border-t border-[#E9E9E7] flex justify-end gap-2'      // 푸터
const widths = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
```

열릴 때 `document.body.style.overflow = 'hidden'`.

#### StatusBadge

```tsx
'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium'
```

| 상태 | 배경 | 텍스트 | 클래스 |
|------|------|--------|--------|
| submitted | `#FFF1EC` | `#FF6C37` | `.badge-submitted` |
| reviewing | `#FFF8E6` | `#D9A80A` | `.badge-reviewing` |
| confirmed | `#EDF7F5` | `#0F7B6C` | `.badge-confirmed` |
| admin-reviewed | `#E3F2E6` | `#0B6E1A` | `.badge-admin-reviewed` |
| completed | `#F1F1EF` | `#787774` | `.badge-completed` |
| paid | `#E8F0FE` | `#1A73E8` | `.badge-paid` |

출결 배지: `.badge-attend`(청록) · `.badge-absent`(빨강) · `.badge-pending`(회색) · `.badge-makeup`(노랑).

#### 알림 배너

```tsx
// 경고 (주황)
'bg-[#FFF1EC] border border-[#FF6C37]/20 rounded-lg px-5 py-4 flex items-start gap-3'
// 성공 (청록)
'bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-lg px-5 py-4'
```

### 2-6. 레이아웃

```
┌────────────────────────────────────────┐
│  Sidebar (240px, fixed)  │  Main       │
│  logo (h-14)             │  ml-60      │
│  nav (flex-1, scroll)    │  max-w-960  │
│  user info + logout      │  px-10 py-10│
└────────────────────────────────────────┘
```

```tsx
// Sidebar 컨테이너
'fixed left-0 top-0 h-screen w-60 bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col z-10'
// 활성 nav
'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm bg-[#FFF1EC] text-[#FF6C37] font-medium'
// 기본 nav
'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#37352F] hover:bg-[#EFEFEE]'
// main
'flex-1 ml-60 min-h-screen'  →  'max-w-[960px] mx-auto px-10 py-10'
```

페이지 헤더: `<h1 className="text-xl font-bold text-[#37352F]">` + `<p className="text-sm text-[#787774] mt-1">`.

### 2-7. 로그인 페이지

사이드바 없는 전체화면. `min-h-screen bg-[#F7F7F5] flex items-center justify-center` → `max-w-sm` → 카드 `bg-white border rounded-xl p-8`.

---

## 3. 트랙 B — 학생·키오스크 (Brand)

매장에 노출되고 학생을 동기부여하는 **라우드한 다크 브랜드 화면**. 포스터 감성 — 큰 볼드, 쨍한 오렌지, 골드 포인트, 플레이풀 모션.

### 3-1. 색상 토큰 (globals.css `.kiosk-scope`)

```css
.kiosk-scope {
  --kiosk-bg:           #0F0F14;   /* 페이지 바탕 (near-black) */
  --kiosk-surface:      #1A1A24;   /* 패널·게이트 카드 */
  --kiosk-card:         #22222E;   /* 카드 */
  --kiosk-orange:       #FA4616;   /* Brand Orange = Pantone 172C 근사값 */
  --kiosk-orange-bright:#FF7A45;   /* 그라데이션/강조용 밝은 오렌지 (구 --kiosk-orange2) */
  --kiosk-orange-hover: #E03A0E;   /* 오렌지 버튼 hover */
  --kiosk-text:         #F0F0F0;   /* 기본 텍스트 */
  --kiosk-muted:        #888899;   /* 보조 텍스트 */
  --kiosk-border:       #2E2E3A;   /* 보더 */
  --kiosk-gold:         #F5C842;   /* 포인트·획득 강조 (골드) */
}
```

> 변경점: 기존 `--kiosk-orange: #FF6C37` → **`#FA4616`**(쨍한 172C). `--kiosk-orange2`는 의미를 명확히 하려 `--kiosk-orange-bright`로 개명하고 hover 값을 추가합니다. 적용은 별도 구현 단계.

| 토큰 | Hex | 사용처 |
|------|-----|--------|
| `--kiosk-bg` | `#0F0F14` | 키오스크/학생 포털 페이지 바탕 |
| `--kiosk-surface` | `#1A1A24` | 게이트 카드, 패널 표면 |
| `--kiosk-card` | `#22222E` | 카드, 입력 박스 |
| `--kiosk-orange` | `#FA4616` | CTA 버튼, 슬로건, 오렌지 블록 |
| `--kiosk-orange-bright` | `#FF7A45` | 그라데이션 상단, hover 글로우 |
| `--kiosk-gold` | `#F5C842` | 포인트 획득 숫자, 별/보상 강조 |
| `--kiosk-text` | `#F0F0F0` | 본문 |
| `--kiosk-muted` | `#888899` | 보조/안내 |
| `--kiosk-border` | `#2E2E3A` | 구분선 |

### 3-2. 타이포 (라우드)

폰트는 Pretendard 공통. 트랙 A보다 **크고 굵게**.

| 용도 | 클래스 | 비고 |
|------|--------|------|
| 히어로/환영 | `text-4xl~text-6xl font-extrabold` | WELCOME GEEKS, 이름 호명 |
| 슬로건 | `text-2xl~text-3xl font-bold` | CODE YOUR DREAM 등 |
| 포인트 숫자 | `text-3xl font-extrabold` + 골드 | `+10P` 등, `tabular-nums` |
| 본문/안내 | `text-base~text-lg` | muted 색 |
| CTA 버튼 | `text-base~text-lg font-extrabold` | 흰 텍스트 on 오렌지 |

### 3-3. 형태 · 모션

```tsx
// 카드/패널: 더 둥글게
'rounded-2xl' (16px) ~ 'rounded-3xl' (24px)
// CTA 버튼
'rounded-xl text-white font-extrabold transition-all active:scale-95'  // bg: var(--kiosk-orange)
// 오렌지 블록 헤더 (포스터 감성)
'bg-[var(--kiosk-orange)] text-white px-4 py-2 font-extrabold'
```

- 모션 적극 사용: `active:scale-95`(탭 피드백), 슬라이드 인(`animate-slide-from-*`), 포인트 획득 애니메이션.
- DEMO 한정 모션(예: AI 가짜 파형 `.animate-wave-bar`, 출석 시연 재생)은 **추후 삭제 대상**으로 주석 표기. 실데이터 연동 시 제거.

### 3-4. 키오스크 게이트/표면 패턴

- 미등록 기기 게이트: `--kiosk-surface` 카드 + 🔒 + 학생 포털 유도 CTA(오렌지). (`app/kiosk/page.tsx`)
- 출석 완료: 이름 호명 + 슬로건 + 자동 리셋(타이머).
- 포스터 캐러셀: `kioskPosters` 자동 순환(5s).

### 3-5. 학생 포털 (`app/me/*`)

키오스크와 같은 다크 브랜드 트랙. 포인트·마이페이지·상점을 게이미피케이션 톤으로. 골드(`--kiosk-gold`)는 "획득/보상" 시그널 전용.

---

## 4. 브랜드 보이스 & 카피

트랙 B 화면의 빈 공간·전환·환영에 **브랜드 슬로건(0-4)**을 적극 노출합니다. 트랙 A에서는 사용하지 않습니다.

### 4-1. 슬로건 사용처

| 상황 | 추천 카피 |
|------|-----------|
| 키오스크 대기/환영 | `WELCOME GEEKS` · `CODE YOUR DREAM` |
| 출석 완료 | 이름 + `YOU'RE DOING GREAT! KEEP IT UP!` |
| 학생 포털 첫 진입 | `MAKE YOUR OWN WORLD` |
| 엠프티 스테이트(데이터 없음) | `GREAT GEEKS` · `BREAK THE RULES` |
| 로그인/스플래시 | `MAKE YOUR OWN WORLD` |

### 4-2. 형광펜 디스플레이 스타일 (선택)

매뉴얼 레터링 스티커의 "검정 텍스트 위 오렌지 형광펜 박스" 감성. 마케팅성 헤더/스플래시에만 사용.

```tsx
// 형광펜 하이라이트 (다크 바탕)
<span className="bg-[var(--kiosk-orange)] text-white px-1.5 font-extrabold">MAKE YOUR OWN WORLD</span>
// 또는 오렌지 텍스트 강조
<span className="text-[var(--kiosk-orange)] font-extrabold">CODE YOUR DREAM</span>
```

### 4-3. 톤 가이드

- 학생 대상: 짧고 힘있게, 격려·도전. 명령형보다 응원형("오늘도 완료! +10P").
- 영문 슬로건은 대문자 볼드 그대로. 한글 보조 설명을 붙여 이해를 돕는다.

---

## 5. 공통 불변 규칙 (두 트랙 공통)

폰트(Pretendard)와 아래 규칙은 트랙과 무관하게 **항상** 지킵니다.

### 5-1. 삭제 액션 — DeleteButton 표준

삭제는 비가역 위험 동작이므로 **솔리드 버튼으로 강조하지 않는다.** 모든 삭제 트리거는 약화된 빨강 텍스트 링크(`components/ui/DeleteButton`)로 통일.

```tsx
'text-sm text-[#EB5757] hover:underline'   // 삭제 트리거 (어디서나 동일)
```

- 트리거는 `DeleteButton`(텍스트 링크)만. `Button variant="danger"`(솔리드)는 트리거에 쓰지 않는다.
- 삭제 트리거는 편집 등 일반 액션과 **물리적으로 떨어뜨려** 배치(카드 하단, 모달 푸터 좌측).
- 실제 삭제 **확정**은 별도 확인 모달에서, 그 모달의 확정 버튼만 솔리드 빨강.
- 영향 범위(예: 수강 인원 있는 반)가 있으면 확인 모달에 경고 배너.

### 5-2. 라벨 굵기 일관성

같은 위계의 라벨은 **같은 굵기**. 특정 라벨 하나만 볼드 처리 금지.

- 폼/상세 필드 라벨(필드 위 작은 회색 라벨): `text-xs text-[#787774] font-normal`. 같은 화면의 보조 섹션 라벨도 동일하게.
- 볼드를 쓸 수 있는 것은 위계가 분명히 다른 경우뿐: 카드 제목·테이블 헤더·모달 제목.
- "이 라벨만 강조하고 싶다"는 충동 = 위계를 바꾸는 것 → 카드/섹션 구조로 분리할 것.

### 5-3. 입력 필드 배경은 항상 흰색

**모든 입력 필드(input·textarea·select)의 안쪽 배경은 무조건 흰색(`bg-white`).** 회색 컨테이너(`bg-[#F7F7F5]`) 안에서도 필드가 컨테이너 색을 비쳐 회색으로 보이면 안 된다.

- `bg-white`는 공유 컴포넌트 베이스 클래스에 항상 포함. 인라인 raw 태그에도 명시.
- 유일한 예외는 **비활성(`disabled`)** 상태 — 이때만 `disabled:bg-[#F7F7F5]`.
- 트랙 B(다크) 입력은 예외: `--kiosk-card`(`#22222E`) 배경 + `--kiosk-text`. 단 "컨테이너 색이 비쳐 보이지 않게 명시적 배경을 준다"는 원칙은 동일.

### 5-4. 공통 베이스

```css
*, *::before, *::after { box-sizing: border-box; }
html { font-size: 16px; }
body { font-family: 'Pretendard', …; -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #E9E9E7; border-radius: 3px; }
```

### 5-5. 아이콘

별도 라이브러리 없이 **Heroicons 스타일 인라인 SVG**(stroke 기반, fill 없음).

```tsx
<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="…" />
</svg>
```

nav 16×16 · 알림 18×18 · 모달 닫기 20×20.

---

## 6. 재현 체크리스트

### 공통

- [ ] Pretendard 로컬 폰트 로드 (woff2, 4웨이트)
- [ ] `box-sizing: border-box`, `font-smoothing: antialiased`, 스크롤바 스타일
- [ ] 공통 불변 규칙(5장): 삭제 버튼·라벨 굵기·입력 흰 배경
- [ ] 브랜드 인쇄 기준값(Pantone 172C/U · 3M MC134G)을 실물 제작물에 적용

### 트랙 A (관리자)

- [ ] `@theme inline` 색 토큰 + badge 클래스 (`#FF6C37` 계열)
- [ ] 사이드바 240px 고정, 메인 `ml-60`, 콘텐츠 `max-w-[960px] px-10 py-10`
- [ ] 카드 그림자 없음 / 모달만 `shadow-xl`
- [ ] 색은 모두 인라인 hex 또는 CSS 변수 (Tailwind 커스텀 색 불필요)

### 트랙 B (학생·키오스크)

- [ ] `.kiosk-scope` 다크 토큰, **`--kiosk-orange: #FA4616`**(쨍한 172C)
- [ ] 큰 볼드 타이포(extrabold), 골드(`#F5C842`)는 보상 시그널 전용
- [ ] 슬로건 카피(0-4) 환영/완료/엠프티에 노출, 트랙 A엔 미사용
- [ ] 플레이풀 모션(`active:scale-95`, 슬라이드); DEMO 모션은 삭제 대상 주석
