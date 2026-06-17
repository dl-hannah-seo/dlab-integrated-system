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
