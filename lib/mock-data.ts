// ─────────────────────────────────────────────────────────────
// D.LAB OS — Mock Data (Phase 1, 시연용)
// PRD §5 스키마 기반. 판교 캠퍼스 단일 스코프.
// ─────────────────────────────────────────────────────────────

export type AttendanceStatus = 'attend' | 'absent' | 'pending' | 'makeup';
export type StudentStatus = '재원' | '퇴원' | '휴원';
export type InvoiceStatus = '완납' | '미납' | '부분납' | '환불';
export type PayMethod = '카드' | '현금' | '계좌이체' | 'PG';

// ── 캠퍼스 ──────────────────────────────────────────────────
export interface Campus {
  id: string;
  name: string;
  payment_link_url: string;
}

export const campus: Campus = {
  id: 'campus-001',
  name: '판교 캠퍼스',
  payment_link_url: 'https://pay.dlab.co.kr/pangyo',
};

// ── 학기 편성 ─────────────────────────────────────────────────
export interface Semester {
  id: string;
  campus_id: string;
  year: number;
  season: string;
  courses: string[];
  status?: '예정' | '진행 중' | '종료';
}

export const semesters: Semester[] = [
  { id: 'sem-01', campus_id: 'campus-001', year: 2026, season: '여름학기', courses: ['파이썬 기초', '맞춤수업', '아두이노'] },
  { id: 'sem-02', campus_id: 'campus-001', year: 2025, season: '봄학기', courses: ['파이썬 기초', '맞춤수업'] },
];

// ── 반 그룹 (학기>시간>반 3단 계층) ─────────────────────────
export interface ClassGroup {
  id: string;
  campus_id: string;
  semester_id: string;
  year: number;
  season: string;
  day_group: string;
  time_slot: string;
}

export const classGroups: ClassGroup[] = [
  { id: 'cg-01', campus_id: 'campus-001', semester_id: 'sem-01', year: 2026, season: '여름학기', day_group: '토', time_slot: '0900' },
  { id: 'cg-02', campus_id: 'campus-001', semester_id: 'sem-01', year: 2026, season: '여름학기', day_group: '토', time_slot: '1000' },
  { id: 'cg-03', campus_id: 'campus-001', semester_id: 'sem-01', year: 2026, season: '여름학기', day_group: '토', time_slot: '1100' },
  { id: 'cg-04', campus_id: 'campus-001', semester_id: 'sem-01', year: 2026, season: '여름학기', day_group: '화목', time_slot: '1600' },
  { id: 'cg-05', campus_id: 'campus-001', semester_id: 'sem-01', year: 2026, season: '여름학기', day_group: '화목', time_slot: '1700' },
  { id: 'cg-06', campus_id: 'campus-001', semester_id: 'sem-01', year: 2026, season: '여름학기', day_group: '화목', time_slot: '1800' },
  // 토 10:00 동시간대 2개 반 (한 칸 누적 표시 예시)
  { id: 'cg-09', campus_id: 'campus-001', semester_id: 'sem-01', year: 2026, season: '여름학기', day_group: '토', time_slot: '1000' },
  { id: 'cg-07', campus_id: 'campus-001', semester_id: 'sem-02', year: 2025, season: '봄학기', day_group: '토', time_slot: '0900' },
  { id: 'cg-08', campus_id: 'campus-001', semester_id: 'sem-02', year: 2025, season: '봄학기', day_group: '토', time_slot: '1000' },
];

// ── 과목 마스터 ───────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  order?: number;
}

export const subjects: Subject[] = [
  { id: 'sub-python',  name: '파이썬',   order: 1 },
  { id: 'sub-arduino', name: '아두이노', order: 2 },
  { id: 'sub-custom',  name: '맞춤수업', order: 3 },
  { id: 'sub-scratch', name: '스크래치', order: 4 },
];

// ── 강사 ──────────────────────────────────────────────────────
export interface Teacher {
  id: string;
  campus_id: string;
  name: string;
  subject_ids: string[];         // 가르칠 수 있는 과목 = "강사 수준"
  phone?: string;
  status: '재직' | '휴직' | '퇴직';
}

export const teachers: Teacher[] = [
  { id: 'tch-ron',   campus_id: 'campus-001', name: '론',   subject_ids: ['sub-python'],                status: '재직' },
  { id: 'tch-seed',  campus_id: 'campus-001', name: '씨드', subject_ids: ['sub-python', 'sub-arduino'], status: '재직' },
  { id: 'tch-ruth',  campus_id: 'campus-001', name: '루스', subject_ids: ['sub-custom'],                status: '재직' },
  { id: 'tch-liam',  campus_id: 'campus-001', name: '리암', subject_ids: ['sub-python'],                status: '재직' },
  { id: 'tch-hobin', campus_id: 'campus-001', name: '허빈', subject_ids: ['sub-custom', 'sub-arduino'], status: '재직' },
];

// ── 반 ──────────────────────────────────────────────────────
export interface Class {
  id: string;
  campus_id: string;
  class_group_id: string;
  course: string;
  subject_id: string;            // 과목 마스터 참조 (매칭 기준). course는 표시용 문자열로 유지.
  name: string;
  teacher: string;
  teacher_id?: string;           // 강사 마스터 참조. teacher는 표시용 이름으로 유지.
  team_lead: string;
  capacity: number;
  semester_id?: string;
  start_date: string;
  end_date: string;
  weeks?: number;
  schedule: string;
  payment_method: '매월' | '일시';
  payment_due_day: number;
  tuition_fee: number;
  material_fee: number;
  content_fee: number;
  enrolled_count: number;
  room?: string;                 // 고정 강의실 (반 배치도 열 — 자유 입력, 미입력 시 '미배정')
}

// ── 세션 (주차별 실제 수업 1회 — 정기 편성에서 파생 + 변동) ──────
export interface Session {
  id: string;
  class_id: string;              // 파생 원본 정기 반 (Class.id)
  date: string;                  // 'YYYY-MM-DD'
  start_time: string;            // 'HHMM'
  end_time?: string;             // 'HHMM' (선택)
  type: '정규' | '보강' | '휴강' | '특강';
  teacher?: string;              // 변경 시 override (없으면 Class.teacher)
  room?: string;                 // 강의실 변경 표시 (선택)
  replaces_session_id?: string;  // 보강이 대체하는 휴강 세션 (선택)
  memo?: string;                 // 사유/비고
}

export const classes: Class[] = [
  {
    id: 'cl-01', campus_id: 'campus-001', class_group_id: 'cg-01',
    course: '파이썬 기초', subject_id: 'sub-python', name: '2026여름학기토0900/파이썬기초/론',
    teacher: '론', teacher_id: 'tch-ron', team_lead: '케이', capacity: 8,
    start_date: '2026-06-07', end_date: '2026-08-30', weeks: 8,
    schedule: '토 09:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 180000, material_fee: 20000, content_fee: 10000, enrolled_count: 5, room: '1강의실',
  },
  {
    id: 'cl-02', campus_id: 'campus-001', class_group_id: 'cg-02',
    course: '파이썬 기초', subject_id: 'sub-python', name: '2026여름학기토1000/파이썬기초/씨드',
    teacher: '씨드', teacher_id: 'tch-seed', team_lead: '케이', capacity: 8,
    start_date: '2026-06-07', end_date: '2026-08-30', weeks: 8,
    schedule: '토 10:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 180000, material_fee: 20000, content_fee: 10000, enrolled_count: 5, room: '2강의실',
  },
  {
    id: 'cl-03', campus_id: 'campus-001', class_group_id: 'cg-03',
    course: '맞춤수업', subject_id: 'sub-custom', name: '2026여름학기토1100/맞춤수업/루스',
    teacher: '루스', teacher_id: 'tch-ruth', team_lead: '케이', capacity: 8,
    start_date: '2026-06-07', end_date: '2026-08-30', weeks: 8,
    schedule: '토 11:00', payment_method: '일시', payment_due_day: 1,
    tuition_fee: 220000, material_fee: 30000, content_fee: 0, enrolled_count: 5, room: '4강의실',
  },
  {
    id: 'cl-04', campus_id: 'campus-001', class_group_id: 'cg-04',
    course: '파이썬 기초', subject_id: 'sub-python', name: '2026여름학기화목1600/파이썬기초/리암',
    teacher: '리암', teacher_id: 'tch-liam', team_lead: '케이', capacity: 8,
    start_date: '2026-06-10', end_date: '2026-09-01', weeks: 8,
    schedule: '화·목 16:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 180000, material_fee: 20000, content_fee: 10000, enrolled_count: 5, room: '5강의실',
  },
  {
    id: 'cl-05', campus_id: 'campus-001', class_group_id: 'cg-05',
    course: '맞춤수업', subject_id: 'sub-custom', name: '2026여름학기화목1700/맞춤수업/허빈',
    teacher: '허빈', teacher_id: 'tch-hobin', team_lead: '케이', capacity: 8,
    start_date: '2026-06-10', end_date: '2026-09-01', weeks: 8,
    schedule: '화·목 17:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 220000, material_fee: 30000, content_fee: 0, enrolled_count: 5, room: '6강의실',
  },
  {
    id: 'cl-06', campus_id: 'campus-001', class_group_id: 'cg-06',
    course: '아두이노', subject_id: 'sub-arduino', name: '2026여름학기화목1800/아두이노/씨드',
    teacher: '씨드', teacher_id: 'tch-seed', team_lead: '케이', capacity: 8,
    start_date: '2026-06-10', end_date: '2026-09-01', weeks: 8,
    schedule: '화·목 18:00', payment_method: '일시', payment_due_day: 1,
    tuition_fee: 200000, material_fee: 50000, content_fee: 30000, enrolled_count: 4, room: '7강의실',
  },
  // 토 10:00 동시간대 2개 반 (한 칸 누적 표시 예시) — cg-09
  {
    id: 'cl-09', campus_id: 'campus-001', class_group_id: 'cg-09',
    course: '아두이노', subject_id: 'sub-arduino', name: '2026여름학기토1000/아두이노/허빈',
    teacher: '허빈', teacher_id: 'tch-hobin', team_lead: '케이', capacity: 8,
    start_date: '2026-06-07', end_date: '2026-08-30', weeks: 8,
    schedule: '토 10:00', payment_method: '일시', payment_due_day: 1,
    tuition_fee: 200000, material_fee: 50000, content_fee: 30000, enrolled_count: 4, room: '3강의실',
  },
  // ── 2025 봄 (종강) — 과거 수강 이력용 ──
  {
    id: 'cl-07', campus_id: 'campus-001', class_group_id: 'cg-07', semester_id: 'sem-02',
    course: '파이썬 기초', subject_id: 'sub-python', name: '2025봄학기토0900/파이썬기초/씨드',
    teacher: '씨드', teacher_id: 'tch-seed', team_lead: '케이', capacity: 15,
    start_date: '2025-03-08', end_date: '2025-06-28', weeks: 16,
    schedule: '토 09:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 180000, material_fee: 20000, content_fee: 10000, enrolled_count: 0,
  },
  {
    id: 'cl-08', campus_id: 'campus-001', class_group_id: 'cg-08', semester_id: 'sem-02',
    course: '맞춤수업', subject_id: 'sub-custom', name: '2025봄학기토1000/맞춤수업/루스',
    teacher: '루스', teacher_id: 'tch-ruth', team_lead: '케이', capacity: 15,
    start_date: '2025-03-08', end_date: '2025-06-28', weeks: 16,
    schedule: '토 10:00', payment_method: '매월', payment_due_day: 1,
    tuition_fee: 180000, material_fee: 20000, content_fee: 10000, enrolled_count: 0,
  },
];

