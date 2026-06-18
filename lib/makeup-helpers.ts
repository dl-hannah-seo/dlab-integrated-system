import { classes, classGroups, type Class } from './mock-data';

export interface MakeupSlot {
  classId: string;
  course: string;
  teacher: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  label: string;
}

const WEEKDAY_INDEX: Record<string, number> = {
  '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6,
};
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_GROUP_LABEL: Record<string, string> = { '토': '토', '화목': '화·목', '월수금': '월·수·금' };

function toUTC(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function fmtISO(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}
function fmtSlot(slot: string): string {
  return `${slot.slice(0, 2)}:${slot.slice(2)}`;
}
function weekdaysOf(dayGroup: string): number[] {
  return [...dayGroup].map(ch => WEEKDAY_INDEX[ch]).filter((n): n is number => n !== undefined);
}

/** dayGroup(예: '화목')의 today 다음(당일 제외) 가장 가까운 날짜 */
export function nextOccurrence(dayGroup: string, today: string): string | null {
  const set = new Set(weekdaysOf(dayGroup));
  if (set.size === 0) return null;
  const base = toUTC(today);
  for (let i = 1; i <= 14; i++) {
    const dt = new Date(base);
    dt.setUTCDate(dt.getUTCDate() + i);
    if (set.has(dt.getUTCDay())) return fmtISO(dt);
  }
  return null;
}

function mmddKo(iso: string): string {
  const dt = toUTC(iso);
  return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}(${WEEKDAY_KO[dt.getUTCDay()]})`;
}

/** 결석 반과 같은 과목·미종강인 다른 반의 다음 회차를 보강 후보로 추천 (날짜순) */
export function suggestMakeupSlots(absentClassId: string, today: string, limit = 3): MakeupSlot[] {
  const absent = classes.find(c => c.id === absentClassId);
  if (!absent) return [];

  const slots: MakeupSlot[] = [];
  for (const c of classes) {
    if (c.id === absentClassId) continue;
    if (c.subject_id !== absent.subject_id) continue;
    if (c.end_date < today) continue;
    const g = classGroups.find(x => x.id === c.class_group_id);
    if (!g) continue;
    const date = nextOccurrence(g.day_group, today);
    if (!date) continue;
    const time = fmtSlot(g.time_slot);
    const dgLabel = DAY_GROUP_LABEL[g.day_group] ?? g.day_group;
    slots.push({
      classId: c.id,
      course: c.course,
      teacher: c.teacher,
      date,
      time,
      label: `${dgLabel} ${time} · ${c.course} (${c.teacher}) · ${mmddKo(date)}`,
    });
  }
  slots.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  return slots.slice(0, limit);
}

/** 보강 안내 문자 문구 */
export function buildMakeupMessage(studentName: string, course: string, date: string, time: string): string {
  return `[D.LAB 판교] ${studentName} 학생 보강 일정 안내드립니다. ${date} ${time} ${course} 보강 예정입니다. 확인 부탁드립니다.`;
}

export type { Class };
