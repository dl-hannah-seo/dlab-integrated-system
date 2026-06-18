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