// ── 변동 세션 예시 (2026-07-06 ~ 07-11 주) ──────────────────────
// 정규 세션은 generateRegularSessions가 자동 생성하므로 여기엔 예외만 둔다.
export const sessions: Session[] = [
  // 화 16:00 파이썬(cl-04) 휴강
  { id: 'ses-01', class_id: 'cl-04', date: '2026-07-07', start_time: '1600', type: '휴강', memo: '강사 출장' },
  // 토 15:00 파이썬(cl-04) 보강 — 위 휴강 대체
  { id: 'ses-02', class_id: 'cl-04', date: '2026-07-11', start_time: '1500', type: '보강', replaces_session_id: 'ses-01', memo: '7/7 휴강 보강' },
  // 토 13:00 맞춤수업(cl-03) 특강
  { id: 'ses-03', class_id: 'cl-03', date: '2026-07-11', start_time: '1300', type: '특강', memo: '여름 특강' },
];

// 결석 보강 일정 등록(데모) — 보강 세션을 일정에 추가하고 그 세션을 반환.
// start_time은 'HHMM' (Session 규약). 'HH:MM' 입력도 허용해 정규화한다.
export function addMakeupSession(classId: string, date: string, startTime: string, memo: string): Session {
  const hhmm = startTime.replace(':', '').padStart(4, '0').slice(0, 4);
  const s: Session = {
    id: `ses-mk-${classId}-${date}-${sessions.length + 1}`,
    class_id: classId,
    date,
    start_time: hhmm,
    type: '보강',
    memo,
  };
  sessions.push(s);
  return s;
}

// ── 학생 ──────────────────────────────────────────────────────
export interface Student {
  id: string;
  campus_id: string;
  name: string;
  grade: string;
  school: string;
  parent_phone: string;        // 부모 연락처(모) — 키오스크 인증 키
  student_phone: string;       // 원생 HP
  status: StudentStatus;
  first_enrolled_at: string;
  source: string;              // 유입경로
  points: number;              // 누적 포인트 (레벨·랭킹용)
  class_id: string;
  streak: number;
  title: string;
  balance?: number;            // 사용 가능 포인트 (상점 차감 대상) — 없으면 points에서 파생
  // ── 레거시 원생 자료 보강 필드 (옵셔널) ──
  gender?: '남' | '여';        // 성별
  division?: string;           // 학부 (유치부/초등부/중등부)
  father_phone?: string;       // 부모 연락처(부)
  other_guardian_phone?: string;    // 그 외 보호자 연락처
  other_guardian_relation?: string; // 그 외 보호자 관계 (조부모 등)
  school_type?: string;        // 학교구분 (특성)
  special_note?: string;       // 특이사항 (특성)
  memo?: string;               // 메모
  sibling_ids?: string[];      // 재원형제
  virtual_account?: string;    // 가상계좌
  scholarship_type?: string;   // 장학유형
  // ── 현금영수증 발행정보 (원생별 고정 참조값) ──
  cash_receipt_enabled?: boolean;                       // 발행 / 미발행
  cash_receipt_purpose?: '소득공제용' | '지출증빙용';   // 용도 (발행 시)
  cash_receipt_number?: string;                         // 발행 대상 번호 (휴대폰·사업자번호 등)
}

export interface Guardian {
  id: string;
  student_id: string;
  relation: '모' | '부';
  name: string;
  phone: string;
}

const SOURCES = ['지인소개', '인스타그램', '블로그', '학교안내', '현수막', '네이버카페'];
const GRADES = ['초3', '초4', '초5', '초6', '중1', '중2', '중3'];
const SCHOOLS = ['강남초', '대치초', '수서초', '개포초', '역삼초', '개원초', '도곡초'];
const TITLES = ['초보 코더', '성실한 예비 모험가', '열정 코더', '스트릭 마스터', '꾸준한 학습자', '출석왕', ''];

function makePhone(last4: string) { return `010-${last4.slice(0, 4)}-${last4.slice(0, 4)}`; }

