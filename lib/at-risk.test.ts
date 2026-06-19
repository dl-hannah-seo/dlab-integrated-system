import { describe, it, expect } from 'vitest';
import { atRiskStudents, riskScore, riskReasons } from './at-risk';
import type { Student } from './mock-data';

function mk(over: Partial<Student> & { id: string; name: string }): Student {
  return {
    campus_id: 'c', grade: '초5', school: 'X초', parent_phone: '', student_phone: '',
    status: '재원', first_enrolled_at: '2025-01-01', source: '', points: 0,
    class_id: 'cl-01', streak: 10, title: '',
    ...over,
  } as Student;
}

const unpaid = (...ids: string[]) => new Set(ids);

describe('at-risk 점수', () => {
  it('미납·출석저조·휴원 가중치 합산', () => {
    const s = mk({ id: 's1', name: '가', streak: 1, status: '휴원' });
    expect(riskScore(s, unpaid('s1'))).toBe(3 + 2 + 2); // 7
  });

  it('신호 없으면 0점', () => {
    const s = mk({ id: 's2', name: '나', streak: 10, status: '재원' });
    expect(riskScore(s, unpaid())).toBe(0);
    expect(riskReasons(s, unpaid())).toEqual([]);
  });

  it('streak 임계값(2 이하)에서만 출석저조', () => {
    expect(riskReasons(mk({ id: 'a', name: '가', streak: 2 }), unpaid())).toContain('출석저조');
    expect(riskReasons(mk({ id: 'b', name: '나', streak: 3 }), unpaid())).not.toContain('출석저조');
  });
});

describe('atRiskStudents', () => {
  const list: Student[] = [
    mk({ id: 'hi', name: '하', streak: 0, status: '휴원' }),     // 미납X+저조2+휴원2 = 4
    mk({ id: 'mid', name: '미', streak: 10, status: '재원' }),   // 미납3 = 3
    mk({ id: 'zero', name: '제로', streak: 10, status: '재원' }),// 0 → 제외
    mk({ id: 'out', name: '아웃', streak: 0, status: '퇴원' }),  // 퇴원 → 제외
  ];

  it('퇴원자·0점 제외, 점수 내림차순 정렬', () => {
    const r = atRiskStudents(list, unpaid('mid'));
    expect(r.map(e => e.student.id)).toEqual(['hi', 'mid']);
    expect(r[0].score).toBe(4);
  });

  it('동점은 이름 오름차순', () => {
    const tie = [
      mk({ id: 'x', name: '나', streak: 0 }),
      mk({ id: 'y', name: '가', streak: 0 }),
    ];
    const r = atRiskStudents(tie, unpaid());
    expect(r.map(e => e.student.name)).toEqual(['가', '나']);
  });
});
