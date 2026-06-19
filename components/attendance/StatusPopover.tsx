'use client';

import { useState, useEffect, useRef } from 'react';
import type { AttendanceStatus } from '@/lib/mock-data';

const OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'attend',  label: '출석',   color: '#28C76F' },
  { value: 'absent',  label: '결석',   color: '#F2474B' },
  { value: 'makeup',  label: '보강',   color: '#C18A14' },
  { value: 'pending', label: '미도착', color: '#6B7280' },
];

interface StatusPopoverProps {
  current: AttendanceStatus;
  currentReason: string | null;
  onSelect: (status: AttendanceStatus, absenceReason: string | null) => void;
  onClose: () => void;
  onRequestSms?: () => void;     // 결석 셀: 문자 보내기
  onRequestMakeup?: () => void;  // 결석 셀: 보강 잡기
}

export function StatusPopover({ current, currentReason, onSelect, onClose, onRequestSms, onRequestMakeup }: StatusPopoverProps) {
  const [pending, setPending] = useState<AttendanceStatus | null>(null); // 결석 사유 입력 단계
  const [reason, setReason] = useState(currentReason ?? '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function choose(status: AttendanceStatus) {
    if (status === 'absent') {
      setPending('absent');
      return;
    }
    onSelect(status, null);
  }

  return (
    <div
      ref={ref}
      className="absolute z-20 mt-1 w-44 rounded-lg border border-[#E8EBF1] bg-white shadow-lg p-1"
      onClick={e => e.stopPropagation()}
    >
      {pending === 'absent' ? (
        <div className="p-2">
          <p className="text-xs font-medium text-[#1A1D29] mb-1.5">결석 사유 (선택)</p>
          <input
            autoFocus
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="예: 가족 여행"
            className="w-full border border-[#E8EBF1] rounded-md px-2 py-1 text-xs text-[#1A1D29] focus:outline-none focus:border-[#2F6BFF]"
          />
          <div className="flex justify-end gap-1.5 mt-2">
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs text-[#6B7280] hover:text-[#1A1D29]"
            >
              취소
            </button>
            <button
              onClick={() => onSelect('absent', reason.trim() || null)}
              className="px-2.5 py-1 text-xs rounded-md bg-[#F2474B] text-white hover:bg-[#F2474B]"
            >
              결석 저장
            </button>
          </div>
        </div>
      ) : (
        <>
          {OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => choose(o.value)}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-left hover:bg-[#F4F6FA] ${o.value === current ? 'bg-[#F4F6FA]' : ''}`}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: o.color }} />
              <span className="text-[#1A1D29]">{o.label}</span>
              {o.value === current && <span className="ml-auto text-[#28C76F]">✓</span>}
            </button>
          ))}
          {current === 'absent' && (onRequestSms || onRequestMakeup) && (
            <div className="mt-1 pt-1 border-t border-[#EEF1F5]">
              <p className="px-2.5 py-1 text-[10px] text-[#AEB4C0]">결석 후속</p>
              {onRequestSms && (
                <button
                  onClick={onRequestSms}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-left hover:bg-[#EAF1FF]"
                >
                  <span>📩</span><span className="text-[#1A1D29]">문자 보내기</span>
                </button>
              )}
              {onRequestMakeup && (
                <button
                  onClick={onRequestMakeup}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-left hover:bg-[#EAF1FF]"
                >
                  <span>📅</span><span className="text-[#1A1D29]">보강 잡기</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
