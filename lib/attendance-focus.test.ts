import { describe, it, expect } from 'vitest';
import {
  getAbsenceFocusList,
  attendanceHistory,
  initialAttendance,
} from './mock-data';

const CURRENT = ['cl-01', 'cl-02', 'cl-03', 'cl-04', 'cl-05', 'cl-06'];
const records = [...attendanceHistory, ...initialAttendance];

describe('getAbsenceFocusList', () => {
  it('결석 1회 이상 학생만 결석 횟수 내림차순으로 반환한다', () => {
    const list = getAbsenceFocusList(records, CURRENT, 8);
    expect(list.length).toBeGreaterThan(0);
    // 결석 1회 이상만
    expect(list.every(e => e.absentCount >= 1)).toBe(true);
    // 내림차순 정렬
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].absentCount).toBeGreaterThanOrEqual(list[i].absentCount);
    }
  });

  it('지정한 반의 학생만 포함하고 집계 회차는 maxSessions 이하다', () => {
    const list = getAbsenceFocusList(records, CURRENT, 8);
    expect(list.every(e => CURRENT.includes(e.cls.id))).toBe(true);
    expect(list.every(e => e.student.class_id === e.cls.id)).toBe(true);
    expect(list.every(e => e.countedSessions <= 8)).toBe(true);
  });

  it('lastAbsentDate는 ISO(YYYY-MM-DD) 형식이거나 null이다', () => {
    const list = getAbsenceFocusList(records, CURRENT, 8);
    expect(list.every(e =>
      e.lastAbsentDate === null || /^\d{4}-\d{2}-\d{2}$/.test(e.lastAbsentDate)
    )).toBe(true);
  });

  it('빈 classIds면 빈 배열을 반환한다', () => {
    expect(getAbsenceFocusList(records, [], 8)).toEqual([]);
  });
});
