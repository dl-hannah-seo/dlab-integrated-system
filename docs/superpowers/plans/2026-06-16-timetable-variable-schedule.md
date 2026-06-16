# 시간표 정기+보강(변동) 일정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/schedule` 시간표에 "정기 편성(템플릿)"과 "주간 실제 일정(보강·휴강·특강)" 두 모드를 추가하고, 정기 편성으로부터 주차별 세션을 생성·병합하는 순수 로직을 만든다.

**Architecture:** 기존 `ClassGroup`/`Class`(정기 편성)는 그대로 두고, 새 `Session`(날짜·유형) 타입과 순수 로직(`lib/sessions.ts`)을 추가한다. 시간표 페이지는 모드 토글(정기/주간)과 주차 선택기를 더해, 주간 모드에서는 `resolveWeekSessions`가 만든 그 주의 세션을 렌더링한다. 날짜 연산은 타임존 영향이 없도록 UTC 기준으로 처리한다.

**Tech Stack:** Next.js App Router, React 18 (`'use client'`), Tailwind CSS, Vitest, `lib/mock-data.ts` (mock)

---

## 파일 맵

| 동작 | 경로 | 역할 |
|------|------|------|
| **수정** | `lib/mock-data.ts` | `Session` 타입 + 샘플 `sessions` 배열 추가 |
| **생성** | `lib/sessions.ts` | 날짜 헬퍼 + 세션 생성/병합 순수 로직 |
| **생성** | `lib/sessions.test.ts` | 위 로직 vitest 테스트 |
| **수정** | `app/(admin)/schedule/page.tsx` | 모드 토글·주차 선택기·주간 그리드·세션 팝오버 |

**스펙 출처:** [docs/superpowers/specs/2026-06-16-timetable-variable-schedule-design.md](../specs/2026-06-16-timetable-variable-schedule-design.md)

**확정 사항(스펙):** 세션 주 단위 lazy 생성 · 보강 무상 · 세션별 인원 미구분 · 휴강 단독 허용 · 월요일 주차 기준.

---

## Task 1: `Session` 타입 + 샘플 데이터

**Files:**
- Modify: `lib/mock-data.ts` (ClassGroup/Class 정의 부근 + classes 배열 뒤)

- [ ] **Step 1: `Session` 인터페이스 추가**

`lib/mock-data.ts`에서 `Class` 인터페이스 블록(`enrolled_count: number; }` 로 끝나는 부분) **바로 아래**에 추가:

```ts
// ── 세션 (주차별 실제 수업 1회 — 정기 편성에서 파생 + 변동) ──────
export interface Session {
  id: string;
  class_id: string;              // 파생 원본 정기 반 (Class.id)
  date: string;                  // 'YYYY-MM-DD'
  start_time: string;            // 'HHMM'
  end_time?: string;             // 'HHMM' (선택)
  type: '정규' | '보강' | '휴강' | '특강';
  teacher?: string;              // 변경 시 override (없으면 Class.teacher)
  room?: string;                 // 강의실 변경 표시 (선택)
  replaces_session_id?: string;  // 보강이 대체하는 휴강 세션 (선택)
  memo?: string;                 // 사유/비고
}
```

- [ ] **Step 2: 샘플 `sessions` 배열 추가**

`classes` 배열의 닫는 `];` **바로 아래**에 추가 (2026-07 둘째 주 = 월 07-06 ~ 토 07-11 변동 예시):

```ts
// ── 변동 세션 예시 (2026-07-06 ~ 07-11 주) ──────────────────────
// 정규 세션은 generateRegularSessions가 자동 생성하므로 여기엔 예외만 둔다.
export const sessions: Session[] = [
  // 화 16:00 파이썬(cl-04) 휴강
  { id: 'ses-01', class_id: 'cl-04', date: '2026-07-07', start_time: '1600', type: '휴강', memo: '강사 출장' },
  // 토 15:00 파이썬(cl-04) 보강 — 위 휴강 대체
  { id: 'ses-02', class_id: 'cl-04', date: '2026-07-11', start_time: '1500', type: '보강', replaces_session_id: 'ses-01', memo: '7/7 휴강 보강' },
  // 토 13:00 맞춤수업(cl-03) 특강
  { id: 'ses-03', class_id: 'cl-03', date: '2026-07-11', start_time: '1300', type: '특강', memo: '여름 특강' },
];
```

