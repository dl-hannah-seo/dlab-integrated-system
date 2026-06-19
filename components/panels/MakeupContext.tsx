'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export type MakeupStatus = '미정' | '예정' | '완료';

export interface MakeupRequest {
  id: string;
  student_id: string;
  class_id: string;       // 결석한 반
  absent_date: string;    // 결석 회차 날짜
  status: MakeupStatus;
  makeup_date: string | null;
  makeup_time: string | null;
  memo: string | null;
}

// 데모 시드 — 출결현황 "보강 대기 목록"이 비어 보이지 않도록 미정/예정 각 1건
const SEED: MakeupRequest[] = [
  { id: 'mk-seed-1', student_id: 's-44', class_id: 'cl-04', absent_date: '2026-06-11', status: '미정', makeup_date: null, makeup_time: null, memo: '학부모 통화 예정' },
  { id: 'mk-seed-2', student_id: 's-67', class_id: 'cl-05', absent_date: '2026-06-09', status: '예정', makeup_date: '2026-06-19', makeup_time: '16:00', memo: null },
  // 씨드 선생님 담당 반(cl-02) 보강 데이터 — 수업관리 보강 탭 시연용
  { id: 'mk-seed-3', student_id: 's-19', class_id: 'cl-02', absent_date: '2026-06-13', status: '미정', makeup_date: null, makeup_time: null, memo: '학부모 통화 예정' },
  { id: 'mk-seed-4', student_id: 's-16', class_id: 'cl-02', absent_date: '2026-06-11', status: '예정', makeup_date: '2026-06-21', makeup_time: '15:00', memo: null },
];

interface MakeupCtx {
  requests: MakeupRequest[];
  /** 결석 → 보강 필요(미정) 생성. 같은 학생·반·결석일이면 기존 건 반환(중복 방지) */
  requestMakeup: (studentId: string, classId: string, absentDate: string) => MakeupRequest;
  /** 미정 → 예정 (일정 확정) */
  scheduleMakeup: (id: string, date: string, time: string, memo: string) => void;
  /** 예정 → 완료 */
  completeMakeup: (id: string) => void;
  /** 특정 학생·반의 활성(미완료) 보강 건 */
  findActive: (studentId: string, classId: string) => MakeupRequest | undefined;
}

const MakeupContext = createContext<MakeupCtx | null>(null);

export function MakeupProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<MakeupRequest[]>(SEED);

  const findActive = useCallback(
    (studentId: string, classId: string) =>
      requests.find(r => r.student_id === studentId && r.class_id === classId && r.status !== '완료'),
    [requests],
  );

  const requestMakeup = useCallback((studentId: string, classId: string, absentDate: string) => {
    const existing = requests.find(
      r => r.student_id === studentId && r.class_id === classId && r.absent_date === absentDate && r.status !== '완료',
    );
    if (existing) return existing;
    const created: MakeupRequest = {
      id: `mk-${studentId}-${classId}-${absentDate}`,
      student_id: studentId, class_id: classId, absent_date: absentDate,
      status: '미정', makeup_date: null, makeup_time: null, memo: null,
    };
    setRequests(prev => [...prev, created]);
    return created;
  }, [requests]);

  const scheduleMakeup = useCallback((id: string, date: string, time: string, memo: string) => {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status: '예정', makeup_date: date, makeup_time: time, memo: memo || r.memo } : r,
    ));
  }, []);

  const completeMakeup = useCallback((id: string) => {
    setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: '완료' } : r)));
  }, []);

  return (
    <MakeupContext.Provider value={{ requests, requestMakeup, scheduleMakeup, completeMakeup, findActive }}>
      {children}
    </MakeupContext.Provider>
  );
}

export function useMakeup() {
  const ctx = useContext(MakeupContext);
  if (!ctx) throw new Error('useMakeup must be used within MakeupProvider');
  return ctx;
}
