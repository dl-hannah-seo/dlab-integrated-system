'use client';

import { myPnlSeries, QUARTERS, quarterShort, fmtMan } from '@/lib/quarterly';

const STUDENT = '#0F7B6C'; // 학생수
const REVENUE = '#FF6C37'; // 총매출

// SVG 좌표계 (preserveAspectRatio none — 가로로 늘어남)
const W = 600;
const H = 150;
const PAD_X = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 14;

interface Built {
  pts: { x: number; y: number }[];
  d: string;
}

/** 값 배열을 자체 min/max로 스케일한 라인 경로 + 점 좌표 */
function buildLine(values: number[]): Built {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const pts = values.map((v, i) => ({
    x: PAD_X + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    y: PAD_TOP + innerH - ((v - min) / span) * innerH,
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return { pts, d };
}

function Dots({ built, color, currentIdx }: { built: Built; color: string; currentIdx: number }) {
  return (
    <>
      {built.pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === currentIdx ? 4 : 3}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}
    </>
  );
}

/** 성장 추이 — 학생수·총매출을 하나의 그래프에 겹쳐 표시(각자 스케일). 표와 동일한 분기 데이터. */
export function QuarterlyTrends() {
  const series = myPnlSeries;
  const currentIdx = series.findIndex(p => p.inProgress);
  const cur = series[currentIdx];

  const S = buildLine(series.map(p => p.students));
  const R = buildLine(series.map(p => p.revenue));

  return (
    <div>
      {/* 범례 */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-[#37352F]">
          <span className="h-2 w-2 rounded-full" style={{ background: STUDENT }} />
          학생수 <span className="font-semibold tabular-nums">{cur.students}명</span>
        </span>
        <span className="flex items-center gap-1.5 text-[#37352F]">
          <span className="h-2 w-2 rounded-full" style={{ background: REVENUE }} />
          총매출 <span className="font-semibold tabular-nums">{fmtMan(cur.revenue)}원</span>
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }} preserveAspectRatio="none">
        <path d={S.d} fill="none" stroke={STUDENT} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={R.d} fill="none" stroke={REVENUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <Dots built={S} color={STUDENT} currentIdx={currentIdx} />
        <Dots built={R} color={REVENUE} currentIdx={currentIdx} />
      </svg>

      {/* x축 — 표와 동일한 분기 라벨 */}
      <div className="flex justify-between gap-2">
        {QUARTERS.map((q, i) => (
          <span
            key={q}
            className="flex-1 text-center text-[10px] tabular-nums"
            style={{ color: i === currentIdx ? '#37352F' : '#9B9A97', fontWeight: i === currentIdx ? 600 : 400 }}
          >
            {quarterShort(q)}
          </span>
        ))}
      </div>
    </div>
  );
}
