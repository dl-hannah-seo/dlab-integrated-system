'use client';

import Link from 'next/link';
import {
  myPnlSeries, QUARTERS, quarterShort, quarterElapsedPct, fmtMan,
  CURRENT_QUARTER, type QuarterPnl,
} from '@/lib/quarterly';
import { QuarterlyTrends } from '@/components/dashboard/QuarterlyTrends';

interface Row {
  label: string;
  cell: (p: QuarterPnl) => string;
  tone?: (p: QuarterPnl) => string;
}

const ROWS: Row[] = [
  { label: '학생수', cell: p => `${p.students}명` },
  { label: '총매출', cell: p => fmtMan(p.revenue) },
  { label: '지출', cell: p => fmtMan(p.expense) },
  {
    label: '영업이익',
    cell: p => fmtMan(p.profit),
    tone: p => (p.profit >= 0 ? 'text-[#0F7B6C]' : 'text-[#EB5757]'),
  },
];

/** 분기 손익 표 — 행: 학생수·총매출·지출·영업이익 / 열: 5개 분기. */
export function QuarterlyPnlTable() {
  const byQuarter = new Map(myPnlSeries.map(p => [p.quarter, p]));
  const elapsed = quarterElapsedPct(CURRENT_QUARTER);

  return (
    <section className="rounded-xl border border-[#E9E9E7] bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#37352F]">분기 손익</h2>
        <Link href="/revenue" className="text-xs font-medium text-[#FF6C37] hover:underline">매출 현황 →</Link>
      </div>

      {/* 성장 추이 — 표 바로 위에 흡수 */}
      <QuarterlyTrends />

      <div className="my-4 border-t border-[#E9E9E7]" />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-2 py-2 text-left text-xs font-medium text-[#9B9A97]" />
              {QUARTERS.map(q => {
                const isNow = q === CURRENT_QUARTER;
                return (
                  <th
                    key={q}
                    className={`px-3 py-2 text-right text-xs font-medium ${isNow ? 'text-[#FF6C37]' : 'text-[#787774]'}`}
                  >
                    {quarterShort(q)}
                    {isNow && <span className="block text-[10px] font-normal text-[#9B9A97]">{elapsed}% 경과</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.label} className="border-t border-[#F1F0EF]">
                <td className="sticky left-0 bg-white px-2 py-2.5 text-left text-xs text-[#787774]">{row.label}</td>
                {QUARTERS.map(q => {
                  const p = byQuarter.get(q)!;
                  const isNow = q === CURRENT_QUARTER;
                  return (
                    <td
                      key={q}
                      className={`px-3 py-2.5 text-right tabular-nums ${row.tone ? row.tone(p) : 'text-[#37352F]'} ${isNow ? 'bg-[#FFF8F5] font-semibold' : ''}`}
                    >
                      {row.cell(p)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[#BEBDBA]">금액 단위: 만원 · 진행 중 분기는 경과분 기준</p>
    </section>
  );
}
