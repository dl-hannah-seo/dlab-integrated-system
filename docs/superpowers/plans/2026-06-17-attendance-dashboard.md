# 출결 현황 대시보드 재구성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 출결 현황 페이지 상단을 "당일 원그래프 + 미등원 집중 리스트 + 주/월간 추이" 대시보드로 재구성하고, 그 아래 기존 반별 상세 조회를 유지한다.

**Architecture:** 신규 데이터 헬퍼(`getAbsenceFocusList`)와 신규 표시 컴포넌트(`AbsenceFocusList`)를 추가하고, 기존 `DonutChart`에 중앙 라벨 옵션을 더한다. 페이지 컴포넌트는 KPI 카드 4개를 원그래프로 교체하고 위젯을 재배치한다. 기존 `AttendanceTrend`·`ClassRecordModal`은 그대로 재사용한다.

**Tech Stack:** Next.js 16 (App Router, client component), React 19, TypeScript, Tailwind v4, vitest 4 (lib 헬퍼 단위 테스트).

## Global Constraints

- 출석 = `attend` 또는 `makeup`로 취급한다(기존 페이지 규칙과 동일).
- 오늘 회차 = `session_id`가 `sess-`로 시작하는 레코드. 추이/집중 리스트 집계에서 오늘(`session_date === TODAY`, `TODAY = '2026-06-14'`)은 제외한다.
- 출석률 분모는 미도착(pending) 제외 = 출석 / (출석 + 결석).
- 현재 학기 진행 반: `['cl-01','cl-02','cl-03','cl-04','cl-05','cl-06']` (`CURRENT_CLASSES`).
- 색상: 출석 `#0F7B6C`, 미도착 `#C7C6C3`, 결석 `#EB5757`, 본문 `#37352F`, 보조텍스트 `#787774`.
- 라벨 굵기 일관성: 같은 위계 라벨은 같은 굵기. 특정 라벨만 볼드 금지.

---

### Task 1: `getAbsenceFocusList` 데이터 헬퍼

최근 8회차(오늘 제외) 기준 학생별 결석 횟수를 집계하여 결석 횟수 내림차순으로 반환한다.

**Files:**
- Modify: `lib/mock-data.ts` (기존 `getClassMatrix` 정의 아래, 파일 끝부분에 추가)
- Test: `lib/attendance-focus.test.ts` (Create)

**Interfaces:**
- Consumes: 모듈 내부 `students`, `classes`, `sessionHistory`, `TODAY`, `type Attendance`, `type Student`, `type Class` (모두 `lib/mock-data.ts`에 이미 정의/존재).
- Produces:
  - `export interface AbsenceFocusEntry { student: Student; cls: Class; absentCount: number; countedSessions: number; lastAbsentDate: string | null; }`
  - `export function getAbsenceFocusList(records: Attendance[], classIds: string[], maxSessions?: number): AbsenceFocusEntry[]`

- [ ] **Step 1: Write the failing test**

Create `lib/attendance-focus.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  getAbsenceFocusList,
  attendanceHistory,
  initialAttendance,
} from './mock-data';

const CURRENT = ['cl-01', 'cl-02', 'cl-03', 'cl-04', 'cl-05', 'cl-06'];
const records = [...attendanceHistory, ...initialAttendance];

describe('getAbsenceFocusList', () => {
  it('결석 1회 이상 학생만 결석 횟수 내림차순으로 반환한다', () => {
    const list = getAbsenceFocusList(records, CURRENT, 8);
    expect(list.length).toBeGreaterThan(0);
    // 결석 1회 이상만
    expect(list.every(e => e.absentCount >= 1)).toBe(true);
    // 내림차순 정렬
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].absentCount).toBeGreaterThanOrEqual(list[i].absentCount);
    }
  });

  it('지정한 반의 학생만 포함하고 집계 회차는 maxSessions 이하다', () => {
    const list = getAbsenceFocusList(records, CURRENT, 8);
    expect(list.every(e => CURRENT.includes(e.cls.id))).toBe(true);
    expect(list.every(e => e.student.class_id === e.cls.id)).toBe(true);
    expect(list.every(e => e.countedSessions <= 8)).toBe(true);
  });

  it('lastAbsentDate는 ISO(YYYY-MM-DD) 형식이거나 null이다', () => {
    const list = getAbsenceFocusList(records, CURRENT, 8);
    expect(list.every(e =>
      e.lastAbsentDate === null || /^\d{4}-\d{2}-\d{2}$/.test(e.lastAbsentDate)
    )).toBe(true);
  });

  it('빈 classIds면 빈 배열을 반환한다', () => {
    expect(getAbsenceFocusList(records, [], 8)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/attendance-focus.test.ts`
