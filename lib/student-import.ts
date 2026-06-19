import type { Student } from './mock-data';

// 원생 일괄 등록 — 의존성 없는 CSV 파서/검증/템플릿.
// (xlsx 라이브러리 미사용: 엑셀에서 "CSV UTF-8"로 저장/열기 가능)

export const STUDENT_IMPORT_COLUMNS = [
  '이름', '성별', '학부', '학년', '학교', '모연락처', '부연락처', '원생연락처', '유입경로',
] as const;

export interface ParsedStudentRow {
  row: number;              // 데이터 행 번호(1-base, 헤더 제외)
  name: string;
  gender?: '남' | '여';
  division?: string;
  grade: string;
  school: string;
  parent_phone: string;     // 모 연락처
  father_phone?: string;    // 부 연락처
  student_phone: string;    // 원생 연락처
  source: string;
  errors: string[];         // 행별 검증 오류 (비어 있으면 유효)
}

/** 다운로드용 템플릿(헤더 + 예시 1행) */
export function buildStudentTemplate(): string {
  const header = STUDENT_IMPORT_COLUMNS.join(',');
  const example = ['김민준', '남', '초등부', '초3', '판교초', '010-1111-2222', '010-3333-4444', '', '지인소개'].join(',');
  return `${header}\n${example}\n`;
}

/** 따옴표·줄바꿈을 처리하는 최소 CSV 파서 → 행 배열(셀 배열) */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, ''); // 엑셀 UTF-8 BOM 제거
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { row.push(cell); cell = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      rows.push(row); row = [];
      continue;
    }
    cell += ch;
  }
  // 마지막 셀/행 flush
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  // 완전 빈 행 제거
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

/** CSV 텍스트 → 검증된 원생 행 목록 (헤더 자동 스킵) */
export function parseStudentRows(text: string): ParsedStudentRow[] {
  const grid = parseCsv(text);
  if (grid.length === 0) return [];

  // 첫 행이 헤더(이름 컬럼 포함)면 스킵
  const first = grid[0].map(c => c.trim());
  const hasHeader = first.includes('이름');
  const dataRows = hasHeader ? grid.slice(1) : grid;

  return dataRows.map((cells, idx) => {
    const get = (i: number) => (cells[i] ?? '').trim();
    const genderRaw = get(1);
    const motherPhone = get(5);
    const fatherPhone = get(6);
    const studentPhone = get(7);
    const errors: string[] = [];

    const name = get(0);
    if (!name) errors.push('이름 누락');
    if (!motherPhone && !fatherPhone && !studentPhone) errors.push('연락처 1개 이상 필요');

    return {
      row: idx + 1,
      name,
      gender: genderRaw === '남' || genderRaw === '여' ? genderRaw : undefined,
      division: get(2) || undefined,
      grade: get(3),
      school: get(4),
      parent_phone: motherPhone,
      father_phone: fatherPhone || undefined,
      student_phone: studentPhone,
      source: get(8) || '기타',
      errors,
    };
  });
}

/** 검증 통과 행 → Student (데모용 기본값 채움) */
export function rowToStudent(r: ParsedStudentRow, seq: number, firstEnrolledAt: string): Student {
  return {
    id: `stu-import-${seq}`,
    campus_id: 'campus-001',
    name: r.name,
    grade: r.grade,
    school: r.school,
    parent_phone: r.parent_phone || r.father_phone || r.student_phone,
    student_phone: r.student_phone,
    status: '재원',
    first_enrolled_at: firstEnrolledAt,
    source: r.source,
    points: 0,
    class_id: '',
    streak: 0,
    title: '',
    gender: r.gender,
    division: r.division,
    father_phone: r.father_phone,
  };
}
