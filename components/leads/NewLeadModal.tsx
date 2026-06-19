'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useLeads } from '@/components/panels/LeadsContext';
import { LEAD_SUBJECTS, LEAD_SOURCES, TODAY } from '@/lib/mock-data';

const GRADES = ['7세', '초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];

export function NewLeadModal({
  onClose, onToast,
}: {
  onClose: () => void;
  onToast: (m: string) => void;
}) {
  const { addLead } = useLeads();
  const [form, setForm] = useState({
    name: '', grade: '', subject: LEAD_SUBJECTS[0], source: LEAD_SOURCES[0],
    inquiry_date: TODAY, memo: '',
  });

  function submit() {
    if (!form.name.trim()) return;
    addLead({
      name: form.name, parent_phone: '', grade: form.grade || undefined,
      source: form.source, interest_subject: form.subject, stage: '신규문의',
      inquiry_date: form.inquiry_date, memo: form.memo || undefined,
    });
    onToast(`${form.name.trim()} 예비 원생이 등록되었습니다.`);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="신규 상담 수기 등록"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>취소</Button>
          <Button size="sm" onClick={submit} disabled={!form.name.trim()}>등록</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-[#6B7280]">녹음 없이 상담 내용을 직접 입력해 예비 원생으로 등록합니다.</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="이름" placeholder="학생 이름" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <Select label="학년" value={form.grade}
            onChange={e => setForm({ ...form, grade: e.target.value })}
            options={[{ value: '', label: '선택' }, ...GRADES.map(g => ({ value: g, label: g }))]} />
          <Select label="관심 과목" value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            options={LEAD_SUBJECTS.map(v => ({ value: v, label: v }))} />
          <Select label="유입경로" value={form.source}
            onChange={e => setForm({ ...form, source: e.target.value })}
            options={LEAD_SOURCES.map(v => ({ value: v, label: v }))} />
          <Input label="문의일" type="date" value={form.inquiry_date}
            onChange={e => setForm({ ...form, inquiry_date: e.target.value })} />
        </div>
        <Textarea label="상담 메모" rows={3} value={form.memo}
          placeholder="상담 내용을 입력하세요"
          onChange={e => setForm({ ...form, memo: e.target.value })} />
      </div>
    </Modal>
  );
}
