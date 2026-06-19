'use client';

import { useState, useEffect } from 'react';
import { classes, classGroups, semesters as mockSemesters, students, enrollments, subjects, teachers, Class, Semester, Enrollment } from '@/lib/mock-data';
import { eligibleTeachers } from '@/lib/teacher-matching';
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ '2026년 여름학기': true });

  const [showCreate, setShowCreate]     = useState(false);
  const [showClone, setShowClone]       = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [confirmDeleteClass, setConfirmDeleteClass] = useState(false);

  // 새 반 생성 폼
  const [createSemId, setCreateSemId]         = useState<string>(() => localSemesters[0]?.id ?? '__new__');
  const [createNewYear, setCreateNewYear]     = useState(() => new Date().getFullYear());
  const [createNewSeason, setCreateNewSeason] = useState('');
  const [createDays, setCreateDays]           = useState<string[]>([]);
  const [createTime, setCreateTime]           = useState('09:00');
  const [createSubjectId, setCreateSubjectId] = useState('');
  const [createTeacherId, setCreateTeacherId] = useState('');
  const [createTeamLead, setCreateTeamLead]   = useState('');
  const [createRoom, setCreateRoom]           = useState('');
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
  const [editSemId, setEditSemId]         = useState<string>('');
  const [editNewYear, setEditNewYear]     = useState(() => new Date().getFullYear());
  const [editNewSeason, setEditNewSeason] = useState('');
  const [editDays, setEditDays]           = useState<string[]>([]);
  const [editTime, setEditTime]           = useState('09:00');
  const [editCourse, setEditCourse]       = useState('');
  const [editTeacher, setEditTeacher]     = useState('');
  const [editTeamLead, setEditTeamLead]   = useState('');
  const [editRoom, setEditRoom]           = useState('');
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
  const [cloneStudents, setCloneStudents] = useState(true);

  const [localEnrollments, setLocalEnrollments] = useState<Enrollment[]>(enrollments);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [pendingEnroll, setPendingEnroll] = useState<{ id: string; name: string } | null>(null);
  const [pendingUnenroll, setPendingUnenroll] = useState<{ id: string; name: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // 시간표(/schedule) 팝오버 등에서 ?selected=<반ID> 로 진입 시 해당 반 미리 선택
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('selected');
    if (!id) return;
    const target = localClasses.find(c => c.id === id);
    if (target) setSelectedClass(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const resolvedCreate = createSemId === '__new__'
    ? { year: createNewYear, season: createNewSeason }
    : (() => { const s = localSemesters.find(x => x.id === createSemId); return { year: s?.year ?? createNewYear, season: s?.season ?? '' }; })();
  const createSubjectName = subjects.find(s => s.id === createSubjectId)?.name ?? '';
  const createTeacherName = teachers.find(t => t.id === createTeacherId)?.name ?? '';
  const createEligibleTeachers = eligibleTeachers(createSubjectId, teachers);
  const autoName      = buildAutoName(resolvedCreate.year, resolvedCreate.season, createDays, createTime, createSubjectName, createTeacherName);
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
    if (createDays.length === 0 || !createSubjectId || !createTeacherId || !createTeamLead) return;

    let sem = createSemId !== '__new__'
      ? localSemesters.find(s => s.id === createSemId)
      : localSemesters.find(s => s.year === resolvedCreate.year && s.season === resolvedCreate.season);
    if (!sem) {
      sem = { id: `sem-${Date.now()}`, campus_id: 'campus-001', year: resolvedCreate.year, season: resolvedCreate.season, courses: [] };
      setLocalSemesters(p => [...p, sem!]);
    }

    const newClass: Class = {
      id: `cl-new-${Date.now()}`,
      campus_id: 'campus-001',
      class_group_id: `cg-new-${Date.now()}`,
      semester_id: sem.id,
      course: createSubjectName,
      subject_id: createSubjectId,
      name: autoName,
      teacher: createTeacherName,
      teacher_id: createTeacherId,
      team_lead: createTeamLead,
      room: createRoom.trim() || undefined,
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
    setExpanded(p => ({ ...p, [`${resolvedCreate.year}년 ${resolvedCreate.season}`]: true }));
    setShowCreate(false);
    setCreateSemId(localSemesters[0]?.id ?? '__new__');
    setCreateNewYear(new Date().getFullYear()); setCreateNewSeason('');
    setCreateDays([]); setCreateTime('09:00'); setCreateSubjectId('');
    setCreateTeacherId(''); setCreateTeamLead(''); setCreateRoom('');
  }

  function openEdit(cls: Class) {
    setEditSemId(cls.semester_id ?? localSemesters[0]?.id ?? '__new__');
    setEditNewYear(new Date().getFullYear()); setEditNewSeason('');
    const parts = cls.schedule.split(' ');
    setEditDays(parts[0]?.split('·') ?? []);
    setEditTime(parts[1] ?? '09:00');
    setEditCourse(cls.course);
    setEditTeacher(cls.teacher);
    setEditTeamLead(cls.team_lead);
    setEditRoom(cls.room ?? '');
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
    const resolvedEdit = editSemId === '__new__'
      ? { year: editNewYear, season: editNewSeason }
      : (() => { const s = localSemesters.find(x => x.id === editSemId); return { year: s?.year ?? editNewYear, season: s?.season ?? '' }; })();
    let sem = editSemId !== '__new__'
      ? localSemesters.find(s => s.id === editSemId)
      : localSemesters.find(s => s.year === editNewYear && s.season === editNewSeason);
    if (!sem) {
      sem = { id: `sem-${Date.now()}`, campus_id: 'campus-001', year: resolvedEdit.year, season: resolvedEdit.season, courses: [] };
      setLocalSemesters(p => [...p, sem!]);
    }
    const updated: Class = {
      ...selectedClass,
      semester_id: sem.id,
      course: editCourse,
      name: buildAutoName(resolvedEdit.year, resolvedEdit.season, editDays, editTime, editCourse, editTeacher),
      teacher: editTeacher,
      team_lead: editTeamLead,
      room: editRoom.trim() || undefined,
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
    setExpanded(p => ({ ...p, [`${resolvedEdit.year}년 ${resolvedEdit.season}`]: true }));
    setShowEdit(false);
  }

  // 복제 원본 학기에 속한 반 목록
  const cloneSourceClasses = localClasses.filter(c => {
    const fromGroups = classGroups.filter(g => g.semester_id === cloneFrom);
    return fromGroups.some(g => g.id === c.class_group_id) || c.semester_id === cloneFrom;
  });
  const cloneStudentCount = cloneStudents
    ? cloneSourceClasses.reduce((sum, c) =>
        sum + localEnrollments.filter(e => e.class_id === c.id && e.ended_at === null).length, 0)
    : 0;

  function handleCloneSemester() {
    const target = localSemesters.find(s => s.id === cloneTo);
    if (!target || cloneFrom === cloneTo || cloneSourceClasses.length === 0) return;

    const stamp = Date.now();
    const startDate = cloneStart || today;
    const newClasses: Class[] = [];
    const newEnrollments: Enrollment[] = [];

    cloneSourceClasses.forEach((src, i) => {
      const [dayPart, timePart] = src.schedule.split(' ');
      const days = dayPart?.split('·') ?? [];
      const time = timePart ?? '';
      // 원본 반의 기간(주차)을 유지하여 종료일 산출
      const durationMs = new Date(src.end_date).getTime() - new Date(src.start_date).getTime();
      const endDate = new Date(new Date(startDate).getTime() + (Number.isFinite(durationMs) ? durationMs : 0))
        .toISOString().slice(0, 10);

      const newId = `cl-clone-${stamp}-${i}`;
      const activeEnrolls = cloneStudents
        ? localEnrollments.filter(e => e.class_id === src.id && e.ended_at === null)
        : [];

      newClasses.push({
        ...src,
        id: newId,
        class_group_id: `cg-clone-${stamp}-${i}`,
        semester_id: target.id,
        name: buildAutoName(target.year, target.season, days, time, src.course, src.teacher) || src.name,
        start_date: startDate,
        end_date: endDate,
        enrolled_count: activeEnrolls.length,
      });

      activeEnrolls.forEach((e, j) => {
        newEnrollments.push({
          id: `enr-clone-${stamp}-${i}-${j}`,
          student_id: e.student_id,
          class_id: newId,
          started_at: startDate,
          ended_at: null,
          end_reason: null,
        });
      });
    });

    setLocalClasses(p => [...p, ...newClasses]);
    if (newEnrollments.length) setLocalEnrollments(p => [...p, ...newEnrollments]);
    setExpanded(p => ({ ...p, [`${target.year}년 ${target.season}`]: true }));
    setSelectedClass(newClasses[0] ?? null);
    setCloneSuccess(true);
    setTimeout(() => { setShowClone(false); setCloneSuccess(false); }, 1500);
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
          <h1 className="text-xl font-bold text-[#1A1D29]">수업 구성</h1>
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
          <div className="bg-white border border-[#E8EBF1] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#E8EBF1] bg-[#F4F6FA] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">반 목록</span>
              <button
                onClick={() => setFilterActive(p => !p)}
                className="flex items-center gap-1 group"
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  !filterActive ? 'bg-[#2F6BFF] border-[#2F6BFF]' : 'border-[#AEB4C0] bg-white'
                }`}>
                  {!filterActive && (
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-[#6B7280] group-hover:text-[#1A1D29] transition-colors">종강반 표시</span>
              </button>
            </div>
            <div className="divide-y divide-[#E8EBF1]">
              {semesterTree.length === 0 && (
                <p className="px-4 py-6 text-xs text-[#6B7280] text-center">표시할 학기가 없습니다</p>
              )}
              {semesterTree.map(({ key, sem, semClasses }) => (
                <div key={key}>
                  <div
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1A1D29] hover:bg-[#F4F6FA] transition-colors cursor-pointer"
                    onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      className={`flex-shrink-0 transition-transform ${expanded[key] ? 'rotate-90' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="flex-1">{key}</span>
                    <button
                      onClick={e => { e.stopPropagation(); openEditSem(sem); }}
                      className="p-0.5 rounded hover:bg-[#E8EBF1] text-[#6B7280] transition-colors"
                      title="그룹명 편집"
                    >
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  {expanded[key] && (
                    semClasses.length === 0 ? (
                      <div className="px-6 py-2 text-xs text-[#6B7280]">
                        반이 없습니다.{' '}
                        <button className="text-[#2F6BFF] underline" onClick={() => {
                          setCreateSemId(sem.id);
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
                              ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium'
                              : 'text-[#1A1D29] hover:bg-[#F4F6FA]'
                          }`}
                        >
                          <div className="font-medium">{cls.schedule}</div>
                          <div className="text-xs text-[#6B7280] truncate">{cls.course} · {cls.teacher}</div>
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
                  <p className="text-xs font-mono text-[#6B7280] mb-0.5">{selectedClass.name}</p>
                  <p className="text-base font-bold text-[#1A1D29]">{selectedClass.schedule} · {selectedClass.course}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => openEdit(selectedClass)}>편집</Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#F4F6FA] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#1A1D29] tabular-nums">
                    {selectedClass.enrolled_count}
                    <span className="text-base font-normal text-[#6B7280]">/{selectedClass.capacity}</span>
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">수강 인원</div>
                </div>
                <div className="bg-[#F4F6FA] rounded-lg p-4 text-center">
                  <div className="text-xl font-bold text-[#1A1D29] tabular-nums">
                    {computeWeeks(selectedClass.start_date, selectedClass.end_date)}주
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5">
                    {selectedClass.start_date.slice(5).replace('-', '/')} ~ {selectedClass.end_date.slice(5).replace('-', '/')}
                  </div>
                </div>
                <div className="bg-[#F4F6FA] rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-[#2F6BFF] tabular-nums">
                    {formatMoney(selectedClass.tuition_fee + selectedClass.material_fee + selectedClass.content_fee)}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">월 수강료 합계</div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#1A1D29]">
                  수강 학생
                  <span className="ml-1.5 text-[#6B7280] font-normal">
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
                <p className="text-sm text-[#6B7280] py-2">등록된 학생이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4">
                  {enrolledStudents.map(student => (
                    <div key={student!.id} className="py-2 border-b border-[#E8EBF1]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#1A1D29]">{student!.name}</span>
                        <button
                          onClick={() => setPendingUnenroll({ id: student!.id, name: student!.name })}
                          className="text-xs text-[#6B7280] hover:text-[#F2474B] transition-colors px-2 py-0.5 rounded hover:bg-[#FEE9EA] flex-shrink-0"
                        >
                          퇴반
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-[#6B7280]">{student!.grade} · {student!.school}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          student!.status === '재원' ? 'bg-[#E6F9EF] text-[#28C76F]' :
                          student!.status === '휴원' ? 'bg-[#FFF4E0] text-[#B45309]' :
                          'bg-[#FEE9EA] text-[#F2474B]'
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
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#E8EBF1] last:border-0">
                    <span className="text-sm text-[#1A1D29]">{item.label}</span>
                    <span className="text-sm font-medium tabular-nums">{formatMoney(item.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-[#1A1D29]">합계</span>
                  <span className="text-base font-bold text-[#2F6BFF] tabular-nums">
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
                  { label: '강의실', value: selectedClass.room || '미배정' },
                  { label: '수강 기간', value: `${selectedClass.start_date} ~ ${selectedClass.end_date}` },
                  { label: '납입기준일', value: `매월 ${selectedClass.payment_due_day}일` },
                  { label: '수납방식', value: selectedClass.payment_method },
                  { label: '잔여석', value: `${selectedClass.capacity - selectedClass.enrolled_count}석` },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-xs text-[#6B7280]">{item.label}</div>
                    <div className="text-sm font-medium text-[#1A1D29] mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-[#E8EBF1] flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1A1D29]">반 삭제</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">삭제하면 이 반 설정이 영구히 제거됩니다.</p>
                </div>
                <DeleteButton onClick={() => setConfirmDeleteClass(true)}>반 삭제</DeleteButton>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <p className="text-sm text-[#6B7280]">좌측에서 반을 선택하세요</p>
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
            <Button onClick={handleCreateClass} disabled={createDays.length === 0 || !createSubjectId || !createTeacherId || !createTeamLead}>
              반 생성
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* 그룹 선택 */}
          <div>
            <Select
              label="그룹 (학기)"
              value={createSemId}
              onChange={e => setCreateSemId(e.target.value)}
              options={[
                ...localSemesters.map(s => ({ value: s.id, label: `${s.year}년 ${s.season}` })),
                { value: '__new__', label: '＋ 새 그룹 만들기' },
              ]}
            />
            {createSemId === '__new__' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Input
                  label="연도"
                  type="number"
                  min={2020}
                  value={String(createNewYear)}
                  onChange={e => setCreateNewYear(Number(e.target.value))}
                />
                <Input
                  label="구분명"
                  type="text"
                  placeholder="예: 봄학기"
                  value={createNewSeason}
                  onChange={e => setCreateNewSeason(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 요일 */}
          <div>
            <label className="block text-sm font-medium text-[#1A1D29] mb-1.5">
              요일 <span className="text-xs font-normal text-[#6B7280]">(복수 선택 가능)</span>
            </label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    createDays.includes(day)
                      ? 'bg-[#2F6BFF] text-white shadow-sm'
                      : 'bg-[#F4F6FA] text-[#6B7280] border border-[#E8EBF1] hover:border-[#2F6BFF]/50'
                  }`}>
                  {day}
                </button>
              ))}
            </div>
            {createDays.length > 0 && (
              <p className="text-xs text-[#2F6BFF] mt-1.5 font-medium">선택: {createDays.join('·')}요일</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="시작 시간" type="time" value={createTime} onChange={e => setCreateTime(e.target.value)} />
            <Select
              label="과정(과목)"
              value={createSubjectId}
              onChange={e => { setCreateSubjectId(e.target.value); setCreateTeacherId(''); }}
              options={[{ value: '', label: '과목 선택' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]}
            />
          </div>

          {/* 담임 + 책임 연구원 */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="담임 강사"
              value={createTeacherId}
              onChange={e => setCreateTeacherId(e.target.value)}
              disabled={!createSubjectId}
              options={
                !createSubjectId
                  ? [{ value: '', label: '과목을 먼저 선택하세요' }]
                  : [{ value: '', label: '강사 선택' }, ...createEligibleTeachers.map(t => ({ value: t.id, label: t.name }))]
              }
            />
            <Input
              label="팀장"
              type="text"
              placeholder="예: 톰"
              value={createTeamLead}
              onChange={e => setCreateTeamLead(e.target.value)}
            />
          </div>

          <Input
            label="강의실"
            type="text"
            placeholder="예: 1강의실 (미입력 시 배치도에서 '미배정')"
            value={createRoom}
            onChange={e => setCreateRoom(e.target.value)}
          />

          <div className={`rounded-lg px-4 py-3 border ${autoName ? 'bg-[#E6F9EF] border-[#28C76F]/20' : 'bg-[#F4F6FA] border-[#E8EBF1]'}`}>
            <p className="text-xs text-[#6B7280] mb-1">자동 생성 반명</p>
            {autoName
              ? <p className="text-sm font-mono font-semibold text-[#28C76F]">{autoName}</p>
              : <p className="text-sm text-[#6B7280]">학기·요일·시간·과정·담임을 입력하면 자동 생성됩니다</p>
            }
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="정원" type="number" value={String(createCapacity)} onChange={e => setCreateCapacity(Number(e.target.value))} suffix="명" />
            <Input label="수강 시작일" type="date" value={createStart} onChange={e => setCreateStart(e.target.value)} />
            <Input label="수강 종료일" type="date" value={createEnd} onChange={e => setCreateEnd(e.target.value)} />
          </div>
          {computedWeeks > 0 && (
            <p className="text-xs text-[#28C76F] -mt-2">→ {computedWeeks}주 과정</p>
          )}

          <div className="border-t border-[#E8EBF1] pt-4">
            <p className="text-xs font-semibold text-[#6B7280] mb-3">수강료 세부내역 (청구 템플릿)</p>
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
            <p className="text-right text-sm font-bold text-[#2F6BFF] mt-2">
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
            <Button onClick={handleCloneSemester} loading={cloneSuccess} disabled={cloneFrom === cloneTo || cloneSourceClasses.length === 0}>
              {cloneSuccess ? '복제 완료!' : '전체 복제 실행'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-[#EAF1FF] border border-[#2F6BFF]/20 rounded-lg px-5 py-4 flex items-start gap-3">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2F6BFF" strokeWidth={2} className="mt-0.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-[#6B7280] mt-0.5">원본 학기의 반 구성(요일·시간·수강료·담임)을 대상 학기로 복사합니다. 아래에서 학생 배정까지 함께 복제할 수 있습니다.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="복제 원본"
              value={cloneFrom}
              onChange={e => setCloneFrom(e.target.value)}
              options={localSemesters.map(s => ({ value: s.id, label: `${s.year}년 ${s.season}` }))}
            />
            <Select
              label="복제 대상"
              value={cloneTo}
              onChange={e => setCloneTo(e.target.value)}
              options={localSemesters.map(s => ({ value: s.id, label: `${s.year}년 ${s.season}` }))}
            />
          </div>
          <Input label="복제 후 수강 시작일" type="date" value={cloneStart} onChange={e => setCloneStart(e.target.value)} />
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cloneStudents}
              onChange={e => setCloneStudents(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8EBF1] accent-[#2F6BFF]"
            />
            <span className="text-sm text-[#1A1D29]">재원 학생도 함께 복제 (각 반의 현재 수강생을 새 학기 반으로 이동)</span>
          </label>
          <div className="bg-[#F4F6FA] rounded-lg px-4 py-3 text-sm text-[#6B7280]">
            <span className="font-semibold text-[#1A1D29]">{semLabel(cloneFrom)}</span>의 반{' '}
            <span className="font-semibold text-[#1A1D29]">{cloneSourceClasses.length}개</span>를{' '}
            <span className="font-semibold text-[#1A1D29]">{semLabel(cloneTo)}</span>(으)로 복제합니다.
            {cloneStudents && (
              <> 재원 학생 <span className="font-semibold text-[#1A1D29]">{cloneStudentCount}명</span>도 함께 이동합니다.</>
            )}
            {cloneFrom === cloneTo && <span className="block text-[#F2474B] mt-1">원본과 대상 학기가 같습니다.</span>}
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
          {/* 그룹 선택 */}
          <div>
            <Select
              label="그룹 (학기)"
              value={editSemId}
              onChange={e => setEditSemId(e.target.value)}
              options={[
                ...localSemesters.map(s => ({ value: s.id, label: `${s.year}년 ${s.season}` })),
                { value: '__new__', label: '＋ 새 그룹 만들기' },
              ]}
            />
            {editSemId === '__new__' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Input
                  label="연도"
                  type="number"
                  min={2020}
                  value={String(editNewYear)}
                  onChange={e => setEditNewYear(Number(e.target.value))}
                />
                <Input
                  label="구분명"
                  type="text"
                  placeholder="예: 여름학기, 봄학기"
                  value={editNewSeason}
                  onChange={e => setEditNewSeason(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 요일 */}
          <div>
            <label className="block text-sm font-medium text-[#1A1D29] mb-1.5">
              요일 <span className="text-xs font-normal text-[#6B7280]">(복수 선택 가능)</span>
            </label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleEditDay(day)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    editDays.includes(day)
                      ? 'bg-[#2F6BFF] text-white shadow-sm'
                      : 'bg-[#F4F6FA] text-[#6B7280] border border-[#E8EBF1] hover:border-[#2F6BFF]/50'
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

          <Input
            label="강의실"
            type="text"
            placeholder="예: 1강의실 (미입력 시 배치도에서 '미배정')"
            value={editRoom}
            onChange={e => setEditRoom(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input label="정원" type="number" value={String(editCapacity)} onChange={e => setEditCapacity(Number(e.target.value))} suffix="명" />
            <Input label="수강 시작일" type="date" value={editStart} onChange={e => setEditStart(e.target.value)} />
            <Input label="수강 종료일" type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
          </div>

          <div className="border-t border-[#E8EBF1] pt-4">
            <p className="text-xs font-semibold text-[#6B7280] mb-3">수강료 세부내역</p>
            <div className="grid grid-cols-3 gap-2">
              <Input label="교육비 (비과세)" type="text" value={editTuition.toLocaleString('ko-KR')} onChange={e => setEditTuition(parseMoney(e.target.value))} suffix="원" />
              <Input label="교구 대여비 (과세)" type="text" value={editMaterial.toLocaleString('ko-KR')} onChange={e => setEditMaterial(parseMoney(e.target.value))} suffix="원" />
              <Input label="콘텐츠 사용비" type="text" value={editContent.toLocaleString('ko-KR')} onChange={e => setEditContent(parseMoney(e.target.value))} suffix="원" />
            </div>
            <p className="text-right text-sm font-bold text-[#2F6BFF] mt-2">
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
              placeholder="예: 여름학기, 봄학기"
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
          <p className="text-sm text-[#1A1D29]">
            <span className="font-mono font-semibold">{selectedClass.name}</span> 반을 삭제하시겠습니까?
          </p>
          {selectedClass.enrolled_count > 0 && (
            <div className="mt-3 bg-[#EAF1FF] border border-[#2F6BFF]/20 rounded-md px-3 py-2">
              <p className="text-xs text-[#2F6BFF] font-medium">
                현재 {selectedClass.enrolled_count}명이 수강 중입니다. 삭제 전 학생을 다른 반으로 이동하세요.
              </p>
            </div>
          )}
          <p className="text-xs text-[#6B7280] mt-2">이 작업은 되돌릴 수 없습니다.</p>
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
          <p className="text-sm text-[#1A1D29]">
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
          <p className="text-sm text-[#1A1D29]">
            <span className="font-semibold">{pendingUnenroll.name}</span> 학생을 이 반에서 퇴반 처리하시겠습니까?
          </p>
          <p className="text-xs text-[#6B7280] mt-2">퇴반 후에도 원생 관리에서 다시 입반할 수 있습니다.</p>
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
          <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-[#E8EBF1]">
            {enrollableStudents.length === 0 ? (
              <p className="text-sm text-[#6B7280] py-4 text-center">
                {enrollSearch ? '검색 결과가 없습니다.' : '입반 가능한 학생이 없습니다.'}
              </p>
            ) : (
              enrollableStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="text-sm font-medium text-[#1A1D29]">{s.name}</span>
                    <span className="text-xs text-[#6B7280] ml-2">{s.grade} · {s.school}</span>
                  </div>
                  <button
                    onClick={() => setPendingEnroll({ id: s.id, name: s.name })}
                    className="text-xs font-medium text-[#2F6BFF] hover:bg-[#EAF1FF] px-2 py-1 rounded transition-colors"
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
