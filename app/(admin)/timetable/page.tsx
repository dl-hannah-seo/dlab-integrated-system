'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  classes, students, todaySessions, initialAttendance,
  demoCheckinSequence, getStudentsByClass, Class, Attendance,
} from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import { Badge, AttendanceDot } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';

// ── 헬퍼 ────────────────────────────────────────────────────
function fmtTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ── 주간 뷰 mock 데이터 ───────────────────────────────────────
const DAYS = ['월', '화', '수', '목', '금', '토'];
const weeklyBlocks = [
  { day: '화', time: '16:00', classId: 'cl-04', label: '파이썬기초/김', total: 18, attend: 16, past: true },
  { day: '화', time: '17:00', classId: 'cl-05', label: '맞춤수업/박',   total: 16, attend: 15, past: true },
  { day: '화', time: '18:00', classId: 'cl-06', label: '아두이노/이',   total: 4,  attend: 3,  past: true },
  { day: '목', time: '16:00', classId: 'cl-04', label: '파이썬기초/김', total: 18, attend: 0,  past: false, today: false, future: true },
  { day: '목', time: '17:00', classId: 'cl-05', label: '맞춤수업/박',   total: 16, attend: 0,  past: false, today: false, future: true },
  { day: '토', time: '09:00', classId: 'cl-01', label: '파이썬기초/론', total: 14, attend: 3,  past: false, today: true  },
  { day: '토', time: '10:00', classId: 'cl-02', label: '파이썬기초/민', total: 15, attend: 0,  past: false, today: true  },
  { day: '토', time: '11:00', classId: 'cl-03', label: '맞춤수업/론',   total: 11, attend: 0,  past: false, today: true  },
];

