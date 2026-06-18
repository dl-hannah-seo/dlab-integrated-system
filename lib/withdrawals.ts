import type { Student, WithdrawReason } from './mock-data';

export interface ReasonCount {
  reason: WithdrawReason | '미입력';
  count: number;
}

/** 퇴원 학생만 추출 */
export function withdrawnOf(students: Student[]): Student[] {
  return students.filter(s => s.status === '퇴원');
}

/** 퇴원 사유별 집계 (건수 내림차순, 동수는 이름 오름차순) */
export function withdrawReasonCounts(students: Student[]): ReasonCount[] {
  const map = new Map<WithdrawReason | '미입력', number>();
  for (const s of withdrawnOf(students)) {
    const key = s.withdraw_reason ?? '미입력';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => (b.count === a.count ? String(a.reason).localeCompare(String(b.reason)) : b.count - a.count));
}
