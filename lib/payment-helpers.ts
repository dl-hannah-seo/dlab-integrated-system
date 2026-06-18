import { TODAY, getInvoiceByStudent, type Invoice, type Student } from './mock-data';

/** 해당 학생의 미납/부분납 인보이스 */
export function unpaidInvoicesOf(studentId: string): Invoice[] {
  return getInvoiceByStudent(studentId).filter(
    inv => inv.status === '미납' || inv.status === '부분납',
  );
}

/** 인보이스 미수금 = 수강료+교재비+콘텐츠비-할인 */
export function outstandingAmount(inv: Invoice): number {
  return inv.tuition_amount + inv.material_amount + inv.content_amount - inv.discount_amount;
}

function toDayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** 납기 경과 일수 (미경과·당일은 0) */
export function overdueDays(dueDate: string, today: string = TODAY): number {
  const diff = toDayNumber(today) - toDayNumber(dueDate);
  return diff > 0 ? diff : 0;
}

export interface GuardianContact {
  relation: string;
  phone: string;
}

/** 학생 보호자 연락처 집계 (모=주 보호자, 부, 기타) */
export function guardianContactsOf(student: Student): GuardianContact[] {
  const out: GuardianContact[] = [];
  if (student.parent_phone) out.push({ relation: '모', phone: student.parent_phone });
  if (student.father_phone) out.push({ relation: '부', phone: student.father_phone });
  if (student.other_guardian_phone) {
    out.push({ relation: student.other_guardian_relation ?? '기타', phone: student.other_guardian_phone });
  }
  return out;
}
