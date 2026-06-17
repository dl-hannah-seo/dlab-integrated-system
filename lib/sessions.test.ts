import { describe, it, expect } from 'vitest';
import {
  parseDays, addDays, koWeekday, mondayOf, weekDates,
  generateRegularSessions, resolveWeekSessions, defaultWeekStart,
} from './sessions';
import type { Class, ClassGroup, Session } from './mock-data';

describe('parseDays', () => {
  it('복합 요일 그룹을 분해한다', () => {
    expect(parseDays('화목')).toEqual(['화', '목']);
    expect(parseDays('토')).toEqual(['토']);
    expect(parseDays('월수금')).toEqual(['월', '수', '금']);
  });
});

describe('addDays', () => {
  it('일수를 더하고 빼며 월 경계를 넘는다', () => {
    expect(addDays('2026-07-11', 1)).toBe('2026-07-12');
    expect(addDays('2026-07-01', -1)).toBe('2026-06-30');
  });
});

describe('koWeekday', () => {
  it('ISO 날짜의 한글 요일을 반환한다', () => {
    expect(koWeekday('2026-07-06')).toBe('월'); // 2026-07-06은 월요일
    expect(koWeekday('2026-07-11')).toBe('토');
    expect(koWeekday('2026-07-12')).toBe('일');
  });
});

describe('mondayOf', () => {
  it('해당 주의 월요일을 반환한다 (월요일 시작)', () => {
    expect(mondayOf('2026-07-11')).toBe('2026-07-06'); // 토 → 그 주 월
    expect(mondayOf('2026-07-06')).toBe('2026-07-06'); // 월 → 그대로
    expect(mondayOf('2026-07-12')).toBe('2026-07-06'); // 일 → 직전 월
  });
});

describe('weekDates', () => {
  it('주 시작(월)부터 월~토 6일을 반환한다', () => {
    expect(weekDates('2026-07-06')).toEqual([
      '2026-07-06', '2026-07-07', '2026-07-08',
      '2026-07-09', '2026-07-10', '2026-07-11',
    ]);
  });
});

const G: ClassGroup[] = [
  { id: 'g-sat', campus_id: 'c', semester_id: 's', year: 2026, season: '여름', day_group: '토', time_slot: '0900' },
  { id: 'g-tt', campus_id: 'c', semester_id: 's', year: 2026, season: '여름', day_group: '화목', time_slot: '1600' },
];
const C: Class[] = [
  {
    id: 'c-sat', campus_id: 'c', class_group_id: 'g-sat', course: '파이썬', subject_id: 'sub-python', name: 'x',
    teacher: '론', team_lead: '케이', capacity: 15, start_date: '2026-07-05', end_date: '2026-08-30',
    schedule: '토 09:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 0, material_fee: 0, content_fee: 0, enrolled_count: 10,
  },
  {
    id: 'c-tt', campus_id: 'c', class_group_id: 'g-tt', course: '맞춤', subject_id: 'sub-custom', name: 'y',
    teacher: '리암', team_lead: '케이', capacity: 18, start_date: '2026-07-07', end_date: '2026-09-01',
    schedule: '화·목 16:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 0, material_fee: 0, content_fee: 0, enrolled_count: 12,
  },
];

describe('generateRegularSessions', () => {
  it('그 주에 요일·기간이 맞는 정규 세션만 만든다', () => {
    const r = generateRegularSessions(C, G, '2026-07-06'); // 월 07-06 ~ 토 07-11
    // c-sat: 토 07-11 1건 / c-tt: 화 07-07, 목 07-09 2건
    expect(r.map(s => `${s.class_id}@${s.date}`).sort()).toEqual([
      'c-sat@2026-07-11', 'c-tt@2026-07-07', 'c-tt@2026-07-09',
    ]);
    expect(r.every(s => s.type === '정규')).toBe(true);
  });

  it('반 시작일 이전 날짜는 제외한다', () => {
    // c-tt 시작 07-07 → 07-06 주의 화(07-07)는 포함, 그 전 주(06-29)의 화(06-30)는 제외
    const prev = generateRegularSessions(C, G, '2026-06-29');
    expect(prev.some(s => s.class_id === 'c-tt')).toBe(false);
  });
});

describe('resolveWeekSessions', () => {
  const overrides: Session[] = [
    { id: 'o1', class_id: 'c-tt', date: '2026-07-07', start_time: '1600', type: '휴강', memo: '출장' },
    { id: 'o2', class_id: 'c-tt', date: '2026-07-11', start_time: '1500', type: '보강', memo: '보충' },
    { id: 'o3', class_id: 'c-sat', date: '2026-07-11', start_time: '1300', type: '특강', memo: '특강' },
    { id: 'o4', class_id: 'c-tt', date: '2026-07-18', start_time: '1600', type: '휴강' }, // 다른 주
  ];

  it('휴강은 매칭되는 정규 세션의 유형을 덮어쓴다', () => {
    const r = resolveWeekSessions(C, G, overrides, '2026-07-06');
    const tue = r.find(s => s.class_id === 'c-tt' && s.date === '2026-07-07');
    expect(tue?.type).toBe('휴강');
    expect(tue?.memo).toBe('출장');
  });

  it('보강·특강은 추가된다', () => {
    const r = resolveWeekSessions(C, G, overrides, '2026-07-06');
    expect(r.some(s => s.type === '보강' && s.date === '2026-07-11')).toBe(true);
    expect(r.some(s => s.type === '특강' && s.date === '2026-07-11')).toBe(true);
  });

  it('다른 주의 예외는 포함하지 않는다', () => {
    const r = resolveWeekSessions(C, G, overrides, '2026-07-06');
    expect(r.some(s => s.id === 'o4' || s.date === '2026-07-18')).toBe(false);
  });

  it('전달된 반에 없는 class_id의 예외는 무시한다', () => {
    const r = resolveWeekSessions([C[0]], G, overrides, '2026-07-06'); // c-sat만
    expect(r.some(s => s.class_id === 'c-tt')).toBe(false);
  });
});

describe('defaultWeekStart', () => {
  it('정규 세션이 처음 생기는 주의 월요일을 반환한다', () => {
    // 가장 이른 시작 07-05 → 06-29 주는 비어있고, 07-06 주부터 세션 발생
    expect(defaultWeekStart(C, G, '2026-07-05')).toBe('2026-07-06');
  });
});
