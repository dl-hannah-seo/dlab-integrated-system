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
  전체: 'border-[#1A1D29] bg-[#EEF1F5] text-[#1A1D29]',
  완납: 'border-[#28C76F] bg-[#E6F9EF] text-[#28C76F]',
  미납: 'border-[#F2474B] bg-[#FEE9EA] text-[#F2474B]',
  예정: 'border-[#1F57E6] bg-[#FFF4E0] text-[#1F57E6]',
  환불: 'border-[#2F6BFF] bg-[#EAF1FF] text-[#2F6BFF]',
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
              className={`rounded-lg border px-4 py-3 text-center transition-colors ${on ? ACTIVE[key] : 'border-[#E8EBF1] bg-white text-[#1A1D29] hover:bg-[#F4F6FA]'}`}
            >
              <span className="block text-xs text-[#6B7280]">{label}</span>
              <span className="block text-xl font-bold tabular-nums">
                {summary.counts[key]}{key === '전체' ? '명' : '건'}
              </span>
            </button>
          );
        })}
      </div>
      {unpaid && (
        <div className="rounded-md px-4 py-2 text-sm bg-[#FEE9EA] text-[#F2474B]">
          미납 합계 <b className="tabular-nums">{fmt(summary.unpaidTotal)}</b> · {summary.counts[selected]}건
        </div>
      )}
    </div>
  );
}
