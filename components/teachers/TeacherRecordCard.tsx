'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import {
  TODAY, type Teacher, type Subject, type Class, type Consultation,
  type TeacherAttendance, type AttendanceWorkStatus,
} from '@/lib/mock-data';
import { classesOfTeacher, consultationsByCounselor, attendanceOf, attendanceSummary, monthlySalary } from '@/lib/teacher-hr';

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

const TABS = ['인적정보', '담당 수업', '상담이력', '근태'] as const;
type Tab = typeof TABS[number];

const WORK_STATUSES: AttendanceWorkStatus[] = ['정상', '지각', '연차', '병가', '결근'];
const STATUS_STYLE: Record<AttendanceWorkStatus, string> = {
  '정상': 'bg-[#E6F9EF] text-[#28C76F]',
  '지각': 'bg-[#FFF4E0] text-[#C18A14]',
  '연차': 'bg-[#EAF1FF] text-[#2F6BFF]',
  '병가': 'bg-[#FEE9EA] text-[#F2474B]',
  '결근': 'bg-[#FEE9EA] text-[#F2474B]',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex py-2 border-b border-[#EEF1F5]">
      <span className="w-24 shrink-0 text-sm text-[#6B7280]">{label}</span>
      <span className="text-sm text-[#1A1D29]">{value}</span>
    </div>
  );
}

