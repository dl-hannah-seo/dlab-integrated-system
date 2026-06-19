'use client';

import { useMemo, useState } from 'react';
import {
  classes, getClassRoster, students, FEEDBACK_PHASES, CURRENT_SEMESTER_ID, TODAY,
  type Student,
} from '@/lib/mock-data';
import { DEMO_TEACHER_ID } from '@/lib/roles';
import { classesOfTeacher } from '@/lib/teacher-hr';
import { studentsOfClass, feedbackOf, classPhaseRate } from '@/lib/feedback';
import { buildMakeupMessage } from '@/lib/makeup-helpers';
import { useFeedbacks } from '@/components/panels/FeedbackContext';
import { useMakeup } from '@/components/panels/MakeupContext';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { FeedbackModal } from '@/components/schedule/FeedbackModal';
import { MakeupPickerModal } from '@/components/attendance/MakeupPickerModal';

// 출결 상태(데모) — 본인 수업별 학생 출결
type Stat = '미도착' | '출석' | '결석' | '보강';
const STATS: Stat[] = ['미도착', '출석', '결석', '보강'];
const STAT_STYLE: Record<Stat, string> = {
  '미도착': 'bg-[#EEF1F5] text-[#6B7280]',
  '출석': 'bg-[#E6F9EF] text-[#1FA85C]',
  '결석': 'bg-[#FEE9EA] text-[#F2474B]',
  '보강': 'bg-[#EAF1FF] text-[#2F6BFF]',
};

type SubTab = 'att' | 'feedback' | 'makeup';
const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'att', label: '반별 출석 현황' },
  { key: 'feedback', label: '재원생 피드백' },
  { key: 'makeup', label: '보강 관리' },
];

const key = (classId: string, studentId: string) => `${classId}:${studentId}`;
const mmdd = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