// ── 결석 처리 모달 ────────────────────────────────────────────
function AbsenceModal({
  open, student, onClose, onConfirm,
}: {
  open: boolean;
  student: { name: string; id: string } | null;
  onClose: () => void;
  onConfirm: (reason: string, makeupSession: string | null, sendAlimtok: boolean) => void;
}) {
  const [reason, setReason] = useState('병결');
  const [makeupSlot, setMakeupSlot] = useState('');
  const [sendAlimtok, setSendAlimtok] = useState(true);
  const [sent, setSent] = useState(false);

  function handleConfirm() {
    setSent(true);
    setTimeout(() => { setSent(false); onConfirm(reason, makeupSlot || null, sendAlimtok); }, 800);
  }

  const makeupOptions = [
    { value: '', label: '보강 미정' },
    { value: '2026-06-21/cl-02', label: '6/21 토 10:00 파이썬기초/민 (잔여 1석)' },
    { value: '2026-06-28/cl-01', label: '6/28 토 09:00 파이썬기초/론 (잔여 2석)' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`결석 처리 — ${student?.name ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button onClick={handleConfirm} loading={sent}>
            {makeupSlot ? '보강 확정 + 알림톡 발송' : '사유만 저장'}
          </Button>
        </>
      }
    >
      {sent && (
        <div className="mb-4 bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0F7B6C]">✓ 알림톡 발송 완료</span>
        </div>
      )}
      <div className="space-y-4">
        <Select
          label="결석 사유"
          value={reason}
          onChange={e => setReason(e.target.value)}
          options={[
            { value: '병결', label: '병결' },
            { value: '가족 일정', label: '가족 일정' },
            { value: '학교 행사', label: '학교 행사' },
            { value: '무단', label: '무단' },
            { value: '직접 입력', label: '직접 입력' },
          ]}
        />
        <Select
          label="보강 일시 (시스템 자동 추천)"
          value={makeupSlot}
          onChange={e => setMakeupSlot(e.target.value)}
          options={makeupOptions}
        />
        {makeupSlot && (
          <div className="bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-[#0F7B6C] mb-1">알림톡 미리보기</p>
            <p className="text-sm text-[#37352F]">[D.LAB 판교] {student?.name} 학부모님, 오늘 결석({reason}) 처리되었습니다. 보강: {makeupOptions.find(o=>o.value===makeupSlot)?.label?.split(' ').slice(0,3).join(' ')}</p>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-[#37352F]">
          <input type="checkbox" checked={sendAlimtok} onChange={e => setSendAlimtok(e.target.checked)} className="accent-[#FF6C37]" />
          알림톡 발송
        </label>
      </div>
    </Modal>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function TimetablePage() {
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Attendance>>(() => {
    const m: Record<string, Attendance> = {};
    initialAttendance.forEach(a => { m[a.student_id] = a; });
    return m;
  });
  const [absenceStudent, setAbsenceStudent] = useState<{ name: string; id: string } | null>(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const demoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [demoIdx, setDemoIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // 토스트
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // demo-only: 순차 점등
  const runNextCheckin = useCallback(() => {
    setDemoIdx(prev => {
      const idx = prev;
      if (idx >= demoCheckinSequence.length) { setDemoRunning(false); return prev; }
      const entry = demoCheckinSequence[idx];
      const s = students.find(st => st.id === entry.student_id);
      setAttendanceMap(m => ({
        ...m,
        [entry.student_id]: { ...m[entry.student_id], status: 'attend', checked_in_at: entry.checked_in_at },
      }));
      if (s) showToast(`✅ ${s.name} 체크인 — ${fmtTime(entry.checked_in_at)}`);
      return idx + 1;
    });
  }, []);

  useEffect(() => {
    if (!demoRunning) return;
    demoRef.current = setTimeout(runNextCheckin, 1200); // demo-only: 1.2초 간격
    return () => { if (demoRef.current) clearTimeout(demoRef.current); };
  }, [demoRunning, demoIdx, runNextCheckin]);

  function startDemo() {
    setDemoIdx(0); setDemoRunning(true);
  }
  function stopDemo() {
    setDemoRunning(false);
    if (demoRef.current) clearTimeout(demoRef.current);
  }

  // demo-only: 결석 강제 전환
  function forceMakeAbsent() {
    setAttendanceMap(m => {
      const next = { ...m };
      Object.keys(next).forEach(sid => {
        if (next[sid].status === 'pending') {
          next[sid] = { ...next[sid], status: 'absent' };
        }
      });
      return next;
    });
    showToast('⚠️ 미도착 → 결석 자동 전환 완료');
  }

  function handleAbsenceConfirm(reason: string, makeupSession: string | null, sendAlimtok: boolean) {
    if (!absenceStudent) return;
    setAttendanceMap(m => ({
      ...m,
      [absenceStudent.id]: { ...m[absenceStudent.id], absence_reason: reason },
    }));
    setAbsenceStudent(null);
    if (sendAlimtok) showToast(`📱 알림톡 발송 완료 — ${absenceStudent.name} (${reason}${makeupSession ? ', 보강 확정' : ''})`);
  }

  // 오늘 대상 반들
  const todayClasses = classes.filter(c => todaySessions.some(s => s.class_id === c.id));

  // 출결 요약
  const sessionStudentIds = initialAttendance.map(a => a.student_id);
  const attendCount = sessionStudentIds.filter(id => attendanceMap[id]?.status === 'attend').length;
  const absentCount = sessionStudentIds.filter(id => attendanceMap[id]?.status === 'absent').length;
  const pendingCount = sessionStudentIds.filter(id => attendanceMap[id]?.status === 'pending').length;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">시간표 허브</h1>
          <p className="text-sm text-[#787774] mt-1">2026년 6월 14일 · 판교 캠퍼스</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 뷰 토글 */}
          <div className="flex bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg p-0.5">
            {(['daily','weekly'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${view === v ? 'bg-white text-[#37352F] shadow-sm' : 'text-[#787774]'}`}>
                {v === 'daily' ? '일별' : '주간'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* demo-only: 데모 컨트롤 패널 */}
      <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-[#FFF8E6] border border-[#D9A80A]/30 rounded-lg">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#D9A80A" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        <span className="text-sm font-semibold text-[#D9A80A]">데모 모드</span>
        <div className="ml-2 flex gap-2">
          {!demoRunning ? (
            <Button size="sm" variant="secondary" onClick={startDemo}>
              ▶ 체크인 순차 점등 시작
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={stopDemo}>⏹ 중지</Button>
          )}
          {/* demo-only: 결석 자동전환 강제 트리거 */}
          <Button size="sm" variant="danger" onClick={forceMakeAbsent}>
            ⚠️ 지금 결석 자동전환
          </Button>
        </div>
        <div className="ml-auto flex gap-4 text-sm">
          <span className="text-[#0F7B6C] font-medium">출석 {attendCount}</span>
          <span className="text-[#787774]">미도착 {pendingCount}</span>
          <span className="text-[#EB5757] font-medium">결석 {absentCount}</span>
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#37352F] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-pulse">
          {toast}
        </div>
      )}

      {/* 일별 뷰 */}
      {view === 'daily' && (
        <div className="space-y-4">
          {todayClasses.map(cls => {
            const session = todaySessions.find(s => s.class_id === cls.id)!;
            const classStudents = getStudentsByClass(cls.id);
            const attendList   = classStudents.filter(s => attendanceMap[s.id]?.status === 'attend');
            const pendingList  = classStudents.filter(s => attendanceMap[s.id]?.status === 'pending');
            const absentList   = classStudents.filter(s => attendanceMap[s.id]?.status === 'absent');

            return (
              <div key={cls.id} className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
                {/* 카드 헤더 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#E9E9E7] bg-[#F7F7F5]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#37352F]">{session.start_time}</span>
                    <span className="text-sm text-[#37352F]">{cls.course}</span>
                    <span className="text-xs text-[#787774]">담당: {cls.teacher}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[#0F7B6C] font-medium">{attendList.length}출석</span>
                    <span className="text-[#787774]">{pendingList.length}미도착</span>
                    <span className="text-[#EB5757]">{absentList.length}결석</span>
                    <span className="text-[#787774]">/ {classStudents.length}명</span>
                  </div>
                </div>

                {/* 학생 칩 그리드 */}
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {classStudents.map(s => {
                    const att = attendanceMap[s.id];
                    const status = att?.status ?? 'pending';
                    const isAbsent = status === 'absent';

                    return (
                      <button
                        key={s.id}
                        onClick={() => isAbsent ? setAbsenceStudent({ name: s.name, id: s.id }) : undefined}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
                          isAbsent
                            ? 'border-[#EB5757] bg-[#FDECEA] cursor-pointer hover:shadow-md'
                            : status === 'attend'
                            ? 'border-[#0F7B6C] bg-[#EDF7F5] cursor-default'
                            : 'border-[#E9E9E7] bg-white cursor-default'
                        }`}
                      >
                        <AttendanceDot status={status} />
                        <span className={`font-medium ${
                          status === 'attend' ? 'text-[#0F7B6C]'
                          : status === 'absent' ? 'text-[#EB5757]'
                          : 'text-[#37352F]'
                        }`}>
                          {s.name}
                        </span>
                        {status === 'attend' && att?.checked_in_at && (
                          <span className="text-xs text-[#787774]">{fmtTime(att.checked_in_at)}</span>
                        )}
                        {isAbsent && (
                          <span className="text-xs text-[#EB5757]">처리</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 주간 뷰 */}
      {view === 'weekly' && (
        <div>
          <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-[#E9E9E7]">
              <div className="px-3 py-3 bg-[#F7F7F5]" />
              {DAYS.map(day => (
                <div key={day} className={`px-3 py-3 text-center text-sm font-semibold border-l border-[#E9E9E7] ${day === '토' ? 'bg-[#FFF1EC] text-[#FF6C37]' : 'bg-[#F7F7F5] text-[#37352F]'}`}>
                  {day}
                  {day === '토' && <span className="ml-1 text-xs text-[#FF6C37]">오늘</span>}
                </div>
              ))}
            </div>

            {/* 시간대 행 */}
            {['16:00','17:00','18:00','09:00','10:00','11:00'].filter((t,i,arr) => arr.indexOf(t) === i)
              .sort().map(time => (
              <div key={time} className="grid grid-cols-7 border-b border-[#E9E9E7] min-h-[72px]">
                <div className="px-3 py-3 bg-[#F7F7F5] border-r border-[#E9E9E7] flex items-center">
                  <span className="text-xs font-semibold text-[#787774]">{time}</span>
                </div>
                {DAYS.map(day => {
                  const block = weeklyBlocks.find(b => b.day === day && b.time === time);
                  return (
                    <div key={day} className={`border-l border-[#E9E9E7] p-1.5 ${day === '토' ? 'bg-[#FFFBF9]' : ''}`}>
                      {block && (
                        <div className={`h-full rounded-md px-2 py-1.5 text-xs ${
                          block.today ? 'bg-[#FFF1EC] border border-[#FF6C37]/30'
                          : block.past ? 'bg-[#F7F7F5] border border-[#E9E9E7]'
                          : 'bg-[#EDF7F5] border border-[#0F7B6C]/20'
                        }`}>
                          <p className="font-semibold text-[#37352F] text-xs mb-1">{block.label}</p>
                          {block.past && (
                            <p className="text-[#0F7B6C]">{block.attend}/{block.total} · {block.attend < block.total ? `결석${block.total - block.attend}` : '전원출석'}</p>
                          )}
                          {block.today && (
                            <p className="text-[#FF6C37]">실시간: {attendCount}/{block.total}</p>
                          )}
                          {block.future && (
                            <p className="text-[#787774]">{block.total}명 예정</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 결석 처리 모달 */}
      <AbsenceModal
        open={!!absenceStudent}
        student={absenceStudent}
        onClose={() => setAbsenceStudent(null)}
        onConfirm={handleAbsenceConfirm}
      />
    </div>
  );
}
