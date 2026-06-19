import { describe, it, expect } from 'vitest';
import {
  classesOfTeacher, consultationsByCounselor, attendanceOf, attendanceSummary,
  weeklySessions, monthlyTeachingHours, monthlySalary, SESSION_HOURS, WEEKS_PER_MONTH,
} from './teacher-hr';
import { classes, consultations, teacherAttendance, teachers } from './mock-data';

describe('classesOfTeacher', () => {
  it('teacher_id가 일치하는 반만', () => {
    const r = classesOfTeacher('tch-seed', classes);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(c => c.teacher_id === 'tch-seed')).toBe(true);
  });
});

describe('consultationsByCounselor', () => {
  it('상담자명이 일치하는 상담만, 최신순', () => {
    const r = consultationsByCounselor('씨드', consultations);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(c => c.counselor === '씨드')).toBe(true);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].date >= r[i].date).toBe(true);
  });
});

describe('attendanceOf / attendanceSummary', () => {
  it('강사 근태를 최신순으로', () => {
    const r = attendanceOf('tch-ron', teacherAttendance);
    expect(r.every(x => x.teacher_id === 'tch-ron')).toBe(true);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].date >= r[i].date).toBe(true);
  });
  it('상태별 집계 — 합이 전체와 같다', () => {
    const r = attendanceOf('tch-ron', teacherAttendance);
    const s = attendanceSummary(r);
    expect(s['정상'] + s['지각'] + s['연차'] + s['병가'] + s['결근']).toBe(r.length);
    expect(s['지각']).toBe(1); // ron: 정상2 + 지각1
  });
});

describe('weeklySessions / monthlyTeachingHours / monthlySalary', () => {
  it('schedule의 요일 수 = 주간 수업 횟수', () => {
    expect(weeklySessions({ schedule: '월·수 09:00' } as never)).toBe(2);
    expect(weeklySessions({ schedule: '화 14:00' } as never)).toBe(1);
    expect(weeklySessions({ schedule: '' } as never)).toBe(0);
  });

  it('월 시수 = Σ주간횟수 × 회당시간 × 월평균주수', () => {
    const weekly = classesOfTeacher('tch-seed', classes).reduce((s, c) => s + weeklySessions(c), 0);
    expect(monthlyTeachingHours('tch-seed', classes)).toBeCloseTo(weekly * SESSION_HOURS * WEEKS_PER_MONTH);
  });

  it('월 급여(연구원) = 연봉÷12 + 학기 인센티브', () => {
    const t = teachers.find(x => x.id === 'tch-seed')!; // 연구원
    const r = monthlySalary(t, classes);
    expect(r.basePay).toBe(Math.round((t.annual_salary ?? 0) / 12));
    expect(r.total).toBe(r.basePay + (t.incentive ?? 0));
    expect(r.total).toBeGreaterThan(0);
  });

  it('시급 미설정 강사는 basePay 0', () => {
    const r = monthlySalary({ id: 'x', hourly_wage: undefined, incentive: 100000 } as never, classes);
    expect(r.basePay).toBe(0);
    expect(r.total).toBe(100000);
  });
});
