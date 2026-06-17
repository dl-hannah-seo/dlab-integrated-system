# D.LAB 포털 디자인 시스템

이 문서는 D.LAB 가맹 포털의 디자인 시스템을 기술합니다. 동일한 시각 언어를 다른 시스템에 재현하기 위한 완전한 레퍼런스입니다.

---

## 디자인 철학

Notion에서 영감을 받은 **따뜻한 회색 기반 미니멀 UI**입니다. 장식을 배제하고 정보 위계와 가독성에 집중합니다. D.LAB 브랜드 오렌지(`#FF6C37`)를 포인트 컬러로 사용하며, 한국어 타이포그래피를 위해 Pretendard 폰트를 씁니다.

---

## 1. 색상

### CSS 변수 (globals.css)

```css
@theme inline {
  --color-bg:             #FFFFFF;   /* 페이지 배경 */
  --color-sidebar:        #F7F7F5;   /* 사이드바, 테이블 헤더, hover */
  --color-text:           #37352F;   /* 기본 텍스트 (따뜻한 거의 검정) */
  --color-text-secondary: #787774;   /* 보조 텍스트, 라벨 */
  --color-border:         #E9E9E7;   /* 기본 보더 */
  --color-primary:        #FF6C37;   /* D.LAB 브랜드 오렌지 */
  --color-primary-hover:  #E85A27;   /* primary hover */
  --color-primary-light:  #FFF1EC;   /* primary 연한 배경 (활성 nav, 경고 배너) */
  --color-danger:         #EB5757;   /* 오류, 삭제 */
  --color-success:        #0F7B6C;   /* 성공, 확정 */
  --color-row-hover:      #F7F7F5;   /* 테이블 row hover */
}
```

### 전체 팔레트

| 역할 | Hex | 사용처 |
|------|-----|--------|
| 배경 | `#FFFFFF` | 페이지, 카드, 인풋 |
| 사이드바 | `#F7F7F5` | 사이드바 bg, 테이블 헤더, row hover |
| 기본 텍스트 | `#37352F` | 모든 본문·제목·인풋 값 |
| 보조 텍스트 | `#787774` | 플레이스홀더, 메타 정보, 비활성 |
| 보더 | `#E9E9E7` | 카드, 인풋, 테이블 구분선 |
| 미묘한 배경 | `#F1F1EF` | secondary 버튼, 로그아웃 버튼 |
| 더 미묘한 hover | `#EFEFEE` | secondary 버튼 hover, nav 기본 hover |
| 브랜드 오렌지 | `#FF6C37` | primary 버튼, 활성 nav, 포인트 |
| 브랜드 오렌지 hover | `#E85A27` | primary 버튼 hover |
| 연한 오렌지 | `#FFF1EC` | 활성 nav 배경, 경고 배너 배경 |
| 위험/오류 | `#EB5757` | danger 버튼, 인풋 에러, 에러 텍스트 |
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

---

## 2. 타이포그래피

### 폰트

```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
font-size: 16px;        /* base */
font-weight: 400;
-webkit-font-smoothing: antialiased;
```

Pretendard는 로컬 폰트로 로드합니다. 4가지 웨이트를 사용합니다.

```
Pretendard-Regular.woff2   → weight: 400
Pretendard-Medium.woff2    → weight: 500
Pretendard-SemiBold.woff2  → weight: 600
Pretendard-Bold.woff2      → weight: 700
```

### 텍스트 사이즈

| Tailwind 클래스 | 크기 | 사용처 |
|----------------|------|--------|
| `text-xs` | 12px | 배지, 라벨, 메타 정보, 에러 메시지, 보조 설명 |
| `text-sm` | 14px | 본문, 인풋 값, nav 링크, 테이블 셀, 버튼 |
| `text-base` | 16px | 카드 제목, 모달 제목 |
| `text-lg` | 18px | 카드 내 지표 숫자 |
| `text-xl` | 20px | 페이지 제목 (h1) |

### 웨이트 사용 규칙

| 웨이트 | Tailwind | 사용처 |
|--------|----------|--------|
| 400 | `font-normal` | 기본 본문 |
| 500 | `font-medium` | 라벨, 버튼 텍스트, 활성 nav 링크, 강조 텍스트 |
| 600 | `font-semibold` | 카드 제목, 테이블 헤더, 모달 제목 |
| 700 | `font-bold` | 페이지 h1, 카드 내 핵심 숫자 |