// 78명 학생 데이터
export const students: Student[] = [
  // ── 토 09:00반 (cl-01) 14명 ──
  { id: 's-01', campus_id: 'campus-001', name: '김민준', grade: '초5', school: '강남초', parent_phone: '010-1234-5678', student_phone: '010-9876-5432', status: '재원', first_enrolled_at: '2025-01-10', source: '지인소개', points: 1240, class_id: 'cl-01', streak: 12, title: '스트릭 마스터', cash_receipt_enabled: true, cash_receipt_purpose: '소득공제용', cash_receipt_number: '010-1234-5678' },
  { id: 's-02', campus_id: 'campus-001', name: '이서연', grade: '초6', school: '대치초', parent_phone: '010-2345-6789', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '인스타그램', points: 980, class_id: 'cl-01', streak: 8, title: '성실한 예비 모험가', cash_receipt_enabled: true, cash_receipt_purpose: '지출증빙용', cash_receipt_number: '123-45-67890' },
  { id: 's-03', campus_id: 'campus-001', name: '박지호', grade: '초4', school: '수서초', parent_phone: '010-3456-7890', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '블로그', points: 540, class_id: 'cl-01', streak: 3, title: '꾸준한 학습자' },
  { id: 's-04', campus_id: 'campus-001', name: '최수아', grade: '초5', school: '강남초', parent_phone: '010-4567-8901', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '학교안내', points: 820, class_id: 'cl-01', streak: 6, title: '열정 코더' },
  { id: 's-05', campus_id: 'campus-001', name: '정도현', grade: '초6', school: '개포초', parent_phone: '010-5678-9012', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '현수막', points: 1560, class_id: 'cl-01', streak: 15, title: '출석왕' },
  { id: 's-06', campus_id: 'campus-001', name: '한지은', grade: '초4', school: '역삼초', parent_phone: '010-6789-0123', student_phone: '', status: '재원', first_enrolled_at: '2026-03-05', source: '지인소개', points: 320, class_id: 'cl-01', streak: 2, title: '초보 코더' },
  { id: 's-07', campus_id: 'campus-001', name: '오준서', grade: '초5', school: '개원초', parent_phone: '010-7890-1234', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '인스타그램', points: 700, class_id: 'cl-01', streak: 5, title: '꾸준한 학습자' },
  { id: 's-08', campus_id: 'campus-001', name: '윤채원', grade: '초6', school: '도곡초', parent_phone: '010-8901-2345', student_phone: '', status: '재원', first_enrolled_at: '2025-01-10', source: '블로그', points: 1100, class_id: 'cl-01', streak: 9, title: '성실한 예비 모험가' },
  { id: 's-09', campus_id: 'campus-001', name: '임선우', grade: '초3', school: '강남초', parent_phone: '010-9012-3456', student_phone: '', status: '재원', first_enrolled_at: '2026-07-01', source: '지인소개', points: 80, class_id: 'cl-01', streak: 1, title: '초보 코더' },
  { id: 's-10', campus_id: 'campus-001', name: '장하은', grade: '초5', school: '대치초', parent_phone: '010-0123-4567', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '네이버카페', points: 960, class_id: 'cl-01', streak: 7, title: '열정 코더' },
  { id: 's-11', campus_id: 'campus-001', name: '신지훈', grade: '초4', school: '수서초', parent_phone: '010-1357-2468', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '학교안내', points: 640, class_id: 'cl-01', streak: 4, title: '꾸준한 학습자' },
  { id: 's-12', campus_id: 'campus-001', name: '권나윤', grade: '초6', school: '강남초', parent_phone: '010-2468-1357', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '현수막', points: 460, class_id: 'cl-01', streak: 3, title: '초보 코더' },
  { id: 's-13', campus_id: 'campus-001', name: '황시우', grade: '초5', school: '개포초', parent_phone: '010-3579-2468', student_phone: '', status: '재원', first_enrolled_at: '2025-01-10', source: '지인소개', points: 1380, class_id: 'cl-01', streak: 11, title: '스트릭 마스터' },
  { id: 's-14', campus_id: 'campus-001', name: '안소율', grade: '초4', school: '역삼초', parent_phone: '010-4680-3579', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '인스타그램', points: 760, class_id: 'cl-01', streak: 6, title: '열정 코더' },

  // ── 토 10:00반 (cl-02) 15명 ──
  { id: 's-15', campus_id: 'campus-001', name: '류준혁', grade: '중1', school: '개원중', parent_phone: '010-5791-4680', student_phone: '010-5791-0001', status: '재원', first_enrolled_at: '2025-01-10', source: '블로그', points: 1620, class_id: 'cl-02', streak: 14, title: '출석왕' },
  { id: 's-16', campus_id: 'campus-001', name: '서민아', grade: '초6', school: '도곡초', parent_phone: '010-6802-5791', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '지인소개', points: 880, class_id: 'cl-02', streak: 7, title: '성실한 예비 모험가' },
  { id: 's-17', campus_id: 'campus-001', name: '고유준', grade: '초5', school: '대치초', parent_phone: '010-7913-6802', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '네이버카페', points: 420, class_id: 'cl-02', streak: 3, title: '초보 코더' },
  { id: 's-18', campus_id: 'campus-001', name: '문서아', grade: '초4', school: '강남초', parent_phone: '010-8024-7913', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '학교안내', points: 1040, class_id: 'cl-02', streak: 9, title: '성실한 예비 모험가' },
  { id: 's-19', campus_id: 'campus-001', name: '남도윤', grade: '중1', school: '대치중', parent_phone: '010-9135-8024', student_phone: '010-9135-0002', status: '재원', first_enrolled_at: '2025-07-20', source: '현수막', points: 780, class_id: 'cl-02', streak: 5, title: '꾸준한 학습자' },
  { id: 's-20', campus_id: 'campus-001', name: '변지아', grade: '초5', school: '수서초', parent_phone: '010-0246-9135', student_phone: '', status: '재원', first_enrolled_at: '2026-03-05', source: '인스타그램', points: 280, class_id: 'cl-02', streak: 2, title: '초보 코더' },
  { id: 's-21', campus_id: 'campus-001', name: '노현우', grade: '초6', school: '개포초', parent_phone: '010-1357-0246', student_phone: '', status: '재원', first_enrolled_at: '2025-01-10', source: '지인소개', points: 1200, class_id: 'cl-02', streak: 10, title: '스트릭 마스터' },
  { id: 's-22', campus_id: 'campus-001', name: '하유나', grade: '초4', school: '역삼초', parent_phone: '010-2468-1357', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '블로그', points: 860, class_id: 'cl-02', streak: 7, title: '열정 코더' },
  { id: 's-23', campus_id: 'campus-001', name: '배선호', grade: '초5', school: '도곡초', parent_phone: '010-3579-2468', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '네이버카페', points: 640, class_id: 'cl-02', streak: 5, title: '꾸준한 학습자' },
  { id: 's-24', campus_id: 'campus-001', name: '전수빈', grade: '초6', school: '강남초', parent_phone: '010-4680-3579', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '학교안내', points: 340, class_id: 'cl-02', streak: 2, title: '초보 코더' },
  { id: 's-25', campus_id: 'campus-001', name: '조민성', grade: '중1', school: '역삼중', parent_phone: '010-5791-4680', student_phone: '010-5791-0003', status: '재원', first_enrolled_at: '2025-01-10', source: '현수막', points: 1460, class_id: 'cl-02', streak: 13, title: '출석왕' },
  { id: 's-26', campus_id: 'campus-001', name: '진하율', grade: '초5', school: '대치초', parent_phone: '010-6802-5791', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '인스타그램', points: 920, class_id: 'cl-09', streak: 8, title: '성실한 예비 모험가' },
  { id: 's-27', campus_id: 'campus-001', name: '소지원', grade: '초4', school: '수서초', parent_phone: '010-7913-6802', student_phone: '', status: '재원', first_enrolled_at: '2026-03-05', source: '지인소개', points: 180, class_id: 'cl-09', streak: 1, title: '초보 코더' },
  { id: 's-28', campus_id: 'campus-001', name: '마준우', grade: '초6', school: '개원초', parent_phone: '010-8024-7913', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '블로그', points: 1000, class_id: 'cl-09', streak: 8, title: '열정 코더' },
  { id: 's-29', campus_id: 'campus-001', name: '가나영', grade: '초5', school: '강남초', parent_phone: '010-9135-8024', student_phone: '', status: '재원', first_enrolled_at: '2025-01-10', source: '네이버카페', points: 1180, class_id: 'cl-09', streak: 10, title: '스트릭 마스터' },

  // ── 토 11:00반 맞춤 (cl-03) 11명 ──
  { id: 's-30', campus_id: 'campus-001', name: '도하린', grade: '중2', school: '대치중', parent_phone: '010-0246-9135', student_phone: '010-0246-0004', status: '재원', first_enrolled_at: '2024-07-15', source: '지인소개', points: 2100, class_id: 'cl-03', streak: 18, title: '출석왕' },
  { id: 's-31', campus_id: 'campus-001', name: '라지후', grade: '중1', school: '개원중', parent_phone: '010-1357-0246', student_phone: '010-1357-0005', status: '재원', first_enrolled_at: '2025-01-10', source: '학교안내', points: 1340, class_id: 'cl-03', streak: 11, title: '스트릭 마스터' },
  { id: 's-32', campus_id: 'campus-001', name: '명서진', grade: '초6', school: '수서초', parent_phone: '010-2468-1357', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '현수막', points: 760, class_id: 'cl-03', streak: 6, title: '열정 코더' },
  { id: 's-33', campus_id: 'campus-001', name: '온유빈', grade: '초5', school: '강남초', parent_phone: '010-3579-2468', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '인스타그램', points: 500, class_id: 'cl-03', streak: 4, title: '꾸준한 학습자' },
  { id: 's-34', campus_id: 'campus-001', name: '주현서', grade: '중2', school: '역삼중', parent_phone: '010-4680-3579', student_phone: '010-4680-0006', status: '재원', first_enrolled_at: '2024-07-15', source: '블로그', points: 1900, class_id: 'cl-03', streak: 16, title: '출석왕' },
  { id: 's-35', campus_id: 'campus-001', name: '채나경', grade: '초4', school: '개포초', parent_phone: '010-5791-4680', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '지인소개', points: 840, class_id: 'cl-03', streak: 7, title: '성실한 예비 모험가' },
  { id: 's-36', campus_id: 'campus-001', name: '편지원', grade: '초6', school: '역삼초', parent_phone: '010-6802-5791', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '네이버카페', points: 620, class_id: 'cl-03', streak: 5, title: '꾸준한 학습자' },
  { id: 's-37', campus_id: 'campus-001', name: '허승민', grade: '초5', school: '도곡초', parent_phone: '010-7913-6802', student_phone: '', status: '재원', first_enrolled_at: '2026-03-05', source: '학교안내', points: 260, class_id: 'cl-03', streak: 2, title: '초보 코더' },
  { id: 's-38', campus_id: 'campus-001', name: '홍다인', grade: '중1', school: '대치중', parent_phone: '010-8024-7913', student_phone: '010-8024-0007', status: '재원', first_enrolled_at: '2025-01-10', source: '현수막', points: 1080, class_id: 'cl-03', streak: 9, title: '열정 코더' },
  { id: 's-39', campus_id: 'campus-001', name: '강시온', grade: '초4', school: '강남초', parent_phone: '010-9135-8024', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '인스타그램', points: 440, class_id: 'cl-03', streak: 3, title: '초보 코더' },
  { id: 's-40', campus_id: 'campus-001', name: '고은솔', grade: '초5', school: '수서초', parent_phone: '010-0246-9135', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '지인소개', points: 380, class_id: 'cl-03', streak: 3, title: '초보 코더' },

  // ── 화목 16:00반 (cl-04) 18명 ──
  { id: 's-41', campus_id: 'campus-001', name: '기도원', grade: '중2', school: '개원중', parent_phone: '010-1111-2222', student_phone: '010-1111-0008', status: '재원', first_enrolled_at: '2024-07-15', source: '지인소개', points: 2400, class_id: 'cl-04', streak: 20, title: '출석왕' },
  { id: 's-42', campus_id: 'campus-001', name: '나하준', grade: '초6', school: '대치초', parent_phone: '010-2222-3333', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '블로그', points: 960, class_id: 'cl-04', streak: 8, title: '열정 코더' },
  { id: 's-43', campus_id: 'campus-001', name: '다온유', grade: '초5', school: '강남초', parent_phone: '010-3333-4444', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '네이버카페', points: 720, class_id: 'cl-04', streak: 6, title: '꾸준한 학습자' },
  { id: 's-44', campus_id: 'campus-001', name: '라하린', grade: '초4', school: '수서초', parent_phone: '010-4444-5555', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '인스타그램', points: 480, class_id: 'cl-04', streak: 4, title: '꾸준한 학습자' },
  { id: 's-45', campus_id: 'campus-001', name: '마지훈', grade: '중1', school: '역삼중', parent_phone: '010-5555-6666', student_phone: '010-5555-0009', status: '재원', first_enrolled_at: '2025-01-10', source: '학교안내', points: 1280, class_id: 'cl-04', streak: 11, title: '스트릭 마스터' },
  { id: 's-46', campus_id: 'campus-001', name: '바다솔', grade: '초6', school: '개포초', parent_phone: '010-6666-7777', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '현수막', points: 800, class_id: 'cl-04', streak: 7, title: '성실한 예비 모험가' },
  { id: 's-47', campus_id: 'campus-001', name: '사연우', grade: '초5', school: '역삼초', parent_phone: '010-7777-8888', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '지인소개', points: 580, class_id: 'cl-04', streak: 5, title: '꾸준한 학습자' },
  { id: 's-48', campus_id: 'campus-001', name: '아진서', grade: '초4', school: '도곡초', parent_phone: '010-8888-9999', student_phone: '', status: '재원', first_enrolled_at: '2026-03-05', source: '블로그', points: 200, class_id: 'cl-04', streak: 1, title: '초보 코더' },
  { id: 's-49', campus_id: 'campus-001', name: '자윤호', grade: '초6', school: '강남초', parent_phone: '010-9999-0000', student_phone: '', status: '재원', first_enrolled_at: '2025-01-10', source: '인스타그램', points: 1140, class_id: 'cl-04', streak: 9, title: '성실한 예비 모험가' },
  { id: 's-50', campus_id: 'campus-001', name: '차세빈', grade: '중1', school: '대치중', parent_phone: '010-1212-3434', student_phone: '010-1212-0010', status: '재원', first_enrolled_at: '2024-07-15', source: '네이버카페', points: 1860, class_id: 'cl-04', streak: 16, title: '출석왕' },
  { id: 's-51', campus_id: 'campus-001', name: '카루아', grade: '초5', school: '수서초', parent_phone: '010-2323-4545', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '학교안내', points: 660, class_id: 'cl-04', streak: 5, title: '꾸준한 학습자' },
  { id: 's-52', campus_id: 'campus-001', name: '타이준', grade: '초4', school: '개원초', parent_phone: '010-3434-5656', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '현수막', points: 400, class_id: 'cl-04', streak: 3, title: '초보 코더' },
  { id: 's-53', campus_id: 'campus-001', name: '파리현', grade: '중2', school: '역삼중', parent_phone: '010-4545-6767', student_phone: '010-4545-0011', status: '재원', first_enrolled_at: '2024-07-15', source: '지인소개', points: 2200, class_id: 'cl-04', streak: 18, title: '출석왕' },
  { id: 's-54', campus_id: 'campus-001', name: '하승아', grade: '초6', school: '강남초', parent_phone: '010-5656-7878', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '블로그', points: 1020, class_id: 'cl-04', streak: 8, title: '열정 코더' },
  { id: 's-55', campus_id: 'campus-001', name: '갈도현', grade: '초5', school: '대치초', parent_phone: '010-6767-8989', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '인스타그램', points: 720, class_id: 'cl-04', streak: 6, title: '성실한 예비 모험가' },
  { id: 's-56', campus_id: 'campus-001', name: '걸리나', grade: '초4', school: '개포초', parent_phone: '010-7878-9090', student_phone: '', status: '재원', first_enrolled_at: '2026-03-05', source: '네이버카페', points: 300, class_id: 'cl-04', streak: 2, title: '초보 코더' },
  { id: 's-57', campus_id: 'campus-001', name: '경지민', grade: '초6', school: '역삼초', parent_phone: '010-8989-0101', student_phone: '', status: '재원', first_enrolled_at: '2025-01-10', source: '학교안내', points: 1060, class_id: 'cl-04', streak: 9, title: '열정 코더' },
  { id: 's-58', campus_id: 'campus-001', name: '계한솔', grade: '중1', school: '개원중', parent_phone: '010-9090-1212', student_phone: '010-9090-0012', status: '재원', first_enrolled_at: '2025-03-02', source: '현수막', points: 940, class_id: 'cl-04', streak: 7, title: '성실한 예비 모험가' },

  // ── 화목 17:00반 맞춤 (cl-05) 16명 ──
  { id: 's-59', campus_id: 'campus-001', name: '고영서', grade: '중3', school: '대치중', parent_phone: '010-1122-3344', student_phone: '010-1122-0013', status: '재원', first_enrolled_at: '2023-07-10', source: '지인소개', points: 3200, class_id: 'cl-05', streak: 25, title: '출석왕' },
  { id: 's-60', campus_id: 'campus-001', name: '곤우리', grade: '중2', school: '역삼중', parent_phone: '010-2233-4455', student_phone: '010-2233-0014', status: '재원', first_enrolled_at: '2024-07-15', source: '블로그', points: 1980, class_id: 'cl-05', streak: 17, title: '출석왕' },
  { id: 's-61', campus_id: 'campus-001', name: '공하은', grade: '초6', school: '강남초', parent_phone: '010-3344-5566', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '인스타그램', points: 840, class_id: 'cl-05', streak: 7, title: '열정 코더' },
  { id: 's-62', campus_id: 'campus-001', name: '곽민재', grade: '초5', school: '수서초', parent_phone: '010-4455-6677', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '네이버카페', points: 520, class_id: 'cl-05', streak: 4, title: '꾸준한 학습자' },
  { id: 's-63', campus_id: 'campus-001', name: '구서영', grade: '중1', school: '개원중', parent_phone: '010-5566-7788', student_phone: '010-5566-0015', status: '재원', first_enrolled_at: '2025-01-10', source: '학교안내', points: 1420, class_id: 'cl-05', streak: 12, title: '스트릭 마스터' },
  { id: 's-64', campus_id: 'campus-001', name: '국하린', grade: '초4', school: '대치초', parent_phone: '010-6677-8899', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '현수막', points: 860, class_id: 'cl-05', streak: 7, title: '성실한 예비 모험가' },
  { id: 's-65', campus_id: 'campus-001', name: '군시온', grade: '중2', school: '역삼중', parent_phone: '010-7788-9900', student_phone: '010-7788-0016', status: '재원', first_enrolled_at: '2024-07-15', source: '지인소개', points: 1740, class_id: 'cl-05', streak: 15, title: '출석왕' },
  { id: 's-66', campus_id: 'campus-001', name: '귀준서', grade: '초6', school: '개포초', parent_phone: '010-8899-0011', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '블로그', points: 700, class_id: 'cl-05', streak: 6, title: '꾸준한 학습자' },
  { id: 's-67', campus_id: 'campus-001', name: '균도현', grade: '초5', school: '역삼초', parent_phone: '010-9900-1122', student_phone: '', status: '재원', first_enrolled_at: '2026-03-05', source: '인스타그램', points: 240, class_id: 'cl-05', streak: 2, title: '초보 코더' },
  { id: 's-68', campus_id: 'campus-001', name: '극서진', grade: '중1', school: '도곡초', parent_phone: '010-0011-2233', student_phone: '010-0011-0017', status: '재원', first_enrolled_at: '2025-01-10', source: '네이버카페', points: 1100, class_id: 'cl-05', streak: 9, title: '열정 코더' },
  { id: 's-69', campus_id: 'campus-001', name: '근승아', grade: '초4', school: '강남초', parent_phone: '010-1234-5670', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '학교안내', points: 600, class_id: 'cl-05', streak: 5, title: '꾸준한 학습자' },
  { id: 's-70', campus_id: 'campus-001', name: '기준혁', grade: '중3', school: '대치중', parent_phone: '010-2345-6781', student_phone: '010-2345-0018', status: '재원', first_enrolled_at: '2023-07-10', source: '지인소개', points: 2800, class_id: 'cl-05', streak: 22, title: '출석왕' },
  { id: 's-71', campus_id: 'campus-001', name: '길나영', grade: '초6', school: '수서초', parent_phone: '010-3456-7892', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '현수막', points: 920, class_id: 'cl-05', streak: 8, title: '열정 코더' },
  { id: 's-72', campus_id: 'campus-001', name: '김도율', grade: '초5', school: '개포초', parent_phone: '010-4567-8903', student_phone: '', status: '재원', first_enrolled_at: '2026-01-15', source: '블로그', points: 460, class_id: 'cl-05', streak: 3, title: '초보 코더' },
  { id: 's-73', campus_id: 'campus-001', name: '김서현', grade: '중2', school: '역삼중', parent_phone: '010-5678-9014', student_phone: '010-5678-0019', status: '재원', first_enrolled_at: '2024-07-15', source: '인스타그램', points: 1660, class_id: 'cl-05', streak: 14, title: '스트릭 마스터' },
  { id: 's-74', campus_id: 'campus-001', name: '김예준', grade: '초4', school: '도곡초', parent_phone: '010-6789-0125', student_phone: '', status: '재원', first_enrolled_at: '2025-07-20', source: '네이버카페', points: 560, class_id: 'cl-05', streak: 4, title: '꾸준한 학습자' },

  // ── 화목 18:00 아두이노반 (cl-06) 4명 ──
  { id: 's-75', campus_id: 'campus-001', name: '김찬호', grade: '중2', school: '대치중', parent_phone: '010-7890-1236', student_phone: '010-7890-0020', status: '재원', first_enrolled_at: '2024-07-15', source: '지인소개', points: 1520, class_id: 'cl-06', streak: 13, title: '스트릭 마스터' },
  { id: 's-76', campus_id: 'campus-001', name: '김하율', grade: '중1', school: '개원중', parent_phone: '010-8901-2347', student_phone: '010-8901-0021', status: '재원', first_enrolled_at: '2025-07-20', source: '블로그', points: 780, class_id: 'cl-06', streak: 6, title: '성실한 예비 모험가' },
  { id: 's-77', campus_id: 'campus-001', name: '나도윤', grade: '중2', school: '역삼중', parent_phone: '010-9012-3458', student_phone: '010-9012-0022', status: '재원', first_enrolled_at: '2024-07-15', source: '현수막', points: 1380, class_id: 'cl-06', streak: 11, title: '스트릭 마스터' },
  { id: 's-78', campus_id: 'campus-001', name: '나서윤', grade: '초6', school: '강남초', parent_phone: '010-0123-4569', student_phone: '', status: '재원', first_enrolled_at: '2025-03-02', source: '인스타그램', points: 820, class_id: 'cl-06', streak: 7, title: '열정 코더' },
];

