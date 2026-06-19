'use client';

import { useMemo, useState } from 'react';
import {
  convertLeadToStudent,
  type Lead, type LeadStage,
} from '@/lib/mock-data';
import { consultsOfLead } from '@/lib/lead-consults';
import { useLeads } from '@/components/panels/LeadsContext';
import { useLeadConsults } from '@/components/panels/LeadConsultContext';
import { useRole } from '@/components/layout/RoleContext';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LeadConsultModal } from '@/components/leads/LeadConsultModal';
import { NewLeadModal } from '@/components/leads/NewLeadModal';
import { FeedbackStatusTab } from '@/components/leads/FeedbackStatusTab';

/** 미결(진행 중) = 등록·미등록이 아닌 단계 */
const OPEN_STAGES: LeadStage[] = ['신규문의', '상담예약', '상담완료'];

type Tab = 'new' | 'enrolled';

export default function LeadsPage() {
  const [tab, setTab] = useState<Tab>('new');
  const [toast, setToast] = useState<string | null>(null);
  function showToast(m: string) { setToast(m); setTimeout(() => setToast(null), 2200); }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1A1D29]">상담 관리</h1>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#E8EBF1]">
        {([['new', '신규상담'], ['enrolled', '재원생 피드백']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm -mb-px border-b-2 transition-colors ${
              tab === key
                ? 'border-[#2F6BFF] text-[#2F6BFF] font-medium'
                : 'border-transparent text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'new' ? <NewConsultTab onToast={showToast} /> : <FeedbackStatusTab />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#1A1D29] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── 신규상담 탭: 예비원생(리드) 파이프라인 + 다회 상담 모달 ─────────
function NewConsultTab({ onToast }: { onToast: (m: string) => void }) {
  const { role } = useRole();
  const { openRecording } = useQuickActions();
  const { leads, updateStage } = useLeads();
  const { consults } = useLeadConsults();
  const canRecord = role === '원장' || role === 'SO';

  // 미결(진행 중) 누적 — 학기 무관, 문의일 오름차순(오래 대기 우선). 등록 전환 시 목록에서 빠짐.
  const rows = useMemo(
    () => leads.filter(l => OPEN_STAGES.includes(l.stage))
      .sort((a, b) => a.inquiry_date.localeCompare(b.inquiry_date)),
    [leads],
  );

  // 다회 상담 모달
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<'auto' | 'new'>('auto');
  const [manualOpen, setManualOpen] = useState(false);
  const selectedLead = selectedId ? leads.find(l => l.id === selectedId) ?? null : null;
  function openModal(id: string, tab: 'auto' | 'new') { setSelectedId(id); setInitialTab(tab); }

  function handleStageChange(lead: Lead, next: LeadStage) {
    if (next === '등록' && lead.stage !== '등록') {
      convertLeadToStudent(lead);
      onToast(`${lead.name} 학생이 원생 관리로 이동되었습니다.`);
    }
    updateStage(lead.id, next);
  }

  return (
    <div>
      {/* 신규 상담 진입 — 상단 중앙 (원장·SO) */}
      {canRecord && (
        <div className="mb-8 flex flex-col items-center gap-2.5">
          <Button size="lg" onClick={openRecording} className="px-8 py-4 text-base">
            <span className="inline-flex items-center gap-2">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v3m0-3a4 4 0 01-4-4V7a4 4 0 118 0v4a4 4 0 01-4 4z" />
              </svg>
              신규 상담 AI 녹음
            </span>
          </Button>
          <button
            onClick={() => setManualOpen(true)}
            className="text-sm text-[#6B7280] hover:text-[#2F6BFF] underline underline-offset-2 transition-colors"
          >
            신규 상담 수기 등록
          </button>
        </div>
      )}

      {/* 리드 목록 — 행 클릭 시 다회 상담 모달. 미결 누적(문의일 기준). */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F6FA] border-b border-[#E8EBF1] text-left text-[#1A1D29]">
                <th className="px-3 py-2.5 font-semibold">이름</th>
                <th className="px-3 py-2.5 font-semibold">학년</th>
                <th className="px-3 py-2.5 font-semibold">관심 과목</th>
                <th className="px-3 py-2.5 font-semibold">유입경로</th>
                <th className="px-3 py-2.5 font-semibold">문의일</th>
                <th className="px-3 py-2.5 font-semibold text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(l => {
                const n = consultsOfLead(consults, l.id).length;
                const isEnrolled = l.stage === '등록';
                return (
                  <tr
                    key={l.id}
                    onClick={() => openModal(l.id, 'auto')}
                    className="border-b border-[#EEF1F5] cursor-pointer hover:bg-[#EAF1FF]"
                  >
                    <td className="px-3 py-2.5 text-[#1A1D29] font-medium">{l.name}</td>
                    <td className="px-3 py-2.5 text-[#6B7280]">{l.grade ?? '-'}</td>
                    <td className="px-3 py-2.5 text-[#1A1D29]">{l.interest_subject}</td>
                    <td className="px-3 py-2.5 text-[#6B7280]">{l.source}</td>
                    <td className="px-3 py-2.5 text-[#6B7280] tabular-nums">{l.inquiry_date.slice(5)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openModal(l.id, 'auto')}
                          className="rounded-md border border-[#E8EBF1] px-2.5 py-1 text-xs text-[#1A1D29] hover:border-[#2F6BFF] hover:text-[#2F6BFF] transition-colors"
                        >
                          이력보기{n > 0 ? ` (${n})` : ''}
                        </button>
                        <button
                          onClick={() => openModal(l.id, 'new')}
                          className="rounded-md border border-[#E8EBF1] px-2.5 py-1 text-xs text-[#1A1D29] hover:border-[#2F6BFF] hover:text-[#2F6BFF] transition-colors"
                        >
                          추가상담기록하기
                        </button>
                        {isEnrolled ? (
                          <span className="rounded-md bg-[#E6F9EF] px-2.5 py-1 text-xs text-[#28C76F]">등록됨 ✓</span>
                        ) : (
                          <button
                            onClick={() => handleStageChange(l, '등록')}
                            className="rounded-md bg-[#2F6BFF] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1F57E6] transition-colors"
                          >
                            등록 전환
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-[#6B7280]">표시할 예비 원생이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedLead && (
        <LeadConsultModal
          lead={selectedLead}
          initialTab={initialTab}
          onClose={() => setSelectedId(null)}
          onStageChange={next => handleStageChange(selectedLead, next)}
          onToast={onToast}
        />
      )}

      {manualOpen && (
        <NewLeadModal onClose={() => setManualOpen(false)} onToast={onToast} />
      )}
    </div>
  );
}
