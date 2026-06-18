'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Role, ROLE_STORAGE_KEY as STORAGE_KEY } from '@/lib/roles';

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  ready: boolean;   // localStorage 로드 완료(하이드레이션 후)
}

const RoleContext = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>('원장');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    if (saved) setRoleState(saved);
    setReady(true);
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, r);
  }, []);

  return <RoleContext.Provider value={{ role, setRole, ready }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
