'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { SlidePanel } from '@/components/panels/SlidePanel';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { classes } from '@/lib/mock-data';

// DEMO ONLY ↓↓↓
// 실제 녹음(MediaRecorder)·STT API·서버 저장 없음. 데모 검증용 클릭 플로우 목업.
// 실기능 교체 시: stage 전환부의 setTimeout/setInterval → 실제 녹음·전사 파이프라인으로 대체.

type Stage = 'idle' | 'recording' | 'transcribing' | 'result';

const TRANSCRIBE_DELAY_MS = 1500;

// 전사 결과(목업) — 토 14:00 코딩 수업 가정
const MOCK_SUMMARY = [
  '반복문(for) 개념과 동작 원리를 다뤘습니다.',
  '1부터 10까지 합 구하기 예제로 누적 변수 패턴을 연습했습니다.',
  '중첩 반복문에서 일부 학생이 흐름을 헷갈려 해 다음 시간 보충 설명이 필요합니다.',
  '다음 수업 예고: 리스트와 반복문을 함께 사용하는 실습.',
];

const MOCK_TRANSCRIPT =
  '자, 오늘은 반복문을 배워볼 거예요. 반복문은 같은 작업을 여러 번 할 때 쓰는 거죠. ' +
  '예를 들어 1부터 10까지 더하려면 어떻게 할까요? 네, 변수를 하나 만들어서 계속 더해주면 돼요. ' +
  '이걸 누적 변수라고 불러요. 자 그러면 중첩 반복문도 한번 볼까요? 반복문 안에 반복문이 들어가는 거예요. ' +
  '여기서부터 조금 헷갈릴 수 있는데, 바깥쪽이 한 번 돌 때 안쪽이 전부 도는 거예요. ' +
  '오늘은 여기까지 하고, 다음 시간에는 리스트랑 같이 써볼게요.';
// DEMO ONLY ↑↑↑

export function RecordingPanel() {
  const { activePanel, close } = useQuickActions();
  const open = activePanel === 'recording';

  const recordableClasses = useMemo(() => classes.filter(c => c.enrolled_count > 0), []);

  const [selectedClassId, setSelectedClassId] = useState(recordableClasses[0]?.id ?? '');
  const [stage, setStage] = useState<Stage>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saved, setSaved] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcribeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (transcribeRef.current) { clearTimeout(transcribeRef.current); transcribeRef.current = null; }
  }

  function reset() {
    clearTimers();
    setStage('idle');
    setElapsed(0);
    setShowTranscript(false);
    setSaved(false);
  }

  // 패널 닫힘(X·오버레이·Esc) → 상태 초기화 후 닫기
  function handleClose() {
    reset();
    close();
  }

  // 패널이 가려지거나 언마운트되면 타이머만 정리 (setState 없음)
  useEffect(() => {
    if (!open) clearTimers();
    return clearTimers;
  }, [open]);

  function startRecording() {
    setStage('recording');
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setStage('transcribing');
    transcribeRef.current = setTimeout(() => setStage('result'), TRANSCRIBE_DELAY_MS);
  }

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const selectedClass = recordableClasses.find(c => c.id === selectedClassId);

  return (
    <SlidePanel open={open} onClose={handleClose} title="AI 녹음">
      <div className="px-5 py-4 space-y-5">
        {/* DEMO 표식 */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#FF6C37]/40 bg-[#FFF8F5]">
          <span className="text-[10px] font-semibold text-[#FF6C37] uppercase tracking-wider">DEMO</span>
          <span className="text-xs text-[#787774]">실제 녹음 없이 흐름을 시연하는 목업입니다.</span>
        </div>

        {/* 반 선택 — idle에서만 변경 가능 */}
        <Select
          label="녹음할 수업"
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          disabled={stage !== 'idle'}
          options={recordableClasses.map(c => ({ value: c.id, label: `${c.schedule} ${c.course}` }))}
        />

        {/* [1] idle */}
        {stage === 'idle' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF1EC]">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#FF6C37" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v3m0-3a4 4 0 01-4-4V7a4 4 0 118 0v4a4 4 0 01-4 4z" />
              </svg>
            </span>
            <p className="text-sm text-[#787774]">
              녹음을 시작하면 수업 내용이 자동으로<br />텍스트로 전사되고 요약됩니다.
            </p>
            <Button className="w-full" onClick={startRecording}>녹음 시작</Button>
          </div>
        )}

        {/* [2] recording */}
        {stage === 'recording' && (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EB5757] animate-pulse" />
              <span className="text-xs font-semibold text-[#EB5757] uppercase tracking-wider">REC</span>
              <span className="text-2xl font-bold text-[#37352F] tabular-nums">{mmss}</span>
            </div>

            {/* 가짜 파형 (CSS 애니메이션) */}
            <div className="flex h-12 items-center gap-1">
              {Array.from({ length: 13 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-[#FF6C37] animate-wave-bar"
                  style={{ height: '100%', animationDelay: `${(i % 7) * 0.12}s` }}
                />
              ))}
            </div>

            <Button className="w-full" variant="danger" onClick={stopRecording}>녹음 종료</Button>
          </div>
        )}

        {/* [3] transcribing */}
        {stage === 'transcribing' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <svg className="animate-spin h-8 w-8 text-[#FF6C37]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-[#787774]">음성을 텍스트로 변환 중…</p>
          </div>
        )}

        {/* [4] result */}
        {stage === 'result' && (
          <div className="space-y-4">
            {selectedClass && (
              <p className="text-xs text-[#787774]">
                {selectedClass.schedule} {selectedClass.course} · 녹음 {mmss}
              </p>
            )}

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#FF6C37]">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                수업 요약 (AI 자동 생성)
              </p>
              <ul className="space-y-2 rounded-lg bg-[#F7F7F5] p-4">
                {MOCK_SUMMARY.map((line, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#37352F]">
                    <span className="text-[#FF6C37]">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 전사 원문 (접기/펼치기) */}
            <div>
              <button
                onClick={() => setShowTranscript(v => !v)}
                className="flex items-center gap-1 text-xs font-medium text-[#787774] hover:text-[#37352F] transition-colors"
              >
                <svg
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  className={`transition-transform ${showTranscript ? 'rotate-90' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                전사 원문 보기
              </button>
              {showTranscript && (
                <p className="mt-2 rounded-lg border border-[#E9E9E7] p-3 text-xs leading-relaxed text-[#787774]">
                  {MOCK_TRANSCRIPT}
                </p>
              )}
            </div>

            {/* 액션 */}
            <div className="flex gap-2 pt-2 border-t border-[#E9E9E7]">
              <Button
                className="flex-1"
                variant={saved ? 'secondary' : 'primary'}
                onClick={() => setSaved(true)}
                disabled={saved}
              >
                {saved ? '저장됨 ✓' : '요약 저장'}
              </Button>
              <Button className="flex-1" variant="secondary" onClick={reset}>다시 녹음</Button>
            </div>
            {saved && (
              <p className="text-center text-xs text-[#0F7B6C]">수업 기록에 저장되었습니다.</p>
            )}
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
