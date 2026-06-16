# 원생별 상담이력 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 원생 상세 모달에 `상담이력` 탭을 추가하여 원생별 상담 기록을 탭 안에서 인라인으로 추가·수정·삭제할 수 있게 한다.

**Architecture:** 상담 데이터는 기존 `enrollments`/`payments`처럼 `student_id`로 연결되는 별도 배열(`consultations`)로 `lib/mock-data.ts`에 둔다. 정렬·CRUD 순수 로직은 `lib/consultations.ts`로 분리해 `vitest`로 단위 테스트한다. UI는 `app/(admin)/students/page.tsx`의 상세 모달에 네 번째 탭으로 붙이고, 페이지 로컬 상태(`localConsultations`)로 동작시킨다.

**Tech Stack:** Next.js(App Router) · React(client component) · TypeScript · Tailwind · vitest

---

## File Structure

- **Modify** `lib/mock-data.ts` — `ConsultMethod` 타입, `Consultation` 인터페이스, `consultations` mock 배열 추가.
- **Create** `lib/consultations.ts` — 정렬·CRUD·id 생성 순수 헬퍼.
- **Create** `lib/consultations.test.ts` — 위 헬퍼 단위 테스트.
- **Modify** `app/(admin)/students/page.tsx` — `상담이력` 탭 + 인라인 CRUD UI/상태.

---

## Task 1: 데이터 모델 + mock 데이터

**Files:**
- Modify: `lib/mock-data.ts` (enrollments 정의 아래, 약 `lib/mock-data.ts:362` 근처)

- [ ] **Step 1: 타입·인터페이스·mock 배열 추가**

`lib/mock-data.ts`에서 `export const enrollments: Enrollment[] = [];` 줄을 찾아 그 **바로 아래**에 다음을 추가한다:

```ts
// ── 원생별 상담이력 ─────────────────────────────────────────
export type ConsultMethod = '전화' | '대면' | '문자·카톡' | '기타';

export interface Consultation {
  id: string;
  student_id: string;
  date: string;        // 상담일자 YYYY-MM-DD
  method: ConsultMethod;
  counselor: string;   // 상담자
  content: string;     // 상담내용
}

// 일부 학생 샘플 (빈 상태/채워진 상태 모두 확인용)
export const consultations: Consultation[] = [
  { id: 'cons-s-01-1', student_id: 's-01', date: '2026-03-12', method: '대면', counselor: '김지원', content: '신학기 학습 목표 상담. 알고리즘 심화에 관심 많음.' },
  { id: 'cons-s-01-2', student_id: 's-01', date: '2026-05-20', method: '전화', counselor: '김지원', content: '어머니와 진도 관련 통화. 다음 달 심화반 이동 희망.' },
  { id: 'cons-s-02-1', student_id: 's-02', date: '2026-04-03', method: '문자·카톡', counselor: '박서준', content: '결석 후속 안내. 보강 일정 카톡으로 공유함.' },
];
```

> 참고: `'김지원'`, `'박서준'` 등 상담자명은 샘플 문자열이며 실제 담임 목록과 일치하지 않아도 된다(상담자 입력은 자유 입력 허용).

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (PASS)

- [ ] **Step 3: Commit**

```bash
git add lib/mock-data.ts
git commit -m "feat: 원생별 상담이력 데이터 모델·mock 추가"
```

---

## Task 2: 정렬·CRUD 순수 헬퍼 (TDD)

**Files:**
- Create: `lib/consultations.ts`
- Test: `lib/consultations.test.ts`

