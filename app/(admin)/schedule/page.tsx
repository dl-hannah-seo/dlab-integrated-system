'use client';

import { useState } from 'react';
import Link from 'next/link';
import { classes, classGroups, semesters, Class, ClassGroup } from '@/lib/mock-data';

// ── 헬퍼 ────────────────────────────────────────────────────────
const DAY_ORDER = ['월', '화', '수', '목', '금', '토'] as const;

function parseDays(dayGroup: string): string[] {
  const map: Record<string, string[]> = {
    '토': ['토'],
    '화목': ['화', '목'],
    '월수금': ['월', '수', '금'],
  };
  return map[dayGroup] ?? [...dayGroup];
}

function fmtSlot(slot: string): string {
  return `${slot.slice(0, 2)}:${slot.slice(2)}`;
}

function dayLabel(dayGroup: string): string {
  const map: Record<string, string> = {
    '토': '토요일',
    '화목': '화요일 · 목요일',
    '월수금': '월·수·금요일',
  };
  return map[dayGroup] ?? dayGroup;
}

function fmtCurrency(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function blockColor(dayGroup: string) {
  if (dayGroup === '토') return { block: '#FF6C37', colBg: '#FFF8F5', headerText: '#FF6C37' };
  return { block: '#3B82F6', colBg: '#F0F7FF', headerText: '#3B82F6' };
}

type Popover = { cls: Class; group: ClassGroup; top: number; left: number };

// ── 메인 ────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [selectedSemId, setSelectedSemId] = useState('sem-01');
  const [view, setView] = useState<'grid' | 'card'>('grid');
  const [popover, setPopover] = useState<Popover | null>(null);

  // 선택된 학기의 반 목록
  const semGroups = classGroups.filter(g => g.semester_id === selectedSemId);
  const semClasses = classes.filter(c =>
    semGroups.some(g => g.id === c.class_group_id),
  );

  const sem = semesters.find(s => s.id === selectedSemId);

  function handleBlockClick(
    e: React.MouseEvent<HTMLDivElement>,
    cls: Class,
    group: ClassGroup,
  ) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ cls, group, top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 240) });
  }

  return (
    <div onClick={() => setPopover(null)}>
      {/* 헤더 */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">시간표</h1>
          <p className="text-sm text-[#787774] mt-1">
            {sem ? `${sem.year}년 ${sem.season}학기` : ''} · 판교 캠퍼스
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 학기 선택 */}
          <select
            value={selectedSemId}
            onChange={e => setSelectedSemId(e.target.value)}
            className="text-sm border border-[#E9E9E7] rounded-lg px-3 py-1.5 text-[#37352F] bg-white focus:outline-none"
          >
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.year} {s.season}학기</option>
            ))}
          </select>
          {/* 뷰 토글 */}
          <div className="flex bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg p-0.5">
            {(['grid', 'card'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  view === v ? 'bg-white text-[#37352F] shadow-sm' : 'text-[#787774]'
                }`}
              >
                {v === 'grid' ? '그리드' : '카드'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 뷰 렌더링 */}
      {view === 'grid' && (
        <GridView
          semClasses={semClasses}
          semGroups={semGroups}
          onBlockClick={handleBlockClick}
        />
      )}
      {view === 'card' && (
        <CardView
          semClasses={semClasses}
          semGroups={semGroups}
          onBlockClick={handleBlockClick}
        />
      )}

      {/* 팝오버 */}
      {popover && (
        <ClassPopover popover={popover} onClose={() => setPopover(null)} />
      )}
    </div>
  );
}

// ── 주간 그리드 뷰 ──────────────────────────────────────────────
function GridView({
  semClasses,
  semGroups,
  onBlockClick,
}: {
  semClasses: Class[];
  semGroups: ClassGroup[];
  onBlockClick: (e: React.MouseEvent<HTMLDivElement>, cls: Class, group: ClassGroup) => void;
}) {
  // 시간대 목록 (정렬)
  const times = [...new Set(semGroups.map(g => fmtSlot(g.time_slot)))].sort();

  // 셀 맵: { day: { time: { cls, group } } }
  const cellMap: Record<string, Record<string, { cls: Class; group: ClassGroup }>> = {};
  for (const cls of semClasses) {
    const group = semGroups.find(g => g.id === cls.class_group_id);
    if (!group) continue;
    for (const day of parseDays(group.day_group)) {
      if (!cellMap[day]) cellMap[day] = {};
      cellMap[day][fmtSlot(group.time_slot)] = { cls, group };
    }
  }

  if (times.length === 0) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg px-5 py-12 text-center text-sm text-[#787774]">
        이 학기에 편성된 수업이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid border-b border-[#E9E9E7]" style={{ gridTemplateColumns: '52px repeat(6, 1fr)' }}>
        <div className="bg-[#F7F7F5] px-3 py-3" />
        {DAY_ORDER.map(day => {
          const isSat = day === '토';
          return (
            <div
              key={day}
              className="px-3 py-3 text-center text-sm font-semibold border-l border-[#E9E9E7]"
              style={{ background: isSat ? '#FFF8F5' : '#F7F7F5', color: isSat ? '#FF6C37' : '#787774' }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 시간대 행 */}
      {times.map((time, idx) => (
        <div
          key={time}
          className="grid border-[#E9E9E7]"
          style={{
            gridTemplateColumns: '52px repeat(6, 1fr)',
            borderBottomWidth: idx < times.length - 1 ? 1 : 0,
            borderBottomStyle: 'solid',
            minHeight: 68,
          }}
        >
          {/* 시간 레이블 */}
          <div className="px-3 py-3 bg-[#F7F7F5] border-r border-[#E9E9E7] flex items-center">
            <span className="text-xs font-semibold text-[#787774]">{time}</span>
          </div>

          {/* 요일 셀 */}
          {DAY_ORDER.map(day => {
            const cell = cellMap[day]?.[time];
            const isSat = day === '토';
            const color = cell ? blockColor(cell.group.day_group) : null;
            return (
              <div
                key={day}
                className="border-l border-[#E9E9E7] p-1.5"
                style={{ background: isSat && !cell ? '#FFFBF9' : undefined }}
              >
                {cell && color && (
                  <div
                    onClick={e => onBlockClick(e, cell.cls, cell.group)}
                    className="h-full rounded-md px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: color.block }}
                  >
                    <p className="text-xs font-semibold text-white leading-tight">{cell.cls.course}</p>
                    <p className="text-xs text-white/80 mt-0.5">{cell.cls.teacher}</p>
                    <p className="text-xs text-white/70">{cell.cls.enrolled_count}명</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── 요일별 카드 뷰 ──────────────────────────────────────────────
function CardView({
  semClasses,
  semGroups,
  onBlockClick,
}: {
  semClasses: Class[];
  semGroups: ClassGroup[];
  onBlockClick: (e: React.MouseEvent<HTMLDivElement>, cls: Class, group: ClassGroup) => void;
}) {
  // 고유 day_group 순서 유지 (ClassGroup 순서 기준)
  const uniqueGroups = semGroups.reduce<ClassGroup[]>((acc, g) => {
    if (!acc.some(a => a.day_group === g.day_group)) acc.push(g);
    return acc;
  }, []);

  if (uniqueGroups.length === 0) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg px-5 py-12 text-center text-sm text-[#787774]">
        이 학기에 편성된 수업이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {uniqueGroups.map(groupRep => {
        const color = blockColor(groupRep.day_group);
        // 이 day_group에 속하는 ClassGroup들 (시간순)
        const slots = semGroups
          .filter(g => g.day_group === groupRep.day_group)
          .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

        return (
          <div key={groupRep.day_group} className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
            {/* 카드 헤더 */}
            <div
              className="px-5 py-3 border-b border-[#E9E9E7]"
              style={{ background: color.colBg }}
            >
              <span className="text-sm font-semibold" style={{ color: color.block }}>
                {dayLabel(groupRep.day_group)}
              </span>
            </div>

            {/* 시간대 행 */}
            <div className="divide-y divide-[#E9E9E7]">
              {slots.map(slot => {
                const cls = semClasses.find(c => c.class_group_id === slot.id);
                if (!cls) return null;
                return (
                  <div
                    key={slot.id}
                    onClick={e => onBlockClick(e, cls, slot)}
                    className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[#F7F7F5] transition-colors"
                  >
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded text-white min-w-[52px] text-center"
                      style={{ background: color.block }}
                    >
                      {fmtSlot(slot.time_slot)}
                    </span>
                    <span className="text-sm font-medium text-[#37352F]">{cls.course}</span>
                    <span className="text-sm text-[#787774]">{cls.teacher} 선생님</span>
                    <span className="text-sm text-[#787774] ml-auto">{cls.enrolled_count}명</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 수업 블록 팝오버 ────────────────────────────────────────────
function ClassPopover({
  popover,
  onClose,
}: {
  popover: Popover;
  onClose: () => void;
}) {
  const { cls, group, top, left } = popover;
  const color = blockColor(group.day_group);

  return (
    <div
      onClick={e => e.stopPropagation()}
      className="fixed z-50 w-56 bg-white border border-[#E9E9E7] rounded-lg shadow-xl"
      style={{ top, left }}
    >
      {/* 팝오버 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E9E9E7]">
        <span className="text-sm font-semibold" style={{ color: color.block }}>
          {cls.course}
        </span>
        <button
          onClick={onClose}
          className="text-[#787774] hover:text-[#37352F] text-xs"
        >
          ✕
        </button>
      </div>

      {/* 팝오버 내용 */}
      <div className="px-4 py-3 space-y-1.5 text-sm text-[#37352F]">
        <p>📅 {dayLabel(group.day_group)} {fmtSlot(group.time_slot)}</p>
        <p>👨‍🏫 {cls.teacher} 선생님</p>
        <p>
          👥 {cls.enrolled_count}명{' '}
          <span className="text-[#787774]">/ 정원 {cls.capacity}명</span>
        </p>
        <p>📆 {cls.start_date} ~ {cls.end_date}</p>
        <p>
          💰 {cls.payment_method === '매월' ? '월 ' : '일시 '}
          {fmtCurrency(cls.tuition_fee)}
        </p>
      </div>

      {/* 하단 링크 */}
      <div className="px-4 py-3 border-t border-[#E9E9E7]">
        <Link
          href={`/classes?selected=${cls.id}`}
          className="text-xs text-[#3B82F6] hover:underline"
        >
          반 상세 페이지로 이동 →
        </Link>
      </div>
    </div>
  );
}
