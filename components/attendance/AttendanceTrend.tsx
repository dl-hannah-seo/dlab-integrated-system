'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import {
  type Attendance,
  getWeeklyAttendanceTrend,
  getMonthlyAttendanceTrend,
} from '@/lib/mock-data';

export function AttendanceTrend({ records }: { records: Attendance[] }) {
  const [mode, setMode] = useState<'week' | 'month'>('week');

  const points = useMemo(
    () => (mode === 'week'
      ? getWeeklyAttendanceTrend(records, 8)
      : getMonthlyAttendanceTrend(records, 4)),
    [records, mode],
  );

  return (
    <Card
      title="출석률 추이"
      className="mb-6"
      action={
        <div className="flex rounded-md border border-[#E9E9E7] overflow-hidden text-xs">
          {(['week', 'month'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 transition-colors ${mode === m ? 'bg-[#FF6C37] text-white' : 'bg-white text-[#787774] hover:bg-[#F7F7F5]'}`}
            >
              {m === 'week' ? '주간' : '월별'}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex items-end gap-4 h-28">
        {points.map((p, i) => (
          <div key={p.key} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-[#37352F]">{p.rate}%</span>
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${(p.rate / 100) * 80}px`,
                background: '#FF6C37',
                opacity: i === points.length - 1 ? 1 : 0.4,
              }}
            />
            <span className="text-xs text-[#787774]">{p.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
