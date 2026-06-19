'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { classes, logConsultation, TODAY, type Student } from '@/lib/mock-data';
import {
  unpaidInvoicesOf, outstandingAmount, overdueDays, guardianContactsOf,
} from '@/lib/payment-helpers';

function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}
function fmtMonth(m: string): string {
  const [y, mm] = m.split('-');
  return `${+y}년 ${+mm}월`;
}

export function StudentQuickPanel({
  student, onClose, onToast,
}: {
  student: Student;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const router = useRouter();
  const unpaid = unpaidInvoicesOf(student.id);
  const total = unpaid.reduce((sum, inv) => sum + outstandingAmount(inv), 0);
  const contacts = guardianContactsOf(student);
  const cls = classes.find(c => c.id === student.class_id);
  const hasUnpaid = unpaid.length > 0;

  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState('');

  function startCompose() {
    const months = unpaid.map(i => fmtMonth(i.billing_month)).join(', ');
    const due = unpaid[0]?.due_date ?? '';
    setMessage(
      `[디랩] ${student.name} 학생 학부모님, ${months} 수강료 ${fmtWon(total)}이 미납되었습니다. 납기일 ${due} 확인 부탁드립니다.`,
    );
    setComposing(true);
  }

  function send() {
    if (!message.trim()) return;
    logConsultation(student.id, message.trim(), TODAY);
    onToast(`${student.name} 학부모님께 미납 안내 문자를 보냈습니다. (상담이력 기록됨)`);
    onClose();
  }

  async function copyPhone(phone: string) {
    try { await navigator.clipboard?.writeText(phone); onToast('연락처를 복사했습니다.'); }
    catch { onToast('복사에 실패했습니다.'); }
  }

  function goDetail() {
    router.push(`/students?detail=${student.id}`);
  }

  const statusBadge = hasUnpaid
    ? <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#FBC4C6] text-[#D93539]">미납</span>
    : <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EAF1FF] text-[#1F57E6]">미납 없음</span>;

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`${student.name} · ${student.grade}`}
      footer={
        composing ? (
          <>
            <button onClick={() => setComposing(false)} className="px-3 py-1.5 text-sm text-[#6B7280] hover:text-[#1A1D29]">취소</button>
            <button onClick={send} className="px-3 py-1.5 text-sm rounded-md bg-[#2F6BFF] text-white hover:bg-[#1F57E6]">발송</button>
          </>
        ) : (
          <>
            {hasUnpaid && (
              <button onClick={startCompose} className="px-3 py-1.5 text-sm rounded-md border border-[#2F6BFF] text-[#2F6BFF] hover:bg-[#EAF1FF]">미납 문자 발송</button>
            )}
            <button onClick={goDetail} className="px-3 py-1.5 text-sm rounded-md bg-[#1A1D29] text-white hover:opacity-90">상세보기</button>
          </>
        )
      }
    >
      {composing ? (
        <div className="space-y-2">
          <p className="text-xs text-[#6B7280]">미납 안내 문자 (편집 가능)</p>
          <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} />
          <p className="text-[11px] text-[#9CA3AF]">발송 시 상담이력에 기록됩니다(데모).</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 요약 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#1A1D29]">{cls ? `${cls.schedule} · ${cls.course} · ${cls.teacher} 선생님` : '반 정보 없음'}</span>
            {statusBadge}
          </div>

          {/* 보호자 연락처 */}
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">보호자 연락처</p>
            {contacts.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">등록된 연락처 없음</p>
            ) : (
              <ul className="space-y-1.5">
                {contacts.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-[#6B7280]">{c.relation}</span>
                    <span className="text-[#1A1D29] tabular-nums">{c.phone}</span>
                    <button onClick={() => copyPhone(c.phone)} className="ml-auto text-xs text-[#6B7280] hover:text-[#1A1D29] border border-[#E8EBF1] rounded px-1.5 py-0.5">복사</button>
                    <a href={`tel:${c.phone.replace(/[^0-9]/g, '')}`} className="text-xs text-[#2F6BFF] hover:underline border border-[#C9DBFF] rounded px-1.5 py-0.5">전화</a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 미납 내역 */}
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">미납 내역</p>
            {!hasUnpaid ? (
              <p className="text-sm text-[#9CA3AF]">미납 내역 없음</p>
            ) : (
              <div className="space-y-1.5">
                {unpaid.map(invoice => {
                  const od = overdueDays(invoice.due_date);
                  return (
                    <div key={invoice.id} className="flex items-center justify-between text-sm border border-[#DCE7FF] bg-[#EAF1FF] rounded px-2 py-1.5">
                      <span className="text-[#1A1D29]">{fmtMonth(invoice.billing_month)}</span>
                      <span className="text-[#1A1D29] tabular-nums">{fmtWon(outstandingAmount(invoice))}</span>
                      <span className="text-[11px] text-[#9CA3AF]">납기 {invoice.due_date}</span>
                      {od > 0 && <span className="text-[11px] font-medium text-[#F2474B]">연체 {od}일</span>}
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-1 border-t border-[#E8EBF1]">
                  <span className="text-sm font-semibold text-[#1A1D29]">총 미납액</span>
                  <span className="text-sm font-bold text-[#F2474B] tabular-nums">{fmtWon(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
