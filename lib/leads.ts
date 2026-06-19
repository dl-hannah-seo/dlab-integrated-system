import { LEAD_STAGES, type Lead, type LeadStage } from './mock-data';

/** 단계별 건수 (LEAD_STAGES 순서) */
export function leadStageCounts(leads: Lead[]): Record<LeadStage, number> {
  const base = LEAD_STAGES.reduce((acc, s) => { acc[s] = 0; return acc; }, {} as Record<LeadStage, number>);
  for (const l of leads) base[l.stage] += 1;
  return base;
}

/** 등록 전환율(%) = 등록 / (등록 + 미등록), 종결 건 없으면 0 */
export function conversionRate(leads: Lead[]): number {
  const enrolled = leads.filter(l => l.stage === '등록').length;
  const lost = leads.filter(l => l.stage === '미등록').length;
  const closed = enrolled + lost;
  return closed === 0 ? 0 : Math.round((enrolled / closed) * 1000) / 10;
}

/** 진행중(미종결) = 신규문의·상담예약·상담완료 */
export function activeLeads(leads: Lead[]): Lead[] {
  return leads.filter(l => l.stage === '신규문의' || l.stage === '상담예약' || l.stage === '상담완료');
}

/** 이번 주 신규 문의 수 (inquiry_date >= weekStart) */
export function newThisWeek(leads: Lead[], weekStart: string): number {
  return leads.filter(l => l.inquiry_date >= weekStart).length;
}

// ── 홍보 → 상담 → 입관 퍼널 (오늘로부터 N일 롤링) ─────────────
// 학기 단위가 아닌 트레일링 윈도우로 집계 (회의 2026-06-18 결정).

/** dateStr이 today 기준 최근 days일 이내인지 */
export function isWithinDays(dateStr: string, today: string, days: number): boolean {
  const d = new Date(dateStr).getTime();
  const t = new Date(today).getTime();
  if (Number.isNaN(d) || Number.isNaN(t)) return false;
  const diff = (t - d) / 86_400_000;
  return diff >= 0 && diff <= days;
}

// 홍보 건수는 시스템 미기록 → 수동 입력. 대시보드/상담 페이지 공유 기본값(최근 90일).
export const DEFAULT_PROMO_90D = 150;

// 상담이 실제 진행된 단계 (상담완료 이상)
const CONSULTED_STAGES: LeadStage[] = ['상담완료', '등록', '미등록'];

export interface RollingFunnel {
  windowDays: number;
  inquiries: number;  // 문의 건수(참고)
  consult: number;    // 상담 진행 = 상담완료+등록+미등록
  enroll: number;     // 입관 = 등록
}

/** 최근 days일 리드를 문의·상담·입관으로 집계 (홍보 건수는 수동 입력이라 별도) */
export function rollingFunnel(leads: Lead[], today: string, days = 90): RollingFunnel {
  const win = leads.filter(l => isWithinDays(l.inquiry_date, today, days));
  return {
    windowDays: days,
    inquiries: win.length,
    consult: win.filter(l => CONSULTED_STAGES.includes(l.stage)).length,
    enroll: win.filter(l => l.stage === '등록').length,
  };
}

/** 전환율(%) = numer / denom, denom 0이면 0 */
export function rate(numer: number, denom: number): number {
  return denom === 0 ? 0 : Math.round((numer / denom) * 1000) / 10;
}
