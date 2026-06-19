'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { classes, classGroups, sessions, students, CURRENT_SEMESTER_ID, Class, ClassGroup, Session } from '@/lib/mock-data';
import { koWeekday, addDays, weekDates, mondayOf, resolveWeekSessions } from '@/lib/sessions';
import { PlacementBoard } from '@/components/schedule/PlacementBoard';
import { FeedbackModal } from '@/components/schedule/FeedbackModal';
import { useFeedbacks } from '@/components/panels/FeedbackContext';
import { classPhaseRates } from '@/lib/feedback';

// 시간표 블록·팝오버 피드백 단계 표시
const PHASE_CHAR: Record<string, string> = { '그리팅': '그', '중간': '중', '파이널': '파' };
const PHASE_COLOR: Record<string, string> = { '그리팅': '#28C76F', '중간': '#2F6BFF', '파이널': '#2F6BFF' };

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
  if (dayGroup === '토') return { block: '#2F6BFF', colBg: '#EAF1FF', headerText: '#2F6BFF' };
  return { block: '#2F6BFF', colBg: '#EAF1FF', headerText: '#2F6BFF' };
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
    case '보강': return { bg: '#2F6BFF', badge: '보강', cancelled: false };
    case '특강': return { bg: '#2F6BFF', badge: '특강', cancelled: false };
    case '휴강': return { bg: '#AEB4C0', badge: '휴강', cancelled: true };
    default:     return { bg: group ? blockColor(group.day_group).block : '#2F6BFF', badge: null, cancelled: false };
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
  const [feedbackClassId, setFeedbackClassId] = useState<string | null>(null);

  const effectiveView = view;   // 교사도 원장과 동일하게 전체 시간표 표시

  // 전체 학기 통합
  const semGroups = classGroups;
  const semClasses = classes;

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

  // 활성 주차(미선택 시 오늘 포함 주)
  const activeWeek = weekStart ?? currentMonday();
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
      {/* 뷰 토글 */}
      <div className="mb-4 inline-flex rounded-lg border border-[#E8EBF1] bg-white p-0.5">
        <button
          onClick={() => setView('board')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === 'board' ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium' : 'text-[#6B7280] hover:text-[#1A1D29]'
          }`}
        >
          강의실별 배치
        </button>
        <button
          onClick={() => setView('week')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === 'week' ? 'bg-[#EAF1FF] text-[#2F6BFF] font-medium' : 'text-[#6B7280] hover:text-[#1A1D29]'
          }`}
        >
          주간 보기
        </button>
      </div>

      {effectiveView === 'board' ? (
        <PlacementBoard />
      ) : (
      <>
      {/* 컨트롤 바 — Google Calendar 스타일 */}
      <div className="mb-4 flex items-center gap-2">
        {/* 오늘 + 주차 네비게이션 + 월 라벨 */}
        <button
          onClick={() => { setSlideDir('right'); setWeekStart(currentMonday()); }}
          className="px-3 py-1.5 text-sm border border-[#E8EBF1] rounded-lg text-[#1A1D29] bg-white hover:bg-[#F4F6FA] transition-colors"
        >
          오늘
        </button>
        <button
          onClick={() => { setSlideDir('left'); setWeekStart(addDays(activeWeek, -7)); }}
          className="p-1.5 text-lg text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#F4F6FA] rounded-md transition-colors leading-none"
          aria-label="이전 주"
        >
          ‹
        </button>
        <button
          onClick={() => { setSlideDir('right'); setWeekStart(addDays(activeWeek, 7)); }}
          className="p-1.5 text-lg text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#F4F6FA] rounded-md transition-colors leading-none"
          aria-label="다음 주"
        >
          ›
        </button>
        <span className="text-base font-semibold text-[#1A1D29]">
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
          <div className="bg-white border border-[#E8EBF1] rounded-lg p-3 w-44">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">담임</p>
            <label className="flex items-center gap-2 py-1 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedTeachers.size === 0}
                onChange={() => setSelectedTeachers(new Set())}
                className="accent-[#1A1D29] w-3.5 h-3.5"
              />
              <span className="text-sm text-[#1A1D29] group-hover:text-[#1A1D29]">전체</span>
            </label>
            <div className="my-1.5 border-t border-[#E8EBF1]" />
            {teacherOptions.map(t => (
              <label key={t} className="flex items-center gap-2 py-1 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedTeachers.has(t)}
                  onChange={() => toggleTeacher(t)}
                  className="accent-[#1A1D29] w-3.5 h-3.5"
                />
                <span className="text-sm text-[#1A1D29]">{t} 선생님</span>
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
        <ClassPopover
          popover={popover}
          onClose={() => setPopover(null)}
          onOpenFeedback={() => { setFeedbackClassId(popover.cls.id); setPopover(null); }}
        />
      )}
      </>
      )}

      {/* 학생별 피드백 모달 */}
      {feedbackClassId && (
        <FeedbackModal classId={feedbackClassId} onClose={() => setFeedbackClassId(null)} />
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
    <div className="bg-white border border-[#E8EBF1] rounded-lg p-3 w-44">
      {/* 월 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#1A1D29]">
          {calYear}년 {calMonth}월
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center text-base text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#EEF1F5] rounded transition-colors"
            aria-label="이전 달"
          >‹</button>
          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center text-base text-[#6B7280] hover:text-[#1A1D29] hover:bg-[#EEF1F5] rounded transition-colors"
            aria-label="다음 달"
          >›</button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-0.5">
        {MINI_DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-[#6B7280] py-0.5">
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

          let textColor = '#1A1D29';
          if (!isCurrentMonth) textColor = '#AEB4C0';
          else if (isSun) textColor = '#F2474B';
          else if (isSat) textColor = '#2F6BFF';

          return (
            <button
              key={date}
              onClick={() => onDateClick(mondayOf(date))}
              className="flex items-center justify-center h-6 w-6 mx-auto rounded-full text-[11px] transition-colors hover:bg-[#EEF1F5]"
              style={{
                background: isToday ? '#1A1D29' : isActiveWeek ? '#EEF1F5' : undefined,
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
  const { feedbacks } = useFeedbacks();
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
      <div className="bg-white border border-[#E8EBF1] rounded-lg px-5 py-12 text-center text-sm text-[#6B7280]">
        이 주에는 편성된 수업이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8EBF1] rounded-lg overflow-hidden">
      {/* 날짜 헤더 */}
      <div className="grid border-b border-[#E8EBF1]" style={{ gridTemplateColumns: gridCols }}>
        <div className="bg-[#F4F6FA] px-3 py-3" />
        {dates.map(date => {
          const weekday = koWeekday(date);
          const isSat = weekday === '토';
          const isToday = date === today;
          const dayNum = +date.split('-')[2];
          return (
            <div
              key={date}
              className="px-2 py-2 text-center border-l border-[#E8EBF1] flex flex-col items-center gap-1"
              style={{ background: isSat ? '#EAF1FF' : '#F4F6FA' }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: isSat ? '#2F6BFF' : '#6B7280' }}
              >
                {weekday}
              </span>
              <span
                className="text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full"
                style={
                  isToday
                    ? { background: '#1A1D29', color: '#FFFFFF' }
                    : { color: isSat ? '#2F6BFF' : '#1A1D29' }
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
          className="grid border-[#E8EBF1]"
          style={{
            gridTemplateColumns: gridCols,
            borderBottomWidth: idx < times.length - 1 ? 1 : 0,
            borderBottomStyle: 'solid',
            minHeight: 68,
          }}
        >
          <div className="px-3 py-3 bg-[#F4F6FA] border-r border-[#E8EBF1] flex items-center">
            <span className="text-xs font-semibold text-[#6B7280]">{time}</span>
          </div>

          {dates.map(date => {
            const cells = cellMap[date]?.[time] ?? [];
            const isSat = koWeekday(date) === '토';
            return (
              <div
                key={date}
                className="border-l border-[#E8EBF1] p-1.5 space-y-1"
                style={{ background: isSat && cells.length === 0 ? '#EAF1FF' : undefined }}
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
                      {/* 단계별 피드백 완료율 3종 */}
                      {!vis.cancelled && (
                        <div className="mt-1 flex gap-0.5">
                          {classPhaseRates(students, feedbacks, cls.id, CURRENT_SEMESTER_ID).map(({ phase, rate }) => (
                            <span
                              key={phase}
                              title={`${phase} ${rate}%`}
                              className="flex-1 text-[9px] leading-none text-white text-center rounded-sm bg-white/20 px-0.5 py-0.5 tabular-nums"
                            >
                              {PHASE_CHAR[phase]}{rate}
                            </span>
                          ))}
                        </div>
                      )}
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
  onOpenFeedback,
}: {
  popover: Popover;
  onClose: () => void;
  onOpenFeedback: () => void;
}) {
  const { cls, group, session, top, left } = popover;
  const color = blockColor(group.day_group);
  const { feedbacks } = useFeedbacks();
  const rates = classPhaseRates(students, feedbacks, cls.id, CURRENT_SEMESTER_ID);

  return (
    <div
      onClick={e => e.stopPropagation()}
      className="fixed z-50 w-56 bg-white border border-[#E8EBF1] rounded-lg shadow-xl"
      style={{ top, left }}
    >
      {/* 팝오버 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8EBF1]">
        <span className="text-sm font-semibold" style={{ color: color.block }}>
          {cls.course}
        </span>
        <button
          onClick={onClose}
          className="text-[#6B7280] hover:text-[#1A1D29] text-xs"
        >
          ✕
        </button>
      </div>

      {/* 팝오버 내용 */}
      <div className="px-4 py-3 space-y-1.5 text-sm text-[#1A1D29]">
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
          <span className="text-[#6B7280]">/ 정원 {cls.capacity}명</span>
        </p>
        <p>📆 {cls.start_date} ~ {cls.end_date}</p>
        <p>
          💰 {cls.payment_method === '매월' ? '월 ' : '일시 '}
          {fmtCurrency(cls.tuition_fee)}
        </p>
      </div>

      {/* 학부모 피드백 완료율 3종 */}
      <div className="px-4 py-3 border-t border-[#E8EBF1]">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">학부모 피드백</p>
        <div className="space-y-1.5">
          {rates.map(({ phase, rate }) => (
            <div key={phase} className="flex items-center gap-2">
              <span className="w-9 text-xs text-[#6B7280]">{phase}</span>
              <div className="flex-1 h-1.5 rounded-full bg-[#EEF1F5]">
                <div className="h-full rounded-full" style={{ width: `${rate}%`, background: PHASE_COLOR[phase] }} />
              </div>
              <span className="w-8 text-right text-xs font-medium tabular-nums" style={{ color: PHASE_COLOR[phase] }}>{rate}%</span>
            </div>
          ))}
        </div>
        <button
          onClick={onOpenFeedback}
          className="mt-3 w-full rounded-md bg-[#EAF1FF] px-3 py-1.5 text-xs font-medium text-[#2F6BFF] hover:bg-[#DCE7FF] transition-colors"
        >
          학생별 피드백 입력 →
        </button>
      </div>

      {/* 하단 링크 */}
      <div className="px-4 py-3 border-t border-[#E8EBF1]">
        <Link
          href={`/classes?selected=${cls.id}`}
          className="text-xs text-[#2F6BFF] hover:underline"
        >
          반 상세 페이지로 이동 →
        </Link>
      </div>
    </div>
  );
}
