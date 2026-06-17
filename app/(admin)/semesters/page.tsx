'use client';

import { useState } from 'react';
import { semesters as mockSemesters, classes, classGroups, Semester } from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import Link from 'next/link';

const TODAY = '2026-06-14';
type ManualStatus = '예정' | '진행 중' | '종료';

function getSemesterStatus(sem: Semester): '진행 중' | '예정' | '종료' {
  if (sem.status) return sem.status;

  const semGroups = classGroups.filter(g => g.semester_id === sem.id);
  const semClasses = classes.filter(c => semGroups.some(g => g.id === c.class_group_id));

  if (semClasses.length === 0) return sem.year < 2026 ? '종료' : '예정';

  const starts = semClasses.map(c => c.start_date).sort()[0];
  const ends   = semClasses.map(c => c.end_date).sort().reverse()[0];

  if (TODAY < starts) return '예정';
  if (TODAY > ends)   return '종료';
  return '진행 중';
}

function statusVariant(s: string) {
  if (s === '진행 중') return 'success' as const;
  if (s === '예정')    return 'warn' as const;
  return 'default' as const;
}

export default function SemestersPage() {
  const [localSemesters, setLocalSemesters] = useState<Semester[]>(mockSemesters);
  const [showModal, setShowModal]           = useState(false);

  // 새 학기 폼
  const [formYear, setFormYear]               = useState(() => new Date().getFullYear());
  const [formSeason, setFormSeason]           = useState('봄학기');
  const [formCourses, setFormCourses]         = useState<string[]>([]);
  const [formCourseInput, setFormCourseInput] = useState('');

  // 편집 모달
  const [editSem, setEditSem]                   = useState<Semester | null>(null);
  const [editYear, setEditYear]                 = useState(2026);
  const [editSeason, setEditSeason]             = useState('봄');
  const [editCourses, setEditCourses]           = useState<string[]>([]);
  const [editCourseInput, setEditCourseInput]   = useState('');
  const [editStatus, setEditStatus]             = useState<ManualStatus | ''>('');

  function handleAddCourse() {
    const t = formCourseInput.trim();
    if (t && !formCourses.includes(t)) { setFormCourses(p => [...p, t]); setFormCourseInput(''); }
  }

  function handleCreate() {
    setLocalSemesters(p => [...p, {
      id: `sem-${Date.now()}`,
      campus_id: 'campus-001',
      year: formYear,
      season: formSeason,
      courses: formCourses,
    }]);
    setFormCourses([]); setFormCourseInput('');
    setShowModal(false);
  }

  function openEdit(sem: Semester) {
    setEditSem(sem);
    setEditYear(sem.year);
    setEditSeason(sem.season);
    setEditCourses([...sem.courses]);
    setEditCourseInput('');
    setEditStatus(sem.status ?? '');
  }

  function handleEditAddCourse() {
    const t = editCourseInput.trim();
    if (t && !editCourses.includes(t)) { setEditCourses(p => [...p, t]); setEditCourseInput(''); }
  }

  function handleEditSave() {
    if (!editSem) return;
    setLocalSemesters(p => p.map(s => s.id === editSem.id ? {
      ...s,
      year: editYear,
      season: editSeason,
      courses: editCourses,
      status: editStatus || undefined,
    } : s));
    setEditSem(null);
  }

  const active   = localSemesters.filter(s => getSemesterStatus(s) === '진행 중').length;
  const upcoming = localSemesters.filter(s => getSemesterStatus(s) === '예정').length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">학기 편성 관리</h1>
          <p className="text-sm text-[#787774] mt-1">판교 캠퍼스 · 개설 학기 및 과정 설정</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          새 학기 편성
        </Button>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '전체 학기', value: localSemesters.length, color: 'text-[#37352F]' },
          { label: '진행 중', value: active, color: 'text-[#0F7B6C]' },
          { label: '예정', value: upcoming, color: 'text-[#FF6C37]' },
        ].map(item => (
          <Card key={item.label} className="!p-0">
            <div className="px-5 py-4 text-center">
              <p className="text-xs text-[#787774] mb-1">{item.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* 학기 목록 */}
      <div className="space-y-3">
        {[...localSemesters].reverse().map(sem => {
          const status = getSemesterStatus(sem);
          const semGroups  = classGroups.filter(g => g.semester_id === sem.id);
          const semClasses = classes.filter(c => semGroups.some(g => g.id === c.class_group_id));

          return (
            <div key={sem.id}
              className={`bg-white border rounded-xl p-5 transition-colors ${status === '종료' ? 'opacity-60' : 'border-[#E9E9E7]'}`}
              style={status === '진행 중' ? { borderColor: '#0F7B6C', boxShadow: '0 0 0 1px #0F7B6C22' } : {}}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2.5">
                    <h2 className="text-base font-bold text-[#37352F]">{sem.year}년 {sem.season}</h2>
                    <Badge variant={statusVariant(status)}>{status}</Badge>
                    {sem.status && (
                      <span className="text-xs text-[#787774] bg-[#F7F7F5] px-1.5 py-0.5 rounded">수동 설정</span>
                    )}
                    <span className="text-xs text-[#787774]">반 {semClasses.length}개</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {sem.courses.map(c => (
                      <span key={c} className="px-2.5 py-0.5 bg-[#FFF1EC] text-[#FF6C37] rounded-full text-xs font-medium">{c}</span>
                    ))}
                  </div>
                  {semClasses.length > 0 && (
                    <p className="text-xs text-[#787774]">
                      수강 기간: {semClasses.map(c => c.start_date).sort()[0]} ~ {semClasses.map(c => c.end_date).sort().reverse()[0]}
                    </p>
                  )}
                  {semClasses.length === 0 && (
                    <p className="text-xs text-[#787774]">아직 생성된 반이 없습니다. 반 관리에서 반을 추가하세요.</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEdit(sem)}
                    className="text-xs text-[#787774] hover:text-[#37352F] px-2 py-1 rounded hover:bg-[#F7F7F5] transition-colors"
                  >
                    편집
                  </button>
                  <Link href="/classes">
                    <Button variant="secondary" size="sm">반 관리 →</Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 새 학기 편성 모달 */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="새 학기 편성"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>취소</Button>
            <Button onClick={handleCreate} disabled={formCourses.length === 0}>학기 편성 완료</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="연도"
              type="number"
              min={2020}
              value={String(formYear)}
              onChange={e => setFormYear(Number(e.target.value))}
            />
            <Input
              label="구분명"
              type="text"
              placeholder="예: 여름학기, 봄학기"
              value={formSeason}
              onChange={e => setFormSeason(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#37352F] mb-1.5">개설 과정</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="과정명 입력 후 Enter (예: 파이썬 기초)"
                value={formCourseInput}
                onChange={e => setFormCourseInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAddCourse()}
                className="flex-1"
              />
              <Button size="sm" variant="secondary" onClick={handleAddCourse}>추가</Button>
            </div>
            {formCourses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formCourses.map(c => (
                  <span key={c} className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF1EC] text-[#FF6C37] rounded-full text-sm font-medium">
                    {c}
                    <button onClick={() => setFormCourses(p => p.filter(x => x !== c))}
                      className="text-[#FF6C37]/50 hover:text-[#FF6C37] leading-none text-base">×</button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#787774]">과정을 1개 이상 추가하세요.</p>
            )}
          </div>

          {formCourses.length > 0 && (
            <div className="bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg px-4 py-3 text-sm">
              <span className="font-semibold text-[#37352F]">{formYear}년 {formSeason}학기</span>
              <span className="text-[#787774]">에 </span>
              <span className="text-[#FF6C37] font-medium">{formCourses.join(' · ')}</span>
              <span className="text-[#787774]"> 과정이 편성됩니다.</span>
            </div>
          )}
        </div>
      </Modal>

      {/* 학기 편집 모달 */}
      <Modal
        open={editSem !== null}
        onClose={() => setEditSem(null)}
        title="학기 편집"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditSem(null)}>취소</Button>
            <Button onClick={handleEditSave} disabled={editCourses.length === 0}>저장</Button>
          </>
        }
      >
        {editSem && (
          <div className="space-y-4">
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
                placeholder="예: 여름학기, 봄학기"
                value={editSeason}
                onChange={e => setEditSeason(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#37352F] mb-1.5">개설 과정</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="과정명 입력 후 Enter"
                  value={editCourseInput}
                  onChange={e => setEditCourseInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleEditAddCourse()}
                  className="flex-1"
                />
                <Button size="sm" variant="secondary" onClick={handleEditAddCourse}>추가</Button>
              </div>
              {editCourses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {editCourses.map(c => (
                    <span key={c} className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF1EC] text-[#FF6C37] rounded-full text-sm font-medium">
                      {c}
                      <button onClick={() => setEditCourses(p => p.filter(x => x !== c))}
                        className="text-[#FF6C37]/50 hover:text-[#FF6C37] leading-none text-base">×</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#787774]">과정을 1개 이상 추가하세요.</p>
              )}
            </div>

            <div>
              <Select
                label="학기 상태"
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as ManualStatus | '')}
                options={[
                  { value: '', label: '자동 (반 수강 기간 기반)' },
                  { value: '예정', label: '예정' },
                  { value: '진행 중', label: '진행 중' },
                  { value: '종료', label: '종료' },
                ]}
              />
              <p className="text-xs text-[#787774] mt-1">
                수동 설정 시 반의 수강 기간과 무관하게 지정한 상태로 표시됩니다.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
