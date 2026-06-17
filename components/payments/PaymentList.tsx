'use client';

import { PaymentRow, fmt, daysOverdue, TabKey } from '@/lib/payments';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const BADGE = { 완납: 'paid', 미납: 'unpaid', 예정: 'warn', 환불: 'primary' } as const;

interface Props {
  rows: PaymentRow[];
  tab: TabKey;
  today: string;
  selectedIds: Set<string>;
  onToggle: (studentId: string) => void;
  onToggleAll: (checked: boolean) => void;
  onRowClick: (row: PaymentRow) => void;
  onSendMessage: (row: PaymentRow) => void;
}

const EMPTY_TEXT: Record<TabKey, string> = {
  미납: '조건에 맞는 미납 원생이 없습니다.',
  완납: '조건에 맞는 완납 내역이 없습니다.',
  예정: '조건에 맞는 청구·예정 건이 없습니다.',
};

export function PaymentList({ rows, tab, today, selectedIds, onToggle, onToggleAll, onRowClick, onSendMessage }: Props) {
  const allSelected = rows.length > 0 && rows.every(r => selectedIds.has(r.student.id));
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg">
        <p className="text-sm text-[#787774] py-12 text-center">{EMPTY_TEXT[tab]}</p>
      </div>
    );
  }

  if (tab === '미납') {
    const COLS = 'grid-cols-[36px_120px_minmax(0,1fr)_130px_72px_120px_56px]';
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
        <div className={`grid ${COLS} gap-x-3 border-b border-[#E9E9E7] bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#787774]`}>
          <input
            type="checkbox"
            aria-label="전체 선택"
            checked={allSelected}
            onChange={e => onToggleAll(e.target.checked)}
            className="accent-[#FF6C37] w-4 h-4"
          />
          <span>원생</span>
          <span>반명</span>
          <span>모 연락처</span>
          <span className="text-right">연체일수</span>
          <span className="text-right">미납액</span>
          <span></span>
        </div>
        <div className="divide-y divide-[#E9E9E7] max-h-[560px] overflow-y-auto">
          {rows.map(r => (
            <div
              key={r.inv.id}
              onClick={() => onRowClick(r)}
              className={`grid ${COLS} gap-x-3 px-4 py-3 text-sm items-center hover:bg-[#F7F7F5] cursor-pointer`}
            >
              <input
                type="checkbox"
                aria-label={`${r.student.name} 선택`}
                checked={selectedIds.has(r.student.id)}
                onChange={() => onToggle(r.student.id)}
                onClick={e => e.stopPropagation()}
                className="accent-[#FF6C37] w-4 h-4"
              />
              <span className="flex items-center gap-2">
                <span className="font-medium text-[#37352F]">{r.student.name}</span>
                <Badge variant={BADGE[r.status]}>{r.status}</Badge>
              </span>
              <span className="text-xs text-[#787774] truncate">{r.cls.name}</span>
              <span className="text-xs text-[#787774] tabular-nums">{r.student.parent_phone}</span>
              <span className="text-right text-xs tabular-nums text-[#EB5757]">{daysOverdue(r.inv.due_date, today)}일</span>
              <span className="text-right tabular-nums font-medium text-[#EB5757]">{fmt(r.amount)}</span>
              <span className="text-right">
                <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); onSendMessage(r); }}>문자</Button>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === '예정') {
    const COLS = 'grid-cols-[120px_minmax(0,1fr)_130px_110px_120px]';
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
        <div className={`grid ${COLS} gap-x-3 border-b border-[#E9E9E7] bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#787774]`}>
          <span>원생</span>
          <span>반명</span>
          <span>모 연락처</span>
          <span className="text-right">납기일</span>
          <span className="text-right">청구액</span>
        </div>
        <div className="divide-y divide-[#E9E9E7] max-h-[560px] overflow-y-auto">
          {rows.map(r => (
            <button
              key={r.inv.id}
              onClick={() => onRowClick(r)}
              className={`w-full grid ${COLS} gap-x-3 px-4 py-3 text-sm items-center text-left hover:bg-[#F7F7F5] transition-colors`}
            >
              <span className="font-medium text-[#37352F]">{r.student.name}</span>
              <span className="text-xs text-[#787774] truncate">{r.cls.name}</span>
              <span className="text-xs text-[#787774] tabular-nums">{r.student.parent_phone}</span>
              <span className="text-right text-xs text-[#787774] tabular-nums">{r.inv.due_date}</span>
              <span className="text-right tabular-nums font-medium text-[#37352F]">{fmt(r.amount)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 완납 탭 (완납 + 환불)
  const COLS = 'grid-cols-[150px_minmax(0,1fr)_64px_90px_120px_110px]';
  return (
    <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
      <div className={`grid ${COLS} gap-x-3 border-b border-[#E9E9E7] bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#787774]`}>
        <span>원생</span>
        <span>반명</span>
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
            className={`w-full grid ${COLS} gap-x-3 px-4 py-3 text-sm items-center text-left hover:bg-[#F7F7F5] transition-colors`}
          >
            <div>
              <span className="font-medium text-[#37352F]">{r.student.name}</span>
              <span className="text-xs text-[#787774] ml-2">{r.student.grade}</span>
            </div>
            <span className="text-xs text-[#787774] truncate">{r.cls.name}</span>
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
