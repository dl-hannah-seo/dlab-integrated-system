'use client';

import { useMemo, useState } from 'react';
import { classes, getClassRoster, type Class, type Student } from '@/lib/mock-data';
import { DEMO_TEACHER_ID, DEMO_TEACHER_NAME } from '@/lib/roles';
import { classesOfTeacher } from '@/lib/teacher-hr';
import { buildMakeupMessage } from '@/lib/makeup-helpers';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { MakeupPickerModal } from '@/components/attendance/MakeupPickerModal';

// 출결 상태(데모) — 본인 수업별 학생 출결
type Stat = '예정' | '출석' | '결석' | '보강';
const STATS: Stat[] = ['예정', '출석', '결석', '보강'];
const STAT_STYLE: Record<Stat, string> = {
  '예정': 'bg-[#EEF1F5] text-[#6B7280]',
  '출석': 'bg-[#E6F9EF] text-[#1FA85C]',
  '결석': 'bg-[#FEE9EA] text-[#F2474B]',
  '보강': 'bg-[#EAF1FF] text-[#2F6BFF]',
};

// 콘텐츠(오늘 수업 자료) 테마 — 과목별 표시용
const CONTENT_BY_SUBJECT: Record<string, string> = {
  'sub-python': '코딩 사고력',
  'sub-arduino': '피지컬 컴퓨팅',
  'sub-custom': '창의 메이커',
};

interface Feedback { homework: boolean; participation: number; }
interface MakeupRec { date: string; time: string; memo?: string; done: boolean; }
type View = 'roster' | 'makeup';

const levelOf = (points: number) => Math.max(1, Math.floor(points / 300) + 1);
const key = (classId: string, studentId: string) => `${classId}:${studentId}`;

