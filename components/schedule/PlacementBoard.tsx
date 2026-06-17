'use client';

import { useState } from 'react';
import {
  classes as mockClasses, classGroups, students, enrollments as mockEnrollments,
  invoices, dashboardData, TODAY, Class, Enrollment, InvoiceStatus,
} from '@/lib/mock-data';
import {
  buildBoard, isClassFull, moveStudent, activeCount, UNASSIGNED, RosterEntry,
} from '@/lib/placement-board';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

// ── 요일 그룹 ──────────────────────────────────────────────────
const DAY_GROUP_ORDER = ['토', '화목', '월수금'] as const;
const DAY_GROUP_LABEL: Record<string, string> = {
  '토': '토요일',
  '화목': '화·목요일',
  '월수금': '월·수·금요일',
};

// ── 결제 상태 시각 ─────────────────────────────────────────────
type HighlightMode = null | '완납' | '미납';

function paymentDot(status: InvoiceStatus | null): { color: string; label: string } {
  switch (status) {
    case '완납':  return { color: '#0F7B6C', label: '완납' };
    case '미납':  return { color: '#DC2626', label: '미납' };
    case '부분납': return { color: '#B45309', label: '부분납' };
    case '환불':  return { color: '#9B9A97', label: '환불' };
    default:      return { color: '#D3D3D1', label: '미청구' };
  }
}

function matchesHighlight(status: InvoiceStatus | null, mode: HighlightMode): boolean {
  if (mode === null) return true;
  if (mode === '완납') return status === '완납';
  if (mode === '미납') return status === '미납' || status === '부분납';
  return true;
}

type PendingMove = { studentId: string; studentName: string; from: Class; to: Class };

