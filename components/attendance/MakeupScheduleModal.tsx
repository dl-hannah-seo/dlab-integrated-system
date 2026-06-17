'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { type Student, type Class, type ClassSession } from '@/lib/mock-data';

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function classTime(schedule: string): string {
  const m = schedule.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '09:00';
}

interface MakeupScheduleModalProps {
  student: Student;
  cls: Class;
  session: ClassSession;
  onClose: () => void;
  onConfirm: (date: string, time: string, memo: string) => void;
}

export function MakeupScheduleModal({ student, cls, session, onClose, onConfirm }: MakeupScheduleModalProps) {
  const [date, setDate] = useState(() => addDays(session.session_date, 7));
  const [time, setTime] = useState(() => classTime(cls.schedule));
  const [memo, setMemo] = useState('');

  function confirm() {
    if (!date) return;
    onConfirm(date, time, memo.trim());
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`보강 잡기 · ${student.name}`}
      footer={
        <>
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-[#787774] hover:text-[#37352F]">
            취소
          </button>
          <button
            onClick={confirm}
            disabled={!date}
            className="px-3.5 py-1.5 text-sm rounded-md bg-[#FF6C37] text-white hover:bg-[#E85F2C] disabled:opacity-50"
          >
            보강 등록
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-xs text-[#787774]">
          대상 <span className="text-[#37352F]">{cls.schedule} {cls.course}</span> · 결석{' '}
          {`${Number(session.session_date.slice(5, 7))}/${Number(session.session_date.slice(8, 10))}`}회차
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="보강 날짜" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <Input label="시간" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <Textarea
          label="메모 (선택)"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          rows={3}
          placeholder="예: 1:1 보강, 강의실 변경 등"
        />
        <p className="text-xs text-[#BEBDBA]">등록하면 보강 세션이 일정에 추가되고 해당 결석이 보강으로 처리됩니다.</p>
      </div>
    </Modal>
  );
}
