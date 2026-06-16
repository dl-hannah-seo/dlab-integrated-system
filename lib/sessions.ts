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
