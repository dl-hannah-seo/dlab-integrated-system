'use client';

import { useState, useMemo } from 'react';
import { students, classes, Student } from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

const GRADES = ['전체', '초3', '초4', '초5', '초6', '중1', '중2', '중3'];
const STATUSES = ['전체', '재원', '퇴원', '휴원'];

export default function StudentsPage() {
  const [filterClass, setFilterClass] = useState('전체');
  const [filterGrade, setFilterGrade] = useState('전체');
  const [filterStatus, setFilterStatus] = useState('재원');
  const [filterName, setFilterName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRegister, setShowRegister] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  const classOptions = [
    { value: '전체', label: '전체 반' },
    ...classes.map(c => ({ value: c.id, label: c.name.split('/')[0] + '/' + c.course })),
  ];

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (filterClass !== '전체' && s.class_id !== filterClass) return false;
      if (filterGrade !== '전체' && s.grade !== filterGrade) return false;
      if (filterStatus !== '전체' && s.status !== filterStatus) return false;
      if (filterName && !s.name.includes(filterName)) return false;
      return true;
    });
  }, [filterClass, filterGrade, filterStatus, filterName]);

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

  const columns = [
    {
      key: '_check',
      header: '',
      render: (row: Student) => (
        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)}
          className="w-4 h-4 accent-[#FF6C37]" onClick={e => e.stopPropagation()} />
      ),
      className: 'w-10',
    },
    { key: 'name', header: '성명', render: (r: Student) => <span className="font-medium">{r.name}</span> },
    { key: 'grade', header: '학년' },
    { key: 'school', header: '학교' },
    { key: 'parent_phone', header: '부모님 연락처', render: (r: Student) => <span className="tabular-nums">{r.parent_phone}</span> },
    {
      key: 'class_id', header: '반',
      render: (r: Student) => {
        const cls = classes.find(c => c.id === r.class_id);
        return <span className="text-xs">{cls?.schedule ?? '-'}</span>;
      },
    },
    { key: 'first_enrolled_at', header: '등록일', render: (r: Student) => <span className="tabular-nums text-xs">{r.first_enrolled_at}</span> },
    {
      key: 'status', header: '등록구분',
      render: (r: Student) => (
        <Badge variant={r.status === '재원' ? 'active' : 'withdrawn'}>{r.status}</Badge>
      ),
    },
    { key: 'source', header: '유입경로', render: (r: Student) => <span className="text-xs text-[#787774]">{r.source}</span> },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">원생 관리</h1>
          <p className="text-sm text-[#787774] mt-1">조건별 조회 · 총 {filtered.length}명</p>
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
        <div className="grid grid-cols-5 gap-3">
          <Input placeholder="이름 검색" value={filterName} onChange={e => setFilterName(e.target.value)} />
          <Select
            options={classOptions}
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
          />
          <Select
            options={GRADES.map(g => ({ value: g, label: g }))}
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
          />
          <Select
            options={STATUSES.map(s => ({ value: s, label: s }))}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          />
          <Button variant="secondary" onClick={() => { setFilterName(''); setFilterClass('전체'); setFilterGrade('전체'); setFilterStatus('재원'); }}>
            초기화
          </Button>
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
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 accent-[#FF6C37]"
            />
            <span className="text-xs font-semibold text-[#787774]">전체 선택</span>
            <span className="ml-auto text-xs text-[#787774]">총 {filtered.length}명</span>
          </div>
          <Table
            columns={columns as Parameters<typeof Table>[0]['columns']}
            data={filtered as unknown as Record<string, unknown>[]}
            onRowClick={(row) => setDetailStudent(row as unknown as Student)}
          />
        </div>
      </Card>

      {/* 원생 상세 모달 */}
      {detailStudent && (
        <Modal open={!!detailStudent} onClose={() => setDetailStudent(null)} title={`원생 상세 — ${detailStudent.name}`} size="lg">
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-[#E9E9E7] pb-3">
              {['기본정보', '가족/보호자', '수강이력', '수납이력'].map(tab => (
                <button key={tab} className="px-3 py-1.5 text-sm rounded-md text-[#37352F] hover:bg-[#F7F7F5] font-medium first:bg-[#FFF1EC] first:text-[#FF6C37]">
                  {tab}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: '이름', value: detailStudent.name },
                { label: '학년', value: detailStudent.grade },
                { label: '학교', value: detailStudent.school },
                { label: '등록구분', value: detailStudent.status },
                { label: '부모님 연락처', value: detailStudent.parent_phone },
                { label: '학생 연락처', value: detailStudent.student_phone || '미등록' },
                { label: '최초 입학일', value: detailStudent.first_enrolled_at },
                { label: '유입경로', value: detailStudent.source },
                { label: '포인트', value: `${detailStudent.points.toLocaleString()}DP` },
                { label: '칭호', value: detailStudent.title || '없음' },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xs text-[#787774]">{item.label}</div>
                  <div className="text-sm font-medium text-[#37352F] mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#F7F7F5] rounded-lg p-3">
              <p className="text-xs font-semibold text-[#787774] mb-2">현재 수강 반</p>
              <p className="text-sm text-[#37352F]">{classes.find(c => c.id === detailStudent.class_id)?.name ?? '-'}</p>
            </div>
          </div>
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
            <Select label="학년" options={GRADES.slice(1).map(g => ({ value: g, label: g }))} />
          </div>
          <Input label="학교" placeholder="강남초" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="부모님 연락처" placeholder="010-0000-0000" />
            <Input label="학생 연락처 (선택)" placeholder="010-0000-0000" />
          </div>
          <Select label="유입경로" options={['지인소개','인스타그램','블로그','학교안내','현수막','네이버카페'].map(s=>({value:s,label:s}))} />
          <Select label="입반할 반" options={classes.map(c=>({value:c.id, label:c.name}))} />
          <div className="bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-lg px-5 py-3">
            <p className="text-sm font-semibold text-[#0F7B6C]">청구 자동 생성 안내</p>
            <p className="text-xs text-[#787774] mt-1">선택한 반의 수강료·납입기준일 설정에 따라 2026-06월 청구 자료가 자동 생성됩니다.</p>
          </div>
        </div>
      </Modal>

      {/* 문자 발송 모달 */}
      <Modal open={showMsgModal} onClose={() => setShowMsgModal(false)} title={`문자 발송 — ${selected.size}명`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowMsgModal(false)}>취소</Button>
            <Button onClick={() => { setShowMsgModal(false); alert('발송 미리보기: [D.LAB 강남] 안내 문자가 발송되었습니다.'); }}>발송</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select label="템플릿" options={[
            { value: 'notice', label: '단체 안내' },
            { value: 'payment', label: '결제 URL 안내' },
            { value: 'absent', label: '결석 확인' },
          ]} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#37352F]">메시지 내용</label>
            <textarea rows={4} className="w-full border border-[#E9E9E7] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#FF6C37]"
              defaultValue={`[D.LAB 강남] {원생명} 학부모님, 안녕하세요.\n본원 관련 안내 말씀 드립니다.`} />
            <p className="text-xs text-[#787774]">{'{'}'원생명{'}'} 변수는 자동 치환됩니다.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
