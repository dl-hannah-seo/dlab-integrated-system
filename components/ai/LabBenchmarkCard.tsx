'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { labs, LAB_CURRENT_WEEK } from '@/lib/mock-data';
import {
  labMetricForWeek, metricsForWeek, averagesForWeek, deltaVsAverage, rankOf, funnelOf, buildInsights,
  METRIC_LABELS, METRIC_ORDER, LOWER_IS_BETTER, type InsightTone,
} from '@/lib/lab-metrics';

// 로그인한 랩장의 랩 (데모: 판교랩 고정 — 실제로는 세션에서 주입)
const MY_LAB_ID = 'lab-pg';

function weekLabel(iso: string): string {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))} 주간`;
}

const TONE: Record<InsightTone, { bg: string; border: string; text: string; icon: string }> = {
  good: { bg: '#E6F9EF', border: '#28C76F26', text: '#28C76F', icon: '✓' },
  warn: { bg: '#FEE9EA', border: '#F2474B26', text: '#D93539', icon: '!' },
  info: { bg: '#F4F6FA', border: '#E8EBF1', text: '#6B7280', icon: 'i' },
};

export function LabBenchmarkCard() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const week = LAB_CURRENT_WEEK;
  const my = labMetricForWeek(MY_LAB_ID, week);
  const lab = labs.find(l => l.id === MY_LAB_ID)!;
  const weekMetrics = metricsForWeek(week);
  const avg = averagesForWeek(week);
  const insights = my ? buildInsights(my, avg) : [];
  const funnel = my ? funnelOf(my) : null;

  function run() {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h3 className="text-base font-semibold text-[#1A1D29]">가맹랩 운영 인사이트</h3>
          <span className="text-xs px-2 py-0.5 bg-[#F4F6FA] border border-[#E8EBF1] rounded-full text-[#6B7280]">벤치마킹</span>
        </div>
        {generated ? (
          <span className="text-xs text-[#28C76F] font-medium">✓ 생성 완료</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={run} loading={generating}>
            {generating ? '분석 중...' : 'AI 분석 실행'}
          </Button>
        )}
      </div>

      {!generated || !my || !funnel ? (
        <div className="bg-[#F4F6FA] rounded-lg p-8 text-center border border-dashed border-[#E8EBF1]">
          <p className="text-sm text-[#6B7280]">버튼을 눌러 가맹랩 비교 분석을 실행하세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            {weekLabel(week)} · <span className="text-[#1A1D29] font-medium">{lab.name} {lab.leader} 랩장</span> · 전체 {labs.length}개 가맹랩 대비
          </p>

          {/* 지표 비교 + 순위 */}
          <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {METRIC_ORDER.map(key => {
              const value = my[key];
              const a = avg[key];
              const delta = deltaVsAverage(value, a);
              const lowerBetter = LOWER_IS_BETTER[key];
              const isGood = delta === 0 ? null : lowerBetter ? delta < 0 : delta > 0;
              const max = Math.max(1, ...weekMetrics.map(m => m[key]));
              const r = rankOf(MY_LAB_ID, week, key);
              const barColor = isGood === null ? '#2F6BFF' : isGood ? '#28C76F' : '#F2474B';
              const deltaColor = isGood === null ? '#6B7280' : isGood ? '#28C76F' : '#F2474B';
              const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '–';
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#6B7280]">{METRIC_LABELS[key]}</span>
                    <span className="text-xs">
                      <span className="text-sm font-semibold text-[#1A1D29] tabular-nums">{value}</span>
                      <span className="text-[#9CA3AF] ml-1.5">평균 {a}</span>
                      <span className="ml-1.5 font-medium tabular-nums" style={{ color: deltaColor }}>{arrow}{Math.abs(delta)}</span>
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-[#EEF1F5]">
                    <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: barColor }} />
                    <div className="absolute top-[-2px] h-[12px] w-0.5 bg-[#1A1D29]" style={{ left: `${(a / max) * 100}%` }} />
                  </div>
                  {r && (
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{r.rank}/{r.total}위 · 상위 {r.percentile}%</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#AEB4C0]">막대 = 우리 랩 · 세로선 = 전체 평균 · 퇴원율은 낮을수록 좋음</p>

          {/* 전환 퍼널 */}
          <div className="rounded-lg bg-[#F4F6FA] p-4">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2">전환 퍼널 (홍보 → 문의 → 등록)</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-center">
                <span className="block text-lg font-bold text-[#1A1D29] tabular-nums">{funnel.promo}</span>
                <span className="text-[11px] text-[#6B7280]">홍보</span>
              </span>
              <span className="text-xs text-[#2F6BFF] font-medium tabular-nums">{funnel.promoToInquiry}%→</span>
              <span className="flex-1 text-center">
                <span className="block text-lg font-bold text-[#1A1D29] tabular-nums">{funnel.inquiry}</span>
                <span className="text-[11px] text-[#6B7280]">문의</span>
              </span>
              <span className="text-xs text-[#2F6BFF] font-medium tabular-nums">{funnel.inquiryToEnroll}%→</span>
              <span className="flex-1 text-center">
                <span className="block text-lg font-bold text-[#1A1D29] tabular-nums">{funnel.enroll}</span>
                <span className="text-[11px] text-[#6B7280]">등록</span>
              </span>
            </div>
          </div>

          {/* 인사이트 + 권장 조치 */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#2F6BFF]">💡 AI 인사이트 · 권장 조치</p>
            <div className="space-y-2">
              {insights.map((ins, i) => {
                const st = TONE[ins.tone];
                return (
                  <div key={i} className="px-3 py-2 rounded-lg text-xs leading-relaxed" style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.text }}>
                    <p className="flex gap-2"><span className="font-bold shrink-0">{st.icon}</span><span>{ins.text}</span></p>
                    {ins.action && <p className="mt-1 pl-5 text-[#1A1D29]">→ {ins.action}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
