'use client';

import { useState, useMemo } from 'react';
import { students, classes, invoices, payments, Student } from '@/lib/mock-data';
import {
  buildRows, filterRows, computeSummary, isUnpaidMode,
  fmt, classTotal, StatusFilter,
} from '@/lib/payments';
import { StatusCards } from '@/components/payments/StatusCards';
import { PaymentList } from '@/components/payments/PaymentList';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';

const TODAY = '2026-06-16';

export default function PaymentsPage() {
  const [monthFilter, setMonthFilter] = useState('2026-06');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [searchName, setSearchName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState('전체');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const allRows = useMemo(
    () => buildRows(monthFilter, TODAY, { invoices, students, classes, payments }),
    [monthFilter],
  );
  const summary = useMemo(() => computeSummary(allRows), [allRows]);
  const rows = useMemo(
    () => filterRows(allRows, { status: statusFilter, search: searchName }),
    [allRows, statusFilter, searchName],
  );
  const unpaidMode = isUnpaidMode(statusFilter);

  const studentInvoices = useMemo(
    () => (selectedStudent ? invoices.filter(inv => inv.student_id === selectedStudent.id) : []),
    [selectedStudent],
  );
  const studentPayments = useMemo(
    () => (selectedStudent ? payments.filter(p => p.student_id === selectedStudent.id) : []),
    [selectedStudent],
  );
  const cls = selectedStudent ? classes.find(c => c.id === selectedStudent.class_id) : null;
  const totalAmount = cls ? classTotal(cls) : 0;

  const tabs = ['전체', '미납자료', '수강료', '교재', '기타'];

  function toggleId(id: string) {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function selectStatus(s: StatusFilter) {
    setStatusFilter(s);
    setSelectedIds(new Set());
  }
  function handlePay() {
    setPaySuccess(true);
    setTimeout(() => { setPaySuccess(false); setShowPayModal(false); }, 1200);
  }

  const selectedCount = selectedIds.size;
  const siblingNames = selectedStudent?.sibling_ids
    ?.map(id => students.find(s => s.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">수납 관리</h1>
        <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 조건별 수납 조회 · 미납/예정 관리</p>
      </div>

      <StatusCards summary={summary} selected={statusFilter} onSelect={selectStatus} />

      {/* 도구줄 */}
      <div className="flex gap-3 mb-4 items-center">
        <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-40" />
        <Input placeholder="원생·반 검색" value={searchName} onChange={e => setSearchName(e.target.value)} className="w-48" />
        <span className="ml-auto text-sm text-[#787774]">{rows.length}건</span>
        {unpaidMode ? (
          <>
            <Button size="sm" disabled={selectedCount === 0}
              onClick={() => alert(`[발송 미리보기] 선택 ${selectedCount}명에게 결제 안내 문자를 발송합니다.`)}>
              일괄 문자{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>
            <Button size="sm" variant="secondary" disabled={selectedCount === 0}
              onClick={() => alert(`[인쇄 미리보기] 선택 ${selectedCount}명 교육회비통지서를 인쇄합니다.`)}>
              통지서 인쇄
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary"
            onClick={() => alert('[엑셀 미리보기] 현재 목록을 엑셀로 저장합니다.')}>
            엑셀 저장
          </Button>
        )}
      </div>

      {selectedStudent ? (
        /* ── 마스터-디테일 모드 ── */
        <div className="flex gap-5">
          {/* 좌측: 축소 목록 */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden divide-y divide-[#E9E9E7] max-h-[640px] overflow-y-auto">
              {rows.map(r => (
                <button key={r.inv.id} onClick={() => setSelectedStudent(r.student)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-[#F7F7F5] ${selectedStudent.id === r.student.id ? 'bg-[#FFF1EC]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#37352F]">{r.student.name}</span>
                    <Badge variant={r.status === '완납' ? 'paid' : r.status === '예정' ? 'warn' : r.status === '환불' ? 'primary' : 'unpaid'}>{r.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-[#787774]">{r.student.grade}</span>
                    <span className="text-xs text-[#787774] tabular-nums">{fmt(r.amount)}</span>
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
            <button onClick={() => setSelectedStudent(null)}
              className="text-sm text-[#787774] hover:text-[#37352F] transition-colors">
              ← 전체 현황으로
            </button>

            {/* 원생 요약 카드 */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#37352F]">{selectedStudent.name}</h2>
                  <p className="text-sm text-[#787774]">{selectedStudent.grade} · {cls?.schedule} · {cls?.course}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#787774]">
                    {selectedStudent.school && <span>학교 {selectedStudent.school}</span>}
                    <span>모 {selectedStudent.parent_phone}</span>
                    {selectedStudent.father_phone && <span>부 {selectedStudent.father_phone}</span>}
                    {selectedStudent.virtual_account && <span>가상계좌 {selectedStudent.virtual_account}</span>}
                    {selectedStudent.scholarship_type && <span>🎓 {selectedStudent.scholarship_type}</span>}
                    {siblingNames && <span>👧 형제 {siblingNames}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShowMsgModal(true)}>결제 문자</Button>
                  <Button size="sm" variant="secondary"
                    onClick={() => alert(`[인쇄 미리보기] ${selectedStudent.name} 납입증명서를 인쇄합니다.`)}>
                    납입증명서 인쇄
                  </Button>
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
                  <Badge variant={studentInvoices[0]?.status === '완납' ? 'paid' : studentInvoices[0]?.status === '환불' ? 'primary' : 'unpaid'} className="text-sm mt-1">
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
                    {
                      key: 'paid_at',
                      header: '수납일자',
                      render: r => <span className="tabular-nums text-xs">{String(r.paid_at).slice(0, 10)}</span>,
                    },
                    {
                      key: 'invoice_id',
                      header: '수납내용',
                      render: r => {
                        const inv = invoices.find(i => i.id === String(r.invoice_id));
                        const cl = inv ? classes.find(c => c.id === inv.class_id) : null;
                        return <span className="text-xs text-[#37352F]">{cl ? cl.name : '-'}</span>;
                      },
                    },
                    {
                      key: 'status',
                      header: '상태',
                      render: r => {
                        const inv = invoices.find(i => i.id === String(r.invoice_id));
                        return (
                          <Badge variant={inv?.status === '완납' ? 'paid' : inv?.status === '환불' ? 'primary' : 'unpaid'}>
                            {inv?.status ?? '-'}
                          </Badge>
                        );
                      },
                    },
                    { key: 'method', header: '수납방법' },
                    {
                      key: 'card_type',
                      header: '카드종류',
                      render: r => {
                        const detail = r.card_detail ? ` (${r.card_detail})` : '';
                        return <span className="text-xs text-[#787774]">{String(r.card_type) || '-'}{detail}</span>;
                      },
                    },
                    {
                      key: 'amount',
                      header: '수납금액',
                      render: r => <span className="tabular-nums font-medium">{Number(r.amount).toLocaleString()}원</span>,
                    },
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
        /* ── 현황 모드: 이중 목록 ── */
        <PaymentList
          rows={rows}
          mode={unpaidMode ? 'unpaid' : 'paid'}
          selectedIds={selectedIds}
          onToggle={toggleId}
          onRowClick={r => setSelectedStudent(r.student)}
        />
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="수강년월" type="month" defaultValue={monthFilter} />
            <Input label="수납일자" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="bg-[#F7F7F5] rounded-lg px-3 py-2 text-sm text-[#37352F]">
            <span className="text-xs text-[#787774] mr-2">수강기간</span>
            {cls ? `${cls.start_date} ~ ${cls.end_date}` : '-'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="수납구분" options={[
              { value: '완납', label: '완납' },
              { value: '분납', label: '분납' },
            ]} />
            <Select label="수납방법" options={[
              { value: '카드', label: '카드' },
              { value: '현금', label: '현금' },
              { value: '계좌이체', label: '계좌이체' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="대상금액" type="number" defaultValue={String(totalAmount)} suffix="원" />
            <Input label="할인금액" type="number" defaultValue="0" suffix="원" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FFF8F5] border border-[#FFD4C2] rounded-lg px-3 py-2">
              <p className="text-xs text-[#787774] mb-0.5">수납대상금액</p>
              <p className="text-sm font-bold text-[#FF6C37] tabular-nums">{fmt(totalAmount)}</p>
            </div>
            <div className="bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg px-3 py-2">
              <p className="text-xs text-[#787774] mb-0.5">누적수납</p>
              <p className="text-sm font-bold text-[#37352F] tabular-nums">
                {fmt(studentPayments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="카드수납" type="number" defaultValue={String(totalAmount)} suffix="원" />
            <Input label="현금수납" type="number" defaultValue="0" suffix="원" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="카드사" options={['국민', '신한', '삼성', '현대', '하나', '우리'].map(s => ({ value: s, label: s + '카드' }))} />
            <Select label="카드종류" options={[
              { value: '일반', label: '일반' },
              { value: '체크', label: '체크' },
              { value: '기업', label: '기업' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="취소번호" placeholder="승인취소 시 입력" />
            <Input label="결제단말기" placeholder="단말기 ID" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#37352F] mb-1.5">현금영수증</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-[#37352F] cursor-pointer">
                <input type="radio" name="cash_receipt" value="발행" defaultChecked className="accent-[#FF6C37]" />
                발행
              </label>
              <label className="flex items-center gap-1.5 text-sm text-[#37352F] cursor-pointer">
                <input type="radio" name="cash_receipt" value="미발행" className="accent-[#FF6C37]" />
                미발행
              </label>
            </div>
          </div>
          <Input label="특이사항" placeholder="메모 입력" />
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