export function PlacementBoard() {
  const billingMonth = dashboardData.billing_month;

  // 활성 반이 있는 요일 그룹만 선택지로
  const availableDayGroups = DAY_GROUP_ORDER.filter(dg =>
    mockClasses.some(c => {
      const g = classGroups.find(x => x.id === c.class_group_id);
      return g?.day_group === dg && c.end_date >= TODAY;
    }),
  );

  const [dayGroup, setDayGroup] = useState<string>(availableDayGroups[0] ?? '토');
  const [localEnrollments, setLocalEnrollments] = useState<Enrollment[]>(mockEnrollments);
  const [highlight, setHighlight] = useState<HighlightMode>(null);

  // 드래그 상태
  const [dragging, setDragging] = useState<{ studentId: string; fromClassId: string } | null>(null);
  const [dragOverClassId, setDragOverClassId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const board = buildBoard(
    dayGroup, mockClasses, classGroups, localEnrollments, students, invoices, billingMonth, TODAY,
  );

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function handleDrop(toCls: Class) {
    setDragOverClassId(null);
    const d = dragging;
    setDragging(null);
    if (!d || d.fromClassId === toCls.id) return;

    // 이미 그 반에 있으면 무시
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

  const gridCols = `60px repeat(${board.rooms.length}, minmax(170px, 1fr))`;

  return (
    <div>
      {/* 컨트롤 바 */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        {/* 요일 선택 */}
        <div className="inline-flex rounded-lg border border-[#E9E9E7] bg-white p-0.5">
          {availableDayGroups.map(dg => (
            <button
              key={dg}
              onClick={() => setDayGroup(dg)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dayGroup === dg
                  ? 'bg-[#FFF1EC] text-[#FF6C37] font-medium'
                  : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              {DAY_GROUP_LABEL[dg] ?? dg}
            </button>
          ))}
        </div>

        {/* 결제 강조 토글 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#787774]">결제 강조</span>
          <div className="inline-flex rounded-lg border border-[#E9E9E7] bg-white p-0.5">
            <button
              onClick={() => setHighlight(h => (h === '완납' ? null : '완납'))}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                highlight === '완납' ? 'bg-[#F0FDF4] text-[#0F7B6C] font-medium' : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#0F7B6C' }} />
              완납만
            </button>
            <button
              onClick={() => setHighlight(h => (h === '미납' ? null : '미납'))}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                highlight === '미납' ? 'bg-[#FEF2F2] text-[#DC2626] font-medium' : 'text-[#787774] hover:text-[#37352F]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#DC2626' }} />
              미납만
            </button>
          </div>
        </div>
      </div>

      <p className="mb-3 text-xs text-[#9B9A97]">
        학생 이름을 다른 반으로 끌어다 놓으면 반을 이동할 수 있어요. · 청구월 {billingMonth}
      </p>

      {/* 보드 */}
      {board.rooms.length === 0 ? (
        <div className="bg-white border border-[#E9E9E7] rounded-lg px-5 py-12 text-center text-sm text-[#787774]">
          이 요일에 편성된 반이 없습니다.
        </div>
      ) : (
        <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-x-auto">
          {/* 강의실 헤더 */}
          <div className="grid border-b border-[#E9E9E7]" style={{ gridTemplateColumns: gridCols }}>
            <div className="bg-[#F7F7F5] px-3 py-3" />
            {board.rooms.map(room => (
              <div
                key={room}
                className="px-3 py-3 text-center border-l border-[#E9E9E7] bg-[#F7F7F5]"
              >
                <span className={`text-sm font-semibold ${room === UNASSIGNED ? 'text-[#9B9A97]' : 'text-[#37352F]'}`}>
                  {room}
                </span>
              </div>
            ))}
          </div>

          {/* 시간대 행 */}
          {board.times.map((time, idx) => (
            <div
              key={time}
              className="grid"
              style={{
                gridTemplateColumns: gridCols,
                borderBottomWidth: idx < board.times.length - 1 ? 1 : 0,
                borderBottomStyle: 'solid',
                borderColor: '#E9E9E7',
              }}
            >
              <div className="px-3 py-3 bg-[#F7F7F5] border-r border-[#E9E9E7] flex items-start">
                <span className="text-xs font-semibold text-[#787774]">{time}</span>
              </div>

              {board.rooms.map(room => {
                const cells = board.cells[`${room}|${time}`] ?? [];
                return (
                  <div key={room} className="border-l border-[#E9E9E7] p-2 space-y-2 align-top">
                    {cells.map(cell => (
                      <ClassCard
                        key={cell.cls.id}
                        cls={cell.cls}
                        teacher={cell.cls.teacher}
                        roster={cell.roster}
                        count={activeCount(cell.cls.id, localEnrollments)}
                        highlight={highlight}
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
          ))}
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
          <p className="text-xs text-[#787774] mt-2">
            원래 반은 퇴반 처리되고 새 반에 입반됩니다.
          </p>
        </Modal>
      )}
    </div>
  );
}

// ── 반 카드 ─────────────────────────────────────────────────────
function ClassCard({
  cls, teacher, roster, count, highlight, isDragOver,
  onChipDragStart, onChipDragEnd, onDragEnterCard, onDragLeaveCard, onDropCard,
}: {
  cls: Class;
  teacher: string;
  roster: RosterEntry[];
  count: number;
  highlight: HighlightMode;
  isDragOver: boolean;
  onChipDragStart: (studentId: string) => void;
  onChipDragEnd: () => void;
  onDragEnterCard: () => void;
  onDragLeaveCard: () => void;
  onDropCard: () => void;
}) {
  const full = count >= cls.capacity;
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
      <div className="px-2.5 py-2 border-b border-[#E9E9E7]">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-[#37352F] truncate">{cls.course}</span>
          <span className={`text-[10px] tabular-nums flex-shrink-0 ${full ? 'text-[#DC2626] font-medium' : 'text-[#787774]'}`}>
            {count}/{cls.capacity}
          </span>
        </div>
        <span className="text-[10px] text-[#9B9A97]">{teacher} 선생님</span>
      </div>

      {/* 학생 칩 목록 */}
      <div className="p-1.5 space-y-1 min-h-[40px]">
        {roster.length === 0 ? (
          <p className="text-[10px] text-[#BFBFBD] text-center py-1.5">학생 없음</p>
        ) : (
          roster.map(({ student, paymentStatus }) => {
            const dot = paymentDot(paymentStatus);
            const dim = !matchesHighlight(paymentStatus, highlight);
            return (
              <div
                key={student.id}
                draggable
                onDragStart={() => onChipDragStart(student.id)}
                onDragEnd={onChipDragEnd}
                title={`${student.name} · ${student.grade} · ${dot.label}`}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F7F7F5] hover:bg-[#EFEFEE] cursor-grab active:cursor-grabbing transition-opacity ${
                  dim ? 'opacity-30' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot.color }} />
                <span className="text-xs text-[#37352F] truncate">{student.name}</span>
                <span className="text-[10px] text-[#9B9A97] flex-shrink-0 ml-auto">{student.grade}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
