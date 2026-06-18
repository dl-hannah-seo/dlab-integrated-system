import { describe, it, expect } from 'vitest';
import { menusForRole, canSeeMenu, canSeeExtra, canGivePoints, canManageShop, ROLES } from './roles';

describe('menusForRole', () => {
  it('원장은 전체 메뉴', () => {
    expect(menusForRole('원장')).toContain('/revenue');
    expect(menusForRole('원장')).toContain('/ai');
    expect(menusForRole('원장')).toContain('/settings');
  });
  it('교사는 제한된 메뉴(손익·AI·강사·설정 제외, 포인트관리 포함)', () => {
    const m = menusForRole('교사');
    expect(m).toContain('/attendance');
    expect(m).toContain('/students');
    expect(m).toContain('/points');
    expect(m).not.toContain('/revenue');
    expect(m).not.toContain('/ai');
    expect(m).not.toContain('/teachers');
    expect(m).not.toContain('/settings');
  });
  it('SO는 데스크 운영 메뉴(손익·AI·강사 제외, 상담·수납·포인트관리 포함)', () => {
    const m = menusForRole('SO');
    expect(m).toContain('/leads');
    expect(m).toContain('/payments');
    expect(m).toContain('/points');
    expect(m).not.toContain('/revenue');
    expect(m).not.toContain('/ai');
  });
  it('AI 인사이트는 원장만', () => {
    expect(canSeeMenu('원장', '/ai')).toBe(true);
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
  it('교안 마켓플레이스는 원장·교사', () => {
    expect(canSeeExtra('원장', 'marketplace')).toBe(true);
    expect(canSeeExtra('교사', 'marketplace')).toBe(true);
    expect(canSeeExtra('SO', 'marketplace')).toBe(false);
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
