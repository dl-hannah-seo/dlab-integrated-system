'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { AtRiskEntry } from '@/lib/at-risk';

/** 퇴원 가능성 높은 원생 — entries는 이미 점수순 정렬됨. limit만큼만 노출. */
export function AtRiskList({ entries, limit = 5 }: { entries: AtRiskEntry[]; limit?: number }) {
  const shown = entries.slice(0, limit);

  return (
    <Card
      title={`퇴원 가능성 높은 원생 ${entries.length}명`}
      action={<Link href="/students?risk=1" className="text-xs font-medium text-[#2F6BFF] hover:underline">자세히 보기 →</Link>}
    >
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#6B7280]">위험 신호가 있는 원생이 없습니다</p>
      ) : (
        <ul className="-my-1 space-y-1">
          {shown.map(e => (
            <li key={e.student.id} className="flex items-center justify-between gap-3 py-1.5">
              <span className="truncate text-sm text-[#1A1D29]">{e.student.name}</span>
              <span className="shrink-0 text-xs text-[#6B7280]">{e.student.grade}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
