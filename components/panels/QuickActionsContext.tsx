'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export interface SmsRecipient {
  studentId: string;
  name: string;
  phone: string;
}

export type SmsTemplate = 'absence' | 'unpaid' | 'custom';

export interface SmsConfig {
  recipients: SmsRecipient[];
  template: SmsTemplate;
}

export type AttendanceOverride = 'attend' | 'late' | 'absent';

interface QuickActionsCtx {
  activePanel: 'attendance' | 'sms' | null;
  openAttendance: () => void;
  openSms: (config?: SmsConfig) => void;
  close: () => void;
  smsConfig: SmsConfig | null;
  attendanceOverrides: Record<string, AttendanceOverride>;
  setOverride: (studentId: string, status: AttendanceOverride) => void;
}

const QuickActionsContext = createContext<QuickActionsCtx | null>(null);

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<'attendance' | 'sms' | null>(null);
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceOverride>>({});

  const openAttendance = useCallback(() => setActivePanel('attendance'), []);

  const openSms = useCallback((config?: SmsConfig) => {
    if (config) setSmsConfig(config);
    setActivePanel('sms');
  }, []);

  const close = useCallback(() => setActivePanel(null), []);

  const setOverride = useCallback((studentId: string, status: AttendanceOverride) => {
    setAttendanceOverrides(prev => ({ ...prev, [studentId]: status }));
  }, []);

  return (
    <QuickActionsContext.Provider value={{
      activePanel, openAttendance, openSms, close,
      smsConfig, attendanceOverrides, setOverride,
    }}>
      {children}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions() {
  const ctx = useContext(QuickActionsContext);
  if (!ctx) throw new Error('useQuickActions must be used within QuickActionsProvider');
  return ctx;
}
