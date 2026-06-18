import type { Student } from './mock-data';

export type TitleTier = '일반' | '희귀' | '영웅' | '전설' | '신화';
export type TitleCategory = '출석' | '질문' | '수상';

export interface TitleDef {
  id: string;
  name: string;
  tier: TitleTier;
  category: TitleCategory;
  condition: string;
  auto: boolean;   // 시스템 자동 지급 가능 여부 (출석·수상=true, 질문=false)
}

export const TIER_ORDER: TitleTier[] = ['일반', '희귀', '영웅', '전설', '신화'];

export const TIER_STYLE: Record<TitleTier, { color: string; bg: string }> = {
  '일반': { color: '#787774', bg: 'rgba(120,119,116,0.15)' },
  '희귀': { color: '#1A73E8', bg: 'rgba(26,115,232,0.15)' },
  '영웅': { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  '전설': { color: '#FF6C37', bg: 'rgba(255,108,55,0.18)' },
  '신화': { color: '#F5C842', bg: 'rgba(245,200,66,0.18)' },
};

export const TITLES: TitleDef[] = [
  // 1) 출석·성실성 계열 (auto)
  { id: 't-att-01', name: '발걸음 가벼운 여행자', tier: '일반', category: '출석', condition: '등원 한 달 달성', auto: true },
  { id: 't-att-02', name: '정시의 파수꾼', tier: '일반', category: '출석', condition: '일주일 연속 정시 등원', auto: true },
  { id: 't-att-03', name: '성실한 예비 모험가', tier: '일반', category: '출석', condition: '지각 없이 10회 등원', auto: true },
  { id: 't-att-04', name: '아침을 여는 소환사', tier: '일반', category: '출석', condition: '문 열자마자 첫 등원', auto: true },
  { id: 't-att-05', name: '신속의 스카우트', tier: '희귀', category: '출석', condition: '15회 연속 정시 등원', auto: true },
  { id: 't-att-06', name: '바람을 가르는 자', tier: '희귀', category: '출석', condition: '20분 전 조기 등원 5회', auto: true },
  { id: 't-att-07', name: '시간 연금술사의 제자', tier: '희귀', category: '출석', condition: '한 달 무지각', auto: true },
  { id: 't-att-08', name: '시공의 순례자', tier: '영웅', category: '출석', condition: '3달 연속 무결점 출석', auto: true },
  { id: 't-att-09', name: '차원의 문지기', tier: '영웅', category: '출석', condition: '오픈 직후 등원 20회', auto: true },
  { id: 't-att-10', name: '백발백중의 추적자', tier: '영웅', category: '출석', condition: '정시 도착 30회', auto: true },
  { id: 't-att-11', name: '시간의 지배자', tier: '전설', category: '출석', condition: '6달 연속 완벽 개근', auto: true },
  { id: 't-att-12', name: '불멸의 개근 기사', tier: '전설', category: '출석', condition: '1년 연속 결석·지각 0회', auto: true },
  { id: 't-att-13', name: '시공간의 초월자', tier: '신화', category: '출석', condition: '2년 연속 결석·지각 0회', auto: true },
  { id: 't-att-14', name: '학원의 살아있는 역사', tier: '신화', category: '출석', condition: '3년 연속 결석·지각 0회', auto: true },
  // 2) 질문·탐구 계열 (manual)
  { id: 't-qst-01', name: '호기심 많은 탐험가', tier: '일반', category: '질문', condition: '핵심을 찌르는 질문 첫 시도', auto: false },
  { id: 't-qst-02', name: '흔적 추적자', tier: '일반', category: '질문', condition: '교안의 코드 오류·오타 발견', auto: false },
  { id: 't-qst-03', name: '돋보기를 든 학도', tier: '일반', category: '질문', condition: '이해 안 되는 부분을 정확히 질문', auto: false },
  { id: 't-qst-04', name: '비밀의 목격자', tier: '일반', category: '질문', condition: '확장 개념에 대해 질문', auto: false },
  { id: 't-qst-05', name: '보물 상자 감정사', tier: '희귀', category: '질문', condition: '더 효율적인 대안 코드 제시', auto: false },
  { id: 't-qst-06', name: '허점 찌르는 자', tier: '희귀', category: '질문', condition: '숨겨진 예외 상황 간파', auto: false },
  { id: 't-qst-07', name: '심연의 관찰자', tier: '영웅', category: '질문', condition: '한 수업에서 핵심 질문 3개 이상', auto: false },
  { id: 't-qst-08', name: '진실을 꿰뚫는 눈', tier: '전설', category: '질문', condition: '강사가 감탄할 본질적 질문', auto: false },
  // 3) 시험·수상 계열 (auto)
  { id: 't-awd-01', name: '시련의 도전자', tier: '일반', category: '수상', condition: '자격증 시험 첫 도전', auto: true },
  { id: 't-awd-02', name: '투기장의 신인', tier: '일반', category: '수상', condition: '소규모 코딩 대회 출전', auto: true },
  { id: 't-awd-03', name: '강철의 의지', tier: '희귀', category: '수상', condition: '재도전 끝에 합격', auto: true },
  { id: 't-awd-04', name: '난관 돌파자', tier: '희귀', category: '수상', condition: '중급 레벨 테스트 우수 통과', auto: true },
  { id: 't-awd-05', name: '드래곤 슬레이어', tier: '영웅', category: '수상', condition: '공인 IT·코딩 자격증 합격', auto: true },
  { id: 't-awd-06', name: '전장을 지배하는 자', tier: '영웅', category: '수상', condition: '대외 대회 예선 통과', auto: true },
  { id: 't-awd-07', name: '전설의 용사', tier: '전설', category: '수상', condition: '공인 대회 본선 수상', auto: true },
  { id: 't-awd-08', name: '대륙의 지배자', tier: '신화', category: '수상', condition: '권위 대회 대상·금상 이상', auto: true },
];

export function titleByName(name: string): TitleDef | undefined {
  return TITLES.find(t => t.name === name);
}

/**
 * 학생이 보유한 칭호 id 집합 (데모 자동 판정)
 * - 현재 student.title 매칭
 * - streak 기반 출석 칭호 일부 자동 지급
 */
export function earnedTitleIds(student: Student): Set<string> {
  const ids = new Set<string>();
  const cur = titleByName(student.title);
  if (cur) ids.add(cur.id);

  // 출석(streak) 기반 자동 지급 (데모)
  ids.add('t-att-01'); // 등원 한 달 — 재원생 기본
  if (student.streak >= 7) ids.add('t-att-02');
  if (student.streak >= 10) ids.add('t-att-03');
  if (student.streak >= 15) ids.add('t-att-05');
  return ids;
}
