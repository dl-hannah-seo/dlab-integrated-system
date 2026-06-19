import type { Class, Teacher, Consultation, TeacherAttendance, AttendanceWorkStatus } from './mock-data';

/** 강사가 담당하는 반 */
export function classesOfTeacher(teacherId: string, classes: Class[]): Class[] {
  return classes.filter(c => c.teacher_id === teacherId);
}

// ── 월 급여 자동 산출 ──────────────────────────────────────────
// 주의: 회당 수업시간이 데이터에 없어 표준 상수로 추정한다(추후 론의 산식 확정 시 교체).
export const SESSION_HOURS = 2;        // 회당 수업시간(시간)
export const WEEKS_PER_MONTH = 4.345;  // 월평균 주수(52주 / 12개월)

/** 반 schedule("월·수 09:00")에서 주간 수업 횟수(요일 수) */
export function weeklySessions(cls: Class): number {
  const dayPart = cls.schedule.split(' ')[0] ?? '';
  return dayPart ? dayPart.split('·').filter(Boolean).length : 0;
}

/** 강사의 월 추정 수업 시수 = Σ(반별 주간 횟수) × 회당시간 × 월평균주수 */
export function monthlyTeachingHours(teacherId: string, classes: Class[]): number {
  const weekly = classesOfTeacher(teacherId, classes).reduce((sum, c) => sum + weeklySessions(c), 0);
  return weekly * SESSION_HOURS * WEEKS_PER_MONTH;
}

export interface SalaryBreakdown {
  hours: number;       // 월 추정 시수 (연구원은 0 — 시수 무관)
  basePay: number;     // 연구원: 연봉 ÷ 12 / 튜터: 시급 × 시수 (원, 반올림)
  incentive: number;   // 학기 인센티브
  total: number;       // 월 급여 합계
}

/** 월 급여 자동 산출 — 연구원: 연봉 ÷ 12, 튜터: 시급 × 추정 시수 */
export function monthlySalary(teacher: Teacher, classes: Class[]): SalaryBreakdown {
  const incentive = teacher.incentive ?? 0;
  if (teacher.role === '연구원') {
    const basePay = Math.round((teacher.annual_salary ?? 0) / 12);
    return { hours: 0, basePay, incentive, total: basePay + incentive };
  }
  const hours = monthlyTeachingHours(teacher.id, classes);
  const basePay = Math.round(hours * (teacher.hourly_wage ?? 0));
  return { hours, basePay, incentive, total: basePay + incentive };
}

/** 강사명이 상담자(counselor)인 상담 — 최신순 */
export function consultationsByCounselor(name: string, all: Consultation[]): Consultation[] {
  return all
    .filter(c => c.counselor === name)
    .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
}

/** 강사 근태 — 최신순 */
export function attendanceOf(teacherId: string, records: TeacherAttendance[]): TeacherAttendance[] {
  return records
    .filter(r => r.teacher_id === teacherId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type AttendanceSummary = Record<AttendanceWorkStatus, number>;

const WORK_STATUSES: AttendanceWorkStatus[] = ['정상', '지각', '연차', '병가', '결근'];

/** 근태 상태별 집계 */
export function attendanceSummary(records: TeacherAttendance[]): AttendanceSummary {
  const base = WORK_STATUSES.reduce((acc, s) => { acc[s] = 0; return acc; }, {} as AttendanceSummary);
  for (const r of records) base[r.status] += 1;
  return base;
}
