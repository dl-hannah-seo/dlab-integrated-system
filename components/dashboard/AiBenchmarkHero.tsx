'use client';

import { labs, LAB_CURRENT_WEEK } from '@/lib/mock-data';
import {
  labMetricForWeek, metricsForWeek, averagesForWeek, deltaVsAverage, rankOf, buildInsights,
  METRIC_LABELS, METRIC_ORDER, LOWER_IS_BETTER, type InsightTone,
} from '@/lib/lab-metrics';

// 로그인한 랩장의 랩 (데모: 판교랩 고정 — 실제로는 세션에서 주입)
const MY_LAB_ID = 'lab-pg';

const TONE: Record<InsightTone, { bg: string; border: string; text: string; icon: string }> = {
  good: { bg: '#EDF7F5', border: '#0F7B6C26', text: '#0F7B6C', icon: '✓' },
  warn: { bg: '#FDECEA', border: '#EB575726', text: '#C0392B', icon: '!' },
  info: { bg: '#F7F7F5', border: '#E9E9E7', text: '#787774', icon: 'i' },
};

function weekLabel(iso: string): string {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))} 주간`;
}

/** 대시보드 히어로 — 가맹랩 운영 벤치마킹을 항상 펼친 확대형으로. 타이포·막대를 크게. */
export function AiBenchmarkHero() {
  const week = LAB_CURRENT_WEEK;
  const my = labMetricForWeek(MY_LAB_ID, week);
  const lab = labs.find(l => l.id === MY_LAB_ID);
  const weekMetrics = metricsForWeek(week);
  const avg = averagesForWeek(week);
  const insights = my ? buildInsights(my, avg).slice(0, 2) : [];

  if (!my || !lab) return null;

  const aboveCount = METRIC_ORDER.filter(key =>
    LOWER_IS_BETTER[key] ? my[key] < avg[key] : my[key] > avg[key],
  ).length;

  return (
    <section className="rounded-xl border border-[#E9E9E7] bg-white p-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h2 className="text-base font-semibold text-[#37352F]">가맹랩 운영 인사이트</h2>
          <span className="rounded-full border border-[#E9E9E7] bg-[#F7F7F5] px-2 py-0.5 text-xs text-[#787774]">
            벤치마킹
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#FF6C37]/20 bg-[#FFF1EC] px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6C37]" />
          <span className="text-xs font-medium text-[#FF6C37]">Claude Sonnet 4.6</span>
        </div>
      </div>

      {/* 큰 헤드라인 */}
      <p className="text-2xl font-bold leading-snug text-[#37352F]">
        {lab.name} · 8개 지표 중 <span className="text-[#FF6C37]">{aboveCount}개</span> 평균 상회
      </p>
      <p className="mt-1 text-sm text-[#787774]">
        {weekLabel(week)} · {lab.leader} 랩장 · 전체 {labs.length}개 가맹랩 대비
      </p>

      {/* 큰 막대그래프 */}
      <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {METRIC_ORDER.map(key => {
          const value = my[key];
          const a = avg[key];
          const delta = deltaVsAverage(value, a);
          const lowerBetter = LOWER_IS_BETTER[key];
          const isGood = delta === 0 ? null : lowerBetter ? delta < 0 : delta > 0;
          const max = Math.max(1, ...weekMetrics.map(m => m[key]));
          const r = rankOf(MY_LAB_ID, week, key);
          const barColor = isGood === null ? '#FF6C37' : isGood ? '#0F7B6C' : '#EB5757';
          const deltaColor = isGood === null ? '#787774' : isGood ? '#0F7B6C' : '#EB5757';
          const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '–';
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm text-[#37352F]">{METRIC_LABELS[key]}</span>
                <span>
                  <span className="text-lg font-bold tabular-nums text-[#37352F]">{value}</span>
                  <span className="ml-2 text-xs text-[#9B9A97]">평균 {a}</span>
                  <span className="ml-2 text-sm font-medium tabular-nums" style={{ color: deltaColor }}>
                    {arrow}{Math.abs(delta)}
                  </span>
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-[#F1F0EF]">
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ width: `${(value / max) * 100}%`, background: barColor }}
                />
                <div className="absolute top-[-3px] h-[18px] w-0.5 bg-[#37352F]" style={{ left: `${(a / max) * 100}%` }} />
              </div>
              {r && <p className="mt-1 text-[11px] text-[#9B9A97]">{r.rank}/{r.total}위 · 상위 {r.percentile}%</p>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-[#BEBDBA]">막대 = 우리 랩 · 세로선 = 전체 평균 · 퇴원율은 낮을수록 좋음</p>

      {/* 권장 조치 */}
      {insights.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#FF6C37]">💡 AI 인사이트 · 권장 조치</p>
          <div className="space-y-2">
            {insights.map((ins, i) => {
              const st = TONE[ins.tone];
              return (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2.5 text-sm leading-relaxed"
                  style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.text }}
                >
                  <p className="flex gap-2"><span className="shrink-0 font-bold">{st.icon}</span><span>{ins.text}</span></p>
                  {ins.action && <p className="mt-1 pl-5 text-[#37352F]">→ {ins.action}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
