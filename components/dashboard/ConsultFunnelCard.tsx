'use client';

import Link from 'next/link';
import { leads, TODAY } from '@/lib/mock-data';
import {
  currentQuarter,
  quarterLabel,
  quarterFunnel,
  promoSum,
  usePromoStore,
  getQuarter,
  rate,
} from '@/lib/promotion';

/** 대시보드 — 홍보→상담→입관 퍼널 (현재 분기). 상담·입관 자동 집계, 홍보는 채널 입력 합산. */
export function ConsultFunnelCard() {
  const cur = currentQuarter(TODAY);
  const f = quarterFunnel(leads, cur);

  // 홍보 값 = 현재 분기 채널 입력 합산 (localStorage 구독, SSR은 시드값).
  const store = usePromoStore();
  const promo = promoSum(getQuarter(store, cur, TODAY));

  const steps = [
    { label: '홍보', value: promo, tone: 'bg-[#F1F1EF] text-[#37352F]' },
    { label: '상담', value: f.consult, tone: 'bg-[#FFF1EC] text-[#FF6C37]' },
    { label: '등록', value: f.enroll, tone: 'bg-[#EDF7F5] text-[#0F7B6C]' },
  ];

  // 퇴원 — 데모 데이터(퇴원 집계 연동 전 임시값)
  const withdrawDemo = 3;

  return (
    <section className="rounded-xl border border-[#E9E9E7] bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#37352F]">
          홍보 → 상담 → 등록 · 퇴원 <span className="ml-1 text-xs font-normal text-[#9B9A97]">{quarterLabel(cur)}</span>
        </h2>
        <Link href="/promotion" className="text-xs font-medium text-[#FF6C37] hover:underline">자세히 보기 →</Link>
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
        {/* 퇴원 — 흐름과 분리 (데모) */}
        <span className="mx-1 w-px shrink-0 self-stretch bg-[#E9E9E7]" />
        <span className="flex flex-1 items-center">
          <div className="flex-1 rounded-lg bg-[#FDECEA] px-3 py-3 text-center text-[#EB5757]">
            <p className="text-xs">퇴원</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums">{withdrawDemo.toLocaleString('ko-KR')}</p>
          </div>
        </span>
      </div>
      <p className="mt-3 text-[11px] text-[#9B9A97]">상담·등록 자동 집계(현재 분기) · 홍보 건수는 홍보 지표에서 채널별 입력 · 홍보→등록 {rate(f.enroll, promo)}% · 퇴원은 데모 값</p>
    </section>
  );
}
