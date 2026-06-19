import type { Student } from './mock-data';

// 퇴원 가능성(이탈 위험) 복합 점수.
// 현재 가용 신호만 사용: 미납 · 낮은 연속출석(streak) · 휴원 상태.
// 가중치는 상수로 고정(설정 UI 비범위).

export type RiskReason = '미납' | '출석저조' | '휴원';

export interface AtRiskEntry {
  student: Student;
  score: number;
  reasons: RiskReason[];
}

const W_UNPAID = 3;
const W_LOW_STREAK = 2;
const W_HIATUS = 2;
/** streak 이하이면 출석저조로 간주 */
export const LOW_STREAK_THRESHOLD = 2;

export function riskReasons(student: Student, unpaidIds: Set<string>): RiskReason[] {
  const out: RiskReason[] = [];
  if (unpaidIds.has(student.id)) out.push('미납');
  if (student.streak <= LOW_STREAK_THRESHOLD) out.push('출석저조');
  if (student.status === '휴원') out.push('휴원');
  return out;
}

export function riskScore(student: Student, unpaidIds: Set<string>): number {
  return (unpaidIds.has(student.id) ? W_UNPAID : 0)
    + (student.streak <= LOW_STREAK_THRESHOLD ? W_LOW_STREAK : 0)
    + (student.status === '휴원' ? W_HIATUS : 0);
}

/**
 * 재원·휴원 학생 중 위험점수 > 0 인 학생을 점수 내림차순(동점은 이름 오름차순)으로 반환.
 * 상위 N 슬라이스는 호출부에서 처리.
 */
export function atRiskStudents(students: Student[], unpaidIds: Set<string>): AtRiskEntry[] {
  return students
    .filter(s => s.status === '재원' || s.status === '휴원')
    .map(s => ({ student: s, score: riskScore(s, unpaidIds), reasons: riskReasons(s, unpaidIds) }))
    .filter(e => e.score > 0)
    .sort((a, b) =>
      b.score === a.score ? a.student.name.localeCompare(b.student.name, 'ko') : b.score - a.score,
    );
}