- [ ] **Step 3: 타입 확인**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 오류 없음 (출력 없음)

- [ ] **Step 4: 커밋**

```bash
git add lib/mock-data.ts
git commit -m "feat: Session 타입 + 주차별 변동 세션 샘플 데이터"
```

---

## Task 2: 날짜 헬퍼 (`lib/sessions.ts`) — TDD

**Files:**
- Create: `lib/sessions.ts`
- Create: `lib/sessions.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/sessions.test.ts` 생성:

```ts
import { describe, it, expect } from 'vitest';
import { parseDays, addDays, koWeekday, mondayOf, weekDates } from './sessions';

describe('parseDays', () => {
  it('복합 요일 그룹을 분해한다', () => {
    expect(parseDays('화목')).toEqual(['화', '목']);
    expect(parseDays('토')).toEqual(['토']);
    expect(parseDays('월수금')).toEqual(['월', '수', '금']);
  });
});

describe('addDays', () => {
  it('일수를 더하고 빼며 월 경계를 넘는다', () => {
    expect(addDays('2026-07-11', 1)).toBe('2026-07-12');
    expect(addDays('2026-07-01', -1)).toBe('2026-06-30');
  });
});

describe('koWeekday', () => {
  it('ISO 날짜의 한글 요일을 반환한다', () => {
    expect(koWeekday('2026-07-06')).toBe('월'); // 2026-07-06은 월요일
    expect(koWeekday('2026-07-11')).toBe('토');
    expect(koWeekday('2026-07-12')).toBe('일');
  });
});

describe('mondayOf', () => {
  it('해당 주의 월요일을 반환한다 (월요일 시작)', () => {
    expect(mondayOf('2026-07-11')).toBe('2026-07-06'); // 토 → 그 주 월
    expect(mondayOf('2026-07-06')).toBe('2026-07-06'); // 월 → 그대로
    expect(mondayOf('2026-07-12')).toBe('2026-07-06'); // 일 → 직전 월
  });
});

describe('weekDates', () => {
  it('주 시작(월)부터 월~토 6일을 반환한다', () => {
    expect(weekDates('2026-07-06')).toEqual([
      '2026-07-06', '2026-07-07', '2026-07-08',
      '2026-07-09', '2026-07-10', '2026-07-11',
    ]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/sessions.test.ts`
Expected: FAIL — "Failed to resolve import './sessions'" (파일 없음)

- [ ] **Step 3: 헬퍼 구현**

`lib/sessions.ts` 생성:

```ts
import type { Class, ClassGroup, Session } from './mock-data';

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 'YYYY-MM-DD'를 UTC 자정 Date로 파싱 (타임존 영향 제거) */
function parse(dateISO: string): Date {
  return new Date(dateISO + 'T00:00:00Z');
}
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** day_group을 개별 요일 배열로 분해 ('화목' → ['화','목']) */
export function parseDays(dayGroup: string): string[] {
  const map: Record<string, string[]> = {
    '토': ['토'],
    '화목': ['화', '목'],
    '월수금': ['월', '수', '금'],
  };
  return map[dayGroup] ?? [...dayGroup];
}

export function addDays(dateISO: string, n: number): string {
  const d = parse(dateISO);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

export function koWeekday(dateISO: string): string {
  return KO_WEEKDAYS[parse(dateISO).getUTCDay()];
}

/** 해당 날짜가 속한 주의 월요일 (월요일 시작) */
export function mondayOf(dateISO: string): string {
  const dow = parse(dateISO).getUTCDay(); // 0=일..6=토
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(dateISO, diff);
}

/** 주 시작(월)부터 count일의 날짜 배열 (기본 6 = 월~토) */
export function weekDates(weekStartISO: string, count = 6): string[] {
  return Array.from({ length: count }, (_, i) => addDays(weekStartISO, i));
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/sessions.test.ts`
Expected: PASS (5개 describe 모두 통과)

- [ ] **Step 5: 커밋**

```bash
git add lib/sessions.ts lib/sessions.test.ts
git commit -m "feat: 시간표 날짜 헬퍼 (UTC 기준 요일·주차 계산)"
```

