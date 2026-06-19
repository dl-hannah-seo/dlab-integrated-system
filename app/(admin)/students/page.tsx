'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  students as activeStudents,
  withdrawnStudents,
  classes,
  enrollments as initialEnrollments,
  consultations as initialConsultations,
  getInvoiceByStudent,
  getUnpaidStudents,
  payments,
  attendanceHistory,
  initialAttendance,
  sessionHistory,
  WITHDRAW_REASONS,
  Student,
  Enrollment,
  Consultation,
  ConsultMethod,
  type AttendanceStatus,
  type ClassSession,
} from '@/lib/mock-data';

// 원생관리 목록 = 재원/휴원(활성) + 퇴원자 합본
// 신규 상담 등록 전환으로 activeStudents에 push된 학생도 페이지 진입 시 반영되도록
// 모듈 평가 시점이 아닌 마운트 시점(지연 초기화)에 합본한다.
const buildInitialStudents = (): Student[] => [...activeStudents, ...withdrawnStudents];
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { consultationsOf } from '@/lib/consultations';
import { atRiskStudents } from '@/lib/at-risk';
import { parseStudentRows, rowToStudent, buildStudentTemplate, type ParsedStudentRow } from '@/lib/student-import';
import { useRole } from '@/components/layout/RoleContext';
import { canSeeFinance } from '@/lib/roles';

