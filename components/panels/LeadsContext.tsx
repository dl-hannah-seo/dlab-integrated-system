'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { leads as seedLeads, TODAY, type Lead, type LeadStage } from '@/lib/mock-data';

let seq = 0;

export type NewLead = {
  name: string;
  parent_phone: string;
  grade?: string;
  source: string;
  interest_subject: string;
  stage?: LeadStage;
  memo?: string;
};

interface LeadsCtx {
  leads: Lead[];
  addLead: (data: NewLead) => Lead;
  updateStage: (id: string, stage: LeadStage) => void;
}

const LeadsContext = createContext<LeadsCtx | null>(null);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(seedLeads);

  const addLead = useCallback((data: NewLead): Lead => {
    seq += 1;
    const lead: Lead = {
      id: `lead-new-${seq}`,
      name: data.name.trim(),
      parent_phone: data.parent_phone || '010-1234-5678',
      grade: data.grade || undefined,
      source: data.source,
      interest_subject: data.interest_subject,
      stage: data.stage ?? '신규문의',
      inquiry_date: TODAY,
      memo: data.memo || undefined,
    };
    setLeads(prev => [lead, ...prev]);
    return lead;
  }, []);

  const updateStage = useCallback((id: string, stage: LeadStage) => {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, stage } : l)));
  }, []);

  return <LeadsContext.Provider value={{ leads, addLead, updateStage }}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeads must be used within LeadsProvider');
  return ctx;
}
