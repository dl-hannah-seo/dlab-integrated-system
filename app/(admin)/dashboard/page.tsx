'use client';

import Link from 'next/link';
import {
  campus,
  dashboardData,
  classes,
  students,
  getUnpaidStudents,
  getClassById,
  getClassRoster,
  FEEDBACK_PHASES,
  CURRENT_SEMESTER_ID,
} from '@/lib/mock-data';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { useRole } from '@/components/layout/RoleContext';
import { useFeedbacks } from '@/components/panels/FeedbackContext';
import { useMakeup } from '@/components/panels/MakeupContext';
import { DEMO_TEACHER_ID, DEMO_TEACHER_NAME } from '@/lib/roles';
import { classesOfTeacher } from '@/lib/teacher-hr';
import { classPhaseRate } from '@/lib/feedback';
import { atRiskStudents } from '@/lib/at-risk';
import { Card } from '@/components/ui/Card';
import { QuarterlyPnlTable } from '@/components/dashboard/QuarterlyPnlTable';
import { ConsultFunnelCard } from '@/components/dashboard/ConsultFunnelCard';
import { AtRiskList } from '@/components/dashboard/AtRiskList';
import { MissedConsultList } from '@/components/dashboard/MissedConsultList';

export default function DashboardPage() {
  const { openSms } = useQuickActions();
  const { role } = useRole();
  const { feedbacks } = useFeedbacks();
  const { requests } = useMakeup();

  // 교사: 담당 반 + 재원생 피드백 요약 + 보강 대기
  const myClasses = classesOfTeacher(DEMO_TEACHER_ID, classes);
  const myClassIds = new Set(myClasses.map((c) => c.id));
  const myMakeups = requests.filter((r) => myClassIds.has(r.class_id) && r.status !== '완료');

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

        {/* ④ KPI 비교 — 수업당·연구원당 학생 수 */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: '수업당 학생 수', mine: 3.5, avg: 4.2, unit: '명' },
            { title: '연구원당 학생 수', mine: 37, avg: 33, unit: '명' },
          ].map(({ title, mine, avg, unit }) => (
            <div key={title} className="rounded-2xl border border-[#EEF1F5] bg-white p-5 shadow-[0_2px_8px_rgba(20,30,55,0.05)]">
              <p className="text-base font-semibold text-[#1A1D29] mb-4">{title}</p>
              <div className="flex items-end gap-8">
                <div>
                  <p className="text-[11px] text-[#6B7280] mb-0.5">캠퍼스</p>
                  <p className="text-3xl font-bold text-[#1A1D29] tabular-nums">{mine}<span className="text-base font-normal ml-0.5">{unit}</span></p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6B7280] mb-0.5">전체 평균</p>
                  <p className="text-3xl font-bold text-[#2F6BFF] tabular-nums">{avg}<span className="text-base font-normal ml-0.5">{unit}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>

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
      <h1 className="text-xl font-bold text-[#1A1D29]">{DEMO_TEACHER_NAME} 선생님</h1>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
        {/* 왼쪽 컬럼 */}
        <div className="space-y-4">
          {/* 내 수업 */}
          <Card title="내 수업" action={<Link href="/teaching" className="text-xs text-[#6B7280] hover:text-[#1A1D29]">수업관리 →</Link>}>
            {myClasses.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#6B7280]">담당 수업이 없습니다</p>
            ) : (
              <ul className="space-y-2.5">
                {myClasses.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-[#2F6BFF]">{c.schedule}</span>
                    <span className="flex-1 text-sm text-[#1A1D29]">{c.course}</span>
                    <span className="text-xs text-[#6B7280]">{getClassRoster(c.id).length}명</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 보강 대기 */}
          <Card title={`보강 대기 ${myMakeups.length}건`} action={<Link href="/teaching" className="text-xs text-[#6B7280] hover:text-[#1A1D29]">보강 관리 →</Link>}>
            {myMakeups.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#6B7280]">보강 대기 건이 없습니다</p>
            ) : (
              <ul className="-my-1 max-h-56 space-y-1 overflow-y-auto">
                {myMakeups.map((r) => {
                  const stu = students.find((s) => s.id === r.student_id);
                  const cls = getClassById(r.class_id);
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2 border-b border-[#EEF1F5] last:border-0">
                      <div className="min-w-0">
                        <span className="text-sm text-[#1A1D29]">{stu?.name ?? r.student_id}</span>
                        <span className="ml-2 text-xs text-[#6B7280]">{cls?.course}</span>
                      </div>
                      {r.status === '예정' ? (
                        <span className="shrink-0 text-xs text-[#1FA85C]">보강 {r.makeup_date} {r.makeup_time}</span>
                      ) : (
                        <span className="shrink-0 text-xs font-medium text-[#F2474B] bg-[#FEE9EA] px-2 py-0.5 rounded">미정</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* 오른쪽 컬럼 */}
        <div className="space-y-4">
          {/* 재원생 피드백 요약 */}
          <Card title="재원생 피드백 요약" action={<Link href="/teaching" className="text-xs text-[#6B7280] hover:text-[#1A1D29]">입력 →</Link>}>
            {myClasses.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#6B7280]">담당 반이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {myClasses.map((c) => (
                  <div key={c.id} className="rounded-lg border border-[#E8EBF1] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1A1D29]">{c.course}</span>
                      <span className="text-xs text-[#6B7280]">{getClassRoster(c.id).length}명</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {FEEDBACK_PHASES.map((phase) => {
                        const rate = classPhaseRate(students, feedbacks, c.id, CURRENT_SEMESTER_ID, phase);
                        return (
                          <div key={phase}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#6B7280]">{phase}</span>
                              <span className="font-semibold tabular-nums text-[#2F6BFF]">{rate}%</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-[#EEF1F5]">
                              <div className="h-full rounded-full bg-[#2F6BFF]" style={{ width: `${rate}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
