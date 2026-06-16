'use client';

import { useState } from 'react';
import Link from 'next/link';
import { classes, classGroups, semesters, sessions, Class, ClassGroup, Session } from '@/lib/mock-data';
import { parseDays, koWeekday, addDays, weekDates, resolveWeekSessions, defaultWeekStart } from '@/lib/sessions';

// ── 헬퍼 ────────────────────────────────────────────────────────
const DAY_ORDER = ['월', '화', '수', '목', '금', '토'] as const;

// 고정 시간 축: 수업 유무와 무관하게 09:00~18:00 항상 표시
const TIME_AXIS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
] as const;


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

function fmtDateLabel(dateISO: string): string {
  const [, m, d] = dateISO.split('-');
  return `${koWeekday(dateISO)} ${+m}/${+d}`;
}

function sessionVisual(type: Session['type'], group: ClassGroup | undefined) {
  switch (type) {
    case '보강': return { bg: '#FF6C37', badge: '보강', cancelled: false };
    case '특강': return { bg: '#8B5CF6', badge: '특강', cancelled: false };
    case '휴강': return { bg: '#B9B9B7', badge: '휴강', cancelled: true };
    default:     return { bg: group ? blockColor(group.day_group).block : '#3B82F6', badge: null, cancelled: false };
  }
}

type Popover = { cls: Class; group: ClassGroup; session?: Session; top: number; left: number };

