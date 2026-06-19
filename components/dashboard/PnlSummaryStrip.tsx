'use client';

import Link from 'next/link';
import { buildPnlLines, summarize, fmt } from '@/lib/pnl';

/** 이번 달 손익 KPI 3카드 — 클릭 시 /revenue 상세로. 숫자는 매출 페이지와 동일 소스(summarize). */
export function PnlSummaryStrip() {
  const s = summarize(buildPnlLines());

  const items: { label: string; value: string; sub?: string; tone: string }[] = [
    { label: '총매출', value: fmt(s.totalRevenue), tone: 'text-[#37352F]' },
    { label: '총지출', value: fmt(s.totalExpense), tone: 'text-[#37352F]' },
    {
      label: '영업이익',
      value: fmt(s.operatingProfit),
      sub: `영업이익률 ${s.opMargin}%`,
      tone: s.operatingProfit >= 0 ? 'text-[#0F7B6C]' : 'text-[#EB5757]',
    },
  ];

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#37352F]">이번 달 손익</h2>
        <Link href="/revenue" className="text-xs font-medium text-[#FF6C37] hover:underline">
          상세 매출 현황 →
        </Link>
      </div>
      <Link href="/revenue" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map(it => (
          <div
            key={it.label}
            className="rounded-lg border border-[#E9E9E7] bg-white p-5 transition-colors hover:border-[#FF6C37]"
          >
            <p className="text-xs text-[#787774]">{it.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${it.tone}`}>{it.value}</p>
            {it.sub && <p className="mt-0.5 text-xs text-[#787774] tabular-nums">{it.sub}</p>}
          </div>
        ))}
      </Link>
    </section>
  );
}
