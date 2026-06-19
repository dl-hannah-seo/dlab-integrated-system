import { describe, it, expect } from 'vitest';
import {
  quarterOf,
  shiftQuarter,
  last5Quarters,
  quarterRange,
  quarterLabel,
  quarterShort,
  quarterElapsedPct,
  distributionForQuarter,
  myPnlSeries,
  myLeadSeries,
  CURRENT_QUARTER,
  QUARTERS,
  LEAD_KEYS,
} from './quarterly';

describe('quarterOf', () => {
  it('월을 분기로 매핑한다', () => {
    expect(quarterOf('2026-01-15')).toBe('2026-Q1');
    expect(quarterOf('2026-03-31')).toBe('2026-Q1');
    expect(quarterOf('2026-04-01')).toBe('2026-Q2');
    expect(quarterOf('2026-06-14')).toBe('2026-Q2');
    expect(quarterOf('2026-12-31')).toBe('2026-Q4');
  });
});

describe('shiftQuarter', () => {
  it('분기 경계를 넘어 이동한다', () => {
    expect(shiftQuarter('2026-Q2', -1)).toBe('2026-Q1');
    expect(shiftQuarter('2026-Q1', -1)).toBe('2025-Q4');
    expect(shiftQuarter('2026-Q2', -4)).toBe('2025-Q2');
    expect(shiftQuarter('2025-Q4', 1)).toBe('2026-Q1');
  });
});

describe('last5Quarters', () => {
  it('현재 분기부터 전년 동일 분기까지 5개를 오래된→최신 순으로 준다', () => {
    expect(last5Quarters('2026-06-14')).toEqual([
      '2025-Q2', '2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2',
    ]);
  });
  it('전년 동일 분기로 끝난다(현재 Q2 → 전년 Q2 시작)', () => {
    const qs = last5Quarters('2026-06-14');
    expect(qs[0]).toBe('2025-Q2');
    expect(qs[4]).toBe('2026-Q2');
  });
});

describe('quarterRange', () => {
  it('분기 시작·종료일을 준다', () => {
    expect(quarterRange('2026-Q2')).toEqual({ start: '2026-04-01', end: '2026-06-30' });
    expect(quarterRange('2026-Q1')).toEqual({ start: '2026-01-01', end: '2026-03-31' });
    expect(quarterRange('2025-Q4')).toEqual({ start: '2025-10-01', end: '2025-12-31' });
  });
});

describe('quarterLabel / quarterShort', () => {
  it('표시 문자열을 만든다', () => {
    expect(quarterLabel('2026-Q2')).toBe('2026년 2분기');
    expect(quarterShort('2026-Q2')).toBe('26 2Q');
    expect(quarterShort('2025-Q3')).toBe('25 3Q');
  });
});

describe('quarterElapsedPct', () => {
  it('분기 중간 경과율을 계산한다(2026-Q2, 6/14 기준)', () => {
    // Q2: 4/1~6/30 (91일), 6/14 = 75일째 → 82%
    expect(quarterElapsedPct('2026-Q2', '2026-06-14')).toBe(82);
  });
  it('분기 시작 이전은 0, 종료 이후는 100', () => {
    expect(quarterElapsedPct('2026-Q2', '2026-03-31')).toBe(0);
    expect(quarterElapsedPct('2026-Q2', '2026-07-01')).toBe(100);
    expect(quarterElapsedPct('2026-Q2', '2026-06-30')).toBe(100);
  });
  it('지난 분기는 항상 100', () => {
    expect(quarterElapsedPct('2026-Q1', '2026-06-14')).toBe(100);
  });
});

describe('myPnlSeries / myLeadSeries', () => {
  it('5개 분기를 QUARTERS 순서로 가진다', () => {
    expect(myPnlSeries.map(p => p.quarter)).toEqual(QUARTERS);
    expect(myLeadSeries.map(l => l.quarter)).toEqual(QUARTERS);
  });
  it('현재 분기만 진행 중으로 표시된다', () => {
    expect(myPnlSeries.filter(p => p.inProgress).map(p => p.quarter)).toEqual([CURRENT_QUARTER]);
  });
  it('영업이익 = 매출 - 지출', () => {
    for (const p of myPnlSeries) expect(p.profit).toBe(p.revenue - p.expense);
  });
  it('학생 수가 분기별로 증가(성장 시리즈)', () => {
    const s = myPnlSeries.map(p => p.students);
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1]);
  });
});

describe('distributionForQuarter', () => {
  it('내 랩 수치가 분포(min~max) 안에 있고 mine이 시리즈와 일치한다', () => {
    for (const key of LEAD_KEYS) {
      const d = distributionForQuarter(CURRENT_QUARTER, key);
      expect(d.min).toBeLessThanOrEqual(d.mine);
      expect(d.mine).toBeLessThanOrEqual(d.max);
      expect(d.mine).toBe(myLeadSeries[QUARTERS.length - 1][key]);
    }
  });
  it('결정적이다(같은 입력 → 같은 결과)', () => {
    const a = distributionForQuarter('2025-Q4', 'promo');
    const b = distributionForQuarter('2025-Q4', 'promo');
    expect(a).toEqual(b);
  });
  it('평균은 min과 max 사이에 있다', () => {
    const d = distributionForQuarter(CURRENT_QUARTER, 'consult');
    expect(d.avg).toBeGreaterThanOrEqual(d.min);
    expect(d.avg).toBeLessThanOrEqual(d.max);
  });
});