헬퍼 사양:
- `consultationsOf(all, studentId)` — 해당 학생 기록만 필터 후 상담일자(`date`) 내림차순 정렬. 같은 날짜는 `id` 내림차순으로 안정 정렬(결정성 보장).
- `nextConsultId(all, studentId)` — 해당 학생의 기존 `cons-<studentId>-<n>` 중 최대 n+1로 `cons-<studentId>-<n>` 생성. 없으면 1.
- `addConsultation(all, record)` — `[...all, record]`.
- `updateConsultation(all, id, patch)` — 해당 id 레코드를 patch로 병합 교체.
- `removeConsultation(all, id)` — 해당 id 제거.

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/consultations.test.ts` 생성:

```ts
import { describe, it, expect } from 'vitest';
import {
  consultationsOf,
  nextConsultId,
  addConsultation,
  updateConsultation,
  removeConsultation,
} from './consultations';
import type { Consultation } from './mock-data';

const sample: Consultation[] = [
  { id: 'cons-s-01-1', student_id: 's-01', date: '2026-03-12', method: '대면', counselor: '김', content: 'A' },
  { id: 'cons-s-01-2', student_id: 's-01', date: '2026-05-20', method: '전화', counselor: '김', content: 'B' },
  { id: 'cons-s-02-1', student_id: 's-02', date: '2026-04-03', method: '기타', counselor: '박', content: 'C' },
];

describe('consultationsOf', () => {
  it('해당 학생만 필터하고 날짜 내림차순으로 정렬한다', () => {
    const r = consultationsOf(sample, 's-01');
    expect(r.map(c => c.id)).toEqual(['cons-s-01-2', 'cons-s-01-1']);
  });
  it('같은 날짜는 id 내림차순으로 안정 정렬한다', () => {
    const same: Consultation[] = [
      { id: 'cons-s-03-1', student_id: 's-03', date: '2026-06-01', method: '전화', counselor: '이', content: '1' },
      { id: 'cons-s-03-2', student_id: 's-03', date: '2026-06-01', method: '전화', counselor: '이', content: '2' },
    ];
    expect(consultationsOf(same, 's-03').map(c => c.id)).toEqual(['cons-s-03-2', 'cons-s-03-1']);
  });
  it('기록이 없으면 빈 배열', () => {
    expect(consultationsOf(sample, 's-99')).toEqual([]);
  });
});

describe('nextConsultId', () => {
  it('기존 최대 시퀀스 +1로 생성한다', () => {
    expect(nextConsultId(sample, 's-01')).toBe('cons-s-01-3');
  });
  it('기록이 없으면 1번', () => {
    expect(nextConsultId(sample, 's-99')).toBe('cons-s-99-1');
  });
});

