import type { Class, Consultation, TeacherAttendance, AttendanceWorkStatus } from './mock-data';

/** 강사가 담당하는 반 */
export function classesOfTeacher(teacherId: string, classes: Class[]): Class[] {
  return classes.filter(c => c.teacher_id === teacherId);
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
