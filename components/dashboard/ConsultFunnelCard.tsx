'use client';

import { Fragment } from 'react';
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

/** 대시보드 — 홍보→상담→등록 퍼널 (현재 분기). 상담·등록 자동 집계, 홍보는 채널 입력 합산. */
export function ConsultFunnelCard() {
  const cur = currentQuarter(TODAY);
  const f = quarterFunnel(leads, cur);

  // 홍보 값 = 현재 분기 채널 입력 합산 (localStorage 구독, SSR은 시드값).
  const store = usePromoStore();
  const promo = promoSum(getQuarter(store, cur, TODAY));

  // 퇴원 — 데모 데이터(퇴원 집계 연동 전 임시값)
  const withdrawDemo = 1;

  const steps = [
    { label: '홍보', value: promo,        avg: 145, tone: 'bg-[#EAF1FF] text-[#2F6BFF]' },
    { label: '상담', value: f.consult,    avg: 10,  tone: 'bg-[#EEF1F5] text-[#4B5563]' },
    { label: '등록', value: f.enroll,     avg: 5,   tone: 'bg-[#E6F9EF] text-[#1FA85C]' },
    { label: '퇴원', value: withdrawDemo, avg: 2,   tone: 'bg-[#FEE9EA] text-[#F2474B]' },
  ];

  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-6 shadow-[0_2px_8px_rgba(20,30,55,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1A1D29]">
          홍보 → 상담 → 등록 → 퇴원 <span className="ml-1 text-xs font-normal text-[#9CA3AF]">{quarterLabel(cur)}</span>
        </h2>
        <Link href="/promotion" className="text-xs font-medium text-[#2F6BFF] hover:underline">자세히 보기 →</Link>
      </div>
      <div className="flex items-stretch gap-1.5">
        {steps.map((b, i, arr) => (
          <Fragment key={b.label}>
            <div className={`flex-1 basis-0 min-w-0 rounded-lg px-3 py-3 text-center ${b.tone}`}>
              <p className="text-xs">{b.label}</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">{b.value.toLocaleString('ko-KR')}</p>
              <p className="mt-1 text-[10px] opacity-60">평균 {b.avg}</p>
            </div>
            {i < arr.length - 1 && (
              <div className="flex shrink-0 flex-col items-center justify-center px-1">
                <span className="text-lg leading-none text-[#C7CDD6]">›</span>
                <span className="mt-1 rounded-full bg-[#EAF1FF] px-2 py-0.5 text-xs font-bold tabular-nums text-[#2F6BFF]">{rate(arr[i + 1].value, b.value)}%</span>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
