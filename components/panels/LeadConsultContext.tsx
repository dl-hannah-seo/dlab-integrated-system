'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { leadConsults as seed, TODAY, type LeadConsult } from '@/lib/mock-data';
import { addLeadConsult, updateLeadConsult, nextLeadConsultId, nextLeadConsultSeq } from '@/lib/lead-consults';

interface LeadConsultCtx {
  consults: LeadConsult[];
  /** 다음 차수 상담 추가 → 추가된 레코드 반환 */
  addConsult: (leadId: string, memo: string, date?: string) => LeadConsult;
  editConsult: (id: string, patch: Partial<Pick<LeadConsult, 'date' | 'memo'>>) => void;
}

const Ctx = createContext<LeadConsultCtx | null>(null);

export function LeadConsultProvider({ children }: { children: React.ReactNode }) {
  const [consults, setConsults] = useState<LeadConsult[]>(seed);

  const addConsult = useCallback((leadId: string, memo: string, date = TODAY): LeadConsult => {
    const rec: LeadConsult = {
      id: nextLeadConsultId(consults, leadId),
      lead_id: leadId,
      seq: nextLeadConsultSeq(consults, leadId),
      date,
      memo: memo.trim(),
    };
    setConsults(prev => addLeadConsult(prev, rec));
    return rec;
  }, [consults]);

  const editConsult = useCallback((id: string, patch: Partial<Pick<LeadConsult, 'date' | 'memo'>>) => {
    setConsults(prev => updateLeadConsult(prev, id, patch));
  }, []);

  return <Ctx.Provider value={{ consults, addConsult, editConsult }}>{children}</Ctx.Provider>;
}

export function useLeadConsults() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLeadConsults must be used within LeadConsultProvider');
  return ctx;
}
