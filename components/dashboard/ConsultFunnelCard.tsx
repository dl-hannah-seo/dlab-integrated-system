'use client';

import Link from 'next/link';
import { leads, TODAY } from '@/lib/mock-data';
import { rollingFunnel, rate, DEFAULT_PROMO_90D } from '@/lib/leads';

const FUNNEL_DAYS = 90;

/** 대시보드 — 홍보→상담→입관 퍼널 (최근 90일 롤링). 상담·입관 자동 집계, 홍보는 공유 기본값. */
export function ConsultFunnelCard() {
  const f = rollingFunnel(leads, TODAY, FUNNEL_DAYS);
  const steps = [
    { label: '홍보', value: DEFAULT_PROMO_90D, tone: 'bg-[#F1F1EF] text-[#37352F]' },
    { label: '상담', value: f.consult, tone: 'bg-[#FFF1EC] text-[#FF6C37]' },
    { label: '입관', value: f.enroll, tone: 'bg-[#EDF7F5] text-[#0F7B6C]' },
  ];

  return (
    <section className="rounded-xl border border-[#E9E9E7] bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#37352F]">
          홍보 → 상담 → 입관 퍼널 <span className="ml-1 text-xs font-normal text-[#9B9A97]">최근 {FUNNEL_DAYS}일 롤링</span>
        </h2>
        <Link href="/leads" className="text-xs font-medium text-[#FF6C37] hover:underline">상담 관리 →</Link>
      </div>
      <div className="flex items-stretch gap-1.5">
        {steps.map((b, i, arr) => (
          <span key={b.label} className="flex flex-1 items-center gap-1.5">
            <div className={`flex-1 rounded-lg px-3 py-3 text-center ${b.tone}`}>
              <p className="text-xs">{b.label}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">{b.value.toLocaleString('ko-KR')}</p>
            </div>
            {i < arr.length - 1 && (
              <div className="flex w-12 shrink-0 flex-col items-center text-[#9B9A97]">
                <span className="text-lg leading-none">›</span>
                <span className="mt-0.5 text-[11px] tabular-nums">{rate(arr[i + 1].value, b.value)}%</span>
              </div>
            )}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-[#9B9A97]">상담·입관 자동 집계(최근 {FUNNEL_DAYS}일) · 홍보 건수는 상담 관리에서 입력 · 홍보→입관 {rate(f.enroll, DEFAULT_PROMO_90D)}%</p>
    </section>
  );
}
