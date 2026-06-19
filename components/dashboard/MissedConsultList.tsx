'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { leads, TODAY, type Lead } from '@/lib/mock-data';
import { activeLeads } from '@/lib/leads';

const STAGE_STYLE: Record<string, string> = {
  신규문의: 'bg-[#FFF1EC] text-[#FF6C37]',
  상담예약: 'bg-[#FFF8E6] text-[#D9A80A]',
  상담완료: 'bg-[#EDF7F5] text-[#0F7B6C]',
};

function daysSince(dateStr: string, today: string): number {
  const d = new Date(dateStr).getTime();
  const t = new Date(today).getTime();
  return Math.max(0, Math.round((t - d) / 86_400_000));
}

interface Entry { lead: Lead; days: number }

/** 상담 미결 — 문의 후 등록/미등록이 확정되지 않은 예비 원생. 경과일 긴 순. */
export function MissedConsultList({ limit = 5 }: { limit?: number }) {
  const entries: Entry[] = activeLeads(leads)
    .map(l => ({ lead: l, days: daysSince(l.inquiry_date, TODAY) }))
    .sort((a, b) => (b.days === a.days ? a.lead.name.localeCompare(b.lead.name, 'ko') : b.days - a.days));
  const shown = entries.slice(0, limit);

  return (
    <Card
      title={`상담 미결 ${entries.length}명`}
      action={<Link href="/leads" className="text-xs text-[#787774] hover:text-[#37352F]">상담 관리 →</Link>}
    >
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#787774]">등록 여부 미확정 문의가 없습니다</p>
      ) : (
        <ul className="-my-1 space-y-1">
          {shown.map(e => (
            <li key={e.lead.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm text-[#37352F]">{e.lead.name}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${STAGE_STYLE[e.lead.stage] ?? 'bg-[#F1F1EF] text-[#787774]'}`}>
                  {e.lead.stage}
                </span>
                <span className="shrink-0 text-xs text-[#787774]">{e.days}일 경과</span>
              </div>
              <Link href="/leads" className="shrink-0 text-xs font-medium text-[#FF6C37] hover:underline">상담 →</Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
