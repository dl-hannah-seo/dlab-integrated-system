'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useLeadConsults } from '@/components/panels/LeadConsultContext';
import { consultsOfLead } from '@/lib/lead-consults';
import { TODAY, type Lead, type LeadStage } from '@/lib/mock-data';

const ORDINAL = ['', '1차', '2차', '3차', '4차', '5차', '6차', '7차', '8차'];
function ordinal(seq: number) { return ORDINAL[seq] ?? `${seq}차`; }

export function LeadConsultModal({
  lead, initialTab = 'auto', onClose, onStageChange, onToast,
}: {
  lead: Lead;
  initialTab?: 'auto' | 'new';
  onClose: () => void;
  onStageChange: (stage: LeadStage) => void;
  onToast: (m: string) => void;
}) {
  const { consults, addConsult } = useLeadConsults();
  const list = useMemo(() => consultsOfLead(consults, lead.id), [consults, lead.id]);

  // 활성 탭: '추가상담기록'으로 열면 새 차수, 아니면 마지막 차수
  const [activeSeq, setActiveSeq] = useState<number | 'new'>(() =>
    initialTab === 'new' || list.length === 0 ? 'new' : list[list.length - 1].seq);
  const [newDate, setNewDate] = useState(TODAY);
  const [newMemo, setNewMemo] = useState('');

  const converted = lead.stage === '등록';

  function handleAdd() {
    if (!newMemo.trim()) return;
    const rec = addConsult(lead.id, newMemo, newDate);
    setNewMemo('');
    setActiveSeq(rec.seq);
    onToast(`${lead.name} ${ordinal(rec.seq)} 상담이 기록되었습니다.`);
  }

  function handleStage(next: LeadStage) {
    onStageChange(next); // 등록 전환 시 부모가 students 이동 처리
  }

  const activeConsult = typeof activeSeq === 'number' ? list.find(c => c.seq === activeSeq) : undefined;

  return (
    <Modal open onClose={onClose} title={`${lead.name} · 상담 이력`} size="lg">
      {converted ? (
        <div className="mb-4 rounded-lg border border-[#E6F9EF] bg-[#E6F9EF] px-4 py-2.5 text-xs text-[#28C76F]">
          ✓ 등록 전환 완료 — 이 학생은 <span className="font-medium">원생 관리</span>로 이동되었습니다.
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[#DCE7FF] bg-[#EAF1FF] px-4 py-3">
          <p className="text-xs text-[#6B7280]">상담을 마쳤다면 재원생으로 등록 전환하세요. 학생 데이터가 <span className="font-medium text-[#1A1D29]">원생 관리</span>로 이동합니다.</p>
          <Button size="sm" onClick={() => handleStage('등록')} className="shrink-0">원생 등록 전환</Button>
        </div>
      )}

      {/* 차수 탭 */}
      <div className="flex items-center gap-1 border-b border-[#E8EBF1]">
        {list.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveSeq(c.seq)}
            className={`px-3 py-2 text-sm -mb-px border-b-2 transition-colors ${
              activeSeq === c.seq
                ? 'border-[#2F6BFF] text-[#2F6BFF] font-medium'
                : 'border-transparent text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            {ordinal(c.seq)}
          </button>
        ))}
        <button
          onClick={() => setActiveSeq('new')}
          className={`px-3 py-2 text-sm -mb-px border-b-2 transition-colors ${
            activeSeq === 'new'
              ? 'border-[#2F6BFF] text-[#2F6BFF] font-medium'
              : 'border-transparent text-[#9CA3AF] hover:text-[#1A1D29]'
          }`}
        >
          + {ordinal(list.length + 1)} 추가
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="pt-4">
        {activeSeq === 'new' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-dashed border-[#DCE7FF] bg-[#EAF1FF] px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2F6BFF]">구현 예정</span>
              <span className="text-xs text-[#6B7280]">녹음·AI 요약은 추후 자동으로 이 메모에 채워집니다.</span>
            </div>
            <Input label="상담일" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            <Textarea
              label="상담 내용"
              rows={5}
              value={newMemo}
              placeholder="상담 내용을 입력하세요"
              onChange={e => setNewMemo(e.target.value)}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAdd} disabled={!newMemo.trim()}>
                {ordinal(list.length + 1)} 상담 저장
              </Button>
            </div>
          </div>
        ) : activeConsult ? (
          <div className="space-y-2">
            <p className="text-xs text-[#6B7280] tabular-nums">상담일 {activeConsult.date}</p>
            <p className="whitespace-pre-line rounded-lg border border-[#E8EBF1] p-4 text-sm text-[#1A1D29]">
              {activeConsult.memo}
            </p>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[#6B7280]">상담 기록이 없습니다. 첫 상담을 추가하세요.</p>
        )}
      </div>
    </Modal>
  );
}
