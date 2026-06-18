import { describe, it, expect } from 'vitest';
import { leadStageCounts, conversionRate, activeLeads, newThisWeek } from './leads';
import { leads, LEAD_WEEK_START } from './mock-data';

describe('leadStageCounts', () => {
  it('모든 단계 키를 포함하고 합이 전체와 같다', () => {
    const c = leadStageCounts(leads);
    const sum = Object.values(c).reduce((a, b) => a + b, 0);
    expect(sum).toBe(leads.length);
    expect(c['등록']).toBe(3);
    expect(c['미등록']).toBe(2);
  });
});

describe('conversionRate', () => {
  it('등록/(등록+미등록) = 3/5 = 60%', () => {
    expect(conversionRate(leads)).toBe(60);
  });
  it('종결 건 없으면 0', () => {
    expect(conversionRate([{ ...leads[0], stage: '신규문의' }])).toBe(0);
  });
});

describe('activeLeads', () => {
  it('진행중(신규/예약/완료)만', () => {
    expect(activeLeads(leads).every(l => l.stage !== '등록' && l.stage !== '미등록')).toBe(true);
  });
});

describe('newThisWeek', () => {
  it('이번 주 시작 이후 문의만 카운트', () => {
    const n = newThisWeek(leads, LEAD_WEEK_START);
    expect(n).toBe(leads.filter(l => l.inquiry_date >= LEAD_WEEK_START).length);
    expect(n).toBeGreaterThan(0);
  });
});
