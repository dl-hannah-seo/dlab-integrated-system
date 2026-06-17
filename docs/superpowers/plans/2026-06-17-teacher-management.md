# 강사 관리 + 과목 기반 배정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 강사를 독립 데이터로 관리하고, 과목 자격 기반으로 반↔강사를 양방향(하드 필터)으로 배정한다.

**Architecture:** `lib/mock-data.ts`에 `Subject`/`Teacher` 타입과 시드를 추가하고 `Class`에 `subject_id`/`teacher_id`를 연결한다. 매칭 규칙은 순수 함수 `lib/teacher-matching.ts` 한 곳에 모아 양쪽 폼이 재사용한다. UI는 신규 `app/(admin)/teachers/page.tsx`(강사 CRUD + 과목 관리)와 기존 `classes/page.tsx`(과목·강사 드롭다운) 수정으로 구성한다.

**Tech Stack:** Next.js 16 (App Router, 'use client'), React 19, TypeScript, Tailwind v4, Vitest 4.

## Global Constraints

- 데이터 영속화 없음 — 모든 데이터는 `lib/mock-data.ts`의 모듈 배열 + 페이지별 `useState` 인메모리(기존 방식 유지). 새로고침 시 초기화.
- 매칭 규칙은 단일 진실: 강사가 반을 맡을 수 있다 ⟺ `class.subject_id ∈ teacher.subject_ids`. 모든 자격 판단은 `lib/teacher-matching.ts`만 사용.
- 하드 필터: 자격 없는 후보는 드롭다운/목록에서 숨김.
- UI 색상/컴포넌트는 기존 패턴 준수 — `Input`/`Select`/`Modal`/`Button`/`Card`/`DeleteButton` (`components/ui/`), primary `#FF6C37`, text `#37352F`, secondary `#787774`, border `#E9E9E7`, bg `#F7F7F5`.
- 기존 화면 비파괴: `students`/`schedule` 페이지가 `class.course`(문자열)와 `class.teacher`(문자열)를 참조하므로 두 필드는 그대로 유지하고 `subject_id`/`teacher_id`를 **추가**한다.
- 검증 명령: 순수 로직은 `npm test`, 타입은 `npx tsc --noEmit`, 린트는 `npm run lint`.

---

## File Structure

- `lib/mock-data.ts` — `Subject` 인터페이스 + `subjects` 시드, `Teacher` 인터페이스 + `teachers` 시드, `Class`에 `subject_id`/`teacher_id` 필드 추가 및 기존 시드 갱신. (수정)
- `lib/teacher-matching.ts` — 순수 매칭 헬퍼 `canTeach`/`eligibleTeachers`/`eligibleClasses`. (신규)
- `lib/teacher-matching.test.ts` — 위 헬퍼의 Vitest 테스트. (신규)
- `components/layout/Sidebar.tsx` — `adminNav`에 "강사 관리" 항목 추가. (수정)
- `app/(admin)/teachers/page.tsx` — 강사 목록 + 과목 관리 + 강사 생성/수정 모달. (신규)
- `app/(admin)/classes/page.tsx` — "과정" 자유 입력 → 과목 `Select`, "담임" 자유 입력 → 자격 강사 `Select`(하드 필터). 생성 시 `subject_id`/`teacher_id` 기록. (수정)

---

## Task 1: 과목(Subject) 마스터 타입 + 시드

**Files:**
- Modify: `lib/mock-data.ts` (반 블록 `Class` interface 위, line 62 부근에 삽입)

**Interfaces:**
- Produces: `interface Subject { id: string; name: string; order?: number }`, `export const subjects: Subject[]` (ids: `sub-python`, `sub-arduino`, `sub-custom`, `sub-scratch`)

- [ ] **Step 1: `Subject` 타입과 시드 추가**

`lib/mock-data.ts`에서 `// ── 반 ───` 주석(line 63) **바로 위**에 아래를 삽입한다:

