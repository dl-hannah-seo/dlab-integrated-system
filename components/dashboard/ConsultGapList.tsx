'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { ConsultGapEntry } from '@/lib/consultations';

/** 상담 미정(공백 장기) 재원생 — entries는 이미 경과일순 정렬됨. limit만큼만 노출. */
export function ConsultGapList({ entries, limit = 5 }: { entries: ConsultGapEntry[]; limit?: number }) {
  const shown = entries.slice(0, limit);

  return (
    <Card
      title={`상담 미정 ${entries.length}명`}
      action={<Link href="/students" className="text-xs text-[#787774] hover:text-[#37352F]">원생 →</Link>}
    >
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#787774]">상담 공백이 긴 원생이 없습니다</p>
      ) : (
        <ul className="-my-1 space-y-1">
          {shown.map(e => (
            <li key={e.student.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm text-[#37352F]">{e.student.name}</span>
                <span className="shrink-0 text-xs text-[#787774]">
                  {e.daysSince === null ? '상담 기록 없음' : `마지막 상담 ${e.daysSince}일 전`}
                </span>
              </div>
              <Link href="/students" className="shrink-0 text-xs font-medium text-[#FF6C37] hover:underline">상담 →</Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
