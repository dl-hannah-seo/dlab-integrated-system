'use client';

import { Fragment, useRef, useState } from 'react';
import {
  classes as mockClasses, classGroups, students, enrollments as mockEnrollments,
  invoices, dashboardData, TODAY, Class, Enrollment, InvoiceStatus,
} from '@/lib/mock-data';
import {
  buildBoard, boardCellKey, isClassFull, moveStudent, activeCount, UNASSIGNED, RosterEntry,
} from '@/lib/placement-board';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const DAY_NAME: Record<string, string> = { '토': '토요일', '화목': '화·목요일', '월수금': '월·수·금요일' };

// 학생 수가 이 값을 넘으면 카드 안 명단을 2열로
const TWO_COL_THRESHOLD = 6;

// 그리드 폭
const LABEL_W = 88;   // 좌측 요일·시간 라벨 열
const ROOM_W = 172;   // 강의실 열 최소 폭

// ── 결제 상태 음영 ─────────────────────────────────────────────
function paymentChip(status: InvoiceStatus | null): { bg: string; border: string; text: string; dim: boolean } {
  switch (status) {
    case '완납':  return { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', dim: false }; // 파랑
    case '미납':  return { bg: '#FECACA', border: '#F87171', text: '#991B1B', dim: false }; // 빨강
    case '부분납': return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', dim: false }; // 주황
    case '환불':  return { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280', dim: true };
    default:      return { bg: '#F7F7F5', border: '#E9E9E7', text: '#787774', dim: true }; // 미청구
  }
}

const LEGEND: { status: InvoiceStatus | null; label: string }[] = [
  { status: '완납', label: '완납' },
  { status: '미납', label: '미납' },
  { status: '부분납', label: '부분납' },
  { status: null, label: '미청구' },
];

type PendingMove = { studentId: string; studentName: string; from: Class; to: Class };

export function PlacementBoard() {
  const billingMonth = dashboardData.billing_month;
  const [localEnrollments, setLocalEnrollments] = useState<Enrollment[]>(mockEnrollments);

  const [dragging, setDragging] = useState<{ studentId: string; fromClassId: string } | null>(null);
  const [dragOverClassId, setDragOverClassId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const board = buildBoard(
    mockClasses, classGroups, localEnrollments, students, invoices, billingMonth, TODAY,
  );

  const gridCols = `${LABEL_W}px repeat(${board.rooms.length}, minmax(${ROOM_W}px, 1fr))`;
  const innerMinW = LABEL_W + board.rooms.length * ROOM_W;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function scrollByCols(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * ROOM_W * 2, behavior: 'smooth' });
  }

  function handleDrop(toCls: Class) {
    setDragOverClassId(null);
    const d = dragging;
    setDragging(null);
    if (!d || d.fromClassId === toCls.id) return;

    const alreadyIn = localEnrollments.some(
      e => e.student_id === d.studentId && e.class_id === toCls.id && e.ended_at === null,
    );
    if (alreadyIn) { showToast('이미 해당 반에 수강 중입니다.'); return; }

    if (isClassFull(toCls, localEnrollments)) {
      showToast(`${toCls.course} 반은 정원(${toCls.capacity}명)이 가득 찼습니다.`);
      return;
    }

    const fromCls = mockClasses.find(c => c.id === d.fromClassId)!;
    const student = students.find(s => s.id === d.studentId)!;
    setPending({ studentId: d.studentId, studentName: student.name, from: fromCls, to: toCls });
  }

  function confirmMove() {
    if (!pending) return;
    setLocalEnrollments(prev => moveStudent(prev, pending.studentId, pending.from.id, pending.to.id, TODAY));
    setPending(null);
  }

  return (
    <div>
      {/* 컨트롤 바 — 좌우 이동 + 범례 */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#787774]">강의실</span>
          <div className="inline-flex rounded-lg border border-[#E9E9E7] bg-white p-0.5">
            <button
              onClick={() => scrollByCols(-1)}
              className="px-2.5 py-1 text-base leading-none text-[#787774] hover:text-[#37352F] hover:bg-[#F7F7F5] rounded-md transition-colors"
              aria-label="강의실 왼쪽으로"
            >‹</button>
            <button
              onClick={() => scrollByCols(1)}
              className="px-2.5 py-1 text-base leading-none text-[#787774] hover:text-[#37352F] hover:bg-[#F7F7F5] rounded-md transition-colors"
              aria-label="강의실 오른쪽으로"
            >›</button>
          </div>
          <span className="text-[11px] text-[#9B9A97]">← → 키 또는 가로 스크롤로 이동</span>
        </div>

        {/* 결제 구분 범례 */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#787774]">결제</span>
          {LEGEND.map(item => {
            const c = paymentChip(item.status);
            return (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: c.bg, border: `1px solid ${c.border}` }} />
                <span className="text-xs text-[#37352F]">{item.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* 보드 */}
      {board.rows.length === 0 ? (
        <div className="bg-white border border-[#E9E9E7] rounded-lg px-5 py-12 text-center text-sm text-[#787774]">
          편성된 반이 없습니다.
        </div>
      ) : (
        <div
          ref={scrollRef}
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCols(1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCols(-1); }
          }}
          className="overflow-x-auto border border-[#E9E9E7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6C37]/30"
        >
          <div style={{ minWidth: innerMinW }}>
            {/* 강의실 헤더 */}
            <div className="grid border-b border-[#E9E9E7]" style={{ gridTemplateColumns: gridCols }}>
              <div className="sticky left-0 z-20 bg-[#F1F1EF] px-3 py-2.5 border-r border-[#E9E9E7]">
                <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-wide">요일 · 시간</span>
              </div>
              {board.rooms.map(room => (
                <div key={room} className="px-3 py-2.5 text-center border-l border-[#E9E9E7] bg-[#F7F7F5]">
                  <span className={`text-sm font-semibold ${room === UNASSIGNED ? 'text-[#9B9A97]' : 'text-[#37352F]'}`}>
                    {room}
                  </span>
                </div>
              ))}
            </div>

            {/* 행: 요일 밴드 + 요일·시간 행 */}
            {board.rows.map((row, i) => {
              const newDay = i === 0 || board.rows[i - 1].dayGroup !== row.dayGroup;
              return (
                <Fragment key={row.key}>
                  {newDay && (
                    <div className="bg-[#FFF8F5] border-b border-[#F0E0D8]">
                      <span className="sticky left-0 inline-block px-3 py-1 text-xs font-bold text-[#FF6C37]">
                        {DAY_NAME[row.dayGroup] ?? row.dayGroup}
                      </span>
                    </div>
                  )}
                  <div
                    className="grid border-b border-[#E9E9E7]"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    {/* 좌측 요일·시간 라벨 (고정) */}
                    <div className="sticky left-0 z-10 bg-[#F7F7F5] border-r border-[#E9E9E7] px-3 py-2 flex items-start">
                      <span className="text-xs font-semibold text-[#37352F] whitespace-nowrap">{row.label}</span>
                    </div>

                    {board.rooms.map(room => {
                      const cells = board.cells[boardCellKey(room, row.key)] ?? [];
                      return (
                        <div key={room} className="border-l border-[#E9E9E7] p-1.5 space-y-1.5">
                          {cells.map(cell => (
                            <ClassCard
                              key={cell.cls.id}
                              cls={cell.cls}
                              roster={cell.roster}
                              count={activeCount(cell.cls.id, localEnrollments)}
                              isDragOver={dragOverClassId === cell.cls.id}
                              onChipDragStart={studentId => setDragging({ studentId, fromClassId: cell.cls.id })}
                              onChipDragEnd={() => { setDragging(null); setDragOverClassId(null); }}
                              onDragEnterCard={() => { if (dragging && dragging.fromClassId !== cell.cls.id) setDragOverClassId(cell.cls.id); }}
                              onDragLeaveCard={() => setDragOverClassId(prev => (prev === cell.cls.id ? null : prev))}
                              onDropCard={() => handleDrop(cell.cls)}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#37352F] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* 반 이동 확인 모달 */}
      {pending && (
        <Modal
          open={!!pending}
          onClose={() => setPending(null)}
          title="반 이동 확인"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPending(null)}>취소</Button>
              <Button onClick={confirmMove}>이동</Button>
            </>
          }
        >
          <p className="text-sm text-[#37352F]">
            <span className="font-semibold">{pending.studentName}</span> 학생을{' '}
            <span className="font-semibold">{pending.from.schedule} · {pending.from.course}</span>에서{' '}
            <span className="font-semibold">{pending.to.schedule} · {pending.to.course}</span>(으)로 이동하시겠습니까?
          </p>
          <p className="text-xs text-[#787774] mt-2">원래 반은 퇴반 처리되고 새 반에 입반됩니다.</p>
        </Modal>
      )}
    </div>
  );
}

// ── 반 카드 ─────────────────────────────────────────────────────
function ClassCard({
  cls, roster, count, isDragOver,
  onChipDragStart, onChipDragEnd, onDragEnterCard, onDragLeaveCard, onDropCard,
}: {
  cls: Class;
  roster: RosterEntry[];
  count: number;
  isDragOver: boolean;
  onChipDragStart: (studentId: string) => void;
  onChipDragEnd: () => void;
  onDragEnterCard: () => void;
  onDragLeaveCard: () => void;
  onDropCard: () => void;
}) {
  const full = count >= cls.capacity;
  const twoCol = roster.length > TWO_COL_THRESHOLD;
  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDragEnter={onDragEnterCard}
      onDragLeave={onDragLeaveCard}
      onDrop={onDropCard}
      className={`rounded-lg border transition-colors ${
        isDragOver ? 'border-[#FF6C37] bg-[#FFF8F5]' : 'border-[#E9E9E7] bg-white'
      }`}
    >
      {/* 카드 헤더 */}
      <div className="px-2 py-1.5 border-b border-[#E9E9E7]">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-[#37352F] truncate">{cls.course}</span>
          <span className={`text-[10px] tabular-nums flex-shrink-0 ${full ? 'text-[#DC2626] font-medium' : 'text-[#787774]'}`}>
            {count}/{cls.capacity}
          </span>
        </div>
        <span className="text-[10px] text-[#9B9A97]">{cls.teacher} 선생님</span>
      </div>

      {/* 학생 칩 목록 */}
      <div className={`p-1.5 min-h-[36px] ${twoCol ? 'grid grid-cols-2 gap-1' : 'space-y-1'}`}>
        {roster.length === 0 ? (
          <p className="text-[10px] text-[#BFBFBD] text-center py-1.5">학생 없음</p>
        ) : (
          roster.map(({ student, paymentStatus }) => {
            const c = paymentChip(paymentStatus);
            return (
              <div
                key={student.id}
                draggable
                onDragStart={() => onChipDragStart(student.id)}
                onDragEnd={onChipDragEnd}
                title={`${student.name} · ${student.grade} · ${paymentStatus ?? '미청구'}`}
                className="flex items-center gap-1 px-1.5 py-1 rounded-md cursor-grab active:cursor-grabbing"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}
              >
                <span className="text-xs font-medium truncate" style={{ color: c.text }}>{student.name}</span>
                <span className="text-[10px] flex-shrink-0 ml-auto" style={{ color: c.text, opacity: 0.7 }}>
                  {student.grade}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