```ts
// ── 과목 마스터 ───────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  order?: number;
}

export const subjects: Subject[] = [
  { id: 'sub-python',  name: '파이썬',   order: 1 },
  { id: 'sub-arduino', name: '아두이노', order: 2 },
  { id: 'sub-custom',  name: '맞춤수업', order: 3 },
  { id: 'sub-scratch', name: '스크래치', order: 4 },
];
```

- [ ] **Step 2: 타입 체크로 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없이 통과 (PASS)

- [ ] **Step 3: Commit**

```bash
git add lib/mock-data.ts
git commit -m "feat: 과목(Subject) 마스터 타입 + 시드 추가"
```

---

## Task 2: Class에 subject_id/teacher_id 추가 + 기존 시드 매핑

**Files:**
- Modify: `lib/mock-data.ts` (`Class` interface line 64-85, `classes` 시드 line 101-176)

**Interfaces:**
- Consumes: `Subject` (Task 1)
- Produces: `Class.subject_id: string`, `Class.teacher_id?: string` 필드. 기존 `course`/`teacher` 문자열은 유지.

- [ ] **Step 1: `Class` 인터페이스에 필드 추가**

`lib/mock-data.ts`의 `Class` interface에서 `course: string;`(line 68) 바로 아래에 추가:

```ts
  subject_id: string;            // 과목 마스터 참조 (매칭 기준). course는 표시용 문자열로 유지.
```

그리고 `teacher: string;`(line 70) 바로 아래에 추가:

```ts
  teacher_id?: string;           // 강사 마스터 참조. teacher는 표시용 이름으로 유지.
```

- [ ] **Step 2: 기존 `classes` 시드에 subject_id/teacher_id 매핑**

각 반 객체에 아래 규칙으로 `subject_id`와 `teacher_id`를 추가한다 (course 문자열 기준 매핑, teacher 이름 기준 매핑). 각 반의 `course:` 줄 끝에 `subject_id`를, `teacher:` 값 옆에 `teacher_id`를 넣는다.

course → subject_id 매핑:
- `'파이썬 기초'` → `'sub-python'`
- `'맞춤수업'` → `'sub-custom'`
- `'아두이노'` → `'sub-arduino'`

teacher → teacher_id 매핑 (Task 3에서 시드할 강사 id와 일치):
- `'론'` → `'tch-ron'`
- `'씨드'` → `'tch-seed'`
- `'루스'` → `'tch-ruth'`
- `'리암'` → `'tch-liam'`
- `'허빈'` → `'tch-hobin'`

예: `cl-01`은 아래처럼 된다 (추가된 두 필드에 주목):

```ts
  {
    id: 'cl-01', campus_id: 'campus-001', class_group_id: 'cg-01',
    course: '파이썬 기초', subject_id: 'sub-python', name: '2026여름학기토0900/파이썬기초/론',
    teacher: '론', teacher_id: 'tch-ron', team_lead: '케이', capacity: 15,
    start_date: '2026-06-07', end_date: '2026-08-30', weeks: 8,
    schedule: '토 09:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 180000, material_fee: 20000, content_fee: 10000, enrolled_count: 14, room: '1강의실',
  },
```

전체 매핑표 (id → subject_id / teacher_id):
- `cl-01`: sub-python / tch-ron
- `cl-02`: sub-python / tch-seed
- `cl-03`: sub-custom / tch-ruth
- `cl-04`: sub-python / tch-liam
- `cl-05`: sub-custom / tch-hobin
- `cl-06`: sub-arduino / tch-seed
- `cl-09`: sub-arduino / tch-hobin
- `cl-07`: sub-python / tch-seed
- `cl-08`: sub-custom / tch-ruth

- [ ] **Step 3: 타입 체크 — 모든 Class 객체가 subject_id를 갖는지 확인**

Run: `npx tsc --noEmit`
Expected: PASS (subject_id가 required이므로 누락 시 에러로 잡힘)

- [ ] **Step 4: Commit**

```bash
git add lib/mock-data.ts
git commit -m "feat: Class에 subject_id/teacher_id 연결 + 시드 매핑"
```

---

## Task 3: 강사(Teacher) 타입 + 시드

