// components/panels/useAttendanceDemo.ts — DEMO ONLY, 추후 삭제
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { demoCheckinSequence } from '@/lib/mock-data';

const STEP_MS = 1200;

export interface AttendanceDemo {
  demoAttendedIds: Set<string>;
  playedCount: number;
  totalCount: number;
  isPlaying: boolean;
  isComplete: boolean;
  play: () => void;
  reset: () => void;
}

export function useAttendanceDemo(active: boolean): AttendanceDemo {
  const [demoAttendedIds, setDemoAttendedIds] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);

  const totalCount = demoCheckinSequence.length;
  const playedCount = demoAttendedIds.size;
  const isComplete = playedCount >= totalCount;

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    stepRef.current = 0;
    setIsPlaying(false);
    setDemoAttendedIds(new Set());
  }, []);

  const play = useCallback(() => {
    if (isPlaying || stepRef.current >= demoCheckinSequence.length) return;
    setIsPlaying(true);

    const tick = () => {
      const entry = demoCheckinSequence[stepRef.current];
      if (!entry) {
        setIsPlaying(false);
        timerRef.current = null;
        return;
      }
      setDemoAttendedIds(prev => {
        const next = new Set(prev);
        next.add(entry.student_id);
        return next;
      });
      stepRef.current += 1;
      if (stepRef.current < demoCheckinSequence.length) {
        timerRef.current = setTimeout(tick, STEP_MS);
      } else {
        setIsPlaying(false);
        timerRef.current = null;
      }
    };

    timerRef.current = setTimeout(tick, STEP_MS);
  }, [isPlaying]);

  // 패널 닫힘(active=false) 시 자동 초기화
  useEffect(() => {
    if (!active) reset();
  }, [active, reset]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { demoAttendedIds, playedCount, totalCount, isPlaying, isComplete, play, reset };
}
