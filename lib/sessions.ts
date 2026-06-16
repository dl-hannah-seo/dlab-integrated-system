import type { Class, ClassGroup, Session } from './mock-data';

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 'YYYY-MM-DD'를 UTC 자정 Date로 파싱 (타임존 영향 제거) */
function parse(dateISO: string): Date {
  return new Date(dateISO + 'T00:00:00Z');
}
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** day_group을 개별 요일 배열로 분해 ('화목' → ['화','목']) */
export function parseDays(dayGroup: string): string[] {
  const map: Record<string, string[]> = {
    '토': ['토'],
    '화목': ['화', '목'],
    '월수금': ['월', '수', '금'],
  };
  return map[dayGroup] ?? [...dayGroup];
}

export function addDays(dateISO: string, n: number): string {
  const d = parse(dateISO);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

export function koWeekday(dateISO: string): string {
  return KO_WEEKDAYS[parse(dateISO).getUTCDay()];
}

/** 해당 날짜가 속한 주의 월요일 (월요일 시작) */
export function mondayOf(dateISO: string): string {
  const dow = parse(dateISO).getUTCDay(); // 0=일..6=토
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(dateISO, diff);
}

/** 주 시작(월)부터 count일의 날짜 배열 (기본 6 = 월~토) */
export function weekDates(weekStartISO: string, count = 6): string[] {
  return Array.from({ length: count }, (_, i) => addDays(weekStartISO, i));
}

/** 한 주의 정규 세션 생성 (반 활성 기간·요일 일치하는 날짜만) */
export function generateRegularSessions(
  classes: Class[],
  groups: ClassGroup[],
  weekStartISO: string,
): Session[] {
  const dates = weekDates(weekStartISO);
  const out: Session[] = [];
  for (const cls of classes) {
    const group = groups.find(g => g.id === cls.class_group_id);
    if (!group) continue;
    const days = parseDays(group.day_group);
    for (const date of dates) {
      if (date < cls.start_date || date > cls.end_date) continue;
      if (!days.includes(koWeekday(date))) continue;
      out.push({
        id: `auto-${cls.id}-${date}`,
        class_id: cls.id,
        date,
        start_time: group.time_slot,
        type: '정규',
      });
    }
  }
  return out;
}

/** 정규 세션 + 해당 주 예외(휴강/보강/특강) 병합 */
export function resolveWeekSessions(
  classes: Class[],
  groups: ClassGroup[],
  overrides: Session[],
  weekStartISO: string,
): Session[] {
  const regular = generateRegularSessions(classes, groups, weekStartISO);
  const weekEnd = addDays(weekStartISO, 6);
  const classIds = new Set(classes.map(c => c.id));
  const inWeek = overrides.filter(
    o => o.date >= weekStartISO && o.date <= weekEnd && classIds.has(o.class_id),
  );

  const keyOf = (s: Session) => `${s.class_id}|${s.date}|${s.start_time}`;
  const cancels = inWeek.filter(o => o.type === '휴강');
  const additions = inWeek.filter(o => o.type !== '휴강');
  const cancelMap = new Map(cancels.map(c => [keyOf(c), c]));

  const merged = regular.map(s => {
    const c = cancelMap.get(keyOf(s));
    return c ? { ...s, type: '휴강' as const, memo: c.memo } : s;
  });

  const regularKeys = new Set(regular.map(keyOf));
  const orphanCancels = cancels.filter(c => !regularKeys.has(keyOf(c)));

  return [...merged, ...orphanCancels, ...additions];
}

/** fromISO 이후 처음으로 정규 세션이 존재하는 주의 월요일 (없으면 fromISO의 월요일) */
export function defaultWeekStart(
  classes: Class[],
  groups: ClassGroup[],
  fromISO: string,
  maxWeeks = 16,
): string {
  let wk = mondayOf(fromISO);
  for (let i = 0; i < maxWeeks; i++) {
    if (generateRegularSessions(classes, groups, wk).length > 0) return wk;
    wk = addDays(wk, 7);
  }
  return mondayOf(fromISO);
}
