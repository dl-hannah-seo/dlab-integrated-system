import { describe, it, expect } from 'vitest';
import { levelOf, baseBalance, toNextLevel, levelPct, purchasesOf } from './kiosk';
import { purchases } from './mock-data';
import type { Student } from './mock-data';

const stu = (over: Partial<Student>): Student => ({
  id: 's-x', campus_id: 'c', name: '홍', grade: '초4', school: 'x', parent_phone: '', student_phone: '',
  status: '재원', first_enrolled_at: '2025-01-01', source: '기타', points: 0, class_id: 'cl-01',
  streak: 0, title: '', ...over,
});

describe('레벨/포인트 헬퍼', () => {
  it('levelOf: 300당 1레벨', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(300)).toBe(2);
    expect(levelOf(620)).toBe(3);
  });
  it('baseBalance: balance 우선, 없으면 40% 파생', () => {
    expect(baseBalance(stu({ balance: 500 }))).toBe(500);
    expect(baseBalance(stu({ points: 1000 }))).toBe(400);
  });
  it('toNextLevel / levelPct', () => {
    expect(toNextLevel(250)).toBe(50);
    expect(levelPct(150)).toBe(50);
  });
});

describe('purchasesOf', () => {
  it('해당 학생 구매만 최신순', () => {
    const r = purchasesOf('s-01', purchases);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(p => p.student_id === 's-01')).toBe(true);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].date >= r[i].date).toBe(true);
  });
});