---

## Task 3: 세션 생성/병합 로직 — TDD

**Files:**
- Modify: `lib/sessions.ts` (헬퍼 아래에 함수 추가)
- Modify: `lib/sessions.test.ts` (테스트 추가)

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/sessions.test.ts` 상단 import에 함수 3개 추가하고, 파일 끝에 테스트 블록 추가.

import 줄을 아래로 교체:

```ts
import {
  parseDays, addDays, koWeekday, mondayOf, weekDates,
  generateRegularSessions, resolveWeekSessions, defaultWeekStart,
} from './sessions';
import type { Class, ClassGroup, Session } from './mock-data';
```

파일 끝에 추가:

```ts
const G: ClassGroup[] = [
  { id: 'g-sat', campus_id: 'c', semester_id: 's', year: 2026, season: '여름', day_group: '토', time_slot: '0900' },
  { id: 'g-tt', campus_id: 'c', semester_id: 's', year: 2026, season: '여름', day_group: '화목', time_slot: '1600' },
];
const C: Class[] = [
  {
    id: 'c-sat', campus_id: 'c', class_group_id: 'g-sat', course: '파이썬', name: 'x',
    teacher: '론', team_lead: '케이', capacity: 15, start_date: '2026-07-05', end_date: '2026-08-30',
    schedule: '토 09:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 0, material_fee: 0, content_fee: 0, enrolled_count: 10,
  },
  {
    id: 'c-tt', campus_id: 'c', class_group_id: 'g-tt', course: '맞춤', name: 'y',
    teacher: '리암', team_lead: '케이', capacity: 18, start_date: '2026-07-07', end_date: '2026-09-01',
    schedule: '화·목 16:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 0, material_fee: 0, content_fee: 0, enrolled_count: 12,
  },
];

describe('generateRegularSessions', () => {
  it('그 주에 요일·기간이 맞는 정규 세션만 만든다', () => {
    const r = generateRegularSessions(C, G, '2026-07-06'); // 월 07-06 ~ 토 07-11
    // c-sat: 토 07-11 1건 / c-tt: 화 07-07, 목 07-09 2건
    expect(r.map(s => `${s.class_id}@${s.date}`).sort()).toEqual([
      'c-sat@2026-07-11', 'c-tt@2026-07-07', 'c-tt@2026-07-09',
    ]);
    expect(r.every(s => s.type === '정규')).toBe(true);
  });

  it('반 시작일 이전 날짜는 제외한다', () => {
    // c-tt 시작 07-07 → 07-06 주의 화(07-07)는 포함, 그 전 주(06-29)의 화(06-30)는 제외
    const prev = generateRegularSessions(C, G, '2026-06-29');
    expect(prev.some(s => s.class_id === 'c-tt')).toBe(false);
  });
});

describe('resolveWeekSessions', () => {
  const overrides: Session[] = [
    { id: 'o1', class_id: 'c-tt', date: '2026-07-07', start_time: '1600', type: '휴강', memo: '출장' },
    { id: 'o2', class_id: 'c-tt', date: '2026-07-11', start_time: '1500', type: '보강', memo: '보충' },
    { id: 'o3', class_id: 'c-sat', date: '2026-07-11', start_time: '1300', type: '특강', memo: '특강' },
    { id: 'o4', class_id: 'c-tt', date: '2026-07-18', start_time: '1600', type: '휴강' }, // 다른 주
  ];

  it('휴강은 매칭되는 정규 세션의 유형을 덮어쓴다', () => {
    const r = resolveWeekSessions(C, G, overrides, '2026-07-06');
    const tue = r.find(s => s.class_id === 'c-tt' && s.date === '2026-07-07');
    expect(tue?.type).toBe('휴강');
    expect(tue?.memo).toBe('출장');
  });

  it('보강·특강은 추가된다', () => {
    const r = resolveWeekSessions(C, G, overrides, '2026-07-06');
    expect(r.some(s => s.type === '보강' && s.date === '2026-07-11')).toBe(true);
    expect(r.some(s => s.type === '특강' && s.date === '2026-07-11')).toBe(true);
  });

  it('다른 주의 예외는 포함하지 않는다', () => {
    const r = resolveWeekSessions(C, G, overrides, '2026-07-06');
    expect(r.some(s => s.id === 'o4' || s.date === '2026-07-18')).toBe(false);
  });

  it('전달된 반에 없는 class_id의 예외는 무시한다', () => {
    const r = resolveWeekSessions([C[0]], G, overrides, '2026-07-06'); // c-sat만
    expect(r.some(s => s.class_id === 'c-tt')).toBe(false);
  });
});

