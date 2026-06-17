'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuickActions } from '@/components/panels/QuickActionsContext';

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
    href: '/schedule',
    label: '시간표',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>,
  },
  {
    href: '/attendance',
    label: '출결 현황',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
{
    href: '/classes',
    label: '반 관리',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    href: '/students',
    label: '원생 관리',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
  {
    href: '/payments',
    label: '수납 관리',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    href: '/ai',
    label: 'AI 요약',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  },
  {
    href: '/settings',
    label: '설정',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openAttendance, openSms } = useQuickActions();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col z-10">
      {/* 로고 */}
      <div className="flex items-center h-14 px-5 border-b border-[#E9E9E7]">
        <span className="text-base font-bold text-[#37352F]">D.LAB</span>
        <span className="ml-1.5 text-xs text-[#787774] mt-0.5">OS</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col">
        <ul className="space-y-0.5">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-[#FFF1EC] text-[#FF6C37] font-medium'
                      : 'text-[#37352F] hover:bg-[#EFEFEE]'
                  }`}
                >
                  <span className={isActive ? 'text-[#FF6C37]' : 'text-[#787774]'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 외부 화면 링크 (새 탭) */}
        <div className="mt-4 pt-4 border-t border-[#E9E9E7] space-y-0.5">
          <Link
            href="/kiosk"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#787774] hover:bg-[#EFEFEE] transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            출석·포인트 키오스크
          </Link>
          <Link
            href="/marketplace"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#787774] hover:bg-[#EFEFEE] transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            교안 마켓플레이스
          </Link>
        </div>

        {/* 빠른 실행 */}
        <div className="mt-auto pt-4 border-t border-[#E9E9E7]">
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#787774] uppercase tracking-wider">
            빠른 실행
          </p>
          <button
            onClick={openAttendance}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#37352F] hover:bg-[#FFF1EC] hover:text-[#FF6C37] transition-colors group"
          >
            <span className="text-[#787774] group-hover:text-[#FF6C37]">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </span>
            출석 체크
          </button>
          <button
            onClick={() => openSms()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#37352F] hover:bg-[#FFF1EC] hover:text-[#FF6C37] transition-colors group"
          >
            <span className="text-[#787774] group-hover:text-[#FF6C37]">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
            문자 발송
          </button>
        </div>
      </nav>

      {/* 유저 정보 */}
      <div className="px-4 py-4 border-t border-[#E9E9E7]">
        <div className="mb-2">
          <p className="text-sm font-medium text-[#37352F]">데스크 담당자</p>
          <p className="text-xs text-[#787774]">판교 캠퍼스 · staff</p>
        </div>
        <button className="w-full px-3 py-2 text-sm text-[#787774] bg-[#F1F1EF] hover:bg-[#EFEFEE] hover:text-[#37352F] rounded-md transition-colors">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