**Files:**
- Modify: `lib/mock-data.ts` (Task 1에서 추가한 과목 블록 아래에 삽입)

**Interfaces:**
- Consumes: `Subject` (Task 1)
- Produces: `interface Teacher { id: string; campus_id: string; name: string; subject_ids: string[]; phone?: string; status: '재직' | '휴직' | '퇴직' }`, `export const teachers: Teacher[]`

- [ ] **Step 1: `Teacher` 타입과 시드 추가**

`lib/mock-data.ts`의 `subjects` 배열 정의 바로 아래에 삽입한다. `subject_ids`는 각 강사가 현재 실제로 담당 중인 반의 과목에서 도출했다.

```ts
// ── 강사 ──────────────────────────────────────────────────────
export interface Teacher {
  id: string;
  campus_id: string;
  name: string;
  subject_ids: string[];         // 가르칠 수 있는 과목 = "강사 수준"
  phone?: string;
  status: '재직' | '휴직' | '퇴직';
}

export const teachers: Teacher[] = [
  { id: 'tch-ron',   campus_id: 'campus-001', name: '론',   subject_ids: ['sub-python'],                status: '재직' },
  { id: 'tch-seed',  campus_id: 'campus-001', name: '씨드', subject_ids: ['sub-python', 'sub-arduino'], status: '재직' },
  { id: 'tch-ruth',  campus_id: 'campus-001', name: '루스', subject_ids: ['sub-custom'],                status: '재직' },
  { id: 'tch-liam',  campus_id: 'campus-001', name: '리암', subject_ids: ['sub-python'],                status: '재직' },
  { id: 'tch-hobin', campus_id: 'campus-001', name: '허빈', subject_ids: ['sub-custom', 'sub-arduino'], status: '재직' },
];
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/mock-data.ts
git commit -m "feat: 강사(Teacher) 타입 + 시드 추가"
```

---

## Task 4: 매칭 순수 함수 + 테스트 (TDD)

**Files:**
- Create: `lib/teacher-matching.ts`
- Test: `lib/teacher-matching.test.ts`

**Interfaces:**
- Consumes: `Class`, `Teacher` (Tasks 2, 3)
- Produces:
  - `canTeach(teacher: Teacher, cls: Class): boolean`
  - `eligibleTeachers(subjectId: string, teachers: Teacher[]): Teacher[]` — `status === '재직'` 이고 과목 보유한 강사만
  - `eligibleClasses(subjectIds: string[], classes: Class[]): Class[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/teacher-matching.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { canTeach, eligibleTeachers, eligibleClasses } from './teacher-matching';
import type { Class, Teacher } from './mock-data';

const teacher = (over: Partial<Teacher>): Teacher => ({
  id: 't1', campus_id: 'c', name: '홍', subject_ids: ['sub-python'], status: '재직', ...over,
});
const klass = (over: Partial<Class>): Class => ({
  id: 'k1', campus_id: 'c', class_group_id: 'g', course: '파이썬 기초', subject_id: 'sub-python',
  name: 'n', teacher: '홍', team_lead: 'x', capacity: 10, start_date: '', end_date: '',
  schedule: '', payment_method: '매월', payment_due_day: 1, tuition_fee: 0, material_fee: 0,
  content_fee: 0, enrolled_count: 0, ...over,
});

describe('canTeach', () => {
  it('과목이 강사 보유 과목에 있으면 true', () => {
    expect(canTeach(teacher({ subject_ids: ['sub-python'] }), klass({ subject_id: 'sub-python' }))).toBe(true);
  });
  it('과목이 없으면 false', () => {
    expect(canTeach(teacher({ subject_ids: ['sub-arduino'] }), klass({ subject_id: 'sub-python' }))).toBe(false);
  });
});

describe('eligibleTeachers', () => {
  const list = [
    teacher({ id: 'a', subject_ids: ['sub-python'] }),
    teacher({ id: 'b', subject_ids: ['sub-arduino'] }),
    teacher({ id: 'c', subject_ids: ['sub-python'], status: '퇴직' }),
  ];
  it('과목 보유한 재직 강사만 반환', () => {
    expect(eligibleTeachers('sub-python', list).map(t => t.id)).toEqual(['a']);
  });
  it('subjectId가 빈 문자열이면 빈 배열', () => {
    expect(eligibleTeachers('', list)).toEqual([]);
  });
});

describe('eligibleClasses', () => {
  const list = [
    klass({ id: 'k1', subject_id: 'sub-python' }),
    klass({ id: 'k2', subject_id: 'sub-arduino' }),
  ];
  it('선택 과목들에 속한 반만 반환', () => {
    expect(eligibleClasses(['sub-arduino'], list).map(c => c.id)).toEqual(['k2']);
  });
  it('과목이 비어 있으면 빈 배열', () => {
    expect(eligibleClasses([], list)).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `npm test`
Expected: FAIL — `lib/teacher-matching.ts` 모듈 없음(Cannot find module)

- [ ] **Step 3: 최소 구현 작성**

`lib/teacher-matching.ts`:

```ts
import type { Class, Teacher } from './mock-data';