const DIVISIONS = ['전체', '유치부', '초등부', '중등부', '고등부'];
const GRADES = ['전체', '5세', '6세', '7세', '초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
const STATUSES = ['전체', '재원', '퇴원', '휴원'];
const SOURCES = ['지인소개', '인스타그램', '블로그', '학교안내', '현수막', '네이버카페'];
const GUARDIAN_RELATIONS = ['조부', '조모', '외조부', '외조모', '삼촌', '이모', '고모', '형제자매', '기타'];
const MSG_TEMPLATES = [
  { value: 'notice', label: '단체 안내', body: '[D.LAB 판교] {원생명} 학부모님, 안녕하세요.\n본원 관련 안내 말씀 드립니다.' },
  { value: 'payment', label: '결제 URL 안내', body: '[D.LAB 판교] {원생명} 학부모님,\n수강료 결제 안내입니다.\n결제 링크: https://pay.dlab.co.kr/pangyo' },
  { value: 'absent', label: '결석 확인', body: '[D.LAB 판교] {원생명} 학부모님,\n오늘 수업에 결석하여 안내드립니다.' },
];
const MSG_TARGETS = [
  { value: '모', label: '어머니 (모)' },
  { value: '부', label: '아버지 (부)' },
  { value: '본인', label: '학생 본인' },
];
const DETAIL_TABS = ['기본정보', '수강이력', '출결', '수납이력', '상담이력'] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

// 학생 출결 이력 조회용 — 전체 출결 레코드 + 회차(날짜) 인덱스
const ALL_ATTENDANCE = [...attendanceHistory, ...initialAttendance];
const SESSION_BY_ID: Record<string, ClassSession> = {};
sessionHistory.forEach(s => { SESSION_BY_ID[s.id] = s; });
const ATT_LABEL: Record<AttendanceStatus, string> = { attend: '출석', absent: '결석', pending: '미도착', makeup: '보강' };

function formatMoney(n: number) { return n.toLocaleString('ko-KR') + '원'; }

// 보기/편집 공통 필드 행 — 라벨 위치 고정, 값 칸만 텍스트↔입력으로 교체
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#6B7280]">{label}</span>
      <div className="min-h-[34px] flex items-center">{children}</div>
    </div>
  );
}
function ViewText({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-[#1A1D29]">{children}</span>;
}

export default function StudentsPage() {
  const [localStudents, setLocalStudents] = useState<Student[]>(buildInitialStudents);
  const [localEnrollments, setLocalEnrollments] = useState<Enrollment[]>(initialEnrollments);

  // 학생의 진행 중 수강 반(복수) 헬퍼
  const activeClassIds = (sid: string) =>
    localEnrollments.filter(e => e.student_id === sid && e.ended_at === null).map(e => e.class_id);
  const activeClassNames = (sid: string) =>
    activeClassIds(sid).map(id => classes.find(c => c.id === id)?.name).filter(Boolean) as string[];
  const classLabel = (sid: string) => {
    const names = activeClassNames(sid);
    if (names.length === 0) return '미배정';
    return names.length === 1 ? names[0] : `${names[0]} 외 ${names.length - 1}`;
  };
  // 종강 여부는 저장하지 않고 end_date 로 파생 표시만. 수강반 선택은 전체 반 + 검색.
  const today = new Date().toISOString().slice(0, 10);
  const matchClass = (c: (typeof classes)[number], q: string) => {
    const t = q.trim();
    if (!t) return true;
    return c.name.includes(t) || c.course.includes(t) || c.teacher.includes(t) || c.schedule.includes(t);
  };

  // 필터
  const [filterName, setFilterName] = useState('');
  const [filterGrade, setFilterGrade] = useState('전체');
  const [filterStatus, setFilterStatus] = useState('재원');
  const [filterClass, setFilterClass] = useState('전체');
  // 대시보드 '퇴원 위험 자세히 보기'(?risk=1) 진입 시에만 켜지는 위험 학생 한정 모드
  const [riskOnly, setRiskOnly] = useState(false);

  // 위험 학생 집합 — 대시보드와 동일 산식(미납·출석저조·휴원) 재사용
  const riskEntries = useMemo(
    () => atRiskStudents(localStudents, new Set(getUnpaidStudents().map(s => s.id))),
    [localStudents],
  );
  const riskIds = useMemo(() => new Set(riskEntries.map(e => e.student.id)), [riskEntries]);
  const riskReasonsById = useMemo(
    () => new Map(riskEntries.map(e => [e.student.id, e.reasons.join(' · ')])),
    [riskEntries],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRegister, setShowRegister] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);

  // 엑셀(CSV) 일괄 등록
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<ParsedStudentRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const importValid = importRows.filter(r => r.errors.length === 0);
  const importInvalid = importRows.filter(r => r.errors.length > 0);

  function downloadTemplate() {
    const blob = new Blob(['﻿' + buildStudentTemplate()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '원생_일괄등록_양식.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImportRows(parseStudentRows(String(reader.result ?? '')));
    reader.readAsText(file, 'utf-8');
  }
  function closeImport() {
    setShowImport(false);
    setImportRows([]);
    setImportFileName('');
  }
  function confirmImport() {
    if (importValid.length === 0) return;
    const base = Date.now();
    const newStudents = importValid.map((r, i) => rowToStudent(r, base + i, today));
    setLocalStudents(prev => [...newStudents, ...prev]);
    closeImport();
  }

  // 신규 등록 폼 — 조건부 UI용 상태
  const [regSourceSel, setRegSourceSel] = useState(SOURCES[0]);
  const [regSourceEtc, setRegSourceEtc] = useState('');
  const [regClasses, setRegClasses] = useState<Set<string>>(new Set());
  const [regClassSearch, setRegClassSearch] = useState('');
  const [includeEndedReg, setIncludeEndedReg] = useState(false);
  // 등록 필수값 (이름 + 모/부 연락처 중 1개 이상)
  const [regName, setRegName] = useState('');
  const [regGender, setRegGender] = useState('');
  const [regMotherPhone, setRegMotherPhone] = useState('');
  const [regFatherPhone, setRegFatherPhone] = useState('');
  const [regOtherPhone, setRegOtherPhone] = useState('');
  const [regOtherRelation, setRegOtherRelation] = useState('');
  const canRegister = regName.trim() !== '' && (regMotherPhone.trim() !== '' || regFatherPhone.trim() !== '' || regOtherPhone.trim() !== '');
  function closeRegister() {
    setShowRegister(false);
    setRegName(''); setRegGender(''); setRegMotherPhone(''); setRegFatherPhone(''); setRegOtherPhone(''); setRegOtherRelation('');
    setRegClasses(new Set()); setRegClassSearch(''); setIncludeEndedReg(false);
    setRegSourceSel(SOURCES[0]); setRegSourceEtc('');
  }

  // 편집 시 수강 반(복수) 작업 집합
  const [editClasses, setEditClasses] = useState<Set<string>>(new Set());
  const [editClassSearch, setEditClassSearch] = useState('');
  const [includeEndedEdit, setIncludeEndedEdit] = useState(false);
  const [siblingSearch, setSiblingSearch] = useState('');
  function toggleEditClass(cid: string) {
    setEditClasses(prev => { const n = new Set(prev); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
  }
  function addSibling(id: string) {
    setEditForm(f => (f ? { ...f, sibling_ids: [...(f.sibling_ids ?? []), id] } : f));
    setSiblingSearch('');
  }
  function removeSibling(id: string) {
    setEditForm(f => (f ? { ...f, sibling_ids: (f.sibling_ids ?? []).filter(x => x !== id) } : f));
  }
  function toggleRegClass(cid: string) {
    setRegClasses(prev => { const n = new Set(prev); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
  }

  // 문자 발송 폼
  const [msgTemplate, setMsgTemplate] = useState('notice');
  const [msgBody, setMsgBody] = useState(MSG_TEMPLATES[0].body);
  const [msgTarget, setMsgTarget] = useState<'모' | '부' | '본인'>('모');
  function selectMsgTemplate(v: string) {
    setMsgTemplate(v);
    const t = MSG_TEMPLATES.find(x => x.value === v);
    if (t) setMsgBody(t.body);
  }

  // 역할 — SO 등 비원장은 금액(수납이력) 탭 제외
  const { role } = useRole();
  const visibleDetailTabs = DETAIL_TABS.filter(t => t !== '수납이력' || canSeeFinance(role));

  // 상세 모달
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('기본정보');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 상담이력 (조회 전용) — 입력·수정·삭제는 상담 관리 > 재원상담 탭에서 처리
  const [localConsultations] = useState<Consultation[]>(initialConsultations);

  const classOptions = [
    { value: '전체', label: '전체 반' },
    ...classes.map(c => ({ value: c.id, label: c.name })),
  ];
  const filtered = useMemo(() => {
    return localStudents.filter(s => {
      if (riskOnly && !riskIds.has(s.id)) return false;
      if (filterName && !s.name.includes(filterName)) return false;
      if (filterGrade !== '전체' && s.grade !== filterGrade) return false;
      // 위험 모드에서는 등록구분(재원/휴원 등) 무관하게 위험 학생 전부 노출
      if (!riskOnly && filterStatus !== '전체' && s.status !== filterStatus) return false;
      const myClassIds = activeClassIds(s.id);
      if (filterClass !== '전체' && !myClassIds.includes(filterClass)) return false;
      return true;
    });
  }, [localStudents, localEnrollments, filterName, filterGrade, filterStatus, filterClass, riskOnly, riskIds]);

  function resetFilters() {
    setFilterName(''); setFilterGrade('전체'); setFilterStatus('재원'); setFilterClass('전체');
  }

  // 문자 발송 대상: 선택이 있으면 선택분, 없으면 현재 조회된 전체
  const msgRecipients = selected.size > 0
    ? ([...selected].map(id => localStudents.find(s => s.id === id)).filter(Boolean) as Student[])
    : filtered;

  function toggleSelect(id: string) {
    setSelected(p => {
      const next = new Set(p);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  }

  // ── 상세/편집/삭제 ──────────────────────────────────────────
  function openDetail(s: Student) {
    setDetailStudent(s);
    setDetailTab('기본정보');
    setEditMode(false);
    setEditForm({ ...s });
    setConfirmDelete(false);
  }
  // 외부 진입 쿼리: ?risk=1 → 퇴원 위험 학생 한정 모드, ?detail=<원생ID> → 상세 자동 오픈
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('risk') === '1') setRiskOnly(true);
    const id = params.get('detail');
    if (id) {
      const target = localStudents.find(s => s.id === id);
      if (target) openDetail(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeDetail() {
    setDetailStudent(null);
    setEditMode(false);
    setConfirmDelete(false);
  }
  function startEdit() {
    if (!detailStudent) return;
    setEditForm({ ...detailStudent });
    setEditClasses(new Set(activeClassIds(detailStudent.id)));
    setEditClassSearch('');
    setIncludeEndedEdit(false);
    setSiblingSearch('');
    setEditMode(true);
  }
  function cancelEdit() {
    if (detailStudent) setEditForm({ ...detailStudent });
    setEditMode(false);
  }
  function updateField<K extends keyof Student>(key: K, value: Student[K]) {
    setEditForm(f => (f ? { ...f, [key]: value } : f));
  }
  function saveEdit() {
    if (!editForm) return;
    const sid = editForm.id;
    const primaryClass = [...editClasses][0] ?? editForm.class_id;
    const updated = { ...editForm, class_id: primaryClass };
    setLocalStudents(prev => prev.map(s => (s.id === sid ? updated : s)));
    // 수강 반 반영: 이 학생의 활성 등록을 editClasses와 일치시키고, 종료 이력은 보존
    setLocalEnrollments(prev => {
      const kept = prev.filter(e => e.student_id !== sid || e.ended_at !== null);
      const active: Enrollment[] = [...editClasses].map(cid => {
        const existing = prev.find(e => e.student_id === sid && e.class_id === cid && e.ended_at === null);
        return existing ?? { id: `enr-${sid}-n-${cid}`, student_id: sid, class_id: cid, started_at: '2026-03-02', ended_at: null, end_reason: null };
      });
      return [...kept, ...active];
    });
    setDetailStudent(updated);
    setEditMode(false);
  }
  function deleteStudent() {
    if (!detailStudent) return;
    const id = detailStudent.id;
    setLocalStudents(prev => prev.filter(s => s.id !== id));
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    setConfirmDelete(false);
    setDetailStudent(null);
  }

  const columns = [
    {
      key: '_check', header: '',
      render: (row: Student) => (
        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)}
          className="w-4 h-4 accent-[#2F6BFF]" onClick={e => e.stopPropagation()} />
      ),
      className: 'w-10',
    },
    { key: 'name', header: '성명', render: (r: Student) => <span className="font-medium whitespace-nowrap">{r.name}</span> },
    {
      key: 'class_id', header: '반명',
      render: (r: Student) => {
        const names = activeClassNames(r.id);
        return <span className="text-xs whitespace-nowrap" title={names.join('\n')}>{classLabel(r.id)}</span>;
      },
    },
    { key: 'grade', header: '학년', render: (r: Student) => <span className="text-xs whitespace-nowrap">{r.grade}</span> },
    { key: 'parent_phone', header: '모 연락처', render: (r: Student) => <span className="tabular-nums text-xs">{r.parent_phone}</span> },
    {
      key: 'status', header: '등록구분',
      render: (r: Student) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Badge variant={r.status === '재원' ? 'active' : 'withdrawn'}>{r.status}</Badge>
          {riskIds.has(r.id) && (
            <span
              title={`퇴원 위험: ${riskReasonsById.get(r.id)}`}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#FEE9EA] text-[#F2474B]"
            >
              퇴원위험
            </span>
          )}
        </div>
      ),
    },
  ];

  // ── 상세 모달 본문 ─────────────────────────────────────────
  function renderDetailBody() {
    if (!detailStudent) return null;
    const s = detailStudent;
    const f = editForm;

    // 기본정보 (학생 본인 속성 + 가족/보호자 통합)
    if (detailTab === '기본정보') {
      const siblings = (s.sibling_ids ?? []).map(id => localStudents.find(st => st.id === id)).filter(Boolean) as Student[];
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <Field label="이름">
              {editMode && f ? <Input value={f.name} onChange={e => updateField('name', e.target.value)} /> : <ViewText>{s.name}</ViewText>}
            </Field>
            <Field label="성별">
              {editMode && f
                ? <Select value={f.gender ?? ''} onChange={e => updateField('gender', (e.target.value || undefined) as Student['gender'])} options={[{ value: '', label: '선택' }, { value: '남', label: '남' }, { value: '여', label: '여' }]} />
                : <ViewText>{s.gender ?? '-'}</ViewText>}
            </Field>
            <Field label="학부">
              {editMode && f
                ? <Select value={f.division ?? ''} onChange={e => updateField('division', e.target.value)} options={DIVISIONS.slice(1).map(d => ({ value: d, label: d }))} />
                : <ViewText>{s.division ?? '-'}</ViewText>}
            </Field>
            <Field label="학년">
              {editMode && f
                ? <Select value={f.grade} onChange={e => updateField('grade', e.target.value)} options={GRADES.slice(1).map(g => ({ value: g, label: g }))} />
                : <ViewText>{s.grade}</ViewText>}
            </Field>
            <Field label="학교">
              {editMode && f ? <Input value={f.school} onChange={e => updateField('school', e.target.value)} /> : <ViewText>{s.school}</ViewText>}
            </Field>
            <Field label="원생 연락처">
              {editMode && f ? <Input value={f.student_phone} placeholder="미등록" onChange={e => updateField('student_phone', e.target.value)} /> : <ViewText>{s.student_phone || '미등록'}</ViewText>}
            </Field>
            <Field label="모 연락처">
              {editMode && f ? <Input value={f.parent_phone} onChange={e => updateField('parent_phone', e.target.value)} /> : <ViewText>{s.parent_phone}</ViewText>}
            </Field>
            <Field label="부 연락처">
              {editMode && f ? <Input value={f.father_phone ?? ''} placeholder="미등록" onChange={e => updateField('father_phone', e.target.value)} /> : <ViewText>{s.father_phone || '미등록'}</ViewText>}
            </Field>
            <Field label="그 외 보호자">
              {editMode && f ? (
                <div className="w-full flex gap-2">
                  <div className="w-24 shrink-0">
                    <Select value={f.other_guardian_relation ?? ''} onChange={e => updateField('other_guardian_relation', e.target.value)} options={[{ value: '', label: '관계' }, ...GUARDIAN_RELATIONS.map(r => ({ value: r, label: r }))]} />
                  </div>
                  <div className="flex-1">
                    <Input value={f.other_guardian_phone ?? ''} placeholder="010-0000-0000" onChange={e => updateField('other_guardian_phone', e.target.value)} />
                  </div>
                </div>
              ) : (
                <ViewText>{s.other_guardian_phone ? `${s.other_guardian_relation ? s.other_guardian_relation + ' · ' : ''}${s.other_guardian_phone}` : '미등록'}</ViewText>
              )}
            </Field>
            <Field label="등록구분">
              {editMode && f
                ? <Select value={f.status} onChange={e => updateField('status', e.target.value as Student['status'])} options={STATUSES.slice(1).map(v => ({ value: v, label: v }))} />
                : <ViewText>{s.status}</ViewText>}
            </Field>
            {((editMode && f ? f.status : s.status) === '퇴원') && (
              <>
                <Field label="퇴원사유">
                  {editMode && f
                    ? <Select
                        value={f.withdraw_reason ?? ''}
                        onChange={e => updateField('withdraw_reason', (e.target.value || undefined) as Student['withdraw_reason'])}
                        options={[{ value: '', label: '선택' }, ...WITHDRAW_REASONS.map(v => ({ value: v, label: v }))]}
                      />
                    : <ViewText>{s.withdraw_reason ?? '미입력'}</ViewText>}
                </Field>
                <Field label="퇴원일">
                  {editMode && f
                    ? <Input type="date" value={f.withdrew_at ?? ''} onChange={e => updateField('withdrew_at', e.target.value)} />
                    : <ViewText>{s.withdrew_at ?? '-'}</ViewText>}
                </Field>
                <Field label="퇴원 메모">
                  {editMode && f
                    ? <Textarea rows={2} value={f.withdraw_memo ?? ''} onChange={e => updateField('withdraw_memo', e.target.value)} placeholder="상세 사유 (선택)" />
                    : <ViewText>{s.withdraw_memo || '-'}</ViewText>}
                </Field>
              </>
            )}
            <Field label="유입경로">
              {editMode && f ? (
                <div className="w-full flex flex-col gap-1.5">
                  <Select
                    value={SOURCES.includes(f.source) ? f.source : '기타'}
                    onChange={e => updateField('source', e.target.value === '기타' ? (SOURCES.includes(f.source) ? '' : f.source) : e.target.value)}
                    options={[...SOURCES, '기타'].map(v => ({ value: v, label: v }))}
                  />
                  {!SOURCES.includes(f.source) && (
                    <Input value={f.source} placeholder="유입경로 직접 입력" onChange={e => updateField('source', e.target.value)} />
                  )}
                </div>
              ) : <ViewText>{s.source}</ViewText>}
            </Field>
            <Field label="최초 등원일"><ViewText>{s.first_enrolled_at}</ViewText></Field>
            <Field label="포인트"><ViewText>{s.points.toLocaleString()}DP</ViewText></Field>
            <Field label="칭호"><ViewText>{s.title || '없음'}</ViewText></Field>
          </div>
          {/* 재원형제 (편집 가능) */}
          <div>
            <p className="text-xs text-[#6B7280] mb-2">재원형제</p>
            {editMode && f ? (
              <div className="space-y-2">
                {(f.sibling_ids ?? []).map(id => {
                  const sib = localStudents.find(st => st.id === id);
                  if (!sib) return null;
                  return (
                    <div key={id} className="flex items-center justify-between border border-[#E8EBF1] rounded-lg px-4 py-2.5">
                      <div>
                        <span className="text-sm font-medium text-[#1A1D29]">{sib.name}</span>
                        <span className="text-xs text-[#6B7280] ml-2">{sib.grade} · {classes.find(c => c.id === sib.class_id)?.schedule ?? '-'}</span>
                      </div>
                      <button onClick={() => removeSibling(id)} className="text-xs text-[#F2474B] hover:underline">제거</button>
                    </div>
                  );
                })}
                <input value={siblingSearch} onChange={e => setSiblingSearch(e.target.value)} placeholder="형제 이름 검색 후 추가"
                  className="w-full border border-[#E8EBF1] rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#2F6BFF]" />
                {siblingSearch.trim() && (() => {
                  const matches = localStudents.filter(st => st.id !== s.id && !(f.sibling_ids ?? []).includes(st.id) && st.name.includes(siblingSearch.trim())).slice(0, 6);
                  return (
                    <div className="border border-[#E8EBF1] rounded-md divide-y divide-[#E8EBF1] max-h-32 overflow-y-auto">
                      {matches.map(st => (
                        <button key={st.id} onClick={() => addSibling(st.id)} className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#F4F6FA]">
                          <span className="text-sm text-[#1A1D29]">{st.name} <span className="text-xs text-[#6B7280]">{st.grade}</span></span>
                          <span className="text-xs text-[#2F6BFF]">추가</span>
                        </button>
                      ))}
                      {matches.length === 0 && <p className="px-3 py-2 text-xs text-[#6B7280]">검색 결과가 없습니다.</p>}
                    </div>
                  );
                })()}
              </div>
            ) : siblings.length === 0 ? (
              <p className="text-sm text-[#6B7280]">등록된 재원형제가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {siblings.map(sib => (
                  <div key={sib.id} className="flex items-center justify-between border border-[#E8EBF1] rounded-lg px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-[#1A1D29]">{sib.name}</span>
                      <span className="text-xs text-[#6B7280] ml-2">{sib.grade} · {classes.find(c => c.id === sib.class_id)?.schedule ?? '-'}</span>
                    </div>
                    <Badge variant={sib.status === '재원' ? 'active' : 'withdrawn'}>{sib.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 수강 반 */}
          <div className="bg-[#F4F6FA] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#6B7280]">수강 반 {editMode && <span>(복수 선택 가능)</span>}</p>
              {editMode && f && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={includeEndedEdit} onChange={() => setIncludeEndedEdit(v => !v)} className="w-3.5 h-3.5 accent-[#2F6BFF]" />
                  <span className="text-xs text-[#6B7280]">종강반 포함</span>
                </label>
              )}
            </div>
            {editMode && f ? (
              <div>
                <input value={editClassSearch} onChange={e => setEditClassSearch(e.target.value)} placeholder="반 검색 (반명·과정·담임)"
                  className="w-full border border-[#E8EBF1] rounded-md px-3 py-2 text-sm bg-white mb-2 focus:outline-none focus:border-[#2F6BFF]" />
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {classes.filter(c => matchClass(c, editClassSearch) && (includeEndedEdit || c.end_date >= today || editClasses.has(c.id))).map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editClasses.has(c.id)} onChange={() => toggleEditClass(c.id)} className="w-4 h-4 accent-[#2F6BFF]" />
                      <span className="text-sm text-[#1A1D29]">{c.name}</span>
                      {c.end_date < today && <span className="text-xs text-[#6B7280]">(종강)</span>}
                    </label>
                  ))}
                  {classes.filter(c => matchClass(c, editClassSearch) && (includeEndedEdit || c.end_date >= today || editClasses.has(c.id))).length === 0 && (
                    <p className="text-xs text-[#6B7280] py-2">검색 결과가 없습니다.</p>
                  )}
                </div>
              </div>
            ) : activeClassNames(s.id).length === 0 ? (
              <p className="text-sm text-[#6B7280]">미배정</p>
            ) : (
              <div className="space-y-1">
                {activeClassNames(s.id).map(n => <p key={n} className="text-sm text-[#1A1D29]">{n}</p>)}
              </div>
            )}
          </div>

          {/* 현금영수증 발행정보 */}
          <div className="bg-[#F4F6FA] rounded-lg p-3">
            <p className="text-xs text-[#6B7280] mb-2">현금영수증</p>
            {editMode && f ? (
              <div className="space-y-2">
                <div className="w-40">
                  <Select
                    value={f.cash_receipt_enabled ? 'Y' : 'N'}
                    onChange={e => updateField('cash_receipt_enabled', e.target.value === 'Y')}
                    options={[{ value: 'N', label: '미발행' }, { value: 'Y', label: '발행' }]}
                  />
                </div>
                {f.cash_receipt_enabled && (
                  <div className="flex gap-2">
                    <div className="w-32 shrink-0">
                      <Select
                        value={f.cash_receipt_purpose ?? '소득공제용'}
                        onChange={e => updateField('cash_receipt_purpose', e.target.value as Student['cash_receipt_purpose'])}
                        options={[{ value: '소득공제용', label: '소득공제용' }, { value: '지출증빙용', label: '지출증빙용' }]}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={f.cash_receipt_number ?? ''}
                        placeholder={(f.cash_receipt_purpose ?? '소득공제용') === '지출증빙용' ? '사업자등록번호' : '휴대폰번호 / 주민번호'}
                        onChange={e => updateField('cash_receipt_number', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : s.cash_receipt_enabled ? (
              <p className="text-sm text-[#1A1D29]">{s.cash_receipt_purpose ?? '소득공제용'}{s.cash_receipt_number ? ` · ${s.cash_receipt_number}` : ''}</p>
            ) : (
              <p className="text-sm text-[#6B7280]">미발행</p>
            )}
          </div>

          {/* 특이사항 · 메모 */}
          <Field label="특이사항">
            {editMode && f ? <Input value={f.special_note ?? ''} placeholder="없음" onChange={e => updateField('special_note', e.target.value)} /> : <ViewText>{s.special_note || '없음'}</ViewText>}
          </Field>
          <Field label="메모">
            {editMode && f
              ? <textarea value={f.memo ?? ''} rows={3} placeholder="메모 입력" onChange={e => updateField('memo', e.target.value)}
                  className="w-full border border-[#E8EBF1] rounded-md px-3 py-2 text-sm text-[#1A1D29] placeholder:text-[#AEB4C0] focus:outline-none focus:border-[#2F6BFF] resize-y" />
              : <span className="text-sm font-medium text-[#1A1D29] whitespace-pre-line">{s.memo || '없음'}</span>}
          </Field>
        </div>
      );
    }

    // 수강이력
    if (detailTab === '수강이력') {
      const ens = localEnrollments.filter(e => e.student_id === s.id);
      return (
        <div className="space-y-2">
          {editMode && <p className="text-xs text-[#6B7280]">수강이력은 편집할 수 없습니다.</p>}
          {ens.length === 0 && <p className="text-sm text-[#6B7280]">수강 이력이 없습니다.</p>}
          {ens.map(e => {
            const cls = classes.find(c => c.id === e.class_id);
            return (
              <div key={e.id} className="flex items-center justify-between border border-[#E8EBF1] rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[#1A1D29]">{cls?.name ?? e.class_id}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5 tabular-nums">{e.started_at} ~ {e.ended_at ?? '수강 중'}</div>
                </div>
                <Badge variant={e.ended_at ? 'withdrawn' : 'active'}>{e.ended_at ? (e.end_reason ?? '종료') : '수강 중'}</Badge>
              </div>
            );
          })}
        </div>
      );
    }

    if (detailTab === '출결') {
      const recs = ALL_ATTENDANCE
        .filter(r => r.student_id === s.id)
        .map(r => ({ rec: r, sess: SESSION_BY_ID[r.session_id] }))
        .filter((x): x is { rec: typeof x.rec; sess: ClassSession } => !!x.sess)
        .sort((a, b) => b.sess.session_date.localeCompare(a.sess.session_date));
      const attendN = recs.filter(x => x.rec.status === 'attend' || x.rec.status === 'makeup').length;
      const absentN = recs.filter(x => x.rec.status === 'absent').length;
      const denom = attendN + absentN;
      const rate = denom ? Math.round((attendN / denom) * 100) : 0;
      const summary = [
        { label: '출석률', value: denom ? `${rate}%` : '–', color: '#1A1D29' },
        { label: '출석', value: `${attendN}회`, color: '#28C76F' },
        { label: '결석', value: `${absentN}회`, color: absentN > 0 ? '#F2474B' : '#1A1D29' },
      ];
      return (
        <div className="space-y-4">
          {editMode && <p className="text-xs text-[#6B7280]">출결 이력은 편집할 수 없습니다.</p>}
          <div className="grid grid-cols-3 gap-3">
            {summary.map(c => (
              <div key={c.label} className="border border-[#E8EBF1] rounded-lg p-3">
                <p className="text-xs text-[#6B7280]">{c.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>
          {recs.length === 0 ? (
            <p className="text-sm text-[#6B7280]">출결 이력이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {recs.map(({ rec, sess }) => {
                const cls = classes.find(c => c.id === sess.class_id);
                return (
                  <div key={rec.id} className="flex items-center justify-between border border-[#E8EBF1] rounded-lg px-4 py-2.5">
                    <div>
                      <span className="text-sm text-[#1A1D29] tabular-nums">{sess.session_date}</span>
                      <span className="text-xs text-[#6B7280] ml-2">{cls?.name ?? sess.class_id}</span>
                    </div>
                    <Badge variant={rec.status}>{ATT_LABEL[rec.status]}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // 상담이력 (조회 전용) — 입력·수정·삭제는 상담 관리 > 재원상담 탭에서
    if (detailTab === '상담이력') {
      const list = consultationsOf(localConsultations, s.id);
      const methodBadge: Record<ConsultMethod, 'primary' | 'success' | 'warn' | 'default'> = {
        '전화': 'primary', '대면': 'success', '문자·카톡': 'warn', '기타': 'default',
      };
      return (
        <div className="space-y-4">
          <p className="text-xs text-[#9CA3AF]">상담 기록 입력·수정은 상담 관리 &gt; 재원상담 탭에서 할 수 있습니다.</p>

          {/* 기록 목록 (최신순, 조회 전용) */}
          {list.length === 0 ? (
            <p className="text-sm text-[#6B7280]">등록된 상담 이력이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {list.map(c => (
                <div key={c.id} className="border border-[#E8EBF1] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1A1D29] tabular-nums">{c.date}</span>
                    <Badge variant={methodBadge[c.method]}>{c.method}</Badge>
                    <span className="text-xs text-[#9CA3AF]">{c.target === '학부모' ? '학부모 상담' : '학생 상담'}</span>
                    {c.counselor && <span className="text-xs text-[#6B7280]">· {c.counselor}</span>}
                  </div>
                  <p className="text-sm text-[#1A1D29] mt-2 whitespace-pre-line">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 수납이력
    const invs = getInvoiceByStudent(s.id);
    return (
      <div className="space-y-2">
        {editMode && <p className="text-xs text-[#6B7280]">수납이력은 편집할 수 없습니다.</p>}
        {invs.length === 0 && <p className="text-sm text-[#6B7280]">수납 이력이 없습니다.</p>}
        {invs.map(inv => {
          const total = inv.tuition_amount + inv.material_amount + inv.content_amount - inv.discount_amount;
          const pay = payments.find(p => p.invoice_id === inv.id);
          const badge = inv.status === '완납' ? 'paid' : inv.status === '미납' ? 'unpaid' : inv.status === '부분납' ? 'partial' : 'default';
          return (
            <div key={inv.id} className="border border-[#E8EBF1] rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[#1A1D29]">{inv.billing_month} 수강분</div>
                <Badge variant={badge}>{inv.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-[#6B7280]">
                <span>교육비 {formatMoney(inv.tuition_amount)}</span>
                <span>교구비 {formatMoney(inv.material_amount)}</span>
                <span>콘텐츠비 {formatMoney(inv.content_amount)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8EBF1]">
                <span className="text-xs text-[#6B7280]">
                  {inv.discount_amount > 0 ? `할인 ${formatMoney(inv.discount_amount)} · ` : ''}
                  {pay ? `${pay.method} · ${pay.paid_at.slice(0, 10)}` : '미수납'}
                </span>
                <span className="text-sm font-semibold text-[#1A1D29] tabular-nums">{formatMoney(total)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1D29]">원생 관리</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={riskOnly} onChange={e => setRiskOnly(e.target.checked)} className="w-4 h-4 accent-[#F2474B]" />
            <span className="text-sm text-[#1A1D29]">퇴원위험생만 보기</span>
          </label>
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            엑셀 일괄 등록
          </Button>
          <Button size="sm" onClick={() => setShowRegister(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            신규 원생 등록
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <Card className="mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="원생명" placeholder="이름 검색" value={filterName} onChange={e => setFilterName(e.target.value)} />
          <Select label="등록구분" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={STATUSES.map(v => ({ value: v, label: v }))} />
          <Select label="반" value={filterClass} onChange={e => setFilterClass(e.target.value)} options={classOptions} />
          <Select label="학년" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} options={GRADES.map(g => ({ value: g, label: g }))} />
        </div>
        <div className="flex justify-end mt-3">
          <Button variant="secondary" onClick={resetFilters}>초기화</Button>
        </div>
      </Card>

      {/* 퇴원 위험 한정 모드 배너 (대시보드 진입 전용) */}
      {riskOnly && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-[#FEE9EA] border border-[#F2474B]/20 rounded-lg">
          <span className="text-sm font-medium text-[#F2474B]">⚠ 퇴원 위험 {riskEntries.length}명</span>
          <button className="ml-auto text-xs text-[#6B7280] hover:text-[#1A1D29]" onClick={() => setRiskOnly(false)}>전체 보기</button>
        </div>
      )}

      {/* 액션 바 */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-[#EAF1FF] border border-[#2F6BFF]/20 rounded-lg">
          <span className="text-sm text-[#2F6BFF] font-medium">{selected.size}명 선택됨</span>
          <Button size="sm" onClick={() => setShowMsgModal(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            문자 발송
          </Button>
          <Button variant="secondary" size="sm">엑셀 내보내기</Button>
          <button className="ml-auto text-xs text-[#6B7280]" onClick={() => setSelected(new Set())}>선택 해제</button>
        </div>
      )}

      {/* 테이블 */}
      <Card>
        <div className="-m-6">
          <div className="px-4 py-3 border-b border-[#E8EBF1] bg-[#F4F6FA] flex items-center gap-3">
            <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-4 h-4 accent-[#2F6BFF]" />
            <span className="text-xs font-semibold text-[#6B7280]">전체 선택</span>
            <span className="ml-auto text-xs text-[#6B7280]">총 {filtered.length}명</span>
          </div>
          <Table
            columns={columns as unknown as Parameters<typeof Table>[0]['columns']}
            data={filtered as unknown as Record<string, unknown>[]}
            onRowClick={(row) => openDetail(row as unknown as Student)}
          />
        </div>
      </Card>

      {/* 원생 상세 모달 */}
      {detailStudent && (
        <Modal
          open={!!detailStudent}
          onClose={closeDetail}
          title={`원생 상세 — ${detailStudent.name}`}
          size="lg"
          footer={
            editMode ? (
              <>
                <Button variant="secondary" onClick={cancelEdit}>취소</Button>
                <Button onClick={saveEdit} disabled={!editForm?.name?.trim()}>저장</Button>
              </>
            ) : detailTab === '기본정보' ? (
              <div className="w-full flex items-center justify-between">
                <DeleteButton onClick={() => setConfirmDelete(true)}>원생 삭제</DeleteButton>
                <Button onClick={startEdit}>편집</Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={closeDetail}>닫기</Button>
            )
          }
        >
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-[#E8EBF1] pb-3">
              {visibleDetailTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                    detailTab === tab ? 'bg-[#EAF1FF] text-[#2F6BFF]' : 'text-[#1A1D29] hover:bg-[#F4F6FA]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {renderDetailBody()}
          </div>
        </Modal>
      )}

      {/* 삭제 확인 모달 */}
      {confirmDelete && detailStudent && (
        <Modal
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title="원생 삭제"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>취소</Button>
              <Button variant="danger" onClick={deleteStudent}>삭제</Button>
            </>
          }
        >
          <p className="text-sm text-[#1A1D29]"><span className="font-semibold">{detailStudent.name}</span> 원생을 목록에서 삭제하시겠습니까?</p>
          <p className="text-xs text-[#6B7280] mt-2">이 작업은 되돌릴 수 없습니다.</p>
        </Modal>
      )}

      {/* 신규 원생 등록 모달 */}
      <Modal
        open={showRegister}
        onClose={closeRegister}
        title="신규 원생 등록"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeRegister}>취소</Button>
            <Button onClick={closeRegister} disabled={!canRegister}>등록 완료</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={<>이름 <span className="text-[#F2474B]">*</span></>} placeholder="홍길동" value={regName} onChange={e => setRegName(e.target.value)} />
            <Select label="성별" value={regGender} onChange={e => setRegGender(e.target.value)} options={[{ value: '', label: '선택' }, { value: '남', label: '남' }, { value: '여', label: '여' }]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="학부" options={DIVISIONS.slice(1).map(d => ({ value: d, label: d }))} />
            <Select label="학년" options={GRADES.slice(1).map(g => ({ value: g, label: g }))} />
          </div>
          <Input label="학교" placeholder="판교초" />
          <div>
            <p className="text-sm font-medium text-[#1A1D29] mb-1">보호자 연락처 <span className="text-xs font-normal text-[#6B7280]">(모·부·기타 중 1개 이상 필수)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="모 연락처" placeholder="010-0000-0000" value={regMotherPhone} onChange={e => setRegMotherPhone(e.target.value)} />
              <Input label="부 연락처" placeholder="010-0000-0000" value={regFatherPhone} onChange={e => setRegFatherPhone(e.target.value)} />
            </div>
            <div className="mt-3 flex gap-2 items-end">
              <div className="w-32 shrink-0">
                <Select label="그 외 보호자 관계" value={regOtherRelation} onChange={e => setRegOtherRelation(e.target.value)} options={[{ value: '', label: '관계' }, ...GUARDIAN_RELATIONS.map(r => ({ value: r, label: r }))]} />
              </div>
              <div className="flex-1">
                <Input label="그 외 보호자 연락처" placeholder="010-0000-0000" value={regOtherPhone} onChange={e => setRegOtherPhone(e.target.value)} />
              </div>
            </div>
            {regName.trim() !== '' && !regMotherPhone.trim() && !regFatherPhone.trim() && !regOtherPhone.trim() && (
              <p className="text-xs text-[#F2474B] mt-1">모·부·기타 보호자 연락처 중 최소 1개는 필수입니다.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="원생 연락처 (선택)" placeholder="010-0000-0000" />
            <Input label="최초 등원일" type="date" />
          </div>
          <Select
            label="유입경로"
            value={regSourceSel}
            onChange={e => setRegSourceSel(e.target.value)}
            options={[...SOURCES, '기타'].map(s => ({ value: s, label: s }))}
          />
          {regSourceSel === '기타' && (
            <Input label="유입경로 직접 입력" placeholder="예: 당근마켓, 지역 맘카페" value={regSourceEtc} onChange={e => setRegSourceEtc(e.target.value)} />
          )}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#1A1D29]">입반할 반 <span className="text-xs font-normal text-[#6B7280]">(복수 선택 가능)</span></label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={includeEndedReg} onChange={() => setIncludeEndedReg(v => !v)} className="w-3.5 h-3.5 accent-[#2F6BFF]" />
                <span className="text-xs text-[#6B7280]">종강반 포함</span>
              </label>
            </div>
            <input value={regClassSearch} onChange={e => setRegClassSearch(e.target.value)} placeholder="반 검색 (반명·과정·담임)"
              className="w-full border border-[#E8EBF1] rounded-md px-3 py-2 text-sm bg-white mt-1.5 focus:outline-none focus:border-[#2F6BFF]" />
            <div className="mt-1.5 border border-[#E8EBF1] rounded-md divide-y divide-[#E8EBF1] max-h-40 overflow-y-auto">
              {classes.filter(c => matchClass(c, regClassSearch) && (includeEndedReg || c.end_date >= today || regClasses.has(c.id))).map(c => (
                <label key={c.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F4F6FA]">
                  <input type="checkbox" checked={regClasses.has(c.id)} onChange={() => toggleRegClass(c.id)} className="w-4 h-4 accent-[#2F6BFF]" />
                  <span className="text-sm text-[#1A1D29]">{c.name}</span>
                  {c.end_date < today && <span className="text-xs text-[#6B7280]">(종강)</span>}
                </label>
              ))}
              {classes.filter(c => matchClass(c, regClassSearch) && (includeEndedReg || c.end_date >= today || regClasses.has(c.id))).length === 0 && (
                <p className="px-3 py-2 text-xs text-[#6B7280]">검색 결과가 없습니다.</p>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">선택하지 않으면 미배정으로 등록됩니다.</p>
          </div>
          <Input label="특이사항 (선택)" placeholder="예: 견과류 알레르기" />
          <Textarea label="메모 (선택)" rows={3} placeholder="상담 내용 등 비공개 메모" />
          {regClasses.size === 0 ? (
            <div className="bg-[#FFF4E0] border border-[#C18A14]/30 rounded-lg px-5 py-3">
              <p className="text-sm font-semibold text-[#C18A14]">반 미배정 안내</p>
              <p className="text-xs text-[#6B7280] mt-1">반을 나중에 배정하면 그 시점에 청구 자료가 생성됩니다. 지금은 청구가 생성되지 않습니다.</p>
            </div>
          ) : (
            <div className="bg-[#E6F9EF] border border-[#28C76F]/20 rounded-lg px-5 py-3">
              <p className="text-sm font-semibold text-[#28C76F]">청구 자동 생성 안내</p>
              <p className="text-xs text-[#6B7280] mt-1">선택한 {regClasses.size}개 반의 수강료·납입기준일 설정에 따라 2026-06월 청구 자료가 각각 자동 생성됩니다.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* 엑셀(CSV) 일괄 등록 모달 */}
      <Modal
        open={showImport}
        onClose={closeImport}
        title="원생 엑셀 일괄 등록"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeImport}>취소</Button>
            <Button onClick={confirmImport} disabled={importValid.length === 0}>
              {importValid.length > 0 ? `${importValid.length}명 등록` : '등록'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-[#F4F6FA] rounded-lg px-5 py-4">
            <p className="text-sm text-[#1A1D29] font-medium">통통통 등 기존 시스템 데이터를 한 번에 가져옵니다.</p>
            <p className="text-xs text-[#6B7280] mt-1">
              통통통을 쓰지 않는 경우 아래 양식을 내려받아 작성하세요. 엑셀에서 <span className="font-medium">CSV UTF-8</span> 형식으로 저장하면 됩니다.
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={downloadTemplate}>양식(CSV) 다운로드</Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1D29] mb-1.5">CSV 파일 선택</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportFile}
              className="block w-full text-sm text-[#1A1D29] file:mr-3 file:rounded-md file:border-0 file:bg-[#2F6BFF] file:px-3 file:py-2 file:text-white file:cursor-pointer hover:file:bg-[#1F57E6]"
            />
            {importFileName && <p className="text-xs text-[#6B7280] mt-1.5">{importFileName} · 총 {importRows.length}행</p>}
          </div>

          {importRows.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-2 text-sm">
                <span className="text-[#28C76F] font-medium">유효 {importValid.length}명</span>
                {importInvalid.length > 0 && <span className="text-[#F2474B] font-medium">오류 {importInvalid.length}건</span>}
                <span className="text-xs text-[#6B7280]">반 배정은 등록 후 개별 진행</span>
              </div>
              <div className="border border-[#E8EBF1] rounded-md max-h-60 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F4F6FA] text-[#6B7280] sticky top-0">
                    <tr>
                      <th className="text-left font-medium px-3 py-2 w-10">#</th>
                      <th className="text-left font-medium px-3 py-2">이름</th>
                      <th className="text-left font-medium px-3 py-2">학년</th>
                      <th className="text-left font-medium px-3 py-2">학교</th>
                      <th className="text-left font-medium px-3 py-2">모 연락처</th>
                      <th className="text-left font-medium px-3 py-2">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map(r => (
                      <tr key={r.row} className={`border-t border-[#E8EBF1] ${r.errors.length ? 'bg-[#FEE9EA]' : ''}`}>
                        <td className="px-3 py-2 text-[#6B7280] tabular-nums">{r.row}</td>
                        <td className="px-3 py-2 text-[#1A1D29]">{r.name || <span className="text-[#AEB4C0]">-</span>}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{r.grade || '-'}</td>
                        <td className="px-3 py-2 text-[#6B7280]">{r.school || '-'}</td>
                        <td className="px-3 py-2 text-[#6B7280] tabular-nums">{r.parent_phone || r.father_phone || r.student_phone || '-'}</td>
                        <td className="px-3 py-2">
                          {r.errors.length === 0
                            ? <span className="text-xs text-[#28C76F]">정상</span>
                            : <span className="text-xs text-[#F2474B]">{r.errors.join(', ')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importInvalid.length > 0 && (
                <p className="text-xs text-[#6B7280] mt-1.5">오류 행은 등록에서 제외됩니다. 유효한 {importValid.length}명만 등록됩니다.</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* 문자 발송 모달 */}
      <Modal open={showMsgModal} onClose={() => setShowMsgModal(false)} title={`문자 발송 — ${selected.size}명`} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowMsgModal(false)}>취소</Button>
            <Button onClick={() => { setShowMsgModal(false); alert(`발송 미리보기: 문자가 ${selected.size}명에게 발송되었습니다.`); }}>발송</Button>
          </>
        }
      >
        {(() => {
          const recipients = [...selected].map(id => localStudents.find(s => s.id === id)).filter(Boolean) as Student[];
          const phoneOf = (s: Student) => msgTarget === '모' ? s.parent_phone : msgTarget === '부' ? (s.father_phone ?? '') : s.student_phone;
          const sampleName = recipients[0]?.name ?? '홍길동';
          const missing = recipients.filter(s => !phoneOf(s));
          const previewText = msgBody.split('{원생명}').join(sampleName);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select label="템플릿" value={msgTemplate} onChange={e => selectMsgTemplate(e.target.value)}
                  options={MSG_TEMPLATES.map(t => ({ value: t.value, label: t.label }))} />
                <Select label="수신 대상" value={msgTarget} onChange={e => setMsgTarget(e.target.value as '모' | '부' | '본인')}
                  options={MSG_TARGETS} />
              </div>

              <div>
                <Textarea label="메시지 내용" rows={8} value={msgBody} onChange={e => setMsgBody(e.target.value)} />
                <p className="text-xs text-[#6B7280] mt-1">{'{'}원생명{'}'} 변수는 각 수신자 이름으로 자동 치환됩니다.</p>
              </div>

              {/* 발송 미리보기 */}
              <div>
                <p className="text-xs font-semibold text-[#6B7280] mb-1.5">발송 미리보기 · {sampleName} 기준</p>
                <div className="bg-[#FFF4E0] border border-[#E8EBF1] rounded-xl px-4 py-3 max-w-[320px]">
                  <p className="text-[11px] text-[#6B7280] mb-1.5 flex items-center gap-1">
                    <span className="inline-block w-3.5 h-3.5 rounded bg-[#F4B000] text-[#1A1D29] text-[8px] font-bold flex items-center justify-center">talk</span>
                    카카오 알림톡
                  </p>
                  <p className="text-sm text-[#1A1D29] whitespace-pre-line leading-relaxed">{previewText}</p>
                </div>
              </div>

              {/* 수신 번호 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-[#6B7280]">수신 번호 · {recipients.length - missing.length}명 발송</p>
                  {missing.length > 0 && <p className="text-xs text-[#F2474B]">{missing.length}명 번호 없음 (발송 제외)</p>}
                </div>
                <div className="max-h-36 overflow-y-auto border border-[#E8EBF1] rounded-md divide-y divide-[#E8EBF1]">
                  {recipients.length === 0 && <p className="px-3 py-3 text-xs text-[#6B7280] text-center">선택된 원생이 없습니다.</p>}
                  {recipients.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-xs text-[#1A1D29]">{s.name}</span>
                      <span className={`text-xs tabular-nums ${phoneOf(s) ? 'text-[#1A1D29]' : 'text-[#F2474B]'}`}>{phoneOf(s) || '번호 없음'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
