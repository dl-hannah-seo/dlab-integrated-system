import { describe, it, expect } from 'vitest';
import {
  fmtSlot, paymentStatusOf, dayGroupClasses, classRoster, buildBoard,
  activeCount, isClassFull, moveStudent, UNASSIGNED,
} from './placement-board';
import type { Class, ClassGroup, Student, Enrollment, Invoice } from './mock-data';

const TODAY = '2026-06-14';
const MONTH = '2026-06';

const group = (id: string, dayGroup: string, slot: string): ClassGroup =>
  ({ id, campus_id: 'c', semester_id: 's1', year: 2026, season: '여름학기', day_group: dayGroup, time_slot: slot } as ClassGroup);

const klass = (id: string, groupId: string, room: string | undefined, opts: Partial<Class> = {}): Class =>
  ({
    id, campus_id: 'c', class_group_id: groupId, course: '파이썬', name: id, teacher: '론',
    team_lead: '케이', capacity: 2, start_date: '2026-06-01', end_date: '2026-08-30',
    schedule: '토 09:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 180000, material_fee: 20000, content_fee: 10000, enrolled_count: 0,
    room, ...opts,
  } as Class);

const stu = (id: string, name: string): Student =>
  ({ id, campus_id: 'c', name, grade: '초5', school: '강남초', parent_phone: '', student_phone: '',
     status: '재원', first_enrolled_at: '2026-03-02', source: '', points: 0, class_id: '', streak: 0, title: '' } as Student);

const enr = (id: string, sid: string, cid: string, ended: string | null = null): Enrollment =>
  ({ id, student_id: sid, class_id: cid, started_at: '2026-03-02', ended_at: ended, end_reason: ended ? '퇴반' : null });

const inv = (sid: string, cid: string, status: Invoice['status'], month = MONTH): Invoice =>
  ({ id: `i-${sid}-${cid}`, student_id: sid, class_id: cid, enrollment_id: 'e', billing_month: month,
     status, tuition_amount: 0, material_amount: 0, content_amount: 0, discount_amount: 0, due_date: '2026-06-01' } as Invoice);

describe('fmtSlot', () => {
  it('HHMM을 HH:MM으로', () => {
    expect(fmtSlot('0900')).toBe('09:00');
    expect(fmtSlot('1730')).toBe('17:30');
  });
});

describe('paymentStatusOf', () => {
  const invoices = [inv('s1', 'c1', '완납'), inv('s2', 'c1', '미납'), inv('s3', 'c1', '완납', '2026-05')];
  it('해당 월·학생·반 인보이스 상태를 반환', () => {
    expect(paymentStatusOf('s1', 'c1', MONTH, invoices)).toBe('완납');
    expect(paymentStatusOf('s2', 'c1', MONTH, invoices)).toBe('미납');
  });
  it('인보이스 없으면 null', () => {
    expect(paymentStatusOf('s9', 'c1', MONTH, invoices)).toBeNull();
    expect(paymentStatusOf('s3', 'c1', MONTH, invoices)).toBeNull(); // 다른 달
  });
});

describe('dayGroupClasses', () => {
  const groups = [group('g-sat', '토', '0900'), group('g-tt', '화목', '1600')];
  const classes = [
    klass('c1', 'g-sat', '1강의실'),
    klass('c2', 'g-tt', '2강의실'),
    klass('c-old', 'g-sat', '1강의실', { end_date: '2025-06-28' }), // 종강
  ];
  it('선택 요일 그룹의 진행 중 반만', () => {
    const r = dayGroupClasses('토', classes, groups, TODAY);
    expect(r.map(c => c.id)).toEqual(['c1']);
  });
  it('다른 요일 그룹은 제외', () => {
    expect(dayGroupClasses('화목', classes, groups, TODAY).map(c => c.id)).toEqual(['c2']);
  });
});

