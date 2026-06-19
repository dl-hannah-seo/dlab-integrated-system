import { describe, it, expect } from 'vitest';
import { autoLines, buildPnlLines, summarize, groupTotal, revenueByTax, ROYALTY_RATE, type PnlLine } from './pnl';
import { invoices } from './mock-data';

describe('autoLines', () => {
  it('수강료/교구비/로열티/콘텐츠를 환불 제외하고 산출', () => {
    const lines = autoLines(invoices);
    const tuition = lines.find(l => l.id === 'pnl-rev-tuition')!;
    const royalty = lines.find(l => l.id === 'pnl-exp-royalty')!;
    expect(tuition.amount).toBeGreaterThan(0);
    expect(tuition.auto).toBe(true);
    expect(royalty.amount).toBe(Math.round(tuition.amount * ROYALTY_RATE));
  });
});

describe('summarize', () => {
  const lines: PnlLine[] = [
    { id: 'r1', kind: 'revenue', group: '교육매출', label: '수강료', amount: 10_000_000 },
    { id: 'r2', kind: 'revenue', group: '기타매출', label: '물품', amount: 1_000_000 },
    { id: 'e1', kind: 'expense', group: '인건비', label: '급여', amount: 4_000_000 },
    { id: 'e2', kind: 'expense', group: '운영비', label: '임대료', amount: 2_000_000 },
    { id: 'e3', kind: 'expense', group: '마케팅비', label: '광고', amount: 500_000 },
  ];
  it('총매출·총지출·영업이익·이익률·인건비율', () => {
    const s = summarize(lines);
    expect(s.totalRevenue).toBe(11_000_000);
    expect(s.totalExpense).toBe(6_500_000);
    expect(s.totalLabor).toBe(4_000_000);
    expect(s.totalOps).toBe(2_000_000);
    expect(s.totalMarketing).toBe(500_000);
    expect(s.operatingProfit).toBe(4_500_000);
    expect(s.opMargin).toBeCloseTo(40.9, 1);   // 4.5M/11M
    expect(s.laborRatio).toBeCloseTo(36.4, 1);  // 4M/11M
  });
  it('매출 0이면 비율 0', () => {
    expect(summarize([{ id: 'e', kind: 'expense', group: '기타', label: 'x', amount: 100 }]).opMargin).toBe(0);
  });
});

describe('buildPnlLines / groupTotal', () => {
  it('자동 + 시드 라인을 합쳐 반환', () => {
    const lines = buildPnlLines(invoices);
    expect(lines.some(l => l.auto)).toBe(true);
    expect(groupTotal(lines, '인건비')).toBe(4_500_000 + 1_800_000 + 400_000 + 600_000);
  });
});

describe('면세/과세 구분', () => {
  it('autoLines: 수강료=면세, 교구비=과세', () => {
    const lines = autoLines(invoices);
    expect(lines.find(l => l.id === 'pnl-rev-tuition')!.tax).toBe('면세');
    expect(lines.find(l => l.id === 'pnl-rev-material')!.tax).toBe('과세');
  });

  it('모든 매출 라인은 면세/과세가 지정되어 있다', () => {
    const revenue = buildPnlLines(invoices).filter(l => l.kind === 'revenue');
    expect(revenue.length).toBeGreaterThan(0);
    expect(revenue.every(l => l.tax === '면세' || l.tax === '과세')).toBe(true);
  });

  it('revenueByTax: 매출만 합산, 지출은 무시', () => {
    const lines: PnlLine[] = [
      { id: 'r1', kind: 'revenue', group: '교육매출', label: '수강료', amount: 1000, tax: '면세' },
      { id: 'r2', kind: 'revenue', group: '기타매출', label: '물품', amount: 300, tax: '과세' },
      { id: 'r3', kind: 'revenue', group: '교육매출', label: '특강', amount: 500, tax: '면세' },
      { id: 'e1', kind: 'expense', group: '기타', label: '세금', amount: 999, tax: '과세' as never },
    ];
    expect(revenueByTax(lines, '면세')).toBe(1500);
    expect(revenueByTax(lines, '과세')).toBe(300);
  });

  it('summarize: 면세+과세 소계 합이 총매출과 같다', () => {
    const s = summarize(buildPnlLines(invoices));
    expect(s.taxExemptRevenue + s.taxableRevenue).toBe(s.totalRevenue);
    expect(s.taxExemptRevenue).toBeGreaterThan(0);
    expect(s.taxableRevenue).toBeGreaterThan(0);
  });
});
