# 출결현황(/attendance) 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 출결현황 페이지를 분석 대시보드(주간/월별 추이) + 반별 기록부 드릴다운(학생×회차 매트릭스 직접 편집)으로 발전시킨다.

**Architecture:** `lib/mock-data.ts`에 결정적 출결 이력을 백필하고 집계/매트릭스 헬퍼를 추가한다. 페이지(`page.tsx`)가 출결 레코드를 단일 React 상태로 보유하고, 추이 카드·반별 카드·기록부 모달이 모두 그 상태를 공유한다. 편집은 클라이언트 상태만 갱신(새로고침 시 초기화, 데모용).

**Tech Stack:** Next.js App Router(클라이언트 컴포넌트), React 18 hooks, Tailwind CSS, 기존 `components/ui`(Card/Modal/Input/Badge).

> **Next.js 주의(AGENTS.md):** 이 작업은 서버 컴포넌트·데이터 패칭·라우팅 API를 건드리지 않는다(전부 기존 `'use client'` 범위). 새 라우트나 서버 기능을 추가할 일이 생기면 `node_modules/next/dist/docs/`를 먼저 확인할 것.

> **테스트 정책:** 이 프로젝트에는 테스트 러너가 없다(기존 관례). 따라서 TDD 대신 **`npx tsc --noEmit` 타입 체크 + `npm run dev` 수동 스모크**로 검증한다.

---

## 파일 맵

| 작업 | 파일 | 책임 |
|------|------|------|
| 수정 | `lib/mock-data.ts` | 출결 이력 백필(`sessionHistory`/`attendanceHistory`) + 집계·매트릭스 헬퍼 + `TODAY` 상수 |
| 생성 | `components/attendance/AttendanceTrend.tsx` | 주간/월별 토글 출석률 막대 카드 |
| 생성 | `components/attendance/StatusPopover.tsx` | 셀 상태 변경 팝오버(출석/결석/보강/미도착 + 결석 사유) |
| 생성 | `components/attendance/ClassRecordModal.tsx` | 반별 기록부 모달(학생×회차 매트릭스 + 편집) |
| 수정 | `app/(admin)/attendance/page.tsx` | 출결 상태 보유 + KPI 재집계 + 추이/반별카드/모달 연결 |

---

### Task 1: 데이터 레이어 — 출결 이력 백필 + 헬퍼

**Files:**
- Modify: `lib/mock-data.ts` (파일 끝에 추가; 기존 `todaySessions`/`initialAttendance`/`Attendance`/`Session`/`Student` 정의 뒤)

- [ ] **Step 1: 백필·헬퍼 코드 추가**

`lib/mock-data.ts` 맨 끝에 다음을 추가한다. (기존 `export` 들과 충돌하는 이름 없음)