export default function TeachingPage() {
  const { openRecording, openSms } = useQuickActions();
  const { feedbacks } = useFeedbacks();
  const { requests, requestMakeup, scheduleMakeup, completeMakeup } = useMakeup();

  const myClasses = useMemo(() => classesOfTeacher(DEMO_TEACHER_ID, classes), []);
  const [selId, setSelId] = useState(myClasses[0]?.id ?? '');
  const [subTab, setSubTab] = useState<SubTab>('att');
  const [attendance, setAttendance] = useState<Record<string, Stat>>({});
  const [mkPick, setMkPick] = useState<Student | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [toast, setToast] = useState('');
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 1800); }

  const selClass = myClasses.find(c => c.id === selId) ?? null;
  const roster = selClass ? getClassRoster(selClass.id) : [];
  const statOf = (sid: string): Stat => attendance[key(selId, sid)] ?? '미도착';

  function setStat(sid: string, stat: Stat) {
    setAttendance(prev => ({ ...prev, [key(selId, sid)]: stat }));
    if (stat === '결석') requestMakeup(sid, selId, TODAY);   // 결석 → 보강 필요(미정) 자동 생성
  }

  // 출결 집계
  const att = roster.filter(s => statOf(s.id) === '출석').length;
  const absent = roster.filter(s => statOf(s.id) === '결석').length;
  const pending = roster.filter(s => statOf(s.id) === '미도착').length;
  const denom = att + absent;
  const rate = denom ? Math.round((att / denom) * 100) : 0;

  // 보강 — 선택 반 건만
  const classMakeups = requests.filter(r => r.class_id === selId);
  const pendingMakeups = classMakeups.filter(r => r.status !== '완료').length;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-xl font-bold text-[#1A1D29]">수업관리</h1>
        <button
          onClick={openRecording}
          className="px-3 py-1.5 text-sm rounded-md bg-[#2F6BFF] text-white hover:bg-[#1F57E6] transition-colors"
        >
          🎙 녹음 시작
        </button>
      </div>

      {myClasses.length === 0 ? (
        <div className="bg-white border border-[#E8EBF1] rounded-lg py-16 text-center text-sm text-[#6B7280]">담당 반이 없습니다.</div>
      ) : (
        <>
          {/* 반 탭 */}
          <div className="flex flex-wrap gap-2 mb-5">
            {myClasses.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelId(c.id); setSubTab('att'); }}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  c.id === selId ? 'bg-[#2F6BFF] text-white border-[#2F6BFF]' : 'bg-white text-[#1A1D29] border-[#E8EBF1] hover:border-[#2F6BFF]/50'
                }`}
              >
                {c.course}
              </button>
            ))}
          </div>

          {/* 반 컨텍스트 헤더 */}
          {selClass && (
            <div className="mb-4 flex items-center gap-3 text-sm">
              <span className="font-semibold text-[#1A1D29]">{selClass.course}</span>
              <span className="text-[#6B7280]">{selClass.schedule}{selClass.room ? ` · ${selClass.room}` : ''}</span>
              <span className="text-[#9CA3AF]">재원 {roster.length}명</span>
            </div>
          )}

          {/* 서브 탭 */}
          <div className="inline-flex rounded-lg border border-[#E8EBF1] bg-white p-0.5 mb-4">
            {SUB_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setSubTab(t.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  subTab === t.key ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium' : 'text-[#6B7280] hover:text-[#1A1D29]'
                }`}
              >
                {t.label}{t.key === 'makeup' && pendingMakeups > 0 ? ` ${pendingMakeups}` : ''}
              </button>
            ))}
          </div>

          {/* ── 반별 출석 현황 ── */}
          {subTab === 'att' && (
            <div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: '출석률', value: denom ? `${rate}%` : '–', color: '#1A1D29' },
                  { label: '출석', value: `${att}명`, color: '#1FA85C' },
                  { label: '미도착', value: `${pending}명`, color: '#6B7280' },
                  { label: '결석', value: `${absent}명`, color: absent > 0 ? '#F2474B' : '#1A1D29' },
                ].map(c => (
                  <div key={c.label} className="bg-white border border-[#E8EBF1] rounded-lg p-4">
                    <p className="text-xs text-[#6B7280]">{c.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-[#E8EBF1] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F4F6FA] border-b border-[#E8EBF1] text-left text-[#1A1D29]">
                      <th className="px-5 py-3 font-semibold">학생</th>
                      <th className="px-3 py-3 font-semibold">학년</th>
                      <th className="px-3 py-3 font-semibold">상태</th>
                      <th className="px-5 py-3 font-semibold text-right">출결 변경</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map(s => {
                      const stat = statOf(s.id);
                      return (
                        <tr key={s.id} className="border-b border-[#EEF1F5] last:border-0">
                          <td className="px-5 py-2.5 font-medium text-[#1A1D29]">{s.name}</td>
                          <td className="px-3 py-2.5 text-[#6B7280]">{s.grade}</td>
                          <td className="px-3 py-2.5"><span className={`text-xs font-medium px-2 py-0.5 rounded ${STAT_STYLE[stat]}`}>{stat}</span></td>
                          <td className="px-5 py-2.5 text-right">
                            <select
                              value={stat}
                              onChange={e => setStat(s.id, e.target.value as Stat)}
                              className="text-sm rounded-md border border-[#E8EBF1] bg-white text-[#1A1D29] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2F6BFF]"
                            >
                              {STATS.map(st => <option key={st} value={st} className="bg-white text-[#1A1D29]">{st}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                    {roster.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-[#6B7280]">재원생이 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 재원생 피드백 ── (완료 체크 모달 = 상담관리에 반영) */}
          {subTab === 'feedback' && selClass && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {FEEDBACK_PHASES.map(phase => {
                  const r = classPhaseRate(students, feedbacks, selId, CURRENT_SEMESTER_ID, phase);
                  return (
                    <div key={phase} className="bg-white border border-[#E8EBF1] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#1A1D29]">{phase}</span>
                        <span className="text-sm font-bold tabular-nums text-[#2F6BFF]">{r}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-[#EEF1F5]">
                        <div className="h-full rounded-full bg-[#2F6BFF]" style={{ width: `${r}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-white border border-[#E8EBF1] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8EBF1]">
                  <p className="text-sm text-[#6B7280]">학생별 단계 완료 현황 · 체크는 ‘피드백 입력’에서</p>
                  <button onClick={() => setFeedbackOpen(true)} className="px-3 py-1.5 text-sm rounded-md bg-[#2F6BFF] text-white hover:bg-[#1F57E6] transition-colors">피드백 입력 / 수정</button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F4F6FA] border-b border-[#E8EBF1] text-left text-[#1A1D29]">
                      <th className="px-5 py-3 font-semibold">학생</th>
                      {FEEDBACK_PHASES.map(p => <th key={p} className="px-3 py-3 font-semibold text-center">{p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {studentsOfClass(students, selId).map(s => (
                      <tr key={s.id} className="border-b border-[#EEF1F5] last:border-0">
                        <td className="px-5 py-2.5 text-[#1A1D29]">{s.name} <span className="text-xs text-[#9CA3AF]">{s.grade}</span></td>
                        {FEEDBACK_PHASES.map(phase => {
                          const fb = feedbackOf(feedbacks, s.id, CURRENT_SEMESTER_ID, phase);
                          const done = fb?.done ?? false;
                          return (
                            <td key={phase} className="px-3 py-2.5 text-center" title={done ? fb?.memo : undefined}>
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${done ? 'bg-[#E6F9EF] text-[#1FA85C]' : 'border border-dashed border-[#E8EBF1] text-[#AEB4C0]'}`}>{done ? '✓' : '–'}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {studentsOfClass(students, selId).length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-[#6B7280]">재원생이 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 보강 관리 ── */}
          {subTab === 'makeup' && selClass && (
            <div className="bg-white border border-[#E8EBF1] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8EBF1]">
                <h2 className="text-sm font-semibold text-[#1A1D29]">보강 관리</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">결석 학생의 보강 일정을 잡고 안내 문자를 보냅니다 · {selClass.course}</p>
              </div>
              {classMakeups.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-[#6B7280]">보강 대상이 없습니다. ‘반별 출석 현황’에서 결석 처리하면 여기에 보강 대기로 올라옵니다.</p>
              ) : (
                <div className="divide-y divide-[#EEF1F5]">
                  {classMakeups.map(r => {
                    const stu = students.find(s => s.id === r.student_id);
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-[#1A1D29]">{stu?.name ?? r.student_id}</span>
                          <span className="text-xs text-[#9CA3AF] ml-2">결석 {mmdd(r.absent_date)}</span>
                          {r.memo && <span className="text-xs text-[#9CA3AF] ml-2">· {r.memo}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.status === '완료' ? (
                            <span className="text-xs font-medium text-[#1FA85C] bg-[#E6F9EF] px-2 py-0.5 rounded">보강 완료 · {r.makeup_date} {r.makeup_time}</span>
                          ) : r.status === '예정' ? (
                            <>
                              <span className="text-xs text-[#1FA85C]">보강 {r.makeup_date} {r.makeup_time}</span>
                              <button
                                onClick={() => stu && openSms({ recipients: [{ studentId: stu.id, name: stu.name, phone: stu.parent_phone }], template: 'makeup', message: buildMakeupMessage(stu.name, selClass.course, r.makeup_date!, r.makeup_time!) })}
                                className="text-xs px-2.5 py-1 rounded-md border border-[#E8EBF1] text-[#6B7280] hover:text-[#1A1D29] transition-colors"
                              >문자 재발송</button>
                              <button onClick={() => completeMakeup(r.id)} className="text-xs px-2.5 py-1 rounded-md bg-[#E6F9EF] text-[#1FA85C] border border-[#1FA85C]/30 hover:bg-[#1FA85C]/10 transition-colors">완료</button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-medium text-[#F2474B] bg-[#FEE9EA] px-2 py-0.5 rounded">미정</span>
                              {stu && <button onClick={() => setMkPick(stu)} className="text-xs px-2.5 py-1 rounded-md border border-[#2F6BFF] text-[#2F6BFF] hover:bg-[#EAF1FF] transition-colors">보강 잡기</button>}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 피드백 입력 모달 — completeFeedback → 상담관리 재원생 피드백 현황에 반영 */}
      {feedbackOpen && selClass && <FeedbackModal classId={selClass.id} onClose={() => setFeedbackOpen(false)} />}

      {/* 보강 잡기 */}
      {mkPick && selClass && (
        <MakeupPickerModal
          student={mkPick}
          cls={selClass}
          onClose={() => setMkPick(null)}
          onConfirm={(date, time, memo) => {
            const active = requests.find(r => r.student_id === mkPick.id && r.class_id === selId && r.status !== '완료')
              ?? requestMakeup(mkPick.id, selId, TODAY);
            scheduleMakeup(active.id, date, time, memo);
            openSms({
              recipients: [{ studentId: mkPick.id, name: mkPick.name, phone: mkPick.parent_phone }],
              template: 'makeup',
              message: buildMakeupMessage(mkPick.name, selClass.course, date, time),
            });
            showToast(`${mkPick.name} 보강 ${date} ${time} 예약`);
            setMkPick(null);
          }}
        />
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1D29] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{toast}</div>}
    </div>
  );
}
