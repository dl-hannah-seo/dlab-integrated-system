import { describe, it, expect } from 'vitest';
import { menusForRole, canSeeMenu, canSeeExtra, canGivePoints, canManageShop, menuLayoutForRole, canSeeFinance, ROLES } from './roles';

describe('menusForRole', () => {
  it('원장은 전체 메뉴', () => {
    expect(menusForRole('원장')).toContain('/revenue');
    expect(menusForRole('원장')).toContain('/classes');
    expect(menusForRole('원장')).toContain('/settings');
  });
  it('교사는 4개 메뉴만 — 대시보드·시간표·수업관리·포인트 (출결·원생·상담은 수업관리로 통합)', () => {
    const m = menusForRole('교사');
    expect(m).toEqual(['/dashboard', '/schedule', '/teaching', '/points']);
    expect(m).not.toContain('/attendance');
    expect(m).not.toContain('/students');
    expect(m).not.toContain('/leads');
    expect(m).not.toContain('/teachers');
    expect(m).not.toContain('/settings');
  });
  it('SO는 데스크 운영 메뉴(재무·금액 제외 — 수납·손익·강사 없음, 홍보·상담·포인트 포함)', () => {
    const m = menusForRole('SO');
    expect(m).toContain('/leads');
    expect(m).toContain('/promotion');
    expect(m).toContain('/points');
    expect(m).not.toContain('/payments');  // 금액 화면 제외
    expect(m).not.toContain('/revenue');
    expect(m).not.toContain('/ai');
  });
  it('AI 인사이트(/ai) 메뉴는 제거됨 — 대시보드로 통합, 어떤 역할도 노출 안 함', () => {
    expect(canSeeMenu('원장', '/ai')).toBe(false);
    expect(canSeeMenu('교사', '/ai')).toBe(false);
    expect(canSeeMenu('SO', '/ai')).toBe(false);
  });
  it('포인트 관리(통합)는 원장·교사·SO', () => {
    expect(canSeeMenu('원장', '/points')).toBe(true);
    expect(canSeeMenu('교사', '/points')).toBe(true);
    expect(canSeeMenu('SO', '/points')).toBe(true);
    expect(canSeeMenu('학생', '/points')).toBe(false);
  });
  it('포인트 탭 권한 — 지급(원장·교사)·상점(원장·SO)', () => {
    expect(canGivePoints('원장')).toBe(true);
    expect(canGivePoints('교사')).toBe(true);
    expect(canGivePoints('SO')).toBe(false);
    expect(canManageShop('원장')).toBe(true);
    expect(canManageShop('SO')).toBe(true);
    expect(canManageShop('교사')).toBe(false);
  });
  it('학생은 admin 메뉴 없음', () => {
    expect(menusForRole('학생')).toEqual([]);
  });
});

describe('canSeeExtra', () => {
  it('운영 매뉴얼은 원장만', () => {
    expect(canSeeExtra('원장', 'manual')).toBe(true);
    expect(canSeeExtra('SO', 'manual')).toBe(false);
    expect(canSeeExtra('교사', 'manual')).toBe(false);
  });
  it('교안 마켓플레이스는 전 역할 숨김(요청 — 추후 복구)', () => {
    expect(canSeeExtra('원장', 'marketplace')).toBe(false);
    expect(canSeeExtra('교사', 'marketplace')).toBe(false);
    expect(canSeeExtra('SO', 'marketplace')).toBe(false);
  });
});

describe('canSeeFinance — SO 금액 마스킹', () => {
  it('원장만 재무·금액 열람', () => {
    expect(canSeeFinance('원장')).toBe(true);
    expect(canSeeFinance('SO')).toBe(false);
    expect(canSeeFinance('교사')).toBe(false);
    expect(canSeeFinance('학생')).toBe(false);
  });
});

describe('교사 수업관리(/teaching)', () => {
  it('교사 전용 메뉴로만 노출', () => {
    expect(canSeeMenu('교사', '/teaching')).toBe(true);
    expect(canSeeMenu('원장', '/teaching')).toBe(false);
    expect(canSeeMenu('SO', '/teaching')).toBe(false);
    expect(canSeeMenu('학생', '/teaching')).toBe(false);
  });
});

describe('canSeeMenu', () => {
  it('역할별 메뉴 접근 판정', () => {
    expect(canSeeMenu('원장', '/revenue')).toBe(true);
    expect(canSeeMenu('교사', '/revenue')).toBe(false);
  });
  it('모든 역할이 정의됨', () => {
    expect(ROLES.every(r => Array.isArray(menusForRole(r)))).toBe(true);
  });
});

describe('menuLayoutForRole', () => {
  it('원장은 그룹 레이아웃(교육/운영·관리) 정의', () => {
    const layout = menuLayoutForRole('원장');
    expect(layout).not.toBeNull();
    const sectionIds = layout!.filter(e => e.type === 'section').map(e => (e as { id: string }).id);
    expect(sectionIds).toEqual(['education', 'manage']);
  });
  it('레이아웃의 모든 href는 원장 allowlist 안에 있음(권한과 표시 일치)', () => {
    const layout = menuLayoutForRole('원장')!;
    const allowed = menusForRole('원장');
    const hrefs = layout.flatMap(e => e.type === 'item' ? [e.href] : e.hrefs);
    expect(hrefs.every(h => allowed.includes(h))).toBe(true);
  });
  it('SO는 원장과 공통 레이아웃, 교사는 미정의 → 평면 노출', () => {
    expect(menuLayoutForRole('SO')).not.toBeNull();
    expect(menuLayoutForRole('교사')).toBeNull();
  });
});
