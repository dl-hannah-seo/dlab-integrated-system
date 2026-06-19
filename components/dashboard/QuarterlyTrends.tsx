'use client';

import {
  myPnlSeries, QUARTERS, quarterShort, fmtMan,
  type QuarterPnl,
} from '@/lib/quarterly';

// 막대 색: 지난 분기 = 청록, 진행 중 = 주황(강조)
const PAST = '#0F7B6C';
const NOW = '#FF6C37';

interface TrendChartProps {
  title: string;
  caption: string;
  values: number[];                 // QUARTERS 순서
  labelOf: (v: number) => string;   // 막대 위 표기
  currentIdx: number;               // 진행 중 분기 인덱스
}

function TrendChart({ title, caption, values, labelOf, currentIdx }: TrendChartProps) {
  const max = Math.max(1, ...values);
  return (
    <div className="rounded-lg border border-[#E9E9E7] bg-white p-5">
      <p className="text-xs text-[#787774]">{title}</p>
      <p className="mt-1 text-sm font-medium text-[#37352F]">{caption}</p>
      <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 96 }}>
        {values.map((v, i) => {
          const isNow = i === currentIdx;
          return (
            <div key={QUARTERS[i]} className="flex flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
              <span className="mb-1 text-[10px] tabular-nums text-[#9B9A97]">{labelOf(v)}</span>
              <div
                className="w-full rounded-t"
                style={{ height: `${Math.max(6, (v / max) * 100)}%`, background: isNow ? NOW : PAST }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-2">
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

/** 성장 추이 — 학생 수·매출 5개 분기. 잔액은 제외(은행 API 불가). */
export function QuarterlyTrends() {
  const series: QuarterPnl[] = myPnlSeries;
  const currentIdx = series.findIndex(p => p.inProgress);
  const cur = series[currentIdx];
  const first = series[0]; // 전년 동기

  const studentGrowth = Math.round(((cur.students - first.students) / first.students) * 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TrendChart
        title="학생 수"
        caption={`${cur.students}명 · 전년 동기 ${first.students}명 (▲${studentGrowth}%)`}
        values={series.map(p => p.students)}
        labelOf={v => String(v)}
        currentIdx={currentIdx}
      />
      <TrendChart
        title="매출"
        caption={`이번 분기 ${fmtMan(cur.revenue)}원 · 진행 중`}
        values={series.map(p => p.revenue)}
        labelOf={v => fmtMan(v)}
        currentIdx={currentIdx}
      />
    </div>
  );
}
