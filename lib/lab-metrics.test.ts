import { describe, it, expect } from 'vitest';
import {
  metricsForWeek, labMetricForWeek, averageOf, deltaVsAverage, averagesForWeek,
  rankOf, funnelOf, buildInsights, type MetricAverages,
} from './lab-metrics';
import { LAB_CURRENT_WEEK, labs, type LabWeeklyMetric } from './mock-data';

describe('metricsForWeek / labMetricForWeek', () => {
  it('이번 주는 모든 랩의 지표를 반환', () => {
    expect(metricsForWeek(LAB_CURRENT_WEEK).length).toBe(labs.length);
  });
  it('판교랩 이번 주 시연 이상치(홍보 12, 문의 4)', () => {
    const m = labMetricForWeek('lab-pg', LAB_CURRENT_WEEK)!;
    expect(m.promo_count).toBe(12);
    expect(m.promo_sns).toBe(8);
    expect(m.promo_blog).toBe(4);
    expect(m.inquiry_count).toBe(4);
  });
});

describe('averageOf / deltaVsAverage', () => {
  it('홍보 평균 = 6.5', () => {
    expect(averageOf(metricsForWeek(LAB_CURRENT_WEEK), 'promo_count')).toBe(6.5);
  });
  it('델타 = 개인-평균', () => {
    expect(deltaVsAverage(12, 6.5)).toBe(5.5);
  });
});

describe('rankOf', () => {
  it('홍보는 판교(12)가 1위', () => {
    const r = rankOf('lab-pg', LAB_CURRENT_WEEK, 'promo_count')!;
    expect(r.rank).toBe(1);
    expect(r.total).toBe(labs.length);
  });
  it('퇴원율은 낮을수록 상위 — 판교(7%)는 최하위권', () => {
    const r = rankOf('lab-pg', LAB_CURRENT_WEEK, 'withdraw_rate')!;
    expect(r.rank).toBe(labs.length); // 가장 높은 퇴원율 = 꼴찌
  });
});

describe('funnelOf', () => {
  it('홍보→문의, 문의→등록 전환율 계산', () => {
    const m = labMetricForWeek('lab-pg', LAB_CURRENT_WEEK)!;
    const f = funnelOf(m);
    expect(f.promo).toBe(12);
    expect(f.inquiry).toBe(4);
    expect(f.promoToInquiry).toBeCloseTo(33.3, 1); // 4/12
    expect(f.inquiryToEnroll).toBe(50);            // 2/4
  });
});

describe('buildInsights', () => {
  const avg: MetricAverages = averagesForWeek(LAB_CURRENT_WEEK);

  it('판교랩: 홍보↑문의↓ 품질 경고 + 출결↓퇴원↑ 이탈 경고', () => {
    const my = labMetricForWeek('lab-pg', LAB_CURRENT_WEEK)!;
    const ins = buildInsights(my, avg);
    expect(ins.some(i => i.tone === 'warn' && i.text.includes('홍보'))).toBe(true);
    expect(ins.some(i => i.tone === 'warn' && i.text.includes('퇴원율'))).toBe(true);
    expect(ins.every(i => i.action === undefined || typeof i.action === 'string')).toBe(true);
  });

  it('우수 랩(분당): 등록 우수 긍정 인사이트', () => {
    const my = labMetricForWeek('lab-bd', LAB_CURRENT_WEEK)!;
    expect(buildInsights(my, avg).some(i => i.tone === 'good')).toBe(true);
  });

  it('인사이트는 항상 최소 1개', () => {
    const flat: LabWeeklyMetric = {
      lab_id: 'lab-z', week: LAB_CURRENT_WEEK,
      promo_count: 6, promo_sns: 3, promo_blog: 3, inquiry_count: 10,
      new_enroll_count: 4, re_enroll_count: 3, attendance_rate: 91,
      makeup_count: 2, makeup_done_rate: 90, withdraw_rate: 4, payment_collection_rate: 88,
    };
    expect(buildInsights(flat, avg).length).toBeGreaterThanOrEqual(1);
  });
});
