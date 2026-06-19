'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { TODAY, type Student, type Class } from '@/lib/mock-data';
import { suggestMakeupSlots } from '@/lib/makeup-helpers';

function classTime(schedule: string): string {
  const m = schedule.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '09:00';
}

interface MakeupPickerModalProps {
  student: Student;
  cls: Class;          // 결석한 반
  onClose: () => void;
  onConfirm: (date: string, time: string, memo: string) => void;
}

export function MakeupPickerModal({ student, cls, onClose, onConfirm }: MakeupPickerModalProps) {
  const slots = useMemo(() => suggestMakeupSlots(cls.id, TODAY), [cls.id]);

  const [selectedIdx, setSelectedIdx] = useState<number>(slots.length > 0 ? 0 : -1);
  const [manual, setManual] = useState(slots.length === 0);
  const [date, setDate] = useState('');
  const [time, setTime] = useState(() => classTime(cls.schedule));
  const [memo, setMemo] = useState('');

  function confirm() {
    if (manual) {
      if (!date) return;
      onConfirm(date, time, memo.trim());
    } else {
      const s = slots[selectedIdx];
      if (!s) return;
      onConfirm(s.date, s.time, memo.trim());
    }
    onClose();
  }

  const canConfirm = manual ? !!date : selectedIdx >= 0;

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`보강 잡기 · ${student.name}`}
      footer={
        <>
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-[#6B7280] hover:text-[#1A1D29]">취소</button>
          <button
            onClick={confirm}
            disabled={!canConfirm}
            className="px-3.5 py-1.5 text-sm rounded-md bg-[#2F6BFF] text-white hover:bg-[#1F57E6] disabled:opacity-50"
          >
            보강 등록 + 문자
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-[#6B7280]">
          결석 반 <span className="text-[#1A1D29]">{cls.schedule} {cls.course}</span> · 같은 과목 다음 회차를 추천합니다.
        </p>

        {/* 추천 슬롯 */}
        {slots.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">추천 보강</p>
            {slots.map((s, i) => {
              const active = !manual && selectedIdx === i;
              return (
                <button
                  key={s.classId + s.date}
                  onClick={() => { setManual(false); setSelectedIdx(i); }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                    active ? 'border-[#2F6BFF] bg-[#EAF1FF] text-[#1A1D29]' : 'border-[#E8EBF1] bg-white text-[#1A1D29] hover:border-[#2F6BFF]/50'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 직접 입력 */}
        <div>
          <button
            onClick={() => setManual(m => !m)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              manual ? 'border-[#2F6BFF] text-[#2F6BFF] bg-[#EAF1FF]' : 'border-[#E8EBF1] text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            직접 입력 {manual ? '✓' : ''}
          </button>
          {manual && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Input label="보강 날짜" type="date" value={date} onChange={e => setDate(e.target.value)} />
              <Input label="시간" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          )}
        </div>

        <Textarea
          label="메모 (선택)"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          rows={2}
          placeholder="예: 1:1 보강, 강의실 변경 등"
        />
        <p className="text-xs text-[#AEB4C0]">등록하면 보강이 예정 상태가 되고 보강 안내 문자 발송으로 이어집니다.</p>
      </div>
    </Modal>
  );
}
