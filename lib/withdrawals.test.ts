import { describe, it, expect } from 'vitest';
import { withdrawnOf, withdrawReasonCounts } from './withdrawals';
import { withdrawnStudents } from './mock-data';
import type { Student } from './mock-data';

const mk = (id: string, status: Student['status'], reason?: Student['withdraw_reason']): Student => ({
  id, campus_id: 'c', name: id, grade: '초4', school: 'x', parent_phone: '', student_phone: '',
  status, first_enrolled_at: '2025-01-01', source: '기타', points: 0, class_id: '', streak: 0, title: '',
  withdraw_reason: reason,
});

describe('withdrawnOf', () => {
  it('퇴원 학생만 반환', () => {
    const list = [mk('a', '재원'), mk('b', '퇴원', '이사'), mk('c', '휴원')];
    expect(withdrawnOf(list).map(s => s.id)).toEqual(['b']);
  });
});

describe('withdrawReasonCounts', () => {
  it('사유별 집계, 건수 내림차순', () => {
    const list = [
      mk('a', '퇴원', '비용 부담'),
      mk('b', '퇴원', '비용 부담'),
      mk('c', '퇴원', '이사'),
      mk('d', '재원'),
    ];
    const r = withdrawReasonCounts(list);
    expect(r[0]).toEqual({ reason: '비용 부담', count: 2 });
    expect(r.find(x => x.reason === '이사')?.count).toBe(1);
  });
  it('사유 미입력은 미입력으로 집계', () => {
    const r = withdrawReasonCounts([mk('a', '퇴원')]);
    expect(r).toEqual([{ reason: '미입력', count: 1 }]);
  });
  it('실제 mock 퇴원자 데이터가 집계된다', () => {
    const r = withdrawReasonCounts(withdrawnStudents);
    expect(r.reduce((s, x) => s + x.count, 0)).toBe(withdrawnStudents.length);
  });
});
