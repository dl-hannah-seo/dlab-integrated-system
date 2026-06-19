'use client';

import Link from 'next/link';
import {
  campus,
  dashboardData,
  classes,
  consultations,
  students,
  getUnpaidStudents,
  getClassById,
} from '@/lib/mock-data';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { useRole } from '@/components/layout/RoleContext';
import { DEMO_TEACHER_ID, DEMO_TEACHER_NAME, canSeeExtra } from '@/lib/roles';
import { classesOfTeacher, consultationsByCounselor } from '@/lib/teacher-hr';
import { atRiskStudents } from '@/lib/at-risk';
import { Card } from '@/components/ui/Card';
import { AreaTrendChart } from '@/components/ui/AreaTrendChart';
import { QuarterlyPnlTable } from '@/components/dashboard/QuarterlyPnlTable';
import { ConsultFunnelCard } from '@/components/dashboard/ConsultFunnelCard';
import { AtRiskList } from '@/components/dashboard/AtRiskList';
import { MissedConsultList } from '@/components/dashboard/MissedConsultList';

// ── 데모 기준 ──────────────────────────────────────────────────
// 실제 today/주간 집계 연동 전까지 사용하는 목업 상수.
// 연동 시: TODAY_DOW → 실제 요일, weeklyAttendance → attendance 집계로 교체.
const TODAY_DOW = '토';
const TODAY_LABEL = '2026년 6월 14일 토요일';

// 주간 출결 추이 (데모 집계값) — 미래 요일은 rate=null → 흐리게
const weeklyAttendance: { day: string; rate: number | null; today?: boolean }[] = [
  { day: '월', rate: 88 },
  { day: '화', rate: 92 },
  { day: '수', rate: 85 },
  { day: '목', rate: 90 },
  { day: '금', rate: 87 },
  { day: '토', rate: 93, today: true },
  { day: '일', rate: null },
];

// 오늘(=토) 진행 출석 스냅샷 (데모) — 건강한 개관용 집계값
const todayAttendRate = 93;
const todayAttended = 37;
const todayTotalAttending = 40;

