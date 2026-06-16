import type { Consultation } from './mock-data';

/** 해당 학생 기록만 필터 후 날짜 내림차순(동일 날짜는 id 내림차순) 정렬 */
export function consultationsOf(all: Consultation[], studentId: string): Consultation[] {
  return all
    .filter(c => c.student_id === studentId)
    .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
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
