import { describe, it, expect } from 'vitest';
import type { LeadConsult } from './mock-data';
import {
  consultsOfLead, nextLeadConsultSeq, nextLeadConsultId, addLeadConsult, updateLeadConsult,
} from './lead-consults';

const seed: LeadConsult[] = [
  { id: 'lc-04-2', lead_id: 'lead-04', seq: 2, date: '2026-06-14', memo: 'b' },
  { id: 'lc-04-1', lead_id: 'lead-04', seq: 1, date: '2026-06-10', memo: 'a' },
  { id: 'lc-07-1', lead_id: 'lead-07', seq: 1, date: '2026-06-05', memo: 'c' },
];

describe('consultsOfLead', () => {
  it('해당 리드만 차수 오름차순', () => {
    const r = consultsOfLead(seed, 'lead-04');
    expect(r.map(c => c.seq)).toEqual([1, 2]);
    expect(r.every(c => c.lead_id === 'lead-04')).toBe(true);
  });
  it('기록 없으면 빈 배열', () => {
    expect(consultsOfLead(seed, 'lead-99')).toEqual([]);
  });
});

describe('nextLeadConsultSeq', () => {
  it('최대 차수 + 1', () => {
    expect(nextLeadConsultSeq(seed, 'lead-04')).toBe(3);
    expect(nextLeadConsultSeq(seed, 'lead-07')).toBe(2);
  });
  it('기록 없으면 1차', () => {
    expect(nextLeadConsultSeq(seed, 'lead-99')).toBe(1);
  });
});

describe('nextLeadConsultId', () => {
  it('lc-<suffix>-<seq> 형식', () => {
    expect(nextLeadConsultId(seed, 'lead-04')).toBe('lc-04-3');
    expect(nextLeadConsultId(seed, 'lead-99')).toBe('lc-99-1');
  });
});

describe('add/update', () => {
  it('추가는 새 배열', () => {
    const rec: LeadConsult = { id: 'lc-04-3', lead_id: 'lead-04', seq: 3, date: '2026-06-19', memo: 'd' };
    const next = addLeadConsult(seed, rec);
    expect(next).toHaveLength(seed.length + 1);
    expect(seed).toHaveLength(3);
  });
  it('수정은 해당 id만', () => {
    const next = updateLeadConsult(seed, 'lc-04-1', { memo: 'edited' });
    expect(next.find(c => c.id === 'lc-04-1')?.memo).toBe('edited');
    expect(next.find(c => c.id === 'lc-04-2')?.memo).toBe('b');
  });
});
