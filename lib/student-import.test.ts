import { describe, it, expect } from 'vitest';
import {
  parseCsv, parseStudentRows, buildStudentTemplate, rowToStudent, STUDENT_IMPORT_COLUMNS,
} from './student-import';

describe('parseCsv', () => {
  it('기본 행/열 분리', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });
  it('따옴표 안의 콤마는 분리하지 않음', () => {
    expect(parseCsv('"판교초, 분당",초3')).toEqual([['판교초, 분당', '초3']]);
  });
  it('BOM·CRLF·빈 행 처리', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('parseStudentRows', () => {
  it('헤더를 자동으로 건너뛴다', () => {
    const csv = `${STUDENT_IMPORT_COLUMNS.join(',')}\n홍길동,남,초등부,초3,판교초,010-1111-2222,,,지인소개`;
    const rows = parseStudentRows(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('홍길동');
    expect(rows[0].gender).toBe('남');
    expect(rows[0].errors).toEqual([]);
  });
  it('이름 누락·연락처 누락을 오류로 표시 (일부 칸만 채워진 행)', () => {
    const csv = '이름,성별,학부,학년,학교,모연락처,부연락처,원생연락처,유입경로\n,,,초3,판교초,,,,';
    const rows = parseStudentRows(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].errors).toContain('이름 누락');
    expect(rows[0].errors).toContain('연락처 1개 이상 필요');
  });

  it('완전히 빈 행은 건너뛴다', () => {
    const csv = '이름,성별,학부,학년,학교,모연락처,부연락처,원생연락처,유입경로\n,,,,,,,,';
    expect(parseStudentRows(csv)).toHaveLength(0);
  });
  it('연락처가 하나라도 있으면 통과', () => {
    const csv = '이름,성별,학부,학년,학교,모연락처,부연락처,원생연락처,유입경로\n김철수,,,,,,010-9999-8888,,';
    const rows = parseStudentRows(csv);
    expect(rows[0].errors).toEqual([]);
  });
  it('잘못된 성별 값은 undefined, 유입경로 기본값 기타', () => {
    const csv = '이름,성별,학부,학년,학교,모연락처,부연락처,원생연락처,유입경로\n김철수,M,,,,010-1,,,';
    const rows = parseStudentRows(csv);
    expect(rows[0].gender).toBeUndefined();
    expect(rows[0].source).toBe('기타');
  });
});

describe('buildStudentTemplate / rowToStudent', () => {
  it('템플릿 헤더가 컬럼 정의와 일치', () => {
    expect(buildStudentTemplate().split('\n')[0]).toBe(STUDENT_IMPORT_COLUMNS.join(','));
  });
  it('행 → Student 필수 필드 채움', () => {
    const [r] = parseStudentRows(`${STUDENT_IMPORT_COLUMNS.join(',')}\n홍길동,여,초등부,초4,판교초,010-1,,,블로그`);
    const s = rowToStudent(r, 1, '2026-06-19');
    expect(s.name).toBe('홍길동');
    expect(s.status).toBe('재원');
    expect(s.parent_phone).toBe('010-1');
    expect(s.first_enrolled_at).toBe('2026-06-19');
    expect(s.points).toBe(0);
  });
  it('모 연락처 없으면 부/원생 연락처로 대체', () => {
    const [r] = parseStudentRows('이름,성별,학부,학년,학교,모연락처,부연락처,원생연락처,유입경로\n김철수,,,,,,010-222,,');
    const s = rowToStudent(r, 2, '2026-06-19');
    expect(s.parent_phone).toBe('010-222');
  });
});
