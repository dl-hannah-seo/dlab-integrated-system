'use client';

import { useState } from 'react';
import { dashboardData, getUnpaidStudents, classes } from '@/lib/mock-data';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';

function formatMoney(n: number) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + '천만원';
  if (n >= 1000000) return (n / 1000000).toFixed(0) + '백만원';
  return n.toLocaleString('ko-KR') + '원';
}

export default function DashboardPage() {
  const [showMsgModal, setShowMsgModal] = useState(false);
  const unpaid = getUnpaidStudents();
  const d = dashboardData;

  const paymentRate = Math.round((d.paid_students / d.total_students) * 100);
  const diffColor = d.revenue_diff > 0 ? 'text-[#0F7B6C]' : 'text-[#EB5757]';
  const diffSign = d.revenue_diff > 0 ? '+' : '';

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">매출 대시보드</h1>
          <p className="text-sm text-[#787774] mt-1">강남 캠퍼스 · 2026년 6월</p>
        </div>
        <Select
          options={[{ value: '2026-06', label: '2026년 6월' }, { value: '2026-05', label: '2026년 5월' }]}
          className="w-40"
        />
      </div>

      {/* 핵심 KPI */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card className="text-center !p-0">
          <div className="px-6 py-5">
            <p className="text-sm text-[#787774] mb-1">이번 달 총 매출</p>
            <p className="text-3xl font-bold text-[#37352F] tabular-nums">{d.total_revenue.toLocaleString()}원</p>
            <p className={`text-sm mt-1 tabular-nums ${diffColor}`}>
              {diffSign}{d.revenue_diff.toLocaleString()}원 vs 지난달
            </p>
          </div>
        </Card>
        <Card className="text-center !p-0">
          <div className="px-6 py-5">
            <p className="text-sm text-[#787774] mb-1">결제 완료율</p>
            <p className="text-3xl font-bold text-[#37352F] tabular-nums">{paymentRate}%</p>
            <p className="text-sm text-[#787774] mt-1">{d.paid_students}명 / {d.total_students}명</p>
          </div>
        </Card>
        <Card className="text-center !p-0">
          <div className="px-6 py-5">
            <p className="text-sm text-[#787774] mb-1">미납 인원</p>
            <p className="text-3xl font-bold text-[#EB5757] tabular-nums">{d.unpaid_students}명</p>
            <p className="text-sm text-[#787774] mt-1">결제 대기 중</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* 항목별 매출 분해 */}
        <Card title="항목별 매출">
          <div className="space-y-4">
            {[
              { label: '교육비', amount: d.tuition_revenue, color: '#FF6C37' },
              { label: '교구 대여비', amount: d.material_revenue, color: '#1A73E8' },
              { label: '콘텐츠 사용비', amount: d.content_revenue, color: '#0F7B6C' },
            ].map(item => {
              const pct = Math.round((item.amount / d.total_revenue) * 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#37352F]">{item.label}</span>
                    <span className="text-sm font-medium tabular-nums text-[#37352F]">{item.amount.toLocaleString()}원</span>
                  </div>
                  <div className="h-2 bg-[#F7F7F5] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                  <p className="text-xs text-[#787774] mt-0.5">{pct}%</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 결제 수단별 */}
        <Card title="결제 수단별 매출">
          <div className="space-y-4">
            {[
              { label: '카드', amount: d.card_revenue, pct: Math.round(d.card_revenue / d.total_revenue * 100) },
              { label: '현금', amount: d.cash_revenue, pct: Math.round(d.cash_revenue / d.total_revenue * 100) },
              { label: '계좌이체', amount: d.transfer_revenue, pct: Math.round(d.transfer_revenue / d.total_revenue * 100) },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#37352F]">{item.label}</span>
                  <span className="text-sm font-medium tabular-nums text-[#37352F]">{item.amount.toLocaleString()}원</span>
                </div>
                <div className="h-2 bg-[#F7F7F5] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#787774]" style={{ width: `${item.pct}%` }} />
                </div>
                <p className="text-xs text-[#787774] mt-0.5">{item.pct}%</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#E9E9E7] bg-[#EDF7F5] rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-[#0F7B6C]">✓ PG·카드·현금 통합 집계</p>
            <p className="text-xs text-[#787774]">PG 사이트 별도 접속 불필요</p>
          </div>
        </Card>
      </div>

      {/* 결제 완료율 시각화 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#37352F]">원생별 결제 현황</h3>
          <Button size="sm" onClick={() => setShowMsgModal(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            미납자 {d.unpaid_students}명 결제 문자 발송
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-8 bg-[#F7F7F5] rounded-full overflow-hidden flex">
            <div className="h-full bg-[#0F7B6C] flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${paymentRate}%` }}>
              완납 {d.paid_students}명
            </div>
            <div className="h-full bg-[#EB5757] flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${100 - paymentRate}%` }}>
              미납 {d.unpaid_students}명
            </div>
          </div>
          <span className="text-lg font-bold text-[#37352F] tabular-nums w-14 text-right">{paymentRate}%</span>
        </div>

        {/* 미납자 목록 */}
        <div className="border border-[#E9E9E7] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-[#FDECEA] border-b border-[#E9E9E7] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#EB5757]">미납 원생 {unpaid.length}명</span>
          </div>
          <div className="divide-y divide-[#E9E9E7]">
            {unpaid.slice(0, 8).map(s => {
              const cls = classes.find(c => c.id === s.class_id);
              const total = cls ? cls.tuition_fee + cls.material_fee + cls.content_fee : 0;
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <span className="text-sm font-medium text-[#37352F]">{s.name}</span>
                    <span className="text-xs text-[#787774] ml-2">{cls?.schedule}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-[#EB5757] font-medium">{total.toLocaleString()}원</span>
                    <Badge variant="unpaid">미납</Badge>
                  </div>
                </div>
              );
            })}
            {unpaid.length > 8 && (
              <div className="px-4 py-2 text-center text-xs text-[#787774]">+ {unpaid.length - 8}명 더 보기</div>
            )}
          </div>
        </div>
      </Card>

      {/* 오늘 출결 요약 */}
      <div className="grid grid-cols-3 gap-5">
        <Card className="text-center !p-0">
          <div className="px-6 py-4">
            <p className="text-xs text-[#787774] mb-1">오늘 출석</p>
            <p className="text-2xl font-bold text-[#0F7B6C] tabular-nums">{d.today_attend}명</p>
          </div>
        </Card>
        <Card className="text-center !p-0">
          <div className="px-6 py-4">
            <p className="text-xs text-[#787774] mb-1">미도착</p>
            <p className="text-2xl font-bold text-[#787774] tabular-nums">{d.today_pending}명</p>
          </div>
        </Card>
        <Card className="text-center !p-0">
          <div className="px-6 py-4">
            <p className="text-xs text-[#787774] mb-1">결석</p>
            <p className="text-2xl font-bold text-[#EB5757] tabular-nums">{d.today_absent}명</p>
          </div>
        </Card>
      </div>

      {/* 결제 문자 발송 모달 */}
      <Modal open={showMsgModal} onClose={() => setShowMsgModal(false)} title={`결제 문자 발송 — 미납 ${unpaid.length}명`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowMsgModal(false)}>취소</Button>
            <Button onClick={() => {
              setShowMsgModal(false);
              alert(`[발송 미리보기] 미납 ${unpaid.length}명에게 결제 URL 문자가 발송되었습니다.\n\n[D.LAB 강남] {원생명} 학부모님, 6월 수강료가 미납 상태입니다.\n결제 링크: https://pay.dlab.co.kr/gangnam`);
            }}>
              {unpaid.length}명에게 발송
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-[#FFF1EC] border border-[#FF6C37]/20 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-[#FF6C37]">발송 대상: 미납 {unpaid.length}명</p>
            <p className="text-xs text-[#787774] mt-1">각 학부모님께 개인화된 결제 링크가 포함된 문자가 발송됩니다.</p>
          </div>
          <div className="border border-[#E9E9E7] rounded-lg p-4 bg-[#F7F7F5]">
            <p className="text-xs font-semibold text-[#787774] mb-2">메시지 미리보기</p>
            <p className="text-sm text-[#37352F] whitespace-pre-line">{`[D.LAB 강남] 김민준 학부모님,\n6월 수강료가 미납 상태입니다.\n결제: https://pay.dlab.co.kr/gangnam\n\n문의: 02-000-0000`}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
