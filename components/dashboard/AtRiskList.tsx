'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { AtRiskEntry } from '@/lib/at-risk';

/** 퇴원 가능성 높은 원생 — entries는 이미 점수순 정렬됨. limit만큼만 노출. */
export function AtRiskList({ entries, limit = 5 }: { entries: AtRiskEntry[]; limit?: number }) {
  const shown = entries.slice(0, limit);

  return (
    <Card title={`퇴원 가능성 높은 원생 ${entries.length}명`}>
      <p className="-mt-1 mb-2 text-[11px] text-[#9B9A97]">출석 저조 · 미납 · 휴원을 종합해 자동 선별</p>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#787774]">위험 신호가 있는 원생이 없습니다</p>
      ) : (
        <ul className="-my-1 space-y-1">
          {shown.map(e => (
            <li key={e.student.id} className="flex items-center justify-between gap-3 py-1.5">
              <span className="truncate text-sm text-[#37352F]">{e.student.name}</span>
              <Link
                href={`/students?detail=${e.student.id}`}
                className="shrink-0 text-xs font-medium text-[#FF6C37] hover:underline"
              >
                자세히보기
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
