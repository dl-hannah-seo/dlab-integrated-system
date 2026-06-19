import { describe, it, expect } from 'vitest';
import {
  consultationsOf,
  nextConsultId,
  addConsultation,
  updateConsultation,
  removeConsultation,
  consultationGapStudents,
  studentsInScope,
  consultCountInMonth,
  consultCountInDays,
  consultedRate,
} from './consultations';
import type { Consultation, Enrollment, Student } from './mock-data';

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

describe('consultationGapStudents', () => {
  const stu = (id: string, name: string, status: Student['status'] = '재원'): Student =>
    ({
      id, name, campus_id: 'c', grade: '초5', school: 'X', parent_phone: '', student_phone: '',
      status, first_enrolled_at: '2025-01-01', source: '', points: 0, class_id: 'cl-01', streak: 5, title: '',
    } as Student);

  const cons: Consultation[] = [
    { id: 'cons-recent-1', student_id: 'recent', date: '2026-05-20', method: '전화', counselor: '김', content: '' }, // 25일 전
    { id: 'cons-old-1', student_id: 'old', date: '2026-01-10', method: '대면', counselor: '김', content: '' },       // 155일 전
  ];
  const students = [stu('recent', '리'), stu('old', '올'), stu('never', '네'), stu('left', '엘', '퇴원')];
  const asOf = '2026-06-14';

  it('공백 90일 이상 + 상담 없음만, 경과일 내림차순(없음이 최상위)', () => {
    const r = consultationGapStudents(students, cons, asOf, 90);
    // recent(25일)는 제외, 퇴원생 제외 → never(null=최상위), old(155일)
    expect(r.map(e => e.student.id)).toEqual(['never', 'old']);
    expect(r[0].daysSince).toBeNull();
    expect(r[1].daysSince).toBe(155);
  });

  it('재원생만 대상(퇴원 제외)', () => {
    const r = consultationGapStudents(students, cons, asOf, 90);
    expect(r.some(e => e.student.id === 'left')).toBe(false);
  });
});

describe('studentsInScope', () => {
  const stu = (id: string, status: Student['status'] = '재원'): Student =>
    ({
      id, name: id, campus_id: 'c', grade: '초5', school: 'X', parent_phone: '', student_phone: '',
      status, first_enrolled_at: '2025-01-01', source: '', points: 0, class_id: 'cl-01', streak: 0, title: '',
    } as Student);
  const enr = (id: string, student_id: string, class_id: string, ended_at: string | null): Enrollment =>
    ({ id, student_id, class_id, started_at: '2026-03-01', ended_at, end_reason: null });

  const students = [stu('a'), stu('b'), stu('c'), stu('left', '퇴원')];
  const enrollments = [
    enr('e1', 'a', 'cl-01', null),
    enr('e2', 'b', 'cl-02', null),
    enr('e3', 'c', 'cl-01', '2026-04-30'), // 종료된 수강
    enr('e4', 'left', 'cl-01', null),
  ];

  it('classIds=null이면 전체 재원생(퇴원 제외)', () => {
    expect(studentsInScope(students, enrollments, null).map(s => s.id)).toEqual(['a', 'b', 'c']);
  });
  it('classIds 주면 해당 반 진행중 수강 재원생만', () => {
    // cl-01 진행중: a(재원), c는 종료, left는 퇴원 → a만
    expect(studentsInScope(students, enrollments, ['cl-01']).map(s => s.id)).toEqual(['a']);
  });
  it('여러 반 합집합', () => {
    expect(studentsInScope(students, enrollments, ['cl-01', 'cl-02']).map(s => s.id)).toEqual(['a', 'b']);
  });
});

describe('상담 KPI 집계', () => {
  const cons: Consultation[] = [
    { id: '1', student_id: 'a', date: '2026-06-12', method: '전화', counselor: '김', content: '' },
    { id: '2', student_id: 'b', date: '2026-06-08', method: '대면', counselor: '김', content: '' },
    { id: '3', student_id: 'a', date: '2026-05-20', method: '전화', counselor: '김', content: '' },
  ];
  const asOf = '2026-06-14';

  it('consultCountInMonth: 같은 달만', () => {
    expect(consultCountInMonth(cons, asOf)).toBe(2); // 06-12, 06-08
  });
  it('consultCountInDays: 최근 7일(당일 포함)', () => {
    expect(consultCountInDays(cons, asOf, 7)).toBe(2); // 06-08~06-14 → 06-12, 06-08
    expect(consultCountInDays(cons, asOf, 1)).toBe(0); // 06-14 당일만 → 없음
  });
  it('consultedRate: 최근 90일 상담 보유 재원생 비율', () => {
    const stu = (id: string): Student =>
      ({ id, name: id, status: '재원' } as Student);
    // a,b는 상담 있음, c는 없음 → 2/3 = 67%
    expect(consultedRate([stu('a'), stu('b'), stu('c')], cons, asOf, 90)).toBe(67);
    expect(consultedRate([], cons, asOf, 90)).toBe(0);
  });
});
