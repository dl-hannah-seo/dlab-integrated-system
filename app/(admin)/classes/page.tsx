'use client';

import { useState } from 'react';
import { classes, classGroups, semesters as mockSemesters, students, enrollments, Class, Semester, Enrollment } from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { DeleteButton } from '@/components/ui/DeleteButton';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

function formatMoney(n: number) { return n.toLocaleString('ko-KR') + '원'; }
function parseMoney(s: string) { return Number(s.replace(/[^0-9]/g, '')) || 0; }

function computeWeeks(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function buildAutoName(year: number, season: string, days: string[], time: string, course: string, teacher: string) {
  if (!year || !season || days.length === 0 || !time || !course || !teacher) return '';
  return `${year}${season}${days.join('')}${time.replace(':', '')}/${course.replace(/\s/g, '')}/${teacher}`;
}

export default function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState<Class | null>(classes[0]);
  const [localClasses, setLocalClasses]   = useState<Class[]>(classes);
  const [localSemesters, setLocalSemesters] = useState<Semester[]>(mockSemesters);

  const [filterActive, setFilterActive] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ '2026년 여름': true });

  const [showCreate, setShowCreate]     = useState(false);
  const [showClone, setShowClone]       = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [confirmDeleteClass, setConfirmDeleteClass] = useState(false);

  // 새 반 생성 폼
  const [createYear, setCreateYear]           = useState(() => new Date().getFullYear());
  const [createSeason, setCreateSeason]       = useState('');
  const [createDays, setCreateDays]           = useState<string[]>([]);
  const [createTime, setCreateTime]           = useState('09:00');
  const [createCourse, setCreateCourse]       = useState('');
  const [createTeacher, setCreateTeacher]     = useState('');
  const [createTeamLead, setCreateTeamLead]   = useState('');
  const [createCapacity, setCreateCapacity]   = useState(15);
  const [createStart, setCreateStart]         = useState('');
  const [createEnd, setCreateEnd]             = useState('');
  const [createTuition, setCreateTuition]     = useState(180000);
  const [createMaterial, setCreateMaterial]   = useState(20000);
  const [createContent, setCreateContent]     = useState(10000);
  const [createPayMethod, setCreatePayMethod] = useState<'매월' | '일시'>('매월');
  const [createDueDay, setCreateDueDay]       = useState(1);

  // 반 편집 폼
  const [showEdit, setShowEdit]           = useState(false);
  const [editYear, setEditYear]           = useState(() => new Date().getFullYear());
  const [editSeason, setEditSeason]       = useState('봄');
  const [editDays, setEditDays]           = useState<string[]>([]);
  const [editTime, setEditTime]           = useState('09:00');
  const [editCourse, setEditCourse]       = useState('');
  const [editTeacher, setEditTeacher]     = useState('');
  const [editTeamLead, setEditTeamLead]   = useState('');
  const [editCapacity, setEditCapacity]   = useState(15);
  const [editStart, setEditStart]         = useState('');
  const [editEnd, setEditEnd]             = useState('');
  const [editTuition, setEditTuition]     = useState(180000);
  const [editMaterial, setEditMaterial]   = useState(20000);
  const [editContent, setEditContent]     = useState(10000);
  const [editPayMethod, setEditPayMethod] = useState<'매월' | '일시'>('매월');
  const [editDueDay, setEditDueDay]       = useState(1);

  // 학기 편집 모달
  const [editSemItem, setEditSemItem]     = useState<Semester | null>(null);
  const [editSemYear, setEditSemYear]     = useState(2026);
  const [editSemSeason, setEditSemSeason] = useState('봄');

  // 복제 폼
  const [cloneFrom, setCloneFrom]   = useState(localSemesters[0]?.id ?? '');
  const [cloneTo, setCloneTo]       = useState(localSemesters[1]?.id ?? '');
  const [cloneStart, setCloneStart] = useState('');

  const [localEnrollments, setLocalEnrollments] = useState<Enrollment[]>(enrollments);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [pendingEnroll, setPendingEnroll] = useState<{ id: string; name: string } | null>(null);
  const [pendingUnenroll, setPendingUnenroll] = useState<{ id: string; name: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const enrolledStudents = selectedClass
    ? localEnrollments
        .filter(e => e.class_id === selectedClass.id && e.ended_at === null)
        .map(e => students.find(s => s.id === e.student_id))
        .filter(Boolean)
    : [];

  const enrollableStudents = selectedClass
    ? students.filter(s => {
        const alreadyIn = localEnrollments.some(e => e.student_id === s.id && e.class_id === selectedClass.id && e.ended_at === null);
        const q = enrollSearch.trim();
        const matches = !q || s.name.includes(q) || s.grade.includes(q) || s.school.includes(q);
        return !alreadyIn && s.status !== '퇴원' && matches;
      })
    : [];

  function handleEnroll(studentId: string) {
    if (!selectedClass) return;
    const prev = localEnrollments.find(e => e.student_id === studentId && e.class_id === selectedClass.id && e.ended_at !== null);
    if (prev) {
      setLocalEnrollments(p => p.map(e => e.id === prev.id ? { ...e, ended_at: null, end_reason: null } : e));
    } else {
      const newEnrollment: Enrollment = {
        id: `enr-${Date.now()}`,
        student_id: studentId,
        class_id: selectedClass.id,
        started_at: today,
        ended_at: null,
        end_reason: null,
      };
      setLocalEnrollments(p => [...p, newEnrollment]);
    }
    setLocalClasses(p => p.map(c => c.id === selectedClass.id ? { ...c, enrolled_count: c.enrolled_count + 1 } : c));
    setSelectedClass(prev => prev ? { ...prev, enrolled_count: prev.enrolled_count + 1 } : prev);
  }

  function handleUnenroll(studentId: string) {
    if (!selectedClass) return;
    setLocalEnrollments(p => p.map(e =>
      e.student_id === studentId && e.class_id === selectedClass.id && e.ended_at === null
        ? { ...e, ended_at: today, end_reason: '퇴반' }
        : e
    ));
    setLocalClasses(p => p.map(c => c.id === selectedClass.id ? { ...c, enrolled_count: Math.max(0, c.enrolled_count - 1) } : c));
    setSelectedClass(prev => prev ? { ...prev, enrolled_count: Math.max(0, prev.enrolled_count - 1) } : prev);
  }

  const allSemesterTree = localSemesters.map(sem => {
    const semGroups  = classGroups.filter(g => g.semester_id === sem.id);
    const semClasses = localClasses.filter(c =>
      semGroups.some(g => g.id === c.class_group_id) || c.semester_id === sem.id
    );
    const isEnded = semClasses.length > 0 && semClasses.every(c => c.end_date < today);
    return { key: `${sem.year}년 ${sem.season}`, sem, semClasses, isEnded };
  });

  const semesterTree = filterActive
    ? allSemesterTree.filter(({ isEnded }) => !isEnded)
    : allSemesterTree;

  const autoName      = buildAutoName(createYear, createSeason, createDays, createTime, createCourse, createTeacher);
  const computedWeeks = computeWeeks(createStart, createEnd);

  function toggleDay(day: string) {
    setCreateDays(p =>
      p.includes(day)
        ? p.filter(d => d !== day)
        : [...p, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
    );
  }

  function toggleEditDay(day: string) {
    setEditDays(p =>
      p.includes(day)
        ? p.filter(d => d !== day)
        : [...p, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
    );
  }

  function handleCreateClass() {
    if (createDays.length === 0 || !createCourse || !createTeacher || !createTeamLead) return;

    let sem = localSemesters.find(s => s.year === createYear && s.season === createSeason);
    if (!sem) {
      sem = { id: `sem-${Date.now()}`, campus_id: 'campus-001', year: createYear, season: createSeason, courses: [] };
      setLocalSemesters(p => [...p, sem!]);
    }

    const newClass: Class = {
      id: `cl-new-${Date.now()}`,
      campus_id: 'campus-001',
      class_group_id: `cg-new-${Date.now()}`,
      semester_id: sem.id,
      course: createCourse,
      name: autoName,
      teacher: createTeacher,
      team_lead: createTeamLead,
      capacity: createCapacity,
      start_date: createStart,
      end_date: createEnd,
      schedule: `${createDays.join('·')} ${createTime}`,
      payment_method: createPayMethod,
      payment_due_day: createDueDay,
      tuition_fee: createTuition,
      material_fee: createMaterial,
      content_fee: createContent,
      enrolled_count: 0,
    };
    setLocalClasses(p => [...p, newClass]);
    setSelectedClass(newClass);
    setExpanded(p => ({ ...p, [`${createYear}년 ${createSeason}`]: true }));
    setShowCreate(false);
    setCreateDays([]); setCreateTime('09:00'); setCreateCourse('');
    setCreateTeacher(''); setCreateTeamLead('');
  }

  function openEdit(cls: Class) {
    const sem = localSemesters.find(s => s.id === cls.semester_id);
    if (sem) { setEditYear(sem.year); setEditSeason(sem.season); }
    const parts = cls.schedule.split(' ');
    setEditDays(parts[0]?.split('·') ?? []);
    setEditTime(parts[1] ?? '09:00');
    setEditCourse(cls.course);
    setEditTeacher(cls.teacher);
    setEditTeamLead(cls.team_lead);
    setEditCapacity(cls.capacity);
    setEditStart(cls.start_date);
    setEditEnd(cls.end_date);
    setEditTuition(cls.tuition_fee);
    setEditMaterial(cls.material_fee);
    setEditContent(cls.content_fee);
    setEditPayMethod(cls.payment_method);
    setEditDueDay(cls.payment_due_day);
    setShowEdit(true);
  }

  function handleEditClass() {
    if (!selectedClass || editDays.length === 0 || !editCourse || !editTeacher || !editTeamLead) return;
    let sem = localSemesters.find(s => s.year === editYear && s.season === editSeason);
    if (!sem) {
      sem = { id: `sem-${Date.now()}`, campus_id: 'campus-001', year: editYear, season: editSeason, courses: [] };
      setLocalSemesters(p => [...p, sem!]);
    }
    const updated: Class = {
      ...selectedClass,
      semester_id: sem.id,
      course: editCourse,
      name: buildAutoName(editYear, editSeason, editDays, editTime, editCourse, editTeacher),
      teacher: editTeacher,
      team_lead: editTeamLead,
      capacity: editCapacity,
      start_date: editStart,
      end_date: editEnd,
      schedule: `${editDays.join('·')} ${editTime}`,
      payment_method: editPayMethod,
      payment_due_day: editDueDay,
      tuition_fee: editTuition,
      material_fee: editMaterial,
      content_fee: editContent,
    };
    setLocalClasses(p => p.map(c => c.id === selectedClass.id ? updated : c));
    setSelectedClass(updated);
    setExpanded(p => ({ ...p, [`${editYear}년 ${editSeason}`]: true }));
    setShowEdit(false);
  }

  function handleDeleteClass() {
    if (!selectedClass) return;
    const remaining = localClasses.filter(c => c.id !== selectedClass.id);
    setLocalClasses(remaining);
    setSelectedClass(remaining[0] ?? null);
    setConfirmDeleteClass(false);
  }

  function openEditSem(sem: Semester) {
    setEditSemItem(sem);
    setEditSemYear(sem.year);
    setEditSemSeason(sem.season);
  }

  function handleEditSemSave() {
    if (!editSemItem) return;
    setLocalSemesters(p => p.map(s => s.id === editSemItem.id
      ? { ...s, year: editSemYear, season: editSemSeason }
      : s
    ));
    setEditSemItem(null);
  }

  const semLabel = (id: string) => {
    const s = localSemesters.find(x => x.id === id);
    return s ? `${s.year}년 ${s.season}` : '-';
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">반 관리</h1>
          <p className="text-sm text-[#787774] mt-1">학기별 반 생성/삭제 · 편집 · 수강료 설정 · 이전 학기 복제 · 입반 등록</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowClone(true)}>이전 학기 복제</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            새 반 생성
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 좌측 트리 */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#E9E9E7] bg-[#F7F7F5] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#787774] uppercase tracking-wide">반 목록</span>
              <button
                onClick={() => setFilterActive(p => !p)}
                className="flex items-center gap-1 group"
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  !filterActive ? 'bg-[#FF6C37] border-[#FF6C37]' : 'border-[#C7C6C3] bg-white'
                }`}>
                  {!filterActive && (
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-[#787774] group-hover:text-[#37352F] transition-colors">종강반 표시</span>
              </button>
            </div>
            <div className="divide-y divide-[#E9E9E7]">
              {semesterTree.length === 0 && (
                <p className="px-4 py-6 text-xs text-[#787774] text-center">표시할 학기가 없습니다</p>
              )}
              {semesterTree.map(({ key, sem, semClasses }) => (
                <div key={key}>
                  <div
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#37352F] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                    onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      className={`flex-shrink-0 transition-transform ${expanded[key] ? 'rotate-90' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="flex-1">{key}</span>
                    <button
                      onClick={e => { e.stopPropagation(); openEditSem(sem); }}
                      className="p-0.5 rounded hover:bg-[#E9E9E7] text-[#787774] transition-colors"
                      title="그룹명 편집"
                    >
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  {expanded[key] && (
                    semClasses.length === 0 ? (
                      <div className="px-6 py-2 text-xs text-[#787774]">
                        반이 없습니다.{' '}
                        <button className="text-[#FF6C37] underline" onClick={() => {
                          setCreateYear(sem.year);
                          setCreateSeason(sem.season);
                          setShowCreate(true);
                        }}>+ 반 추가</button>
                      </div>
                    ) : (
                      semClasses.map(cls => (
                        <button
                          key={cls.id}
                          onClick={() => setSelectedClass(cls)}
                          className={`w-full text-left px-6 py-2 text-sm transition-colors ${
                            selectedClass?.id === cls.id
                              ? 'bg-[#FFF1EC] text-[#FF6C37] font-medium'
                              : 'text-[#37352F] hover:bg-[#F7F7F5]'
                          }`}
                        >
                          <div className="font-medium">{cls.schedule}</div>
                          <div className="text-xs text-[#787774] truncate">{cls.course} · {cls.teacher}</div>
                        </button>
                      ))
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 상세 */}
        {selectedClass ? (
          <div className="flex-1 space-y-5">
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-mono text-[#787774] mb-0.5">{selectedClass.name}</p>
                  <p className="text-base font-bold text-[#37352F]">{selectedClass.schedule} · {selectedClass.course}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => openEdit(selectedClass)}>편집</Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#F7F7F5] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#37352F] tabular-nums">
                    {selectedClass.enrolled_count}
                    <span className="text-base font-normal text-[#787774]">/{selectedClass.capacity}</span>
                  </div>
                  <div className="text-xs text-[#787774] mt-1">수강 인원</div>
                </div>
                <div className="bg-[#F7F7F5] rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-[#37352F] tabular-nums">
                    {computeWeeks(selectedClass.start_date, selectedClass.end_date)}주
                  </div>
                  <div className="text-xs text-[#787774] mt-0.5">
                    {selectedClass.start_date.slice(5).replace('-', '/')} ~ {selectedClass.end_date.slice(5).replace('-', '/')}
                  </div>
                </div>
                <div className="bg-[#F7F7F5] rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-[#FF6C37] tabular-nums">
                    {formatMoney(selectedClass.tuition_fee + selectedClass.material_fee + selectedClass.content_fee)}
                  </div>
                  <div className="text-xs text-[#787774] mt-1">월 수강료 합계</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#37352F]">
                  수강 학생
                  <span className="ml-1.5 text-[#787774] font-normal">
                    {enrolledStudents.length}/{selectedClass.capacity}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setEnrollSearch(''); setShowEnrollModal(true); }}
                  disabled={enrolledStudents.length >= selectedClass.capacity}
                >
                  + 입반
                </Button>
              </div>
              {enrolledStudents.length === 0 ? (
                <p className="text-sm text-[#787774] py-2">등록된 학생이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4">
                  {enrolledStudents.map(student => (
                    <div key={student!.id} className="py-2 border-b border-[#E9E9E7]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#37352F]">{student!.name}</span>
                        <button
                          onClick={() => setPendingUnenroll({ id: student!.id, name: student!.name })}
                          className="text-xs text-[#787774] hover:text-[#DC2626] transition-colors px-2 py-0.5 rounded hover:bg-[#FEF2F2] flex-shrink-0"
                        >
                          퇴반
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-[#787774]">{student!.grade} · {student!.school}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          student!.status === '재원' ? 'bg-[#F0FDF4] text-[#0F7B6C]' :
                          student!.status === '휴원' ? 'bg-[#FFF8E1] text-[#B45309]' :
                          'bg-[#FEF2F2] text-[#DC2626]'
                        }`}>
                          {student!.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="수강료 세부내역">
              <div className="space-y-3">
                {[
                  { label: '교육비 (비과세)', amount: selectedClass.tuition_fee },
                  { label: '교구 대여비 (과세)', amount: selectedClass.material_fee },
                  { label: '콘텐츠 사용비', amount: selectedClass.content_fee },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#E9E9E7] last:border-0">
                    <span className="text-sm text-[#37352F]">{item.label}</span>
                    <span className="text-sm font-medium tabular-nums">{formatMoney(item.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-[#37352F]">합계</span>
                  <span className="text-base font-bold text-[#FF6C37] tabular-nums">
                    {formatMoney(selectedClass.tuition_fee + selectedClass.material_fee + selectedClass.content_fee)}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="반 설정">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: '담임', value: selectedClass.teacher },
                  { label: '팀장', value: selectedClass.team_lead },
                  { label: '수강 기간', value: `${selectedClass.start_date} ~ ${selectedClass.end_date}` },
                  { label: '납입기준일', value: `매월 ${selectedClass.payment_due_day}일` },
                  { label: '수납방식', value: selectedClass.payment_method },
                  { label: '잔여석', value: `${selectedClass.capacity - selectedClass.enrolled_count}석` },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-xs text-[#787774]">{item.label}</div>
                    <div className="text-sm font-medium text-[#37352F] mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-[#E9E9E7] flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#37352F]">반 삭제</p>
                  <p className="text-xs text-[#787774] mt-0.5">삭제하면 이 반 설정이 영구히 제거됩니다.</p>
                </div>
                <DeleteButton onClick={() => setConfirmDeleteClass(true)}>반 삭제</DeleteButton>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <p className="text-sm text-[#787774]">좌측에서 반을 선택하세요</p>
          </div>
        )}
      </div>

      {/* ── 새 반 생성 모달 ── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="새 반 생성"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>취소</Button>
            <Button onClick={handleCreateClass} disabled={createDays.length === 0 || !createCourse || !createTeacher || !createTeamLead}>
              반 생성
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* 연도 + 시즌 */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="연도"
              type="number"
              min={2020}
              value={String(createYear)}
              onChange={e => setCreateYear(Number(e.target.value))}
            />
            <Input
              label="구분명"
              type="text"
              placeholder="예: 봄학기"
              value={createSeason}
              onChange={e => setCreateSeason(e.target.value)}
            />
          </div>

          {/* 요일 */}
          <div>
            <label className="block text-sm font-medium text-[#37352F] mb-1.5">
              요일 <span className="text-xs font-normal text-[#787774]">(복수 선택 가능)</span>
            </label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    createDays.includes(day)
                      ? 'bg-[#FF6C37] text-white shadow-sm'
                      : 'bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7] hover:border-[#FF6C37]/50'
                  }`}>
                  {day}
                </button>
              ))}
            </div>
            {createDays.length > 0 && (
              <p className="text-xs text-[#FF6C37] mt-1.5 font-medium">선택: {createDays.join('·')}요일</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="시작 시간" type="time" value={createTime} onChange={e => setCreateTime(e.target.value)} />
            <Input
              label="과정"
              type="text"
              placeholder="예: 파이썬 기초"
              value={createCourse}
              onChange={e => setCreateCourse(e.target.value)}
            />
          </div>

          {/* 담임 + 책임 연구원 */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="담임"
              type="text"
              placeholder="예: 메튜"
              value={createTeacher}
              onChange={e => setCreateTeacher(e.target.value)}
            />
            <Input
              label="팀장"
              type="text"
              placeholder="예: 톰"
              value={createTeamLead}
              onChange={e => setCreateTeamLead(e.target.value)}
            />
          </div>

          <div className={`rounded-lg px-4 py-3 border ${autoName ? 'bg-[#F0FDF4] border-[#0F7B6C]/20' : 'bg-[#F7F7F5] border-[#E9E9E7]'}`}>
            <p className="text-xs text-[#787774] mb-1">자동 생성 반명</p>
            {autoName
              ? <p className="text-sm font-mono font-semibold text-[#0F7B6C]">{autoName}</p>
              : <p className="text-sm text-[#787774]">학기·요일·시간·과정·담임을 입력하면 자동 생성됩니다</p>
            }
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="정원" type="number" value={String(createCapacity)} onChange={e => setCreateCapacity(Number(e.target.value))} suffix="명" />
            <Input label="수강 시작일" type="date" value={createStart} onChange={e => setCreateStart(e.target.value)} />
            <Input label="수강 종료일" type="date" value={createEnd} onChange={e => setCreateEnd(e.target.value)} />
          </div>
          {computedWeeks > 0 && (
            <p className="text-xs text-[#0F7B6C] -mt-2">→ {computedWeeks}주 과정</p>
          )}

          <div className="border-t border-[#E9E9E7] pt-4">
            <p className="text-xs font-semibold text-[#787774] mb-3">수강료 세부내역 (청구 템플릿)</p>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="교육비 (비과세)"
                type="text"
                value={createTuition.toLocaleString('ko-KR')}
                onChange={e => setCreateTuition(parseMoney(e.target.value))}
                suffix="원"
              />
              <Input
                label="교구 대여비 (과세)"
                type="text"
                value={createMaterial.toLocaleString('ko-KR')}
                onChange={e => setCreateMaterial(parseMoney(e.target.value))}
                suffix="원"
              />
              <Input
                label="콘텐츠 사용비"
                type="text"
                value={createContent.toLocaleString('ko-KR')}
                onChange={e => setCreateContent(parseMoney(e.target.value))}
                suffix="원"
              />
            </div>
            <p className="text-right text-sm font-bold text-[#FF6C37] mt-2">
              합계 {formatMoney(createTuition + createMaterial + createContent)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="수납방식"
              value={createPayMethod}
              onChange={e => setCreatePayMethod(e.target.value as '매월' | '일시')}
              options={[{ value: '매월', label: '매월' }, { value: '일시', label: '일시' }]}
            />
            <Input label="납입기준일" type="number" value={String(createDueDay)} onChange={e => setCreateDueDay(Number(e.target.value))} suffix="일" />
          </div>
        </div>
      </Modal>

      {/* ── 이전 학기 복제 모달 ── */}
      <Modal
        open={showClone}
        onClose={() => setShowClone(false)}
        title="이전 학기 반 복제"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowClone(false)}>취소</Button>
            <Button onClick={() => { setCloneSuccess(true); setTimeout(() => { setShowClone(false); setCloneSuccess(false); }, 1500); }} loading={cloneSuccess}>
              {cloneSuccess ? '복제 완료!' : '전체 복제 실행'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-[#FFF1EC] border border-[#FF6C37]/20 rounded-lg px-5 py-4 flex items-start gap-3">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#FF6C37" strokeWidth={2} className="mt-0.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-[#787774] mt-0.5">원본 학기의 반 구성(요일·시간·수강료·담임)을 대상 학기로 복사합니다. 학생 배정은 별도로 진행하세요.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="복제 원본"
              value={cloneFrom}
              onChange={e => setCloneFrom(e.target.value)}
              options={localSemesters.map(s => ({ value: s.id, label: `${s.year}년 ${s.season}학기` }))}
            />
            <Select
              label="복제 대상"
              value={cloneTo}
              onChange={e => setCloneTo(e.target.value)}
              options={localSemesters.map(s => ({ value: s.id, label: `${s.year}년 ${s.season}학기` }))}
            />
          </div>
          <Input label="복제 후 수강 시작일" type="date" value={cloneStart} onChange={e => setCloneStart(e.target.value)} />
          <div className="bg-[#F7F7F5] rounded-lg px-4 py-3 text-sm text-[#787774]">
            <span className="font-semibold text-[#37352F]">{semLabel(cloneFrom)}</span>의 반 구성을{' '}
            <span className="font-semibold text-[#37352F]">{semLabel(cloneTo)}</span>으로 복제합니다.
          </div>
        </div>
      </Modal>

      {/* ── 반 편집 모달 ── */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="반 편집"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>취소</Button>
            <Button onClick={handleEditClass} disabled={editDays.length === 0 || !editCourse || !editTeacher || !editTeamLead}>
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* 연도 + 시즌 */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="연도"
              type="number"
              min={2020}
              value={String(editYear)}
              onChange={e => setEditYear(Number(e.target.value))}
            />
            <Input
              label="구분명"
              type="text"
              placeholder="예: 여름, 1학기, 특강"
              value={editSeason}
              onChange={e => setEditSeason(e.target.value)}
            />
          </div>

          {/* 요일 */}
          <div>
            <label className="block text-sm font-medium text-[#37352F] mb-1.5">
              요일 <span className="text-xs font-normal text-[#787774]">(복수 선택 가능)</span>
            </label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleEditDay(day)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    editDays.includes(day)
                      ? 'bg-[#FF6C37] text-white shadow-sm'
                      : 'bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7] hover:border-[#FF6C37]/50'
                  }`}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="시작 시간" type="time" value={editTime} onChange={e => setEditTime(e.target.value)} />
            <Input label="과정" type="text" value={editCourse} onChange={e => setEditCourse(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="담임" type="text" value={editTeacher} onChange={e => setEditTeacher(e.target.value)} />
            <Input label="팀장" type="text" value={editTeamLead} onChange={e => setEditTeamLead(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="정원" type="number" value={String(editCapacity)} onChange={e => setEditCapacity(Number(e.target.value))} suffix="명" />
            <Input label="수강 시작일" type="date" value={editStart} onChange={e => setEditStart(e.target.value)} />
            <Input label="수강 종료일" type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
          </div>

          <div className="border-t border-[#E9E9E7] pt-4">
            <p className="text-xs font-semibold text-[#787774] mb-3">수강료 세부내역</p>
            <div className="grid grid-cols-3 gap-2">
              <Input label="교육비 (비과세)" type="text" value={editTuition.toLocaleString('ko-KR')} onChange={e => setEditTuition(parseMoney(e.target.value))} suffix="원" />
              <Input label="교구 대여비 (과세)" type="text" value={editMaterial.toLocaleString('ko-KR')} onChange={e => setEditMaterial(parseMoney(e.target.value))} suffix="원" />
              <Input label="콘텐츠 사용비" type="text" value={editContent.toLocaleString('ko-KR')} onChange={e => setEditContent(parseMoney(e.target.value))} suffix="원" />
            </div>
            <p className="text-right text-sm font-bold text-[#FF6C37] mt-2">
              합계 {formatMoney(editTuition + editMaterial + editContent)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="수납방식"
              value={editPayMethod}
              onChange={e => setEditPayMethod(e.target.value as '매월' | '일시')}
              options={[{ value: '매월', label: '매월' }, { value: '일시', label: '일시' }]}
            />
            <Input label="납입기준일" type="number" value={String(editDueDay)} onChange={e => setEditDueDay(Number(e.target.value))} suffix="일" />
          </div>
        </div>
      </Modal>
      {/* ── 학기 편집 모달 ── */}
      <Modal
        open={editSemItem !== null}
        onClose={() => setEditSemItem(null)}
        title="그룹명 편집"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditSemItem(null)}>취소</Button>
            <Button onClick={handleEditSemSave}>저장</Button>
          </>
        }
      >
        {editSemItem && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="연도"
              type="number"
              min={2020}
              value={String(editSemYear)}
              onChange={e => setEditSemYear(Number(e.target.value))}
            />
            <Input
              label="구분명"
              type="text"
              placeholder="예: 여름, 1학기, 특강"
              value={editSemSeason}
              onChange={e => setEditSemSeason(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {/* ── 반 삭제 확인 모달 ── */}
      {confirmDeleteClass && selectedClass && (
        <Modal
          open={confirmDeleteClass}
          onClose={() => setConfirmDeleteClass(false)}
          title="반 삭제"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmDeleteClass(false)}>취소</Button>
              <Button variant="danger" onClick={handleDeleteClass}>삭제</Button>
            </>
          }
        >
          <p className="text-sm text-[#37352F]">
            <span className="font-mono font-semibold">{selectedClass.name}</span> 반을 삭제하시겠습니까?
          </p>
          {selectedClass.enrolled_count > 0 && (
            <div className="mt-3 bg-[#FFF1EC] border border-[#FF6C37]/20 rounded-md px-3 py-2">
              <p className="text-xs text-[#FF6C37] font-medium">
                현재 {selectedClass.enrolled_count}명이 수강 중입니다. 삭제 전 학생을 다른 반으로 이동하세요.
              </p>
            </div>
          )}
          <p className="text-xs text-[#787774] mt-2">이 작업은 되돌릴 수 없습니다.</p>
        </Modal>
      )}

      {/* ── 입반 확인 모달 ── */}
      {pendingEnroll && selectedClass && (
        <Modal
          open={!!pendingEnroll}
          onClose={() => setPendingEnroll(null)}
          title="입반 확인"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPendingEnroll(null)}>취소</Button>
              <Button onClick={() => { handleEnroll(pendingEnroll.id); setPendingEnroll(null); setShowEnrollModal(false); }}>
                입반
              </Button>
            </>
          }
        >
          <p className="text-sm text-[#37352F]">
            <span className="font-semibold">{pendingEnroll.name}</span> 학생을{' '}
            <span className="font-semibold">{selectedClass.schedule} · {selectedClass.course}</span>에 입반하시겠습니까?
          </p>
        </Modal>
      )}

      {/* ── 퇴반 확인 모달 ── */}
      {pendingUnenroll && selectedClass && (
        <Modal
          open={!!pendingUnenroll}
          onClose={() => setPendingUnenroll(null)}
          title="퇴반 확인"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPendingUnenroll(null)}>취소</Button>
              <Button variant="danger" onClick={() => { handleUnenroll(pendingUnenroll.id); setPendingUnenroll(null); }}>
                퇴반
              </Button>
            </>
          }
        >
          <p className="text-sm text-[#37352F]">
            <span className="font-semibold">{pendingUnenroll.name}</span> 학생을 이 반에서 퇴반 처리하시겠습니까?
          </p>
          <p className="text-xs text-[#787774] mt-2">퇴반 후에도 원생 관리에서 다시 입반할 수 있습니다.</p>
        </Modal>
      )}

      {/* ── 입반 모달 ── */}
      {showEnrollModal && selectedClass && (
        <Modal
          open={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          title={`입반 — ${selectedClass.schedule} · ${selectedClass.course}`}
          size="sm"
          footer={<Button variant="secondary" onClick={() => setShowEnrollModal(false)}>닫기</Button>}
        >
          <Input
            placeholder="이름·학년·학교로 검색"
            value={enrollSearch}
            onChange={e => setEnrollSearch(e.target.value)}
          />
          <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-[#E9E9E7]">
            {enrollableStudents.length === 0 ? (
              <p className="text-sm text-[#787774] py-4 text-center">
                {enrollSearch ? '검색 결과가 없습니다.' : '입반 가능한 학생이 없습니다.'}
              </p>
            ) : (
              enrollableStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="text-sm font-medium text-[#37352F]">{s.name}</span>
                    <span className="text-xs text-[#787774] ml-2">{s.grade} · {s.school}</span>
                  </div>
                  <button
                    onClick={() => setPendingEnroll({ id: s.id, name: s.name })}
                    className="text-xs font-medium text-[#FF6C37] hover:bg-[#FFF1EC] px-2 py-1 rounded transition-colors"
                  >
                    입반
                  </button>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