// 상세 패널 표시용 보강 샘플 (가상계좌·장학·형제)
const _paymentDemoAugment: Record<string, Partial<Student>> = {
  's-06': { virtual_account: '1002-756-123456', scholarship_type: '형제할인', sibling_ids: ['s-07'] },
  's-07': { sibling_ids: ['s-06'] },
  's-02': { virtual_account: '1002-756-654321' },
};
students.forEach(s => Object.assign(s, _paymentDemoAugment[s.id]));

// ── 레거시 보강 필드 채우기 (학부·부 연락처·특성·재원형제) ──
function deriveDivision(grade: string): string {
  if (grade.startsWith('초')) return '초등부';
  if (grade.startsWith('중')) return '중등부';
  if (grade.startsWith('고')) return '고등부';
  return '유치부';
}
// 재원형제 그룹 (데모용)
const SIBLING_GROUPS: string[][] = [['s-03', 's-11'], ['s-21', 's-29'], ['s-41', 's-50']];
// 특이사항·메모 (일부 학생)
const STUDENT_NOTES: Record<string, { special_note?: string; memo?: string }> = {
  's-01': { special_note: '견과류 알레르기', memo: '하원 시 차량 이용' },
  's-09': { memo: '신규 입학 · 적응 관찰 필요' },
  's-30': { special_note: '리더십 우수' },
  's-41': { memo: '형제 동시 수강 (할인 적용)' },
};

