'use client';

import { useState } from 'react';
import {
  myLeadSeries, distributionForQuarter, quarterLabel, quarterShort,
  CURRENT_QUARTER, QUARTERS,
  LEAD_KEYS, LEAD_LABELS, LEAD_LOWER_IS_BETTER, formatLead,
  type LeadKey,
} from '@/lib/quarterly';

const GOOD = '#0F7B6C';
const BAD = '#EB5757';
const MINE = '#FF6C37';
const TRACK = '#F1F0EF';

function pct(x: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.min(100, Math.max(0, ((x - min) / (max - min)) * 100));
}

/** 현재 분기: 타 캠퍼스 분포(min·max·평균) 대비 자사 위치 */
function DistRow({ k }: { k: LeadKey }) {
  const d = distributionForQuarter(CURRENT_QUARTER, k);
  const lowerBetter = LEAD_LOWER_IS_BETTER[k];
  const delta = Math.round((d.mine - d.avg) * 10) / 10;
  const good = delta === 0 ? null : lowerBetter ? delta < 0 : delta > 0;
  const deltaColor = good === null ? '#9B9A97' : good ? GOOD : BAD;
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '–';

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-[#37352F]">{LEAD_LABELS[k]}</span>
        <span>
          <span className="text-lg font-bold tabular-nums text-[#37352F]">{formatLead(k, d.mine)}</span>
          <span className="ml-2 text-xs text-[#9B9A97]">평균 {d.avg}</span>
          <span className="ml-2 text-sm font-medium tabular-nums" style={{ color: deltaColor }}>
            {arrow}{Math.abs(delta)}
          </span>
        </span>
      </div>
      {/* 분포 막대: 좌(min) ~ 우(max), 세로선=평균, 점=자사 */}
      <div className="relative h-3 rounded-full" style={{ background: TRACK }}>
        <div
          className="absolute top-[-3px] h-[18px] w-0.5 bg-[#37352F]"
          style={{ left: `${pct(d.avg, d.min, d.max)}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
          style={{ left: `${pct(d.mine, d.min, d.max)}%`, background: MINE }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-[#BEBDBA]">
        <span>최소 {d.min}</span>
        <span>최대 {d.max}</span>
      </div>
    </div>
  );
}

/** 펼침: 지표별 5개 분기 추이(자사) */
function TrendRow({ k }: { k: LeadKey }) {
  const vals = myLeadSeries.map(l => l[k]);
  const max = Math.max(1, ...vals);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-[#37352F]">{LEAD_LABELS[k]}</span>
        <span className="text-xs text-[#9B9A97]">최근 5개 분기</span>
      </div>
      <div className="flex items-end justify-between gap-2" style={{ height: 64 }}>
        {vals.map((v, i) => {
          const isNow = QUARTERS[i] === CURRENT_QUARTER;
          return (
            <div key={QUARTERS[i]} className="flex flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
              <span className="mb-1 text-[10px] tabular-nums text-[#9B9A97]">{v}</span>
              <div
                className="w-full rounded-t"
                style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: isNow ? MINE : '#0F7B6C' }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between gap-2">
        {QUARTERS.map(q => (
          <span key={q} className="flex-1 text-center text-[10px] tabular-nums text-[#BEBDBA]">{quarterShort(q)}</span>
        ))}
      </div>
    </div>
  );
}

/** 운영 인사이트 — 선행지표 4종. 디폴트=현재 분기 분포, 토글 시 5개 분기 비교. */
export function QuarterlyInsights() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="rounded-xl border border-[#E9E9E7] bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-[#37352F]">운영 인사이트</h2>
          <span className="text-xs text-[#9B9A97]">
            {expanded ? '최근 5개 분기' : `${quarterLabel(CURRENT_QUARTER)} · 캠퍼스 비교`}
          </span>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="rounded-md border border-[#E9E9E7] px-3 py-1.5 text-xs font-medium text-[#37352F] transition-colors hover:border-[#FF6C37] hover:text-[#FF6C37]"
        >
          {expanded ? '현재 분기' : '5개 분기 비교'}
        </button>
      </div>

      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {LEAD_KEYS.map(k => (expanded ? <TrendRow key={k} k={k} /> : <DistRow key={k} k={k} />))}
      </div>

      {!expanded && (
        <p className="mt-4 text-[11px] text-[#BEBDBA]">● 우리 캠퍼스 · 세로선 = 전체 평균 · 퇴원율은 낮을수록 좋음</p>
      )}
    </section>
  );
}
