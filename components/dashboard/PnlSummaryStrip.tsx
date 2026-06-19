'use client';

import Link from 'next/link';
import { fmt } from '@/lib/pnl';
import {
  pnlForQuarter, quarterLabel, quarterElapsedPct, CURRENT_QUARTER,
} from '@/lib/quarterly';

/** 분기 손익 KPI 3카드 — 총매출·지출·영업이익. 클릭 시 /revenue 상세로. */
export function PnlSummaryStrip() {
  const p = pnlForQuarter(CURRENT_QUARTER);
  if (!p) return null;

  const margin = p.revenue === 0 ? 0 : Math.round((p.profit / p.revenue) * 1000) / 10;
  const elapsed = quarterElapsedPct(CURRENT_QUARTER);

  const items: { label: string; value: string; sub?: string; tone: string }[] = [
    { label: '총매출', value: fmt(p.revenue), tone: 'text-[#37352F]' },
    { label: '지출', value: fmt(p.expense), tone: 'text-[#37352F]' },
    {
      label: '영업이익',
      value: fmt(p.profit),
      sub: `이익률 ${margin}%`,
      tone: p.profit >= 0 ? 'text-[#0F7B6C]' : 'text-[#EB5757]',
    },
  ];

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-[#37352F]">{quarterLabel(CURRENT_QUARTER)} 손익</h2>
          <span className="text-xs text-[#9B9A97]">{elapsed}% 경과</span>
        </div>
        <Link href="/revenue" className="text-xs font-medium text-[#FF6C37] hover:underline">
          매출 현황 →
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
