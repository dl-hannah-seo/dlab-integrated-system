'use client';

import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  myPnlSeries, QUARTERS, quarterShort, quarterElapsedPct, fmtMan,
  CURRENT_QUARTER, type QuarterPnl,
} from '@/lib/quarterly';
import { smoothLinePath } from '@/components/ui/AreaTrendChart';

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
  },
];

// ── 추이 그래프 (표 분기 열과 동일 축 공유, 점은 각 열 중앙) ──
const STUDENT = '#28C76F'; // 학생수
const REVENUE = '#2F6BFF'; // 총매출
const SW = 500;
const SH = 190;
const S_PAD_T = 18;
const S_PAD_B = 12;

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
  const d = smoothLinePath(pts);
  return { pts, d };
}

function areaPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${smoothLinePath(pts)} L ${last.x.toFixed(1)} ${SH} L ${first.x.toFixed(1)} ${SH} Z`;
}

const areaStyle = (play: boolean): CSSProperties => ({
  transformBox: 'fill-box',
  transformOrigin: 'bottom',
  opacity: play ? 1 : 0,
  transform: play ? 'scaleY(1)' : 'scaleY(0.5)',
  transition: 'opacity 1.1s ease, transform 1.1s cubic-bezier(0.45,0,0.25,1)',
});

const lineStyle = (play: boolean): CSSProperties => ({
  strokeDasharray: 1,
  strokeDashoffset: play ? 0 : 1,
  transition: 'stroke-dashoffset 1.15s cubic-bezier(0.45,0,0.25,1)',
});

function Dots({ pts, color, currentIdx, play }: { pts: { x: number; y: number }[]; color: string; currentIdx: number; play: boolean }) {
  return (
    <>
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === currentIdx ? 4 : 3}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
          style={{ opacity: play ? 1 : 0, transition: `opacity 0.4s ease ${0.5 + i * 0.08}s` }}
        />
      ))}
    </>
  );
}

/** 분기 손익 — 추이 그래프(학생수·총매출)와 손익 표가 동일한 분기 축을 공유. */
export function QuarterlyPnlTable() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const byQuarter = new Map(myPnlSeries.map(p => [p.quarter, p]));
  const elapsed = quarterElapsedPct(CURRENT_QUARTER);
  const currentIdx = QUARTERS.indexOf(CURRENT_QUARTER);
  const cur = byQuarter.get(CURRENT_QUARTER)!;

  const S = linePath(QUARTERS.map(q => byQuarter.get(q)!.students));
  const R = linePath(QUARTERS.map(q => byQuarter.get(q)!.revenue));

  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-6 shadow-[0_2px_8px_rgba(20,30,55,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1A1D29]">분기 손익</h2>
        <Link href="/revenue" className="text-xs font-medium text-[#2F6BFF] hover:underline">매출 현황 →</Link>
      </div>

      {/* 범례 */}
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-[#1A1D29]">
          <span className="h-2 w-2 rounded-full" style={{ background: STUDENT }} />
          학생수 <span className="font-semibold tabular-nums">{cur.students}명</span>
        </span>
        <span className="flex items-center gap-1.5 text-[#1A1D29]">
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
              <defs>
                <linearGradient id="qpnl-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={REVENUE} stopOpacity={0.26} />
                  <stop offset="100%" stopColor={REVENUE} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="qpnl-stu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STUDENT} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={STUDENT} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <path d={areaPath(R.pts)} fill="url(#qpnl-rev)" style={areaStyle(play)} />
              <path d={areaPath(S.pts)} fill="url(#qpnl-stu)" style={areaStyle(play)} />
              <path d={S.d} fill="none" stroke={STUDENT} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" pathLength={1} style={lineStyle(play)} />
              <path d={R.d} fill="none" stroke={REVENUE} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" pathLength={1} style={lineStyle(play)} />
              <Dots pts={S.pts} color={STUDENT} currentIdx={currentIdx} play={play} />
              <Dots pts={R.pts} color={REVENUE} currentIdx={currentIdx} play={play} />
            </svg>
          </div>

          {/* ② 분기 축 (그래프·표 공유, 라벨 한 줄) */}
          <div className="border-t border-[#E8EBF1]" />
          {QUARTERS.map(q => {
            const isNow = q === CURRENT_QUARTER;
            return (
              <div
                key={q}
                className={`border-t border-[#E8EBF1] px-2 py-2 text-center text-xs font-medium ${isNow ? 'text-[#2F6BFF]' : 'text-[#6B7280]'}`}
              >
                {quarterShort(q)}
                {isNow && <span className="block text-[10px] font-normal text-[#9CA3AF]">{elapsed}% 경과</span>}
              </div>
            );
          })}

          {/* ③ 손익 데이터 행 */}
          {ROWS.map(row => (
            <Fragment key={row.label}>
              <div className="border-t border-[#EEF1F5] px-2 py-2.5 text-left text-xs text-[#6B7280]">{row.label}</div>
              {QUARTERS.map(q => {
                const p = byQuarter.get(q)!;
                const isNow = q === CURRENT_QUARTER;
                return (
                  <div
                    key={q}
                    className={`border-t border-[#EEF1F5] px-2 py-2.5 text-center text-sm tabular-nums ${row.tone ? row.tone(p) : 'text-[#1A1D29]'} ${isNow ? 'bg-[#EAF1FF] font-semibold' : ''}`}
                  >
                    {row.cell(p)}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-[#AEB4C0]">금액 단위: 만원 · 진행 중 분기는 경과분 기준</p>
    </section>
  );
}
