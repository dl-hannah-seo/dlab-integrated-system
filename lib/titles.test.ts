import { describe, it, expect } from 'vitest';
import { TITLES, titleByName, earnedTitleIds, TIER_ORDER } from './titles';
import type { Student } from './mock-data';

const stu = (over: Partial<Student>): Student => ({
  id: 's-x', campus_id: 'c', name: '홍', grade: '초4', school: 'x', parent_phone: '', student_phone: '',
  status: '재원', first_enrolled_at: '2025-01-01', source: '기타', points: 0, class_id: 'cl-01',
  streak: 0, title: '', ...over,
});

describe('TITLES 데이터', () => {
  it('등급·계열·고유 id가 유효', () => {
    const ids = new Set(TITLES.map(t => t.id));
    expect(ids.size).toBe(TITLES.length);
    expect(TITLES.every(t => TIER_ORDER.includes(t.tier))).toBe(true);
    // 질문 계열은 수동, 출석·수상은 자동
    expect(TITLES.filter(t => t.category === '질문').every(t => !t.auto)).toBe(true);
    expect(TITLES.filter(t => t.category === '출석').every(t => t.auto)).toBe(true);
  });
});

describe('earnedTitleIds (데모 자동 판정)', () => {
  it('현재 칭호 + 기본 출석 칭호 보유', () => {
    const ids = earnedTitleIds(stu({ title: '출석왕', streak: 0 }));
    expect(ids.has('t-att-01')).toBe(true); // 등원 한 달 기본
  });
  it('streak에 따라 출석 칭호 추가 지급', () => {
    const low = earnedTitleIds(stu({ streak: 5 }));
    const high = earnedTitleIds(stu({ streak: 15 }));
    expect(low.has('t-att-02')).toBe(false);  // 7 미만
    expect(high.has('t-att-02')).toBe(true);
    expect(high.has('t-att-03')).toBe(true);  // 10+
    expect(high.has('t-att-05')).toBe(true);  // 15+
  });
  it('titleByName 매칭', () => {
    expect(titleByName('출석왕')).toBeUndefined(); // 목록에 없는 레거시 칭호
    expect(titleByName('정시의 파수꾼')?.tier).toBe('일반');
  });
});
