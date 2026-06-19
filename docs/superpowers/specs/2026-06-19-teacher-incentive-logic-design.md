# 강사 인센티브 로직 설계 (Ron 산식)

작성일: 2026-06-19
대상 화면: 강사 관리 (`/teachers`) — 목록 테이블 · 생성/수정 모달 · 인사기록카드
단계: mock 데이터 데모 (실데이터 연동 전)

## 1. 배경

Ron(판교)이 확정한 인센티브 산식을 강사 관리 화면에 반영한다. 기존에는
`incentive` 숫자를 손으로 입력했고, 월급여는 역할 구분 없이 `시급 × 추정시수`로
계산했다(회당 2시간 가정). 이번에 다음을 도입한다.

- **역할·급여 체계 구분**: 연구원(월급제) / 튜터(시급제)
- **학기 기준 인센티브 자동 산출**: 정규수업 + 오픈랩 기준액의 25%, 벌점에 따라 감액
- 인사기록카드에 **산출 내역 + 규칙 설명** 표시

## 2. 확정된 산식 (Ron 설명 요약)

- 인센티브 = 진행 중 학기(보통 3개월)의 **정규수업 + 오픈랩 계산값 총액 × 25%**
- **피드백으로 인한 연장근무는 기준액에서 제외**
- **벌점 게이트**: 0~1점 → 100% 지급, 2점 → 인센티브의 **10%만** 지급, 3점 이상 → **0원**
  - 벌점 = 지각 · 무단결근 등
- **오픈랩** = 토요일 자습 감독(수업 아님) → **시급 별도**, 따로 집계
- **지급 구조**: 튜터 = 시급, 매월 8일 전월분 지급(직영점은 교육팀장 기안) /
  연구원 = 직원, 월급제

## 3. 확정된 설계 결정 (사용자 승인됨 2026-06-19)

1. `TeacherRole`의 `강사`를 **`연구원`으로 리네임**(3번째 역할 추가 아님).
2. **연구원의 정규수업 금액**도 `시급 × 정규수업시수`로 환산해 인센티브 기준액에
   사용한다(월급과는 별개의 인센티브 산정 단가).
3. **벌점 = 진행 학기 기간 내 근태의 지각 + 결근 건수**(건당 1점, *가정* — 라벨에 명시,
   추후 교체). 인사기록카드에서 **수동 보정 가능**.

## 4. 데이터 모델 변경 (`lib/mock-data.ts`)

### 4.1 역할 타입
```ts
export type TeacherRole = '연구원' | '튜터';  // (was '강사' | '튜터')
```

### 4.2 Teacher 인터페이스
```ts
export interface Teacher {
  id: string;
  campus_id: string;
  name: string;
  role: TeacherRole;
  subject_ids: string[];
  phone?: string;
  hire_date?: string;
  status: '재직' | '휴직' | '퇴직';

  hourly_wage?: number;            // 정규수업 시급. 튜터 기본급 단가 + 모든 역할의 인센티브 정규수업 산정 단가
  monthly_salary?: number;         // 연구원 월급(고정 기본급)
  openlab_wage?: number;           // 오픈랩 시급(정규와 별도)
  openlab_hours_monthly?: number;  // 월 오픈랩 시수(데모 시드)
  // incentive 필드 제거 — 자동 산출로 대체
}
```

### 4.3 teachers 시드 갱신
- 론 · 씨드 · 루스 → `role: '연구원'`, `monthly_salary` 추가, `hourly_wage` 유지(인센티브 단가),
  `openlab_wage`/`openlab_hours_monthly` 추가, `incentive` 제거.
- 리암 · 허빈 → `role: '튜터'`, `hourly_wage` 유지, `openlab_wage`/`openlab_hours_monthly` 추가,
  `incentive` 제거.
- 예시 시드값(데모):
  - 연구원: `monthly_salary` 280만~320만, `hourly_wage` 33,000~38,000(인센티브용), `openlab_wage` 20,000, `openlab_hours_monthly` 16
  - 튜터: `hourly_wage` 14,000~15,000, `openlab_wage` 12,000, `openlab_hours_monthly` 16