/** 강사가 해당 반을 맡을 자격이 있는가: class.subject_id ∈ teacher.subject_ids */
export function canTeach(teacher: Teacher, cls: Class): boolean {
  return teacher.subject_ids.includes(cls.subject_id);
}

/** 주어진 과목을 가르칠 수 있는 재직 강사 목록 (반 생성 드롭다운용) */
export function eligibleTeachers(subjectId: string, teachers: Teacher[]): Teacher[] {
  if (!subjectId) return [];
  return teachers.filter(t => t.status === '재직' && t.subject_ids.includes(subjectId));
}

/** 강사가 고른 과목들에 속한 반 목록 (강사 생성 '맡을 반' 목록용) */
export function eligibleClasses(subjectIds: string[], classes: Class[]): Class[] {
  if (subjectIds.length === 0) return [];
  return classes.filter(c => subjectIds.includes(c.subject_id));
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `npm test`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/teacher-matching.ts lib/teacher-matching.test.ts
git commit -m "feat: 반↔강사 매칭 순수 함수 + 테스트"
```

---

## Task 5: 사이드바에 "강사 관리" 메뉴 추가

**Files:**
- Modify: `components/layout/Sidebar.tsx` (`adminNav`, line 33-34 사이)

**Interfaces:**
- Produces: `/teachers` 라우트로 가는 nav 항목

- [ ] **Step 1: nav 항목 삽입**

`components/layout/Sidebar.tsx`의 `adminNav`에서 `/classes` 항목 객체(line 29-33)와 `/students` 항목 사이에 아래를 삽입한다:

```tsx
  {
    href: '/teachers',
    label: '강사 관리',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
  },
```

- [ ] **Step 2: 타입/린트 확인**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: 사이드바에 강사 관리 메뉴 추가"
```

---

## Task 6: 강사 관리 페이지 (목록 + 과목 관리 + 생성/수정)

**Files:**
- Create: `app/(admin)/teachers/page.tsx`

**Interfaces:**
- Consumes: `teachers`, `subjects`, `classes`, `Teacher`, `Subject`, `Class` (`@/lib/mock-data`); `eligibleClasses` (`@/lib/teacher-matching`); `Input`/`Select`/`Modal`/`Button`/`Card`/`DeleteButton` (`@/components/ui/*`)

이 페이지는 `app/(admin)/students/page.tsx`의 모달·체크박스 목록 패턴을 따른다. 강사 배정은 페이지 내 `localClasses` 상태에만 반영된다(인메모리, 페이지 이동 시 시드로 초기화 — 기존 앱 동작과 동일).

- [ ] **Step 1: 페이지 스캐폴드 + 강사 목록 + 과목 관리 영역 작성**

`app/(admin)/teachers/page.tsx` 전체를 작성한다:

```tsx
'use client';

import { useState } from 'react';
import { teachers as seedTeachers, subjects as seedSubjects, classes as seedClasses, Teacher, Subject, Class } from '@/lib/mock-data';
import { eligibleClasses } from '@/lib/teacher-matching';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { DeleteButton } from '@/components/ui/DeleteButton';

const STATUSES: Teacher['status'][] = ['재직', '휴직', '퇴직'];

export default function TeachersPage() {
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>(seedTeachers);
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(seedSubjects);
  const [localClasses, setLocalClasses]   = useState<Class[]>(seedClasses);

  const subjectName = (id: string) => localSubjects.find(s => s.id === id)?.name ?? id;
  const assignedCount = (teacherId: string) => localClasses.filter(c => c.teacher_id === teacherId).length;

  // 과목 관리
  const [newSubject, setNewSubject] = useState('');
  function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    setLocalSubjects(p => [...p, { id: `sub-${Date.now()}`, name, order: p.length + 1 }]);
    setNewSubject('');
  }
  function removeSubject(id: string) {
    const usedByClass = localClasses.some(c => c.subject_id === id);
    const usedByTeacher = localTeachers.some(t => t.subject_ids.includes(id));
    if (usedByClass || usedByTeacher) {
      alert('이 과목을 사용하는 반 또는 강사가 있어 삭제할 수 없습니다.');
      return;
    }
    setLocalSubjects(p => p.filter(s => s.id !== id));
  }

  // 강사 생성/수정 모달
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [fName, setFName]       = useState('');
  const [fPhone, setFPhone]     = useState('');
  const [fStatus, setFStatus]   = useState<Teacher['status']>('재직');
  const [fSubjectIds, setFSubjectIds] = useState<string[]>([]);
  const [fClassIds, setFClassIds]     = useState<Set<string>>(new Set());

  function openCreate() {
    setEditId(null);
    setFName(''); setFPhone(''); setFStatus('재직');
    setFSubjectIds([]); setFClassIds(new Set());
    setShowForm(true);
  }
  function openEdit(t: Teacher) {
    setEditId(t.id);
    setFName(t.name); setFPhone(t.phone ?? ''); setFStatus(t.status);
    setFSubjectIds([...t.subject_ids]);
    setFClassIds(new Set(localClasses.filter(c => c.teacher_id === t.id).map(c => c.id)));
    setShowForm(true);
  }
  function toggleFSubject(id: string) {
    setFSubjectIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    // 과목에서 빠지면 그 과목 반 선택도 해제
    setFClassIds(prev => {
      const next = new Set(prev);
      const nextSubjects = fSubjectIds.includes(id) ? fSubjectIds.filter(x => x !== id) : [...fSubjectIds, id];
      localClasses.forEach(c => { if (!nextSubjects.includes(c.subject_id)) next.delete(c.id); });
      return next;
    });
  }
  function toggleFClass(id: string) {
    setFClassIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function save() {
    if (!fName.trim() || fSubjectIds.length === 0) return;
    const id = editId ?? `tch-new-${Date.now()}`;
    const teacher: Teacher = { id, campus_id: 'campus-001', name: fName.trim(), subject_ids: [...fSubjectIds], phone: fPhone.trim() || undefined, status: fStatus };
    setLocalTeachers(p => editId ? p.map(t => t.id === id ? teacher : t) : [...p, teacher]);
    // 담임 배정 반영: 이 강사로 선택된 반은 담임=이 강사, 이전에 이 강사였다가 해제된 반은 담임 비움
    setLocalClasses(p => p.map(c => {
      if (fClassIds.has(c.id)) return { ...c, teacher_id: id, teacher: teacher.name };
      if (c.teacher_id === id) return { ...c, teacher_id: undefined, teacher: '' };
      return c;
    }));
    setShowForm(false);
  }
  function removeTeacher(id: string) {
    setLocalTeachers(p => p.filter(t => t.id !== id));
    setLocalClasses(p => p.map(c => c.teacher_id === id ? { ...c, teacher_id: undefined, teacher: '' } : c));
  }

  const formClasses = eligibleClasses(fSubjectIds, localClasses);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">강사 관리</h1>
        <Button onClick={openCreate}>＋ 강사 추가</Button>
      </div>

      {/* 과목 관리 */}
      <Card className="mb-6 p-5">
        <p className="text-sm font-semibold text-[#37352F] mb-3">과목 관리</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {localSubjects.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md text-sm text-[#37352F]">
              {s.name}
              <button type="button" onClick={() => removeSubject(s.id)} className="text-[#BEBDBA] hover:text-[#EB5757]">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="새 과목명 (예: 스크래치)" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="max-w-xs" />
          <Button variant="secondary" onClick={addSubject}>추가</Button>
        </div>
      </Card>

      {/* 강사 목록 */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F7F5] text-[#787774]">
            <tr>
              <th className="text-left font-medium px-4 py-3">이름</th>
              <th className="text-left font-medium px-4 py-3">가르칠 수 있는 과목</th>
              <th className="text-left font-medium px-4 py-3">담임 반</th>
              <th className="text-left font-medium px-4 py-3">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {localTeachers.map(t => (
              <tr key={t.id} className="border-t border-[#E9E9E7]">
                <td className="px-4 py-3 text-[#37352F] font-medium">{t.name}</td>
                <td className="px-4 py-3 text-[#37352F]">{t.subject_ids.map(subjectName).join(', ')}</td>
                <td className="px-4 py-3 text-[#787774]">{assignedCount(t.id)}개</td>
                <td className="px-4 py-3 text-[#787774]">{t.status}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" onClick={() => openEdit(t)} className="text-sm text-[#37352F] hover:underline mr-3">수정</button>
                  <DeleteButton onClick={() => removeTeacher(t.id)}>삭제</DeleteButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 생성/수정 모달 — Step 2에서 추가 */}
    </div>
  );
}
```

- [ ] **Step 2: 생성/수정 모달 추가**

위 컴포넌트의 `{/* 생성/수정 모달 — Step 2에서 추가 */}` 자리에 아래를 넣는다:

```tsx
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? '강사 수정' : '강사 추가'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>취소</Button>
            <Button onClick={save} disabled={!fName.trim() || fSubjectIds.length === 0}>저장</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={<>이름 <span className="text-[#EB5757]">*</span></>} value={fName} onChange={e => setFName(e.target.value)} placeholder="예: 메튜" />
            <Input label="연락처" value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="010-0000-0000" />
          </div>

          <Select
            label="상태"
            value={fStatus}
            onChange={e => setFStatus(e.target.value as Teacher['status'])}
            options={STATUSES.map(s => ({ value: s, label: s }))}
          />

          {/* 가르칠 수 있는 과목 */}
          <div>
            <label className="block text-sm font-medium text-[#37352F] mb-1.5">
              가르칠 수 있는 과목 <span className="text-[#EB5757]">*</span> <span className="text-xs font-normal text-[#787774]">(복수 선택)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {localSubjects.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleFSubject(s.id)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-all ${
                    fSubjectIds.includes(s.id)
                      ? 'bg-[#FF6C37] text-white border-[#FF6C37]'
                      : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7] hover:border-[#FF6C37]/50'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* 맡을 반 — 선택 과목에 해당하는 반만 (하드 필터) */}
          <div>
            <label className="block text-sm font-medium text-[#37352F] mb-1.5">맡을 반 <span className="text-xs font-normal text-[#787774]">(담임)</span></label>
            {fSubjectIds.length === 0 ? (
              <p className="text-sm text-[#787774] bg-[#F7F7F5] border border-[#E9E9E7] rounded-md px-3 py-3">과목을 먼저 선택하세요.</p>
            ) : formClasses.length === 0 ? (
              <p className="text-sm text-[#787774] bg-[#F7F7F5] border border-[#E9E9E7] rounded-md px-3 py-3">선택한 과목의 반이 없습니다.</p>
            ) : (
              <div className="border border-[#E9E9E7] rounded-md divide-y max-h-48 overflow-y-auto">
                {formClasses.map(c => {
                  const other = c.teacher_id && c.teacher_id !== editId ? c.teacher : '';
                  return (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F7F7F5]">
                      <input type="checkbox" checked={fClassIds.has(c.id)} onChange={() => toggleFClass(c.id)} className="w-4 h-4 accent-[#FF6C37]" />
                      <span className="text-sm text-[#37352F]">{c.name}</span>
                      {other && fClassIds.has(c.id) && (
                        <span className="text-xs text-[#FF6C37] ml-auto">현재 담임 {other} → 교체</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
```

- [ ] **Step 3: 타입/린트 확인**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS

- [ ] **Step 4: 수동 검증 — dev 서버에서 동작 확인**

Run: `npm run dev` 후 브라우저에서 `/teachers` 접속.
Expected:
- 강사 5명 목록 표시, 각 과목/담임 반 개수 노출
- "강사 추가" → 과목 미선택 시 "맡을 반"에 "과목을 먼저 선택하세요" 안내, 저장 버튼 비활성
- 과목 선택 시 해당 과목 반만 체크박스로 노출(하드 필터). 다른 강사 담임 반 체크 시 "→ 교체" 표기
- 저장 후 목록에 반영
확인 후 dev 서버 종료(Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add app/(admin)/teachers/page.tsx
git commit -m "feat: 강사 관리 페이지(목록·과목 관리·생성/수정)"
```

---

## Task 7: 반 생성 폼 — 과목 Select + 자격 강사 Select (하드 필터)

**Files:**
- Modify: `app/(admin)/classes/page.tsx`

**Interfaces:**
- Consumes: `subjects`, `teachers`, `Subject` (`@/lib/mock-data`); `eligibleTeachers` (`@/lib/teacher-matching`)

기존 "과정" 자유 입력을 과목 `Select`로, "담임" 자유 입력을 자격 강사 `Select`로 바꾼다. `course`/`teacher` 문자열은 선택값의 name으로 채워 기존 화면 호환을 유지하고, `subject_id`/`teacher_id`도 함께 기록한다.

- [ ] **Step 1: import 및 과목/강사 상태 추가**

`app/(admin)/classes/page.tsx` line 4의 import에 `subjects`, `teachers`, `Subject`를 추가한다:

```ts
import { classes, classGroups, semesters as mockSemesters, students, enrollments, subjects, teachers, Class, Semester, Enrollment, Subject } from '@/lib/mock-data';
```

line 8 아래에 매칭 헬퍼 import 추가:

```ts
import { eligibleTeachers } from '@/lib/teacher-matching';
```

생성 폼 상태(line 45-46)에서 `createCourse`를 과목 id 기반으로 바꾼다. line 45-46을 아래로 교체:

```ts
  const [createSubjectId, setCreateSubjectId] = useState('');
  const [createTeacherId, setCreateTeacherId] = useState('');
```

(기존 `createTeacher` 상태 라인 46은 제거. `createCourse`를 참조하던 곳은 아래 단계에서 정리.)

- [ ] **Step 2: 파생값 + autoName 계산을 과목/강사 이름 기반으로 수정**

`handleCreateClass`(line 185)와 autoName 계산에서 쓰는 course/teacher를 파생한다. 컴포넌트 본문에서 `autoName`을 계산하는 부분 근처에 아래 파생값을 추가한다(렌더 이전, 예: `handleCreateClass` 정의 직전):

```ts
  const createSubjectName = subjects.find(s => s.id === createSubjectId)?.name ?? '';
  const createTeacherName = teachers.find(t => t.id === createTeacherId)?.name ?? '';
  const createEligibleTeachers = eligibleTeachers(createSubjectId, teachers);
```

`buildAutoName(...)` 호출에서 `createCourse` → `createSubjectName`, `createTeacher` → `createTeacherName`으로 바꾼다. (autoName을 만드는 `buildAutoName(... resolvedCreate.season, createDays, createTime, createCourse, createTeacher)` 호출 인자를 교체.)

- [ ] **Step 3: 가드와 새 Class 객체에 subject_id/teacher_id 기록**

`handleCreateClass`(line 186) 가드를 교체:

```ts
    if (createDays.length === 0 || !createSubjectId || !createTeacherId || !createTeamLead) return;
```

새 Class 객체(line 196-215)에서 `course`/`teacher` 라인을 아래처럼 바꾼다:

```ts
      course: createSubjectName,
      subject_id: createSubjectId,
      name: autoName,
      teacher: createTeacherName,
      teacher_id: createTeacherId,
```

폼 리셋(line 222-223)의 `setCreateCourse('')` → `setCreateSubjectId('')`, `setCreateTeacher('')` → `setCreateTeacherId('')`로 교체.

- [ ] **Step 4: 폼 UI — 과정 Select + 담임 Select 교체**

line 615-621의 "과정" `Input`을 과목 `Select`로 교체:

```tsx
            <Select
              label="과정(과목)"
              value={createSubjectId}
              onChange={e => { setCreateSubjectId(e.target.value); setCreateTeacherId(''); }}
              options={[{ value: '', label: '과목 선택' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]}
            />
```

(과목을 바꾸면 자격이 달라지므로 강사 선택을 초기화한다.)

line 626-632의 "담임" `Input`을 자격 강사 `Select`로 교체:

```tsx
            <Select
              label="담임 강사"
              value={createTeacherId}
              onChange={e => setCreateTeacherId(e.target.value)}
              disabled={!createSubjectId}
              options={
                !createSubjectId
                  ? [{ value: '', label: '과목을 먼저 선택하세요' }]
                  : [{ value: '', label: '강사 선택' }, ...createEligibleTeachers.map(t => ({ value: t.id, label: t.name }))]
              }
            />
```

- [ ] **Step 5: 타입/린트 확인**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS — `createCourse`/`createTeacher` 잔여 참조가 있으면 여기서 에러로 잡힌다. 있으면 위 파생값/상태로 정리한다.

- [ ] **Step 6: 수동 검증**

Run: `npm run dev` 후 `/classes`에서 "새 반 생성".
Expected:
- "과정(과목)" 드롭다운에서 과목 선택 전엔 "담임 강사" 드롭다운 비활성 + "과목을 먼저 선택하세요"
- 과목 선택 시 그 과목 자격 강사만 드롭다운 노출(하드 필터). 예: "아두이노" 선택 → 씨드·허빈만
- 생성 시 자동 반명에 과목/강사 반영, 목록에 추가됨
확인 후 dev 서버 종료.

- [ ] **Step 7: Commit**

```bash
git add app/(admin)/classes/page.tsx
git commit -m "feat: 반 생성 폼에 과목 Select + 자격 강사 Select(하드 필터)"
```

---

## Self-Review

**Spec coverage:**
- 강사 관리 메뉴 신설 → Task 5(사이드바) + Task 6(페이지) ✓
- 반 생성 시 강사 드롭다운(자격 필터) → Task 7 ✓
- 강사 생성 시 맡을 수 있는 반만 배정 → Task 6 Step 2(eligibleClasses 하드 필터) ✓
- 강사 수준 = 과목, 매칭 단일 규칙 → Task 4 ✓
- 과목 마스터 신설 → Task 1, Task 6(과목 관리 UI) ✓
- course→subject_id 이전, teacher 호환 유지 → Task 2 ✓
- 담임 1명·교체 표기 → Task 6 Step 2 ✓
- 과목 삭제 차단(사용 중) → Task 6 Step 1 `removeSubject` ✓
- 인메모리 유지 → 전 태스크 ✓

**Placeholder scan:** 모든 코드 단계에 실제 코드 포함. "적절히 처리" 류 문구 없음. ✓

**Type consistency:** `Subject`/`Teacher`/`Class.subject_id`/`Class.teacher_id`/`canTeach`/`eligibleTeachers`/`eligibleClasses` 시그니처가 Task 1–4 정의와 Task 6–7 사용처에서 일치. teacher id(`tch-ron` 등)가 Task 2 시드와 Task 3 시드에서 동일. ✓

**알려진 한계(범위 내):** 강사 배정은 페이지 로컬 상태에만 반영되어 페이지 이동 시 시드로 초기화된다(기존 앱 전반의 인메모리 동작과 동일). 실 서비스화 시 공유 상태/DB 도입은 별도 작업.
