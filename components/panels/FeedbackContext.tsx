'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { feedbacks as seed, CURRENT_SEMESTER_ID, TODAY, type Feedback, type FeedbackPhase } from '@/lib/mock-data';

interface FeedbackCtx {
  feedbacks: Feedback[];
  /** 미완료 단계에 메모 저장 → 해당 단계 완료 처리(기존 레코드면 갱신) */
  completeFeedback: (args: {
    studentId: string;
    phase: FeedbackPhase;
    memo: string;
    counselor: string;
    semesterId?: string;
    date?: string;
  }) => void;
}

const Ctx = createContext<FeedbackCtx | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(seed);

  const completeFeedback = useCallback((args: {
    studentId: string; phase: FeedbackPhase; memo: string; counselor: string;
    semesterId?: string; date?: string;
  }) => {
    const semesterId = args.semesterId ?? CURRENT_SEMESTER_ID;
    const date = args.date ?? TODAY;
    setFeedbacks(prev => {
      const existing = prev.find(
        f => f.student_id === args.studentId && f.semester_id === semesterId && f.phase === args.phase,
      );
      if (existing) {
        return prev.map(f => f === existing
          ? { ...f, done: true, memo: args.memo.trim(), counselor: args.counselor, date }
          : f);
      }
      const rec: Feedback = {
        id: `fb-${args.studentId}-${args.phase}-${semesterId}`,
        student_id: args.studentId,
        semester_id: semesterId,
        phase: args.phase,
        done: true,
        memo: args.memo.trim(),
        date,
        counselor: args.counselor,
      };
      return [...prev, rec];
    });
  }, []);

  return <Ctx.Provider value={{ feedbacks, completeFeedback }}>{children}</Ctx.Provider>;
}

export function useFeedbacks() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFeedbacks must be used within FeedbackProvider');
  return ctx;
}