### 4.4 학기 상태
- `semesters`의 진행 학기(`sem-01` 여름학기 2026)에 `status: '진행 중'` 부여.
- 학기 → 월 매핑은 라이브러리 헬퍼로 처리(아래 5.1). 근태 시드가 2026-06이므로
  여름학기(6·7·8월) 기간에 포함되어 벌점 자동집계가 동작.

## 5. 계산 로직 (신규 `lib/teacher-incentive.ts`)

### 5.1 상수 · 헬퍼
```ts
export const INCENTIVE_RATE = 0.25;
export const PENALTY_POINT_PER_INCIDENT = 1; // 가정: 지각·결근 건당 1점

// 0~1점→1.0, 2점→0.1, 3점 이상→0
export function penaltyMultiplier(points: number): number {
  if (points >= 3) return 0;
  if (points === 2) return 0.1;
  return 1;
}

// 진행 중 학기(status==='진행 중') 우선, 없으면 마지막 학기
export function currentSemester(semesters: Semester[]): Semester | undefined;

// 시즌 → 월 배열. '봄학기'[3,4,5] '여름학기'[6,7,8] '가을학기'[9,10,11] '겨울학기'[12,1,2]
export function seasonMonths(season: string): number[];
```

### 5.2 벌점 집계
```ts
// 학기 기간(year + months) 내 지각·결근 건수 × PENALTY_POINT_PER_INCIDENT
export function semesterPenaltyPoints(
  records: TeacherAttendance[], year: number, months: number[],
): number;
```
- 날짜 파싱은 문자열 split 기반(`'YYYY-MM-DD'.split('-')`)으로 처리(로케일·타임존 영향 회피).
- `연차 · 병가`는 벌점 제외, `지각 · 결근`만 합산.

### 5.3 인센티브 산출
```ts
export interface IncentiveBreakdown {
  semester: Semester;
  monthsCount: number;       // 학기 개월수 (= months.length, 보통 3)
  regularMonthly: number;    // 정규수업 월금액 = hourly_wage × monthlyTeachingHours
  openlabMonthly: number;    // 오픈랩 월금액   = openlab_wage × openlab_hours_monthly
  baseAmount: number;        // (regularMonthly + openlabMonthly) × monthsCount
  rate: number;              // INCENTIVE_RATE (0.25)
  penaltyPoints: number;     // 자동집계 또는 수동보정값
  penaltyMult: number;       // penaltyMultiplier(points)
  incentive: number;         // round(baseAmount × rate × penaltyMult)
}

// overridePoints 가 주어지면 자동집계 대신 사용(수동 보정)
export function computeIncentive(
  teacher: Teacher, classes: Class[], attendance: TeacherAttendance[],
  semesters: Semester[], overridePoints?: number,
): IncentiveBreakdown | null;   // 진행 학기 없으면 null
```
- `monthlyTeachingHours`는 기존 `lib/teacher-hr.ts` 재사용.
- 피드백 연장근무는 기준액 계산에 애초에 포함하지 않음(설계상 별도 항목 없음).

## 6. 급여 모델 변경 (`lib/teacher-hr.ts`)

기존 `monthlySalary`(시급×시수 + 수동 incentive 합산)는 인센티브가 월 단위라는
가정에 묶여 있어 학기 인센티브와 맞지 않는다. 월 단위 기본급만 다루도록 교체한다.

```ts
export interface MonthlyPay {
  role: TeacherRole;
  regularMonthly: number;   // 시급 × 정규수업시수
  openlabMonthly: number;   // 오픈랩 시급 × 오픈랩시수
  base: number;             // 연구원: monthly_salary / 튜터: regular + openlab
}
export function monthlyPay(teacher: Teacher, classes: Class[]): MonthlyPay;
```
- `monthlySalary` / `SalaryBreakdown` 제거(인센티브 분리). `SESSION_HOURS`,
  `WEEKS_PER_MONTH`, `weeklySessions`, `monthlyTeachingHours`는 유지.
- 호출처(teachers/page, TeacherRecordCard, 테스트) 모두 `monthlyPay`로 교체.

## 7. UI 표현

