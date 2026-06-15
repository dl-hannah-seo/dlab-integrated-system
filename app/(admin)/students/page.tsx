'use client';

import { useState, useMemo } from 'react';
import {
  students as initialStudents,
  classes,
  enrollments as initialEnrollments,
  getCurrentEnrollment,
  getInvoiceByStudent,
  payments,
  Student,
  Enrollment,
} from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DeleteButton } from '@/components/ui/DeleteButton';

const DIVISIONS = ['전체', '유치부', '초등부', '중등부', '고등부'];
const GRADES = ['전체', '5세', '6세', '7세', '초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3'];
const STATUSES = ['전체', '재원', '퇴원', '휴원'];
const SOURCES = ['지인소개', '인스타그램', '블로그', '학교안내', '현수막', '네이버카페'];
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
const DETAIL_TABS = ['기본정보', '가족/보호자', '수강이력', '수납이력'] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

const TEACHERS = Array.from(new Set(classes.map(c => c.teacher)));

function formatMoney(n: number) { return n.toLocaleString('ko-KR') + '원'; }

// 보기/편집 공통 필드 행 — 라벨 위치 고정, 값 칸만 텍스트↔입력으로 교체
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#787774]">{label}</span>
      <div className="min-h-[34px] flex items-center">{children}</div>
    </div>
  );
}
function ViewText({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-[#37352F]">{children}</span>;
}

export default function StudentsPage() {
  const [localStudents, setLocalStudents] = useState<Student[]>(initialStudents);
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

  // 필터
  const [filterName, setFilterName] = useState('');
  const [filterDivision, setFilterDivision] = useState('전체');
  const [filterGrade, setFilterGrade] = useState('전체');
  const [filterStatus, setFilterStatus] = useState('재원');
  const [filterClass, setFilterClass] = useState('전체');
  const [filterTeacher, setFilterTeacher] = useState('전체');
  const [enrollFrom, setEnrollFrom] = useState('');
  const [enrollTo, setEnrollTo] = useState('');
  const [firstFrom, setFirstFrom] = useState('');
  const [firstTo, setFirstTo] = useState('');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRegister, setShowRegister] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);

  // 신규 등록 폼 — 조건부 UI용 상태
  const [regSourceSel, setRegSourceSel] = useState(SOURCES[0]);
  const [regSourceEtc, setRegSourceEtc] = useState('');
  const [regClasses, setRegClasses] = useState<Set<string>>(new Set());

  // 편집 시 수강 반(복수) 작업 집합
  const [editClasses, setEditClasses] = useState<Set<string>>(new Set());
  function toggleEditClass(cid: string) {
    setEditClasses(prev => { const n = new Set(prev); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
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

  // 상세 모달
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('기본정보');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const classOptions = [
    { value: '전체', label: '전체 반' },
    ...classes.map(c => ({ value: c.id, label: c.name })),
  ];

  const filtered = useMemo(() => {
    return localStudents.filter(s => {
      if (filterName && !s.name.includes(filterName)) return false;
      if (filterDivision !== '전체' && (s.division ?? '') !== filterDivision) return false;
      if (filterGrade !== '전체' && s.grade !== filterGrade) return false;
      if (filterStatus !== '전체' && s.status !== filterStatus) return false;
      const myClassIds = activeClassIds(s.id);
      if (filterClass !== '전체' && !myClassIds.includes(filterClass)) return false;
      if (filterTeacher !== '전체') {
        const myTeachers = myClassIds.map(id => classes.find(c => c.id === id)?.teacher);
        if (!myTeachers.includes(filterTeacher)) return false;
      }
      const enrollStart = getCurrentEnrollment(s.id)?.started_at ?? s.first_enrolled_at;
      if (enrollFrom && enrollStart < enrollFrom) return false;
      if (enrollTo && enrollStart > enrollTo) return false;
      if (firstFrom && s.first_enrolled_at < firstFrom) return false;
      if (firstTo && s.first_enrolled_at > firstTo) return false;
      return true;
    });
  }, [localStudents, localEnrollments, filterName, filterDivision, filterGrade, filterStatus, filterClass, filterTeacher, enrollFrom, enrollTo, firstFrom, firstTo]);

  function resetFilters() {
    setFilterName(''); setFilterDivision('전체'); setFilterGrade('전체');
    setFilterStatus('재원'); setFilterClass('전체'); setFilterTeacher('전체');
    setEnrollFrom(''); setEnrollTo(''); setFirstFrom(''); setFirstTo('');
  }

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
  function closeDetail() {
    setDetailStudent(null);
    setEditMode(false);
    setConfirmDelete(false);
  }
  function startEdit() {
    if (!detailStudent) return;
    setEditForm({ ...detailStudent });
    setEditClasses(new Set(activeClassIds(detailStudent.id)));
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
          className="w-4 h-4 accent-[#FF6C37]" onClick={e => e.stopPropagation()} />
      ),
      className: 'w-10',
    },
    { key: 'name', header: '성명', render: (r: Student) => <span className="font-medium whitespace-nowrap">{r.name}</span> },
    { key: 'student_phone', header: '원생 연락처', render: (r: Student) => <span className="tabular-nums text-xs">{r.student_phone || '-'}</span> },
    { key: 'parent_phone', header: '모 연락처', render: (r: Student) => <span className="tabular-nums text-xs">{r.parent_phone}</span> },
    { key: 'father_phone', header: '부 연락처', render: (r: Student) => <span className="tabular-nums text-xs">{r.father_phone || '-'}</span> },
    { key: 'division', header: '학부', render: (r: Student) => <span className="text-xs whitespace-nowrap">{r.division ?? '-'}</span> },
    { key: 'school', header: '학교', render: (r: Student) => <span className="text-xs whitespace-nowrap">{r.school}</span> },
    { key: 'grade', header: '학년', render: (r: Student) => <span className="text-xs whitespace-nowrap">{r.grade}</span> },
    {
      key: 'class_id', header: '반명',
      render: (r: Student) => {
        const names = activeClassNames(r.id);
        return <span className="text-xs whitespace-nowrap" title={names.join('\n')}>{classLabel(r.id)}</span>;
      },
    },
    { key: 'enroll_start', header: '등록시작일', render: (r: Student) => <span className="tabular-nums text-xs whitespace-nowrap">{getCurrentEnrollment(r.id)?.started_at ?? r.first_enrolled_at}</span> },
    {
      key: 'status', header: '등록구분',
      render: (r: Student) => <Badge variant={r.status === '재원' ? 'active' : 'withdrawn'}>{r.status}</Badge>,
    },
    { key: 'source', header: '유입경로', render: (r: Student) => <span className="text-xs text-[#787774] whitespace-nowrap">{r.source}</span> },
  ];

  // ── 상세 모달 본문 ─────────────────────────────────────────
  function renderDetailBody() {
    if (!detailStudent) return null;
    const s = detailStudent;
    const f = editForm;

    // 기본정보 (학생 본인 속성)
    if (detailTab === '기본정보') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <Field label="이름">
              {editMode && f ? <Input value={f.name} onChange={e => updateField('name', e.target.value)} /> : <ViewText>{s.name}</ViewText>}
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
            <Field label="등록구분">
              {editMode && f
                ? <Select value={f.status} onChange={e => updateField('status', e.target.value as Student['status'])} options={STATUSES.slice(1).map(v => ({ value: v, label: v }))} />
                : <ViewText>{s.status}</ViewText>}
            </Field>
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
            <Field label="최초 입학일"><ViewText>{s.first_enrolled_at}</ViewText></Field>
            <Field label="포인트"><ViewText>{s.points.toLocaleString()}DP</ViewText></Field>
            <Field label="칭호"><ViewText>{s.title || '없음'}</ViewText></Field>
            <Field label="특이사항">
              {editMode && f ? <Input value={f.special_note ?? ''} placeholder="없음" onChange={e => updateField('special_note', e.target.value)} /> : <ViewText>{s.special_note || '없음'}</ViewText>}
            </Field>
          </div>
          <Field label="메모">
            {editMode && f
              ? <textarea value={f.memo ?? ''} rows={3} placeholder="메모 입력" onChange={e => updateField('memo', e.target.value)}
                  className="w-full border border-[#E9E9E7] rounded-md px-3 py-2 text-sm text-[#37352F] placeholder:text-[#BEBDBA] focus:outline-none focus:border-[#FF6C37] resize-y" />
              : <span className="text-sm font-medium text-[#37352F] whitespace-pre-line">{s.memo || '없음'}</span>}
          </Field>
          <div className="bg-[#F7F7F5] rounded-lg p-3">
            <p className="text-xs font-semibold text-[#787774] mb-2">수강 반 {editMode && <span className="font-normal">(복수 선택 가능)</span>}</p>
            {editMode && f ? (
              <div className="space-y-1.5">
                {classes.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editClasses.has(c.id)} onChange={() => toggleEditClass(c.id)} className="w-4 h-4 accent-[#FF6C37]" />
                    <span className="text-sm text-[#37352F]">{c.name}</span>
                  </label>
                ))}
              </div>
            ) : activeClassNames(s.id).length === 0 ? (
              <p className="text-sm text-[#787774]">미배정</p>
            ) : (
              <div className="space-y-1">
                {activeClassNames(s.id).map(n => <p key={n} className="text-sm text-[#37352F]">{n}</p>)}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 가족/보호자 (부모 연락처 모/부 + 재원형제)
    if (detailTab === '가족/보호자') {
      const siblings = (s.sibling_ids ?? []).map(id => localStudents.find(st => st.id === id)).filter(Boolean) as Student[];
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <Field label="부모 연락처 (모)">
              {editMode && f ? <Input value={f.parent_phone} onChange={e => updateField('parent_phone', e.target.value)} /> : <ViewText>{s.parent_phone}</ViewText>}
            </Field>
            <Field label="부모 연락처 (부)">
              {editMode && f ? <Input value={f.father_phone ?? ''} placeholder="미등록" onChange={e => updateField('father_phone', e.target.value)} /> : <ViewText>{s.father_phone || '미등록'}</ViewText>}
            </Field>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#787774] mb-2">재원형제</p>
            {siblings.length === 0 ? (
              <p className="text-sm text-[#787774]">등록된 재원형제가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {siblings.map(sib => (
                  <div key={sib.id} className="flex items-center justify-between border border-[#E9E9E7] rounded-lg px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-[#37352F]">{sib.name}</span>
                      <span className="text-xs text-[#787774] ml-2">{sib.grade} · {classes.find(c => c.id === sib.class_id)?.schedule ?? '-'}</span>
                    </div>
                    <Badge variant={sib.status === '재원' ? 'active' : 'withdrawn'}>{sib.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 수강이력
    if (detailTab === '수강이력') {
      const ens = localEnrollments.filter(e => e.student_id === s.id);
      return (
        <div className="space-y-2">
          {editMode && <p className="text-xs text-[#787774]">수강이력은 편집할 수 없습니다.</p>}
          {ens.length === 0 && <p className="text-sm text-[#787774]">수강 이력이 없습니다.</p>}
          {ens.map(e => {
            const cls = classes.find(c => c.id === e.class_id);
            return (
              <div key={e.id} className="flex items-center justify-between border border-[#E9E9E7] rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[#37352F]">{cls?.name ?? e.class_id}</div>
                  <div className="text-xs text-[#787774] mt-0.5 tabular-nums">{e.started_at} ~ {e.ended_at ?? '수강 중'}</div>
                </div>
                <Badge variant={e.ended_at ? 'withdrawn' : 'active'}>{e.ended_at ? (e.end_reason ?? '종료') : '수강 중'}</Badge>
              </div>
            );
          })}
        </div>
      );
    }

    // 수납이력
    const invs = getInvoiceByStudent(s.id);
    return (
      <div className="space-y-2">
        {editMode && <p className="text-xs text-[#787774]">수납이력은 편집할 수 없습니다.</p>}
        {invs.length === 0 && <p className="text-sm text-[#787774]">수납 이력이 없습니다.</p>}
        {invs.map(inv => {
          const total = inv.tuition_amount + inv.material_amount + inv.content_amount - inv.discount_amount;
          const pay = payments.find(p => p.invoice_id === inv.id);
          const badge = inv.status === '완납' ? 'paid' : inv.status === '미납' ? 'unpaid' : inv.status === '부분납' ? 'partial' : 'default';
          return (
            <div key={inv.id} className="border border-[#E9E9E7] rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[#37352F]">{inv.billing_month} 수강분</div>
                <Badge variant={badge}>{inv.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-[#787774]">
                <span>교육비 {formatMoney(inv.tuition_amount)}</span>
                <span>교구비 {formatMoney(inv.material_amount)}</span>
                <span>콘텐츠비 {formatMoney(inv.content_amount)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E9E9E7]">
                <span className="text-xs text-[#787774]">
                  {inv.discount_amount > 0 ? `할인 ${formatMoney(inv.discount_amount)} · ` : ''}
                  {pay ? `${pay.method} · ${pay.paid_at.slice(0, 10)}` : '미수납'}
                </span>
                <span className="text-sm font-semibold text-[#37352F] tabular-nums">{formatMoney(total)}</span>
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
          <h1 className="text-xl font-bold text-[#37352F]">원생 관리</h1>
          <p className="text-sm text-[#787774] mt-1">조건별 조회 · 신규 등록/삭제 · 정보 편집 · 문자 발송 · 엑셀 내보내기</p>
        </div>
        <Button size="sm" onClick={() => setShowRegister(true)}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          신규 원생 등록
        </Button>
      </div>

      {/* 필터 */}
      <Card className="mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="원생명" placeholder="이름 검색" value={filterName} onChange={e => setFilterName(e.target.value)} />
          <Select label="학부" value={filterDivision} onChange={e => setFilterDivision(e.target.value)} options={DIVISIONS.map(d => ({ value: d, label: d }))} />
          <Select label="학년" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} options={GRADES.map(g => ({ value: g, label: g }))} />
          <Select label="등록구분" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={STATUSES.map(v => ({ value: v, label: v }))} />
          <Select label="반" value={filterClass} onChange={e => setFilterClass(e.target.value)} options={classOptions} />
          <Select label="담임" value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} options={[{ value: '전체', label: '전체 담임' }, ...TEACHERS.map(t => ({ value: t, label: t }))]} />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#37352F]">등록기간</span>
            <div className="flex items-center gap-1">
              <input type="date" value={enrollFrom} onChange={e => setEnrollFrom(e.target.value)} className="w-full border border-[#E9E9E7] rounded-md px-2 py-2 text-sm text-[#37352F] focus:outline-none focus:border-[#FF6C37]" />
              <span className="text-[#787774]">~</span>
              <input type="date" value={enrollTo} onChange={e => setEnrollTo(e.target.value)} className="w-full border border-[#E9E9E7] rounded-md px-2 py-2 text-sm text-[#37352F] focus:outline-none focus:border-[#FF6C37]" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#37352F]">최초입학일</span>
            <div className="flex items-center gap-1">
              <input type="date" value={firstFrom} onChange={e => setFirstFrom(e.target.value)} className="w-full border border-[#E9E9E7] rounded-md px-2 py-2 text-sm text-[#37352F] focus:outline-none focus:border-[#FF6C37]" />
              <span className="text-[#787774]">~</span>
              <input type="date" value={firstTo} onChange={e => setFirstTo(e.target.value)} className="w-full border border-[#E9E9E7] rounded-md px-2 py-2 text-sm text-[#37352F] focus:outline-none focus:border-[#FF6C37]" />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button variant="secondary" onClick={resetFilters}>초기화</Button>
        </div>
      </Card>

      {/* 액션 바 */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-[#FFF1EC] border border-[#FF6C37]/20 rounded-lg">
          <span className="text-sm text-[#FF6C37] font-medium">{selected.size}명 선택됨</span>
          <Button size="sm" onClick={() => setShowMsgModal(true)}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            문자 발송
          </Button>
          <Button variant="secondary" size="sm">엑셀 내보내기</Button>
          <button className="ml-auto text-xs text-[#787774]" onClick={() => setSelected(new Set())}>선택 해제</button>
        </div>
      )}

      {/* 테이블 */}
      <Card>
        <div className="-m-6">
          <div className="px-4 py-3 border-b border-[#E9E9E7] bg-[#F7F7F5] flex items-center gap-3">
            <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-4 h-4 accent-[#FF6C37]" />
            <span className="text-xs font-semibold text-[#787774]">전체 선택</span>
            <span className="ml-auto text-xs text-[#787774]">총 {filtered.length}명</span>
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
            <div className="flex gap-2 border-b border-[#E9E9E7] pb-3">
              {DETAIL_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                    detailTab === tab ? 'bg-[#FFF1EC] text-[#FF6C37]' : 'text-[#37352F] hover:bg-[#F7F7F5]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {editMode && (
              <div className="bg-[#FFF1EC] border border-[#FF6C37]/20 rounded-md px-3 py-2">
                <p className="text-xs text-[#FF6C37] font-medium">편집 모드 · 기본정보·가족 탭의 값을 수정한 뒤 저장하세요.</p>
              </div>
            )}
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
          <p className="text-sm text-[#37352F]"><span className="font-semibold">{detailStudent.name}</span> 원생을 목록에서 삭제하시겠습니까?</p>
          <p className="text-xs text-[#787774] mt-2">이 작업은 되돌릴 수 없습니다.</p>
        </Modal>
      )}

      {/* 신규 원생 등록 모달 */}
      <Modal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        title="신규 원생 등록"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRegister(false)}>취소</Button>
            <Button onClick={() => setShowRegister(false)}>등록 완료</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="이름" placeholder="홍길동" />
            <Select label="학부" options={DIVISIONS.slice(1).map(d => ({ value: d, label: d }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="학년" options={GRADES.slice(1).map(g => ({ value: g, label: g }))} />
            <Input label="학교" placeholder="판교초" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="부모 연락처 (모)" placeholder="010-0000-0000" />
            <Input label="부모 연락처 (부)" placeholder="010-0000-0000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="원생 연락처 (선택)" placeholder="010-0000-0000" />
            <Input label="최초 입학일" type="date" />
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
            <label className="text-sm font-medium text-[#37352F]">입반할 반 <span className="text-xs font-normal text-[#787774]">(복수 선택 가능)</span></label>
            <div className="mt-1.5 border border-[#E9E9E7] rounded-md divide-y divide-[#E9E9E7] max-h-40 overflow-y-auto">
              {classes.map(c => (
                <label key={c.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F7F7F5]">
                  <input type="checkbox" checked={regClasses.has(c.id)} onChange={() => toggleRegClass(c.id)} className="w-4 h-4 accent-[#FF6C37]" />
                  <span className="text-sm text-[#37352F]">{c.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-[#787774] mt-1">선택하지 않으면 미배정으로 등록됩니다.</p>
          </div>
          <Input label="특이사항 (선택)" placeholder="예: 견과류 알레르기" />
          <Textarea label="메모 (선택)" rows={3} placeholder="상담 내용 등 비공개 메모" />
          {regClasses.size === 0 ? (
            <div className="bg-[#FFF8E6] border border-[#D9A80A]/30 rounded-lg px-5 py-3">
              <p className="text-sm font-semibold text-[#D9A80A]">반 미배정 안내</p>
              <p className="text-xs text-[#787774] mt-1">반을 나중에 배정하면 그 시점에 청구 자료가 생성됩니다. 지금은 청구가 생성되지 않습니다.</p>
            </div>
          ) : (
            <div className="bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-lg px-5 py-3">
              <p className="text-sm font-semibold text-[#0F7B6C]">청구 자동 생성 안내</p>
              <p className="text-xs text-[#787774] mt-1">선택한 {regClasses.size}개 반의 수강료·납입기준일 설정에 따라 2026-06월 청구 자료가 각각 자동 생성됩니다.</p>
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
                <p className="text-xs text-[#787774] mt-1">{'{'}원생명{'}'} 변수는 각 수신자 이름으로 자동 치환됩니다.</p>
              </div>

              {/* 발송 미리보기 */}
              <div>
                <p className="text-xs font-semibold text-[#787774] mb-1.5">발송 미리보기 · {sampleName} 기준</p>
                <div className="bg-[#FEF6E0] border border-[#E9E9E7] rounded-xl px-4 py-3 max-w-[320px]">
                  <p className="text-[11px] text-[#787774] mb-1.5 flex items-center gap-1">
                    <span className="inline-block w-3.5 h-3.5 rounded bg-[#FAE100] text-[#37352F] text-[8px] font-bold flex items-center justify-center">talk</span>
                    카카오 알림톡
                  </p>
                  <p className="text-sm text-[#37352F] whitespace-pre-line leading-relaxed">{previewText}</p>
                </div>
              </div>

              {/* 수신 번호 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-[#787774]">수신 번호 · {recipients.length - missing.length}명 발송</p>
                  {missing.length > 0 && <p className="text-xs text-[#EB5757]">{missing.length}명 번호 없음 (발송 제외)</p>}
                </div>
                <div className="max-h-36 overflow-y-auto border border-[#E9E9E7] rounded-md divide-y divide-[#E9E9E7]">
                  {recipients.length === 0 && <p className="px-3 py-3 text-xs text-[#787774] text-center">선택된 원생이 없습니다.</p>}
                  {recipients.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-xs text-[#37352F]">{s.name}</span>
                      <span className={`text-xs tabular-nums ${phoneOf(s) ? 'text-[#37352F]' : 'text-[#EB5757]'}`}>{phoneOf(s) || '번호 없음'}</span>
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