students.forEach((s, i) => {
  s.gender = i % 2 === 0 ? '남' : '여';
  s.division = deriveDivision(s.grade);
  // 부모 연락처(부): 약 1/3 학생만 등록 (나머지는 모 연락처만)
  if (i % 3 === 0) s.father_phone = s.parent_phone.replace(/\d{4}$/, String(2000 + i).slice(-4));
  s.school_type = i % 7 === 0 ? '국제' : i % 11 === 0 ? '특목' : '일반';
});
// 그 외 보호자(조부모 등) 연락처 데모
const og = students.find(st => st.id === 's-09');
if (og) { og.other_guardian_phone = '010-3210-9876'; og.other_guardian_relation = '외조모'; }
Object.entries(STUDENT_NOTES).forEach(([id, note]) => {
  const s = students.find(st => st.id === id);
  if (s) Object.assign(s, note);
});
SIBLING_GROUPS.forEach(group => {
  group.forEach(id => {
    const s = students.find(st => st.id === id);
    if (s) s.sibling_ids = group.filter(g => g !== id);
  });
});

// 수강이력 조회용 퇴원 학생 (원생 상세 탭에서 복원 이력 시연용)
export const withdrawnStudents: Student[] = [
  { id: 's-ex1', campus_id: 'campus-001', name: '이지호', grade: '중3', school: '대치중', parent_phone: '010-1111-9999', student_phone: '010-1111-9999', status: '퇴원', first_enrolled_at: '2023-01-10', source: '지인소개', points: 0, class_id: '', streak: 0, title: '', division: '중등부' },
];

// ── 보호자 ────────────────────────────────────────────────────
export const guardians: Guardian[] = students.map((s, i) => ({
  id: `g-${s.id}`,
  student_id: s.id,
  relation: i % 3 === 0 ? '부' : '모',
  name: `${s.name.slice(0, 1)}부모`,
  phone: s.parent_phone,
}));

// ── 데모 배포용 개인정보 마스킹 ──────────────────────────────────
// 팀 시연 시 실제 개인정보로 오인되지 않도록 모든 전화번호를 더미 번호로 통일.
// (값이 있는 번호만 덮어쓰고, 미등록(빈 값)은 그대로 둔다)
// 키오스크 인증 코드: 마스킹으로 전화번호가 통일되기 전, 원본 뒤 4자리를 보존한다.
// (시연용 학생 식별자 — 마스킹은 그대로 두고 키오스크 매칭만 이 코드로 수행)
export const kioskCodes: Record<string, string> = Object.fromEntries(
  students.map(s => [s.id, s.parent_phone.replace(/\D/g, '').slice(-4)]),
);

const DEMO_PHONE = '010-1234-5678';
[...students, ...withdrawnStudents].forEach(s => {
  s.parent_phone = DEMO_PHONE;
  if (s.student_phone) s.student_phone = DEMO_PHONE;
  if (s.father_phone) s.father_phone = DEMO_PHONE;
  if (s.other_guardian_phone) s.other_guardian_phone = DEMO_PHONE;
});
guardians.forEach(g => { g.phone = DEMO_PHONE; });

// ── 수강 신청 ──────────────────────────────────────────────────
export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  started_at: string;
  ended_at: string | null;
  end_reason: string | null;
}

// 등록시작일(입반일)은 최초입학일과 별개.
// 2025년 이전 입학생은 현재 학기(2026 여름)에 재배정된 것으로 처리 → 두 날짜가 달라짐.
export const enrollments: Enrollment[] = [];
// 반 배치도 데모: 드래그 이동이 가능하도록 반별 활성 수강을 4~5명으로 제한.
// (정원 초과분은 종료 이력으로 남겨 보드/수강명단에서는 제외 — 인보이스/원생 데이터는 보존)
const BOARD_ACTIVE_CAP = 5;
const activeByClass: Record<string, number> = {};
students.forEach(s => {
  const firstYear = Number(s.first_enrolled_at.slice(0, 4));
  const currentStart = firstYear < 2025 ? '2026-03-02' : s.first_enrolled_at;
  // 재배정 학생은 과거(종료된) 수강 이력을 남긴다
  if (currentStart !== s.first_enrolled_at) {
    enrollments.push({
      id: `enr-${s.id}-prev`,
      student_id: s.id,
      class_id: 'cl-07',   // 2025 봄 (종강) — 과거 수강 이력
      started_at: s.first_enrolled_at,
      ended_at: '2025-06-28',
      end_reason: '학기 종료',
    });
  }
  const used = activeByClass[s.class_id] ?? 0;
  const overCap = used >= BOARD_ACTIVE_CAP;
  enrollments.push({
    id: `enr-${s.id}`,
    student_id: s.id,
    class_id: s.class_id,
    started_at: currentStart,
    ended_at: overCap ? '2026-04-30' : null,
    end_reason: overCap ? '반 정원 조정' : null,
  });
  if (!overCap) activeByClass[s.class_id] = used + 1;
});

// 종강반(2025 봄 맞춤수업 cl-08) 과거 수강 이력 — 재배정 학생 일부 (cl-07과 분산 배정)
students.forEach(s => {
  if (Number(s.first_enrolled_at.slice(0, 4)) < 2025 && hashString(s.id) % 2 === 0) {
    enrollments.push({
      id: `enr-${s.id}-prev2`, student_id: s.id, class_id: 'cl-08',
      started_at: s.first_enrolled_at, ended_at: '2025-06-28', end_reason: '학기 종료',
    });
  }
});

// 현재 학기 추가 수강반(2026 여름 토1000 아두이노 cl-09) — 현재 학생 일부가 복수 수강
students.forEach(s => {
  if (hashString(s.id) % 7 === 0) {
    enrollments.push({
      id: `enr-${s.id}-c09`, student_id: s.id, class_id: 'cl-09',
      started_at: '2026-06-07', ended_at: null, end_reason: null,
    });
  }
});

// ── 원생별 상담이력 ─────────────────────────────────────────
export type ConsultMethod = '전화' | '대면' | '문자·카톡' | '기타';

export interface Consultation {
  id: string;
  student_id: string;
  date: string;        // 상담일자 YYYY-MM-DD
  method: ConsultMethod;
  counselor: string;   // 상담자
  content: string;     // 상담내용
}

// 일부 학생 샘플 (빈 상태/채워진 상태 모두 확인용)
export const consultations: Consultation[] = [
  { id: 'cons-s-01-1', student_id: 's-01', date: '2026-03-12', method: '대면', counselor: '김지원', content: '신학기 학습 목표 상담. 알고리즘 심화에 관심 많음.' },
  { id: 'cons-s-01-2', student_id: 's-01', date: '2026-05-20', method: '전화', counselor: '김지원', content: '어머니와 진도 관련 통화. 다음 달 심화반 이동 희망.' },
  { id: 'cons-s-02-1', student_id: 's-02', date: '2026-04-03', method: '문자·카톡', counselor: '박서준', content: '결석 후속 안내. 보강 일정 카톡으로 공유함.' },
];

// 문자·상담 발송 기록(데모) — 보낸 문자를 상담이력에 남기고 그 기록을 반환.
export function logConsultation(
  studentId: string,
  content: string,
  date: string,
  method: ConsultMethod = '문자·카톡',
  counselor = '시스템',
): Consultation {
  const c: Consultation = {
    id: `cons-${studentId}-log-${consultations.length + 1}`,
    student_id: studentId,
    date,
    method,
    counselor,
    content,
  };
  consultations.push(c);
  return c;
}

// 학생의 현재(진행 중) 수강 등록 — 등록시작일 표시·필터용
export function getCurrentEnrollment(studentId: string) {
  const list = enrollments.filter(e => e.student_id === studentId);
  return list.find(e => e.ended_at === null) ?? list[list.length - 1];
}

// 학생의 모든 진행 중 수강 반 (복수 반)
export function getActiveEnrollments(studentId: string) {
  return enrollments.filter(e => e.student_id === studentId && e.ended_at === null);
}

