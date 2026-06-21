'use client';

import { useState, useMemo } from 'react';
import { students, classes, classGroups, invoices, payments, Student } from '@/lib/mock-data';
import {
  buildRows, filterRows, computeSummary, rowsForTab, tabSummary,
  fmt, classTotal, TabKey,
} from '@/lib/payments';
import { PaymentList } from '@/components/payments/PaymentList';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, MoneyInput } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { useQuickActions } from '@/components/panels/QuickActionsContext';

const TODAY = '2026-06-16';

const TAB_DEFS: { key: TabKey; label: string }[] = [
  { key: '미납', label: '미납 현황' },
  { key: '완납', label: '완납 현황' },
  { key: '예정', label: '납부 예정' },
];

export default function PaymentsPage() {
  const [monthFilter, setMonthFilter] = useState('2026-06');
  const [tabKey, setTabKey] = useState<TabKey>('미납');
  const [studentName, setStudentName] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState('전체');
  const [showPayModal, setShowPayModal] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const { openSms } = useQuickActions();

  const allRows = useMemo(
    () => buildRows(monthFilter, TODAY, { invoices, students, classes, payments }),
    [monthFilter],
  );
  const summary = useMemo(() => computeSummary(allRows), [allRows]);
  const tabCounts: Record<TabKey, number> = {
    미납: summary.counts.미납,
    완납: summary.counts.완납 + summary.counts.환불,
    예정: summary.counts.예정,
  };

  const groupOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts = [{ value: '', label: '전체 그룹' }];
    for (const r of allRows) {
      const cg = classGroups.find(g => g.id === r.cls.class_group_id);
      if (cg) {
        const key = `${cg.year}년 ${cg.season}`;
        if (!seen.has(key)) { seen.add(key); opts.push({ value: key, label: key }); }
      }
    }
    return opts;
  }, [allRows]);

  const classOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts = [{ value: '', label: '전체 반' }];
    for (const r of allRows) {
      if (!seen.has(r.cls.name)) { seen.add(r.cls.name); opts.push({ value: r.cls.name, label: r.cls.name }); }
    }
    return opts;
  }, [allRows]);

  const filtered = useMemo(
    () => filterRows(allRows, {
      studentName,
      className: classFilter,
      groupName: groupFilter,
      paymentMethod: tabKey === '완납' ? methodFilter : '',
      dateFrom: tabKey === '완납' ? dateFrom : '',
      dateTo: tabKey === '완납' ? dateTo : '',
    }, classGroups),
    [allRows, studentName, classFilter, groupFilter, methodFilter, dateFrom, dateTo, tabKey],
  );
  const rows = useMemo(() => rowsForTab(filtered, tabKey), [filtered, tabKey]);
  const sum = useMemo(() => tabSummary(rows), [rows]);

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
  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(rows.map(r => r.student.id)) : new Set());
  }
  function handlePay() {
    setPaySuccess(true);
    setTimeout(() => { setPaySuccess(false); setShowPayModal(false); }, 1200);
  }
  function sendSms(targets: Student[]) {
    if (targets.length === 0) return;
    openSms({
      recipients: targets.map(s => ({ studentId: s.id, name: s.name, phone: s.parent_phone })),
      template: 'unpaid',
    });
  }

  const selectedCount = selectedIds.size;
  const siblingNames = selectedStudent?.sibling_ids
    ?.map(id => students.find(s => s.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1A1D29]">수납 관리</h1>
      </div>

      {/* 탭바 */}
      <div className="flex gap-1 border-b border-[#E8EBF1] mb-4">
        {TAB_DEFS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTabKey(t.key); setSelectedIds(new Set()); setSelectedStudent(null); }}
            className={`px-4 py-2.5 text-sm -mb-px border-b-2 transition-colors ${tabKey === t.key ? 'border-[#2F6BFF] text-[#2F6BFF] font-semibold' : 'border-transparent text-[#6B7280] hover:text-[#1A1D29]'}`}
          >
            {t.label} <span className="tabular-nums">({tabCounts[t.key]})</span>
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="bg-white border border-[#E8EBF1] rounded-lg p-3 mb-4 space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-36" />
          <Input placeholder="학생 이름" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-36" />
          <Select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} options={groupOptions} className="w-36" />
          <Select value={classFilter} onChange={e => setClassFilter(e.target.value)} options={classOptions} className="w-56" />
          {tabKey === '완납' && (
            <Select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              options={[
                { value: '', label: '전체 결제수단' },
                { value: '카드', label: '카드' },
                { value: '현금', label: '현금' },
                { value: '계좌이체', label: '계좌이체' },
                { value: 'PG', label: 'PG' },
              ]}
              className="w-36"
            />
          )}
        </div>
        {tabKey === '완납' && (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-[#6B7280] shrink-0">수납일</span>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
            <span className="text-xs text-[#6B7280]">~</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
          </div>
        )}
      </div>

      {/* 요약줄 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm text-[#6B7280]">
          <span className="font-semibold text-[#1A1D29] tabular-nums">{sum.count}건</span>
          {tabKey === '미납' && <> · 미납 합계 <span className="font-semibold text-[#F2474B] tabular-nums">{fmt(sum.total)}</span></>}
          {tabKey === '완납' && (
            <> · 수납 합계 <span className="font-semibold text-[#28C76F] tabular-nums">{fmt(sum.total)}</span>
              {sum.refund < 0 && <span className="text-[#2F6BFF] tabular-nums"> (환불 {fmt(sum.refund)} 포함)</span>}
            </>
          )}
          {tabKey === '예정' && <> · 예정 합계 <span className="font-semibold text-[#1A1D29] tabular-nums">{fmt(sum.total)}</span></>}
        </p>
        {tabKey === '미납' && (
          <Button size="sm" disabled={selectedCount === 0}
            onClick={() => sendSms(rows.filter(r => selectedIds.has(r.student.id)).map(r => r.student))}>
            일괄 문자{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Button>
        )}
      </div>

      {selectedStudent ? (
        /* ── 마스터-디테일 모드 ── */
        <div className="flex gap-5">
          {/* 좌측: 축소 목록 */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white border border-[#E8EBF1] rounded-lg overflow-hidden divide-y divide-[#E8EBF1] max-h-[640px] overflow-y-auto">
              {rows.map(r => (
                <button key={r.inv.id} onClick={() => setSelectedStudent(r.student)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-[#F4F6FA] ${selectedStudent.id === r.student.id ? 'bg-[#EAF1FF]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1A1D29]">{r.student.name}</span>
                    <Badge variant={r.status === '완납' ? 'paid' : r.status === '예정' ? 'warn' : r.status === '환불' ? 'primary' : 'unpaid'}>{r.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-[#6B7280]">{r.student.grade}</span>
                    <span className="text-xs text-[#6B7280] tabular-nums">{fmt(r.amount)}</span>
                  </div>
                </button>
              ))}
              {rows.length === 0 && (
                <p className="text-sm text-[#6B7280] py-8 text-center">조건에 맞는 원생이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 우측: 디테일 */}
          <div className="flex-1 space-y-4">
            <button onClick={() => setSelectedStudent(null)}
              className="text-sm text-[#6B7280] hover:text-[#1A1D29] transition-colors">
              ← 전체 현황으로
            </button>

            {/* 원생 요약 카드 */}
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#1A1D29]">{selectedStudent.name}</h2>
                  <p className="text-sm text-[#6B7280]">{selectedStudent.grade} · {cls?.schedule} · {cls?.course}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#6B7280]">
                    {selectedStudent.school && <span>학교 {selectedStudent.school}</span>}
                    <span>모 {selectedStudent.parent_phone}</span>
                    {selectedStudent.father_phone && <span>부 {selectedStudent.father_phone}</span>}
                    {selectedStudent.virtual_account && <span>가상계좌 {selectedStudent.virtual_account}</span>}
                    {selectedStudent.scholarship_type && <span>🎓 {selectedStudent.scholarship_type}</span>}
                    {siblingNames && <span>👧 형제 {siblingNames}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => sendSms([selectedStudent])}>결제 문자</Button>
                  <Button size="sm" variant="secondary"
                    onClick={() => alert(`[인쇄 미리보기] ${selectedStudent.name} 납입증명서를 인쇄합니다.`)}>
                    납입증명서 인쇄
                  </Button>
                  <Button size="sm" onClick={() => setShowPayModal(true)}>수납 입력</Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-[#F4F6FA] rounded-lg p-3 text-center">
                  <p className="text-xs text-[#6B7280]">이번달 청구액</p>
                  <p className="text-lg font-bold text-[#1A1D29] tabular-nums">{fmt(totalAmount)}</p>
                </div>
                <div className="bg-[#F4F6FA] rounded-lg p-3 text-center">
                  <p className="text-xs text-[#6B7280]">납입 기준일</p>
                  <p className="text-lg font-bold text-[#1A1D29]">매월 {cls?.payment_due_day}일</p>
                </div>
                <div className="bg-[#F4F6FA] rounded-lg p-3 text-center">
                  <p className="text-xs text-[#6B7280]">납입 상태</p>
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
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#E8EBF1] last:border-0">
                    <span className="text-sm text-[#1A1D29]">{item.label}</span>
                    <span className="text-sm font-medium tabular-nums">{fmt(item.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-[#1A1D29]">합계</span>
                  <span className="text-base font-bold text-[#2F6BFF] tabular-nums">{fmt(totalAmount)}</span>
                </div>
              </div>
            </Card>

            {/* 수납 이력 탭 */}
            <Card>
              <div className="flex gap-1 mb-4 -mt-2">
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium' : 'text-[#6B7280] hover:bg-[#F4F6FA]'}`}>
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
                        return <span className="text-xs text-[#1A1D29]">{cl ? cl.name : '-'}</span>;
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
                        return <span className="text-xs text-[#6B7280]">{String(r.card_type) || '-'}{detail}</span>;
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
                <p className="text-sm text-[#6B7280] py-4 text-center">수납 이력이 없습니다.</p>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* ── 현황 모드: 탭별 목록 ── */
        <PaymentList
          rows={rows}
          tab={tabKey}
          today={TODAY}
          selectedIds={selectedIds}
          onToggle={toggleId}
          onToggleAll={toggleAll}
          onRowClick={r => setSelectedStudent(r.student)}
          onSendMessage={r => sendSms([r.student])}
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
            <Input label="수납일자" type="date" defaultValue={TODAY} />
          </div>
          <div className="bg-[#F4F6FA] rounded-lg px-3 py-2 text-sm text-[#1A1D29]">
            <span className="text-xs text-[#6B7280] mr-2">수강기간</span>
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
            <MoneyInput label="대상금액" defaultValue={totalAmount} suffix="원" />
            <MoneyInput label="할인금액" defaultValue={0} suffix="원" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#EAF1FF] border border-[#C9DBFF] rounded-lg px-3 py-2">
              <p className="text-xs text-[#6B7280] mb-0.5">수납대상금액</p>
              <p className="text-sm font-bold text-[#2F6BFF] tabular-nums">{fmt(totalAmount)}</p>
            </div>
            <div className="bg-[#F4F6FA] border border-[#E8EBF1] rounded-lg px-3 py-2">
              <p className="text-xs text-[#6B7280] mb-0.5">누적수납</p>
              <p className="text-sm font-bold text-[#1A1D29] tabular-nums">
                {fmt(studentPayments.reduce((s, p) => s + p.amount, 0))}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label="카드수납" defaultValue={totalAmount} suffix="원" />
            <MoneyInput label="현금수납" defaultValue={0} suffix="원" />
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
            <p className="text-xs font-medium text-[#1A1D29] mb-1.5">현금영수증</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-[#1A1D29] cursor-pointer">
                <input type="radio" name="cash_receipt" value="발행" defaultChecked className="accent-[#2F6BFF] w-4 h-4" />
                발행
              </label>
              <label className="flex items-center gap-1.5 text-sm text-[#1A1D29] cursor-pointer">
                <input type="radio" name="cash_receipt" value="미발행" className="accent-[#2F6BFF] w-4 h-4" />
                미발행
              </label>
            </div>
          </div>
          <Input label="특이사항" placeholder="메모 입력" />
          {paySuccess && (
            <div className="bg-[#E6F9EF] border border-[#28C76F]/20 rounded-lg px-4 py-3 text-sm font-semibold text-[#28C76F]">
              ✓ 수납 처리 완료. 청구서 상태가 완납으로 변경됩니다.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
