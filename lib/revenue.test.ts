import { describe, it, expect } from 'vitest';
import { computeRevenue, fmt, ROYALTY_RATE } from './revenue';
import { classes } from './mock-data';
import type { Class } from './mock-data';

const klass = (over: Partial<Class>): Class => ({
  id: 'k1', campus_id: 'c', class_group_id: 'g', course: '파이썬 기초', subject_id: 'sub-python',
  name: 'n', teacher: '홍', team_lead: 'x', capacity: 10, start_date: '', end_date: '',
  schedule: '', payment_method: '매월', payment_due_day: 1, tuition_fee: 0, material_fee: 0,
  content_fee: 0, enrolled_count: 0, ...over,
});

describe('ROYALTY_RATE', () => {
  it('가맹 로열티율은 6%', () => {
    expect(ROYALTY_RATE).toBe(0.06);
  });
});

describe('computeRevenue — 판교 mock-data 기준', () => {
  const r = computeRevenue(classes);

  it('교육 매출 = Σ(수강료 × 재원 학생수) = 16,600,000', () => {
    expect(r.eduRevenue).toBe(16_600_000);
  });
  it('로열티(6%) = 996,000', () => {
    expect(r.royalty).toBe(996_000);
  });
  it('콘텐츠 사용료 합계 = 800,000', () => {
    expect(r.contentTotal).toBe(800_000);
  });
  it('본사 납부 합계 = 로열티 + 콘텐츠 = 1,796,000', () => {
    expect(r.hqTotal).toBe(1_796_000);
  });
});

describe('computeRevenue — 콘텐츠 청구 상세', () => {
  it('content_fee>0 반을 과목별로 묶어 2개 콘텐츠 행 생성', () => {
    const r = computeRevenue(classes);
    expect(r.contentRows).toEqual([
      { content: '파이썬 기초', students: 47, unitPrice: 10_000, amount: 470_000 },
      { content: '아두이노', students: 11, unitPrice: 30_000, amount: 330_000 },
    ]);
  });

  it('콘텐츠 행 청구액 합이 contentTotal과 일치', () => {
    const r = computeRevenue(classes);
    const sum = r.contentRows.reduce((s, row) => s + row.amount, 0);
    expect(sum).toBe(r.contentTotal);
  });

  it('content_fee가 0인 과목(맞춤수업)은 콘텐츠 행에 포함하지 않음', () => {
    const r = computeRevenue(classes);
    expect(r.contentRows.some(row => row.content === '맞춤수업')).toBe(false);
  });
});

describe('computeRevenue — 대상 필터', () => {
  it('enrolled_count가 0인 종강 반은 교육 매출/콘텐츠에 미포함', () => {
    const r = computeRevenue([
      klass({ id: 'live', tuition_fee: 100_000, content_fee: 10_000, enrolled_count: 5 }),
      klass({ id: 'ended', tuition_fee: 100_000, content_fee: 10_000, enrolled_count: 0 }),
    ]);
    expect(r.eduRevenue).toBe(500_000);
    expect(r.contentTotal).toBe(50_000);
    expect(r.contentRows).toHaveLength(1);
    expect(r.contentRows[0].students).toBe(5);
  });

  it('같은 과목 여러 반은 학생수를 합산', () => {
    const r = computeRevenue([
      klass({ id: 'a', course: '파이썬 기초', content_fee: 10_000, enrolled_count: 14 }),
      klass({ id: 'b', course: '파이썬 기초', content_fee: 10_000, enrolled_count: 15 }),
    ]);
    expect(r.contentRows).toEqual([
      { content: '파이썬 기초', students: 29, unitPrice: 10_000, amount: 290_000 },
    ]);
  });

  it('로열티는 반올림 정수', () => {
    const r = computeRevenue([klass({ tuition_fee: 33_333, enrolled_count: 1 })]);
    expect(r.royalty).toBe(Math.round(33_333 * 0.06));
  });
});

describe('fmt', () => {
  it('천 단위 콤마 + 원', () => {
    expect(fmt(1_796_000)).toBe('1,796,000원');
    expect(fmt(0)).toBe('0원');
  });
});