// 반 명단 — 현재 배정 학생 우선, 없으면(종강반 등) 수강 이력(enrollments)으로 구성
export function getClassRoster(classId: string): Student[] {
  const current = students.filter(s => s.class_id === classId);
  if (current.length > 0) return current;
  const ids = new Set(enrollments.filter(e => e.class_id === classId).map(e => e.student_id));
  return students.filter(s => ids.has(s.id));
}

// ── 오늘 시범 회차 (시나리오 1 시연용) ────────────────────────
// 오늘 = 2026-06-14. 시연은 토 09:00반과 화목 16:00반을 중심으로.
export interface ClassSession {
  id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  session_no: number;
}

export const todaySessions: ClassSession[] = [
  { id: 'sess-01', class_id: 'cl-01', session_date: '2026-06-14', start_time: '09:00', session_no: 3 },
  { id: 'sess-02', class_id: 'cl-02', session_date: '2026-06-14', start_time: '10:00', session_no: 3 },
  { id: 'sess-03', class_id: 'cl-03', session_date: '2026-06-14', start_time: '11:00', session_no: 3 },
  { id: 'sess-04', class_id: 'cl-04', session_date: '2026-06-14', start_time: '16:00', session_no: 5 },
  { id: 'sess-05', class_id: 'cl-05', session_date: '2026-06-14', start_time: '17:00', session_no: 5 },
  { id: 'sess-06', class_id: 'cl-06', session_date: '2026-06-14', start_time: '18:00', session_no: 5 },
];

// ── 출결 (오늘 기준, 데모 초기 상태: 일부 출석·나머지 미도착) ──
export interface Attendance {
  id: string;
  session_id: string;
  enrollment_id: string;
  student_id: string;
  status: AttendanceStatus;
  checked_in_at: string | null;
  source: 'kiosk' | 'manual';
  absence_reason: string | null;
}

// cl-01 (09:00반) 초기 출석 상태 — 데모 시작 시 일부 출석 완료
export const initialAttendance: Attendance[] = [
  // 출석 (이미 체크인)
  { id: 'att-01', session_id: 'sess-01', enrollment_id: 'enr-s-01', student_id: 's-01', status: 'attend', checked_in_at: '2026-06-14T08:58:00', source: 'kiosk', absence_reason: null },
  { id: 'att-02', session_id: 'sess-01', enrollment_id: 'enr-s-02', student_id: 's-02', status: 'attend', checked_in_at: '2026-06-14T09:03:00', source: 'kiosk', absence_reason: null },
  { id: 'att-03', session_id: 'sess-01', enrollment_id: 'enr-s-05', student_id: 's-05', status: 'attend', checked_in_at: '2026-06-14T08:55:00', source: 'kiosk', absence_reason: null },
  // 미도착 (데모 중 순차 점등 대상)
  { id: 'att-04', session_id: 'sess-01', enrollment_id: 'enr-s-03', student_id: 's-03', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-05', session_id: 'sess-01', enrollment_id: 'enr-s-04', student_id: 's-04', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-06', session_id: 'sess-01', enrollment_id: 'enr-s-06', student_id: 's-06', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-07', session_id: 'sess-01', enrollment_id: 'enr-s-07', student_id: 's-07', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-08', session_id: 'sess-01', enrollment_id: 'enr-s-08', student_id: 's-08', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-09', session_id: 'sess-01', enrollment_id: 'enr-s-09', student_id: 's-09', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-10', session_id: 'sess-01', enrollment_id: 'enr-s-10', student_id: 's-10', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-11', session_id: 'sess-01', enrollment_id: 'enr-s-11', student_id: 's-11', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-12', session_id: 'sess-01', enrollment_id: 'enr-s-12', student_id: 's-12', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-13', session_id: 'sess-01', enrollment_id: 'enr-s-13', student_id: 's-13', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
  { id: 'att-14', session_id: 'sess-01', enrollment_id: 'enr-s-14', student_id: 's-14', status: 'pending', checked_in_at: null, source: 'kiosk', absence_reason: null },
];

// 데모 순차 점등 시퀀스 (s-03 ~ s-14 순서대로 체크인)
export const demoCheckinSequence = [
  { student_id: 's-03', checked_in_at: '2026-06-14T09:07:00' },
  { student_id: 's-07', checked_in_at: '2026-06-14T09:09:00' },
  { student_id: 's-11', checked_in_at: '2026-06-14T09:11:00' },
  { student_id: 's-08', checked_in_at: '2026-06-14T09:12:00' },
  { student_id: 's-10', checked_in_at: '2026-06-14T09:13:00' },
  { student_id: 's-04', checked_in_at: '2026-06-14T09:14:00' },
  { student_id: 's-13', checked_in_at: '2026-06-14T09:15:00' },
  // s-06, s-09, s-12, s-14 → 미도착 → 결석 자동전환 대상
];

// ── 청구 & 수납 ────────────────────────────────────────────────
export interface Invoice {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_id: string;
  billing_month: string;
  status: InvoiceStatus;
  tuition_amount: number;
  material_amount: number;
  content_amount: number;
  discount_amount: number;
  due_date: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  student_id: string;
  card_amount: number;
  cash_amount: number;
  method: PayMethod;
  card_type: string;           // 카드사 (국민, 신한, 삼성, 현대 등)
  card_detail?: string;        // 카드 세부종류 (일반/체크/기업)
  cash_receipt: boolean;
  cash_receipt_no?: string;    // 현금영수증 번호
  amount: number;
  paid_at: string;
  cancellation_no?: string;    // 취소번호
  special_note?: string;       // 특이사항
  terminal_id?: string;        // 결제단말기
  collector?: string;          // 수납자 (원장님/리암/키오스크/온라인결제)
}

// 62/78 ≈ 79% 완납, 14 미납, 2 예정, 2 환불
function buildInvoices(): { invoices: Invoice[]; payments: Payment[] } {
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const unpaidIds = new Set(['s-06', 's-09', 's-12', 's-14', 's-20', 's-24', 's-27', 's-33', 's-39', 's-40', 's-44', 's-48', 's-52', 's-56', 's-67', 's-72']);
  const scheduledIds = new Set(['s-09', 's-14']); // 미납 중 납기 도래 예정 → '예정'으로 파생
  const refundIds = new Set(['s-02', 's-05']);    // 완납 후 환불 처리(음수 수납)
  const collectors = ['원장님', '리암', '키오스크', '온라인결제'];

  students.forEach((s, i) => {
    const cls = classes.find(c => c.id === s.class_id)!;
    const total = cls.tuition_fee + cls.material_fee + cls.content_fee;
    const discount = i % 10 === 0 ? 20000 : 0;
    const status: InvoiceStatus = refundIds.has(s.id) ? '환불' : unpaidIds.has(s.id) ? '미납' : '완납';
    const invoiceId = `inv-${s.id}`;
    const dueDate = scheduledIds.has(s.id) ? '2026-06-30' : '2026-06-01';

    invoices.push({
      id: invoiceId,
      student_id: s.id,
      class_id: s.class_id,
      enrollment_id: `enr-${s.id}`,
      billing_month: '2026-06',
      status,
      tuition_amount: cls.tuition_fee,
      material_amount: cls.material_fee,
      content_amount: cls.content_fee,
      discount_amount: discount,
      due_date: dueDate,
    });

    if (status === '완납') {
      const methods: PayMethod[] = ['카드', '카드', '카드', '카드', '카드', '현금', '계좌이체'];
      const method = methods[i % methods.length];
      payments.push({
        id: `pay-${s.id}`,
        invoice_id: invoiceId,
        student_id: s.id,
        card_amount: method === '카드' ? total - discount : 0,
        cash_amount: method === '현금' ? total : 0,
        method,
        card_type: method === '카드' ? ['국민', '신한', '삼성', '현대'][i % 4] + '카드' : '',
        card_detail: method === '카드' ? ['일반', '체크', '기업'][i % 3] : undefined,
        cash_receipt: method === '현금' && i % 2 === 0,
        cash_receipt_no: method === '현금' && i % 2 === 0 ? `CR${String(20260600 + i).padStart(10, '0')}` : undefined,
        amount: total - discount,
        paid_at: `2026-06-0${(i % 9) + 1}T10:00:00`,
        collector: collectors[i % collectors.length],
      });
    } else if (status === '환불') {
      payments.push({
        id: `pay-${s.id}`,
        invoice_id: invoiceId,
        student_id: s.id,
        card_amount: -(total - discount),
        cash_amount: 0,
        method: '카드',
        card_type: '삼성카드',
        cash_receipt: false,
        amount: -(total - discount),
        paid_at: '2026-06-05T10:00:00',
        cancellation_no: `C${String(10000000 + i).padStart(8, '0')}`,
        collector: collectors[i % collectors.length],
      });
    }
    // 미납·예정: payment 없음
  });

  return { invoices, payments };
}

export const { invoices, payments } = buildInvoices();

// ── 대시보드 집계 (6월 기준) ─────────────────────────────────
// 손익 대시보드: 수입(매출) − 비용 = 순이익.
// 로열티는 현금주의 — 분기 정산월(이번 달=6월)에만 전액 계상.
export const dashboardData = {
  billing_month: '2026-06',
  total_students: 78,
  paid_students: 62,
  unpaid_students: 16,
  payment_rate: 79.5,

  // ── 수입 (매출) ──
  tuition_revenue: 10_320_000,    // 교육비
  material_revenue: 1_860_000,    // 교구 대여비
  content_revenue: 660_000,       // 콘텐츠 사용비
  marketplace_revenue: 480_000,   // 교안 마켓플레이스 수익 (신규)
  total_revenue: 13_320_000,      // 수입 합계

  // ── 비용 ──
  hq_royalty: 1_500_000,          // 본사 분기 로열티
  royalty_is_billing_month: true, // 이번 달이 분기 정산월인가 (현금주의)
  marketplace_fee: 90_000,        // 교안 마켓플레이스 이용료
  total_cost: 1_590_000,          // 비용 합계 (청구월 아니면 로열티 제외)

  // ── 손익 ──
  net_profit: 11_730_000,         // total_revenue − total_cost
  marketplace_net: 390_000,       // 교안 마켓 별도 손익 (수익 − 이용료, 드릴다운)

  // ── 결제 수단별 (학원 매출만 집계, 마켓 제외) ──
  card_revenue: 10_080_000,
  cash_revenue: 1_560_000,
  transfer_revenue: 1_200_000,

  // ── 전월 대비 (총수입 기준) ──
  prev_month_revenue: 12_900_000,
  revenue_diff: 420_000,

  today_attend: 3,
  today_absent: 0,
  today_pending: 11,
  today_total: 14,
};

// ── 포인트 상품 (키오스크 상점) ───────────────────────────────
export interface Product {
  id: string;
  campus_id: string;
  name: string;
  category: string;
  price_dp: number;
  stock: number;
  image_url: string;
  requires_approval: boolean;
}

export const products: Product[] = [
  { id: 'prod-01', campus_id: 'campus-001', name: '편의점 1,000원 상품권', category: '상품권', price_dp: 500, stock: 20, image_url: '/demo/gift-card.png', requires_approval: false },
  { id: 'prod-02', campus_id: 'campus-001', name: '편의점 3,000원 상품권', category: '상품권', price_dp: 1200, stock: 15, image_url: '/demo/gift-card.png', requires_approval: false },
  { id: 'prod-03', campus_id: 'campus-001', name: '치킨 기프티콘', category: '상품권', price_dp: 5000, stock: 5, image_url: '/demo/chicken.png', requires_approval: true },
  { id: 'prod-04', campus_id: 'campus-001', name: '에어팟 충전 케이스', category: '전자기기', price_dp: 12000, stock: 2, image_url: '/demo/airpods.png', requires_approval: true },
  { id: 'prod-05', campus_id: 'campus-001', name: '문구 세트', category: '학용품', price_dp: 800, stock: 30, image_url: '/demo/stationery.png', requires_approval: false },
  { id: 'prod-06', campus_id: 'campus-001', name: '아이스크림 쿠폰', category: '식음료', price_dp: 300, stock: 50, image_url: '/demo/icecream.png', requires_approval: false },
];

// ── 키오스크 포인트 상점 아이템 (출석 후 화면) ──────────────────
export interface KioskShopItem {
  id: string;
  icon: string;
  name: string;
  cost: number;
}

export const kioskShopItems: KioskShopItem[] = [
  { id: 'ks-01', icon: '🍭', name: '간식 교환권', cost: 200 },
  { id: 'ks-02', icon: '🎮', name: '게임 시간 30분', cost: 300 },
  { id: 'ks-03', icon: '📓', name: '디랩 노트', cost: 150 },
  { id: 'ks-04', icon: '🏆', name: '특별 수업 참가권', cost: 500 },
  { id: 'ks-05', icon: '🎁', name: '디랩 굿즈 키트', cost: 800 },
];

// ── 칭호 ──────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  code: string;
  name: string;
  category: string;
  rarity: '일반' | '희귀' | '영웅' | '전설';
  condition: string;
  icon: string;
}

