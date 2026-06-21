'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { useRole } from '@/components/layout/RoleContext';
import { ROLES, ROLE_META, menusForRole, menuLayoutForRole, canSeeExtra, type Role, type MenuLayoutEntry } from '@/lib/roles';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  {
    href: '/dashboard',
    label: '대시보드',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: '/promotion',
    label: '홍보',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  },
  {
    href: '/leads',
    label: '상담',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 01-9 9c-1.6 0-3.1-.4-4.4-1.1L3 21l1.1-4.6A8.9 8.9 0 013 12a9 9 0 1118 0z" /></svg>,
  },
  {
    href: '/schedule',
    label: '시간표',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>,
  },
  {
    href: '/teaching',
    label: '수업관리',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    href: '/attendance',
    label: '출결 현황',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
{
    href: '/classes',
    label: '수업 구성',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    href: '/teachers',
    label: '강사',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
  },
  {
    href: '/students',
    label: '원생',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    href: '/payments',
    label: '수납',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    href: '/revenue',
    label: '손익',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 3 3 5-6" /></svg>,
  },
  {
    href: '/points',
    label: '포인트',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    href: '/settings',
    label: '설정',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

// href → 메뉴 메타 빠른 조회 (그룹 레이아웃 렌더용)
const navByHref: Record<string, NavItem> = Object.fromEntries(adminNav.map(i => [i.href, i]));

// 그룹 헤더 아이콘 (lib/roles.ts MENU_LAYOUT의 section.id 기준)
const SECTION_ICON: Record<string, React.ReactNode> = {
  education: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>,
  manage: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openAttendance, openSms, openRecording } = useQuickActions();
  const { role, setRole, ready } = useRole();

  // 학생 역할이면 admin이 아니라 키오스크로
  useEffect(() => {
    if (ready && role === '학생') router.push('/kiosk');
  }, [ready, role, router]);

  const allowed = menusForRole(role);
  const visibleNav = adminNav.filter(item => allowed.includes(item.href));
  const layout = menuLayoutForRole(role);

  function onSwitch(value: string) {
    if (value === '__kiosk__') { router.push('/kiosk'); return; }   // 데모: 키오스크 출석 화면
    const r = value as Role;
    setRole(r);
    if (r === '학생') router.push('/kiosk');
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // 사용자가 직접 토글한 그룹만 기억(override). 미토글 그룹은 기본 접힘 + 활성 페이지가 속한 그룹은 자동 펼침.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  let activeSectionId: string | null = null;
  if (layout) {
    for (const e of layout) {
      if (e.type === 'section' && e.hrefs.some(isActive)) activeSectionId = e.id;
    }
  }
  const sectionOpen = (id: string) => openSections[id] ?? (id === activeSectionId);

  const renderLink = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            active ? 'bg-[#2F6BFF] text-white font-medium shadow-[0_4px_12px_rgba(47,107,255,0.35)]' : 'text-[#9CA3AF] hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className={active ? 'text-white' : 'text-[#6B7280]'}>{item.icon}</span>
          {item.label}
        </Link>
      </li>
    );
  };

  const renderSection = (entry: Extract<MenuLayoutEntry, { type: 'section' }>) => {
    const items = entry.hrefs.filter(h => allowed.includes(h)).map(h => navByHref[h]).filter(Boolean) as NavItem[];
    if (items.length === 0) return null;
    if (items.length === 1) return renderLink(items[0]);   // 단일 항목 그룹은 묶지 않고 평면 노출
    const open = sectionOpen(entry.id);
    const hasActive = items.some(i => isActive(i.href));
    return (
      <li key={entry.id}>
        <button
          type="button"
          onClick={() => setOpenSections(s => ({ ...s, [entry.id]: !open }))}
          aria-expanded={open}
          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5 ${
            !open && hasActive ? 'text-white' : 'text-[#9CA3AF]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span className={!open && hasActive ? 'text-[#5C8BFF]' : 'text-[#6B7280]'}>{SECTION_ICON[entry.id]}</span>
            {entry.label}
          </span>
          <svg
            width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            className={`text-[#6B7280] transition-transform ${open ? 'rotate-90' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {open && (
          <ul className="mt-0.5 ml-[18px] pl-3 border-l border-white/10 space-y-0.5">
            {items.map(renderLink)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#1C1E26] flex flex-col z-10">
      {/* 로고 */}
      <div className="flex items-center h-14 px-5 border-b border-white/10">
        {/* 다크 사이드바 위라 검정 로고를 흰색으로 반전 */}
        <Image src="/logo-dlab.png" alt="D.LAB" width={59} height={28} priority className="h-7 w-auto invert" />
        <span className="ml-2 text-xs text-[#9CA3AF] mt-0.5">OS</span>
      </div>

      {/* 역할 전환 (데모) */}
      <div className="px-3 pt-3">
        <label className="px-1 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">⇄ 역할 전환 (데모)</label>
        <select
          value={role}
          onChange={e => onSwitch(e.target.value)}
          className="w-full mt-1 px-2.5 py-2 text-sm rounded-lg border border-white/10 bg-[#252836] text-white focus:outline-none focus:ring-1 focus:ring-[#2F6BFF] [&>option]:bg-[#252836] [&>option]:text-white"
        >
          {ROLES.filter(r => r !== '학생').map(r => <option key={r} value={r} className="bg-white text-[#1A1D29]">{ROLE_META[r].label}</option>)}
          <option value="__kiosk__" className="bg-white text-[#1A1D29]">키오스크(출석/포인트)</option>
        </select>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col">
        <ul className="space-y-0.5">
          {layout
            ? layout.map(entry =>
                entry.type === 'item'
                  ? (allowed.includes(entry.href) && navByHref[entry.href] ? renderLink(navByHref[entry.href]) : null)
                  : renderSection(entry))
            : visibleNav.map(renderLink)}
        </ul>

        {/* 외부 화면 링크 (새 탭) — 교안 마켓플레이스: 사이드바에서 숨김 처리 */}

        {/* 빠른 실행 — 교사·SO (원장 제외) */}
        {canSeeExtra(role, 'quickActions') && (
        <div className="mt-auto pt-4 border-t border-[#E8EBF1]">
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
            빠른 실행
          </p>
          <button
            onClick={openAttendance}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white hover:bg-white/5 hover:text-white transition-colors group"
          >
            <span className="text-[#9CA3AF] group-hover:text-white">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </span>
            출석 체크
          </button>
          <button
            onClick={() => openSms()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white hover:bg-white/5 hover:text-white transition-colors group"
          >
            <span className="text-[#9CA3AF] group-hover:text-white">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
            문자 발송
          </button>
          <button
            onClick={() => openRecording()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white hover:bg-white/5 hover:text-white transition-colors group"
          >
            <span className="text-[#9CA3AF] group-hover:text-white">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v3m0-3a4 4 0 01-4-4V7a4 4 0 118 0v4a4 4 0 01-4 4z" />
              </svg>
            </span>
            AI 녹음
          </button>
        </div>
        )}

        {/* 운영 매뉴얼 — 원장만 */}
        {canSeeExtra(role, 'manual') && (
        <div className="mt-4 pt-4 border-t border-[#E8EBF1]">
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
            운영 매뉴얼
          </p>
          <Link
            href="/manual"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === '/manual' || pathname.startsWith('/manual/')
                ? 'bg-[#2F6BFF] text-white font-medium shadow-[0_4px_12px_rgba(47,107,255,0.35)]'
                : 'text-white hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={pathname.startsWith('/manual') ? 'text-white' : 'text-[#6B7280]'}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            가맹 운영 매뉴얼
          </Link>
        </div>
        )}
      </nav>

      {/* 유저 정보 (역할 반영) */}
      <div className="px-4 py-4 border-t border-[#E8EBF1]">
        <div className="mb-2">
          <p className="text-sm font-medium text-white">{ROLE_META[role].label}</p>
        </div>
        <button className="w-full px-3 py-2 text-sm text-[#9CA3AF] bg-white/5 hover:bg-white/5 hover:text-white rounded-md transition-colors">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
