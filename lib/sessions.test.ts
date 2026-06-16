import { describe, it, expect } from 'vitest';
import { parseDays, addDays, koWeekday, mondayOf, weekDates } from './sessions';

describe('parseDays', () => {
  it('복합 요일 그룹을 분해한다', () => {
    expect(parseDays('화목')).toEqual(['화', '목']);
    expect(parseDays('토')).toEqual(['토']);
    expect(parseDays('월수금')).toEqual(['월', '수', '금']);
  });
});

describe('addDays', () => {
  it('일수를 더하고 빼며 월 경계를 넘는다', () => {
    expect(addDays('2026-07-11', 1)).toBe('2026-07-12');
    expect(addDays('2026-07-01', -1)).toBe('2026-06-30');
  });
});

describe('koWeekday', () => {
  it('ISO 날짜의 한글 요일을 반환한다', () => {
    expect(koWeekday('2026-07-06')).toBe('월'); // 2026-07-06은 월요일
    expect(koWeekday('2026-07-11')).toBe('토');
    expect(koWeekday('2026-07-12')).toBe('일');
  });
});

describe('mondayOf', () => {
  it('해당 주의 월요일을 반환한다 (월요일 시작)', () => {
    expect(mondayOf('2026-07-11')).toBe('2026-07-06'); // 토 → 그 주 월
    expect(mondayOf('2026-07-06')).toBe('2026-07-06'); // 월 → 그대로
    expect(mondayOf('2026-07-12')).toBe('2026-07-06'); // 일 → 직전 월
  });
});

describe('weekDates', () => {
  it('주 시작(월)부터 월~토 6일을 반환한다', () => {
    expect(weekDates('2026-07-06')).toEqual([
      '2026-07-06', '2026-07-07', '2026-07-08',
      '2026-07-09', '2026-07-10', '2026-07-11',
    ]);
  });
});
