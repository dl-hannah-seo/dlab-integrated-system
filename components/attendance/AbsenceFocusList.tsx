'use client';

import { Card } from '@/components/ui/Card';
import { type AbsenceFocusEntry } from '@/lib/mock-data';

function mmdd(iso: string) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

export function AbsenceFocusList({
  entries,
  onSelect,
}: {
  entries: AbsenceFocusEntry[];
  onSelect: (classId: string) => void;
}) {
  return (
    <Card title="미등원 집중 리스트" className="h-full">
      <p className="text-xs text-[#787774] -mt-1 mb-2">최근 8회차 결석 누적 · 결석 많은 순</p>
      {entries.length === 0 ? (
        <p className="text-sm text-[#787774] py-8 text-center">최근 8회차 결석 학생이 없습니다.</p>
      ) : (
        <div className="divide-y divide-[#F1F0EF] max-h-[220px] overflow-y-auto pr-1">
          {entries.map(e => (
            <button
              key={e.student.id}
              onClick={() => onSelect(e.cls.id)}
              className="w-full flex items-center justify-between gap-3 px-1 py-2.5 text-left rounded hover:bg-[#FAFAF9] transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-[#37352F]">{e.student.name}</span>
                <span className="text-xs text-[#787774] truncate">{e.cls.schedule} {e.cls.course}</span>
              </span>
              <span className="flex items-center gap-3 shrink-0">
                {e.lastAbsentDate && (
                  <span className="text-xs text-[#787774]">최근 {mmdd(e.lastAbsentDate)}</span>
                )}
                <span className="text-xs font-semibold text-[#EB5757] bg-[#FDECEA] px-2 py-0.5 rounded tabular-nums">
                  결석 {e.absentCount}회
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
