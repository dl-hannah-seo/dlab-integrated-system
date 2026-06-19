import { describe, it, expect } from 'vitest';
import { leadStageCounts, conversionRate, activeLeads, newThisWeek, isWithinDays, rollingFunnel, rate } from './leads';
import { leads, LEAD_WEEK_START, TODAY } from './mock-data';

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

describe('isWithinDays', () => {
  it('윈도우 경계·미래·범위 밖', () => {
    expect(isWithinDays('2026-06-14', '2026-06-14', 90)).toBe(true);   // 당일
    expect(isWithinDays('2026-03-16', '2026-06-14', 90)).toBe(true);   // 90일 경계 내
    expect(isWithinDays('2026-03-01', '2026-06-14', 90)).toBe(false);  // 90일 밖
    expect(isWithinDays('2026-06-20', '2026-06-14', 90)).toBe(false);  // 미래
  });
});

describe('rollingFunnel', () => {
  it('최근 90일 문의/상담/입관 집계 (입관=등록, consult≥enroll)', () => {
    const f = rollingFunnel(leads, TODAY, 90);
    expect(f.windowDays).toBe(90);
    expect(f.enroll).toBe(3);                 // 등록 3
    expect(f.consult).toBeGreaterThanOrEqual(f.enroll);
    expect(f.inquiries).toBeGreaterThanOrEqual(f.consult);
  });
  it('윈도우 0일이면 미래·과거 모두 제외되어 당일만', () => {
    const f = rollingFunnel(leads, '2020-01-01', 90);
    expect(f.inquiries).toBe(0);
  });
});

describe('rate', () => {
  it('전환율 계산, 분모 0이면 0', () => {
    expect(rate(3, 12)).toBe(25);
    expect(rate(1, 3)).toBe(33.3);
    expect(rate(5, 0)).toBe(0);
  });
});
