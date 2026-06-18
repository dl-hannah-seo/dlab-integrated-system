// 역할 기반 메뉴 분리 (데모 — 실제 인증 아님). PRD §6 권한 모델 매핑.
export type Role = '원장' | '교사' | 'SO' | '학생';

/** 현재 역할 저장 키 (RoleContext·포털 공용) */
export const ROLE_STORAGE_KEY = 'dlab_role';

/** 데모에서 '교사' 역할로 로그인한 강사 (본인 수업·출결·상담 스코프 기준) */
export const DEMO_TEACHER_ID = 'tch-seed';
export const DEMO_TEACHER_NAME = '씨드';

export const ROLES: Role[] = ['원장', '교사', 'SO', '학생'];

export const ROLE_META: Record<Role, { label: string; sub: string }> = {
  '원장': { label: '캠퍼스 원장', sub: 'manager · 자기 캠퍼스 전체' },
  '교사': { label: '교사(연구원)', sub: 'staff · 담당 반' },
  'SO': { label: 'SO · 데스크', sub: 'staff · 데스크 운영' },
  '학생': { label: '학생', sub: '키오스크 · 포털' },
};

// 역할별 노출 메뉴 (Sidebar href 기준). 학생은 admin 메뉴 없음(→ 포털).
const MENU_ALLOWLIST: Record<Role, string[]> = {
  '원장': ['/dashboard', '/schedule', '/attendance', '/classes', '/teachers', '/students', '/leads', '/payments', '/revenue', '/ai', '/points', '/settings'],
  '교사': ['/dashboard', '/schedule', '/attendance', '/students', '/leads', '/points'],
  'SO': ['/dashboard', '/schedule', '/attendance', '/classes', '/students', '/leads', '/payments', '/points'],
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