describe('defaultWeekStart', () => {
  it('정규 세션이 처음 생기는 주의 월요일을 반환한다', () => {
    // 가장 이른 시작 07-05 → 06-29 주는 비어있고, 07-06 주부터 세션 발생
    expect(defaultWeekStart(C, G, '2026-07-05')).toBe('2026-07-06');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/sessions.test.ts`
Expected: FAIL — `generateRegularSessions`/`resolveWeekSessions`/`defaultWeekStart` is not a function (또는 import 오류)

- [ ] **Step 3: 함수 구현**

`lib/sessions.ts` 끝(weekDates 아래)에 추가:

```ts
/** 한 주의 정규 세션 생성 (반 활성 기간·요일 일치하는 날짜만) */
export function generateRegularSessions(
  classes: Class[],
  groups: ClassGroup[],
  weekStartISO: string,
): Session[] {
  const dates = weekDates(weekStartISO);
  const out: Session[] = [];
  for (const cls of classes) {
    const group = groups.find(g => g.id === cls.class_group_id);
    if (!group) continue;
    const days = parseDays(group.day_group);
    for (const date of dates) {
      if (date < cls.start_date || date > cls.end_date) continue;
      if (!days.includes(koWeekday(date))) continue;
      out.push({
        id: `auto-${cls.id}-${date}`,
        class_id: cls.id,
        date,
        start_time: group.time_slot,
        type: '정규',
      });
    }
  }
  return out;
}

/** 정규 세션 + 해당 주 예외(휴강/보강/특강) 병합 */
export function resolveWeekSessions(
  classes: Class[],
  groups: ClassGroup[],
  overrides: Session[],
  weekStartISO: string,
): Session[] {
  const regular = generateRegularSessions(classes, groups, weekStartISO);
  const weekEnd = addDays(weekStartISO, 6);
  const classIds = new Set(classes.map(c => c.id));
  const inWeek = overrides.filter(
    o => o.date >= weekStartISO && o.date <= weekEnd && classIds.has(o.class_id),
  );

  const keyOf = (s: Session) => `${s.class_id}|${s.date}|${s.start_time}`;
  const cancels = inWeek.filter(o => o.type === '휴강');
  const additions = inWeek.filter(o => o.type !== '휴강');
  const cancelMap = new Map(cancels.map(c => [keyOf(c), c]));

  const merged = regular.map(s => {
    const c = cancelMap.get(keyOf(s));
    return c ? { ...s, type: '휴강' as const, memo: c.memo } : s;
  });

  const regularKeys = new Set(regular.map(keyOf));
  const orphanCancels = cancels.filter(c => !regularKeys.has(keyOf(c)));

  return [...merged, ...orphanCancels, ...additions];
}

/** fromISO 이후 처음으로 정규 세션이 존재하는 주의 월요일 (없으면 fromISO의 월요일) */
export function defaultWeekStart(
  classes: Class[],
  groups: ClassGroup[],
  fromISO: string,
  maxWeeks = 16,
): string {
  let wk = mondayOf(fromISO);
  for (let i = 0; i < maxWeeks; i++) {
    if (generateRegularSessions(classes, groups, wk).length > 0) return wk;
    wk = addDays(wk, 7);
  }
  return mondayOf(fromISO);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/sessions.test.ts`
Expected: PASS (전체 통과)

- [ ] **Step 5: 커밋**

```bash
git add lib/sessions.ts lib/sessions.test.ts
git commit -m "feat: 주차별 세션 생성·병합 로직 (정규/휴강/보강/특강)"
```

---

## Task 4: 페이지 — 정기/주간 모드 토글 + 주차 상태

**Files:**
- Modify: `app/(admin)/schedule/page.tsx`

- [ ] **Step 1: import 정리 — 로컬 `parseDays` 제거, lib에서 가져오기**

`app/(admin)/schedule/page.tsx` 상단 import(5번째 줄)와 로컬 `parseDays`를 교체.

기존:
```tsx
import { classes, classGroups, semesters, Class, ClassGroup } from '@/lib/mock-data';
```
교체:
```tsx
import { classes, classGroups, semesters, sessions, Class, ClassGroup, Session } from '@/lib/mock-data';
import { parseDays, koWeekday, addDays, weekDates, resolveWeekSessions, defaultWeekStart } from '@/lib/sessions';
```

그리고 파일 내 로컬 `parseDays` 함수 **정의 블록 전체를 삭제**:
```tsx
function parseDays(dayGroup: string): string[] {
  const map: Record<string, string[]> = {
    '토': ['토'],
    '화목': ['화', '목'],
    '월수금': ['월', '수', '금'],
  };
  return map[dayGroup] ?? [...dayGroup];
}
```
(이제 import한 `parseDays`를 GridView가 그대로 사용한다.)

- [ ] **Step 2: Popover 타입에 session 추가**

기존:
```tsx
type Popover = { cls: Class; group: ClassGroup; top: number; left: number };
```
교체:
```tsx
type Popover = { cls: Class; group: ClassGroup; session?: Session; top: number; left: number };
```

- [ ] **Step 3: 상태 + 파생값 추가**

`SchedulePage` 본문에서 상태 선언부를 아래로 교체:

기존:
```tsx
  const [selectedSemId, setSelectedSemId] = useState('sem-01');
  const [view, setView] = useState<'grid' | 'card'>('grid');
  const [teacherFilter, setTeacherFilter] = useState('전체');
  const [popover, setPopover] = useState<Popover | null>(null);
```
교체:
```tsx
  const [selectedSemId, setSelectedSemId] = useState('sem-01');
  const [scheduleMode, setScheduleMode] = useState<'template' | 'week'>('week');
  const [view, setView] = useState<'grid' | 'card'>('grid');
  const [teacherFilter, setTeacherFilter] = useState('전체');
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [popover, setPopover] = useState<Popover | null>(null);
```

그리고 `filteredClasses` 계산 **아래**에 추가:
```tsx
  // 주간 모드 — 활성 주차(미선택 시 첫 수업 주) + 그 주의 세션
  const earliestStart = filteredClasses.reduce(
    (min, c) => (c.start_date < min ? c.start_date : min),
    '9999-12-31',
  );
  const activeWeek = weekStart ?? defaultWeekStart(filteredClasses, semGroups, earliestStart);
  const weekSessions = resolveWeekSessions(filteredClasses, semGroups, sessions, activeWeek);
```

- [ ] **Step 4: handleBlockClick에 session 인자 추가**

기존:
```tsx
  function handleBlockClick(
    e: React.MouseEvent<HTMLDivElement>,
    cls: Class,
    group: ClassGroup,
  ) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ cls, group, top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 240) });
  }
```
교체:
```tsx
  function handleBlockClick(
    e: React.MouseEvent<HTMLDivElement>,
    cls: Class,
    group: ClassGroup,
    session?: Session,
  ) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ cls, group, session, top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 240) });
  }
