import type { Class, ClassGroup, Student, Enrollment, Invoice, InvoiceStatus } from './mock-data';

/** 강의실 미배정 반을 모으는 가상 열 라벨 */
export const UNASSIGNED = '미배정';

/** 고정 시간 축 (수업 유무와 무관하게 표시할 기본 행) */
export const TIME_AXIS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
] as const;

/** 'HHMM' → 'HH:MM' */
export function fmtSlot(slot: string): string {
  return `${slot.slice(0, 2)}:${slot.slice(2)}`;
}

/** 반의 강의실 라벨 (미입력이면 '미배정') */
export function roomLabel(cls: Pick<Class, 'room'>): string {
  const r = cls.room?.trim();
  return r ? r : UNASSIGNED;
}

/** 해당 월·학생·반의 인보이스 상태 (없으면 null) */
export function paymentStatusOf(
  studentId: string,
  classId: string,
  billingMonth: string,
  invoices: Invoice[],
): InvoiceStatus | null {
  const inv = invoices.find(
    i => i.student_id === studentId && i.class_id === classId && i.billing_month === billingMonth,
  );
  return inv ? inv.status : null;
}

/** 선택 요일(day_group)에 편성된, 기준일에 진행 중인(종강 전) 반 */
export function dayGroupClasses(
  dayGroup: string,
  classes: Class[],
  groups: ClassGroup[],
  today: string,
): Class[] {
  return classes.filter(c => {
    const g = groups.find(x => x.id === c.class_group_id);
    if (!g || g.day_group !== dayGroup) return false;
    return c.end_date >= today; // 종강반 제외
  });
}

export interface RosterEntry {
  student: Student;
  paymentStatus: InvoiceStatus | null;
}

/** 반의 활성 수강생 명단 + 결제 상태 */
export function classRoster(
  classId: string,
  enrollments: Enrollment[],
  students: Student[],
  billingMonth: string,
  invoices: Invoice[],
): RosterEntry[] {
  return enrollments
    .filter(e => e.class_id === classId && e.ended_at === null)
    .map(e => students.find(s => s.id === e.student_id))
    .filter((s): s is Student => Boolean(s))
    .map(student => ({
      student,
      paymentStatus: paymentStatusOf(student.id, classId, billingMonth, invoices),
    }));
}

/** 반의 활성 수강 인원 수 */
export function activeCount(classId: string, enrollments: Enrollment[]): number {
  return enrollments.filter(e => e.class_id === classId && e.ended_at === null).length;
}

/** 정원 도달 여부 */
export function isClassFull(cls: Pick<Class, 'id' | 'capacity'>, enrollments: Enrollment[]): boolean {
  return activeCount(cls.id, enrollments) >= cls.capacity;
}

/** 고정 강의실 열 (1~8강의실) */
export const ROOMS = [
  '1강의실', '2강의실', '3강의실', '4강의실',
  '5강의실', '6강의실', '7강의실', '8강의실',
] as const;

const DAY_ORDER = ['토', '화목', '월수금'];
const DAY_LABEL: Record<string, string> = { '토': '토', '화목': '화·목', '월수금': '월·수·금' };

export interface BoardCell {
  cls: Class;
  group: ClassGroup;
  roster: RosterEntry[];
}

export interface BoardRow {
  dayGroup: string;
  time: string;   // 'HH:MM'
  label: string;  // '토 09:00'
  key: string;    // `${dayGroup}|${time}`
}

export interface Board {
  /** 열 — 고정 1~8강의실 (+ 미배정 있으면 맨 끝) */
  rooms: string[];
  /** 행 — 요일·시간 (요일 순 → 시간 순) */
  rows: BoardRow[];
  /** `${room}|${dayGroup}|${time}` → 그 칸의 반들 */
  cells: Record<string, BoardCell[]>;
}

export const boardCellKey = (room: string, rowKey: string) => `${room}|${rowKey}`;

/** 전체 운영 요일을 강의실(열) × 요일·시간(행) 그리드로 구성 */
export function buildBoard(
  classes: Class[],
  groups: ClassGroup[],
  enrollments: Enrollment[],
  students: Student[],
  invoices: Invoice[],
  billingMonth: string,
  today: string,
): Board {
  const cells: Record<string, BoardCell[]> = {};
  const rowMap = new Map<string, BoardRow>();
  let hasUnassigned = false;

  for (const cls of classes) {
    if (cls.end_date < today) continue; // 종강반 제외
    const group = groups.find(g => g.id === cls.class_group_id);
    if (!group) continue;

    const room = roomLabel(cls);
    if (room === UNASSIGNED) hasUnassigned = true;
    const time = fmtSlot(group.time_slot);
    const rowKey = `${group.day_group}|${time}`;

    if (!rowMap.has(rowKey)) {
      rowMap.set(rowKey, {
        dayGroup: group.day_group,
        time,
        label: `${DAY_LABEL[group.day_group] ?? group.day_group} ${time}`,
        key: rowKey,
      });
    }

    const cell: BoardCell = {
      cls,
      group,
      roster: classRoster(cls.id, enrollments, students, billingMonth, invoices),
    };
    (cells[boardCellKey(room, rowKey)] ??= []).push(cell);
  }

  const rooms: string[] = [...ROOMS];
  if (hasUnassigned) rooms.push(UNASSIGNED);

  const dayRank = (d: string) => { const i = DAY_ORDER.indexOf(d); return i < 0 ? 99 : i; };
  const rows = [...rowMap.values()].sort((a, b) =>
    dayRank(a.dayGroup) - dayRank(b.dayGroup) || a.time.localeCompare(b.time),
  );

  return { rooms, rows, cells };
}

/**
 * 학생을 fromClass에서 toClass로 이동.
 * - 원 반의 활성 수강을 종료(ended_at = today)
 * - 대상 반에 과거 퇴반 이력이 있으면 재활성화, 없으면 신규 입반
 * - 이미 대상 반에서 활성 수강 중이면 중복 생성하지 않음
 * 순수 함수 — 새 Enrollment[]를 반환.
 */
export function moveStudent(
  enrollments: Enrollment[],
  studentId: string,
  fromClassId: string,
  toClassId: string,
  today: string,
): Enrollment[] {
  if (fromClassId === toClassId) return enrollments;

  // 1) 원 반 활성 수강 종료
  let next = enrollments.map(e =>
    e.student_id === studentId && e.class_id === fromClassId && e.ended_at === null
      ? { ...e, ended_at: today, end_reason: '반 이동' }
      : e,
  );

  // 2) 대상 반 — 이미 활성이면 그대로
  const alreadyActive = next.some(
    e => e.student_id === studentId && e.class_id === toClassId && e.ended_at === null,
  );
  if (alreadyActive) return next;

  // 3) 과거 퇴반 이력이 있으면 재활성화
  const past = next.find(e => e.student_id === studentId && e.class_id === toClassId && e.ended_at !== null);
  if (past) {
    return next.map(e =>
      e.id === past.id ? { ...e, ended_at: null, end_reason: null } : e,
    );
  }

  // 4) 신규 입반
  next = [
    ...next,
    {
      id: `enr-${studentId}-${toClassId}-${today}`,
      student_id: studentId,
      class_id: toClassId,
      started_at: today,
      ended_at: null,
      end_reason: null,
    },
  ];
  return next;
}