export default function DashboardPage() {
  const { openAttendance, openSms, openRecording } = useQuickActions();
  const { role } = useRole();
  const isTeacher = role === '교사';
  const showQuick = canSeeExtra(role, 'quickActions');

  // 오늘 수업 — 교사는 본인 담당 반만
  const todayClasses = isTeacher
    ? classesOfTeacher(DEMO_TEACHER_ID, classes).filter((c) => c.enrolled_count > 0)
    : classes.filter((c) => c.enrolled_count > 0 && c.schedule.includes(TODAY_DOW));

  // 교사 본인 상담
  const myConsults = consultationsByCounselor(DEMO_TEACHER_NAME, consultations);

  const enrolledTotal = dashboardData.total_students;

  // 납부 현황
  const paid = dashboardData.paid_students;
  const unpaid = dashboardData.unpaid_students;
  const paidPct = Math.round((paid / enrolledTotal) * 1000) / 10;
  const unpaidStudents = getUnpaidStudents();

  function handleUnpaidSms() {
    openSms({
      recipients: unpaidStudents.map((s) => ({
        studentId: s.id,
        name: s.name,
        phone: s.parent_phone,
      })),
      template: 'unpaid',
    });
  }

  // ── 원장·SO 대시보드 (SO는 분기 손익 카드 제외) ──────────────
  if (role === '원장' || role === 'SO') {
    const unpaidIds = new Set(unpaidStudents.map((s) => s.id));
    const atRisk = atRiskStudents(students, unpaidIds);

    return (
      <div className="space-y-6">
        {/* ① 분기 손익 — 성장 추이(학생수·총매출) + 손익 표 (원장 전용) */}
        {role === '원장' && <QuarterlyPnlTable />}

        {/* ③ 홍보 → 상담 → 등록 → 퇴원 전환 흐름 */}
        <ConsultFunnelCard />

        {/* ⑤ 관리 항목 — 퇴원 가능성 · 상담 미결 */}
        <div className="grid gap-6 md:grid-cols-2">
          <AtRiskList entries={atRisk} />
          <MissedConsultList />
        </div>

        {/* ⑤-2 납부 현황 도넛 + 미납 원생 */}
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
          <Card title="납부 현황">
            <div className="flex flex-col items-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full chart-fade-in"
                style={{ background: `conic-gradient(#2F6BFF 0% ${paidPct}%, #F2474B ${paidPct}% 100%)` }}>
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-2xl font-bold text-[#1A1D29]">{paidPct}%</span>
                  <span className="text-[11px] text-[#6B7280]">완납률</span>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[#1A1D29]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2F6BFF]" />완납 {paid}
                </span>
                <span className="flex items-center gap-1.5 text-[#1A1D29]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F2474B]" />미납 {unpaid}
                </span>
              </div>
            </div>
          </Card>
          <Card
            title={`미납 원생 ${unpaidStudents.length}명`}
            action={<button onClick={handleUnpaidSms} className="text-xs font-medium text-[#2F6BFF] hover:underline">문자 발송</button>}
          >
            <ul className="-my-1 max-h-44 space-y-1 overflow-y-auto">
              {unpaidStudents.map((s) => {
                const cls = getClassById(s.class_id);
                return (
                  <li key={s.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-[#1A1D29]">{s.name}</span>
                    <span className="ml-3 shrink truncate text-xs text-[#6B7280]" title={cls?.name}>{cls ? `${cls.course} · ${cls.schedule}` : '반 미지정'}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ② 2단 본문 */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
        {/* 왼쪽 컬럼 */}
        <div className="space-y-4">
          {/* 오늘/내 수업 */}
          <Card
            title={isTeacher ? '내 수업' : '오늘 수업'}
            action={
              <Link href="/attendance" className="text-xs text-[#6B7280] hover:text-[#1A1D29]">
                출결 현황 →
              </Link>
            }
          >
            {todayClasses.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#6B7280]">{isTeacher ? '담당 수업이 없습니다' : '오늘 수업이 없습니다'}</p>
            ) : (
              <ul className="space-y-2.5">
                {todayClasses.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium text-[#2F6BFF]">
                      {isTeacher ? c.schedule : c.schedule.replace(`${TODAY_DOW} `, '')}
                    </span>
                    <span className="flex-1 text-sm text-[#1A1D29]">{c.course}</span>
                    <span className="text-xs text-[#6B7280]">
                      {c.enrolled_count}/{c.capacity}명
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 빠른 실행 — 교사·SO (원장 제외) */}
          {showQuick && (
          <div className="rounded-lg bg-[#EAF1FF] p-5">
            <p className="mb-3 text-sm font-semibold text-[#1A1D29]">빠른 실행</p>
            <div className="flex gap-2.5">
              <button
                onClick={openAttendance}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-[#1A1D29] shadow-sm transition-colors hover:bg-[#EAF1FF]"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#2F6BFF" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                출석 체크
              </button>
              <button
                onClick={() => openSms()}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-[#1A1D29] shadow-sm transition-colors hover:bg-[#EAF1FF]"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#2F6BFF" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                문자 발송
              </button>
              <button
                onClick={openRecording}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-medium text-[#1A1D29] shadow-sm transition-colors hover:bg-[#EAF1FF]"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#2F6BFF" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v3m0-3a4 4 0 01-4-4V7a4 4 0 118 0v4a4 4 0 01-4 4z" />
                </svg>
                AI 녹음
              </button>
            </div>
          </div>
          )}
        </div>

        {/* 오른쪽 컬럼 */}
        <div className="space-y-4">
          {/* 주간 출결 추이 — 부드러운 영역 차트 */}
          <Card
            title={isTeacher ? '내 수업 출결 추이' : '주간 출결 추이'}
            action={<span className="text-xs text-[#6B7280]">오늘 <span className="font-semibold text-[#2F6BFF] tabular-nums">{todayAttendRate}%</span></span>}
          >
            <AreaTrendChart
              series={[{ values: weeklyAttendance.map((d) => d.rate), color: '#2F6BFF', fill: true }]}
              labels={weeklyAttendance.map((d) => d.day)}
              currentIdx={weeklyAttendance.findIndex((d) => d.today)}
              height={150}
            />
          </Card>

          {/* 납부 현황 + 미납 원생 (교사는 본인 상담으로 대체) */}
          {!isTeacher ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
            {/* 도넛 */}
            <Card title="납부 현황">
              <div className="flex flex-col items-center">
                <div
                  className="relative flex h-36 w-36 items-center justify-center rounded-full chart-fade-in"
                  style={{
                    background: `conic-gradient(#2F6BFF 0% ${paidPct}%, #F2474B ${paidPct}% 100%)`,
                  }}
                >
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-2xl font-bold text-[#1A1D29]">{paidPct}%</span>
                    <span className="text-[11px] text-[#6B7280]">완납률</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-[#1A1D29]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2F6BFF]" />
                    완납 {paid}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#1A1D29]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F2474B]" />
                    미납 {unpaid}
                  </span>
                </div>
              </div>
            </Card>

            {/* 미납 원생 목록 */}
            <Card
              title={`미납 원생 ${unpaidStudents.length}명`}
              action={
                <button
                  onClick={handleUnpaidSms}
                  className="text-xs font-medium text-[#2F6BFF] hover:underline"
                >
                  문자 발송
                </button>
              }
            >
              <ul className="-my-1 max-h-44 space-y-1 overflow-y-auto">
                {unpaidStudents.map((s) => {
                  const cls = getClassById(s.class_id);
                  return (
                    <li key={s.id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-[#1A1D29]">{s.name}</span>
                      <span className="ml-3 shrink truncate text-xs text-[#6B7280]" title={cls?.name}>{cls ? `${cls.course} · ${cls.schedule}` : '반 미지정'}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
          ) : (
          <Card title={`내 상담 ${myConsults.length}건`} action={<Link href="/students" className="text-xs text-[#6B7280] hover:text-[#1A1D29]">원생 →</Link>}>
            {myConsults.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#6B7280]">진행한 상담이 없습니다</p>
            ) : (
              <ul className="-my-1 max-h-56 space-y-1 overflow-y-auto">
                {myConsults.map((c) => (
                  <li key={c.id} className="py-2 border-b border-[#EEF1F5] last:border-0">
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <span className="tabular-nums">{c.date}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#EEF1F5]">{c.method}</span>
                    </div>
                    <p className="text-sm text-[#1A1D29] mt-0.5">{c.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
