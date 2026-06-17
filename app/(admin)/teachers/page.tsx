'use client';

import { useState } from 'react';
import { teachers as seedTeachers, subjects as seedSubjects, classes as seedClasses, Teacher, Subject, Class } from '@/lib/mock-data';
import { eligibleClasses } from '@/lib/teacher-matching';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { DeleteButton } from '@/components/ui/DeleteButton';

const STATUSES: Teacher['status'][] = ['재직', '휴직', '퇴직'];

export default function TeachersPage() {
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>(seedTeachers);
  const [localSubjects, setLocalSubjects] = useState<Subject[]>(seedSubjects);
  const [localClasses, setLocalClasses]   = useState<Class[]>(seedClasses);

  const subjectName = (id: string) => localSubjects.find(s => s.id === id)?.name ?? id;
  const assignedCount = (teacherId: string) => localClasses.filter(c => c.teacher_id === teacherId).length;

  // 과목 관리
  const [newSubject, setNewSubject] = useState('');
  function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    setLocalSubjects(p => [...p, { id: `sub-${Date.now()}`, name, order: p.length + 1 }]);
    setNewSubject('');
  }
  function removeSubject(id: string) {
    const usedByClass = localClasses.some(c => c.subject_id === id);
    const usedByTeacher = localTeachers.some(t => t.subject_ids.includes(id));
    if (usedByClass || usedByTeacher) {
      alert('이 과목을 사용하는 반 또는 강사가 있어 삭제할 수 없습니다.');
      return;
    }
    setLocalSubjects(p => p.filter(s => s.id !== id));
  }

  // 강사 생성/수정 모달
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [fName, setFName]       = useState('');
  const [fPhone, setFPhone]     = useState('');
  const [fStatus, setFStatus]   = useState<Teacher['status']>('재직');
  const [fSubjectIds, setFSubjectIds] = useState<string[]>([]);
  const [fClassIds, setFClassIds]     = useState<Set<string>>(new Set());

  function openCreate() {
    setEditId(null);
    setFName(''); setFPhone(''); setFStatus('재직');
    setFSubjectIds([]); setFClassIds(new Set());
    setShowForm(true);
  }
  function openEdit(t: Teacher) {
    setEditId(t.id);
    setFName(t.name); setFPhone(t.phone ?? ''); setFStatus(t.status);
    setFSubjectIds([...t.subject_ids]);
    setFClassIds(new Set(localClasses.filter(c => c.teacher_id === t.id).map(c => c.id)));
    setShowForm(true);
  }
  function toggleFSubject(id: string) {
    const nextSubjects = fSubjectIds.includes(id) ? fSubjectIds.filter(x => x !== id) : [...fSubjectIds, id];
    setFSubjectIds(nextSubjects);
    // 과목에서 빠지면 그 과목 반 선택도 해제
    setFClassIds(prev => {
      const next = new Set(prev);
      localClasses.forEach(c => { if (!nextSubjects.includes(c.subject_id)) next.delete(c.id); });
      return next;
    });
  }
  function toggleFClass(id: string) {
    setFClassIds(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function save() {
    if (!fName.trim() || fSubjectIds.length === 0) return;
    const id = editId ?? `tch-new-${Date.now()}`;
    const teacher: Teacher = { id, campus_id: 'campus-001', name: fName.trim(), subject_ids: [...fSubjectIds], phone: fPhone.trim() || undefined, status: fStatus };
    setLocalTeachers(p => editId ? p.map(t => t.id === id ? teacher : t) : [...p, teacher]);
    // 담임 배정 반영: 선택된 반은 담임=이 강사, 이전에 이 강사였다가 해제된 반은 담임 비움
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

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#37352F]">강사 관리</h1>
        <Button onClick={openCreate}>＋ 강사 추가</Button>
      </div>

      {/* 과목 관리 */}
      <Card className="mb-6 p-5">
        <p className="text-sm font-semibold text-[#37352F] mb-3">과목 관리</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {localSubjects.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md text-sm text-[#37352F]">
              {s.name}
              <button type="button" onClick={() => removeSubject(s.id)} className="text-[#BEBDBA] hover:text-[#EB5757]">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="새 과목명 (예: 스크래치)" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="max-w-xs" />
          <Button variant="secondary" onClick={addSubject}>추가</Button>
        </div>
      </Card>

      {/* 강사 목록 */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F7F7F5] text-[#787774]">
            <tr>
              <th className="text-left font-medium px-4 py-3">이름</th>
              <th className="text-left font-medium px-4 py-3">가르칠 수 있는 과목</th>
              <th className="text-left font-medium px-4 py-3">담임 반</th>
              <th className="text-left font-medium px-4 py-3">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {localTeachers.map(t => (
              <tr key={t.id} className="border-t border-[#E9E9E7]">
                <td className="px-4 py-3 text-[#37352F] font-medium">{t.name}</td>
                <td className="px-4 py-3 text-[#37352F]">{t.subject_ids.map(subjectName).join(', ')}</td>
                <td className="px-4 py-3 text-[#787774]">{assignedCount(t.id)}개</td>
                <td className="px-4 py-3 text-[#787774]">{t.status}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" onClick={() => openEdit(t)} className="text-sm text-[#37352F] hover:underline mr-3">수정</button>
                  <DeleteButton onClick={() => removeTeacher(t.id)}>삭제</DeleteButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 생성/수정 모달 */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? '강사 수정' : '강사 추가'}
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
            <Input label={<>이름 <span className="text-[#EB5757]">*</span></>} value={fName} onChange={e => setFName(e.target.value)} placeholder="예: 메튜" />
            <Input label="연락처" value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="010-0000-0000" />
          </div>

          <Select
            label="상태"
            value={fStatus}
            onChange={e => setFStatus(e.target.value as Teacher['status'])}
            options={STATUSES.map(s => ({ value: s, label: s }))}
          />

          {/* 가르칠 수 있는 과목 */}
          <div>
            <label className="block text-sm font-medium text-[#37352F] mb-1.5">
              가르칠 수 있는 과목 <span className="text-[#EB5757]">*</span> <span className="text-xs font-normal text-[#787774]">(복수 선택)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {localSubjects.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleFSubject(s.id)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-all ${
                    fSubjectIds.includes(s.id)
                      ? 'bg-[#FF6C37] text-white border-[#FF6C37]'
                      : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7] hover:border-[#FF6C37]/50'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* 맡을 반 — 선택 과목에 해당하는 반만 (하드 필터) */}
          <div>
            <label className="block text-sm font-medium text-[#37352F] mb-1.5">맡을 반 <span className="text-xs font-normal text-[#787774]">(담임)</span></label>
            {fSubjectIds.length === 0 ? (
              <p className="text-sm text-[#787774] bg-[#F7F7F5] border border-[#E9E9E7] rounded-md px-3 py-3">과목을 먼저 선택하세요.</p>
            ) : formClasses.length === 0 ? (
              <p className="text-sm text-[#787774] bg-[#F7F7F5] border border-[#E9E9E7] rounded-md px-3 py-3">선택한 과목의 반이 없습니다.</p>
            ) : (
              <div className="border border-[#E9E9E7] rounded-md divide-y max-h-48 overflow-y-auto">
                {formClasses.map(c => {
                  const other = c.teacher_id && c.teacher_id !== editId ? c.teacher : '';
                  return (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F7F7F5]">
                      <input type="checkbox" checked={fClassIds.has(c.id)} onChange={() => toggleFClass(c.id)} className="w-4 h-4 accent-[#FF6C37]" />
                      <span className="text-sm text-[#37352F]">{c.name}</span>
                      {other && fClassIds.has(c.id) && (
                        <span className="text-xs text-[#FF6C37] ml-auto">현재 담임 {other} → 교체</span>
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
