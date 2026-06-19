'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { leads } from '@/lib/mock-data';
import { activeLeads } from '@/lib/leads';

/** 상담 미결 — 문의 후 등록/미등록이 확정되지 않은 예비 원생. 문의 오래된 순(이름만 노출). */
export function MissedConsultList({ limit = 5 }: { limit?: number }) {
  const entries = activeLeads(leads)
    .slice()
    .sort((a, b) =>
      a.inquiry_date === b.inquiry_date
        ? a.name.localeCompare(b.name, 'ko')
        : a.inquiry_date.localeCompare(b.inquiry_date),
    );
  const shown = entries.slice(0, limit);

  return (
    <Card
      title={`상담 미결 ${entries.length}명`}
      action={<Link href="/leads" className="text-xs font-medium text-[#2F6BFF] hover:underline">자세히 보기 →</Link>}
    >
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#6B7280]">등록 여부 미확정 문의가 없습니다</p>
      ) : (
        <ul className="-my-1 space-y-1">
          {shown.map(l => (
            <li key={l.id} className="flex items-center justify-between gap-3 py-1.5">
              <span className="truncate text-sm text-[#1A1D29]">{l.name}</span>
              <span className="shrink-0 text-xs text-[#6B7280] tabular-nums">{l.inquiry_date}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