```ts
// ─────────────────────────────────────────────────────────────
// 출결현황 페이지 — 추이·매트릭스용 결정적 출결 이력 백필
// 오늘(2026-06-14) 이전 회차를 결정적으로 생성. todaySessions/initialAttendance는 보존.
// (프로젝트 규칙상 Math.random() 금지 → 학생 id·회차 인덱스 기반 고정 패턴)
// ─────────────────────────────────────────────────────────────
export const TODAY = '2026-06-14';
const HISTORY_WEEKS = 16; // 월별 4개월·주간 8주 충당
const CURRENT_CLASS_IDS = ['cl-01', 'cl-02', 'cl-03', 'cl-04', 'cl-05', 'cl-06'];
const TWICE_WEEKLY = new Set(['cl-04', 'cl-05', 'cl-06']); // 화·목 (주 2회)

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// 학생·회차 기반 결정적 상태 (대부분 출석, 소수 결석·보강; streak 높을수록 출석↑)
function deriveHistStatus(student: Student, sessionIndex: number): AttendanceStatus {
  const r = (hashString(student.id) + sessionIndex * 37) % 100;
  const absentThreshold = Math.max(2, 11 - Math.floor(student.streak / 3));
  if (r < absentThreshold) return 'absent';
  if (r < absentThreshold + 3) return 'makeup';
  return 'attend';
}

function classStartTime(classId: string): string {
  const cls = classes.find(c => c.id === classId);
  const m = cls?.schedule.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '09:00';
}

function buildAttendanceHistory(): { sessionHistory: Session[]; attendanceHistory: Attendance[] } {
  const pastSessions: Session[] = [];
  const records: Attendance[] = [];

  CURRENT_CLASS_IDS.forEach(classId => {
    const classStudents = students.filter(s => s.class_id === classId);
    // 과거 회차 날짜 (오래된→최신, 오늘 제외)
    const dates: string[] = [];
    if (TWICE_WEEKLY.has(classId)) {
      for (let w = HISTORY_WEEKS; w >= 1; w--) {
        dates.push(shiftDate(TODAY, -7 * w - 2)); // 화 가정
        dates.push(shiftDate(TODAY, -7 * w));     // 목 가정
      }
    } else {
      for (let w = HISTORY_WEEKS; w >= 1; w--) {
        dates.push(shiftDate(TODAY, -7 * w));     // 토 가정
      }
    }
    dates.forEach((date, i) => {
      const sessionId = `sh-${classId}-${i + 1}`;
      pastSessions.push({
        id: sessionId, class_id: classId, session_date: date,
        start_time: classStartTime(classId), session_no: i + 1,
      });
      classStudents.forEach(s => {
        const status = deriveHistStatus(s, i + 1);
        records.push({
          id: `ah-${sessionId}-${s.id}`,
          session_id: sessionId,
          enrollment_id: `enr-${s.id}`,
          student_id: s.id,
          status,
          checked_in_at: status === 'attend' || status === 'makeup' ? `${date}T${classStartTime(classId)}:00` : null,
          source: 'kiosk',
          absence_reason: status === 'absent' ? '개인 사정' : null,
        });
      });
    });
  });

  // 오늘 회차(todaySessions)를 최신 컬럼으로 합침. 오늘 출결은 initialAttendance(cl-01)만 존재.
  const sessionHistory = [...pastSessions, ...todaySessions];
  return { sessionHistory, attendanceHistory: records };
}

export const { sessionHistory, attendanceHistory } = buildAttendanceHistory();

const sessionById: Record<string, Session> = {};
sessionHistory.forEach(s => { sessionById[s.id] = s; });

function weekStartISO(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const day = (d.getDay() + 6) % 7; // 월요일=0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export interface TrendPoint {
  key: string;
  label: string;
  rate: number;   // 출석률(%) — (출석+보강)/(출석+보강+결석)
  attend: number; // 출석+보강
  total: number;  // 미도착 제외 분모
}

// 오늘(진행 중) 회차는 추이에서 제외 — 미완료라 왜곡 방지
function aggregateTrend(
  records: Attendance[],
  keyOf: (date: string) => string,
  labelOf: (key: string) => string,
  take: number,
): TrendPoint[] {
  const buckets: Record<string, { attend: number; total: number }> = {};
  records.forEach(r => {
    const sess = sessionById[r.session_id];
    if (!sess || sess.session_date === TODAY) return;
    if (r.status === 'pending') return;
    const k = keyOf(sess.session_date);
    if (!buckets[k]) buckets[k] = { attend: 0, total: 0 };
    if (r.status === 'attend' || r.status === 'makeup') buckets[k].attend += 1;
    buckets[k].total += 1;
  });
  return Object.keys(buckets).sort().slice(-take).map(k => ({
    key: k,
    label: labelOf(k),
    rate: buckets[k].total ? Math.round((buckets[k].attend / buckets[k].total) * 100) : 0,
    attend: buckets[k].attend,
    total: buckets[k].total,
  }));
}

export function getWeeklyAttendanceTrend(records: Attendance[], weeks = 8): TrendPoint[] {
  return aggregateTrend(records, weekStartISO,
    k => `${Number(k.slice(5, 7))}/${Number(k.slice(8, 10))}주`, weeks);
}

export function getMonthlyAttendanceTrend(records: Attendance[], months = 4): TrendPoint[] {
  return aggregateTrend(records, d => d.slice(0, 7),
    k => `${Number(k.slice(5, 7))}월`, months);
}

export interface MatrixCell {
  session: Session;
  status: AttendanceStatus;
  record?: Attendance;
}
export interface MatrixRow {
  student: Student;
  cells: MatrixCell[];
}
export interface ClassMatrix {
  sessions: Session[];
  rows: MatrixRow[];
}

// 반별 학생×회차 매트릭스 (최근 maxSessions 회차, 오늘 포함)
export function getClassMatrix(classId: string, records: Attendance[], maxSessions = 8): ClassMatrix {
  const sessions = sessionHistory
    .filter(s => s.class_id === classId)
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(-maxSessions);
  const classStudents = students.filter(s => s.class_id === classId);
  const recByKey: Record<string, Attendance> = {};
  records.forEach(r => { recByKey[`${r.session_id}:${r.student_id}`] = r; });
  const rows: MatrixRow[] = classStudents.map(student => ({
    student,
    cells: sessions.map(session => {
      const rec = recByKey[`${session.id}:${student.id}`];
      return { session, status: (rec?.status ?? 'pending') as AttendanceStatus, record: rec };
    }),
  }));
  return { sessions, rows };
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료 (출력 없음)

- [ ] **Step 3: 커밋**

```bash
git add lib/mock-data.ts
git commit -m "feat: 출결 이력 백필 + 추이·매트릭스 집계 헬퍼 추가"
```

---

### Task 2: 추이 카드 컴포넌트

**Files:**
- Create: `components/attendance/AttendanceTrend.tsx`

- [ ] **Step 1: AttendanceTrend.tsx 생성**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import {
  type Attendance,
  getWeeklyAttendanceTrend,
  getMonthlyAttendanceTrend,
} from '@/lib/mock-data';

export function AttendanceTrend({ records }: { records: Attendance[] }) {
  const [mode, setMode] = useState<'week' | 'month'>('week');

  const points = useMemo(
    () => (mode === 'week'
      ? getWeeklyAttendanceTrend(records, 8)
      : getMonthlyAttendanceTrend(records, 4)),
    [records, mode],
  );

  return (
    <Card
      title="출석률 추이"
      className="mb-6"
      action={
        <div className="flex rounded-md border border-[#E9E9E7] overflow-hidden text-xs">
          {(['week', 'month'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 transition-colors ${mode === m ? 'bg-[#FF6C37] text-white' : 'bg-white text-[#787774] hover:bg-[#F7F7F5]'}`}
            >
              {m === 'week' ? '주간' : '월별'}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex items-end gap-4 h-28">
        {points.map((p, i) => (
          <div key={p.key} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-[#37352F]">{p.rate}%</span>
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${(p.rate / 100) * 80}px`,
                background: '#FF6C37',
                opacity: i === points.length - 1 ? 1 : 0.4,
              }}
            />
            <span className="text-xs text-[#787774]">{p.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/attendance/AttendanceTrend.tsx
git commit -m "feat: 주간/월별 출석률 추이 카드 컴포넌트 추가"
```

---

### Task 3: 셀 상태 변경 팝오버

**Files:**
- Create: `components/attendance/StatusPopover.tsx`

세 가지 책임: ①상태 4선택지 ②결석 시 사유 입력 ③바깥 클릭/ESC 닫기. 부모(`ClassRecordModal`)가 위치를 잡아주고, 본 컴포넌트는 메뉴 내용만 렌더한다.

- [ ] **Step 1: StatusPopover.tsx 생성**

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import type { AttendanceStatus } from '@/lib/mock-data';

const OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'attend',  label: '출석',   color: '#0F7B6C' },
  { value: 'absent',  label: '결석',   color: '#EB5757' },
  { value: 'makeup',  label: '보강',   color: '#D9A80A' },
  { value: 'pending', label: '미도착', color: '#787774' },
];

interface StatusPopoverProps {
  current: AttendanceStatus;
  currentReason: string | null;
  onSelect: (status: AttendanceStatus, absenceReason: string | null) => void;
  onClose: () => void;
}

export function StatusPopover({ current, currentReason, onSelect, onClose }: StatusPopoverProps) {
  const [pending, setPending] = useState<AttendanceStatus | null>(null); // 결석 사유 입력 단계
  const [reason, setReason] = useState(currentReason ?? '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function choose(status: AttendanceStatus) {
    if (status === 'absent') {
      setPending('absent');
      return;
    }
    onSelect(status, null);
  }

  return (
    <div
      ref={ref}
      className="absolute z-20 mt-1 w-44 rounded-lg border border-[#E9E9E7] bg-white shadow-lg p-1"
      onClick={e => e.stopPropagation()}
    >
      {pending === 'absent' ? (
        <div className="p-2">
          <p className="text-xs font-medium text-[#37352F] mb-1.5">결석 사유 (선택)</p>
          <input
            autoFocus
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="예: 가족 여행"
            className="w-full border border-[#E9E9E7] rounded-md px-2 py-1 text-xs text-[#37352F] focus:outline-none focus:border-[#FF6C37]"
          />
          <div className="flex justify-end gap-1.5 mt-2">
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs text-[#787774] hover:text-[#37352F]"
            >
              취소
            </button>
            <button
              onClick={() => onSelect('absent', reason.trim() || null)}
              className="px-2.5 py-1 text-xs rounded-md bg-[#EB5757] text-white hover:bg-[#D94545]"
            >
              결석 저장
            </button>
          </div>
        </div>
      ) : (
        OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => choose(o.value)}
            className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-left hover:bg-[#F7F7F5] ${o.value === current ? 'bg-[#F7F7F5]' : ''}`}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: o.color }} />
            <span className="text-[#37352F]">{o.label}</span>
            {o.value === current && <span className="ml-auto text-[#0F7B6C]">✓</span>}
          </button>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/attendance/StatusPopover.tsx
git commit -m "feat: 출결 셀 상태 변경 팝오버 컴포넌트 추가"
```

---

### Task 4: 반별 기록부 모달

**Files:**
- Create: `components/attendance/ClassRecordModal.tsx`

`Modal size="xl"` 안에 학생×회차 매트릭스를 렌더. 셀 클릭 시 그 셀에 `StatusPopover`를 띄우고, 선택 결과를 부모의 `onEdit` 콜백으로 올린다.

- [ ] **Step 1: ClassRecordModal.tsx 생성**

```tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { StatusPopover } from '@/components/attendance/StatusPopover';
import {
  type Attendance,
  type AttendanceStatus,
  type Class,
  getClassMatrix,
  TODAY,
} from '@/lib/mock-data';

const DOT_COLOR: Record<AttendanceStatus, string> = {
  attend:  '#0F7B6C',
  absent:  '#EB5757',
  makeup:  '#D9A80A',
  pending: '#FFFFFF',
};

function mmdd(iso: string) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

interface ClassRecordModalProps {
  cls: Class;
  records: Attendance[];
  onClose: () => void;
  onEdit: (sessionId: string, studentId: string, status: AttendanceStatus, absenceReason: string | null) => void;
}

export function ClassRecordModal({ cls, records, onClose, onEdit }: ClassRecordModalProps) {
  const matrix = getClassMatrix(cls.id, records, 8);
  // 편집 중인 셀: `${sessionId}:${studentId}`
  const [editing, setEditing] = useState<string | null>(null);

  // 반 요약 (오늘 제외 회차의 출석률)
  const flat = matrix.rows.flatMap(r => r.cells.filter(c => c.session.session_date !== TODAY));
  const counted = flat.filter(c => c.status !== 'pending');
  const attended = counted.filter(c => c.status === 'attend' || c.status === 'makeup').length;
  const avgRate = counted.length ? Math.round((attended / counted.length) * 100) : 0;

  return (
    <Modal open onClose={onClose} size="xl" title={`${cls.schedule} ${cls.course} · 담당 ${cls.teacher}`}>
      <div className="flex items-center gap-4 mb-4 text-xs text-[#787774]">
        <span>평균 출석률 <b className="text-[#37352F]">{avgRate}%</b></span>
        <span>회차 {matrix.sessions.length}</span>
        <span>재원 {matrix.rows.length}명</span>
        <span className="ml-auto flex items-center gap-2">
          <Legend color="#0F7B6C" label="출석" />
          <Legend color="#D9A80A" label="보강" />
          <Legend color="#EB5757" label="결석" />
          <Legend color="#FFFFFF" label="미도착" border />
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white text-left text-xs font-medium text-[#787774] px-2 py-2 min-w-[72px]">이름</th>
              {matrix.sessions.map(s => (
                <th key={s.id} className="px-2 py-2 text-center text-xs font-medium min-w-[44px]">
                  <span className={s.session_date === TODAY ? 'text-[#FF6C37]' : 'text-[#787774]'}>
                    {s.session_date === TODAY ? '오늘' : mmdd(s.session_date)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map(row => (
              <tr key={row.student.id} className="border-t border-[#F1F0EF]">
                <td className="sticky left-0 bg-white text-xs text-[#37352F] px-2 py-1.5 whitespace-nowrap">{row.student.name}</td>
                {row.cells.map(cell => {
                  const key = `${cell.session.id}:${row.student.id}`;
                  const isToday = cell.session.session_date === TODAY;
                  const isManual = cell.record?.source === 'manual';
                  return (
                    <td key={key} className="px-2 py-1.5 text-center relative">
                      <button
                        onClick={() => setEditing(editing === key ? null : key)}
                        className={`relative inline-flex items-center justify-center w-6 h-6 rounded-md hover:ring-2 hover:ring-[#FF6C37]/30 ${isToday ? 'ring-1 ring-[#FF6C37]/50' : ''}`}
                        title={isManual ? '수정됨' : undefined}
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{
                            background: DOT_COLOR[cell.status],
                            border: cell.status === 'pending' ? '2px solid #C7C6C3' : 'none',
                          }}
                        />
                        {isManual && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF6C37]" />}
                      </button>
                      {editing === key && (
                        <StatusPopover
                          current={cell.status}
                          currentReason={cell.record?.absence_reason ?? null}
                          onSelect={(status, reason) => {
                            onEdit(cell.session.id, row.student.id, status, reason);
                            setEditing(null);
                          }}
                          onClose={() => setEditing(null)}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function Legend({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[#787774]">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color, border: border ? '2px solid #C7C6C3' : 'none' }} />
      {label}
    </span>
  );
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/attendance/ClassRecordModal.tsx
git commit -m "feat: 반별 기록부 모달(학생×회차 매트릭스 편집) 추가"
```

---

### Task 5: 페이지 재구성 — 상태 보유 + 연결

**Files:**
- Modify: `app/(admin)/attendance/page.tsx` (전체 교체)

페이지가 출결 레코드를 단일 상태로 보유한다. KPI·추이·반별 카드·모달이 모두 이 상태를 공유하며, 편집은 `updateStatus`로만 일어난다.

- [ ] **Step 1: page.tsx 전체 교체**

```tsx
'use client';

import { useState, useMemo } from 'react';
import {
  classes,
  students,
  initialAttendance,
  attendanceHistory,
  TODAY,
  type Attendance,
  type AttendanceStatus,
  type Class,
} from '@/lib/mock-data';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { AttendanceTrend } from '@/components/attendance/AttendanceTrend';
import { ClassRecordModal } from '@/components/attendance/ClassRecordModal';

// 현재 학기(2026 여름) 진행 반만
const CURRENT_CLASSES = classes.filter(c => ['cl-01', 'cl-02', 'cl-03', 'cl-04', 'cl-05', 'cl-06'].includes(c.id));

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>(() => [...attendanceHistory, ...initialAttendance]);
  const [classFilter, setClassFilter] = useState('전체');
  const [openClass, setOpenClass] = useState<Class | null>(null);

  function updateStatus(sessionId: string, studentId: string, status: AttendanceStatus, absenceReason: string | null) {
    setRecords(prev => {
      const idx = prev.findIndex(r => r.session_id === sessionId && r.student_id === studentId);
      if (idx >= 0) {
        const next = [...prev];
        const rec = next[idx];
        next[idx] = {
          ...rec,
          status,
          source: 'manual',
          absence_reason: status === 'absent' ? absenceReason : null,
          checked_in_at: (status === 'attend' || status === 'makeup') ? (rec.checked_in_at ?? `${TODAY}T09:00:00`) : null,
        };
        return next;
      }
      // 오늘 미기록 셀 등 — 신규 레코드 생성
      return [...prev, {
        id: `ah-${sessionId}-${studentId}`,
        session_id: sessionId,
        enrollment_id: `enr-${studentId}`,
        student_id: studentId,
        status,
        source: 'manual',
        checked_in_at: (status === 'attend' || status === 'makeup') ? `${TODAY}T09:00:00` : null,
        absence_reason: status === 'absent' ? absenceReason : null,
      }];
    });
  }

  // 오늘 KPI — 오늘 회차 레코드 기준.
  // 오늘 회차는 todaySessions(id가 'sess-'로 시작). initialAttendance(sess-01) 및
  // 오늘 셀 편집으로 생성된 레코드(session_id 'sess-0X')가 여기 포함된다.
  const todayRecords = useMemo(
    () => records.filter(r => r.session_id.startsWith('sess-')),
    [records],
  );

  const kpi = useMemo(() => {
    const total = todayRecords.length;
    const attend = todayRecords.filter(r => r.status === 'attend' || r.status === 'makeup').length;
    const absent = todayRecords.filter(r => r.status === 'absent').length;
    const pending = todayRecords.filter(r => r.status === 'pending').length;
    const denom = attend + absent;
    return { total, attend, absent, pending, rate: denom ? Math.round((attend / denom) * 100) : 0 };
  }, [todayRecords]);

  const targetClasses = classFilter === '전체' ? CURRENT_CLASSES : CURRENT_CLASSES.filter(c => c.id === classFilter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">출결 현황</h1>
        <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 출석/결석/보강 이력</p>
      </div>

      {/* 오늘 요약 KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '출석', value: kpi.attend, color: 'text-[#0F7B6C]', bg: 'bg-[#EDF7F5]' },
          { label: '미도착', value: kpi.pending, color: 'text-[#787774]', bg: 'bg-[#F7F7F5]' },
          { label: '결석', value: kpi.absent, color: 'text-[#EB5757]', bg: 'bg-[#FDECEA]' },
          { label: '출석률', value: `${kpi.rate}%`, color: 'text-[#37352F]', bg: 'bg-white' },
        ].map(item => (
          <Card key={item.label} className={`!p-0 ${item.bg}`}>
            <div className="px-5 py-4 text-center">
              <p className="text-xs text-[#787774] mb-1">{item.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
              <p className="text-xs text-[#787774] mt-0.5">오늘 (6/14)</p>
            </div>
          </Card>
        ))}
      </div>

      {/* 출석률 추이 */}
      <AttendanceTrend records={records} />

      {/* 반 필터 */}
      <div className="flex gap-3 mb-4">
        <Select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          options={[
            { value: '전체', label: '전체 반' },
            ...CURRENT_CLASSES.map(c => ({ value: c.id, label: c.schedule + ' ' + c.course })),
          ]}
          className="w-48"
        />
      </div>

      {/* 반별 카드 (클릭 → 기록부 모달) */}
      <div className="space-y-3">
        {targetClasses.map(cls => {
          const classStudentIds = new Set(students.filter(s => s.class_id === cls.id).map(s => s.id));
          // 그 반의 오늘 회차 레코드로 요약 (없으면 미기록)
          const todayCls = records.filter(r => classStudentIds.has(r.student_id) && r.session_id.startsWith('sess-'));
          const attendCount = todayCls.filter(r => r.status === 'attend' || r.status === 'makeup').length;
          const absentCount = todayCls.filter(r => r.status === 'absent').length;
          const pendingCount = todayCls.filter(r => r.status === 'pending').length;
          const denom = attendCount + absentCount;
          const pct = denom ? Math.round((attendCount / denom) * 100) : 0;

          return (
            <button
              key={cls.id}
              onClick={() => setOpenClass(cls)}
              className="w-full text-left bg-white border border-[#E9E9E7] rounded-lg px-5 py-4 hover:border-[#FF6C37]/50 hover:bg-[#FFFBFA] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#37352F]">{cls.schedule}</span>
                  <span className="text-sm text-[#37352F]">{cls.course}</span>
                  <span className="text-xs text-[#787774]">담당: {cls.teacher}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#0F7B6C]">출석 {attendCount}</span>
                  <span className="text-[#787774]">미도착 {pendingCount}</span>
                  <span className="text-[#EB5757]">결석 {absentCount}</span>
                  <span className="font-semibold text-[#37352F]">{denom ? `${pct}%` : '미기록'}</span>
                  <span className="text-[#BEBDBA]">›</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {openClass && (
        <ClassRecordModal
          cls={openClass}
          records={records}
          onClose={() => setOpenClass(null)}
          onEdit={updateStatus}
        />
      )}
    </div>
  );
}
```

> 참고: 오늘 회차 레코드 판별은 `session_id`가 `sess-`로 시작(=`todaySessions` 및 그로부터 편집 생성된 레코드)하는지로 한다. `initialAttendance`의 `session_id`는 `sess-01`이고, 오늘 다른 반 셀을 편집하면 해당 `sess-0X` id로 신규 레코드가 생성된다.

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/\(admin\)/attendance/page.tsx
git commit -m "feat: 출결현황 페이지 재구성 — 추이 카드·반별 기록부 모달 연결"
```

---

### Task 6: 수동 스모크 테스트

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 개발 서버 실행 및 확인**

Run: `npm run dev`
브라우저에서 `/attendance` 접속 후 확인:

1. 상단 KPI 4칸 — 출석 3 / 미도착 11 / 결석 0 / 출석률 표시 (cl-01 오늘 초기 상태 기준).
2. "출석률 추이" 카드 — `주간`(막대 8개) ↔ `월별`(막대 4개) 토글 전환, 막대 높이·라벨이 바뀜.
3. 반별 카드 hover 시 테두리·배경 강조, 클릭 시 기록부 모달 열림.
4. 모달: 학생×회차 매트릭스(최근 8회차), 오늘 컬럼은 "오늘"·주황 테두리.
5. 과거 셀 클릭 → 팝오버 → "결석" 선택 → 사유 입력 → 저장 → 셀이 빨강으로 바뀌고 우상단 주황 "수정됨" 점 표시.
6. 같은 셀을 다시 "출석"으로 변경 → 녹색 복귀.
7. 모달 상단 "평균 출석률"과 (오늘 셀 편집 시) 메인 KPI·추이가 즉시 갱신됨.
8. 모달 닫기(X·바깥·ESC) 동작.

Expected: 위 8가지 정상.

- [ ] **Step 2: 타입 체크 최종 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 최종 커밋 (변경분 없으면 생략)**

```bash
git status
# 미커밋 변경이 있으면:
git commit -am "chore: 출결현황 개선 스모크 점검 반영"
```

---

## Self-Review

**스펙 커버리지:**
- ✅ 추이(주간/월별 토글) — Task 1 헬퍼 + Task 2 `AttendanceTrend`
- ✅ 안 A 출석률 막대(실제 이력 집계) — Task 2, 하드코딩 `weeklyStats` 제거(Task 5 전체 교체)
- ✅ 드릴다운(반 카드 클릭 → 모달) — Task 5 반별 카드 `<button>` + Task 4 모달
- ✅ 안 A 매트릭스 직접 편집 — Task 4 매트릭스 + Task 3 팝오버
- ✅ 출석/결석/보강/미도착 + 결석 사유 — Task 3 `OPTIONS` + 사유 입력 단계
- ✅ 편집 클라이언트 상태만 + 즉시 재집계 — Task 5 `records` 상태 + `updateStatus`
- ✅ `source: 'manual'` "수정됨" 표식 — Task 4 `isManual` 주황 점, Task 5 `updateStatus`에서 source 지정
- ✅ 전 반·회차 결정적 백필 — Task 1 `buildAttendanceHistory` (Math.random 미사용)
- ✅ 컴포넌트 분리(page.tsx 비대화 방지) — Task 2/3/4 별도 파일
- ✅ 라벨 굵기 일관성(메모리) — KPI/카드 라벨 모두 동일 위계 굵기 유지, 특정 라벨 볼드 강조 없음
- ✅ 키오스크 데모 보존 — `todaySessions`/`initialAttendance` 미변경, 오늘 컬럼은 그 상태 재사용

**플레이스홀더 스캔:** 없음. 모든 코드 스텝에 실제 코드/명령 포함.

**타입 일관성:**
- `Attendance`/`AttendanceStatus`/`Session`/`Student`/`Class` — 기존 mock-data export 재사용 ✅
- `TrendPoint`/`MatrixCell`/`MatrixRow`/`ClassMatrix` — Task 1 정의 → Task 2/4 소비 ✅
- `getWeeklyAttendanceTrend(records, weeks)`/`getMonthlyAttendanceTrend(records, months)` — Task 1 시그니처 ↔ Task 2 호출 일치 ✅
- `getClassMatrix(classId, records, maxSessions)` — Task 1 ↔ Task 4 호출 일치 ✅
- `StatusPopover` props(`current`/`currentReason`/`onSelect`/`onClose`) — Task 3 정의 ↔ Task 4 사용 일치 ✅
- `ClassRecordModal` props(`cls`/`records`/`onClose`/`onEdit`) — Task 4 정의 ↔ Task 5 사용 일치 ✅
- `updateStatus(sessionId, studentId, status, absenceReason)` — Task 5 정의 ↔ `onEdit` 시그니처 일치 ✅
- `TODAY` 상수 — Task 1 export ↔ Task 4/5 import ✅
