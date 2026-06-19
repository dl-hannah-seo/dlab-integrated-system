'use client';

import { useState } from 'react';
import {
  teachers as seedTeachers, subjects as seedSubjects, classes as seedClasses,
  consultations as seedConsultations, teacherAttendance as seedAttendance,
  Teacher, Subject, Class, TeacherAttendance, type TeacherRole,
} from '@/lib/mock-data';
import { eligibleClasses } from '@/lib/teacher-matching';
import { weeklySessions, SESSION_HOURS, WEEKS_PER_MONTH } from '@/lib/teacher-hr';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, MoneyInput } from '@/components/ui/Input';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { TeacherRecordCard } from '@/components/teachers/TeacherRecordCard';

const STATUSES: Teacher['status'][] = ['재직', '휴직', '퇴직'];
const ROLES: TeacherRole[] = ['연구원', '튜터'];
const ROLE_FILTERS = ['전체', '연구원', '튜터'];

const won = (n: number) => n.toLocaleString('ko-KR') + '원';

let subjectSeq = 0;

export default function TeachersPage() {
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>(seedTeachers);
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(seedSubjects);
  const [localClasses, setLocalClasses]   = useState<Class[]>(seedClasses);
  const [localAttendance, setLocalAttendance] = useState<TeacherAttendance[]>(seedAttendance);

  const subjectName = (id: string) => localSubjects.find(s => s.id === id)?.name ?? id;
  const assignedCount = (teacherId: string) => localClasses.filter(c => c.teacher_id === teacherId).length;

  const [roleFilter, setRoleFilter] = useState('전체');
  const visibleTeachers = roleFilter === '전체' ? localTeachers : localTeachers.filter(t => t.role === roleFilter);

  // 인사기록카드
  const [recordTeacher, setRecordTeacher] = useState<Teacher | null>(null);
  function addAttendance(rec: TeacherAttendance) {
    setLocalAttendance(prev => [...prev, rec]);
  }

  // 강사 생성/수정 모달
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [fName, setFName]       = useState('');
  const [fRole, setFRole]       = useState<TeacherRole>('연구원');
  const [fPhone, setFPhone]     = useState('');
  const [fHire, setFHire]       = useState('');
  const [fWage, setFWage]       = useState(0);
  const [fAnnual, setFAnnual]   = useState(0);
  const [fIncentive, setFIncentive] = useState(0);
  const [fStatus, setFStatus]   = useState<Teacher['status']>('재직');
  const [fSubjectIds, setFSubjectIds] = useState<string[]>([]);
  const [fClassIds, setFClassIds]     = useState<Set<string>>(new Set());
  const [fNewSubject, setFNewSubject] = useState('');

  function openCreate() {
    setEditId(null);
    setFName(''); setFRole('연구원'); setFPhone(''); setFHire(''); setFStatus('재직');
    setFWage(0); setFAnnual(0); setFIncentive(0);
    setFSubjectIds([]); setFClassIds(new Set()); setFNewSubject('');
    setShowForm(true);
  }
  function openEdit(t: Teacher) {
    setEditId(t.id);
    setFName(t.name); setFRole(t.role); setFPhone(t.phone ?? ''); setFHire(t.hire_date ?? ''); setFStatus(t.status);
    setFWage(t.hourly_wage ?? 0); setFAnnual(t.annual_salary ?? 0); setFIncentive(t.incentive ?? 0);
    setFSubjectIds([...t.subject_ids]);
    setFClassIds(new Set(localClasses.filter(c => c.teacher_id === t.id).map(c => c.id)));
    setFNewSubject('');
    setShowForm(true);
  }
  function toggleFSubject(id: string) {
    const nextSubjects = fSubjectIds.includes(id) ? fSubjectIds.filter(x => x !== id) : [...fSubjectIds, id];
    setFSubjectIds(nextSubjects);
    setFClassIds(prev => {
      const next = new Set(prev);
      localClasses.forEach(c => { if (!nextSubjects.includes(c.subject_id)) next.delete(c.id); });
      return next;
    });
  }
  function addNewSubject() {
    const name = fNewSubject.trim();
    if (!name) return;
    const existing = localSubjects.find(s => s.name === name);
    if (existing) { if (!fSubjectIds.includes(existing.id)) setFSubjectIds(p => [...p, existing.id]); setFNewSubject(''); return; }
    subjectSeq += 1;
    const id = `sub-new-${subjectSeq}`;
    setLocalSubjects(p => [...p, { id, name, order: p.length + 1 }]);
    setFSubjectIds(p => [...p, id]);
    setFNewSubject('');
  }
  function toggleFClass(id: string) {
    setFClassIds(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function save() {
    if (!fName.trim() || fSubjectIds.length === 0) return;
    const id = editId ?? `tch-new-${Date.now()}`;
    const teacher: Teacher = {
      id, campus_id: 'campus-001', name: fName.trim(), role: fRole,
      subject_ids: [...fSubjectIds], phone: fPhone.trim() || undefined,
      hire_date: fHire || undefined,
      annual_salary: fRole === '연구원' ? (fAnnual || undefined) : undefined,
      hourly_wage: fRole === '튜터' ? (fWage || undefined) : undefined,
      incentive: fIncentive || undefined,
      status: fStatus,
    };
    setLocalTeachers(p => editId ? p.map(t => t.id === id ? teacher : t) : [...p, teacher]);
    setLocalClasses(p => p.map(c => {
      if (fClassIds.has(c.id)) return { ...c, teacher_id: id, teacher: teacher.name };
      if (c.teacher_id === id) return { ...c, teacher_id: undefined, teacher: '' };
      return c;
    }));
    setShowForm(false);
  }
  function removeTeacher(id: string) {
    setLocalTeachers(p => p.filter(t => t.id !== id));
    setLocalClasses(p => p.map(c => c.teacher_id === id ? { ...c, teacher_id: undefined, teacher: '' } : c));
  }

  const formClasses = eligibleClasses(fSubjectIds, localClasses);

  // 폼에서 선택한 반 기준 예상 월급여 미리보기
  // 연구원: 연봉 ÷ 12 / 튜터: 시급 × 선택 반 추정 시수
  const formWeekly = localClasses.filter(c => fClassIds.has(c.id)).reduce((s, c) => s + weeklySessions(c), 0);
  const formHours = formWeekly * SESSION_HOURS * WEEKS_PER_MONTH;
  const formSalary = fRole === '연구원'
    ? Math.round(fAnnual / 12)
    : Math.round(formHours * fWage) + fIncentive;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1A1D29]">강사 관리</h1>
        <Button onClick={openCreate}>＋ 강사 추가</Button>
      </div>

      {/* 역할 필터 */}
      <div className="inline-flex rounded-lg border border-[#E8EBF1] bg-white p-0.5 mb-4">
        {ROLE_FILTERS.map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              roleFilter === r ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium' : 'text-[#6B7280] hover:text-[#1A1D29]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* 강사 목록 */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F6FA] text-[#6B7280]">
            <tr>
              <th className="text-left font-medium px-4 py-3">이름</th>
              <th className="text-left font-medium px-4 py-3">역할</th>
              <th className="text-left font-medium px-4 py-3">가르칠 수 있는 과목</th>
              <th className="text-left font-medium px-4 py-3">담임 반</th>
              <th className="text-left font-medium px-4 py-3">입사일</th>
              <th className="text-left font-medium px-4 py-3">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visibleTeachers.map(t => (
              <tr key={t.id} className="border-t border-[#E8EBF1] hover:bg-[#F4F6FA]">
                <td className="px-4 py-3">
                  <button onClick={() => setRecordTeacher(t)} className="text-[#1A1D29] font-medium hover:text-[#2F6BFF] hover:underline">{t.name}</button>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#EAF1FF] text-[#2F6BFF]">{t.role}</span>
                </td>
                <td className="px-4 py-3 text-[#1A1D29]">{t.subject_ids.map(subjectName).join(', ')}</td>
                <td className="px-4 py-3 text-[#6B7280]">{assignedCount(t.id)}개</td>
                <td className="px-4 py-3 text-[#6B7280] tabular-nums">{t.hire_date ?? '-'}</td>
                <td className="px-4 py-3 text-[#6B7280]">{t.status}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" onClick={() => openEdit(t)} className="text-sm text-[#1A1D29] hover:underline mr-3">수정</button>
                  <DeleteButton onClick={() => removeTeacher(t.id)}>삭제</DeleteButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 인사기록카드 */}
      {recordTeacher && (
        <TeacherRecordCard
          teacher={recordTeacher}
          subjects={localSubjects}
          classes={localClasses}
          consultations={seedConsultations}
          attendance={localAttendance}
          onAddAttendance={addAttendance}
          onClose={() => setRecordTeacher(null)}
        />
      )}

      {/* 생성/수정 모달 */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={`${fRole} ${editId ? '수정' : '추가'}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>취소</Button>
            <Button onClick={save} disabled={!fName.trim() || fSubjectIds.length === 0}>저장</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={<>이름 <span className="text-[#F2474B]">*</span></>} value={fName} onChange={e => setFName(e.target.value)} placeholder="예: 메튜" />
            <Select label="역할" value={fRole} onChange={e => setFRole(e.target.value as TeacherRole)} options={ROLES.map(r => ({ value: r, label: r }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="연락처" value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="010-0000-0000" />
            <Input label="입사일" type="date" value={fHire} onChange={e => setFHire(e.target.value)} />
            <Select label="상태" value={fStatus} onChange={e => setFStatus(e.target.value as Teacher['status'])} options={STATUSES.map(s => ({ value: s, label: s }))} />
          </div>

          {/* 급여 — 연구원: 연봉 / 튜터: 시급 + 학기 인센티브 + 예상 월급여 자동 산출 */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {fRole === '연구원' ? (
                <MoneyInput label="연봉" value={fAnnual} onValueChange={setFAnnual} suffix="원" placeholder="예: 42,000,000" />
              ) : (
                <MoneyInput label="시급" value={fWage} onValueChange={setFWage} suffix="원" placeholder="예: 15,000" />
              )}
              <MoneyInput label="학기 인센티브" value={fIncentive} onValueChange={setFIncentive} suffix="원" placeholder="예: 600,000" />
            </div>
            <div className="mt-2 bg-[#F4F6FA] rounded-md px-3 py-2.5 text-sm text-[#6B7280]">
              예상 월급여{' '}
              <span className="font-semibold text-[#1A1D29]">{won(formSalary)}</span>
              <span className="text-xs text-[#9CA3AF]">
                {fRole === '연구원'
                  ? ' · 연봉 ÷ 12 기준'
                  : ` · 선택 반 주 ${formWeekly}회 × ${SESSION_HOURS}h ≈ 월 ${Math.round(formHours)}h 기준(추정)`}
              </span>
            </div>
          </div>

          {/* 가르칠 수 있는 과목 — 칩 선택 + 신규 과목 인라인 추가 */}
          <div>
            <label className="block text-sm font-medium text-[#1A1D29] mb-1.5">
              가르칠 수 있는 과목 <span className="text-[#F2474B]">*</span> <span className="text-xs font-normal text-[#6B7280]">(복수 선택)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {localSubjects.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleFSubject(s.id)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-all ${
                    fSubjectIds.includes(s.id)
                      ? 'bg-[#2F6BFF] text-white border-[#2F6BFF]'
                      : 'bg-[#F4F6FA] text-[#6B7280] border-[#E8EBF1] hover:border-[#2F6BFF]/50'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="신규 과목 입력 후 추가 (예: 스크래치)"
                value={fNewSubject}
                onChange={e => setFNewSubject(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewSubject(); } }}
                className="max-w-xs"
              />
              <Button variant="secondary" onClick={addNewSubject} disabled={!fNewSubject.trim()}>＋ 과목 추가</Button>
            </div>
          </div>

          {/* 맡을 반 — 선택 과목 해당 반만 */}
          <div>
            <label className="block text-sm font-medium text-[#1A1D29] mb-1.5">맡을 반 <span className="text-xs font-normal text-[#6B7280]">(담임)</span></label>
            {fSubjectIds.length === 0 ? (
              <p className="text-sm text-[#6B7280] bg-[#F4F6FA] border border-[#E8EBF1] rounded-md px-3 py-3">과목을 먼저 선택하세요.</p>
            ) : formClasses.length === 0 ? (
              <p className="text-sm text-[#6B7280] bg-[#F4F6FA] border border-[#E8EBF1] rounded-md px-3 py-3">선택한 과목의 반이 없습니다.</p>
            ) : (
              <div className="border border-[#E8EBF1] rounded-md divide-y max-h-48 overflow-y-auto">
                {formClasses.map(c => {
                  const other = c.teacher_id && c.teacher_id !== editId ? c.teacher : '';
                  return (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F4F6FA]">
                      <input type="checkbox" checked={fClassIds.has(c.id)} onChange={() => toggleFClass(c.id)} className="w-4 h-4 accent-[#2F6BFF]" />
                      <span className="text-sm text-[#1A1D29]">{c.name}</span>
                      {other && fClassIds.has(c.id) && (
                        <span className="text-xs text-[#2F6BFF] ml-auto">현재 담임 {other} → 교체</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