export function TeacherRecordCard({
  teacher, subjects, classes, consultations, attendance, onAddAttendance, onClose,
}: {
  teacher: Teacher;
  subjects: Subject[];
  classes: Class[];
  consultations: Consultation[];
  attendance: TeacherAttendance[];
  onAddAttendance: (rec: TeacherAttendance) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('인적정보');

  const subjectName = (id: string) => subjects.find(s => s.id === id)?.name ?? id;
  const myClasses = classesOfTeacher(teacher.id, classes);
  const myConsults = consultationsByCounselor(teacher.name, consultations);
  const myAttendance = attendanceOf(teacher.id, attendance);
  const summary = attendanceSummary(myAttendance);
  const salary = monthlySalary(teacher, classes);

  // 근태 추가 폼
  const [aDate, setADate] = useState(TODAY);
  const [aStatus, setAStatus] = useState<AttendanceWorkStatus>('정상');
  const [aIn, setAIn] = useState('');
  const [aOut, setAOut] = useState('');
  const [aMemo, setAMemo] = useState('');

  let addSeq = 0;
  function addAttendance() {
    addSeq += 1;
    onAddAttendance({
      id: `ta-${teacher.id}-new-${myAttendance.length + addSeq}`,
      teacher_id: teacher.id,
      date: aDate,
      status: aStatus,
      check_in: aIn || undefined,
      check_out: aOut || undefined,
      memo: aMemo || undefined,
    });
    setAIn(''); setAOut(''); setAMemo('');
  }

  return (
    <Modal open onClose={onClose} size="lg" title={`인사기록카드 · ${teacher.name}`}>
      {/* 탭 */}
      <div className="flex gap-1 border-b border-[#E8EBF1] mb-4 -mt-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-[#2F6BFF] text-[#2F6BFF] font-medium' : 'border-transparent text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            {t}
            {t === '담당 수업' && myClasses.length > 0 && <span className="ml-1 text-xs text-[#9CA3AF]">{myClasses.length}</span>}
            {t === '상담이력' && myConsults.length > 0 && <span className="ml-1 text-xs text-[#9CA3AF]">{myConsults.length}</span>}
          </button>
        ))}
      </div>

      {tab === '인적정보' && (
        <div>
          <Row label="이름" value={teacher.name} />
          <Row label="역할" value={
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#EAF1FF] text-[#2F6BFF]">{teacher.role}</span>
          } />
          <Row label="연락처" value={teacher.phone ? <a href={`tel:${teacher.phone.replace(/[^0-9]/g, '')}`} className="text-[#2F6BFF] hover:underline">{teacher.phone}</a> : '미등록'} />
          <Row label="입사일" value={teacher.hire_date ?? '미등록'} />
          <Row label="상태" value={teacher.status} />
          <Row label="담당 과목" value={teacher.subject_ids.map(subjectName).join(', ') || '-'} />
          {teacher.role === '연구원' ? (
            <Row label="연봉" value={teacher.annual_salary ? won(teacher.annual_salary) : '미설정'} />
          ) : (
            <Row label="시급" value={teacher.hourly_wage ? won(teacher.hourly_wage) : '미설정'} />
          )}
          <Row label="학기 인센티브" value={teacher.incentive ? won(teacher.incentive) : '-'} />
          <Row
            label="예상 월급여"
            value={salary.basePay ? (
              <span>
                <span className="font-semibold">{won(salary.total)}</span>
                <span className="text-xs text-[#9CA3AF]">
                  {teacher.role === '연구원'
                    ? ' · 연봉 ÷ 12 + 인센티브'
                    : ` · 월 ${Math.round(salary.hours)}h 기준(추정) + 인센티브`}
                </span>
              </span>
            ) : '미설정'}
          />
        </div>
      )}

      {tab === '담당 수업' && (
        myClasses.length === 0 ? <p className="py-6 text-center text-sm text-[#6B7280]">담당 수업이 없습니다.</p> : (
          <ul className="divide-y divide-[#EEF1F5]">
            {myClasses.map(c => (
              <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[#1A1D29]">{c.schedule} · {c.course}</span>
                <span className="text-xs text-[#6B7280]">{c.enrolled_count}/{c.capacity}명</span>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === '상담이력' && (
        myConsults.length === 0 ? <p className="py-6 text-center text-sm text-[#6B7280]">진행한 상담이 없습니다.</p> : (
          <ul className="divide-y divide-[#EEF1F5]">
            {myConsults.map(c => (
              <li key={c.id} className="py-2.5">
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span className="tabular-nums">{c.date}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#EEF1F5]">{c.method}</span>
                </div>
                <p className="text-sm text-[#1A1D29] mt-0.5">{c.content}</p>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === '근태' && (
        <div className="space-y-4">
          {/* 요약 */}
          <div className="flex flex-wrap gap-2">
            {WORK_STATUSES.map(s => (
              <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLE[s]}`}>
                {s} <span className="tabular-nums font-bold">{summary[s]}</span>
              </span>
            ))}
          </div>

          {/* 근태일지 */}
          {myAttendance.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#6B7280]">근태 기록이 없습니다.</p>
          ) : (
            <div className="border border-[#E8EBF1] rounded-lg divide-y divide-[#EEF1F5] max-h-56 overflow-y-auto">
              {myAttendance.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-20 tabular-nums text-[#1A1D29]">{r.date.slice(5)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  <span className="text-xs text-[#6B7280] tabular-nums">{r.check_in ?? '--:--'} ~ {r.check_out ?? '--:--'}</span>
                  {r.memo && <span className="text-xs text-[#9CA3AF] ml-auto truncate">{r.memo}</span>}
                </div>
              ))}
            </div>
          )}

          {/* 근태 추가 */}
          <div className="border-t border-[#E8EBF1] pt-3">
            <p className="text-xs font-semibold text-[#6B7280] mb-2">근태 추가</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
              <Input label="날짜" type="date" value={aDate} onChange={e => setADate(e.target.value)} />
              <Select label="상태" value={aStatus} onChange={e => setAStatus(e.target.value as AttendanceWorkStatus)} options={WORK_STATUSES.map(s => ({ value: s, label: s }))} />
              <Input label="출근" type="time" value={aIn} onChange={e => setAIn(e.target.value)} />
              <Input label="퇴근" type="time" value={aOut} onChange={e => setAOut(e.target.value)} />
              <button onClick={addAttendance} className="px-3 py-2 text-sm rounded-md bg-[#2F6BFF] text-white hover:bg-[#1F57E6] transition-colors">추가</button>
            </div>
            <Input className="mt-2" placeholder="메모 (선택)" value={aMemo} onChange={e => setAMemo(e.target.value)} />
          </div>
        </div>
      )}
    </Modal>
  );
}
