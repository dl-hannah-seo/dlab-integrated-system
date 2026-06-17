import type { Invoice, Payment, Student, Class } from './mock-data';
import { invoices as allInvoices, students as allStudents, classes as allClasses, payments as allPayments } from './mock-data';

export type ViewStatus = '완납' | '미납' | '예정' | '환불';
export type StatusFilter = '전체' | ViewStatus;

export function fmt(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function classTotal(c: Pick<Class, 'tuition_fee' | 'material_fee' | 'content_fee'>): number {
  return c.tuition_fee + c.material_fee + c.content_fee;
}

/** 예정 = 미납이면서 납기일(due_date)이 기준일(today, 'YYYY-MM-DD') 이후 */
export function deriveViewStatus(inv: Pick<Invoice, 'status' | 'due_date'>, today: string): ViewStatus {
  if (inv.status === '완납') return '완납';
  if (inv.status === '환불') return '환불';
  // 미납·부분납: 납기 도래 전이면 예정
  return inv.due_date > today ? '예정' : '미납';
}

export interface PaymentRow {
  inv: Invoice;
  student: Student;
  cls: Class;
  pay?: Payment;
  status: ViewStatus;
  /** 완납/환불=실제 수납액(환불은 음수), 미납/예정=할인 반영 대상금액 */
  amount: number;
}

interface RowData {
  invoices: Invoice[];
  students: Student[];
  classes: Class[];
  payments: Payment[];
}

export function buildRows(
  month: string,
  today: string,
  data: RowData = { invoices: allInvoices, students: allStudents, classes: allClasses, payments: allPayments },
): PaymentRow[] {
  return data.invoices
    .filter(inv => inv.billing_month === month)
    .map(inv => {
      const student = data.students.find(s => s.id === inv.student_id)!;
      const cls = data.classes.find(c => c.id === inv.class_id)!;
      const pay = data.payments.find(p => p.invoice_id === inv.id);
      const status = deriveViewStatus(inv, today);
      const target = classTotal(cls) - inv.discount_amount;
      const amount = (status === '완납' || status === '환불') && pay ? pay.amount : target;
      return { inv, student, cls, pay, status, amount };
    });
}

export interface FilterOptions {
  status?: StatusFilter;
  studentName?: string;
  className?: string;
  /** classes 페이지와 동일한 그룹명 형식: "{year}년 {season}" (예: "2026년 여름학기") */
  groupName?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function filterRows(
  rows: PaymentRow[],
  opts: FilterOptions,
  classGroupsData: { id: string; year: number; season: string }[] = [],
): PaymentRow[] {
  return rows.filter(r => {
    if (opts.status && opts.status !== '전체' && r.status !== opts.status) return false;
    if (opts.studentName && !r.student.name.includes(opts.studentName)) return false;
    if (opts.className && r.cls.name !== opts.className) return false;
    if (opts.groupName) {
      const cg = classGroupsData.find(g => g.id === r.cls.class_group_id);
      const key = cg ? `${cg.year}년 ${cg.season}` : '';
      if (key !== opts.groupName) return false;
    }
    if (opts.paymentMethod && r.pay?.method !== opts.paymentMethod) return false;
    if (opts.dateFrom && (!r.pay?.paid_at || String(r.pay.paid_at).slice(0, 10) < opts.dateFrom)) return false;
    if (opts.dateTo && (!r.pay?.paid_at || String(r.pay.paid_at).slice(0, 10) > opts.dateTo)) return false;
    return true;
  });
}

export interface Summary {
  counts: Record<StatusFilter, number>;
  /** card + cashBank + refund */
  totalPaid: number;
  card: number;
  cashBank: number;
  /** 음수 */
  refund: number;
  /** 미납+예정 대상금액 합 */
  unpaidTotal: number;
}

export function computeSummary(rows: PaymentRow[]): Summary {
  const counts: Record<StatusFilter, number> = { 전체: rows.length, 완납: 0, 미납: 0, 예정: 0, 환불: 0 };
  let card = 0, cashBank = 0, refund = 0, unpaidTotal = 0;
  for (const r of rows) {
    counts[r.status]++;
    if (r.status === '완납' && r.pay) {
      if (r.pay.method === '카드') card += r.pay.amount;
      else cashBank += r.pay.amount; // 현금·계좌이체·PG
    } else if (r.status === '환불' && r.pay) {
      refund += r.pay.amount; // 음수
    } else if (r.status === '미납' || r.status === '예정') {
      unpaidTotal += r.amount;
    }
  }
  return { counts, card, cashBank, refund, totalPaid: card + cashBank + refund, unpaidTotal };
}

export function isUnpaidMode(status: StatusFilter): boolean {
  return status === '미납' || status === '예정';
}
