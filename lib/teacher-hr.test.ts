import { describe, it, expect } from 'vitest';
import { classesOfTeacher, consultationsByCounselor, attendanceOf, attendanceSummary } from './teacher-hr';
import { classes, consultations, teacherAttendance } from './mock-data';

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
