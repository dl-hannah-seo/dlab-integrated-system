'use client';

import { useState, useMemo } from 'react';
import {
  classes,
  students,
  initialAttendance,
  attendanceHistory,
  TODAY,
  type Attendance,
  type AttendanceStatus,
  type Class,
} from '@/lib/mock-data';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { AttendanceTrend } from '@/components/attendance/AttendanceTrend';
import { ClassRecordModal } from '@/components/attendance/ClassRecordModal';

// 현재 학기(2026 여름) 진행 반만
const CURRENT_CLASSES = classes.filter(c => ['cl-01', 'cl-02', 'cl-03', 'cl-04', 'cl-05', 'cl-06'].includes(c.id));

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>(() => [...attendanceHistory, ...initialAttendance]);
  const [classFilter, setClassFilter] = useState('전체');
  const [openClass, setOpenClass] = useState<Class | null>(null);

  function updateStatus(sessionId: string, studentId: string, status: AttendanceStatus, absenceReason: string | null) {
    setRecords(prev => {
      const idx = prev.findIndex(r => r.session_id === sessionId && r.student_id === studentId);
      if (idx >= 0) {
        const next = [...prev];
        const rec = next[idx];
        next[idx] = {
          ...rec,
          status,
          source: 'manual',
          absence_reason: status === 'absent' ? absenceReason : null,
          checked_in_at: (status === 'attend' || status === 'makeup') ? (rec.checked_in_at ?? `${TODAY}T09:00:00`) : null,
        };
        return next;
      }
      // 오늘 미기록 셀 등 — 신규 레코드 생성
      return [...prev, {
        id: `ah-${sessionId}-${studentId}`,
        session_id: sessionId,
        enrollment_id: `enr-${studentId}`,
        student_id: studentId,
        status,
        source: 'manual',
        checked_in_at: (status === 'attend' || status === 'makeup') ? `${TODAY}T09:00:00` : null,
        absence_reason: status === 'absent' ? absenceReason : null,
      }];
    });
  }

  // 오늘 KPI — 오늘 회차 레코드 기준.
  // 오늘 회차는 todaySessions(id가 'sess-'로 시작). initialAttendance(sess-01) 및
  // 오늘 셀 편집으로 생성된 레코드(session_id 'sess-0X')가 여기 포함된다.
  const todayRecords = useMemo(
    () => records.filter(r => r.session_id.startsWith('sess-')),
    [records],
  );

  const kpi = useMemo(() => {
    const total = todayRecords.length;
    const attend = todayRecords.filter(r => r.status === 'attend' || r.status === 'makeup').length;
    const absent = todayRecords.filter(r => r.status === 'absent').length;
    const pending = todayRecords.filter(r => r.status === 'pending').length;
    const denom = attend + absent;
    return { total, attend, absent, pending, rate: denom ? Math.round((attend / denom) * 100) : 0 };
  }, [todayRecords]);

  const targetClasses = classFilter === '전체' ? CURRENT_CLASSES : CURRENT_CLASSES.filter(c => c.id === classFilter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">출결 현황</h1>
        <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 출석/결석/보강 이력</p>
      </div>

      {/* 오늘 요약 KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '출석', value: kpi.attend, color: 'text-[#0F7B6C]', bg: 'bg-[#EDF7F5]' },
          { label: '미도착', value: kpi.pending, color: 'text-[#787774]', bg: 'bg-[#F7F7F5]' },
          { label: '결석', value: kpi.absent, color: 'text-[#EB5757]', bg: 'bg-[#FDECEA]' },
          { label: '출석률', value: `${kpi.rate}%`, color: 'text-[#37352F]', bg: 'bg-white' },
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

      {/* 출석률 추이 */}
      <AttendanceTrend records={records} />

      {/* 반 필터 */}
      <div className="flex gap-3 mb-4">
        <Select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          options={[
            { value: '전체', label: '전체 반' },
            ...CURRENT_CLASSES.map(c => ({ value: c.id, label: c.schedule + ' ' + c.course })),
          ]}
          className="w-48"
        />
      </div>

      {/* 반별 카드 (클릭 → 기록부 모달) */}
      <div className="space-y-3">
        {targetClasses.map(cls => {
          const classStudentIds = new Set(students.filter(s => s.class_id === cls.id).map(s => s.id));
          // 그 반의 오늘 회차 레코드로 요약 (없으면 미기록)
          const todayCls = records.filter(r => classStudentIds.has(r.student_id) && r.session_id.startsWith('sess-'));
          const attendCount = todayCls.filter(r => r.status === 'attend' || r.status === 'makeup').length;
          const absentCount = todayCls.filter(r => r.status === 'absent').length;
          const pendingCount = todayCls.filter(r => r.status === 'pending').length;
          const denom = attendCount + absentCount;
          const pct = denom ? Math.round((attendCount / denom) * 100) : 0;

          return (
            <button
              key={cls.id}
              onClick={() => setOpenClass(cls)}
              className="w-full text-left bg-white border border-[#E9E9E7] rounded-lg px-5 py-4 hover:border-[#FF6C37]/50 hover:bg-[#FFFBFA] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#37352F]">{cls.schedule}</span>
                  <span className="text-sm text-[#37352F]">{cls.course}</span>
                  <span className="text-xs text-[#787774]">담당: {cls.teacher}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#0F7B6C]">출석 {attendCount}</span>
                  <span className="text-[#787774]">미도착 {pendingCount}</span>
                  <span className="text-[#EB5757]">결석 {absentCount}</span>
                  <span className="font-semibold text-[#37352F]">{denom ? `${pct}%` : '미기록'}</span>
                  <span className="text-[#BEBDBA]">›</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {openClass && (
        <ClassRecordModal
          cls={openClass}
          records={records}
          onClose={() => setOpenClass(null)}
          onEdit={updateStatus}
        />
      )}
    </div>
  );
}
