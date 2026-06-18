import type { Student, Purchase } from './mock-data';

/** 레벨 = 누적 포인트 / 300 + 1 */
export const levelOf = (points: number) => Math.floor(points / 300) + 1;

/** 사용 가능 포인트: 시드 balance 우선, 없으면 누적의 40% 파생 */
export const baseBalance = (s: Student) => s.balance ?? Math.round((s.points * 0.4) / 10) * 10;

/** 다음 레벨까지 남은 포인트 */
export const toNextLevel = (points: number) => 300 - (points % 300);

/** 레벨 진행률(%) */
export const levelPct = (points: number) => Math.round(((points % 300) / 300) * 100);

/** 학생 구매 이력 — 최신순 */
export function purchasesOf(studentId: string, all: Purchase[]): Purchase[] {
  return all
    .filter(p => p.student_id === studentId)
    .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
}
