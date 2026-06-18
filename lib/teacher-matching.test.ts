import { describe, it, expect } from 'vitest';
import { canTeach, eligibleTeachers, eligibleClasses } from './teacher-matching';
import type { Class, Teacher } from './mock-data';

const teacher = (over: Partial<Teacher>): Teacher => ({
  id: 't1', campus_id: 'c', name: '홍', role: '강사', subject_ids: ['sub-python'], status: '재직', ...over,
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