```

- [ ] **Step 5: 헤더 우측에 정기/주간 모드 토글 추가**

헤더의 학기 선택 `</select>` **바로 다음**, 뷰 토글(`{/* 뷰 토글 */}`) **앞**에 추가:

```tsx
          {/* 정기/주간 모드 토글 */}
          <div className="flex bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg p-0.5">
            {([['template', '정기 편성'], ['week', '주간(실제)']] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setScheduleMode(m)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  scheduleMode === m ? 'bg-white text-[#37352F] shadow-sm' : 'text-[#787774]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
```

- [ ] **Step 6: 학기 변경 시 주차 초기화**

학기 선택 `onChange`를 교체:

기존:
```tsx
            onChange={e => setSelectedSemId(e.target.value)}
```
교체:
```tsx
            onChange={e => { setSelectedSemId(e.target.value); setWeekStart(null); }}
```

- [ ] **Step 7: 타입 확인**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 오류 없음. (이 시점엔 `weekSessions`/`activeWeek`/`scheduleMode` 등이 아직 미사용이라 경고가 날 수 있으나, tsc는 미사용 지역변수를 에러로 보지 않음 — 통과해야 함. 다음 Task에서 사용.)

- [ ] **Step 8: 커밋**

```bash
git add app/"(admin)"/schedule/page.tsx
git commit -m "feat: 시간표 정기/주간 모드 토글 + 주차 상태 (lib/sessions 연동)"
```

---

## Task 5: 페이지 — 주간 그리드 뷰 + 주차 선택기

**Files:**
- Modify: `app/(admin)/schedule/page.tsx`

- [ ] **Step 1: 세션 시각 스타일 헬퍼 추가**

`blockColor` 함수 **아래**에 추가:

```tsx
function fmtDateLabel(dateISO: string): string {
  const [, m, d] = dateISO.split('-');
  return `${koWeekday(dateISO)} ${+m}/${+d}`;
}

function sessionVisual(type: Session['type'], group: ClassGroup | undefined) {
  switch (type) {
    case '보강': return { bg: '#FF6C37', badge: '보강', cancelled: false };
    case '특강': return { bg: '#8B5CF6', badge: '특강', cancelled: false };
    case '휴강': return { bg: '#B9B9B7', badge: '휴강', cancelled: true };
    default:     return { bg: group ? blockColor(group.day_group).block : '#3B82F6', badge: null, cancelled: false };
  }
}
```

- [ ] **Step 2: 뷰 렌더링 분기 교체 (정기/주간)**

기존 "뷰 렌더링" 블록(`{view === 'grid' && (` ~ `{view === 'card' && ( ... )}` 까지)을 아래로 교체:

```tsx
      {/* 주차 선택기 — 주간 모드에서만 */}
      {scheduleMode === 'week' && (
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setWeekStart(addDays(activeWeek, -7))}
            className="px-2 py-1 text-sm border border-[#E9E9E7] rounded-md text-[#787774] hover:text-[#37352F]"
            aria-label="이전 주"
          >
            ◀
          </button>
          <span className="text-sm font-medium text-[#37352F]">
            {fmtDateLabel(activeWeek).slice(2)} ~ {fmtDateLabel(addDays(activeWeek, 5)).slice(2)}
          </span>
          <button
            onClick={() => setWeekStart(addDays(activeWeek, 7))}
            className="px-2 py-1 text-sm border border-[#E9E9E7] rounded-md text-[#787774] hover:text-[#37352F]"
            aria-label="다음 주"
          >
            ▶
          </button>
        </div>
      )}

      {/* 뷰 렌더링 */}
      {scheduleMode === 'template' && view === 'grid' && (
        <GridView
          semClasses={filteredClasses}
          semGroups={semGroups}
          onBlockClick={handleBlockClick}
        />
      )}
      {scheduleMode === 'template' && view === 'card' && (
        <CardView
          semClasses={filteredClasses}
          semGroups={semGroups}
          onBlockClick={handleBlockClick}
        />
      )}
      {scheduleMode === 'week' && (
        <WeekGridView
          sessions={weekSessions}
          classes={filteredClasses}
          groups={semGroups}
          dates={weekDates(activeWeek)}
          onBlockClick={handleBlockClick}
        />
      )}
```

참고: 뷰(그리드/카드) 토글은 정기 모드에서만 의미가 있으므로, 주간 모드에서는 그대로 둬도 무방하다(주간은 항상 그리드). 별도 비활성화는 범위 외.

- [ ] **Step 3: WeekGridView 컴포넌트 추가**

파일 하단(`GridView` 함수 **아래**)에 추가:

```tsx
// ── 주간(실제) 그리드 뷰 ────────────────────────────────────────
function WeekGridView({
  sessions,
  classes,
  groups,
  dates,
  onBlockClick,
}: {
  sessions: Session[];
  classes: Class[];
  groups: ClassGroup[];
  dates: string[];
  onBlockClick: (e: React.MouseEvent<HTMLDivElement>, cls: Class, group: ClassGroup, session: Session) => void;
}) {
  const times = TIME_AXIS;
  const gridCols = `52px repeat(${dates.length}, 1fr)`;
  const classOf = (id: string) => classes.find(c => c.id === id);
  const groupOf = (cls: Class | undefined) =>
    cls ? groups.find(g => g.id === cls.class_group_id) : undefined;

  // 셀 맵: { date: { time: Session[] } }
  const cellMap: Record<string, Record<string, Session[]>> = {};
  for (const s of sessions) {
    const time = fmtSlot(s.start_time);
    ((cellMap[s.date] ??= {})[time] ??= []).push(s);
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg px-5 py-12 text-center text-sm text-[#787774]">
        이 주에는 편성된 수업이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
      {/* 날짜 헤더 */}
      <div className="grid border-b border-[#E9E9E7]" style={{ gridTemplateColumns: gridCols }}>
        <div className="bg-[#F7F7F5] px-3 py-3" />
        {dates.map(date => {
          const isSat = koWeekday(date) === '토';
          return (
            <div
              key={date}
              className="px-2 py-3 text-center text-sm font-semibold border-l border-[#E9E9E7]"
              style={{ background: isSat ? '#FFF8F5' : '#F7F7F5', color: isSat ? '#FF6C37' : '#787774' }}
            >
              {fmtDateLabel(date)}
            </div>
          );
        })}
      </div>

      {/* 시간대 행 */}
      {times.map((time, idx) => (
        <div
          key={time}
          className="grid border-[#E9E9E7]"
          style={{
            gridTemplateColumns: gridCols,
            borderBottomWidth: idx < times.length - 1 ? 1 : 0,
            borderBottomStyle: 'solid',
            minHeight: 68,
          }}
        >
          <div className="px-3 py-3 bg-[#F7F7F5] border-r border-[#E9E9E7] flex items-center">
            <span className="text-xs font-semibold text-[#787774]">{time}</span>
          </div>

          {dates.map(date => {
            const cells = cellMap[date]?.[time] ?? [];
            const isSat = koWeekday(date) === '토';
            return (
              <div
                key={date}
                className="border-l border-[#E9E9E7] p-1.5 space-y-1"
                style={{ background: isSat && cells.length === 0 ? '#FFFBF9' : undefined }}
              >
                {cells.map(s => {
                  const cls = classOf(s.class_id);
                  const group = groupOf(cls);
                  if (!cls || !group) return null;
                  const vis = sessionVisual(s.type, group);
                  return (
                    <div
                      key={s.id}
                      onClick={e => onBlockClick(e, cls, group, s)}
                      className={`rounded-md px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity ${
                        vis.cancelled ? 'line-through' : ''
                      }`}
                      style={{ background: vis.bg, opacity: vis.cancelled ? 0.6 : 1 }}
                    >
                      <div className="flex items-center gap-1">
                        {vis.badge && (
                          <span className="text-[10px] font-bold bg-white/30 text-white rounded px-1 leading-tight">
                            {vis.badge}
                          </span>
                        )}
                        <p className="text-xs font-semibold text-white leading-tight">{cls.course}</p>
                      </div>
                      <p className="text-xs text-white/80 mt-0.5">{s.teacher ?? cls.teacher}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 타입 확인**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 오류 없음

- [ ] **Step 5: 개발 서버에서 수동 확인**

Run (서버 미실행 시): `npm run dev`
브라우저에서 `http://localhost:3000/schedule`:
- 헤더에 `정기 편성 | 주간(실제)` 토글 표시, 기본 `주간(실제)` 선택
- 주차 선택기에 `26-07-06 ~ 26-07-11` 표시, 그리드 헤더가 `월 7/6 … 토 7/11` 날짜로 표시
- 화 7/7 16:00 칸: 파이썬이 **휴강(취소선·흐림)**
- 토 7/11 15:00 칸: **보강 배지** 블록, 13:00 칸: **특강 배지** 블록
- ◀/▶ 로 주 이동, 빈 주는 "이 주에는 편성된 수업이 없습니다"
- `정기 편성` 토글 시 기존 그리드/카드(요일 패턴)로 복귀

- [ ] **Step 6: 커밋**

```bash
git add app/"(admin)"/schedule/page.tsx
git commit -m "feat: 시간표 주간 그리드 뷰 + 주차 선택기 (보강/휴강/특강 표시)"
```

---

## Task 6: 페이지 — 세션 팝오버 정보 보강

**Files:**
- Modify: `app/(admin)/schedule/page.tsx` (ClassPopover)

- [ ] **Step 1: ClassPopover에 세션 정보 표시**

`ClassPopover` 컴포넌트의 본문에서, 날짜/유형 줄을 세션 유무에 따라 분기한다.

기존 팝오버 내용 블록:
```tsx
      {/* 팝오버 내용 */}
      <div className="px-4 py-3 space-y-1.5 text-sm text-[#37352F]">
        <p>📅 {dayLabel(group.day_group)} {fmtSlot(group.time_slot)}</p>
        <p>👨‍🏫 {cls.teacher} 선생님</p>
```
교체:
```tsx
      {/* 팝오버 내용 */}
      <div className="px-4 py-3 space-y-1.5 text-sm text-[#37352F]">
        {session ? (
          <>
            <p>📅 {fmtDateLabel(session.date)} {fmtSlot(session.start_time)}</p>
            <p>🏷️ {session.type}{session.memo ? ` · ${session.memo}` : ''}</p>
            <p>👨‍🏫 {(session.teacher ?? cls.teacher)} 선생님</p>
          </>
        ) : (
          <>
            <p>📅 {dayLabel(group.day_group)} {fmtSlot(group.time_slot)}</p>
            <p>👨‍🏫 {cls.teacher} 선생님</p>
          </>
        )}
```

그리고 `ClassPopover`가 `popover.session`을 구조분해하도록, 함수 상단의 구조분해를 교체.

기존:
```tsx
  const { cls, group, top, left } = popover;
```
교체:
```tsx
  const { cls, group, session, top, left } = popover;
```

- [ ] **Step 2: 타입 확인**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 오류 없음

- [ ] **Step 3: 수동 확인**

`http://localhost:3000/schedule` 주간 모드에서:
- 보강 블록 클릭 → 팝오버에 `📅 토 7/11 15:00`, `🏷️ 보강 · 7/7 휴강 보강` 표시
- 휴강 블록 클릭 → `🏷️ 휴강 · 강사 출장`
- 정기 모드 블록 클릭 → 기존처럼 `📅 화요일 · 목요일 16:00` (세션 정보 없음)

- [ ] **Step 4: 커밋**

```bash
git add app/"(admin)"/schedule/page.tsx
git commit -m "feat: 시간표 팝오버에 세션(날짜·유형·사유) 정보 표시"
```

---

## Task 7: 전체 검증

- [ ] **Step 1: 전체 테스트**

Run: `npx vitest run`
Expected: 전체 PASS (기존 payments/consultations + 신규 sessions)

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 오류 없음

- [ ] **Step 3: 수동 시나리오 확인 (브라우저)**

`http://localhost:3000/schedule`:
- [ ] 기본 진입 시 `주간(실제)` 모드, 첫 수업 주(2026-07-06) 표시
- [ ] 휴강(취소선)·보강 배지·특강 배지 정상
- [ ] ◀/▶ 주 이동, 빈 주 안내문
- [ ] 담임 필터가 주간/정기 모두에 적용 (예: `리암` 선택 시 cl-04 관련 세션만)
- [ ] 정기 편성 모드 ↔ 주간 모드 전환, 정기 모드의 그리드/카드 토글 유지
- [ ] 팝오버: 주간=세션 정보, 정기=요일 패턴
- [ ] 외부 클릭 시 팝오버 닫힘

---

## Self-Review 메모 (작성자 확인)

- **스펙 커버리지:** Session 모델(Task1) · 주차 lazy 생성(Task3 generateRegularSessions) · 휴강/보강/특강 병합(Task3) · 주차 선택기+모드 토글(Task4,5) · 배지/취소선(Task5) · 팝오버 보강(Task6) · 담임 필터 유지(기존). 청구/출결 연동·충돌검사·알림은 스펙에서 범위 외로 명시 → 태스크 없음(의도됨).
- **타입 일관성:** `Session`(mock-data) 한 곳 정의, `resolveWeekSessions`/`WeekGridView` 모두 동일 필드(`class_id`,`date`,`start_time`,`type`,`teacher?`,`memo?`) 사용. `parseDays`는 lib로 단일화(페이지 중복 제거).
- **플레이스홀더:** 없음 — 모든 step에 실제 코드/명령/기대결과 기재.