export const achievements: Achievement[] = [
  { id: 'ach-01', code: 'STREAK_10', name: '성실한 예비 모험가', category: '출석', rarity: '일반', condition: '정시 출석 10회 연속', icon: '⚡' },
  { id: 'ach-02', code: 'STREAK_20', name: '스트릭 마스터', category: '출석', rarity: '희귀', condition: '정시 출석 20회 연속', icon: '🔥' },
  { id: 'ach-03', code: 'TOTAL_50', name: '꾸준한 학습자', category: '출석', rarity: '일반', condition: '총 출석 50회', icon: '📚' },
  { id: 'ach-04', code: 'DAILY_FIRST', name: '첫 등원 용사', category: '출석', rarity: '희귀', condition: '캠퍼스 당일 첫 등원', icon: '🌅' },
  { id: 'ach-05', code: 'TOTAL_100', name: '출석왕', category: '출석', rarity: '영웅', condition: '총 출석 100회', icon: '👑' },
  { id: 'ach-06', code: 'ON_TIME_30', name: '열정 코더', category: '출석', rarity: '일반', condition: '정시 출석 30회', icon: '💪' },
  { id: 'ach-07', code: 'MANUAL_SPECIAL', name: '초보 코더', category: '일반', rarity: '일반', condition: '첫 수업 참여', icon: '🌱' },
];

// ── 캠퍼스 랭킹 (상위 5명) ────────────────────────────────────
export const campusRanking = students
  .filter(s => s.status === '재원')
  .sort((a, b) => b.points - a.points)
  .slice(0, 10)
  .map((s, i) => ({ rank: i + 1, student_id: s.id, name: s.name, points: s.points, title: s.title }));

// ── 헬퍼 함수 ─────────────────────────────────────────────────
export function getStudentsByClass(classId: string) {
  return students.filter(s => s.class_id === classId);
}

export function getClassById(classId: string) {
  return classes.find(c => c.id === classId);
}

export function getStudentById(studentId: string) {
  return students.find(s => s.id === studentId);
}

export function getUnpaidStudents() {
  return invoices
    .filter(inv => inv.status === '미납')
    .map(inv => students.find(s => s.id === inv.student_id))
    .filter(Boolean) as Student[];
}

export function getInvoiceByStudent(studentId: string) {
  return invoices.filter(inv => inv.student_id === studentId);
}

// ─────────────────────────────────────────────────────────────
// 출결현황 페이지 — 추이·매트릭스용 결정적 출결 이력 백필
// 오늘(2026-06-14) 이전 회차를 결정적으로 생성. todaySessions/initialAttendance는 보존.
// (프로젝트 규칙상 Math.random() 금지 → 학생 id·회차 인덱스 기반 고정 패턴)
// ─────────────────────────────────────────────────────────────
export const TODAY = '2026-06-14';
const HISTORY_WEEKS = 16; // 월별 4개월·주간 8주 충당
const CURRENT_CLASS_IDS = ['cl-01', 'cl-02', 'cl-03', 'cl-04', 'cl-05', 'cl-06'];
const TWICE_WEEKLY = new Set(['cl-04', 'cl-05', 'cl-06']); // 화·목 (주 2회)

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// 학생·회차 기반 결정적 상태 (대부분 출석, 소수 결석·보강; streak 높을수록 출석↑)
function deriveHistStatus(student: Student, sessionIndex: number): AttendanceStatus {
  // 37: 회차별로 해시값을 흩뜨리는 소수 / streak 높을수록 결석 상한↓
  const r = (hashString(student.id) + sessionIndex * 37) % 100;
  const absentThreshold = Math.max(2, 11 - Math.floor(student.streak / 3));
  if (r < absentThreshold) return 'absent';
  if (r < absentThreshold + 3) return 'makeup';
  return 'attend';
}

function classStartTime(classId: string): string {
  const cls = classes.find(c => c.id === classId);
  const m = cls?.schedule.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '09:00';
}

function buildAttendanceHistory(): { sessionHistory: ClassSession[]; attendanceHistory: Attendance[] } {
  const pastSessions: ClassSession[] = [];
  const records: Attendance[] = [];

  CURRENT_CLASS_IDS.forEach(classId => {
    const classStudents = students.filter(s => s.class_id === classId);
    // 과거 회차 날짜 (오래된→최신, 오늘 제외)
    const dates: string[] = [];
    if (TWICE_WEEKLY.has(classId)) {
      for (let w = HISTORY_WEEKS; w >= 1; w--) {
        dates.push(shiftDate(TODAY, -7 * w - 2)); // 주중 1회차 (오늘 기준 -2일)
        dates.push(shiftDate(TODAY, -7 * w));     // 주중 2회차 (오늘과 같은 요일)
      }
    } else {
      for (let w = HISTORY_WEEKS; w >= 1; w--) {
        dates.push(shiftDate(TODAY, -7 * w));     // 주 1회차 (오늘과 같은 요일)
      }
    }
    dates.forEach((date, i) => {
      const sessionId = `sh-${classId}-${i + 1}`;
      pastSessions.push({
        id: sessionId, class_id: classId, session_date: date,
        start_time: classStartTime(classId), session_no: i + 1,
      });
      classStudents.forEach(s => {
        const status = deriveHistStatus(s, i + 1);
        records.push({
          id: `ah-${sessionId}-${s.id}`,
          session_id: sessionId,
          enrollment_id: `enr-${s.id}`,
          student_id: s.id,
          status,
          checked_in_at: status === 'attend' || status === 'makeup' ? `${date}T${classStartTime(classId)}:00` : null,
          source: 'kiosk',
          absence_reason: status === 'absent' ? '개인 사정' : null,
        });
      });
    });
  });

  // ── 종강반·추가 수강반 회차·출결 (상세 조회용, 오늘 회차 없음) ──
  // cl-07·cl-08: 2025 봄학기(종강) 16주. cl-09: 2026 여름 추가 수강반(최근 흐름).
  const EXTRA: { classId: string; dates: string[] }[] = [
    { classId: 'cl-07', dates: Array.from({ length: 16 }, (_, i) => shiftDate('2025-03-08', 7 * i)) },
    { classId: 'cl-08', dates: Array.from({ length: 16 }, (_, i) => shiftDate('2025-03-08', 7 * i)) },
    { classId: 'cl-09', dates: Array.from({ length: HISTORY_WEEKS }, (_, i) => shiftDate(TODAY, -7 * (HISTORY_WEEKS - i))) },
  ];
  EXTRA.forEach(({ classId, dates }) => {
    const roster = getClassRoster(classId);
    dates.forEach((date, i) => {
      const sessionId = `sh-${classId}-${i + 1}`;
      pastSessions.push({
        id: sessionId, class_id: classId, session_date: date,
        start_time: classStartTime(classId), session_no: i + 1,
      });
      roster.forEach(s => {
        const status = deriveHistStatus(s, i + 1);
        records.push({
          id: `ah-${sessionId}-${s.id}`,
          session_id: sessionId,
          enrollment_id: `enr-${s.id}`,
          student_id: s.id,
          status,
          checked_in_at: status === 'attend' || status === 'makeup' ? `${date}T${classStartTime(classId)}:00` : null,
          source: 'kiosk',
          absence_reason: status === 'absent' ? '개인 사정' : null,
        });
      });
    });
  });

  // 오늘 회차(todaySessions)를 최신 컬럼으로 합침. 오늘 출결은 initialAttendance(cl-01)만 존재.
  const sessionHistory = [...pastSessions, ...todaySessions];
  return { sessionHistory, attendanceHistory: records };
}

