'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DeleteButton } from '@/components/ui/DeleteButton';
import {
  buildPnlLines, summarize, groupTotal, fmt,
  REVENUE_GROUPS, EXPENSE_GROUPS, MONTHLY_PNL, CURRENT_MONTH, monthShort, monthMargin,
  type PnlLine, type PnlKind, type PnlGroup, type TaxClass,
} from '@/lib/pnl';

let addCounter = 0;

export function PnlDashboard() {
  const [lines, setLines] = useState<PnlLine[]>(() => buildPnlLines());
  const s = summarize(lines);
  const maxMonthly = Math.max(...MONTHLY_PNL.map(m => m.revenue));

  const setAmount = (id: string, v: number) =>
    setLines(prev => prev.map(l => (l.id === id ? { ...l, amount: Number.isFinite(v) ? Math.max(0, v) : 0 } : l)));
  const setLabel = (id: string, v: string) =>
    setLines(prev => prev.map(l => (l.id === id ? { ...l, label: v } : l)));
  const setTax = (id: string, tax: TaxClass) =>
    setLines(prev => prev.map(l => (l.id === id ? { ...l, tax } : l)));
  const remove = (id: string) => setLines(prev => prev.filter(l => l.id !== id));
  const addLine = (kind: PnlKind, group: PnlGroup) => {
    addCounter += 1;
    setLines(prev => [...prev, { id: `pnl-new-${addCounter}`, kind, group, label: '', amount: 0, ...(kind === 'revenue' ? { tax: '면세' as TaxClass } : {}) }]);
  };

  // 매출 라인 면세/과세 표시 — 자동 라인은 배지, 편집 라인은 클릭 토글
  function TaxToggle({ line }: { line: PnlLine }) {
    if (line.kind !== 'revenue') return null;
    const t: TaxClass = line.tax ?? '면세';
    const cls = t === '면세' ? 'bg-[#EDF7F5] text-[#0F7B6C]' : 'bg-[#FFF1EC] text-[#FF6C37]';
    if (line.auto) {
      return <span className={`w-10 shrink-0 text-center text-[11px] px-1 py-0.5 rounded ${cls}`}>{t}</span>;
    }
    return (
      <button
        type="button"
        onClick={() => setTax(line.id, t === '면세' ? '과세' : '면세')}
        className={`w-10 shrink-0 text-center text-[11px] px-1 py-0.5 rounded ${cls} hover:opacity-80 transition-opacity`}
        title="클릭하여 면세/과세 전환"
      >
        {t}
      </button>
    );
  }

  const kpis: { label: string; value: string; tone?: 'profit' | 'danger' }[] = [
    { label: '총매출', value: fmt(s.totalRevenue) },
    { label: '총인건비', value: fmt(s.totalLabor) },
    { label: '총운영비', value: fmt(s.totalOps) },
    { label: '총마케팅비', value: fmt(s.totalMarketing) },
    { label: '총지출', value: fmt(s.totalExpense), tone: 'danger' },
    { label: '영업이익', value: fmt(s.operatingProfit), tone: s.operatingProfit >= 0 ? 'profit' : 'danger' },
    { label: '영업이익률', value: `${s.opMargin}%`, tone: s.operatingProfit >= 0 ? 'profit' : 'danger' },
    { label: '인건비율', value: `${s.laborRatio}%` },
  ];

  function GroupBlock({ kind, group }: { kind: PnlKind; group: PnlGroup }) {
    const rows = lines.filter(l => l.kind === kind && l.group === group);
    return (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-[#787774] uppercase tracking-wide">{group}</span>
          <span className="text-xs font-semibold text-[#37352F] tabular-nums">{fmt(groupTotal(lines, group))}</span>
        </div>
        <div className="space-y-1">
          {rows.map(l => (
            <div key={l.id} className="flex items-center gap-2">
              {l.auto ? (
                <span className="flex-1 text-sm text-[#37352F]">
                  {l.label}
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#F1F1EF] text-[#9B9A97]">자동</span>
                </span>
              ) : (
                <input
                  value={l.label}
                  onChange={e => setLabel(l.id, e.target.value)}
                  placeholder="항목명"
                  className="flex-1 text-sm text-[#37352F] bg-white border border-[#E9E9E7] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF6C37]"
                />
              )}
              <TaxToggle line={l} />
              {l.auto ? (
                <span className="w-32 text-right text-sm text-[#37352F] tabular-nums">{fmt(l.amount)}</span>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    inputMode="numeric"
                    value={l.amount ? l.amount.toLocaleString('ko-KR') : ''}
                    onChange={e => setAmount(l.id, Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                    className="w-32 text-right text-sm text-[#37352F] tabular-nums bg-white border border-[#E9E9E7] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#FF6C37]"
                  />
                  <span className="text-xs text-[#9B9A97]">원</span>
                </div>
              )}
              {l.auto ? <span className="w-8" /> : <DeleteButton onClick={() => remove(l.id)} className="w-8 text-xs">삭제</DeleteButton>}
            </div>
          ))}
        </div>
        <button
          onClick={() => addLine(kind, group)}
          className="mt-1.5 text-xs text-[#787774] hover:text-[#FF6C37] transition-colors"
        >
          + 항목 추가
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#37352F]">손익 현황 (이번 달)</h1>
        <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 매출·지출 손익 대시보드 · 지출 항목은 직접 편집·추가</p>
      </div>

      {/* 손익 요약 (결론) — 최상단 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#37352F] px-6 py-5">
        <div>
          <p className="text-xs text-[#9B9B97]">영업이익 (총매출 − 총지출)</p>
          <p className={`mt-1 text-3xl font-bold tabular-nums ${s.operatingProfit >= 0 ? 'text-[#5FD0BE]' : 'text-[#FF8A8A]'}`}>
            {fmt(s.operatingProfit)}
          </p>
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <p className="text-xs text-[#9B9B97]">영업이익률</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${s.operatingProfit >= 0 ? 'text-white' : 'text-[#FF8A8A]'}`}>{s.opMargin}%</p>
          </div>
          <div>
            <p className="text-xs text-[#9B9B97]">인건비율</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">{s.laborRatio}%</p>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-white border border-[#E9E9E7] rounded-lg p-4">
            <p className="text-xs text-[#787774]">{k.label}</p>
            <p className={`mt-1.5 text-xl font-bold tabular-nums ${
              k.tone === 'profit' ? 'text-[#0F7B6C]' : k.tone === 'danger' ? 'text-[#EB5757]' : 'text-[#37352F]'
            }`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* 월별 손익 추이 (임시 목업) */}
      <Card title="월별 손익 추이" className="mb-6" action={<span className="text-[11px] text-[#9B9A97]">임시 목업</span>}>
        <p className="text-xs text-[#787774] -mt-1 mb-4">월별 매출·지출·영업이익 비교 (실제 집계 연동 전 데모)</p>
        {/* 막대 그래프 — 매출/지출 + 영업이익 */}
        <div className="flex items-end justify-between gap-3 mb-5" style={{ height: 160 }}>
          {MONTHLY_PNL.map(m => {
            const isCur = m.month === CURRENT_MONTH;
            return (
              <div key={m.month} className="flex flex-1 flex-col items-center justify-end h-full">
                <span className="mb-1 text-[10px] font-medium tabular-nums" style={{ color: m.profit >= 0 ? '#0F7B6C' : '#EB5757' }}>
                  {Math.round(m.profit / 10000) / 10}M
                </span>
                <div className="flex items-end justify-center gap-0.5 w-full" style={{ height: '100%' }}>
                  <div className="w-2.5 rounded-t bg-[#0F7B6C]" style={{ height: `${(m.revenue / maxMonthly) * 100}%` }} title={`매출 ${fmt(m.revenue)}`} />
                  <div className="w-2.5 rounded-t bg-[#EB5757]" style={{ height: `${(m.expense / maxMonthly) * 100}%` }} title={`지출 ${fmt(m.expense)}`} />
                </div>
                <span className={`mt-2 text-xs ${isCur ? 'font-bold text-[#FF6C37]' : 'text-[#787774]'}`}>{monthShort(m.month)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mb-4 text-[11px] text-[#787774]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#0F7B6C]" />매출</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#EB5757]" />지출</span>
          <span className="text-[#0F7B6C]">상단 숫자 = 영업이익(백만원)</span>
        </div>

        {/* 월별 요약 표 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#E9E9E7] text-left text-[#37352F]">
                <th className="px-3 py-2 font-semibold">월</th>
                <th className="px-3 py-2 font-semibold text-right">매출</th>
                <th className="px-3 py-2 font-semibold text-right">지출</th>
                <th className="px-3 py-2 font-semibold text-right">영업이익</th>
                <th className="px-3 py-2 font-semibold text-right">이익률</th>
              </tr>
            </thead>
            <tbody>
              {[...MONTHLY_PNL].reverse().map(m => {
                const isCur = m.month === CURRENT_MONTH;
                return (
                  <tr key={m.month} className={`border-b border-[#F1F0EF] ${isCur ? 'bg-[#FFF8F5]' : ''}`}>
                    <td className="px-3 py-2 text-[#37352F]">{monthShort(m.month)}{isCur && <span className="ml-1 text-[10px] text-[#FF6C37]">이번 달</span>}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#37352F]">{fmt(m.revenue)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#EB5757]">{fmt(m.expense)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-medium ${m.profit >= 0 ? 'text-[#0F7B6C]' : 'text-[#EB5757]'}`}>{fmt(m.profit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#37352F]">{monthMargin(m)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 매출 */}
        <Card
          title="매출 내역"
          action={<span className="text-sm font-semibold text-[#37352F] tabular-nums">{fmt(s.totalRevenue)}</span>}
        >
          {REVENUE_GROUPS.map(g => <GroupBlock key={g} kind="revenue" group={g} />)}
          <div className="mt-2 pt-3 border-t border-[#E9E9E7] flex items-center justify-between text-sm">
            <span className="text-[#787774]">면세 / 과세 매출</span>
            <span className="tabular-nums">
              <span className="font-medium text-[#0F7B6C]">{fmt(s.taxExemptRevenue)}</span>
              <span className="mx-1.5 text-[#9B9A97]">/</span>
              <span className="font-medium text-[#FF6C37]">{fmt(s.taxableRevenue)}</span>
            </span>
          </div>
        </Card>

        {/* 지출 */}
        <Card
          title="지출 내역"
          action={<span className="text-sm font-semibold text-[#EB5757] tabular-nums">{fmt(s.totalExpense)}</span>}
        >
          {EXPENSE_GROUPS.map(g => <GroupBlock key={g} kind="expense" group={g} />)}
        </Card>
      </div>
    </div>
  );
}
