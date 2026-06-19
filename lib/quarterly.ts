import { labs, TODAY } from './mock-data';

// ─────────────────────────────────────────────────────────────
// 원장 대시보드 분기 데이터 레이어 (데모)
//
// 5개 분기(현재 → 전년 동일 분기) 손익·학생수·선행지표를 제공한다.
// 기존 월 단위(lib/pnl.ts) · 주 단위(lib/lab-metrics.ts) 자산은 건드리지 않는다.
// 현재 분기는 진행 중 → 매출·지출은 경과분(to-date)이며 inProgress=true.
// 모든 수치는 결정적(랜덤 금지) — 테스트 안정성을 위해 Date.now() 미사용.
// ─────────────────────────────────────────────────────────────

// 로그인 랩장의 랩 (데모: 판교랩 고정 — 실제로는 세션 주입)
export const MY_LAB_ID = 'lab-pg';

// 분기 기준일 — 앱 공통 TODAY에 앵커
export const QUARTER_ASOF = TODAY; // '2026-06-14' → 2026-Q2

// ── 분기 문자열 유틸 ('YYYY-Qn') ─────────────────────────────
export function quarterOf(dateISO: string): string {
  const y = dateISO.slice(0, 4);
  const m = Number(dateISO.slice(5, 7));
  const q = Math.floor((m - 1) / 3) + 1;
  return `${y}-Q${q}`;
}

function partsOf(quarter: string): { year: number; q: number } {
  return { year: Number(quarter.slice(0, 4)), q: Number(quarter.slice(6)) };
}

/** 분기 인덱스(year*4 + q-1) 기준으로 delta 만큼 이동 */
export function shiftQuarter(quarter: string, delta: number): string {
  const { year, q } = partsOf(quarter);
  const idx = year * 4 + (q - 1) + delta;
  const ny = Math.floor(idx / 4);
  const nq = (idx % 4) + 1;
  return `${ny}-Q${nq}`;
}

/** 현재 분기 → 과거로 5개 (오래된 → 최신) */
export function last5Quarters(asOf: string = QUARTER_ASOF): string[] {
  const cur = quarterOf(asOf);
  return [4, 3, 2, 1, 0].map(back => shiftQuarter(cur, -back));
}

export const QUARTERS = last5Quarters(QUARTER_ASOF);
export const CURRENT_QUARTER = quarterOf(QUARTER_ASOF);

const Q_END_MONTH: Record<number, number> = { 1: 3, 2: 6, 3: 9, 4: 12 };
const Q_END_DAY: Record<number, number> = { 1: 31, 2: 30, 3: 30, 4: 31 };
const pad2 = (n: number) => String(n).padStart(2, '0');

export function quarterRange(quarter: string): { start: string; end: string } {
  const { year, q } = partsOf(quarter);
  const startMonth = (q - 1) * 3 + 1;
  return {
    start: `${year}-${pad2(startMonth)}-01`,
    end: `${year}-${pad2(Q_END_MONTH[q])}-${pad2(Q_END_DAY[q])}`,
  };
}

/** '2026-Q2' → '2026년 2분기' */
export function quarterLabel(quarter: string): string {
  const { year, q } = partsOf(quarter);
  return `${year}년 ${q}분기`;
}

/** '2026-Q2' → "25 2Q" 형태의 축 라벨 */
export function quarterShort(quarter: string): string {
  const { year, q } = partsOf(quarter);
  return `${String(year).slice(2)} ${q}Q`;
}

/** 'YYYY-MM-DD' → epoch day(UTC, 결정적) */
function toEpochDay(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day) / 86_400_000;
}

/** 분기 경과율(%) — asOf 당일 포함. 분기 이전 0, 이후 100. */
export function quarterElapsedPct(quarter: string, asOf: string = QUARTER_ASOF): number {
  const { start, end } = quarterRange(quarter);
  const s = toEpochDay(start);
  const e = toEpochDay(end);
  const a = toEpochDay(asOf);
  if (a < s) return 0;
  if (a >= e) return 100;
  const total = e - s + 1;            // 분기 총 일수
  const done = a - s + 1;             // 경과 일수(당일 포함)
  return Math.round((done / total) * 100);
}

export function isCurrentQuarter(quarter: string): boolean {
  return quarter === CURRENT_QUARTER;
}

// ── 손익·학생수 (내 랩, 손으로 작성한 성장 시리즈) ───────────
export interface QuarterPnl {
  quarter: string;
  revenue: number;     // 총매출(원). 현재 분기는 경과분(to-date)
  expense: number;     // 지출(원). 현재 분기는 경과분(to-date)
  profit: number;      // 영업이익 = revenue - expense
  students: number;    // 분기말 재원생 수(현재 분기는 현시점)
  inProgress: boolean;
}

const pnl = (quarter: string, revenue: number, expense: number, students: number): QuarterPnl => ({
  quarter,
  revenue,
  expense,
  profit: revenue - expense,
  students,
  inProgress: isCurrentQuarter(quarter),
});

