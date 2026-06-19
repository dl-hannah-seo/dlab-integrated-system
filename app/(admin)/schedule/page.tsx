'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { classes, classGroups, sessions, Class, ClassGroup, Session } from '@/lib/mock-data';
import { koWeekday, addDays, weekDates, mondayOf, resolveWeekSessions, defaultWeekStart } from '@/lib/sessions';
import { PlacementBoard } from '@/components/schedule/PlacementBoard';
import { useRole } from '@/components/layout/RoleContext';
import { DEMO_TEACHER_ID, DEMO_TEACHER_NAME } from '@/lib/roles';

// ── 헬퍼 ────────────────────────────────────────────────────────
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

function fmtMonthLabel(dateISO: string): string {
  const [y, m] = dateISO.split('-');
  return `${+y}년 ${+m}월`;
}

function todayISO(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function currentMonday(): string {
  const t = todayISO();
  const dow = new Date(`${t}T12:00:00`).getDay();
  return addDays(t, dow === 0 ? -6 : 1 - dow);
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
  const [view, setView] = useState<'week' | 'board'>('board');
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const [popover, setPopover] = useState<Popover | null>(null);

  const { role } = useRole();
  const isTeacher = role === '교사';
  const effectiveView = isTeacher ? 'week' : view;   // 교사는 주간 보기만

  // 전체 학기 통합 (교사는 본인 담당 반만)
  const semGroups = classGroups;
  const semClasses = isTeacher ? classes.filter(c => c.teacher_id === DEMO_TEACHER_ID) : classes;

  // 담임(선생님) 선택지
  const teacherOptions = [...new Set(semClasses.map(c => c.teacher))].sort();

  // 담임 필터 적용 (빈 Set = 전체)
  const filteredClasses = selectedTeachers.size === 0
    ? semClasses
    : semClasses.filter(c => selectedTeachers.has(c.teacher));

  function toggleTeacher(teacher: string) {
    setSelectedTeachers(prev => {
      const next = new Set(prev);
      next.has(teacher) ? next.delete(teacher) : next.add(teacher);
      return next;
    });
  }

  // 활성 주차(미선택 시 오늘 포함 주, 없으면 첫 수업 주)
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

  const today = todayISO();

  return (
    <div onClick={() => setPopover(null)}>
      {/* 뷰 토글 — 교사는 주간 보기만 */}
      {isTeacher ? (
        <p className="mb-4 text-sm text-[#787774]">{DEMO_TEACHER_NAME} 선생님 담당 수업 · 주간 보기</p>
      ) : (
      <div className="mb-4 inline-flex rounded-lg border border-[#E9E9E7] bg-white p-0.5">
        <button
          onClick={() => setView('week')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === 'week' ? 'bg-[#FFF1EC] text-[#FF6C37] font-medium' : 'text-[#787774] hover:text-[#37352F]'
          }`}
        >
          주간 보기
        </button>
        <button
          onClick={() => setView('board')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === 'board' ? 'bg-[#FFF1EC] text-[#FF6C37] font-medium' : 'text-[#787774] hover:text-[#37352F]'
          }`}
        >
          강의실별 배치
        </button>
      </div>
      )}

      {effectiveView === 'board' ? (
        <PlacementBoard />
      ) : (
      <>
      {/* 컨트롤 바 — Google Calendar 스타일 */}
      <div className="mb-4 flex items-center gap-2">
        {/* 오늘 + 주차 네비게이션 + 월 라벨 */}
        <button
          onClick={() => { setSlideDir('right'); setWeekStart(currentMonday()); }}
          className="px-3 py-1.5 text-sm border border-[#E9E9E7] rounded-lg text-[#37352F] bg-white hover:bg-[#F7F7F5] transition-colors"
        >
          오늘
        </button>
        <button
          onClick={() => { setSlideDir('left'); setWeekStart(addDays(activeWeek, -7)); }}
          className="p-1.5 text-lg text-[#787774] hover:text-[#37352F] hover:bg-[#F7F7F5] rounded-md transition-colors leading-none"
          aria-label="이전 주"
        >
          ‹
        </button>
        <button
          onClick={() => { setSlideDir('right'); setWeekStart(addDays(activeWeek, 7)); }}
          className="p-1.5 text-lg text-[#787774] hover:text-[#37352F] hover:bg-[#F7F7F5] rounded-md transition-colors leading-none"
          aria-label="다음 주"
        >
          ›
        </button>
        <span className="text-base font-semibold text-[#37352F]">
          {fmtMonthLabel(activeWeek)}
        </span>

      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex gap-4 items-start">
        {/* 미니 달력 + 담임 필터 */}
        <div className="flex-shrink-0 flex flex-col gap-2">
          <MiniCalendar
            activeWeek={activeWeek}
            today={today}
            onDateClick={date => { setSlideDir('right'); setWeekStart(date); }}
          />
          {/* 담임 체크리스트 */}
          <div className="bg-white border border-[#E9E9E7] rounded-lg p-3 w-44">
            <p className="text-[10px] font-semibold text-[#787774] uppercase tracking-wider mb-2">담임</p>
            <label className="flex items-center gap-2 py-1 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedTeachers.size === 0}
                onChange={() => setSelectedTeachers(new Set())}
                className="accent-[#37352F] w-3.5 h-3.5"
              />
              <span className="text-sm text-[#37352F] group-hover:text-[#37352F]">전체</span>
            </label>
            <div className="my-1.5 border-t border-[#E9E9E7]" />
            {teacherOptions.map(t => (
              <label key={t} className="flex items-center gap-2 py-1 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedTeachers.has(t)}
                  onChange={() => toggleTeacher(t)}
                  className="accent-[#37352F] w-3.5 h-3.5"
                />
                <span className="text-sm text-[#37352F]">{t} 선생님</span>
              </label>
            ))}
          </div>
        </div>

        {/* 주간 그리드 */}
        <div
          key={activeWeek}
          className={`flex-1 min-w-0 ${slideDir === 'right' ? 'animate-slide-from-right' : 'animate-slide-from-left'}`}
        >
          <WeekGridView
            sessions={weekSessions}
            classes={filteredClasses}
            groups={semGroups}
            dates={weekDates(activeWeek, 7)}
            today={today}
            onBlockClick={handleBlockClick}
          />
        </div>
      </div>

      {/* 팝오버 */}
      {popover && (
        <ClassPopover popover={popover} onClose={() => setPopover(null)} />
      )}
      </>
      )}
    </div>
  );
}

