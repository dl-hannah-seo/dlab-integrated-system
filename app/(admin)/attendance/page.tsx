'use client';

import { useState, useMemo } from 'react';
import { classes, students, initialAttendance } from '@/lib/mock-data';
import { Card } from '@/components/ui/Card';
import { Badge, AttendanceDot } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';

export default function AttendancePage() {
  const [classFilter, setClassFilter] = useState('전체');

  const targetClasses = classFilter === '전체' ? classes : classes.filter(c => c.id === classFilter);

  const attendanceStats = useMemo(() => {
    const total = initialAttendance.length;
    const attend = initialAttendance.filter(a => a.status === 'attend').length;
    const absent = initialAttendance.filter(a => a.status === 'absent').length;
    const pending = initialAttendance.filter(a => a.status === 'pending').length;
    return { total, attend, absent, pending, rate: Math.round((attend / total) * 100) };
  }, []);

  // 과거 주간 mock 출결률
  const weeklyStats = [
    { week: '5/26주', rate: 92, attend: 71, total: 78 },
    { week: '6/2주',  rate: 88, attend: 69, total: 78 },
    { week: '6/9주',  rate: 95, attend: 74, total: 78 },
    { week: '6/14',   rate: attendanceStats.attend > 0 ? Math.round((attendanceStats.attend / attendanceStats.total) * 100) : 21, attend: attendanceStats.attend, total: attendanceStats.total },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">출결 자료</h1>
        <p className="text-sm text-[#787774] mt-1">강남 캠퍼스 · 출석/결석/보강 이력</p>
      </div>

      {/* 이번 주 요약 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '출석', value: attendanceStats.attend, color: 'text-[#0F7B6C]', bg: 'bg-[#EDF7F5]' },
          { label: '미도착', value: attendanceStats.pending, color: 'text-[#787774]', bg: 'bg-[#F7F7F5]' },
          { label: '결석', value: attendanceStats.absent, color: 'text-[#EB5757]', bg: 'bg-[#FDECEA]' },
          { label: '출석률', value: `${attendanceStats.rate}%`, color: 'text-[#37352F]', bg: 'bg-white' },
        ].map(item => (
          <Card key={item.label} className={`!p-0 ${item.bg}`}>
            <div className="px-5 py-4 text-center">
              <p className="text-xs text-[#787774] mb-1">{item.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
              <p className="text-xs text-[#787774] mt-0.5">오늘 (6/14)</p>
            </div>
          </Card>
        ))}
      </div>

      {/* 주간 출석률 추이 */}
      <Card title="주간 출석률 추이" className="mb-6">
        <div className="flex items-end gap-5 h-28">
          {weeklyStats.map(w => {
            const pct = w.rate;
            return (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-[#37352F]">{pct}%</span>
                <div className="w-full rounded-t-md" style={{ height: `${(pct / 100) * 80}px`, background: '#FF6C37', opacity: w.week === '6/14' ? 1 : 0.4 }} />
                <span className="text-xs text-[#787774]">{w.week}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 반별 출결 현황 */}
      <div className="flex gap-3 mb-4">
        <Select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          options={[
            { value: '전체', label: '전체 반' },
            ...classes.map(c => ({ value: c.id, label: c.schedule + ' ' + c.course })),
          ]}
          className="w-48"
        />
      </div>

      <div className="space-y-3">
        {targetClasses.map(cls => {
          const classStudents = students.filter(s => s.class_id === cls.id);
          const attRecords = initialAttendance.filter(a => classStudents.some(s => s.id === a.student_id));
          const attendCount = attRecords.filter(a => a.status === 'attend').length;
          const absentCount = attRecords.filter(a => a.status === 'absent').length;
          const pendingCount = attRecords.filter(a => a.status === 'pending').length;
          const totalInClass = classStudents.length;
          const pct = totalInClass > 0 ? Math.round((attendCount / totalInClass) * 100) : 0;

          return (
            <div key={cls.id} className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#E9E9E7] bg-[#F7F7F5]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#37352F]">{cls.schedule}</span>
                  <span className="text-sm text-[#37352F]">{cls.course}</span>
                  <span className="text-xs text-[#787774]">담당: {cls.teacher}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#0F7B6C]">출석 {attendCount}</span>
                  <span className="text-[#787774]">미도착 {pendingCount}</span>
                  <span className="text-[#EB5757]">결석 {absentCount}</span>
                  <span className="font-semibold text-[#37352F]">{pct}%</span>
                </div>
              </div>
              <div className="px-5 py-3 flex flex-wrap gap-1.5">
                {classStudents.map(s => {
                  const att = attRecords.find(a => a.student_id === s.id);
                  const status = att?.status ?? 'pending';
                  return (
                    <div key={s.id} className="flex items-center gap-1 text-xs text-[#37352F]">
                      <AttendanceDot status={status} />
                      <span>{s.name}</span>
                    </div>
                  );
                })}
                {/* 출결 미기록 원생 (cl-02~cl-06은 오늘 미기록) */}
                {attRecords.length === 0 && classStudents.map(s => (
                  <div key={s.id} className="flex items-center gap-1 text-xs text-[#787774]">
                    <AttendanceDot status="pending" />
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