describe('add/update/remove', () => {
  it('addConsultation은 레코드를 추가한다', () => {
    const rec: Consultation = { id: 'cons-s-02-2', student_id: 's-02', date: '2026-06-10', method: '대면', counselor: '박', content: 'D' };
    const r = addConsultation(sample, rec);
    expect(r).toHaveLength(4);
    expect(r.at(-1)).toEqual(rec);
  });
  it('updateConsultation은 해당 id만 병합 교체한다', () => {
    const r = updateConsultation(sample, 'cons-s-01-1', { content: 'AA', method: '전화' });
    const target = r.find(c => c.id === 'cons-s-01-1')!;
    expect(target.content).toBe('AA');
    expect(target.method).toBe('전화');
    expect(target.date).toBe('2026-03-12');
  });
  it('removeConsultation은 해당 id를 제거한다', () => {
    const r = removeConsultation(sample, 'cons-s-01-1');
    expect(r.map(c => c.id)).toEqual(['cons-s-01-2', 'cons-s-02-1']);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -- consultations`
Expected: FAIL — `lib/consultations.ts` 모듈 없음(해석 실패)

- [ ] **Step 3: 최소 구현 작성**

`lib/consultations.ts` 생성:

```ts
import type { Consultation } from './mock-data';

/** 해당 학생 기록만 필터 후 날짜 내림차순(동일 날짜는 id 내림차순) 정렬 */
export function consultationsOf(all: Consultation[], studentId: string): Consultation[] {
  return all
    .filter(c => c.student_id === studentId)
    .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
}

/** `cons-<studentId>-<n>` 다음 시퀀스 id 생성 (결정적) */
export function nextConsultId(all: Consultation[], studentId: string): string {
  const prefix = `cons-${studentId}-`;
  const maxSeq = all
    .filter(c => c.student_id === studentId && c.id.startsWith(prefix))
    .reduce((max, c) => {
      const n = parseInt(c.id.slice(prefix.length), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
  return `${prefix}${maxSeq + 1}`;
}

export function addConsultation(all: Consultation[], record: Consultation): Consultation[] {
  return [...all, record];
}

export function updateConsultation(
  all: Consultation[],
  id: string,
  patch: Partial<Omit<Consultation, 'id' | 'student_id'>>,
): Consultation[] {
  return all.map(c => (c.id === id ? { ...c, ...patch } : c));
}

export function removeConsultation(all: Consultation[], id: string): Consultation[] {
  return all.filter(c => c.id !== id);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -- consultations`
Expected: PASS (전체 테스트 green)

- [ ] **Step 5: Commit**

```bash
git add lib/consultations.ts lib/consultations.test.ts
git commit -m "feat: 상담이력 정렬·CRUD 순수 로직 + 테스트"
```

---

## Task 3: 상담이력 탭 UI + 인라인 CRUD

**Files:**
- Modify: `app/(admin)/students/page.tsx`

이 태스크는 UI 통합이라 단위 테스트 대신 타입체크·린트로 검증한다.

- [ ] **Step 1: import 추가**

`app/(admin)/students/page.tsx` 상단 import 블록에서 mock-data import에 `consultations`, `Consultation`, `ConsultMethod`를 추가하고, 헬퍼 import 한 줄을 추가한다.

mock-data import을 다음과 같이 교체:

```ts
import {
  students as initialStudents,
  classes,
  enrollments as initialEnrollments,
  consultations as initialConsultations,
  getInvoiceByStudent,
  payments,
  Student,
  Enrollment,
  Consultation,
  ConsultMethod,
} from '@/lib/mock-data';
```

`import { DeleteButton } ...` 줄 **아래**에 추가:

```ts
import { consultationsOf, nextConsultId, addConsultation, updateConsultation, removeConsultation } from '@/lib/consultations';
```

- [ ] **Step 2: 탭 목록·상수 추가**

`DETAIL_TABS` 정의를 교체:

```ts
const DETAIL_TABS = ['기본정보', '수강이력', '수납이력', '상담이력'] as const;
```

`TEACHERS` 정의 줄 **아래**에 모듈 상수 추가:

```ts
const CONSULT_METHODS: ConsultMethod[] = ['전화', '대면', '문자·카톡', '기타'];
```

- [ ] **Step 3: 상담 상태·핸들러 추가**

`const [confirmDelete, setConfirmDelete] = useState(false);` (상세 모달 상태 블록) **아래**에 추가:

```ts
// 상담이력 (탭 내 인라인 CRUD)
const [localConsultations, setLocalConsultations] = useState<Consultation[]>(initialConsultations);
const emptyConsultForm = { date: today, method: '전화' as ConsultMethod, counselor: '', content: '' };
const [consultForm, setConsultForm] = useState(emptyConsultForm);
const [editingConsultId, setEditingConsultId] = useState<string | null>(null);
const [consultEdit, setConsultEdit] = useState<{ date: string; method: ConsultMethod; counselor: string; content: string }>(emptyConsultForm);
const [confirmDeleteConsult, setConfirmDeleteConsult] = useState<string | null>(null);

function resetConsultState() {
  setConsultForm({ ...emptyConsultForm });
  setEditingConsultId(null);
  setConfirmDeleteConsult(null);
}
function addConsult() {
  if (!detailStudent || !consultForm.content.trim()) return;
  const id = nextConsultId(localConsultations, detailStudent.id);
  setLocalConsultations(prev => addConsultation(prev, {
    id, student_id: detailStudent.id,
    date: consultForm.date, method: consultForm.method,
    counselor: consultForm.counselor.trim(), content: consultForm.content.trim(),
  }));
  setConsultForm({ ...emptyConsultForm });
}
function startEditConsult(c: Consultation) {
  setConfirmDeleteConsult(null);
  setEditingConsultId(c.id);
  setConsultEdit({ date: c.date, method: c.method, counselor: c.counselor, content: c.content });
}
function saveEditConsult() {
  if (!editingConsultId || !consultEdit.content.trim()) return;
  setLocalConsultations(prev => updateConsultation(prev, editingConsultId, {
    date: consultEdit.date, method: consultEdit.method,
    counselor: consultEdit.counselor.trim(), content: consultEdit.content.trim(),
  }));
  setEditingConsultId(null);
}
function deleteConsult(id: string) {
  setLocalConsultations(prev => removeConsultation(prev, id));
  setConfirmDeleteConsult(null);
}
```

> `today`와 `detailStudent`는 컴포넌트 내 이미 정의돼 있으므로 위 코드는 그 아래(컴포넌트 본문)에 위치해야 한다.

- [ ] **Step 4: 모달 열기/닫기 시 상담 상태 초기화**

`openDetail` 함수의 `setConfirmDelete(false);` **아래**에 추가:

```ts
    resetConsultState();
```

`closeDetail` 함수의 `setConfirmDelete(false);` **아래**에 추가:

```ts
    resetConsultState();
```

- [ ] **Step 5: 상담이력 탭 렌더 분기 추가**

`renderDetailBody` 안에서 `// 수납이력` 주석으로 시작하는 마지막 블록(`const invs = getInvoiceByStudent(s.id);` 직전) **위에** 다음 분기를 삽입한다:

```tsx
    // 상담이력 (탭 자체가 상시 인라인 편집 가능)
    if (detailTab === '상담이력') {
      const list = consultationsOf(localConsultations, s.id);
      const methodBadge: Record<ConsultMethod, 'primary' | 'success' | 'warn' | 'default'> = {
        '전화': 'primary', '대면': 'success', '문자·카톡': 'warn', '기타': 'default',
      };
      return (
        <div className="space-y-4">
          {/* 신규 상담 입력폼 */}
          <div className="bg-[#F7F7F5] rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-[#787774]">상담 기록 추가</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="상담일자" type="date" value={consultForm.date}
                onChange={e => setConsultForm(f => ({ ...f, date: e.target.value }))} />
              <Select label="상담유형" value={consultForm.method}
                onChange={e => setConsultForm(f => ({ ...f, method: e.target.value as ConsultMethod }))}
                options={CONSULT_METHODS.map(m => ({ value: m, label: m }))} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#37352F]">상담자</label>
                <input list="consult-counselor-options" value={consultForm.counselor}
                  onChange={e => setConsultForm(f => ({ ...f, counselor: e.target.value }))}
                  placeholder="이름 입력"
                  className="w-full border border-[#E9E9E7] rounded-md px-3 py-2 text-sm text-[#37352F] placeholder:text-[#BEBDBA] focus:outline-none focus:border-[#FF6C37] bg-white" />
                <datalist id="consult-counselor-options">
                  {TEACHERS.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
            </div>
            <Textarea label="상담내용" rows={3} value={consultForm.content}
              placeholder="상담 내용을 입력하세요"
              onChange={e => setConsultForm(f => ({ ...f, content: e.target.value }))} />
            <div className="flex justify-end">
              <Button size="sm" onClick={addConsult} disabled={!consultForm.content.trim()}>추가</Button>
            </div>
          </div>

          {/* 기록 목록 (최신순) */}
          {list.length === 0 ? (
            <p className="text-sm text-[#787774]">등록된 상담 이력이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {list.map(c => editingConsultId === c.id ? (
                <div key={c.id} className="border border-[#FF6C37]/40 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="상담일자" type="date" value={consultEdit.date}
                      onChange={e => setConsultEdit(f => ({ ...f, date: e.target.value }))} />
                    <Select label="상담유형" value={consultEdit.method}
                      onChange={e => setConsultEdit(f => ({ ...f, method: e.target.value as ConsultMethod }))}
                      options={CONSULT_METHODS.map(m => ({ value: m, label: m }))} />
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-[#37352F]">상담자</label>
                      <input list="consult-counselor-options" value={consultEdit.counselor}
                        onChange={e => setConsultEdit(f => ({ ...f, counselor: e.target.value }))}
                        className="w-full border border-[#E9E9E7] rounded-md px-3 py-2 text-sm text-[#37352F] focus:outline-none focus:border-[#FF6C37] bg-white" />
                    </div>
                  </div>
                  <Textarea label="상담내용" rows={3} value={consultEdit.content}
                    onChange={e => setConsultEdit(f => ({ ...f, content: e.target.value }))} />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingConsultId(null)}>취소</Button>
                    <Button size="sm" onClick={saveEditConsult} disabled={!consultEdit.content.trim()}>저장</Button>
                  </div>
                </div>
              ) : (
                <div key={c.id} className="border border-[#E9E9E7] rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#37352F] tabular-nums">{c.date}</span>
                      <Badge variant={methodBadge[c.method]}>{c.method}</Badge>
                      {c.counselor && <span className="text-xs text-[#787774]">{c.counselor}</span>}
                    </div>
                    {confirmDeleteConsult === c.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#787774]">삭제할까요?</span>
                        <button onClick={() => deleteConsult(c.id)} className="text-xs text-[#EB5757] font-medium hover:underline">삭제</button>
                        <button onClick={() => setConfirmDeleteConsult(null)} className="text-xs text-[#787774] hover:underline">취소</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => startEditConsult(c)} className="text-xs text-[#787774] hover:text-[#37352F] hover:underline">수정</button>
                        <DeleteButton className="text-xs" onClick={() => setConfirmDeleteConsult(c.id)}>삭제</DeleteButton>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[#37352F] mt-2 whitespace-pre-line">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

```

- [ ] **Step 6: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (PASS)

- [ ] **Step 7: 린트**

Run: `npm run lint`
Expected: 신규 코드 관련 에러 없음 (PASS)

- [ ] **Step 8: 전체 테스트**

Run: `npm run test`
Expected: 전체 PASS

- [ ] **Step 9: Commit**

```bash
git add app/\(admin\)/students/page.tsx
git commit -m "feat: 원생 상세에 상담이력 탭(인라인 CRUD) 추가"
```

---

## Self-Review 결과

**Spec coverage:**
- 위치(4번째 탭) → Task 3 Step 2/5 ✓
- 필드(일자·유형·상담자·내용) → Task 1 인터페이스 + Task 3 입력폼/편집폼 ✓
- 상담유형 수단 기준 4종 → Task 1 `ConsultMethod` + Task 3 `CONSULT_METHODS` ✓
- 인라인 추가/수정/삭제 → Task 3 Step 5 ✓
- 최신순 정렬 → Task 2 `consultationsOf` ✓
- 상담자 datalist(자유 입력) → Task 3 `consult-counselor-options` ✓
- 삭제는 DeleteButton 톤 → Task 3 Step 5 ✓
- 별도 배열·학생 레코드 불변 → Task 1 ✓
- YAGNI(통합 페이지/최근상담일 컬럼/부가필드 제외) → 플랜에 미포함 ✓

**Placeholder scan:** 모든 코드 단계에 실제 코드 포함. TODO/TBD 없음.

**Type consistency:** `Consultation`/`ConsultMethod` 필드명(`date`/`method`/`counselor`/`content`), 헬퍼 시그니처(`consultationsOf`/`nextConsultId`/`addConsultation`/`updateConsultation`/`removeConsultation`)가 Task 1~3 전반에서 일치.