// ── 미니 달력 ───────────────────────────────────────────────────
const MINI_DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

function MiniCalendar({
  activeWeek,
  today,
  onDateClick,
}: {
  activeWeek: string;
  today: string;
  onDateClick: (monday: string) => void;
}) {
  const [calYear, setCalYear] = useState(() => +activeWeek.split('-')[0]);
  const [calMonth, setCalMonth] = useState(() => +activeWeek.split('-')[1]);

  useEffect(() => {
    setCalYear(+activeWeek.split('-')[0]);
    setCalMonth(+activeWeek.split('-')[1]);
  }, [activeWeek]);

  function prevMonth() {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  }

  const firstISO = `${calYear}-${String(calMonth).padStart(2, '0')}-01`;
  const firstDow = new Date(firstISO + 'T00:00:00Z').getUTCDay();
  const gridStart = addDays(firstISO, -firstDow);
  const gridDates = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const activeWeekSet = new Set(weekDates(activeWeek, 7));

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-lg p-3 w-44">
      {/* 월 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#37352F]">
          {calYear}년 {calMonth}월
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center text-base text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] rounded transition-colors"
            aria-label="이전 달"
          >‹</button>
          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center text-base text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] rounded transition-colors"
            aria-label="다음 달"
          >›</button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-0.5">
        {MINI_DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-[#787774] py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {gridDates.map(date => {
          const isActiveWeek = activeWeekSet.has(date);
          const isToday = date === today;
          const isCurrentMonth = +date.split('-')[1] === calMonth;
          const dayNum = +date.split('-')[2];
          const dow = new Date(date + 'T00:00:00Z').getUTCDay();
          const isSun = dow === 0;
          const isSat = dow === 6;

          let textColor = '#37352F';
          if (!isCurrentMonth) textColor = '#BFBFBD';
          else if (isSun) textColor = '#EB5757';
          else if (isSat) textColor = '#FF6C37';

          return (
            <button
              key={date}
              onClick={() => onDateClick(mondayOf(date))}
              className="flex items-center justify-center h-6 w-6 mx-auto rounded-full text-[11px] transition-colors hover:bg-[#F1F1EF]"
              style={{
                background: isToday ? '#37352F' : isActiveWeek ? '#F1F1EF' : undefined,
                color: isToday ? '#FFFFFF' : textColor,
                fontWeight: isToday ? 600 : undefined,
              }}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 주간(실제) 그리드 뷰 ────────────────────────────────────────
function WeekGridView({
  sessions,
  classes,
  groups,
  dates,
  today,
  onBlockClick,
}: {
  sessions: Session[];
  classes: Class[];
  groups: ClassGroup[];
  dates: string[];
  today: string;
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
          const weekday = koWeekday(date);
          const isSat = weekday === '토';
          const isToday = date === today;
          const dayNum = +date.split('-')[2];
          return (
            <div
              key={date}
              className="px-2 py-2 text-center border-l border-[#E9E9E7] flex flex-col items-center gap-1"
              style={{ background: isSat ? '#FFF8F5' : '#F7F7F5' }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: isSat ? '#FF6C37' : '#787774' }}
              >
                {weekday}
              </span>
              <span
                className="text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full"
                style={
                  isToday
                    ? { background: '#37352F', color: '#FFFFFF' }
                    : { color: isSat ? '#FF6C37' : '#37352F' }
                }
              >
                {dayNum}
              </span>
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
