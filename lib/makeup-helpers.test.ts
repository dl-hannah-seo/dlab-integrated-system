import { describe, it, expect } from 'vitest';
import { nextOccurrence, suggestMakeupSlots, buildMakeupMessage } from './makeup-helpers';
import { classes } from './mock-data';

function utcDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000;
}

describe('nextOccurrence', () => {
  it('화목 그룹은 화(2)/목(4) 중 가장 가까운 다음 날을 반환', () => {
    const r = nextOccurrence('화목', '2026-06-14')!;
    expect([2, 4]).toContain(utcDay(r));
    const diff = dayDiff('2026-06-14', r);
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThanOrEqual(7);
  });
  it('토 그룹은 토(6)요일', () => {
    expect(utcDay(nextOccurrence('토', '2026-06-14')!)).toBe(6);
  });
  it('알 수 없는 그룹은 null', () => {
    expect(nextOccurrence('없음', '2026-06-14')).toBeNull();
  });
});

describe('suggestMakeupSlots', () => {
  it('같은 과목·다른 반만, 결석 반은 제외, limit 적용, 날짜 오름차순', () => {
    const absent = classes.find(c => c.id === 'cl-04')!; // 파이썬 기초
    const slots = suggestMakeupSlots('cl-04', '2026-06-14', 3);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.length).toBeLessThanOrEqual(3);
    expect(slots.every(s => s.classId !== 'cl-04')).toBe(true);
    for (const s of slots) {
      const c = classes.find(x => x.id === s.classId)!;
      expect(c.subject_id).toBe(absent.subject_id);
    }
    const dates = slots.map(s => s.date);
    expect([...dates].sort()).toEqual(dates);
  });
  it('존재하지 않는 반은 빈 배열', () => {
    expect(suggestMakeupSlots('no-such', '2026-06-14')).toEqual([]);
  });
});

describe('buildMakeupMessage', () => {
  it('이름·과목·날짜·시간을 문구에 포함', () => {
    const msg = buildMakeupMessage('홍길동', '파이썬 기초', '2026-06-17', '16:00');
    expect(msg).toContain('홍길동');
    expect(msg).toContain('파이썬 기초');
    expect(msg).toContain('2026-06-17');
    expect(msg).toContain('16:00');
  });
});
