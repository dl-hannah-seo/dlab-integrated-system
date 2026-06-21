'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { SlidePanel } from '@/components/panels/SlidePanel';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { useLeads } from '@/components/panels/LeadsContext';
import { Button } from '@/components/ui/Button';
import { Select, Input, Textarea } from '@/components/ui/Input';
import { classes, LEAD_SUBJECTS, LEAD_SOURCES, TODAY } from '@/lib/mock-data';

// DEMO ONLY — 실제 녹음/STT 없이 흐름을 시연하는 목업.
const LEAD_GRADES = ['7세', '초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
type RecordMode = 'class' | 'consult';
type Stage = 'idle' | 'recording' | 'transcribing' | 'result';
const TRANSCRIBE_DELAY_MS = 1500;

const MOCK_CLASS_SUMMARY = [
  '반복문(for) 개념과 동작 원리를 다뤘습니다.',
  '1부터 10까지 합 구하기 예제로 누적 변수 패턴을 연습했습니다.',
  '중첩 반복문에서 일부 학생이 흐름을 헷갈려 해 다음 시간 보충 설명이 필요합니다.',
];
const MOCK_CLASS_TRANSCRIPT =
  '자, 오늘은 반복문을 배워볼 거예요. 같은 작업을 여러 번 할 때 쓰는 거죠. 1부터 10까지 더하려면 누적 변수를 만들어서 계속 더해주면 돼요. 중첩 반복문도 한번 볼까요? 오늘은 여기까지 하고 다음 시간에 리스트랑 같이 써볼게요.';

const MOCK_CONSULT_SUMMARY = [
  '초등 5학년, 코딩 입문 문의. 학교 방과후에서 스크래치를 접한 경험 있음.',
  '주 1회 토요일 오전반 희망. 파이썬 기초에 관심.',
  '형이 디랩 재원생이라 추천으로 연락(지인소개).',
  '다음 주 레벨 테스트 후 등록 상담 이어가기로 안내.',
];
const MOCK_CONSULT_TRANSCRIPT =
  '안녕하세요, 아이가 코딩에 관심이 많아서 문의드려요. 학교에서 스크래치를 해봤는데 더 배우고 싶어 해요. 토요일 오전반이 있을까요? 형이 거기 다니고 있어서 추천을 받았어요.';

export function RecordingPanel() {
  const { activePanel, close, recordingMode } = useQuickActions();
  const { addLead } = useLeads();
  const open = activePanel === 'recording';

  const recordableClasses = useMemo(() => classes.filter(c => c.enrolled_count > 0), []);

  const [mode, setMode] = useState<RecordMode>('class');
  const [selectedClassId, setSelectedClassId] = useState(recordableClasses[0]?.id ?? '');
  const [stage, setStage] = useState<Stage>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saved, setSaved] = useState(false);

  // 신규 상담 → 신규 학생 정보 (신규 문의 추가와 동일 칼럼: 이름·학년·관심과목·유입경로·문의일·메모)
  const emptyLead = { name: '', grade: '', subject: LEAD_SUBJECTS[0], source: LEAD_SOURCES[0], inquiry_date: TODAY, memo: '' };
  const [lead, setLead] = useState(emptyLead);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcribeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (transcribeRef.current) { clearTimeout(transcribeRef.current); transcribeRef.current = null; }
  }
  function reset() {
    clearTimers();
    setStage('idle'); setElapsed(0); setShowTranscript(false); setSaved(false);
    setLead({ ...emptyLead });
  }
  function handleClose() { reset(); close(); }

  useEffect(() => { if (!open) clearTimers(); return clearTimers; }, [open]);
  useEffect(() => { if (open) { reset(); setMode(recordingMode); } }, [open, recordingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  function startRecording() {
    setStage('recording'); setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }
  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setStage('transcribing');
    transcribeRef.current = setTimeout(() => {
      setStage('result');
      // 신규 상담: AI 요약을 메모 기본값으로 채움(수정 가능)
      if (mode === 'consult') setLead(l => (l.memo ? l : { ...l, memo: MOCK_CONSULT_SUMMARY.join(' ') }));
    }, TRANSCRIBE_DELAY_MS);
  }

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const selectedClass = recordableClasses.find(c => c.id === selectedClassId);
  const summaryLines = mode === 'consult' ? MOCK_CONSULT_SUMMARY : MOCK_CLASS_SUMMARY;
  const transcriptText = mode === 'consult' ? MOCK_CONSULT_TRANSCRIPT : MOCK_CLASS_TRANSCRIPT;

  function saveClass() { setSaved(true); }
  function saveConsult() {
    if (!lead.name.trim()) return;
    addLead({
      name: lead.name, parent_phone: '010-1234-5678', grade: lead.grade,
      source: lead.source, interest_subject: lead.subject, stage: '신규문의',
      inquiry_date: lead.inquiry_date, memo: lead.memo || MOCK_CONSULT_SUMMARY.join(' '),
    });
    setSaved(true);
  }

  return (
    <SlidePanel open={open} onClose={handleClose} title="AI 녹음">
      <div className="px-5 py-4 space-y-5">
        {/* 모드 토글 — idle에서만 */}
        <div className="inline-flex w-full rounded-lg border border-[#E8EBF1] bg-white p-0.5">
          {([['class', '수업 녹음'], ['consult', '신규 상담 녹음']] as [RecordMode, string][]).map(([m, label]) => (
            <button key={m} onClick={() => stage === 'idle' && setMode(m)} disabled={stage !== 'idle'}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors disabled:cursor-not-allowed ${
                mode === m ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium' : 'text-[#6B7280] hover:text-[#1A1D29]'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* 수업 모드: 반 선택 */}
        {mode === 'class' && (
          <Select label="녹음할 수업" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}
            disabled={stage !== 'idle'}
            options={recordableClasses.map(c => ({ value: c.id, label: `${c.schedule} ${c.course}` }))} />
        )}

        {/* [1] idle */}
        {stage === 'idle' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF1FF]">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2F6BFF" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v3m0-3a4 4 0 01-4-4V7a4 4 0 118 0v4a4 4 0 01-4 4z" />
              </svg>
            </span>
            <p className="text-sm text-[#6B7280]">
              {mode === 'consult'
                ? <>녹음을 시작하면 상담 내용이 자동으로<br />전사·요약됩니다.</>
                : <>녹음을 시작하면 수업 내용이 자동으로<br />전사되고 요약됩니다.</>}
            </p>
            <Button className="w-full" onClick={startRecording}>녹음 시작</Button>
          </div>
        )}

        {/* [2] recording */}
        {stage === 'recording' && (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F2474B] animate-pulse" />
              <span className="text-xs font-semibold text-[#F2474B] uppercase tracking-wider">REC</span>
              <span className="text-2xl font-bold text-[#1A1D29] tabular-nums">{mmss}</span>
            </div>
            <div className="flex h-12 items-center gap-1">
              {Array.from({ length: 13 }).map((_, i) => (
                <span key={i} className="w-1 rounded-full bg-[#2F6BFF] animate-wave-bar" style={{ height: '100%', animationDelay: `${(i % 7) * 0.12}s` }} />
              ))}
            </div>
            <Button className="w-full" variant="danger" onClick={stopRecording}>녹음 종료</Button>
          </div>
        )}

        {/* [3] transcribing */}
        {stage === 'transcribing' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <svg className="animate-spin h-8 w-8 text-[#2F6BFF]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-[#6B7280]">음성을 텍스트로 변환 중…</p>
          </div>
        )}

        {/* [4] result */}
        {stage === 'result' && (
          <div className="space-y-4">
            <p className="text-xs text-[#6B7280]">
              {mode === 'consult' ? `신규 상담 · 녹음 ${mmss}` : selectedClass ? `${selectedClass.schedule} ${selectedClass.course} · 녹음 ${mmss}` : `녹음 ${mmss}`}
            </p>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#2F6BFF]">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                {mode === 'consult' ? '상담 요약 (AI 자동 생성)' : '수업 요약 (AI 자동 생성)'}
              </p>
              <ul className="space-y-2 rounded-lg bg-[#F4F6FA] p-4">
                {summaryLines.map((line, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#1A1D29]"><span className="text-[#2F6BFF]">•</span><span>{line}</span></li>
                ))}
              </ul>
            </div>

            <div>
              <button onClick={() => setShowTranscript(v => !v)} className="flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#1A1D29] transition-colors">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className={`transition-transform ${showTranscript ? 'rotate-90' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                전사 원문 보기
              </button>
              {showTranscript && <p className="mt-2 rounded-lg border border-[#E8EBF1] p-3 text-xs leading-relaxed text-[#6B7280]">{transcriptText}</p>}
            </div>

            {/* 신규 상담: 학생 정보 입력 → 예비원생 등록 */}
            {mode === 'consult' && !saved && (
              <div className="rounded-lg border border-[#E8EBF1] p-3 space-y-2">
                <p className="text-xs font-semibold text-[#1A1D29]">신규 학생 정보</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="이름" placeholder="학생 이름" value={lead.name} onChange={e => setLead({ ...lead, name: e.target.value })} />
                  <Select label="학년" value={lead.grade} onChange={e => setLead({ ...lead, grade: e.target.value })}
                    options={[{ value: '', label: '선택' }, ...LEAD_GRADES.map(g => ({ value: g, label: g }))]} />
                  <Select label="관심 과목" value={lead.subject} onChange={e => setLead({ ...lead, subject: e.target.value })} options={LEAD_SUBJECTS.map(v => ({ value: v, label: v }))} />
                  <Select label="유입경로" value={lead.source} onChange={e => setLead({ ...lead, source: e.target.value })} options={LEAD_SOURCES.map(v => ({ value: v, label: v }))} />
                  <Input label="문의일" type="date" value={lead.inquiry_date} onChange={e => setLead({ ...lead, inquiry_date: e.target.value })} />
                </div>
                <Textarea label="메모" rows={3} value={lead.memo} onChange={e => setLead({ ...lead, memo: e.target.value })} placeholder="상담 메모 (AI 요약 자동 입력)" />
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-[#E8EBF1]">
              {mode === 'consult' ? (
                <Button className="flex-1" variant={saved ? 'secondary' : 'primary'} onClick={saveConsult} disabled={saved || !lead.name.trim()}>
                  {saved ? '등록됨 ✓' : '예비원생 등록'}
                </Button>
              ) : (
                <Button className="flex-1" variant={saved ? 'secondary' : 'primary'} onClick={saveClass} disabled={saved}>
                  {saved ? '저장됨 ✓' : '요약 저장'}
                </Button>
              )}
              <Button className="flex-1" variant="secondary" onClick={reset}>다시 녹음</Button>
            </div>
            {saved && (
              <p className="text-center text-xs text-[#28C76F]">
                {mode === 'consult' ? `${lead.name} 학생이 상담 관리(예비원생)에 등록되었습니다.` : '수업 기록에 저장되었습니다.'}
              </p>
            )}
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
