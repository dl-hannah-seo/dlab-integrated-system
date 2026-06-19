import { invoices, type Invoice } from './mock-data';

// 가맹 로열티율 (수강료 대비)
export const ROYALTY_RATE = 0.06;

export type PnlKind = 'revenue' | 'expense';
export type RevenueGroup = '교육매출' | '기타매출';
export type ExpenseGroup = '인건비' | '운영비' | '교육비' | '마케팅비' | '본사정산' | '기타';
export type PnlGroup = RevenueGroup | ExpenseGroup;
export type TaxClass = '면세' | '과세';   // 부가세 면세/과세 — 매출 항목 구분

export const REVENUE_GROUPS: RevenueGroup[] = ['교육매출', '기타매출'];
export const EXPENSE_GROUPS: ExpenseGroup[] = ['인건비', '운영비', '교육비', '마케팅비', '본사정산', '기타'];
export const TAX_CLASSES: TaxClass[] = ['면세', '과세'];

export interface PnlLine {
  id: string;
  kind: PnlKind;
  group: PnlGroup;
  label: string;
  amount: number;
  auto?: boolean;        // 자동 산출(읽기전용)
  tax?: TaxClass;        // 매출 항목의 면세/과세 구분 (지출은 미사용)
}

/** 청구 데이터에서 자동 산출되는 매출/본사정산 (환불 제외) */
export function autoLines(inv: Invoice[]): PnlLine[] {
  const billable = inv.filter(i => i.status !== '환불');
  const tuition = billable.reduce((s, i) => s + i.tuition_amount, 0);
  const material = billable.reduce((s, i) => s + i.material_amount, 0);
  const content = billable.reduce((s, i) => s + i.content_amount, 0);
  const royalty = Math.round(tuition * ROYALTY_RATE);
  return [
    { id: 'pnl-rev-tuition', kind: 'revenue', group: '교육매출', label: '수강료', amount: tuition, auto: true, tax: '면세' },
    { id: 'pnl-rev-material', kind: 'revenue', group: '교육매출', label: '교구비(키트)', amount: material, auto: true, tax: '과세' },
    { id: 'pnl-exp-royalty', kind: 'expense', group: '본사정산', label: `로열티 (${Math.round(ROYALTY_RATE * 100)}%)`, amount: royalty, auto: true },
    { id: 'pnl-exp-content', kind: 'expense', group: '본사정산', label: '콘텐츠 사용료', amount: content, auto: true },
  ];
}

// 편집 가능한 시드 라인 (랩장 시트 대체 — 데모 기본값)
const SEED_LINES: PnlLine[] = [
  // 교육매출 (교육용역 = 면세)
  { id: 'pnl-rev-special', kind: 'revenue', group: '교육매출', label: '특강비', amount: 1_200_000, tax: '면세' },
  { id: 'pnl-rev-camp', kind: 'revenue', group: '교육매출', label: '캠프/방학특강', amount: 800_000, tax: '면세' },
  { id: 'pnl-rev-contest', kind: 'revenue', group: '교육매출', label: '대회 참가비', amount: 150_000, tax: '면세' },
  { id: 'pnl-rev-oneonone', kind: 'revenue', group: '교육매출', label: '1:1 수업료', amount: 600_000, tax: '면세' },
  // 기타매출 (물품·위약금 = 과세 / 지원금 = 면세)
  { id: 'pnl-rev-goods', kind: 'revenue', group: '기타매출', label: '물품 판매', amount: 200_000, tax: '과세' },
  { id: 'pnl-rev-hqsupport', kind: 'revenue', group: '기타매출', label: '본사 지원금', amount: 300_000, tax: '면세' },
  { id: 'pnl-rev-event', kind: 'revenue', group: '기타매출', label: '이벤트 지원금', amount: 100_000, tax: '면세' },
  { id: 'pnl-rev-penalty', kind: 'revenue', group: '기타매출', label: '환불 위약금', amount: 50_000, tax: '과세' },
  // 인건비
  { id: 'pnl-exp-salary', kind: 'expense', group: '인건비', label: '정직원 급여', amount: 4_500_000 },
  { id: 'pnl-exp-tutor', kind: 'expense', group: '인건비', label: '튜터 급여', amount: 1_800_000 },
  { id: 'pnl-exp-incentive', kind: 'expense', group: '인건비', label: '인센티브', amount: 400_000 },
  { id: 'pnl-exp-insurance', kind: 'expense', group: '인건비', label: '4대보험', amount: 600_000 },
  // 운영비
  { id: 'pnl-exp-rent', kind: 'expense', group: '운영비', label: '임대료', amount: 2_000_000 },
  { id: 'pnl-exp-mgmt', kind: 'expense', group: '운영비', label: '관리비', amount: 300_000 },
  { id: 'pnl-exp-utility', kind: 'expense', group: '운영비', label: '공과금(전기/수도/인터넷)', amount: 250_000 },
  { id: 'pnl-exp-rental', kind: 'expense', group: '운영비', label: '렌탈/청소', amount: 150_000 },
  // 교육비
  { id: 'pnl-exp-kit', kind: 'expense', group: '교육비', label: '교구 구입비', amount: 350_000 },
  { id: 'pnl-exp-textbook', kind: 'expense', group: '교육비', label: '교재 제작비', amount: 200_000 },
  { id: 'pnl-exp-material', kind: 'expense', group: '교육비', label: '수업 재료비', amount: 150_000 },
  // 마케팅비
  { id: 'pnl-exp-naver', kind: 'expense', group: '마케팅비', label: '네이버 광고', amount: 400_000 },
  { id: 'pnl-exp-sns', kind: 'expense', group: '마케팅비', label: 'SNS 광고', amount: 300_000 },
  { id: 'pnl-exp-banner', kind: 'expense', group: '마케팅비', label: '현수막/전단', amount: 150_000 },
  // 기타
  { id: 'pnl-exp-cardfee', kind: 'expense', group: '기타', label: '카드 수수료', amount: 180_000 },
  { id: 'pnl-exp-tax', kind: 'expense', group: '기타', label: '세금', amount: 250_000 },
];

