'use client';

import { PaymentRow, fmt } from '@/lib/payments';
import { Badge } from '@/components/ui/Badge';

const BADGE = { 완납: 'paid', 미납: 'unpaid', 예정: 'warn', 환불: 'primary' } as const;

interface Props {
  rows: PaymentRow[];
  mode: 'paid' | 'unpaid';
  selectedIds: Set<string>;
  onToggle: (studentId: string) => void;
  onRowClick: (row: PaymentRow) => void;
}

export function PaymentList({ rows, mode, selectedIds, onToggle, onRowClick }: Props) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg">
        <p className="text-sm text-[#787774] py-12 text-center">조건에 맞는 수납 내역이 없습니다.</p>
      </div>
    );
  }

  if (mode === 'unpaid') {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[40px_1.4fr_1.3fr_1.4fr_1fr] gap-0 border-b border-[#E9E9E7] bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#787774]">
          <span></span>
          <span>원생</span>
          <span>반</span>
          <span>부모HP(모)</span>
          <span className="text-right">미납액</span>
        </div>
        <div className="divide-y divide-[#E9E9E7] max-h-[560px] overflow-y-auto">
          {rows.map(r => (
            <div key={r.inv.id} className="grid grid-cols-[40px_1.4fr_1.3fr_1.4fr_1fr] gap-0 px-4 py-3 text-sm items-center hover:bg-[#F7F7F5]">
              <input
                type="checkbox"
                aria-label={`${r.student.name} 선택`}
                checked={selectedIds.has(r.student.id)}
                onChange={() => onToggle(r.student.id)}
                className="accent-[#FF6C37] w-4 h-4"
              />
              <button onClick={() => onRowClick(r)} className="text-left flex items-center gap-2">
                <span className="font-medium text-[#37352F]">{r.student.name}</span>
                <Badge variant={BADGE[r.status]}>{r.status}</Badge>
              </button>
              <span className="text-xs text-[#787774] truncate">{r.cls.schedule}</span>
              <span className="text-xs text-[#787774] tabular-nums">{r.student.parent_phone}</span>
              <span className="text-right tabular-nums font-medium text-[#EB5757]">{fmt(r.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // paid mode (전체/완납/환불)
  return (
    <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-0 border-b border-[#E9E9E7] bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#787774]">
        <span>원생</span>
        <span>반</span>
        <span>상태</span>
        <span>수단</span>
        <span className="text-right">금액</span>
        <span className="text-right">수납일</span>
      </div>
      <div className="divide-y divide-[#E9E9E7] max-h-[560px] overflow-y-auto">
        {rows.map(r => (
          <button
            key={r.inv.id}
            onClick={() => onRowClick(r)}
            className="w-full grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-0 px-4 py-3 text-sm items-center text-left hover:bg-[#F7F7F5] transition-colors"
          >
            <div>
              <span className="font-medium text-[#37352F]">{r.student.name}</span>
              <span className="text-xs text-[#787774] ml-2">{r.student.grade}</span>
            </div>
            <span className="text-xs text-[#787774] truncate">{r.cls.schedule}</span>
            <span><Badge variant={BADGE[r.status]}>{r.status}</Badge></span>
            <span className="text-xs text-[#37352F]">{r.pay?.method ?? '-'}</span>
            <span className={`text-right tabular-nums font-medium ${r.amount < 0 ? 'text-[#EB5757]' : 'text-[#37352F]'}`}>{fmt(r.amount)}</span>
            <span className="text-right text-xs text-[#787774] tabular-nums">{r.pay ? r.pay.paid_at.slice(0, 10) : '-'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
