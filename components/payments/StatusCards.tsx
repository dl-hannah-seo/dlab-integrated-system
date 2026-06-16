'use client';

import { StatusFilter, Summary, fmt } from '@/lib/payments';

const CARD_DEFS: { key: StatusFilter; label: string }[] = [
  { key: '전체', label: '전체' },
  { key: '완납', label: '완납' },
  { key: '미납', label: '미납' },
  { key: '예정', label: '예정' },
  { key: '환불', label: '환불' },
];

const ACTIVE: Record<StatusFilter, string> = {
  전체: 'border-[#37352F] bg-[#F1F1EF] text-[#37352F]',
  완납: 'border-[#0F7B6C] bg-[#EDF7F5] text-[#0F7B6C]',
  미납: 'border-[#EB5757] bg-[#FDECEC] text-[#EB5757]',
  예정: 'border-[#D9822B] bg-[#FFF4E5] text-[#D9822B]',
  환불: 'border-[#7C5CFF] bg-[#F0EBFF] text-[#7C5CFF]',
};

interface Props {
  summary: Summary;
  selected: StatusFilter;
  onSelect: (s: StatusFilter) => void;
}

export function StatusCards({ summary, selected, onSelect }: Props) {
  const unpaid = selected === '미납' || selected === '예정';
  return (
    <div className="mb-4">
      <div className="grid grid-cols-5 gap-3 mb-3">
        {CARD_DEFS.map(({ key, label }) => {
          const on = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`rounded-lg border px-4 py-3 text-center transition-colors ${on ? ACTIVE[key] : 'border-[#E9E9E7] bg-white text-[#37352F] hover:bg-[#F7F7F5]'}`}
            >
              <span className="block text-xs text-[#787774]">{label}</span>
              <span className="block text-xl font-bold tabular-nums">
                {summary.counts[key]}{key === '전체' ? '명' : '건'}
              </span>
            </button>
          );
        })}
      </div>
      <div className={`rounded-md px-4 py-2 text-sm ${unpaid ? 'bg-[#FDECEC] text-[#EB5757]' : 'bg-[#F7F7F5] text-[#787774]'}`}>
        {unpaid ? (
          <>미납 합계 <b className="tabular-nums">{fmt(summary.unpaidTotal)}</b> · {summary.counts[selected]}건</>
        ) : (
          <>
            총수납 <b className="tabular-nums text-[#0F7B6C]">{fmt(summary.totalPaid)}</b>
            {' · '}카드 {fmt(summary.card)}
            {' · '}현금·계좌 {fmt(summary.cashBank)}
            {' · '}환불 <span className="text-[#EB5757]">{fmt(summary.refund)}</span>
          </>
        )}
      </div>
    </div>
  );
}