// QUARTERS = [Q2'25, Q3'25, Q4'25, Q1'26, Q2'26(진행중)]
export const myPnlSeries: QuarterPnl[] = [
  pnl(QUARTERS[0], 33_600_000, 32_400_000, 60),
  pnl(QUARTERS[1], 35_400_000, 33_000_000, 64),
  pnl(QUARTERS[2], 38_700_000, 34_200_000, 68),
  pnl(QUARTERS[3], 40_500_000, 34_800_000, 73),
  pnl(QUARTERS[4], 37_400_000, 31_000_000, 78), // 진행 중 · 경과분
];

export function pnlForQuarter(quarter: string): QuarterPnl | undefined {
  return myPnlSeries.find(p => p.quarter === quarter);
}

// ── 선행지표 4종 (홍보·상담·신규등록·퇴원율) ─────────────────
export type LeadKey = 'promo' | 'consult' | 'newEnroll' | 'withdrawRate';

export const LEAD_KEYS: LeadKey[] = ['promo', 'consult', 'newEnroll', 'withdrawRate'];

export const LEAD_LABELS: Record<LeadKey, string> = {
  promo: '홍보 건수',
  consult: '상담 건수',
  newEnroll: '신규 등록',
  withdrawRate: '퇴원율',
};

/** 퇴원율만 낮을수록 좋음 */
export const LEAD_LOWER_IS_BETTER: Record<LeadKey, boolean> = {
  promo: false, consult: false, newEnroll: false, withdrawRate: true,
};

const LEAD_UNIT: Record<LeadKey, string> = {
  promo: '건', consult: '건', newEnroll: '건', withdrawRate: '%',
};

export function formatLead(key: LeadKey, value: number): string {
  return `${value.toLocaleString('ko-KR')}${LEAD_UNIT[key]}`;
}

export interface QuarterLead {
  quarter: string;
  promo: number;
  consult: number;
  newEnroll: number;
  withdrawRate: number;
  inProgress: boolean;
}

const lead = (
  quarter: string, promo: number, consult: number, newEnroll: number, withdrawRate: number,
): QuarterLead => ({ quarter, promo, consult, newEnroll, withdrawRate, inProgress: isCurrentQuarter(quarter) });

export const myLeadSeries: QuarterLead[] = [
  lead(QUARTERS[0], 130, 95, 32, 6.5),
  lead(QUARTERS[1], 140, 105, 36, 5.8),
  lead(QUARTERS[2], 155, 115, 40, 5.2),
  lead(QUARTERS[3], 160, 120, 44, 4.6),
  lead(QUARTERS[4], 150, 100, 34, 4.2), // 진행 중 · 경과분
];

export function leadForQuarter(quarter: string): QuarterLead | undefined {
  return myLeadSeries.find(l => l.quarter === quarter);
}

// ── 타 캠퍼스 분포 (선행지표 비교용) ─────────────────────────
// 내 랩(lab-pg)은 위 시리즈, 나머지 랩은 결정적 생성으로 분포(min/max/avg)를 만든다.

type LeadBase = Omit<QuarterLead, 'quarter' | 'inProgress'>;

/** 결정적 생성(랜덤 금지) — lab/quarter 인덱스 해시 기반 */
function genLeadBase(labIdx: number, qIdx: number): LeadBase {
  const h = (n: number) => Math.abs((labIdx * 37 + qIdx * 19 + n * 13) % 21); // 0..20
  return {
    promo: 110 + h(1) * 4,                          // 110..190
    consult: 80 + h(2) * 3,                         // 80..140
    newEnroll: 28 + (h(3) % 23),                    // 28..50
    withdrawRate: Math.round((3.5 + (h(4) % 9) * 0.5) * 10) / 10, // 3.5..7.5
  };
}

/** 해당 분기 전체 랩의 key 값 배열 (내 랩 포함) */
function labValuesForQuarter(quarter: string, key: LeadKey): number[] {
  const qIdx = QUARTERS.indexOf(quarter);
  return labs.map((l, labIdx) => {
    if (l.id === MY_LAB_ID) {
      const mine = leadForQuarter(quarter);
      return mine ? mine[key] : genLeadBase(labIdx, qIdx)[key];
    }
    return genLeadBase(labIdx, qIdx)[key];
  });
}

export interface LeadDistribution {
  min: number;
  max: number;
  avg: number;
  mine: number;
}

/** 해당 분기 · 지표의 전체 랩 분포(min/max/평균)와 내 랩 수치 */
export function distributionForQuarter(quarter: string, key: LeadKey): LeadDistribution {
  const vals = labValuesForQuarter(quarter, key);
  const sum = vals.reduce((a, b) => a + b, 0);
  const mine = leadForQuarter(quarter)?.[key] ?? 0;
  return {
    min: Math.min(...vals),
    max: Math.max(...vals),
    avg: Math.round((sum / vals.length) * 10) / 10,
    mine,
  };
}

// ── 금액 포맷 ────────────────────────────────────────────────
/** 37,400,000 → '3,740만' (대시보드 글랜스용 축약) */
export function fmtMan(n: number): string {
  return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만`;
}
