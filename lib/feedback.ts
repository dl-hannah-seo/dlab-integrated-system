import type { Student, Feedback, FeedbackPhase } from './mock-data';
import { FEEDBACK_PHASES } from './mock-data';

/** 해당 반 재원생 명단 (class_id 직접 매칭) */
export function studentsOfClass(students: Student[], classId: string): Student[] {
  return students.filter(s => s.class_id === classId && s.status === '재원');
}

/** (학생·학기·단계) 피드백 레코드 — 없으면 undefined */
export function feedbackOf(
  feedbacks: Feedback[],
  studentId: string,
  semesterId: string,
  phase: FeedbackPhase,
): Feedback | undefined {
  return feedbacks.find(
    f => f.student_id === studentId && f.semester_id === semesterId && f.phase === phase,
  );
}

/** 해당 단계 완료 여부 */
export function isPhaseDone(
  feedbacks: Feedback[],
  studentId: string,
  semesterId: string,
  phase: FeedbackPhase,
): boolean {
  return feedbackOf(feedbacks, studentId, semesterId, phase)?.done ?? false;
}

/**
 * 반·단계별 완료율(%) — 반올림 정수. 명단이 비면 0.
 * 분자 = 해당 단계 완료 학생 수, 분모 = 반 재원생 수.
 */
export function classPhaseRate(
  students: Student[],
  feedbacks: Feedback[],
  classId: string,
  semesterId: string,
  phase: FeedbackPhase,
): number {
  const roster = studentsOfClass(students, classId);
  if (roster.length === 0) return 0;
  const done = roster.filter(s => isPhaseDone(feedbacks, s.id, semesterId, phase)).length;
  return Math.round((done / roster.length) * 100);
}

/** 반의 그리팅·중간·파이널 완료율 3종 한 번에 */
export function classPhaseRates(
  students: Student[],
  feedbacks: Feedback[],
  classId: string,
  semesterId: string,
): { phase: FeedbackPhase; rate: number }[] {
  return FEEDBACK_PHASES.map(phase => ({
    phase,
    rate: classPhaseRate(students, feedbacks, classId, semesterId, phase),
  }));
}
