'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export interface SmsRecipient {
  studentId: string;
  name: string;
  phone: string;
}

export type SmsTemplate = 'absence' | 'unpaid' | 'makeup' | 'custom';

export interface SmsConfig {
  recipients: SmsRecipient[];
  template: SmsTemplate;
  /** 있으면 템플릿 기본 문구 대신 이 문구로 채운다 (보강 안내처럼 동적 문구용) */
  message?: string;
}

export type AttendanceOverride = 'attend' | 'late' | 'absent';

interface QuickActionsCtx {
  activePanel: 'attendance' | 'sms' | 'recording' | null;
  openAttendance: () => void;
  openSms: (config?: SmsConfig) => void;
  openRecording: (mode?: 'class' | 'consult') => void;
  recordingMode: 'class' | 'consult';
  close: () => void;
  smsConfig: SmsConfig | null;
  attendanceOverrides: Record<string, AttendanceOverride>;
  setOverride: (studentId: string, status: AttendanceOverride) => void;
}

const QuickActionsContext = createContext<QuickActionsCtx | null>(null);

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<'attendance' | 'sms' | 'recording' | null>(null);
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceOverride>>({});
  const [recordingMode, setRecordingMode] = useState<'class' | 'consult'>('class');

  const openAttendance = useCallback(() => setActivePanel('attendance'), []);

  const openSms = useCallback((config?: SmsConfig) => {
    if (config) setSmsConfig(config);
    setActivePanel('sms');
  }, []);

  const openRecording = useCallback((mode: 'class' | 'consult' = 'class') => {
    setRecordingMode(mode);
    setActivePanel('recording');
  }, []);

  const close = useCallback(() => setActivePanel(null), []);

  const setOverride = useCallback((studentId: string, status: AttendanceOverride) => {
    setAttendanceOverrides(prev => ({ ...prev, [studentId]: status }));
  }, []);

  return (
    <QuickActionsContext.Provider value={{
      activePanel, openAttendance, openSms, openRecording, recordingMode, close,
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
