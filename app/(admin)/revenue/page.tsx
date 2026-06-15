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

function DeltaPct({ diff, base }: { diff: number; base: number }) {
  const pct = Math.abs((diff / base) * 100).toFixed(1);
  const up = diff > 0;
  return (
    <span className={`text-sm tabular-nums ${up ? 'text-[#0F7B6C]' : 'text-[#EB5757]'}`}>
      {up ? '▲' : '▼'} {pct}% 전월 대비
    </span>
  );
}

interface DonutSlice {
  label: string;
  amount: number;
  color: string;
  badge?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, R: number, r: number, start: number, end: number) {
  const large = end - start > 180 ? 1 : 0;
  const s1 = polarToCartesian(cx, cy, R, start);
  const e1 = polarToCartesian(cx, cy, R, end);
  const s2 = polarToCartesian(cx, cy, r, end);
  const e2 = polarToCartesian(cx, cy, r, start);
  return `M ${s1.x} ${s1.y} A ${R} ${R} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r} ${r} 0 ${large} 0 ${e2.x} ${e2.y} Z`;
}

function DonutChart({ slices, size = 140 }: { slices: DonutSlice[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 6;
  const r = R * 0.58;
  const total = slices.reduce((s, i) => s + i.amount, 0);

  let angle = 0;
  const paths = slices.map(slice => {
    const sweep = (slice.amount / total) * 360;
    const path = slicePath(cx, cy, R, r, angle, angle + sweep - 0.5);
    angle += sweep;
    return { ...slice, path };
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        {paths.map(p => (
          <path key={p.label} d={p.path} fill={p.color} />
        ))}
      </svg>
      <div className="space-y-2.5 min-w-0">
        {slices.map(slice => {
          const pct = Math.round((slice.amount / total) * 100);
          return (
            <div key={slice.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-sm text-[#37352F] truncate flex items-center gap-1.5">
                {slice.label}
                {slice.badge && (
                  <span className="text-[10px] font-semibold text-[#FF6C37] bg-[#FFF1EC] px-1.5 py-0.5 rounded">
                    {slice.badge}
                  </span>
                )}
              </span>
              <span className="ml-auto text-sm font-medium tabular-nums text-[#37352F] pl-2 shrink-0">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [showMsgModal, setShowMsgModal] = useState(false);
  const unpaid = getUnpaidStudents();
  const d = dashboardData;

  const paymentRate = Math.round((d.paid_students / d.total_students) * 100);
  const collectedTotal = d.card_revenue + d.cash_revenue + d.transfer_revenue;
  const unpaidTotal = unpaid.reduce((sum, s) => {
    const cls = classes.find(c => c.id === s.class_id);
    return sum + (cls ? cls.tuition_fee + cls.material_fee + cls.content_fee : 0);
  }, 0);

  const revenueSlices: DonutSlice[] = [
    { label: '교육비',        amount: d.tuition_revenue,  color: '#FF6C37' },
    { label: '교구 대여비',   amount: d.material_revenue, color: '#FF9570' },
    { label: '콘텐츠 사용비', amount: d.content_revenue,  color: '#FFBDA4' },
  ];

  const paymentSlices: DonutSlice[] = [
    { label: '카드',     amount: d.card_revenue,     color: '#37352F' },
    { label: '현금',     amount: d.cash_revenue,     color: '#787774' },
    { label: '계좌이체', amount: d.transfer_revenue, color: '#C7C7C5' },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">매출현황</h1>
          <p className="text-sm text-[#787774] mt-0.5">판교 캠퍼스 · 2026년 6월</p>
        </div>
        <Select
          options={[
            { value: '2026-06', label: '2026년 6월' },
            { value: '2026-05', label: '2026년 5월' },
          ]}
          className="w-40"
        />
      </div>

      {/* ── 1. KPI 카드 행 ── */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card>
          <p className="text-xs font-medium text-[#787774] uppercase tracking-wide mb-2">이번 달 총매출</p>
          <p className="text-3xl font-bold text-[#37352F] tabular-nums leading-none mb-1.5">
            {formatMoney(d.total_revenue)}
          </p>
          <DeltaPct diff={d.revenue_diff} base={d.prev_month_revenue} />
        </Card>

        <Card>
          <p className="text-xs font-medium text-[#787774] uppercase tracking-wide mb-2">수납 완료 금액</p>
          <p className="text-3xl font-bold text-[#37352F] tabular-nums leading-none mb-1.5">
            {formatMoney(collectedTotal)}
          </p>
          <span className="text-sm text-[#787774]">{d.paid_students}명 완납</span>
        </Card>

        <Card>
          <p className="text-xs font-medium text-[#787774] uppercase tracking-wide mb-2">미납 금액</p>
          <p className="text-3xl font-bold text-[#37352F] tabular-nums leading-none mb-1.5">
            {formatMoney(unpaidTotal)}
          </p>
          <span className="text-sm text-[#787774]">{d.unpaid_students}명 미납</span>
        </Card>
      </div>

      {/* ── 2. 매출 항목 + 결제 수단별 매출 ── */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* 매출 항목 */}
        <Card title="매출 항목">
          <DonutChart slices={revenueSlices} size={148} />
          <div className="mt-4 pt-3 border-t border-[#E9E9E7] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#37352F]">총매출</span>
            <span className="text-sm font-bold tabular-nums text-[#FF6C37]">
              {d.total_revenue.toLocaleString()}원
            </span>
          </div>
        </Card>

        {/* 결제 수단별 매출 */}
        <Card title="결제 수단별 매출">
          <DonutChart slices={paymentSlices} size={148} />
        </Card>
      </div>

      {/* ── 3. 원생 수납 완료율 ── */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#37352F]">원생 수납 완료율</h3>
        </div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-4xl font-bold text-[#37352F] tabular-nums leading-none">
            {paymentRate}%
          </span>
          <span className="text-sm text-[#787774]">
            {d.paid_students}명 완납 / {d.total_students}명
          </span>
        </div>
        <div className="h-2.5 bg-[#F7F7F5] rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-[#FF6C37] rounded-full transition-all"
            style={{ width: `${paymentRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#E9E9E7]">
          <div>
            <p className="text-sm font-medium text-[#37352F]">미납 {d.unpaid_students}명</p>
            <p className="text-xs text-[#787774] mt-0.5">결제 독촉 문자 발송 가능</p>
          </div>
          <Button size="sm" onClick={() => setShowMsgModal(true)}>
            문자 발송
          </Button>
        </div>
      </Card>

      {/* ── 4. 미납 원생 목록 ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#37352F]">미납 원생 목록</h3>
          <span className="text-sm text-[#787774]">{unpaid.length}명</span>
        </div>
        <div className="border border-[#E9E9E7] rounded-lg overflow-hidden">
          <div className="divide-y divide-[#E9E9E7]">
            {unpaid.slice(0, 8).map(s => {
              const cls = classes.find(c => c.id === s.class_id);
              const total = cls ? cls.tuition_fee + cls.material_fee + cls.content_fee : 0;
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F7F7F5] transition-colors">
                  <div>
                    <span className="text-sm font-medium text-[#37352F]">{s.name}</span>
                    <span className="text-xs text-[#787774] ml-2">{cls?.schedule}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-[#37352F] font-medium">
                      {total.toLocaleString()}원
                    </span>
                    <Badge variant="unpaid">미납</Badge>
                  </div>
                </div>
              );
            })}
            {unpaid.length > 8 && (
              <div className="px-4 py-2.5 text-center text-xs text-[#787774]">
                + {unpaid.length - 8}명 더 보기
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 결제 문자 발송 모달 */}
      <Modal
        open={showMsgModal}
        onClose={() => setShowMsgModal(false)}
        title={`결제 문자 발송 — 미납 ${unpaid.length}명`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowMsgModal(false)}>취소</Button>
            <Button onClick={() => {
              setShowMsgModal(false);
              alert(`[발송 미리보기] 미납 ${unpaid.length}명에게 결제 URL 문자가 발송되었습니다.\n\n[D.LAB 판교] {원생명} 학부모님, 6월 수강료가 미납 상태입니다.\n결제 링크: https://pay.dlab.co.kr/pangyo`);
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
            <p className="text-sm text-[#37352F] whitespace-pre-line">{`[D.LAB 판교] 김민준 학부모님,\n6월 수강료가 미납 상태입니다.\n결제: https://pay.dlab.co.kr/pangyo\n\n문의: 02-000-0000`}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