### 7.1 강사 목록 테이블 (`app/(admin)/teachers/page.tsx`)
- `ROLES`/`ROLE_FILTERS`: `강사` → `연구원`.
- 역할 배지 텍스트 연구원/튜터(스타일 동일).
- 컬럼: "예상 월급여" → **"월 기본급"**(역할별: 연구원 월급 / 튜터 시급×시수+오픈랩),
  옆에 **"학기 인센티브"** 컬럼 추가(자동 산출값, 진행 학기 없으면 '-').
- 생성/수정 폼:
  - 역할 select 연구원/튜터.
  - **역할 조건부 입력**:
    - 연구원: 월급(`monthly_salary`) + 정규수업 시급(인센티브 산정용, `hourly_wage`)
    - 튜터: 시급(`hourly_wage`)
    - 공통: 오픈랩 시급(`openlab_wage`) + 월 오픈랩 시수(`openlab_hours_monthly`)
  - 수동 "월 인센티브" 입력칸 **제거**.
  - 미리보기 박스: 월 기본급 + 학기 인센티브 요약(아래 7.2 동일 포맷, 벌점은 진행학기 자동집계 기준).

### 7.2 인사기록카드 (`components/teachers/TeacherRecordCard.tsx`)
- 탭에 **"급여·인센티브"** 추가(또는 인적정보 하단 섹션).
- 인적정보의 시급/월인센티브/예상월급여 행 → 역할별 표시로 교체
  (연구원: 월급·정규시급·오픈랩 / 튜터: 시급·오픈랩).
- 인센티브 산정 내역 박스:
  ```
  진행 학기: 2026 여름학기 (3개월)
  정규수업 월 ___원 + 오픈랩 월 ___원 = 월 ___원
  학기 기준액 ___원 × 25% = ___원
  벌점 N점 (배율 ×__)  →  최종 인센티브 ___원
  ```
- **벌점 수동 보정**: 자동집계값을 기본값으로 한 입력(number) — 변경 시 즉시 재계산
  (카드 로컬 state, 영속 저장 없음 — 데모).
- 규칙 안내 문구(2장 요약) + 지급 메모: "튜터: 매월 8일 전월분, 직영점은 교육팀장 기안 /
  연구원: 월급제(급여 접근권한은 랩장)".

## 8. 영향받는 파일

| 파일 | 변경 |
|------|------|
| `lib/mock-data.ts` | TeacherRole, Teacher 필드, teachers 시드, semester status |
| `lib/teacher-incentive.ts` | **신규** — 인센티브 계산 |
| `lib/teacher-hr.ts` | `monthlySalary`→`monthlyPay`로 교체 |
| `app/(admin)/teachers/page.tsx` | 역할 리네임, 폼 조건부 입력, 테이블 컬럼 |
| `components/teachers/TeacherRecordCard.tsx` | 역할별 표시, 급여·인센티브 내역, 벌점 보정 |
| `lib/teacher-hr.test.ts` | `monthlyPay` 기준으로 갱신, incentive 제거 |
| `lib/teacher-matching.test.ts` | 픽스처 role `강사`→`연구원` |
| `lib/teacher-incentive.test.ts` | **신규** — 배율·벌점·산출 단위테스트 |

> `components/layout/Sidebar.tsx`의 "강사" 메뉴, 페이지 제목 "강사 관리",
> `lib/marketplace.test.ts`의 `instructor: '강사'`(무관 문자열)는 변경하지 않음.

## 9. 테스트 (`lib/teacher-incentive.test.ts`)

- `penaltyMultiplier`: 0,1→1 / 2→0.1 / 3,4→0
- `seasonMonths`: 여름학기→[6,7,8]
- `semesterPenaltyPoints`: 6월 지각1+결근1 = 2점, 연차/병가 제외
- `computeIncentive`: 기준액 × 0.25 × 배율 = 반올림 정수, 진행학기 없으면 null,
  overridePoints 우선 적용
- `monthlyPay`(teacher-hr.test): 연구원 base=월급 / 튜터 base=정규+오픈랩

## 10. 비범위 (YAGNI)

- 실제 세션 단위 정규수업 금액 자동집계(시드/추정값 사용).
- 벌점 가중치 세분화(지각 vs 무단결근 차등) — 건당 1점 가정 유지.
- 급여 접근권한(랩장/교육팀장) RBAC, 기안·지급 워크플로우.
- 영속 저장(편집은 데모 로컬 state).
