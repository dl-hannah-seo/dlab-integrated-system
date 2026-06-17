'use client';

import { useState, useEffect, useRef } from 'react';
import type { AttendanceStatus } from '@/lib/mock-data';

const OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'attend',  label: '출석',   color: '#0F7B6C' },
  { value: 'absent',  label: '결석',   color: '#EB5757' },
  { value: 'makeup',  label: '보강',   color: '#D9A80A' },
  { value: 'pending', label: '미도착', color: '#787774' },
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
      className="absolute z-20 mt-1 w-44 rounded-lg border border-[#E9E9E7] bg-white shadow-lg p-1"
      onClick={e => e.stopPropagation()}
    >
      {pending === 'absent' ? (
        <div className="p-2">
          <p className="text-xs font-medium text-[#37352F] mb-1.5">결석 사유 (선택)</p>
          <input
            autoFocus
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="예: 가족 여행"
            className="w-full border border-[#E9E9E7] rounded-md px-2 py-1 text-xs text-[#37352F] focus:outline-none focus:border-[#FF6C37]"
          />
          <div className="flex justify-end gap-1.5 mt-2">
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs text-[#787774] hover:text-[#37352F]"
            >
              취소
            </button>
            <button
              onClick={() => onSelect('absent', reason.trim() || null)}
              className="px-2.5 py-1 text-xs rounded-md bg-[#EB5757] text-white hover:bg-[#D94545]"
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
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-left hover:bg-[#F7F7F5] ${o.value === current ? 'bg-[#F7F7F5]' : ''}`}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: o.color }} />
              <span className="text-[#37352F]">{o.label}</span>
              {o.value === current && <span className="ml-auto text-[#0F7B6C]">✓</span>}
            </button>
          ))}
          {current === 'absent' && (onRequestSms || onRequestMakeup) && (
            <div className="mt-1 pt-1 border-t border-[#F1F0EF]">
              <p className="px-2.5 py-1 text-[10px] text-[#BEBDBA]">결석 후속</p>
              {onRequestSms && (
                <button
                  onClick={onRequestSms}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-left hover:bg-[#FFF1EC]"
                >
                  <span>📩</span><span className="text-[#37352F]">문자 보내기</span>
                </button>
              )}
              {onRequestMakeup && (
                <button
                  onClick={onRequestMakeup}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-md text-left hover:bg-[#FFF1EC]"
                >
                  <span>📅</span><span className="text-[#37352F]">보강 잡기</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
