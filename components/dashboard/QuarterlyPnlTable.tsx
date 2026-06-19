'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  myPnlSeries, QUARTERS, quarterShort, quarterElapsedPct, fmtMan,
  CURRENT_QUARTER, type QuarterPnl,
} from '@/lib/quarterly';

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

// ── 추이 그래프 (표 분기 열과 동일 축 공유, 점은 각 열 중앙) ──
const STUDENT = '#0F7B6C'; // 학생수
const REVENUE = '#FF6C37'; // 총매출
const SW = 500;
const SH = 132;
const S_PAD_T = 14;
const S_PAD_B = 8;

function linePath(values: number[]): { pts: { x: number; y: number }[]; d: string } {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const innerH = SH - S_PAD_T - S_PAD_B;
  const n = values.length;
  const pts = values.map((v, i) => ({
    x: ((i + 0.5) / n) * SW, // 각 분기 열의 중앙
    y: S_PAD_T + innerH - ((v - min) / span) * innerH,
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return { pts, d };
}

function Dots({ pts, color, currentIdx }: { pts: { x: number; y: number }[]; color: string; currentIdx: number }) {
  return (
    <>
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === currentIdx ? 4 : 3} fill={color} stroke="#fff" strokeWidth={1.5} />
      ))}
    </>
  );
}

/** 분기 손익 — 추이 그래프(학생수·총매출)와 손익 표가 동일한 분기 축을 공유. */
export function QuarterlyPnlTable() {
  const byQuarter = new Map(myPnlSeries.map(p => [p.quarter, p]));
  const elapsed = quarterElapsedPct(CURRENT_QUARTER);
  const currentIdx = QUARTERS.indexOf(CURRENT_QUARTER);
  const cur = byQuarter.get(CURRENT_QUARTER)!;

  const S = linePath(QUARTERS.map(q => byQuarter.get(q)!.students));
  const R = linePath(QUARTERS.map(q => byQuarter.get(q)!.revenue));

  return (
    <section className="rounded-xl border border-[#E9E9E7] bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#37352F]">분기 손익</h2>
        <Link href="/revenue" className="text-xs font-medium text-[#FF6C37] hover:underline">매출 현황 →</Link>
      </div>

      {/* 범례 */}
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-[#37352F]">
          <span className="h-2 w-2 rounded-full" style={{ background: STUDENT }} />
          학생수 <span className="font-semibold tabular-nums">{cur.students}명</span>
        </span>
        <span className="flex items-center gap-1.5 text-[#37352F]">
          <span className="h-2 w-2 rounded-full" style={{ background: REVENUE }} />
          총매출 <span className="font-semibold tabular-nums">{fmtMan(cur.revenue)}원</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[420px]" style={{ gridTemplateColumns: 'auto repeat(5, minmax(0, 1fr))' }}>
          {/* ① 추이 그래프 — 분기 열 위에 정렬 */}
          <div />
          <div style={{ gridColumn: 'span 5' }}>
            <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full" style={{ height: SH }} preserveAspectRatio="none">
              <path d={S.d} fill="none" stroke={STUDENT} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <path d={R.d} fill="none" stroke={REVENUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <Dots pts={S.pts} color={STUDENT} currentIdx={currentIdx} />
              <Dots pts={R.pts} color={REVENUE} currentIdx={currentIdx} />
            </svg>
          </div>

          {/* ② 분기 축 (그래프·표 공유, 라벨 한 줄) */}
          <div className="border-t border-[#E9E9E7]" />
          {QUARTERS.map(q => {
            const isNow = q === CURRENT_QUARTER;
            return (
              <div
                key={q}
                className={`border-t border-[#E9E9E7] px-2 py-2 text-center text-xs font-medium ${isNow ? 'text-[#FF6C37]' : 'text-[#787774]'}`}
              >
                {quarterShort(q)}
                {isNow && <span className="block text-[10px] font-normal text-[#9B9A97]">{elapsed}% 경과</span>}
              </div>
            );
          })}

          {/* ③ 손익 데이터 행 */}
          {ROWS.map(row => (
            <Fragment key={row.label}>
              <div className="border-t border-[#F1F0EF] px-2 py-2.5 text-left text-xs text-[#787774]">{row.label}</div>
              {QUARTERS.map(q => {
                const p = byQuarter.get(q)!;
                const isNow = q === CURRENT_QUARTER;
                return (
                  <div
                    key={q}
                    className={`border-t border-[#F1F0EF] px-2 py-2.5 text-center text-sm tabular-nums ${row.tone ? row.tone(p) : 'text-[#37352F]'} ${isNow ? 'bg-[#FFF8F5] font-semibold' : ''}`}
                  >
                    {row.cell(p)}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-[#BEBDBA]">금액 단위: 만원 · 진행 중 분기는 경과분 기준</p>
    </section>
  );
}