// ── 메인 ────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [selectedSemId, setSelectedSemId] = useState('sem-01');
  const [scheduleMode, setScheduleMode] = useState<'template' | 'week'>('week');
  const [view, setView] = useState<'grid' | 'card'>('grid');
  const [teacherFilter, setTeacherFilter] = useState('전체');
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [popover, setPopover] = useState<Popover | null>(null);

  // 선택된 학기의 반 목록
  const semGroups = classGroups.filter(g => g.semester_id === selectedSemId);
  const semClasses = classes.filter(c =>
    semGroups.some(g => g.id === c.class_group_id),
  );

  const sem = semesters.find(s => s.id === selectedSemId);

  // 담임(선생님) 선택지 — 필터로 줄어들지 않도록 학기 전체 기준
  const teacherOptions = [...new Set(semClasses.map(c => c.teacher))];

  // 담임 필터 적용
  const filteredClasses = teacherFilter === '전체'
    ? semClasses
    : semClasses.filter(c => c.teacher === teacherFilter);

  // 주간 모드 — 활성 주차(미선택 시 첫 수업 주) + 그 주의 세션
  const earliestStart = semClasses.reduce(
    (min, c) => (c.start_date < min ? c.start_date : min),
    '9999-12-31',
  );
  const activeWeek = weekStart ?? defaultWeekStart(semClasses, semGroups, earliestStart);
  const weekSessions = resolveWeekSessions(filteredClasses, semGroups, sessions, activeWeek);

  function handleBlockClick(
    e: React.MouseEvent<HTMLDivElement>,
    cls: Class,
    group: ClassGroup,
    session?: Session,
  ) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ cls, group, session, top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 240) });
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
            onChange={e => { setSelectedSemId(e.target.value); setWeekStart(null); }}
            className="text-sm border border-[#E9E9E7] rounded-lg px-3 py-1.5 text-[#37352F] bg-white focus:outline-none"
          >
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.year} {s.season}학기</option>
            ))}
          </select>
          {/* 정기/주간 모드 토글 */}
          <div className="flex bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg p-0.5">
            {([['template', '정기 편성'], ['week', '주간(실제)']] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setScheduleMode(m)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  scheduleMode === m ? 'bg-white text-[#37352F] shadow-sm' : 'text-[#787774]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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

      {/* 필터 바 — 담임별 조회 */}
      <div className="mb-4 flex items-center gap-2">
        <select
          value={teacherFilter}
          onChange={e => setTeacherFilter(e.target.value)}
          className="text-sm border border-[#E9E9E7] rounded-lg px-3 py-1.5 text-[#37352F] bg-white focus:outline-none"
        >
          <option value="전체">담임 전체</option>
          {teacherOptions.map(t => (
            <option key={t} value={t}>{t} 선생님</option>
          ))}
        </select>
        {teacherFilter !== '전체' && (
          <button
            onClick={() => setTeacherFilter('전체')}
            className="text-sm text-[#787774] hover:text-[#37352F] px-2 py-1.5"
          >
            초기화
          </button>
        )}
        <span className="ml-auto text-sm text-[#787774]">
          {filteredClasses.length}개 반
        </span>
      </div>

      {/* 주차 선택기 — 주간 모드에서만 */}
      {scheduleMode === 'week' && (
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setWeekStart(addDays(activeWeek, -7))}
            className="px-2 py-1 text-sm border border-[#E9E9E7] rounded-md text-[#787774] hover:text-[#37352F]"
            aria-label="이전 주"
          >
            ◀
          </button>
          <span className="text-sm font-medium text-[#37352F]">
            {fmtDateLabel(activeWeek).slice(2)} ~ {fmtDateLabel(addDays(activeWeek, 5)).slice(2)}
          </span>
          <button
            onClick={() => setWeekStart(addDays(activeWeek, 7))}
            className="px-2 py-1 text-sm border border-[#E9E9E7] rounded-md text-[#787774] hover:text-[#37352F]"
            aria-label="다음 주"
          >
            ▶
          </button>
        </div>
      )}

      {/* 뷰 렌더링 */}
      {scheduleMode === 'template' && view === 'grid' && (
        <GridView
          semClasses={filteredClasses}
          semGroups={semGroups}
          onBlockClick={handleBlockClick}
        />
      )}
      {scheduleMode === 'template' && view === 'card' && (
        <CardView
          semClasses={filteredClasses}
          semGroups={semGroups}
          onBlockClick={handleBlockClick}
        />
      )}
      {scheduleMode === 'week' && (
        <WeekGridView
          sessions={weekSessions}
          classes={filteredClasses}
          groups={semGroups}
          dates={weekDates(activeWeek)}
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
  // 고정 시간 축 (09~18)
  const times = TIME_AXIS;
  const gridCols = `52px repeat(${DAY_ORDER.length}, 1fr)`;

  // 셀 맵: { day: { time: Array<{ cls, group }> } } — 한 칸에 복수 반 누적
  const cellMap: Record<string, Record<string, { cls: Class; group: ClassGroup }[]>> = {};
  for (const cls of semClasses) {
    const group = semGroups.find(g => g.id === cls.class_group_id);
    if (!group) continue;
    for (const day of parseDays(group.day_group)) {
      const time = fmtSlot(group.time_slot);
      ((cellMap[day] ??= {})[time] ??= []).push({ cls, group });
    }
  }

  if (semClasses.length === 0) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg px-5 py-12 text-center text-sm text-[#787774]">
        조건에 맞는 수업이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid border-b border-[#E9E9E7]" style={{ gridTemplateColumns: gridCols }}>
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
            gridTemplateColumns: gridCols,
            borderBottomWidth: idx < times.length - 1 ? 1 : 0,
            borderBottomStyle: 'solid',
            minHeight: 68,
          }}
        >
          {/* 시간 레이블 */}
          <div className="px-3 py-3 bg-[#F7F7F5] border-r border-[#E9E9E7] flex items-center">
            <span className="text-xs font-semibold text-[#787774]">{time}</span>
          </div>

          {/* 요일 셀 — 같은 시간대에 복수 반이면 세로로 누적 */}
          {DAY_ORDER.map(day => {
            const cells = cellMap[day]?.[time] ?? [];
            const isSat = day === '토';
            return (
              <div
                key={day}
                className="border-l border-[#E9E9E7] p-1.5 space-y-1"
                style={{ background: isSat && cells.length === 0 ? '#FFFBF9' : undefined }}
              >
                {cells.map(({ cls, group }) => {
                  const color = blockColor(group.day_group);
                  return (
                    <div
                      key={cls.id}
                      onClick={e => onBlockClick(e, cls, group)}
                      className="rounded-md px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ background: color.block }}
                    >
                      <p className="text-xs font-semibold text-white leading-tight">{cls.course}</p>
                      <p className="text-xs text-white/80 mt-0.5">{cls.teacher}</p>
                      <p className="text-xs text-white/70">{cls.enrolled_count}명</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── 주간(실제) 그리드 뷰 ────────────────────────────────────────
function WeekGridView({
  sessions,
  classes,
  groups,
  dates,
  onBlockClick,
}: {
  sessions: Session[];
  classes: Class[];
  groups: ClassGroup[];
  dates: string[];
  onBlockClick: (e: React.MouseEvent<HTMLDivElement>, cls: Class, group: ClassGroup, session: Session) => void;
}) {
  // 고정 09~18 축 + 축에 없는 세션 시간(보강/특강 등)도 누락 없이 표시
  const extraTimes = [...new Set(sessions.map(s => fmtSlot(s.start_time)))]
    .filter(t => !(TIME_AXIS as readonly string[]).includes(t));
  const times = [...TIME_AXIS, ...extraTimes].sort();
  const gridCols = `52px repeat(${dates.length}, 1fr)`;
  const classOf = (id: string) => classes.find(c => c.id === id);
  const groupOf = (cls: Class | undefined) =>
    cls ? groups.find(g => g.id === cls.class_group_id) : undefined;

  // 셀 맵: { date: { time: Session[] } }
  const cellMap: Record<string, Record<string, Session[]>> = {};
  for (const s of sessions) {
    const time = fmtSlot(s.start_time);
    ((cellMap[s.date] ??= {})[time] ??= []).push(s);
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg px-5 py-12 text-center text-sm text-[#787774]">
        이 주에는 편성된 수업이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
      {/* 날짜 헤더 */}
      <div className="grid border-b border-[#E9E9E7]" style={{ gridTemplateColumns: gridCols }}>
        <div className="bg-[#F7F7F5] px-3 py-3" />
        {dates.map(date => {
          const isSat = koWeekday(date) === '토';
          return (
            <div
              key={date}
              className="px-2 py-3 text-center text-sm font-semibold border-l border-[#E9E9E7]"
              style={{ background: isSat ? '#FFF8F5' : '#F7F7F5', color: isSat ? '#FF6C37' : '#787774' }}
            >
              {fmtDateLabel(date)}
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
            gridTemplateColumns: gridCols,
            borderBottomWidth: idx < times.length - 1 ? 1 : 0,
            borderBottomStyle: 'solid',
            minHeight: 68,
          }}
        >
          <div className="px-3 py-3 bg-[#F7F7F5] border-r border-[#E9E9E7] flex items-center">
            <span className="text-xs font-semibold text-[#787774]">{time}</span>
          </div>

          {dates.map(date => {
            const cells = cellMap[date]?.[time] ?? [];
            const isSat = koWeekday(date) === '토';
            return (
              <div
                key={date}
                className="border-l border-[#E9E9E7] p-1.5 space-y-1"
                style={{ background: isSat && cells.length === 0 ? '#FFFBF9' : undefined }}
              >
                {cells.map(s => {
                  const cls = classOf(s.class_id);
                  const group = groupOf(cls);
                  if (!cls || !group) return null;
                  const vis = sessionVisual(s.type, group);
                  return (
                    <div
                      key={s.id}
                      onClick={e => onBlockClick(e, cls, group, s)}
                      className={`rounded-md px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity ${
                        vis.cancelled ? 'line-through' : ''
                      }`}
                      style={{ background: vis.bg, opacity: vis.cancelled ? 0.6 : 1 }}
                    >
                      <div className="flex items-center gap-1">
                        {vis.badge && (
                          <span className="text-[10px] font-bold bg-white/30 text-white rounded px-1 leading-tight">
                            {vis.badge}
                          </span>
                        )}
                        <p className="text-xs font-semibold text-white leading-tight">{cls.course}</p>
                      </div>
                      <p className="text-xs text-white/80 mt-0.5">{s.teacher ?? cls.teacher}</p>
                    </div>
                  );
                })}
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
  // 필터된 반을 소속 그룹과 짝지음
  const pairs = semClasses
    .map(cls => ({ cls, group: semGroups.find(g => g.id === cls.class_group_id) }))
    .filter((p): p is { cls: Class; group: ClassGroup } => !!p.group);

  // day_group 등장 순서 유지
  const dayGroups: string[] = [];
  for (const { group } of pairs) {
    if (!dayGroups.includes(group.day_group)) dayGroups.push(group.day_group);
  }

  if (pairs.length === 0) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-lg px-5 py-12 text-center text-sm text-[#787774]">
        조건에 맞는 수업이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {dayGroups.map(dg => {
        const color = blockColor(dg);
        // 이 day_group에 속하는 반들 (시간순)
        const slots = pairs
          .filter(p => p.group.day_group === dg)
          .sort((a, b) => a.group.time_slot.localeCompare(b.group.time_slot));

        return (
          <div key={dg} className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
            {/* 카드 헤더 */}
            <div
              className="px-5 py-3 border-b border-[#E9E9E7]"
              style={{ background: color.colBg }}
            >
              <span className="text-sm font-semibold" style={{ color: color.block }}>
                {dayLabel(dg)}
              </span>
            </div>

            {/* 시간대 행 */}
            <div className="divide-y divide-[#E9E9E7]">
              {slots.map(({ cls, group }) => (
                <div
                  key={cls.id}
                  onClick={e => onBlockClick(e, cls, group)}
                  className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[#F7F7F5] transition-colors"
                >
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded text-white min-w-[52px] text-center"
                    style={{ background: color.block }}
                  >
                    {fmtSlot(group.time_slot)}
                  </span>
                  <span className="text-sm font-medium text-[#37352F]">{cls.course}</span>
                  <span className="text-sm text-[#787774]">{cls.teacher} 선생님</span>
                  <span className="text-sm text-[#787774] ml-auto">{cls.enrolled_count}명</span>
                </div>
              ))}
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
  const { cls, group, session, top, left } = popover;
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
        {session ? (
          <>
            <p>📅 {fmtDateLabel(session.date)} {fmtSlot(session.start_time)}</p>
            <p>🏷️ {session.type}{session.memo ? ` · ${session.memo}` : ''}</p>
            <p>👨‍🏫 {(session.teacher ?? cls.teacher)} 선생님</p>
          </>
        ) : (
          <>
            <p>📅 {dayLabel(group.day_group)} {fmtSlot(group.time_slot)}</p>
            <p>👨‍🏫 {cls.teacher} 선생님</p>
          </>
        )}
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
