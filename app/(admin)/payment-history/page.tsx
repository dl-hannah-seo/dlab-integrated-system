'use client';

import { useState, useMemo } from 'react';
import { invoices, payments, students, classes } from '@/lib/mock-data';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원'; }

export default function PaymentHistoryPage() {
  const [monthFilter, setMonthFilter] = useState('2026-06');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [methodFilter, setMethodFilter] = useState('전체');

  const rows = useMemo(() => {
    return invoices
      .filter(inv => {
        if (inv.billing_month !== monthFilter) return false;
        if (statusFilter !== '전체' && inv.status !== statusFilter) return false;
        return true;
      })
      .map(inv => {
        const s = students.find(st => st.id === inv.student_id)!;
        const cls = classes.find(c => c.id === inv.class_id)!;
        const pay = payments.find(p => p.invoice_id === inv.id);
        return { inv, s, cls, pay };
      })
      .filter(row => {
        if (methodFilter === '전체') return true;
        return row.pay?.method === methodFilter;
      });
  }, [monthFilter, statusFilter, methodFilter]);

  const totalPaid   = rows.filter(r => r.inv.status === '완납').reduce((acc, r) => acc + r.pay!.amount, 0);
  const totalUnpaid = rows.filter(r => r.inv.status === '미납').reduce((acc, r) => {
    const cls = r.cls;
    return acc + (cls.tuition_fee + cls.material_fee + cls.content_fee);
  }, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">수납 내역</h1>
        <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 월별 청구·수납 이력</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card className="!p-0">
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-[#787774] mb-1">총 수납액 ({rows.filter(r=>r.inv.status==='완납').length}건)</p>
            <p className="text-2xl font-bold text-[#0F7B6C] tabular-nums">{fmt(totalPaid)}</p>
          </div>
        </Card>
        <Card className="!p-0">
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-[#787774] mb-1">미납 합계 ({rows.filter(r=>r.inv.status==='미납').length}건)</p>
            <p className="text-2xl font-bold text-[#EB5757] tabular-nums">{fmt(totalUnpaid)}</p>
          </div>
        </Card>
        <Card className="!p-0">
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-[#787774] mb-1">전체 원생</p>
            <p className="text-2xl font-bold text-[#37352F] tabular-nums">{rows.length}명</p>
          </div>
        </Card>
      </div>

      {/* 필터 바 */}
      <div className="flex gap-3 mb-4">
        <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-40" />
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={['전체', '완납', '미납', '부분납'].map(v => ({ value: v, label: v }))}
          className="w-32"
        />
        <Select
          value={methodFilter}
          onChange={e => setMethodFilter(e.target.value)}
          options={['전체', '카드', '현금', '계좌이체'].map(v => ({ value: v, label: v }))}
          className="w-32"
        />
        <span className="ml-auto self-center text-sm text-[#787774]">{rows.length}건</span>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-0 border-b border-[#E9E9E7] bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#787774]">
          <span>원생</span>
          <span>반</span>
          <span>납입 상태</span>
          <span>결제 수단</span>
          <span className="text-right">금액</span>
          <span className="text-right">수납일</span>
        </div>
        <div className="divide-y divide-[#E9E9E7] max-h-[520px] overflow-y-auto">
          {rows.map(({ inv, s, cls, pay }) => (
            <div key={inv.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-0 px-4 py-3 text-sm items-center hover:bg-[#F7F7F5]">
              <div>
                <span className="font-medium text-[#37352F]">{s.name}</span>
                <span className="text-xs text-[#787774] ml-2">{s.grade}</span>
              </div>
              <span className="text-xs text-[#787774] truncate">{cls.schedule}</span>
              <span>
                <Badge variant={inv.status === '완납' ? 'paid' : 'unpaid'}>{inv.status}</Badge>
              </span>
              <span className="text-xs text-[#37352F]">{pay?.method ?? '-'}</span>
              <span className="text-right tabular-nums font-medium text-[#37352F]">
                {pay ? fmt(pay.amount) : fmt(cls.tuition_fee + cls.material_fee + cls.content_fee)}
              </span>
              <span className="text-right text-xs text-[#787774] tabular-nums">
                {pay ? pay.paid_at.slice(0, 10) : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
