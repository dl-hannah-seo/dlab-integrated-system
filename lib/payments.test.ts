import { describe, it, expect } from 'vitest';
import {
  deriveViewStatus, classTotal, buildRows, filterRows, computeSummary, isUnpaidMode, fmt,
} from './payments';
import type { Invoice, Payment, Student, Class } from './mock-data';

const TODAY = '2026-06-16';

const cls = {
  id: 'c1', name: 'A반', schedule: '토 09:00', course: 'JAVA',
  tuition_fee: 300000, material_fee: 50000, content_fee: 46000,
  payment_due_day: 1, start_date: '2026-06-01', end_date: '2026-08-31',
} as unknown as Class;

const stu = (id: string, name: string) =>
  ({ id, name, grade: '중2', school: '판교중', parent_phone: '010-0000-0000', class_id: 'c1', status: '재원' } as unknown as Student);

const inv = (id: string, sid: string, status: Invoice['status'], due: string) =>
  ({ id, student_id: sid, class_id: 'c1', enrollment_id: 'e', billing_month: '2026-06', status,
     tuition_amount: 300000, material_amount: 50000, content_amount: 46000, discount_amount: 0, due_date: due } as Invoice);

const pay = (id: string, invId: string, sid: string, method: Payment['method'], amount: number) =>
  ({ id, invoice_id: invId, student_id: sid,
     card_amount: method === '카드' ? amount : 0, cash_amount: method === '현금' ? amount : 0,
     method, card_type: '', cash_receipt: false, amount, paid_at: '2026-06-03T10:00:00' } as Payment);

describe('deriveViewStatus', () => {
  it('완납/환불은 그대로', () => {
    expect(deriveViewStatus({ status: '완납', due_date: '2026-06-01' }, TODAY)).toBe('완납');
    expect(deriveViewStatus({ status: '환불', due_date: '2026-06-01' }, TODAY)).toBe('환불');
  });
  it('미납이고 납기 지났으면 미납', () => {
    expect(deriveViewStatus({ status: '미납', due_date: '2026-06-01' }, TODAY)).toBe('미납');
  });
  it('미납이고 납기가 미래면 예정', () => {
    expect(deriveViewStatus({ status: '미납', due_date: '2026-06-30' }, TODAY)).toBe('예정');
  });
});

describe('classTotal', () => {
  it('세 항목 합', () => {
    expect(classTotal(cls)).toBe(396000);
  });
});

describe('fmt', () => {
  it('천 단위 구분 + 원 접미사', () => {
    expect(fmt(396000)).toBe('396,000원');
    expect(fmt(-752400)).toBe('-752,400원');
    expect(fmt(0)).toBe('0원');
  });
});

describe('buildRows', () => {
  const data = {
    classes: [cls],
    students: [stu('s1', '김완납'), stu('s2', '이미납')],
    invoices: [inv('i1', 's1', '완납', '2026-06-01'), inv('i2', 's2', '미납', '2026-06-01')],
    payments: [pay('p1', 'i1', 's1', '카드', 396000)],
  };
  it('해당 월 인보이스 수만큼 행 생성', () => {
    expect(buildRows('2026-06', TODAY, data)).toHaveLength(2);
  });
  it('완납 행 금액은 실제 수납액, 미납 행 금액은 대상금액', () => {
    const rows = buildRows('2026-06', TODAY, data);
    expect(rows.find(r => r.student.id === 's1')!.amount).toBe(396000);
    expect(rows.find(r => r.student.id === 's2')!.amount).toBe(396000);
    expect(rows.find(r => r.student.id === 's2')!.status).toBe('미납');
  });
});

describe('filterRows', () => {
  const data = {
    classes: [cls],
    students: [stu('s1', '김완납'), stu('s2', '이미납')],
    invoices: [inv('i1', 's1', '완납', '2026-06-01'), inv('i2', 's2', '미납', '2026-06-01')],
    payments: [pay('p1', 'i1', 's1', '카드', 396000)],
  };
  const rows = buildRows('2026-06', TODAY, data);
  it('상태로 거른다', () => {
    expect(filterRows(rows, { status: '미납', search: '' })).toHaveLength(1);
    expect(filterRows(rows, { status: '전체', search: '' })).toHaveLength(2);
  });
  it('이름/반으로 검색한다', () => {
    expect(filterRows(rows, { status: '전체', search: '완납' })).toHaveLength(1);
    expect(filterRows(rows, { status: '전체', search: 'A반' })).toHaveLength(2);
  });
});

describe('computeSummary', () => {
  const data = {
    classes: [cls],
    students: ['s1', 's2', 's3', 's4', 's5'].map((id, i) => stu(id, '학생' + i)),
    invoices: [
      inv('i1', 's1', '완납', '2026-06-01'),
      inv('i2', 's2', '완납', '2026-06-01'),
      inv('i3', 's3', '환불', '2026-06-01'),
      inv('i4', 's4', '미납', '2026-06-01'),
      inv('i5', 's5', '미납', '2026-06-30'),
    ],
    payments: [
      pay('p1', 'i1', 's1', '카드', 396000),
      pay('p2', 'i2', 's2', '현금', 396000),
      pay('p3', 'i3', 's3', '카드', -396000),
    ],
  };
  const s = computeSummary(buildRows('2026-06', TODAY, data));
  it('수단별·환불·총수납 집계', () => {
    expect(s.card).toBe(396000);
    expect(s.cashBank).toBe(396000);
    expect(s.refund).toBe(-396000);
    expect(s.totalPaid).toBe(396000);
  });
  it('미납+예정 대상금액 합', () => {
    expect(s.unpaidTotal).toBe(792000);
  });
  it('상태별 건수', () => {
    expect(s.counts).toEqual({ 전체: 5, 완납: 2, 미납: 1, 예정: 1, 환불: 1 });
  });
});

describe('isUnpaidMode', () => {
  it('미납/예정만 true', () => {
    expect(isUnpaidMode('미납')).toBe(true);
    expect(isUnpaidMode('예정')).toBe(true);
    expect(isUnpaidMode('전체')).toBe(false);
    expect(isUnpaidMode('완납')).toBe(false);
    expect(isUnpaidMode('환불')).toBe(false);
  });
});