### 라벨 일관성 규칙 (필수)

같은 위계의 라벨은 **같은 굵기**를 쓴다. 특정 라벨 하나만 볼드(`font-semibold`/`font-bold`) 처리하지 않는다.

- **폼/상세 필드 라벨**(필드 위 작은 회색 라벨): `text-xs text-[#787774]` — `font-normal`. 같은 화면/모달 안의 보조 섹션 라벨(예: "수강 반", "재원형제")도 동일하게 맞춘다.
- 볼드를 쓸 수 있는 것은 위계가 분명히 다른 경우뿐: **카드 제목**(`text-base font-semibold`), **테이블 헤더**, **모달 제목**.
- 새 라벨을 추가할 때 옆 라벨의 굵기를 그대로 따른다. "이 라벨만 강조하고 싶다"는 충동이 들면 위계를 바꾸는 것이므로 카드/섹션 구조로 분리할 것.

### 숫자 표기

금액·숫자에는 `font-variant-numeric: tabular-nums`를 적용해 자릿수 정렬을 유지합니다.

```css
.tabular-nums { font-variant-numeric: tabular-nums; }
```

---

## 3. 간격 · 보더 · 그림자

### 보더 반경

| 용도 | Tailwind | 픽셀 |
|------|----------|------|
| 버튼, 인풋, nav 아이템 | `rounded-md` | 6px |
| 카드 | `rounded-lg` | 8px |
| 모달 | `rounded-xl` | 12px |
| 배지 | `rounded` | 4px |

### 보더

모든 구분선은 `border-[#E9E9E7]`를 사용합니다. 굵기는 항상 1px(`border`)입니다.

### 그림자

카드에는 그림자를 사용하지 않습니다. 모달에만 `shadow-xl`을 적용합니다.

### 주요 간격 패턴

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

---

## 4. 컴포넌트

### 4-1. Button

4가지 variant, 3가지 size를 지원합니다.

```tsx
// 기본 구조
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

**Props**: `variant` (primary|secondary|danger|ghost), `size` (sm|md|lg), `loading` (boolean)

로딩 중에는 spinner SVG를 인라인으로 표시하고 버튼을 비활성화합니다.

---

### 4-2. Card

```tsx
// 컨테이너
'bg-white border border-[#E9E9E7] rounded-lg'

// 헤더 (title 또는 action prop이 있을 때)
'flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7]'

// 제목
'text-base font-semibold text-[#37352F]'

// 콘텐츠 영역
'p-6'
```

**Props**: `title` (선택), `action` (우측 액션 영역, ReactNode), `className`, `titleClassName`

---

### 4-3. Input / Textarea / Select

세 컴포넌트는 동일한 시각 언어를 공유합니다.

```tsx
// 공통 베이스 (input 기준)
'w-full bg-white border border-[#E9E9E7] rounded-md px-3 py-2 text-sm text-[#37352F]'
+ 'placeholder:text-[#787774]'
+ 'focus:outline-none focus:border-[#FF6C37] transition-colors'
+ 'disabled:bg-[#F7F7F5] disabled:text-[#787774]'

// 에러 상태
'border-[#EB5757]'

// 레이블
'text-sm font-medium text-[#37352F]'