Expected: FAIL — `getAbsenceFocusList is not a function` / not exported.

- [ ] **Step 3: Write minimal implementation**

`lib/mock-data.ts` 끝(마지막 줄, `getClassMatrix` 함수 정의 아래)에 추가:

```ts
export interface AbsenceFocusEntry {
  student: Student;
  cls: Class;
  absentCount: number;
  countedSessions: number;
  lastAbsentDate: string | null;
}

// 최근 maxSessions 회차(오늘 제외) 기준 학생별 결석 집계.
// 결석 1회 이상만, 결석 횟수 내림차순(동률 시 최근 결석일 우선).
export function getAbsenceFocusList(
  records: Attendance[],
  classIds: string[],
  maxSessions = 8,
): AbsenceFocusEntry[] {
  const recByKey: Record<string, Attendance> = {};
  records.forEach(r => { recByKey[`${r.session_id}:${r.student_id}`] = r; });

  const entries: AbsenceFocusEntry[] = [];
  classIds.forEach(classId => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    const sessions = sessionHistory
      .filter(s => s.class_id === classId && s.session_date !== TODAY)
      .sort((a, b) => a.session_date.localeCompare(b.session_date))
      .slice(-maxSessions);
    const classStudents = students.filter(s => s.class_id === classId);
    classStudents.forEach(student => {
      let absentCount = 0;
      let lastAbsentDate: string | null = null;
      sessions.forEach(session => {
        const rec = recByKey[`${session.id}:${student.id}`];
        if (rec?.status === 'absent') {
          absentCount += 1;
          if (!lastAbsentDate || session.session_date > lastAbsentDate) {
            lastAbsentDate = session.session_date;
          }
        }
      });
      if (absentCount >= 1) {
        entries.push({ student, cls, absentCount, countedSessions: sessions.length, lastAbsentDate });
      }
    });
  });

  return entries.sort((a, b) =>
    b.absentCount - a.absentCount
    || (b.lastAbsentDate ?? '').localeCompare(a.lastAbsentDate ?? ''),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/attendance-focus.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/mock-data.ts lib/attendance-focus.test.ts
git commit -m "feat: 미등원 집중 리스트 집계 헬퍼 getAbsenceFocusList"
```

---

### Task 2: `DonutChart` 중앙 라벨 옵션

도넛 가운데에 당일 출석률을 표시할 수 있도록 선택적 prop을 추가한다. 기존 사용처(`payments`, `revenue` 등)는 prop 미전달 시 동작 변화 없음.