export const { sessionHistory, attendanceHistory } = buildAttendanceHistory();

const sessionById: Record<string, ClassSession> = {};
sessionHistory.forEach(s => { sessionById[s.id] = s; });

function weekStartISO(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = (dt.getUTCDay() + 6) % 7; // 월요일=0
  dt.setUTCDate(dt.getUTCDate() - day);
  return dt.toISOString().slice(0, 10);
}

export interface TrendPoint {
  key: string;
  label: string;
  rate: number;   // 출석률(%) — (출석+보강)/(출석+보강+결석)
  attend: number; // 출석+보강
  total: number;  // 미도착 제외 분모
}

// 오늘(진행 중) 회차는 추이에서 제외 — 미완료라 왜곡 방지
function aggregateTrend(
  records: Attendance[],
  keyOf: (date: string) => string,
  labelOf: (key: string) => string,
  take: number,
): TrendPoint[] {
  const buckets: Record<string, { attend: number; total: number }> = {};
  records.forEach(r => {
    const sess = sessionById[r.session_id];
    if (!sess || sess.session_date === TODAY) return;
    if (r.status === 'pending') return;
    const k = keyOf(sess.session_date);
    if (!buckets[k]) buckets[k] = { attend: 0, total: 0 };
    if (r.status === 'attend' || r.status === 'makeup') buckets[k].attend += 1;
    buckets[k].total += 1;
  });
  return Object.keys(buckets).sort().slice(-take).map(k => ({
    key: k,
    label: labelOf(k),
    rate: buckets[k].total ? Math.round((buckets[k].attend / buckets[k].total) * 100) : 0,
    attend: buckets[k].attend,
    total: buckets[k].total,
  }));
}

export function getWeeklyAttendanceTrend(records: Attendance[], weeks = 8): TrendPoint[] {
  return aggregateTrend(records, weekStartISO,
    k => `${Number(k.slice(5, 7))}/${Number(k.slice(8, 10))}주`, weeks);
}

export function getMonthlyAttendanceTrend(records: Attendance[], months = 4): TrendPoint[] {
  return aggregateTrend(records, d => d.slice(0, 7),
    k => `${Number(k.slice(5, 7))}월`, months);
}

export interface MatrixCell {
  session: ClassSession;
  status: AttendanceStatus;
  record?: Attendance;
}
export interface MatrixRow {
  student: Student;
  cells: MatrixCell[];
}
export interface ClassMatrix {
  sessions: ClassSession[];
  rows: MatrixRow[];
}

// 반별 학생×회차 매트릭스 (최근 maxSessions 회차, 오늘 포함)
export function getClassMatrix(classId: string, records: Attendance[], maxSessions = 8): ClassMatrix {
  const sessions = sessionHistory
    .filter(s => s.class_id === classId)
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(-maxSessions);
  const classStudents = getClassRoster(classId);
  const recByKey: Record<string, Attendance> = {};
  records.forEach(r => { recByKey[`${r.session_id}:${r.student_id}`] = r; });
  const rows: MatrixRow[] = classStudents.map(student => ({
    student,
    cells: sessions.map(session => {
      const rec = recByKey[`${session.id}:${student.id}`];
      return { session, status: (rec?.status ?? 'pending') as AttendanceStatus, record: rec };
    }),
  }));
  return { sessions, rows };
}

export interface AbsenceFocusEntry {
  student: Student;
  cls: Class;
  absentCount: number;
  countedSessions: number;
  lastAbsentDate: string | null;
}

// 최근 maxSessions 회차(오늘 제외) 기준 학생별 결석 집계.
// 결석 1회 이상만, 결석 횟수 내림차순(동률 시 최근 결석일 우선).
export function getAbsenceFocusList(
  records: Attendance[],
  classIds: string[],
  maxSessions = 8,
): AbsenceFocusEntry[] {
  const recByKey: Record<string, Attendance> = {};
  records.forEach(r => { recByKey[`${r.session_id}:${r.student_id}`] = r; });

  const entries: AbsenceFocusEntry[] = [];
  classIds.forEach(classId => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    const sessions = sessionHistory
      .filter(s => s.class_id === classId && s.session_date !== TODAY)
      .sort((a, b) => a.session_date.localeCompare(b.session_date))
      .slice(-maxSessions);
    const classStudents = students.filter(s => s.class_id === classId);
    classStudents.forEach(student => {
      let absentCount = 0;
      let lastAbsentDate: string | null = null;
      sessions.forEach(session => {
        const rec = recByKey[`${session.id}:${student.id}`];
        if (rec?.status === 'absent') {
          absentCount += 1;
          if (!lastAbsentDate || session.session_date > lastAbsentDate) {
            lastAbsentDate = session.session_date;
          }
        }
      });
      if (absentCount >= 1) {
        entries.push({ student, cls, absentCount, countedSessions: sessions.length, lastAbsentDate });
      }
    });
  });

  return entries.sort((a, b) =>
    b.absentCount - a.absentCount
    || (b.lastAbsentDate ?? '').localeCompare(a.lastAbsentDate ?? ''),
  );
}

// ── 교안 마켓플레이스 (LMS 스토어프론트) ──────────────────────
export type LessonType = '교안' | '강의';
export type LessonLevel = '입문' | '초급' | '중급';
export type LessonCategory = '파이썬' | '아두이노·로보틱스' | 'AI·데이터' | '웹·앱';

export interface LessonProduct {
  id: string;
  title: string;
  category: LessonCategory;
  type: LessonType;
  instructor: string;
  level: LessonLevel;
  lessons: number;           // 차시 수
  durationMin: number;       // 총 강의시간(분)
  rating: number;            // 0~5 (소수 1자리)
  students: number;          // 수강생 수
  skills: string[];          // 스킬 칩
  priceWon: number;          // 가격(원)
  thumbnailEmoji: string;    // 썸네일 placeholder
  badge?: '베스트' | '신규';
}

export const lessonProducts: LessonProduct[] = [
  { id: 'lp-01', title: '파이썬 첫걸음: 스크래치에서 코드로', category: '파이썬', type: '교안', instructor: '김도윤', level: '입문', lessons: 12, durationMin: 360, rating: 4.8, students: 1240, skills: ['Python', '알고리즘 기초'], priceWon: 49000, thumbnailEmoji: '🐍', badge: '베스트' },
  { id: 'lp-02', title: '파이썬 알고리즘 트레이닝', category: '파이썬', type: '강의', instructor: '이서연', level: '중급', lessons: 20, durationMin: 720, rating: 4.7, students: 530, skills: ['Python', '자료구조'], priceWon: 89000, thumbnailEmoji: '🧮' },
  { id: 'lp-03', title: '아두이노로 만드는 스마트홈', category: '아두이노·로보틱스', type: '교안', instructor: '박지훈', level: '초급', lessons: 16, durationMin: 480, rating: 4.9, students: 870, skills: ['Arduino', '회로'], priceWon: 69000, thumbnailEmoji: '🔌', badge: '베스트' },
  { id: 'lp-04', title: '라인트레이서 로봇 제작', category: '아두이노·로보틱스', type: '강의', instructor: '최민준', level: '중급', lessons: 14, durationMin: 560, rating: 4.6, students: 310, skills: ['로보틱스', '센서'], priceWon: 79000, thumbnailEmoji: '🤖', badge: '신규' },
  { id: 'lp-05', title: '처음 만나는 AI: 머신러닝 놀이터', category: 'AI·데이터', type: '교안', instructor: '정하늘', level: '입문', lessons: 10, durationMin: 300, rating: 4.8, students: 1520, skills: ['AI', '데이터'], priceWon: 59000, thumbnailEmoji: '🧠', badge: '신규' },
  { id: 'lp-06', title: '데이터 분석 with 파이썬', category: 'AI·데이터', type: '강의', instructor: '김도윤', level: '중급', lessons: 18, durationMin: 650, rating: 4.7, students: 640, skills: ['Python', '데이터'], priceWon: 99000, thumbnailEmoji: '📊' },
  { id: 'lp-07', title: '웹의 시작: HTML/CSS 교안', category: '웹·앱', type: '교안', instructor: '이서연', level: '입문', lessons: 12, durationMin: 380, rating: 4.5, students: 980, skills: ['HTML', 'CSS'], priceWon: 45000, thumbnailEmoji: '🌐' },
  { id: 'lp-08', title: '나만의 앱 만들기: 앱인벤터', category: '웹·앱', type: '강의', instructor: '박지훈', level: '초급', lessons: 15, durationMin: 500, rating: 4.7, students: 420, skills: ['앱개발', '블록코딩'], priceWon: 65000, thumbnailEmoji: '📱', badge: '신규' },
];
