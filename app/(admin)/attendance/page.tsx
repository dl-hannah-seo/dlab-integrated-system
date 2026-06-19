'use client';

import { useState, useMemo } from 'react';
import {
  classes,
  classGroups,
  students,
  initialAttendance,
  attendanceHistory,
  sessionHistory,
  getAbsenceFocusList,
  getClassRoster,
  TODAY,
  type Attendance,
  type AttendanceStatus,
  type Class,
  type ClassSession,
  type Student,
} from '@/lib/mock-data';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { DonutChart } from '@/components/ui/DonutChart';
import { AbsenceFocusList } from '@/components/attendance/AbsenceFocusList';
import { ClassRecordModal } from '@/components/attendance/ClassRecordModal';
import { MakeupPickerModal } from '@/components/attendance/MakeupPickerModal';
import { useMakeup } from '@/components/panels/MakeupContext';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { useRole } from '@/components/layout/RoleContext';
import { DEMO_TEACHER_ID, DEMO_TEACHER_NAME } from '@/lib/roles';
import { classesOfTeacher } from '@/lib/teacher-hr';
import { buildMakeupMessage } from '@/lib/makeup-helpers';

// 현재 학기(2026 여름) 진행 반만
const CURRENT_CLASSES = classes.filter(c => ['cl-01', 'cl-02', 'cl-03', 'cl-04', 'cl-05', 'cl-06'].includes(c.id));

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>(() => [...attendanceHistory, ...initialAttendance]);
  const [groupFilter, setGroupFilter] = useState('');     // '' = 전체 그룹
  const [classFilter, setClassFilter] = useState('전체');  // '전체' = 전체 반
  const [openClass, setOpenClass] = useState<Class | null>(null);
  const { requests, scheduleMakeup, completeMakeup } = useMakeup();
  const { openSms } = useQuickActions();
  const [mkPick, setMkPick] = useState<{ student: Student; cls: Class } | null>(null);
  const { role } = useRole();
  const isTeacher = role === '교사';
  const myClassIds = useMemo(
    () => (isTeacher ? new Set(classesOfTeacher(DEMO_TEACHER_ID, classes).map(c => c.id)) : null),
    [isTeacher],
  );
  const waitlist = requests.filter(r => r.status !== '완료' && (!myClassIds || myClassIds.has(r.class_id)));

  function updateStatus(sessionId: string, studentId: string, status: AttendanceStatus, absenceReason: string | null) {
    setRecords(prev => {
      const idx = prev.findIndex(r => r.session_id === sessionId && r.student_id === studentId);
      if (idx >= 0) {
        const next = [...prev];
        const rec = next[idx];
        next[idx] = {
          ...rec,
          status,
          source: 'manual',
          absence_reason: status === 'absent' ? absenceReason : null,
          checked_in_at: (status === 'attend' || status === 'makeup') ? (rec.checked_in_at ?? `${TODAY}T09:00:00`) : null,
        };
        return next;
      }
      // 오늘 미기록 셀 등 — 신규 레코드 생성
      return [...prev, {
        id: `ah-${sessionId}-${studentId}`,
        session_id: sessionId,
        enrollment_id: `enr-${studentId}`,
        student_id: studentId,
        status,
        source: 'manual',
        checked_in_at: (status === 'attend' || status === 'makeup') ? `${TODAY}T09:00:00` : null,
        absence_reason: status === 'absent' ? absenceReason : null,
      }];
    });
  }

  // 오늘 KPI — 오늘 회차 레코드 기준.
  // 오늘 회차는 todaySessions(id가 'sess-'로 시작). initialAttendance(sess-01) 및
  // 오늘 셀 편집으로 생성된 레코드(session_id 'sess-0X')가 여기 포함된다.
  const todayRecords = useMemo(
    () => records.filter(r => r.session_id.startsWith('sess-')),
    [records],
  );

  const kpi = useMemo(() => {
    const total = todayRecords.length;
    const attend = todayRecords.filter(r => r.status === 'attend' || r.status === 'makeup').length;
    const absent = todayRecords.filter(r => r.status === 'absent').length;
    const pending = todayRecords.filter(r => r.status === 'pending').length;
    const denom = attend + absent;
    return { total, attend, absent, pending, rate: denom ? Math.round((attend / denom) * 100) : 0 };
  }, [todayRecords]);

  const focusEntries = useMemo(
    () => {
      const ids = (isTeacher ? classesOfTeacher(DEMO_TEACHER_ID, classes) : CURRENT_CLASSES).map(c => c.id);
      return getAbsenceFocusList(records, ids, 8);
    },
    [records, isTeacher],
  );

  const donutSlices = [
    { label: '출석', amount: kpi.attend, color: '#0F7B6C' },
    { label: '미도착', amount: kpi.pending, color: '#C7C6C3' },
    { label: '결석', amount: kpi.absent, color: '#EB5757' },
  ].filter(s => s.amount > 0);

  function openClassById(classId: string) {
    const target = classes.find(c => c.id === classId);
    if (target) setOpenClass(target);
  }

  const todayLabel = `${Number(TODAY.slice(5, 7))}/${Number(TODAY.slice(8, 10))}`;

  // 그룹(연도+학기) 드롭다운 — 활성반·종강반 포함 전체 반 기준
  const groupOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts = [{ value: '', label: '전체 그룹' }];
    for (const c of classes) {
      const cg = classGroups.find(g => g.id === c.class_group_id);
      if (cg) {
        const key = `${cg.year}년 ${cg.season}`;
        if (!seen.has(key)) { seen.add(key); opts.push({ value: key, label: key }); }
      }
    }
    return opts;
  }, []);

  // 선택된 그룹에 속한 반 (활성반·종강반 포함 전체). 교사는 본인 담당 반만.
  const groupClasses = useMemo(
    () => {
      const base = groupFilter === ''
        ? classes
        : classes.filter(c => {
            const cg = classGroups.find(g => g.id === c.class_group_id);
            return cg ? `${cg.year}년 ${cg.season}` === groupFilter : false;
          });
      return myClassIds ? base.filter(c => myClassIds.has(c.id)) : base;
    },
    [groupFilter, myClassIds],
  );

  // 반 드롭다운 — 실제 반 이름(cls.name)으로 표시
  const classOptions = [
    { value: '전체', label: '전체 반' },
    ...groupClasses.map(c => ({ value: c.id, label: c.name })),
  ];

  const targetClasses = classFilter === '전체' ? groupClasses : groupClasses.filter(c => c.id === classFilter);

  // 특정 회차(session_id)의 출결 집계 — 원장 날짜별 표·KPI 공용
  function summaryForSession(sessionId: string | null) {
    if (!sessionId) return null;
    const recs = records.filter(r => r.session_id === sessionId);
    const attendCount = recs.filter(r => r.status === 'attend' || r.status === 'makeup').length;
    const absentCount = recs.filter(r => r.status === 'absent').length;
    const pendingCount = recs.filter(r => r.status === 'pending').length;
    const denom = attendCount + absentCount;
    const pct = denom ? Math.round((attendCount / denom) * 100) : 0;
    return { attendCount, absentCount, pendingCount, denom, pct };
  }
  function sessionOf(classId: string, date: string): ClassSession | null {
    return sessionHistory.find(s => s.class_id === classId && s.session_date === date) ?? null;
  }

  // ── 원장 전용 단순 뷰: 오늘 출결 KPI 4칸 + 반별 표(읽기 전용) ──
  if (role === '원장') {
    const kpiCards = [
      { label: '오늘 출석률', value: kpi.attend + kpi.absent ? `${kpi.rate}%` : '–', sub: '전체 반 평균', color: '#37352F' },
      { label: '출석', value: `${kpi.attend}명`, sub: '정상 출석', color: '#0F7B6C' },
      { label: '미도착', value: `${kpi.pending}명`, sub: '등원 대기', color: '#787774' },
      { label: '결석', value: `${kpi.absent}명`, sub: '미등원', color: kpi.absent > 0 ? '#EB5757' : '#37352F' },
    ];

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#37352F]">출결 현황</h1>
          <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 오늘 ({todayLabel}) 출결 현황</p>
        </div>

        {/* KPI 카드 4칸 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {kpiCards.map(c => (
            <div key={c.label} className="bg-white border border-[#E9E9E7] rounded-lg p-5">
              <p className="text-sm text-[#787774]">{c.label}</p>
              <p className="text-3xl font-bold mt-2" style={{ color: c.color }}>{c.value}</p>
              <p className="text-xs text-[#787774] mt-2">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* 오늘 반별 출석 현황 표 (읽기 전용) */}
        <Card title="반별 출석 현황">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#787774] border-b border-[#E9E9E7]">
                <th className="font-medium pb-2 pr-3">반</th>
                <th className="font-medium pb-2 pr-3">담당</th>
                <th className="font-medium pb-2 pr-3 text-right">출석</th>
                <th className="font-medium pb-2 pr-3 text-right">미도착</th>
                <th className="font-medium pb-2 pr-3 text-right">결석</th>
                <th className="font-medium pb-2 text-right">출석률</th>
              </tr>
            </thead>
            <tbody>
              {CURRENT_CLASSES.map(cls => {
                const sess = sessionOf(cls.id, TODAY);
                const s = summaryForSession(sess?.id ?? null);
                return (
                  <tr key={cls.id} className="border-b border-[#F1F0EF] last:border-0">
                    <td className="py-3 pr-3">
                      <span className="font-semibold text-[#37352F]">{cls.schedule}</span>
                      <span className="text-[#37352F] ml-2">{cls.course}</span>
                    </td>
                    <td className="py-3 pr-3 text-[#787774]">{cls.teacher}</td>
                    {s ? (
                      <>
                        <td className="py-3 pr-3 text-right text-[#0F7B6C]">{s.attendCount}</td>
                        <td className="py-3 pr-3 text-right text-[#787774]">{s.pendingCount}</td>
                        <td className="py-3 pr-3 text-right text-[#EB5757]">{s.absentCount}</td>
                        <td className="py-3 text-right font-semibold text-[#37352F]">{s.denom ? `${s.pct}%` : '미기록'}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 pr-3 text-right text-[#BEBDBA]">–</td>
                        <td className="py-3 pr-3 text-right text-[#BEBDBA]">–</td>
                        <td className="py-3 pr-3 text-right text-[#BEBDBA]">–</td>
                        <td className="py-3 text-right text-[#BEBDBA]">수업 없음</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">출결 현황</h1>
        <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 출석/결석/보강 이력{isTeacher && ` · ${DEMO_TEACHER_NAME} 선생님 담당 반`}</p>
      </div>

      {/* 1행: 당일 원그래프 + 미등원 집중 리스트 */}
      <div className="grid grid-cols-2 gap-4 mb-6 items-stretch">
        <Card title="당일 현황" className="h-full">
          <p className="text-xs text-[#787774] -mt-1 mb-3">오늘 ({todayLabel}) · 미도착 제외 출석률</p>
          {donutSlices.length === 0 ? (
            <p className="text-sm text-[#787774] py-8 text-center">오늘 출결 기록이 없습니다.</p>
          ) : (
            <DonutChart
              slices={donutSlices}
              size={150}
              centerValue={`${kpi.rate}%`}
              centerCaption="출석률"
            />
          )}
        </Card>
        <AbsenceFocusList entries={focusEntries} onSelect={openClassById} />
      </div>

      {/* 보강 대기 목록 — 결석 후 통화 거쳐 나중에 확정/완료 추적 */}
      <Card title="보강 대기 목록" className="mb-6">
        <p className="text-xs text-[#787774] -mt-1 mb-3">결석 후 보강 미정·예정 건 · 통화 후 일정 확정</p>
        {waitlist.length === 0 ? (
          <p className="text-sm text-[#787774] py-6 text-center">보강 대기 건이 없습니다.</p>
        ) : (
          <div className="divide-y divide-[#F1F0EF]">
            {waitlist.map(r => {
              const stu = students.find(s => s.id === r.student_id);
              const cls = classes.find(c => c.id === r.class_id);
              if (!stu || !cls) return null;
              const absentMmdd = `${Number(r.absent_date.slice(5, 7))}/${Number(r.absent_date.slice(8, 10))}`;
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <span className="text-sm text-[#37352F]">{stu.name}</span>
                    <span className="text-xs text-[#787774] ml-2">{cls.schedule} {cls.course}</span>
                    <span className="text-xs text-[#BEBDBA] ml-2">결석 {absentMmdd}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === '예정' ? (
                      <>
                        <span className="text-xs text-[#0F7B6C]">보강 {r.makeup_date} {r.makeup_time}</span>
                        <button
                          onClick={() => openSms({
                            recipients: [{ studentId: stu.id, name: stu.name, phone: stu.parent_phone }],
                            template: 'makeup',
                            message: buildMakeupMessage(stu.name, cls.course, r.makeup_date!, r.makeup_time!),
                          })}
                          className="text-xs px-2.5 py-1 rounded-md border border-[#E9E9E7] text-[#787774] hover:text-[#37352F] transition-colors"
                        >
                          문자 재발송
                        </button>
                        <button
                          onClick={() => completeMakeup(r.id)}
                          className="text-xs px-2.5 py-1 rounded-md bg-[#EDF7F5] text-[#0F7B6C] border border-[#0F7B6C]/30 hover:bg-[#0F7B6C]/10 transition-colors"
                        >
                          완료
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-medium text-[#EB5757] bg-[#FDECEA] px-2 py-0.5 rounded">미정</span>
                        <button
                          onClick={() => setMkPick({ student: stu, cls })}
                          className="text-xs px-2.5 py-1 rounded-md border border-[#FF6C37] text-[#FF6C37] hover:bg-[#FFF1EC] transition-colors"
                        >
                          보강 잡기
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 반 필터 — 그룹(연도+학기) + 반(실제 반 이름) */}
      <div className="flex gap-3 mb-4">
        <Select
          value={groupFilter}
          onChange={e => { setGroupFilter(e.target.value); setClassFilter('전체'); }}
          options={groupOptions}
          className="w-44"
        />
        <Select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          options={classOptions}
          className="w-72"
        />
      </div>

      {/* 반별 카드 (클릭 → 기록부 모달) */}
      <div className="space-y-3">
        {targetClasses.map(cls => {
          const rosterIds = new Set(getClassRoster(cls.id).map(s => s.id));
          const todayCls = records.filter(r => rosterIds.has(r.student_id) && r.session_id.startsWith('sess-'));
          const hasToday = todayCls.length > 0;
          // 오늘 회차가 있으면 당일 요약, 없으면(종강반 등) 그 반 과거 회차 전체로 누적 요약
          const summaryRecs = hasToday
            ? todayCls
            : records.filter(r => rosterIds.has(r.student_id) && r.session_id.startsWith(`sh-${cls.id}-`));
          const attendCount = summaryRecs.filter(r => r.status === 'attend' || r.status === 'makeup').length;
          const absentCount = summaryRecs.filter(r => r.status === 'absent').length;
          const pendingCount = summaryRecs.filter(r => r.status === 'pending').length;
          const denom = attendCount + absentCount;
          const pct = denom ? Math.round((attendCount / denom) * 100) : 0;

          return (
            <button
              key={cls.id}
              onClick={() => setOpenClass(cls)}
              className="w-full text-left bg-white border border-[#E9E9E7] rounded-lg px-5 py-4 hover:border-[#FF6C37]/50 hover:bg-[#FFFBFA] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#37352F]">{cls.schedule}</span>
                  <span className="text-sm text-[#37352F]">{cls.course}</span>
                  <span className="text-xs text-[#787774]">담당: {cls.teacher}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#0F7B6C]">출석 {attendCount}</span>
                  {hasToday && <span className="text-[#787774]">미도착 {pendingCount}</span>}
                  <span className="text-[#EB5757]">결석 {absentCount}</span>
                  <span className="font-semibold text-[#37352F]">
                    {denom ? `${!hasToday ? '누적 ' : ''}${pct}%` : '미기록'}
                  </span>
                  <span className="text-[#BEBDBA]">›</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {openClass && (
        <ClassRecordModal
          cls={openClass}
          records={records}
          onClose={() => setOpenClass(null)}
          onEdit={updateStatus}
        />
      )}

      {mkPick && (
        <MakeupPickerModal
          student={mkPick.student}
          cls={mkPick.cls}
          onClose={() => setMkPick(null)}
          onConfirm={(date, time, memo) => {
            const req = requests.find(
              r => r.student_id === mkPick.student.id && r.class_id === mkPick.cls.id && r.status !== '완료',
            );
            if (req) scheduleMakeup(req.id, date, time, memo);
            openSms({
              recipients: [{ studentId: mkPick.student.id, name: mkPick.student.name, phone: mkPick.student.parent_phone }],
              template: 'makeup',
              message: buildMakeupMessage(mkPick.student.name, mkPick.cls.course, date, time),
            });
            setMkPick(null);
          }}
        />
      )}
    </div>
  );
}