**Files:**
- Modify: `components/ui/DonutChart.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `DonutChart`에 옵션 prop `centerValue?: string`, `centerCaption?: string` 추가. 전달 시 SVG 중앙에 `centerValue`(굵게)와 `centerCaption`(보조)을 렌더.

- [ ] **Step 1: prop 시그니처 확장**

`components/ui/DonutChart.tsx`의 함수 시그니처를 수정:

```tsx
export function DonutChart({
  slices,
  size = 140,
  showAmounts = false,
  centerValue,
  centerCaption,
}: {
  slices: DonutSlice[];
  size?: number;
  showAmounts?: boolean;
  centerValue?: string;
  centerCaption?: string;
}) {
```

- [ ] **Step 2: SVG 중앙 텍스트 렌더**

`<svg ...>` 내부, `{paths.map(...)}` 블록 바로 아래에 추가:

```tsx
        {centerValue && (
          <text
            x={cx}
            y={centerCaption ? cy - 4 : cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[#37352F] font-bold"
            style={{ fontSize: 22 }}
          >
            {centerValue}
          </text>
        )}
        {centerValue && centerCaption && (
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[#787774]"
            style={{ fontSize: 10 }}
          >
            {centerCaption}
          </text>
        )}
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (기존 사용처는 새 prop 미전달이라 영향 없음).

- [ ] **Step 4: Commit**

```bash
git add components/ui/DonutChart.tsx
git commit -m "feat: DonutChart 중앙 라벨(centerValue/centerCaption) 옵션 추가"
```

---

### Task 3: `AbsenceFocusList` 컴포넌트

집중 리스트를 카드로 렌더하고, 행 클릭 시 해당 반 id를 콜백으로 전달한다.

**Files:**
- Create: `components/attendance/AbsenceFocusList.tsx`

**Interfaces:**
- Consumes: `type AbsenceFocusEntry` (Task 1), `Card` (`components/ui/Card`).
- Produces: `export function AbsenceFocusList({ entries, onSelect }: { entries: AbsenceFocusEntry[]; onSelect: (classId: string) => void }): JSX.Element`

- [ ] **Step 1: 컴포넌트 작성**

Create `components/attendance/AbsenceFocusList.tsx`:

```tsx
'use client';

import { Card } from '@/components/ui/Card';
import { type AbsenceFocusEntry } from '@/lib/mock-data';

function mmdd(iso: string) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

export function AbsenceFocusList({
  entries,
  onSelect,
}: {
  entries: AbsenceFocusEntry[];
  onSelect: (classId: string) => void;
}) {
  return (
    <Card title="미등원 집중 리스트" className="h-full">
      <p className="text-xs text-[#787774] -mt-1 mb-2">최근 8회차 결석 누적 · 결석 많은 순</p>
      {entries.length === 0 ? (
        <p className="text-sm text-[#787774] py-8 text-center">최근 8회차 결석 학생이 없습니다.</p>
      ) : (
        <div className="divide-y divide-[#F1F0EF]">
          {entries.map(e => (
            <button
              key={e.student.id}
              onClick={() => onSelect(e.cls.id)}
              className="w-full flex items-center justify-between gap-3 px-1 py-2.5 text-left rounded hover:bg-[#FAFAF9] transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-[#37352F]">{e.student.name}</span>
                <span className="text-xs text-[#787774] truncate">{e.cls.schedule} {e.cls.course}</span>
              </span>
              <span className="flex items-center gap-3 shrink-0">
                {e.lastAbsentDate && (
                  <span className="text-xs text-[#787774]">최근 {mmdd(e.lastAbsentDate)}</span>
                )}
                <span className="text-xs font-semibold text-[#EB5757] bg-[#FDECEA] px-2 py-0.5 rounded tabular-nums">
                  결석 {e.absentCount}회
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add components/attendance/AbsenceFocusList.tsx
git commit -m "feat: 미등원 집중 리스트 컴포넌트 AbsenceFocusList"
```

---

### Task 4: 출결 페이지 재구성

KPI 카드 4개를 원그래프로 교체하고, 1행(원그래프+집중 리스트) / 2행(추이 전폭) / 3행(반별 상세)으로 재배치한다.

**Files:**
- Modify: `app/(admin)/attendance/page.tsx`

**Interfaces:**
- Consumes: `getAbsenceFocusList`, `AbsenceFocusEntry` (Task 1), `DonutChart` 중앙 라벨 (Task 2), `AbsenceFocusList` (Task 3), 기존 `AttendanceTrend`·`ClassRecordModal`·`Card`·`Select`.
- Produces: 없음 (페이지 종단).

- [ ] **Step 1: import 정리**

상단 import 블록에서 `Card`는 원그래프 래퍼로 계속 사용. 다음을 추가/조정:

```tsx
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { DonutChart } from '@/components/ui/DonutChart';
import { AttendanceTrend } from '@/components/attendance/AttendanceTrend';
import { AbsenceFocusList } from '@/components/attendance/AbsenceFocusList';
import { ClassRecordModal } from '@/components/attendance/ClassRecordModal';
```

그리고 `lib/mock-data`에서 가져오는 목록에 `getAbsenceFocusList`를 추가:

```tsx
import {
  classes,
  students,
  initialAttendance,
  attendanceHistory,
  getAbsenceFocusList,
  TODAY,
  type Attendance,
  type AttendanceStatus,
  type Class,
} from '@/lib/mock-data';
```

- [ ] **Step 2: 집중 리스트 데이터 계산 추가**

`kpi` useMemo 아래에 추가:

```tsx
  const focusEntries = useMemo(
    () => getAbsenceFocusList(records, CURRENT_CLASSES.map(c => c.id), 8),
    [records],
  );

  const donutSlices = [
    { label: '출석', amount: kpi.attend, color: '#0F7B6C' },
    { label: '미도착', amount: kpi.pending, color: '#C7C6C3' },
    { label: '결석', amount: kpi.absent, color: '#EB5757' },
  ].filter(s => s.amount > 0);

  function openClassById(classId: string) {
    const target = CURRENT_CLASSES.find(c => c.id === classId);
    if (target) setOpenClass(target);
  }
```

- [ ] **Step 3: KPI 카드 grid를 1행 대시보드로 교체**

기존 `{/* 오늘 요약 KPI */}` `<div className="grid grid-cols-4 ...">...</div>` 블록 전체를 다음으로 교체:

```tsx
      {/* 1행: 당일 원그래프 + 미등원 집중 리스트 */}
      <div className="grid grid-cols-2 gap-4 mb-6 items-stretch">
        <Card title="당일 현황" className="h-full">
          <p className="text-xs text-[#787774] -mt-1 mb-3">오늘 ({todayLabel}) · 미도착 제외 출석률</p>
          {donutSlices.length === 0 ? (
            <p className="text-sm text-[#787774] py-8 text-center">오늘 출결 기록이 없습니다.</p>
          ) : (
            <DonutChart
              slices={donutSlices}
              size={150}
              centerValue={`${kpi.rate}%`}
              centerCaption="출석률"
            />
          )}
        </Card>
        <AbsenceFocusList entries={focusEntries} onSelect={openClassById} />
      </div>
```

- [ ] **Step 4: 추이 차트는 그대로 (2행)**

`<AttendanceTrend records={records} />`는 위치 변경 없이 그대로 둔다(이미 `mb-6` 보유). 3행 반 필터/카드/모달 블록도 변경하지 않는다.

- [ ] **Step 5: 타입체크 + 린트**

Run: `npx tsc --noEmit && npm run lint`
Expected: 에러 없음.

- [ ] **Step 6: 개발 서버로 육안 확인**

Run: `npm run dev` 후 `/attendance` 접속.
Expected:
- 상단 1행: 좌측 도넛(중앙 출석률 %) + 우측 미등원 집중 리스트(결석 많은 순, 행 클릭 시 해당 반 기록부 모달).
- 2행: 주/월간 추이 막대그래프.
- 3행: 반 필터 + 반별 카드 + 클릭 시 기록부 모달.
- KPI 카드 4개는 사라짐.

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/attendance/page.tsx"
git commit -m "feat: 출결 현황 페이지 대시보드 재구성 (원그래프+집중 리스트+추이)"
```

---

## Self-Review

- **Spec coverage:**
  - 당일 원그래프 → Task 2(중앙 라벨) + Task 4 Step 3. ✅
  - 미등원 집중 리스트(결석 횟수 순, 최근 8회차, 오늘 제외, 행 클릭→반 기록부 모달) → Task 1 + Task 3 + Task 4 Step 2~3. ✅
  - 주/월간 추이(변경 없음, 전폭) → Task 4 Step 4. ✅
  - 반별 상세 조회(변경 없음, 하단) → Task 4 Step 4. ✅
  - KPI 카드 완전 대체 → Task 4 Step 3. ✅
- **Placeholder scan:** TBD/TODO 없음. 모든 코드 블록 실제 코드 포함. ✅
- **Type consistency:** `getAbsenceFocusList(records, classIds, maxSessions)`·`AbsenceFocusEntry`·`DonutChart` prop(`centerValue`/`centerCaption`)·`AbsenceFocusList`(`entries`/`onSelect`) 시그니처가 Task 간 일치. ✅
