import type { LeadConsult } from './mock-data';

/** 해당 리드의 상담만 차수(seq) 오름차순으로 반환 */
export function consultsOfLead(all: LeadConsult[], leadId: string): LeadConsult[] {
  return all
    .filter(c => c.lead_id === leadId)
    .sort((a, b) => a.seq - b.seq);
}

/** 다음 차수 번호(1차부터) */
export function nextLeadConsultSeq(all: LeadConsult[], leadId: string): number {
  return all
    .filter(c => c.lead_id === leadId)
    .reduce((max, c) => (c.seq > max ? c.seq : max), 0) + 1;
}

/** `lc-<leadSuffix>-<seq>` 결정적 id */
export function nextLeadConsultId(all: LeadConsult[], leadId: string): string {
  const seq = nextLeadConsultSeq(all, leadId);
  const suffix = leadId.replace(/^lead-?/, '');
  return `lc-${suffix}-${seq}`;
}

export function addLeadConsult(all: LeadConsult[], record: LeadConsult): LeadConsult[] {
  return [...all, record];
}

export function updateLeadConsult(
  all: LeadConsult[],
  id: string,
  patch: Partial<Pick<LeadConsult, 'date' | 'memo'>>,
): LeadConsult[] {
  return all.map(c => (c.id === id ? { ...c, ...patch } : c));
}
