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
  good: { bg: '#EDF7F5', border: '#0F7B6C26', text: '#0F7B6C', icon: '✓' },
  warn: { bg: '#FDECEA', border: '#EB575726', text: '#C0392B', icon: '!' },
  info: { bg: '#F7F7F5', border: '#E9E9E7', text: '#787774', icon: 'i' },
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
          <h3 className="text-base font-semibold text-[#37352F]">가맹랩 운영 인사이트</h3>
          <span className="text-xs px-2 py-0.5 bg-[#F7F7F5] border border-[#E9E9E7] rounded-full text-[#787774]">벤치마킹</span>
        </div>
        {generated ? (
          <span className="text-xs text-[#0F7B6C] font-medium">✓ 생성 완료</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={run} loading={generating}>
            {generating ? '분석 중...' : 'AI 분석 실행'}
          </Button>
        )}
      </div>

      {!generated || !my || !funnel ? (
        <div className="bg-[#F7F7F5] rounded-lg p-8 text-center border border-dashed border-[#E9E9E7]">
          <p className="text-sm text-[#787774]">버튼을 눌러 가맹랩 비교 분석을 실행하세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[#787774]">
            {weekLabel(week)} · <span className="text-[#37352F] font-medium">{lab.name} {lab.leader} 랩장</span> · 전체 {labs.length}개 가맹랩 대비
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
              const barColor = isGood === null ? '#FF6C37' : isGood ? '#0F7B6C' : '#EB5757';
              const deltaColor = isGood === null ? '#787774' : isGood ? '#0F7B6C' : '#EB5757';
              const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '–';
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#787774]">{METRIC_LABELS[key]}</span>
                    <span className="text-xs">
                      <span className="text-sm font-semibold text-[#37352F] tabular-nums">{value}</span>
                      <span className="text-[#9B9A97] ml-1.5">평균 {a}</span>
                      <span className="ml-1.5 font-medium tabular-nums" style={{ color: deltaColor }}>{arrow}{Math.abs(delta)}</span>
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-[#F1F0EF]">
                    <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: barColor }} />
                    <div className="absolute top-[-2px] h-[12px] w-0.5 bg-[#37352F]" style={{ left: `${(a / max) * 100}%` }} />
                  </div>
                  {r && (
                    <p className="text-[10px] text-[#9B9A97] mt-0.5">{r.rank}/{r.total}위 · 상위 {r.percentile}%</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#BEBDBA]">막대 = 우리 랩 · 세로선 = 전체 평균 · 퇴원율은 낮을수록 좋음</p>

          {/* 전환 퍼널 */}
          <div className="rounded-lg bg-[#F7F7F5] p-4">
            <p className="text-[11px] font-semibold text-[#787774] uppercase tracking-wide mb-2">전환 퍼널 (홍보 → 문의 → 등록)</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-center">
                <span className="block text-lg font-bold text-[#37352F] tabular-nums">{funnel.promo}</span>
                <span className="text-[11px] text-[#787774]">홍보</span>
              </span>
              <span className="text-xs text-[#FF6C37] font-medium tabular-nums">{funnel.promoToInquiry}%→</span>
              <span className="flex-1 text-center">
                <span className="block text-lg font-bold text-[#37352F] tabular-nums">{funnel.inquiry}</span>
                <span className="text-[11px] text-[#787774]">문의</span>
              </span>
              <span className="text-xs text-[#FF6C37] font-medium tabular-nums">{funnel.inquiryToEnroll}%→</span>
              <span className="flex-1 text-center">
                <span className="block text-lg font-bold text-[#37352F] tabular-nums">{funnel.enroll}</span>
                <span className="text-[11px] text-[#787774]">등록</span>
              </span>
            </div>
          </div>

          {/* 인사이트 + 권장 조치 */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#FF6C37]">💡 AI 인사이트 · 권장 조치</p>
            <div className="space-y-2">
              {insights.map((ins, i) => {
                const st = TONE[ins.tone];
                return (
                  <div key={i} className="px-3 py-2 rounded-lg text-xs leading-relaxed" style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.text }}>
                    <p className="flex gap-2"><span className="font-bold shrink-0">{st.icon}</span><span>{ins.text}</span></p>
                    {ins.action && <p className="mt-1 pl-5 text-[#37352F]">→ {ins.action}</p>}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#BEBDBA] mt-2">규칙 기반 분석 · 데이터 축적 후 Claude API 실시간 인사이트로 확장 예정</p>
          </div>
        </div>
      )}
    </Card>
  );
}
