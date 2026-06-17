# 매출 현황(재무 현황) 대시보드 — 설계

작성일: 2026-06-17
대상: 가맹 캠퍼스(판교) 운영자 — 본사 정산 현황 확인용 목업

## 배경 / 목적

대표님이 필요로 하는 항목만 담은 목업 이미지를 기반으로, 가맹 캠퍼스가 본사에
납부하는 **정산(로열티 + 콘텐츠 사용료)** 현황을 한 화면에서 보여주는 대시보드를
추가한다. 전 항목 mock-data 기반(실 서버/DB 연동 없음).

## 범위

- 신규 페이지 1개 (`/revenue`)
- 정산 계산 로직 모듈 1개 (`lib/revenue.ts`) + 단위 테스트
- 사이드바 메뉴 1개 추가

비범위: 데이터 편집, 월별 필터, PDF/엑셀 출력, 실제 본사 송금 연동.

## 라우트 & 내비게이션

- `app/(admin)/revenue/page.tsx`: 현재 `/payments`로 redirect만 하는 페이지를
  실제 대시보드 페이지로 교체한다.
- `components/layout/Sidebar.tsx`: `adminNav`에서 **'수납 관리'(`/payments`) 바로
  아래**에 `{ href: '/revenue', label: '매출 현황' }` 추가. 아이콘은 매출/차트 계열.
- 헤더: 제목 `재무 현황`, 부제 `판교 캠퍼스 · 본사 정산 현황`.
- mockup 우측 상단의 **'데모 초기화' 버튼은 만들지 않는다.**

## 계산 로직 — `lib/revenue.ts`

기존 `lib/payments.ts`, `lib/teacher-matching.ts`와 동일하게 **순수 함수 + 테스트**
패턴을 따른다. 페이지는 mock-data를 주입해 호출만 한다.

### 대상 데이터

- **재원 반**: `enrolled_count > 0`인 반(= 2026 여름학기 진행 반). 종강 반(2025 봄,
  enrolled 0)은 제외.
- 학생수는 `class.enrolled_count`를 사용(수납 화면과 동일 기준).

### 정의

- **교육 매출** = Σ(`tuition_fee` × `enrolled_count`) — 수강료만. 교구비/콘텐츠비 제외.
- **로열티(6%)** = `round(교육 매출 × 0.06)` — 본사 납부.
  - 로열티율 `ROYALTY_RATE = 0.06` 상수로 분리.
- **콘텐츠 사용료** = `content_fee > 0`인 반을 **과목(course)별로 묶어**
  Σ(과목별 사용 학생수 × 1인 단가). 1인 단가는 해당 과목 반의 `content_fee`.
- **본사 납부 합계** = 로열티 + 콘텐츠 사용료.

### 콘텐츠 청구 상세 행 구성

`content_fee > 0`인 재원 반을 `course`(콘텐츠명) 기준으로 그룹핑:

- 콘텐츠명 = `course`
- 사용 학생 = 그룹 내 `enrolled_count` 합
- 1인 단가 = 그룹의 `content_fee` (동일 과목은 동일 단가 가정)
- 청구액 = 사용 학생 × 1인 단가

> **제작자 칼럼은 두지 않는다.** (mock-data에 제작자 필드가 없고, 별도 예시
> 데이터를 만들지 않기로 함.)

### export 시그니처(안)

```ts
export const ROYALTY_RATE = 0.06;

export interface ContentBillRow {
  content: string;      // course
  students: number;     // Σ enrolled_count
  unitPrice: number;    // content_fee (1인 단가)
  amount: number;       // students × unitPrice
}

export interface RevenueSummary {
  eduRevenue: number;       // 교육 매출
  royalty: number;          // 로열티 (eduRevenue × ROYALTY_RATE)
  contentTotal: number;     // 콘텐츠 사용료 합계
  hqTotal: number;          // royalty + contentTotal
  contentRows: ContentBillRow[];
}

export function computeRevenue(classes: Class[]): RevenueSummary;
export function fmt(n: number): string; // "1,234,000원"
```

### 판교 mock-data 기준 산출 예상값(검증용)

- 교육 매출: **16,600,000원**
- 로열티(6%): **996,000원**
- 콘텐츠 사용료: **800,000원** (2개 콘텐츠)
  - 파이썬 기초: 47명 × 10,000원 = 470,000원
  - 아두이노: 11명 × 30,000원 = 330,000원
- 본사 납부 합계: **1,796,000원**

(숫자는 런타임 계산 결과이며 mock-data 변경 시 자동 반영. 테스트는 위 값을 고정 검증.)

## 화면 구성

기존 공용 컴포넌트(`Card`, `Table` 또는 기존 표 마크업, `Badge`) 재사용,
Notion 스타일 토큰(`#37352F`, `#787774`, `#FF6C37`, `#E9E9E7`)·`tabular-nums` 유지.

1. **KPI 카드 4개** (가로 그리드): 교육 매출 / 로열티(6%) / 콘텐츠 사용료 /
   본사 납부 합계. 각 카드에 보조 설명 한 줄(예: "교육 매출의 6% · 본사 납부").
2. **본사 정산 내역** 표 — 칼럼: 항목 / 기준 / 금액
   - 가맹 로열티 · 교육 매출 N원 × 6% · 996,000원
   - 콘텐츠 사용료 · 2개 콘텐츠 · 사용 학생 수 × 1인 단가 · 800,000원
   - (강조 행) 본사 납부 합계 · 1,796,000원
   - 금액은 빨강 계열 강조(mockup 톤). 합계 우측 상단 배지로 합계 노출.
3. **콘텐츠 사용료 청구 상세** 표 — 칼럼: 콘텐츠 / 사용 학생 / 1인 단가 / 청구액
   - `contentRows` 렌더 + 합계 행.

## 테스트 — `lib/revenue.test.ts`

기존 테스트 러너 패턴을 따른다. 검증 항목:

- `computeRevenue(classes)`가 교육 매출/로열티/콘텐츠 합계/납부 합계를 위
  "산출 예상값"과 동일하게 반환.
- `contentRows`가 과목별로 묶이고(파이썬 기초/아두이노 2건), 합계가 contentTotal과 일치.
- `content_fee === 0` 반(맞춤수업)은 콘텐츠 행에 포함되지 않음.
- 종강 반(enrolled 0)은 교육 매출/콘텐츠에 미포함.

## 구현 영향 파일

- 신규: `app/(admin)/revenue/page.tsx`(redirect 교체), `lib/revenue.ts`, `lib/revenue.test.ts`
- 수정: `components/layout/Sidebar.tsx` (메뉴 1줄 추가)
