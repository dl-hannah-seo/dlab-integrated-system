import { describe, it, expect } from 'vitest';
import {
  unpaidInvoicesOf, outstandingAmount, overdueDays, guardianContactsOf,
} from './payment-helpers';
import type { Invoice, Student } from './mock-data';

const inv = (over: Partial<Invoice>): Invoice => ({
  id: 'inv-x', student_id: 's-x', class_id: 'cl-01', enrollment_id: 'enr-x',
  billing_month: '2026-06', status: '미납',
  tuition_amount: 180000, material_amount: 20000, content_amount: 10000,
  discount_amount: 0, due_date: '2026-06-01', ...over,
});

describe('outstandingAmount', () => {
  it('할인을 차감한 미수금을 계산한다', () => {
    expect(outstandingAmount(inv({ discount_amount: 20000 }))).toBe(190000);
  });
});

describe('overdueDays', () => {
  it('납기 경과 일수를 센다', () => {
    expect(overdueDays('2026-06-01', '2026-06-14')).toBe(13);
  });
  it('납기 당일/미경과는 0', () => {
    expect(overdueDays('2026-06-14', '2026-06-14')).toBe(0);
    expect(overdueDays('2026-06-30', '2026-06-14')).toBe(0);
  });
});

describe('unpaidInvoicesOf', () => {
  it('미납/부분납만 반환하고 완납은 제외한다 (실제 mock 데이터: s-06 미납)', () => {
    const r = unpaidInvoicesOf('s-06');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(i => i.status === '미납' || i.status === '부분납')).toBe(true);
  });
  it('완납 학생은 빈 배열 (s-01)', () => {
    expect(unpaidInvoicesOf('s-01')).toEqual([]);
  });
});

describe('guardianContactsOf', () => {
  const base: Student = {
    id: 's-x', campus_id: 'c', name: '홍길동', grade: '초4', school: 'x',
    parent_phone: '010-0000-0001', student_phone: '', status: '재원',
    first_enrolled_at: '2026-03-02', source: '지인소개', points: 0,
    class_id: 'cl-01', streak: 0, title: '',
  } as Student;

  it('모(주 보호자)는 항상 포함', () => {
    expect(guardianContactsOf(base)).toEqual([{ relation: '모', phone: '010-0000-0001' }]);
  });
  it('부·기타 연락처가 있으면 함께 집계', () => {
    const s = { ...base, father_phone: '010-0000-0002', other_guardian_phone: '010-0000-0003', other_guardian_relation: '외조모' };
    expect(guardianContactsOf(s)).toEqual([
      { relation: '모', phone: '010-0000-0001' },
      { relation: '부', phone: '010-0000-0002' },
      { relation: '외조모', phone: '010-0000-0003' },
    ]);
  });
});