export function buildPnlLines(inv: Invoice[] = invoices): PnlLine[] {
  return [...autoLines(inv), ...SEED_LINES];
}

export interface PnlSummary {
  totalRevenue: number;
  totalLabor: number;
  totalOps: number;
  totalMarketing: number;
  totalExpense: number;
  operatingProfit: number;
  opMargin: number;   // %
  laborRatio: number; // %
  taxExemptRevenue: number; // 면세 매출 합계
  taxableRevenue: number;   // 과세 매출 합계
}

const sumGroup = (lines: PnlLine[], group: PnlGroup) =>
  lines.filter(l => l.group === group).reduce((s, l) => s + l.amount, 0);

/** 매출 라인을 면세/과세별로 합산 (지출·매출 외 항목은 무시) */
export function revenueByTax(lines: PnlLine[], tax: TaxClass): number {
  return lines.filter(l => l.kind === 'revenue' && l.tax === tax).reduce((s, l) => s + l.amount, 0);
}

export function summarize(lines: PnlLine[]): PnlSummary {
  const totalRevenue = lines.filter(l => l.kind === 'revenue').reduce((s, l) => s + l.amount, 0);
  const totalExpense = lines.filter(l => l.kind === 'expense').reduce((s, l) => s + l.amount, 0);
  const totalLabor = sumGroup(lines, '인건비');
  const totalOps = sumGroup(lines, '운영비');
  const totalMarketing = sumGroup(lines, '마케팅비');
  const operatingProfit = totalRevenue - totalExpense;
  const pct = (a: number) => (totalRevenue === 0 ? 0 : Math.round((a / totalRevenue) * 1000) / 10);
  return {
    totalRevenue, totalLabor, totalOps, totalMarketing, totalExpense,
    operatingProfit, opMargin: pct(operatingProfit), laborRatio: pct(totalLabor),
    taxExemptRevenue: revenueByTax(lines, '면세'),
    taxableRevenue: revenueByTax(lines, '과세'),
  };
}

export function groupTotal(lines: PnlLine[], group: PnlGroup): number {
  return sumGroup(lines, group);
}

export function fmt(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

// ── 월별 손익 추이 (임시 목업) ───────────────────────────────
// TEMP: 실제 월별 집계 연동 전까지 사용하는 데모 데이터.
export interface MonthlyPnl {
  month: string;     // YYYY-MM
  revenue: number;
  expense: number;
  profit: number;    // revenue - expense
}

const mp = (month: string, revenue: number, expense: number): MonthlyPnl =>
  ({ month, revenue, expense, profit: revenue - expense });

export const MONTHLY_PNL: MonthlyPnl[] = [
  mp('2026-01', 12_000_000, 11_200_000),
  mp('2026-02', 12_800_000, 11_400_000),
  mp('2026-03', 13_500_000, 11_800_000),
  mp('2026-04', 13_000_000, 12_000_000),
  mp('2026-05', 14_200_000, 12_100_000),
  mp('2026-06', 15_000_000, 12_300_000),
];

export const CURRENT_MONTH = '2026-06';

export function monthShort(m: string): string {
  return `${Number(m.slice(5, 7))}월`;
}

export function monthMargin(m: MonthlyPnl): number {
  return m.revenue === 0 ? 0 : Math.round((m.profit / m.revenue) * 1000) / 10;
}
