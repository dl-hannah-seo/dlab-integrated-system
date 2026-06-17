'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { StatusPopover } from '@/components/attendance/StatusPopover';
import { SmsComposeModal } from '@/components/attendance/SmsComposeModal';
import { MakeupScheduleModal } from '@/components/attendance/MakeupScheduleModal';
import {
  type Attendance,
  type AttendanceStatus,
  type Class,
  type Student,
  type ClassSession,
  addMakeupSession,
  getClassMatrix,
  TODAY,
} from '@/lib/mock-data';

const DOT_COLOR: Record<AttendanceStatus, string> = {
  attend:  '#0F7B6C',
  absent:  '#EB5757',
  makeup:  '#D9A80A',
  pending: '#FFFFFF',
};

function mmdd(iso: string) {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

interface ClassRecordModalProps {
  cls: Class;
  records: Attendance[];
  onClose: () => void;
  onEdit: (sessionId: string, studentId: string, status: AttendanceStatus, absenceReason: string | null) => void;
}

export function ClassRecordModal({ cls, records, onClose, onEdit }: ClassRecordModalProps) {
  const matrix = getClassMatrix(cls.id, records, 8);
  // 편집 중인 셀: `${sessionId}:${studentId}`
  const [editing, setEditing] = useState<string | null>(null);
  // 결석 후속 액션(문자/보강) 대상
  const [action, setAction] = useState<{ type: 'sms' | 'makeup'; student: Student; session: ClassSession } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  function flashMsg(m: string) {
    setFlash(m);
    setTimeout(() => setFlash(null), 3000);
  }

  function scheduleMakeup(student: Student, session: ClassSession, date: string, time: string, memo: string) {
    addMakeupSession(cls.id, date, time, memo || `${student.name} 보강 (${mmdd(session.session_date)}회차 결석)`);
    onEdit(session.id, student.id, 'makeup', null);
    flashMsg(`${student.name} 보강 일정(${mmdd(date)} ${time})을 등록했습니다.`);
  }

  // 반 요약 (오늘 제외 회차의 출석률)
  const flat = matrix.rows.flatMap(r => r.cells.filter(c => c.session.session_date !== TODAY));
  const counted = flat.filter(c => c.status !== 'pending');
  const attended = counted.filter(c => c.status === 'attend' || c.status === 'makeup').length;
  const avgRate = counted.length ? Math.round((attended / counted.length) * 100) : 0;

  return (
    <Modal open onClose={onClose} size="xl" title={`${cls.schedule} ${cls.course} · 담당 ${cls.teacher}`}>
      {flash && (
        <div className="mb-3 rounded-md bg-[#EDF7F5] border border-[#0F7B6C]/30 px-3 py-2 text-xs text-[#0F7B6C]">
          {flash}
        </div>
      )}
      <div className="flex items-center gap-4 mb-4 text-xs text-[#787774]">
        <span>평균 출석률 <b className="text-[#37352F]">{avgRate}%</b></span>
        <span>회차 {matrix.sessions.length}</span>
        <span>재원 {matrix.rows.length}명</span>
        <span className="ml-auto flex items-center gap-2">
          <Legend color="#0F7B6C" label="출석" />
          <Legend color="#D9A80A" label="보강" />
          <Legend color="#EB5757" label="결석" />
          <Legend color="#FFFFFF" label="미도착" border />
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white text-left text-xs font-medium text-[#787774] px-2 py-2 min-w-[72px]">이름</th>
              {matrix.sessions.map(s => (
                <th key={s.id} className="px-2 py-2 text-center text-xs font-medium min-w-[44px]">
                  <span className={s.session_date === TODAY ? 'text-[#FF6C37]' : 'text-[#787774]'}>
                    {s.session_date === TODAY ? '오늘' : mmdd(s.session_date)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map(row => (
              <tr key={row.student.id} className="border-t border-[#F1F0EF]">
                <td className="sticky left-0 bg-white text-xs text-[#37352F] px-2 py-1.5 whitespace-nowrap">{row.student.name}</td>
                {row.cells.map(cell => {
                  const key = `${cell.session.id}:${row.student.id}`;
                  const isToday = cell.session.session_date === TODAY;
                  const isManual = cell.record?.source === 'manual';
                  return (
                    <td key={key} className="px-2 py-1.5 text-center relative">
                      <button
                        onClick={() => setEditing(editing === key ? null : key)}
                        className={`relative inline-flex items-center justify-center w-6 h-6 rounded-md hover:ring-2 hover:ring-[#FF6C37]/30 ${isToday ? 'ring-1 ring-[#FF6C37]/50' : ''}`}
                        title={isManual ? '수정됨' : undefined}
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{
                            background: DOT_COLOR[cell.status],
                            border: cell.status === 'pending' ? '2px solid #C7C6C3' : 'none',
                          }}
                        />
                        {isManual && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF6C37]" />}
                      </button>
                      {editing === key && (
                        <StatusPopover
                          current={cell.status}
                          currentReason={cell.record?.absence_reason ?? null}
                          onSelect={(status, reason) => {
                            onEdit(cell.session.id, row.student.id, status, reason);
                            setEditing(null);
                          }}
                          onClose={() => setEditing(null)}
                          onRequestSms={() => { setAction({ type: 'sms', student: row.student, session: cell.session }); setEditing(null); }}
                          onRequestMakeup={() => { setAction({ type: 'makeup', student: row.student, session: cell.session }); setEditing(null); }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {action?.type === 'sms' && (
        <SmsComposeModal
          student={action.student}
          cls={cls}
          session={action.session}
          onClose={() => setAction(null)}
          onSent={flashMsg}
        />
      )}
      {action?.type === 'makeup' && (
        <MakeupScheduleModal
          student={action.student}
          cls={cls}
          session={action.session}
          onClose={() => setAction(null)}
          onConfirm={(date, time, memo) => scheduleMakeup(action.student, action.session, date, time, memo)}
        />
      )}
    </Modal>
  );
}

function Legend({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[#787774]">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color, border: border ? '2px solid #C7C6C3' : 'none' }} />
      {label}
    </span>
  );
}
