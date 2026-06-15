'use client';

import { useState, useMemo } from 'react';
import { students, classes, invoices, payments, Student } from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원'; }
function classTotal(c: { tuition_fee: number; material_fee: number; content_fee: number }) {
  return c.tuition_fee + c.material_fee + c.content_fee;
}

export default function PaymentsPage() {
  // 현황 필터
  const [monthFilter, setMonthFilter] = useState('2026-06');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [methodFilter, setMethodFilter] = useState('전체');
  const [searchName, setSearchName] = useState('');
  // 마스터-디테일 선택
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  // 디테일 내부 상태
  const [activeTab, setActiveTab] = useState('전체');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // ── 월별 현황 행 (월·상태·수단·이름 AND 필터) ──
  const rows = useMemo(() => {
    return invoices
      .filter(inv => inv.billing_month === monthFilter)
      .map(inv => {
        const s = students.find(st => st.id === inv.student_id)!;
        const cls = classes.find(c => c.id === inv.class_id)!;
        const pay = payments.find(p => p.invoice_id === inv.id);
        return { inv, s, cls, pay };
      })
      .filter(row => {
        if (statusFilter !== '전체' && row.inv.status !== statusFilter) return false;
        if (methodFilter !== '전체' && row.pay?.method !== methodFilter) return false;
        if (searchName && !row.s.name.includes(searchName)) return false;
        return true;
      });
  }, [monthFilter, statusFilter, methodFilter, searchName]);

  const totalPaid   = rows.filter(r => r.inv.status === '완납').reduce((acc, r) => acc + (r.pay?.amount ?? 0), 0);
  const totalUnpaid = rows.filter(r => r.inv.status === '미납').reduce((acc, r) => acc + classTotal(r.cls), 0);
  const paidCount   = rows.filter(r => r.inv.status === '완납').length;
  const unpaidCount = rows.filter(r => r.inv.status === '미납').length;

  // ── 선택된 학생 디테일 ──
  const studentInvoices = useMemo(() =>
    selectedStudent ? invoices.filter(inv => inv.student_id === selectedStudent.id) : [],
    [selectedStudent]
  );
  const studentPayments = useMemo(() =>
    selectedStudent ? payments.filter(p => p.student_id === selectedStudent.id) : [],
    [selectedStudent]
  );
  const cls = selectedStudent ? classes.find(c => c.id === selectedStudent.class_id) : null;
  const totalAmount = cls ? classTotal(cls) : 0;

  const tabs = ['전체', '미납자료', '수강료', '교재', '기타'];

  function handlePay() {
    setPaySuccess(true);
    setTimeout(() => { setPaySuccess(false); setShowPayModal(false); }, 1200);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">수납 관리</h1>
        <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 월별 수납 현황 조회 및 창구 수납 처리</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card className="!p-0">
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-[#787774] mb-1">총 수납액 ({paidCount}건)</p>
            <p className="text-2xl font-bold text-[#0F7B6C] tabular-nums">{fmt(totalPaid)}</p>
          </div>
        </Card>
        <Card className="!p-0">
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-[#787774] mb-1">미납 합계 ({unpaidCount}건)</p>
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
        <Input
          placeholder="원생 이름 검색"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="w-48"
        />
        <span className="ml-auto self-center text-sm text-[#787774]">{rows.length}건</span>
      </div>

      {selectedStudent ? (
        /* ── 마스터-디테일 모드 ── */
        <div className="flex gap-5">
          {/* 좌측: 축소 목록 */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden divide-y divide-[#E9E9E7] max-h-[640px] overflow-y-auto">
              {rows.map(({ inv, s, cls: rowCls, pay }) => (
                <button key={inv.id} onClick={() => setSelectedStudent(s)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-[#F7F7F5] ${selectedStudent.id === s.id ? 'bg-[#FFF1EC]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#37352F]">{s.name}</span>
                    <Badge variant={inv.status === '완납' ? 'paid' : 'unpaid'}>{inv.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-[#787774]">{s.grade}</span>
                    <span className="text-xs text-[#787774] tabular-nums">{fmt(pay ? pay.amount : classTotal(rowCls))}</span>
                  </div>
                </button>
              ))}
              {rows.length === 0 && (
                <p className="text-sm text-[#787774] py-8 text-center">조건에 맞는 원생이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 우측: 디테일 */}
          <div className="flex-1 space-y-4">
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-sm text-[#787774] hover:text-[#37352F] transition-colors"
            >
              ← 전체 현황으로
            </button>

            {/* 원생 요약 카드 */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#37352F]">{selectedStudent.name}</h2>
                  <p className="text-sm text-[#787774]">{selectedStudent.grade} · {cls?.schedule} · {cls?.course}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShowMsgModal(true)}>결제 문자 발송</Button>
                  <Button size="sm" onClick={() => setShowPayModal(true)}>수납 입력</Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-[#F7F7F5] rounded-lg p-3 text-center">
                  <p className="text-xs text-[#787774]">이번달 청구액</p>
                  <p className="text-lg font-bold text-[#37352F] tabular-nums">{fmt(totalAmount)}</p>
                </div>
                <div className="bg-[#F7F7F5] rounded-lg p-3 text-center">
                  <p className="text-xs text-[#787774]">납입 기준일</p>
                  <p className="text-lg font-bold text-[#37352F]">매월 {cls?.payment_due_day}일</p>
                </div>
                <div className="bg-[#F7F7F5] rounded-lg p-3 text-center">
                  <p className="text-xs text-[#787774]">납입 상태</p>
                  <Badge variant={studentInvoices[0]?.status === '완납' ? 'paid' : 'unpaid'} className="text-sm mt-1">
                    {studentInvoices[0]?.status ?? '미생성'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* 청구 상세 */}
            <Card title={`청구 세부내역 (${monthFilter})`}>
              <div className="space-y-2">
                {cls && [
                  { label: '교육비 (비과세)', amount: cls.tuition_fee },
                  { label: '교구 대여비 (과세)', amount: cls.material_fee },
                  { label: '콘텐츠 사용비', amount: cls.content_fee },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#E9E9E7] last:border-0">
                    <span className="text-sm text-[#37352F]">{item.label}</span>
                    <span className="text-sm font-medium tabular-nums">{fmt(item.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-[#37352F]">합계</span>
                  <span className="text-base font-bold text-[#FF6C37] tabular-nums">{fmt(totalAmount)}</span>
                </div>
              </div>
            </Card>

            {/* 수납 이력 탭 */}
            <Card>
              <div className="flex gap-1 mb-4 -mt-2">
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-[#FFF1EC] text-[#FF6C37] font-medium' : 'text-[#787774] hover:bg-[#F7F7F5]'}`}>
                    {tab}
                  </button>
                ))}
              </div>
              {studentPayments.length > 0 ? (
                <Table
                  columns={[
                    { key: 'paid_at', header: '수납일', render: r => <span className="tabular-nums text-xs">{String(r.paid_at).slice(0,10)}</span> },
                    { key: 'method', header: '수납방법' },
                    { key: 'card_type', header: '카드종류', render: r => <span className="text-xs text-[#787774]">{String(r.card_type) || '-'}</span> },
                    { key: 'amount', header: '수납금액', render: r => <span className="tabular-nums font-medium">{Number(r.amount).toLocaleString()}원</span> },
                  ]}
                  data={studentPayments as unknown as Record<string, unknown>[]}
                />
              ) : (
                <p className="text-sm text-[#787774] py-4 text-center">수납 이력이 없습니다.</p>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* ── 현황 모드: 전체 폭 테이블 ── */
        <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-0 border-b border-[#E9E9E7] bg-[#F7F7F5] px-4 py-2.5 text-xs font-semibold text-[#787774]">
            <span>원생</span>
            <span>반</span>
            <span>납입 상태</span>
            <span>결제 수단</span>
            <span className="text-right">금액</span>
            <span className="text-right">수납일</span>
          </div>
          <div className="divide-y divide-[#E9E9E7] max-h-[560px] overflow-y-auto">
            {rows.map(({ inv, s, cls: rowCls, pay }) => (
              <button key={inv.id} onClick={() => setSelectedStudent(s)}
                className="w-full grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_1fr] gap-0 px-4 py-3 text-sm items-center text-left hover:bg-[#F7F7F5] transition-colors">
                <div>
                  <span className="font-medium text-[#37352F]">{s.name}</span>
                  <span className="text-xs text-[#787774] ml-2">{s.grade}</span>
                </div>
                <span className="text-xs text-[#787774] truncate">{rowCls.schedule}</span>
                <span>
                  <Badge variant={inv.status === '완납' ? 'paid' : 'unpaid'}>{inv.status}</Badge>
                </span>
                <span className="text-xs text-[#37352F]">{pay?.method ?? '-'}</span>
                <span className="text-right tabular-nums font-medium text-[#37352F]">
                  {fmt(pay ? pay.amount : classTotal(rowCls))}
                </span>
                <span className="text-right text-xs text-[#787774] tabular-nums">
                  {pay ? pay.paid_at.slice(0, 10) : '-'}
                </span>
              </button>
            ))}
            {rows.length === 0 && (
              <p className="text-sm text-[#787774] py-12 text-center">조건에 맞는 수납 내역이 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* 수납 입력 모달 */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title={`수납 입력 — ${selectedStudent?.name}`} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPayModal(false)}>취소</Button>
            <Button onClick={handlePay} loading={paySuccess}>{paySuccess ? '수납 완료!' : '수납 확정'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="수강년월" type="month" defaultValue={monthFilter} />
            <Select label="수납구분" options={[{value:'완납', label:'완납'}]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="대상금액" type="number" defaultValue={String(totalAmount)} suffix="원" />
            <Input label="할인금액" type="number" defaultValue="0" suffix="원" />
          </div>
          <Select label="수납방법" options={[
            {value:'카드', label:'카드'},
            {value:'현금', label:'현금'},
            {value:'계좌이체', label:'계좌이체'},
          ]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="카드 수납액" type="number" defaultValue={String(totalAmount)} suffix="원" />
            <Input label="현금 수납액" type="number" defaultValue="0" suffix="원" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="카드종류" options={['국민','신한','삼성','현대','하나','우리'].map(s=>({value:s,label:s+'카드'}))} />
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-[#37352F]">
                <input type="checkbox" className="accent-[#FF6C37]" /> 현금영수증 발행
              </label>
            </div>
          </div>
          {paySuccess && (
            <div className="bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-lg px-4 py-3 text-sm font-semibold text-[#0F7B6C]">
              ✓ 수납 처리 완료. 청구서 상태가 완납으로 변경됩니다.
            </div>
          )}
        </div>
      </Modal>

      {/* 결제 문자 모달 */}
      <Modal open={showMsgModal} onClose={() => setShowMsgModal(false)} title={`결제 URL 문자 발송 — ${selectedStudent?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowMsgModal(false)}>취소</Button>
            <Button onClick={() => { setShowMsgModal(false); alert(`[발송 미리보기] ${selectedStudent?.name} 학부모님께 결제 링크 문자가 발송되었습니다.`); }}>발송</Button>
          </>
        }
      >
        <div className="border border-[#E9E9E7] rounded-lg p-4 bg-[#F7F7F5] text-sm text-[#37352F] whitespace-pre-line">
          {`[D.LAB 판교] ${selectedStudent?.name} 학부모님,\n6월 수강료 미납 안내입니다.\n금액: ${fmt(totalAmount)}\n결제: https://pay.dlab.co.kr/pangyo\n\n문의: 02-000-0000`}
        </div>
      </Modal>
    </div>
  );
}
