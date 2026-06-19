import type { Consultation, Enrollment, Student } from './mock-data';

/** 해당 학생 기록만 필터 후 날짜 내림차순(동일 날짜는 id 내림차순) 정렬 */
export function consultationsOf(all: Consultation[], studentId: string): Consultation[] {
  return all
    .filter(c => c.student_id === studentId)
    .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
}

// ── 상담 공백(미정) 분석 ─────────────────────────────────────
export interface ConsultGapEntry {
  student: Student;
  lastDate: string | null;   // 최신 상담일, 기록 없으면 null
  daysSince: number | null;  // 경과일, 기록 없으면 null(최상위로 취급)
}

/** 'YYYY-MM-DD' → epoch day (UTC, 결정적) */
function toEpochDay(d: string): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day) / 86_400_000;
}

/**
 * 재원생 중 상담 공백이 gapDays 이상인 학생(상담 기록 없음 포함)을
 * 경과일 내림차순(상담 없음이 최상위, 동률은 이름 오름차순)으로 반환.
 * asOf는 기준일('YYYY-MM-DD')을 주입 — 결정적 테스트를 위해 Date.now() 미사용.
 */
export function consultationGapStudents(
  students: Student[],
  consultations: Consultation[],
  asOf: string,
  gapDays = 90,
): ConsultGapEntry[] {
  const asOfDay = toEpochDay(asOf);
  return students
    .filter(s => s.status === '재원')
    .map(s => {
      const recs = consultationsOf(consultations, s.id);
      const lastDate = recs.length ? recs[0].date : null;
      const daysSince = lastDate ? asOfDay - toEpochDay(lastDate) : null;
      return { student: s, lastDate, daysSince };
    })
    .filter(e => e.daysSince === null || e.daysSince >= gapDays)
    .sort((a, b) => {
      const da = a.daysSince ?? Infinity;
      const db = b.daysSince ?? Infinity;
      return db === da ? a.student.name.localeCompare(b.student.name, 'ko') : db - da;
    });
}

/** `cons-<studentId>-<n>` 다음 시퀀스 id 생성 (결정적) */
export function nextConsultId(all: Consultation[], studentId: string): string {
  const prefix = `cons-${studentId}-`;
  const maxSeq = all
    .filter(c => c.student_id === studentId && c.id.startsWith(prefix))
    .reduce((max, c) => {
      const n = parseInt(c.id.slice(prefix.length), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
  return `${prefix}${maxSeq + 1}`;
}

export function addConsultation(all: Consultation[], record: Consultation): Consultation[] {
  return [...all, record];
}

export function updateConsultation(
  all: Consultation[],
  id: string,
  patch: Partial<Omit<Consultation, 'id' | 'student_id'>>,
): Consultation[] {
  return all.map(c => (c.id === id ? { ...c, ...patch } : c));
}

export function removeConsultation(all: Consultation[], id: string): Consultation[] {
  return all.filter(c => c.id !== id);
}

// ── 재원상담 탭: 스코프 & KPI ────────────────────────────────
/**
 * 스코프 내 재원생 목록.
 * classIds === null → 전체 재원생(원장·SO).
 * classIds 배열 → 해당 반에 '진행 중'(ended_at null) 수강하는 재원생만(교사 담당 반).
 */
export function studentsInScope(
  students: Student[],
  enrollments: Enrollment[],
  classIds: string[] | null,
): Student[] {
  const enrolled = students.filter(s => s.status === '재원');
  if (classIds === null) return enrolled;
  const set = new Set(classIds);
  const activeIds = new Set(
    enrollments.filter(e => e.ended_at === null && set.has(e.class_id)).map(e => e.student_id),
  );
  return enrolled.filter(s => activeIds.has(s.id));
}

/** asOf와 같은 달(YYYY-MM)의 상담 건수 */
export function consultCountInMonth(consults: Consultation[], asOf: string): number {
  const ym = asOf.slice(0, 7);
  return consults.filter(c => c.date.slice(0, 7) === ym).length;
}

/** asOf 기준 최근 days일(당일 포함) 상담 건수 */
export function consultCountInDays(consults: Consultation[], asOf: string, days: number): number {
  const end = toEpochDay(asOf);
  const start = end - (days - 1);
  return consults.filter(c => {
    const d = toEpochDay(c.date);
    return d >= start && d <= end;
  }).length;
}

/**
 * 스코프 재원생 중 최근 windowDays일 내 상담이 1건 이상 있는 비율(%) — 반올림 정수.
 * 학생이 없으면 0.
 */
export function consultedRate(
  students: Student[],
  consults: Consultation[],
  asOf: string,
  windowDays = 90,
): number {
  if (students.length === 0) return 0;
  const end = toEpochDay(asOf);
  const start = end - (windowDays - 1);
  const recentIds = new Set(
    consults
      .filter(c => {
        const d = toEpochDay(c.date);
        return d >= start && d <= end;
      })
      .map(c => c.student_id),
  );
  const covered = students.filter(s => recentIds.has(s.id)).length;
  return Math.round((covered / students.length) * 100);
}