describe('classRoster', () => {
  const students = [stu('s1', '김하나'), stu('s2', '이두리'), stu('s3', '박세찬')];
  const enrollments = [enr('e1', 's1', 'c1'), enr('e2', 's2', 'c1'), enr('e3', 's3', 'c1', '2026-05-01')];
  const invoices = [inv('s1', 'c1', '완납'), inv('s2', 'c1', '미납')];
  it('활성 수강생만 + 결제상태 포함', () => {
    const r = classRoster('c1', enrollments, students, MONTH, invoices);
    expect(r.map(x => x.student.id)).toEqual(['s1', 's2']); // 퇴반(s3) 제외
    expect(r.find(x => x.student.id === 's1')!.paymentStatus).toBe('완납');
    expect(r.find(x => x.student.id === 's2')!.paymentStatus).toBe('미납');
  });
});

describe('buildBoard', () => {
  const groups = [group('g9', '토', '0900'), group('g10', '토', '1000')];
  const classes = [
    klass('c1', 'g9', '1강의실'),
    klass('c2', 'g9', '2강의실'),
    klass('c3', 'g10', undefined), // 강의실 미배정
  ];
  const students = [stu('s1', '김하나'), stu('s2', '이두리')];
  const enrollments = [enr('e1', 's1', 'c1'), enr('e2', 's2', 'c3')];
  const board = buildBoard('토', classes, groups, enrollments, students, [], MONTH, TODAY);

  it('강의실 열에 미배정을 맨 끝에 둔다', () => {
    expect(board.rooms).toEqual(['1강의실', '2강의실', UNASSIGNED]);
  });
  it('등장하는 시간대만 행으로', () => {
    expect(board.times).toEqual(['09:00', '10:00']);
  });
  it('셀은 강의실·시간대로 반을 묶는다', () => {
    expect(board.cells['1강의실|09:00'].map(c => c.cls.id)).toEqual(['c1']);
    expect(board.cells[`${UNASSIGNED}|10:00`].map(c => c.cls.id)).toEqual(['c3']);
    expect(board.cells['1강의실|09:00'][0].roster.map(r => r.student.id)).toEqual(['s1']);
  });
});

describe('activeCount / isClassFull', () => {
  const enrollments = [enr('e1', 's1', 'c1'), enr('e2', 's2', 'c1'), enr('e3', 's3', 'c1', '2026-05-01')];
  it('활성 수강생 수만 센다', () => {
    expect(activeCount('c1', enrollments)).toBe(2);
  });
  it('정원 도달 시 full', () => {
    expect(isClassFull(klass('c1', 'g', '1강의실', { capacity: 2 }), enrollments)).toBe(true);
    expect(isClassFull(klass('c1', 'g', '1강의실', { capacity: 3 }), enrollments)).toBe(false);
  });
});

describe('moveStudent', () => {
  it('원 반 활성 수강을 종료하고 대상 반에 신규 입반', () => {
    const before = [enr('e1', 's1', 'c1')];
    const after = moveStudent(before, 's1', 'c1', 'c2', TODAY);
    const from = after.find(e => e.student_id === 's1' && e.class_id === 'c1')!;
    const to = after.find(e => e.student_id === 's1' && e.class_id === 'c2')!;
    expect(from.ended_at).toBe(TODAY);
    expect(to.ended_at).toBeNull();
  });
  it('대상 반에 과거 퇴반 이력이 있으면 재활성화(중복 생성 안 함)', () => {
    const before = [enr('e1', 's1', 'c1'), enr('e2', 's1', 'c2', '2026-04-01')];
    const after = moveStudent(before, 's1', 'c1', 'c2', TODAY);
    const toRows = after.filter(e => e.student_id === 's1' && e.class_id === 'c2');
    expect(toRows).toHaveLength(1);
    expect(toRows[0].ended_at).toBeNull();
  });
  it('이미 대상 반에서 활성 수강 중이면 원 반만 종료(중복 방지)', () => {
    const before = [enr('e1', 's1', 'c1'), enr('e2', 's1', 'c2')];
    const after = moveStudent(before, 's1', 'c1', 'c2', TODAY);
    expect(after.filter(e => e.student_id === 's1' && e.class_id === 'c2' && e.ended_at === null)).toHaveLength(1);
    expect(after.find(e => e.class_id === 'c1')!.ended_at).toBe(TODAY);
  });
});
