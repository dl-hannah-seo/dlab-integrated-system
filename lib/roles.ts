// 역할 기반 메뉴 분리 (데모 — 실제 인증 아님). PRD §6 권한 모델 매핑.
export type Role = '원장' | '교사' | 'SO' | '학생';

/** 현재 역할 저장 키 (RoleContext·포털 공용) */
export const ROLE_STORAGE_KEY = 'dlab_role';

/** 데모에서 '교사' 역할로 로그인한 강사 (본인 수업·출결·상담 스코프 기준) */
export const DEMO_TEACHER_ID = 'tch-seed';
export const DEMO_TEACHER_NAME = '씨드';

export const ROLES: Role[] = ['원장', '교사', 'SO', '학생'];

/** 데모 계정 표시 이름(상담자 기본값 등) — 실제 인증 아님 */
export const ACCOUNT_NAME: Record<Role, string> = {
  '원장': '케이',
  '교사': DEMO_TEACHER_NAME,
  'SO': '데스크 담당자',
  '학생': '',
};

export const ROLE_META: Record<Role, { label: string; sub: string }> = {
  '원장': { label: '캠퍼스 원장', sub: 'manager · 자기 캠퍼스 전체' },
  '교사': { label: '교사(연구원)', sub: 'staff · 담당 반' },
  'SO': { label: 'SO · 데스크', sub: 'staff · 데스크 운영' },
  '학생': { label: '학생', sub: '키오스크 · 포털' },
};

// 역할별 노출 메뉴 (Sidebar href 기준). 학생은 admin 메뉴 없음(→ 포털).
const MENU_ALLOWLIST: Record<Role, string[]> = {
  // AI 인사이트(/ai)는 메뉴에서 제거 — 대시보드 AI 인사이트 히어로로 통합됨
  '원장': ['/dashboard', '/promotion', '/leads', '/schedule', '/attendance', '/classes', '/students', '/teachers', '/payments', '/revenue', '/points', '/settings'],
  '교사': ['/dashboard', '/schedule', '/attendance', '/students', '/leads', '/points'],
  'SO': ['/dashboard', '/promotion', '/leads', '/schedule', '/attendance', '/classes', '/students', '/payments', '/points'],
  '학생': [],
};

// 포인트 관리 화면 탭 권한 — 지급(원장·교사) / 상점 상품(원장·SO)
export function canGivePoints(role: Role): boolean {
  return role === '원장' || role === '교사';
}
export function canManageShop(role: Role): boolean {
  return role === '원장' || role === 'SO';
}

export function menusForRole(role: Role): string[] {
  return MENU_ALLOWLIST[role];
}

export function canSeeMenu(role: Role, href: string): boolean {
  return MENU_ALLOWLIST[role].includes(href);
}

// 사이드바 표시 레이아웃 — 메뉴를 접이식 그룹으로 묶을 역할만 정의.
// 미정의 역할(SO·교사)은 평면 노출(allowlist 순서) 유지.
// 권한이 아니라 '표시 위치'일 뿐 — 그룹 안 메뉴도 접근 권한은 allowlist로 판정.
export type MenuLayoutEntry =
  | { type: 'item'; href: string }
  | { type: 'section'; id: string; label: string; hrefs: string[] };

// 원장·SO 공통 레이아웃 — 홍보·상담은 상단 단독, 교육/운영·관리는 접이식 그룹.
// 그룹 안 메뉴 노출은 allowlist로 판정되므로 SO에서는 강사·손익·설정이 자동 제외됨.
const SHARED_LAYOUT: MenuLayoutEntry[] = [
  { type: 'item', href: '/dashboard' },
  { type: 'item', href: '/promotion' },
  { type: 'item', href: '/leads' },
  { type: 'section', id: 'education', label: '교육/운영', hrefs: ['/schedule', '/attendance', '/classes'] },
  { type: 'section', id: 'manage', label: '관리', hrefs: ['/students', '/teachers', '/payments', '/revenue', '/points'] },
  { type: 'item', href: '/settings' },
];

const MENU_LAYOUT: Partial<Record<Role, MenuLayoutEntry[]>> = {
  '원장': SHARED_LAYOUT,
  'SO': SHARED_LAYOUT,
};

export function menuLayoutForRole(role: Role): MenuLayoutEntry[] | null {
  return MENU_LAYOUT[role] ?? null;
}

// 사이드바 부가 항목(외부 링크·매뉴얼·빠른 실행) 노출
export type ExtraKey = 'marketplace' | 'manual' | 'quickActions';
const EXTRA_ALLOWLIST: Record<ExtraKey, Role[]> = {
  marketplace: ['원장', '교사'],
  manual: ['원장'],
  quickActions: ['교사', 'SO'],   // 원장 제외
};

export function canSeeExtra(role: Role, key: ExtraKey): boolean {
  return EXTRA_ALLOWLIST[key].includes(role);
}