// 에러 메시지
'text-xs text-[#EB5757]'
```

래퍼 구조: `flex flex-col gap-1` → label → input(relative wrap) → error

Input은 `suffix` prop으로 우측 단위 텍스트(`원`, `%` 등)를 표시합니다.

#### 입력 필드 배경 규칙 (필수)

**모든 입력 필드(input·textarea·select)의 안쪽 배경은 무조건 흰색(`bg-white`)이다.** 회색 배경 컨테이너(`bg-[#F7F7F5]` 카드/소블록) 안에 들어가더라도 필드가 컨테이너 색을 비쳐 회색으로 보이면 안 된다. 따라서 `bg-white`는 공유 컴포넌트(`Input`/`Textarea`/`Select`)의 베이스 클래스에 항상 포함한다.

- 인라인 raw `<input>`/`<textarea>`/`<select>`를 직접 쓸 때도 `bg-white`를 명시한다.
- 유일한 예외는 **비활성(`disabled`) 상태**로, 이때만 `disabled:bg-[#F7F7F5]`로 회색 처리해 입력 불가를 시각적으로 알린다.

---

### 4-4. Table

```tsx
// 테이블 래퍼
'overflow-x-auto'

// 테이블
'w-full text-sm'

// 헤더 행
'bg-[#F7F7F5] border-b border-[#E9E9E7]'

// 헤더 셀
'px-4 py-3 text-left font-semibold text-[#37352F] whitespace-nowrap'

// 데이터 행
'border-b border-[#E9E9E7]'

// 클릭 가능한 행
'cursor-pointer hover:bg-[#F7F7F5]'

// 데이터 셀
'px-4 py-3 text-[#37352F]'

// 빈 상태
'px-4 py-8 text-center text-[#787774]'
```

Column 정의: `{ key, header, render?, className? }`

---

### 4-5. Modal

```tsx
// 오버레이 래퍼 (클릭 시 닫힘)
'fixed inset-0 z-50 flex items-center justify-center'

// 딤 처리
'absolute inset-0 bg-black/40 -z-10'

// 모달 컨테이너
`relative bg-white rounded-xl shadow-xl w-full ${widths[size]} mx-4 max-h-[90vh] flex flex-col`

// 헤더
'flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7]'

// 제목
'text-base font-semibold text-[#37352F]'

// 닫기 버튼
'text-[#787774] hover:text-[#37352F] transition-colors'

// 콘텐츠
'px-6 py-5 overflow-y-auto flex-1'

// 푸터
'px-6 py-4 border-t border-[#E9E9E7] flex justify-end gap-2'

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
```

열릴 때 `document.body.style.overflow = 'hidden'` 처리합니다.

---

### 4-6. StatusBadge

```tsx
// 베이스
'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium'
```

#### 상태별 스타일

| 상태 | 배경 | 텍스트 | CSS 클래스 |
|------|------|--------|-----------|
| `submitted` (제출) | `#FFF1EC` | `#FF6C37` | `.badge-submitted` |
| `reviewing` (검토중) | `#FFF8E6` | `#D9A80A` | `.badge-reviewing` |
| `confirmed` (확인) | `#EDF7F5` | `#0F7B6C` | `.badge-confirmed` |
| `admin-reviewed` (관리자 검토) | `#E3F2E6` | `#0B6E1A` | `.badge-admin-reviewed` |
| `completed` (완료) | `#F1F1EF` | `#787774` | `.badge-completed` |
| `paid` (납입완료) | `#E8F0FE` | `#1A73E8` | `.badge-paid` |

---

### 4-7. DeleteButton (삭제 액션 — 표준)

삭제는 위험한 비가역 동작이므로 **솔리드 버튼으로 강조하지 않는다.** 모든 삭제 트리거는 약화된 빨강 텍스트 링크로 통일한다(`components/ui/DeleteButton`).

```tsx
// 삭제 트리거 (목록/상세/카드 등 어디서나 동일)
'text-sm text-[#EB5757] hover:underline'
```

규칙:
- 삭제 **트리거**는 `DeleteButton`(텍스트 링크)만 사용. `Button variant="danger"`(솔리드)는 트리거에 쓰지 않는다.
- 삭제 트리거는 편집 등 일반 액션과 **물리적으로 떨어뜨려** 배치한다(예: 카드 맨 하단, 모달 푸터 좌측).
- 실제 삭제 **확정**은 별도 확인 모달에서 처리하며, 그 모달의 확정 버튼만 `Button variant="danger"`(솔리드 빨강)를 쓴다.
- 영향 범위(예: 수강 인원 있는 반)가 있으면 확인 모달에 경고 배너를 함께 노출한다.

---

### 4-8. 알림 배너

인라인 알림에는 카드가 아닌 colored banner를 사용합니다.

```tsx
// 경고 배너 (주황)
'bg-[#FFF1EC] border border-[#FF6C37]/20 rounded-lg px-5 py-4 flex items-start gap-3'
// 아이콘: text-[#FF6C37], 제목: text-sm font-semibold text-[#FF6C37]

// 성공 배너 (청록)
'bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-lg px-5 py-4'
// 제목: text-sm font-semibold text-[#0F7B6C]
```

---

## 5. 레이아웃

### 전체 구조

```
┌────────────────────────────────────────┐
│  Sidebar (240px, fixed)  │  Main       │
│                          │  ml-60      │
│  logo (h-14)             │  max-w-960  │
│  ──────────────────────  │  px-10 py-10│
│  nav items               │             │
│  (flex-1, overflow-y)    │  [content]  │
│  ──────────────────────  │             │
│  user info + logout      │             │
└────────────────────────────────────────┘
```

### Sidebar

```tsx
// 컨테이너
'fixed left-0 top-0 h-screen w-60 bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col z-10'

// 로고 영역
'flex items-center h-14 px-5 border-b border-[#E9E9E7]'

// 네비게이션
'flex-1 px-3 py-4 overflow-y-auto'
'space-y-0.5'  // 아이템 간격

// 활성 nav 아이템
'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm bg-[#FFF1EC] text-[#FF6C37] font-medium'
// 아이콘: text-[#FF6C37]

// 기본 nav 아이템
'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#37352F] hover:bg-[#EFEFEE]'
// 아이콘: text-[#787774]

// 유저 정보 영역
'px-4 py-4 border-t border-[#E9E9E7]'

// 로그아웃 버튼
'w-full px-3 py-2 text-sm text-[#787774] bg-[#F1F1EF] hover:bg-[#EFEFEE] hover:text-[#37352F] rounded-md transition-colors'
```

### 메인 콘텐츠

```tsx
// main 태그
'flex-1 ml-60 min-h-screen'

// 콘텐츠 래퍼
'max-w-[960px] mx-auto px-10 py-10'
```

### 페이지 헤더 패턴

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-[#37352F]">페이지 제목</h1>
  <p className="text-sm text-[#787774] mt-1">설명 텍스트</p>
</div>
```

### 그리드 레이아웃

```tsx
// 3열 통계 카드
'grid grid-cols-1 gap-6 mb-6 sm:grid-cols-3'

// 2열 정보
'grid grid-cols-2 gap-4'
```

---

## 6. 로그인 페이지

로그인 페이지만 사이드바 없는 전체화면 레이아웃입니다.

```tsx
// 배경
'min-h-screen bg-[#F7F7F5] flex items-center justify-center px-4'

// 카드 래퍼
'w-full max-w-sm'

// 로고 영역
'text-center mb-8'

// 카드
'bg-white border border-[#E9E9E7] rounded-xl p-8'

// 카드 제목
'text-base font-semibold text-[#37352F] mb-6'

// 폼 간격
'space-y-4'
```

---

## 7. 스크롤바

```css
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #E9E9E7; border-radius: 3px; }
```

---

## 8. 아이콘

별도 아이콘 라이브러리 없이 **Heroicons 스타일의 인라인 SVG**를 사용합니다.

```tsx
// 공통 패턴
<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="..." />
</svg>
```

- 네비게이션 아이콘: 16×16
- 알림 아이콘: 18×18
- 모달 닫기: 20×20
- stroke 기반, fill 없음

---

## 9. 트랜지션

```tsx
'transition-colors'  // 색상 전환만 (hover 상태)
```

모든 인터랙티브 요소에 `transition-colors`를 적용해 hover 전환을 부드럽게 처리합니다.

---

## 10. 빠른 재현 체크리스트

다른 프로젝트에 이 디자인을 재현할 때 확인할 사항입니다.

- [ ] Pretendard 폰트 로드 (woff2, 4가지 웨이트)
- [ ] `globals.css`에 CSS 변수 및 badge 클래스 추가
- [ ] Tailwind 설정에서 커스텀 색상 불필요 — 모두 인라인 hex 또는 CSS 변수 사용
- [ ] `box-sizing: border-box` 전역 설정
- [ ] `-webkit-font-smoothing: antialiased` 설정
- [ ] 스크롤바 스타일 적용
- [ ] 사이드바 240px 고정, 메인 `ml-60`
- [ ] 콘텐츠 최대 너비 960px, 패딩 `px-10 py-10`