export default function TeachingPage() {
  const { openRecording, openSms } = useQuickActions();
  const myClasses = useMemo(() => classesOfTeacher(DEMO_TEACHER_ID, classes), []);
  const [selId, setSelId] = useState(myClasses[0]?.id ?? '');

  // 데모 초기 상태 — 전 담당 반 학생의 출결(예정)·피드백 시드
  function buildSeed() {
    const att: Record<string, Stat> = {};
    const fb: Record<string, Feedback> = {};
    myClasses.forEach(c => {
      getClassRoster(c.id).forEach((s, i) => {
        att[key(c.id, s.id)] = '예정';
        fb[key(c.id, s.id)] = { homework: i % 3 !== 2, participation: 3 + (i % 3) };
      });
    });
    return { att, fb };
  }
  const [seed] = useState(buildSeed);
  const [attendance, setAttendance] = useState<Record<string, Stat>>(seed.att);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>(seed.fb);
  const [makeups, setMakeups] = useState<Record<string, MakeupRec>>({});
  const [view, setView] = useState<View>('roster');
  const [mkPick, setMkPick] = useState<Student | null>(null);

  function resetDemo() {
    const s = buildSeed();
    setAttendance(s.att);
    setFeedback(s.fb);
    setMakeups({});
    setView('roster');
  }
  function setStat(studentId: string, stat: Stat) {
    setAttendance(prev => ({ ...prev, [key(selId, studentId)]: stat }));
  }
  function toggleHomework(studentId: string) {
    setFeedback(prev => {
      const k = key(selId, studentId);
      return { ...prev, [k]: { ...prev[k], homework: !prev[k].homework } };
    });
  }
  function setParticipation(studentId: string, n: number) {
    setFeedback(prev => {
      const k = key(selId, studentId);
      return { ...prev, [k]: { ...prev[k], participation: n } };
    });
  }
  function scheduleMakeup(student: Student, date: string, time: string, memo?: string) {
    setMakeups(prev => ({ ...prev, [key(selId, student.id)]: { date, time, memo, done: false } }));
  }
  function completeMakeup(studentId: string) {
    setMakeups(prev => {
      const k = key(selId, studentId);
      return prev[k] ? { ...prev, [k]: { ...prev[k], done: true } } : prev;
    });
  }

  const selClass = myClasses.find(c => c.id === selId) ?? null;
  const roster = selClass ? getClassRoster(selClass.id) : [];
  const attended = roster.filter(s => attendance[key(selId, s.id)] === '출석').length;
  const content = selClass ? (CONTENT_BY_SUBJECT[selClass.subject_id] ?? selClass.course) : '-';
  // 보강 대상 = 결석 처리됐거나 이미 보강이 잡힌 학생
  const makeupRoster = roster.filter(s => attendance[key(selId, s.id)] === '결석' || makeups[key(selId, s.id)]);

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D29]">수업관리</h1>
          <p className="text-sm text-[#6B7280] mt-1">{DEMO_TEACHER_NAME} 선생님 · 담당 반별 출결과 재원생 피드백</p>
        </div>
        <button
          onClick={resetDemo}
          className="px-3 py-1.5 text-sm rounded-md border border-[#E8EBF1] text-[#6B7280] hover:text-[#1A1D29] hover:border-[#2F6BFF] transition-colors"
        >
          ↻ 데모 초기화
        </button>
      </div>

      {myClasses.length === 0 ? (
        <div className="bg-white border border-[#E8EBF1] rounded-lg py-16 text-center text-sm text-[#6B7280]">
          담당 반이 없습니다.
        </div>
      ) : (
        <>
          {/* 반 탭 */}
          <div className="flex flex-wrap gap-2 mb-5">
            {myClasses.map(c => (
              <button
                key={c.id}
                onClick={() => setSelId(c.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  c.id === selId
                    ? 'bg-[#2F6BFF] text-white border-[#2F6BFF]'
                    : 'bg-white text-[#1A1D29] border-[#E8EBF1] hover:border-[#2F6BFF]/50'
                }`}
              >
                {c.course}
              </button>
            ))}
          </div>

          {/* 요약 카드 3개 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SummaryCard label="수업" value={selClass?.course ?? '-'} caption={`${selClass?.schedule ?? ''}${selClass?.room ? ` · ${selClass.room}` : ''}`} />
            <SummaryCard label="출석" value={`${attended}/${roster.length}명`} caption="출석 현황" />
            <SummaryCard label="콘텐츠" value={content} caption="오늘 수업 자료" />
          </div>

          {/* 뷰 전환 — 출결·피드백 / 보강 관리 */}
          <div className="inline-flex rounded-lg border border-[#E8EBF1] bg-white p-0.5 mb-4">
            {(([['roster', '출결·피드백'], ['makeup', '보강 관리']]) as [View, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === v ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium' : 'text-[#6B7280] hover:text-[#1A1D29]'
                }`}
              >
                {label}{v === 'makeup' && makeupRoster.length > 0 ? ` ${makeupRoster.length}` : ''}
              </button>
            ))}
          </div>

          {/* 학생 출결 관리 */}
          {view === 'roster' ? (
          <div className="bg-white border border-[#E8EBF1] rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8EBF1]">
              <h2 className="text-sm font-semibold text-[#1A1D29]">학생 출석 관리</h2>
              <button
                onClick={openRecording}
                className="px-3 py-1.5 text-sm rounded-md bg-[#2F6BFF] text-white hover:bg-[#1F57E6] transition-colors"
              >
                🎙 녹음 시작
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#6B7280] border-b border-[#E8EBF1]">
                    <th className="font-medium px-5 py-3">학생</th>
                    <th className="font-medium px-3 py-3">레벨</th>
                    <th className="font-medium px-3 py-3">포인트</th>
                    <th className="font-medium px-3 py-3">과제</th>
                    <th className="font-medium px-3 py-3">참여도</th>
                    <th className="font-medium px-3 py-3">상태</th>
                    <th className="font-medium px-5 py-3 text-right">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map(s => {
                    const k = key(selId, s.id);
                    const stat = attendance[k] ?? '예정';
                    const fb = feedback[k] ?? { homework: false, participation: 0 };
                    return (
                      <tr key={s.id} className="border-b border-[#EEF1F5] last:border-0">
                        <td className="px-5 py-3 font-medium text-[#1A1D29]">{s.name}</td>
                        <td className="px-3 py-3 text-[#6B7280] tabular-nums">Lv.{levelOf(s.points)}</td>
                        <td className="px-3 py-3 text-[#1A1D29] tabular-nums">{s.points.toLocaleString('ko-KR')}P</td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => toggleHomework(s.id)}
                            className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
                              fb.homework ? 'bg-[#E6F9EF] text-[#1FA85C]' : 'bg-[#FEE9EA] text-[#F2474B]'
                            }`}
                          >
                            {fb.homework ? '완료' : '미완료'}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <Stars value={fb.participation} onChange={n => setParticipation(s.id, n)} />
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${STAT_STYLE[stat]}`}>{stat}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
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
                </tbody>
              </table>
            </div>
          </div>
          ) : (
            /* 보강 관리 — 결석 학생 보강 일정 잡기 */
            <div className="bg-white border border-[#E8EBF1] rounded-lg">
              <div className="px-5 py-4 border-b border-[#E8EBF1]">
                <h2 className="text-sm font-semibold text-[#1A1D29]">보강 관리</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">결석 학생의 보강 일정을 잡고 안내 문자를 보냅니다 · {selClass?.course}</p>
              </div>
              {makeupRoster.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-[#6B7280]">
                  결석 학생이 없습니다. ‘출결·피드백’에서 결석 처리하면 여기서 보강을 잡을 수 있어요.
                </p>
              ) : (
                <div className="divide-y divide-[#EEF1F5]">
                  {makeupRoster.map(s => {
                    const mk = makeups[key(selId, s.id)];
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-[#1A1D29]">{s.name}</span>
                          <span className="text-xs font-medium text-[#F2474B] bg-[#FEE9EA] px-1.5 py-0.5 rounded ml-2">결석</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!mk ? (
                            <button
                              onClick={() => setMkPick(s)}
                              className="text-xs px-2.5 py-1 rounded-md border border-[#2F6BFF] text-[#2F6BFF] hover:bg-[#EAF1FF] transition-colors"
                            >
                              보강 잡기
                            </button>
                          ) : mk.done ? (
                            <span className="text-xs font-medium text-[#1FA85C] bg-[#E6F9EF] px-2 py-0.5 rounded">보강 완료 · {mk.date} {mk.time}</span>
                          ) : (
                            <>
                              <span className="text-xs text-[#1FA85C]">보강 {mk.date} {mk.time}</span>
                              <button
                                onClick={() => openSms({
                                  recipients: [{ studentId: s.id, name: s.name, phone: s.parent_phone }],
                                  template: 'makeup',
                                  message: buildMakeupMessage(s.name, selClass?.course ?? '', mk.date, mk.time),
                                })}
                                className="text-xs px-2.5 py-1 rounded-md border border-[#E8EBF1] text-[#6B7280] hover:text-[#1A1D29] transition-colors"
                              >
                                문자 재발송
                              </button>
                              <button
                                onClick={() => completeMakeup(s.id)}
                                className="text-xs px-2.5 py-1 rounded-md bg-[#E6F9EF] text-[#1FA85C] border border-[#1FA85C]/30 hover:bg-[#1FA85C]/10 transition-colors"
                              >
                                완료
                              </button>
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

          {mkPick && selClass && (
            <MakeupPickerModal
              student={mkPick}
              cls={selClass}
              onClose={() => setMkPick(null)}
              onConfirm={(date, time, memo) => {
                scheduleMakeup(mkPick, date, time, memo);
                openSms({
                  recipients: [{ studentId: mkPick.id, name: mkPick.name, phone: mkPick.parent_phone }],
                  template: 'makeup',
                  message: buildMakeupMessage(mkPick.name, selClass.course, date, time),
                });
                setMkPick(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="bg-white border border-[#E8EBF1] rounded-lg p-5">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p className="text-2xl font-bold text-[#1A1D29] mt-2 truncate">{value}</p>
      <p className="text-xs text-[#6B7280] mt-2">{caption}</p>
    </div>
  );
}

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-label={`참여도 ${n}점`}
          className={`text-base leading-none ${n <= value ? 'text-[#F5A623]' : 'text-[#D1D5DB]'} hover:text-[#F5A623] transition-colors`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
