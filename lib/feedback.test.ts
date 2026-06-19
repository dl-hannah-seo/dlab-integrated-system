import { describe, it, expect } from 'vitest';
import type { Student, Feedback } from './mock-data';
import { studentsOfClass, feedbackOf, isPhaseDone, classPhaseRate, classPhaseRates } from './feedback';

const mkStudent = (id: string, class_id: string, status: Student['status'] = '재원'): Student => ({
  id, campus_id: 'campus-001', name: id, grade: '초5', school: 'x',
  parent_phone: '', student_phone: '', status, first_enrolled_at: '2025-01-01',
  source: '지인소개', points: 0, class_id, streak: 0, title: '',
});

const students: Student[] = [
  mkStudent('a', 'cl-01'),
  mkStudent('b', 'cl-01'),
  mkStudent('c', 'cl-01'),
  mkStudent('d', 'cl-01', '퇴원'), // 제외 대상
  mkStudent('e', 'cl-02'),
];

const feedbacks: Feedback[] = [
  { id: 'f1', student_id: 'a', semester_id: 'sem-01', phase: '그리팅', done: true, date: '2026-06-10', memo: '', counselor: '론' },
  { id: 'f2', student_id: 'b', semester_id: 'sem-01', phase: '그리팅', done: true, date: '2026-06-11', memo: '', counselor: '론' },
  { id: 'f3', student_id: 'a', semester_id: 'sem-01', phase: '중간', done: true, date: '2026-06-12', memo: '', counselor: '론' },
];

describe('studentsOfClass', () => {
  it('재원생만, 해당 반만', () => {
    expect(studentsOfClass(students, 'cl-01').map(s => s.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('feedbackOf / isPhaseDone', () => {
  it('레코드 매칭', () => {
    expect(feedbackOf(feedbacks, 'a', 'sem-01', '그리팅')?.id).toBe('f1');
    expect(isPhaseDone(feedbacks, 'a', 'sem-01', '그리팅')).toBe(true);
    expect(isPhaseDone(feedbacks, 'c', 'sem-01', '그리팅')).toBe(false);
    expect(isPhaseDone(feedbacks, 'a', 'sem-01', '파이널')).toBe(false);
  });
});

describe('classPhaseRate', () => {
  it('완료/명단 비율 반올림', () => {
    // cl-01 재원 3명 중 그리팅 2명 완료 = 67%
    expect(classPhaseRate(students, feedbacks, 'cl-01', 'sem-01', '그리팅')).toBe(67);
    // 중간 1명 = 33%
    expect(classPhaseRate(students, feedbacks, 'cl-01', 'sem-01', '중간')).toBe(33);
    // 파이널 0명 = 0%
    expect(classPhaseRate(students, feedbacks, 'cl-01', 'sem-01', '파이널')).toBe(0);
  });
  it('명단 없으면 0', () => {
    expect(classPhaseRate(students, feedbacks, 'cl-99', 'sem-01', '그리팅')).toBe(0);
  });
});

describe('classPhaseRates', () => {
  it('3단계 한 번에', () => {
    const r = classPhaseRates(students, feedbacks, 'cl-01', 'sem-01');
    expect(r.map(x => x.phase)).toEqual(['그리팅', '중간', '파이널']);
    expect(r.map(x => x.rate)).toEqual([67, 33, 0]);
  });
});
