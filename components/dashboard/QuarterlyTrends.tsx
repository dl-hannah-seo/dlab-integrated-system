'use client';

import {
  myPnlSeries, QUARTERS, quarterShort, fmtMan,
} from '@/lib/quarterly';

const LINE = '#0F7B6C';
const NOW = '#FF6C37';

// SVG 좌표계
const W = 320;
const H = 120;
const PAD_X = 12;
const PAD_TOP = 18;
const PAD_BOTTOM = 14;

interface LineChartProps {
  title: string;
  caption: string;
  values: number[];                 // QUARTERS 순서
  labelOf: (v: number) => string;   // 점 위 표기
  currentIdx: number;
}

function LineChart({ title, caption, values, labelOf, currentIdx }: LineChartProps) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  const pts = values.map((v, i) => ({
    x: PAD_X + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    y: PAD_TOP + innerH - ((v - min) / span) * innerH,
  }));
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="rounded-lg border border-[#E9E9E7] bg-white p-5">
      <p className="text-xs text-[#787774]">{title}</p>
      <p className="mt-1 text-sm font-medium text-[#37352F]">{caption}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" style={{ height: 120 }} preserveAspectRatio="none">
        <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => {
          const isNow = i === currentIdx;
          return (
            <g key={QUARTERS[i]}>
              <circle cx={p.x} cy={p.y} r={isNow ? 4 : 3} fill={isNow ? NOW : LINE} stroke="#fff" strokeWidth={1.5} />
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fontSize={9}
                fill={isNow ? NOW : '#9B9A97'}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {labelOf(values[i])}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between gap-2">
        {QUARTERS.map((q, i) => (
          <span
            key={q}
            className="flex-1 text-center text-[10px] tabular-nums"
            style={{ color: i === currentIdx ? NOW : '#9B9A97' }}
          >
            {quarterShort(q)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 성장 추이 — 학생 수·총매출 5개 분기 라인 그래프. 잔액은 제외(은행 API 불가). */
export function QuarterlyTrends() {
  const series = myPnlSeries;
  const currentIdx = series.findIndex(p => p.inProgress);
  const cur = series[currentIdx];
  const first = series[0]; // 전년 동기
  const studentGrowth = Math.round(((cur.students - first.students) / first.students) * 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LineChart
        title="학생 수 추이"
        caption={`${cur.students}명 · 전년 동기 대비 ▲${studentGrowth}%`}
        values={series.map(p => p.students)}
        labelOf={v => String(v)}
        currentIdx={currentIdx}
      />
      <LineChart
        title="총매출 추이"
        caption={`이번 분기 ${fmtMan(cur.revenue)}원 · 진행 중`}
        values={series.map(p => p.revenue)}
        labelOf={v => fmtMan(v)}
        currentIdx={currentIdx}
      />
    </div>
  );
}
