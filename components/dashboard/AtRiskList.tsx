'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { AtRiskEntry, RiskReason } from '@/lib/at-risk';

const REASON_STYLE: Record<RiskReason, string> = {
  미납: 'bg-[#FDECEA] text-[#EB5757]',
  출석저조: 'bg-[#FFF8E6] text-[#D9A80A]',
  휴원: 'bg-[#F1F1EF] text-[#787774]',
};

/** 퇴원 가능성 높은 원생 — entries는 이미 점수순 정렬됨. limit만큼만 노출. */
export function AtRiskList({ entries, limit = 5 }: { entries: AtRiskEntry[]; limit?: number }) {
  const shown = entries.slice(0, limit);

  return (
    <Card
      title={`퇴원 가능성 높은 원생 ${entries.length}명`}
      action={<Link href="/students" className="text-xs text-[#787774] hover:text-[#37352F]">원생 →</Link>}
    >
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#787774]">위험 신호가 있는 원생이 없습니다</p>
      ) : (
        <ul className="-my-1 space-y-1">
          {shown.map(e => (
            <li key={e.student.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm text-[#37352F]">{e.student.name}</span>
                <span className="flex shrink-0 gap-1">
                  {e.reasons.map(r => (
                    <span key={r} className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${REASON_STYLE[r]}`}>{r}</span>
                  ))}
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
