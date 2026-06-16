import { describe, it, expect } from 'vitest';
import {
  consultationsOf,
  nextConsultId,
  addConsultation,
  updateConsultation,
  removeConsultation,
} from './consultations';
import type { Consultation } from './mock-data';

const sample: Consultation[] = [
  { id: 'cons-s-01-1', student_id: 's-01', date: '2026-03-12', method: '대면', counselor: '김', content: 'A' },
  { id: 'cons-s-01-2', student_id: 's-01', date: '2026-05-20', method: '전화', counselor: '김', content: 'B' },
  { id: 'cons-s-02-1', student_id: 's-02', date: '2026-04-03', method: '기타', counselor: '박', content: 'C' },
];

describe('consultationsOf', () => {
  it('해당 학생만 필터하고 날짜 내림차순으로 정렬한다', () => {
    const r = consultationsOf(sample, 's-01');
    expect(r.map(c => c.id)).toEqual(['cons-s-01-2', 'cons-s-01-1']);
  });
  it('같은 날짜는 id 내림차순으로 안정 정렬한다', () => {
    const same: Consultation[] = [
      { id: 'cons-s-03-1', student_id: 's-03', date: '2026-06-01', method: '전화', counselor: '이', content: '1' },
      { id: 'cons-s-03-2', student_id: 's-03', date: '2026-06-01', method: '전화', counselor: '이', content: '2' },
    ];
    expect(consultationsOf(same, 's-03').map(c => c.id)).toEqual(['cons-s-03-2', 'cons-s-03-1']);
  });
  it('기록이 없으면 빈 배열', () => {
    expect(consultationsOf(sample, 's-99')).toEqual([]);
  });
});

describe('nextConsultId', () => {
  it('기존 최대 시퀀스 +1로 생성한다', () => {
    expect(nextConsultId(sample, 's-01')).toBe('cons-s-01-3');
  });
  it('기록이 없으면 1번', () => {
    expect(nextConsultId(sample, 's-99')).toBe('cons-s-99-1');
  });
});

describe('add/update/remove', () => {
  it('addConsultation은 레코드를 추가한다', () => {
    const rec: Consultation = { id: 'cons-s-02-2', student_id: 's-02', date: '2026-06-10', method: '대면', counselor: '박', content: 'D' };
    const r = addConsultation(sample, rec);
    expect(r).toHaveLength(4);
    expect(r.at(-1)).toEqual(rec);
  });
  it('updateConsultation은 해당 id만 병합 교체한다', () => {
    const r = updateConsultation(sample, 'cons-s-01-1', { content: 'AA', method: '전화' });
    const target = r.find(c => c.id === 'cons-s-01-1')!;
    expect(target.content).toBe('AA');
    expect(target.method).toBe('전화');
    expect(target.date).toBe('2026-03-12');
  });
  it('removeConsultation은 해당 id를 제거한다', () => {
    const r = removeConsultation(sample, 'cons-s-01-1');
    expect(r.map(c => c.id)).toEqual(['cons-s-01-2', 'cons-s-02-1']);
  });
});
