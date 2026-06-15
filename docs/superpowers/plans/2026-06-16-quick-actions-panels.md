# Quick Actions (출석체크·문자발송) 패널 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 출석체크와 문자발송을 슬라이드-오버 패널로 구현하고, 사이드바 하단 "빠른 실행" 섹션에서 어느 페이지에서든 트리거할 수 있게 한다.

**Architecture:** `QuickActionsContext`가 패널 열림/닫힘 상태·출석 오버라이드·SMS 수신자 설정을 전역 관리. `AdminLayout`이 `QuickActionsProvider`로 감싸고 `AttendancePanel` / `SmsPanel`을 마운트. `Sidebar`는 컨텍스트를 통해 패널을 열고, `AttendancePanel`은 미도착 처리 후 `SmsPanel`로 체이닝한다.

**Tech Stack:** React 18 Context API, Next.js App Router, Tailwind CSS, `lib/mock-data.ts`

---

## 파일 맵

| 작업 | 파일 |
|------|------|
| 생성 | `components/panels/SlidePanel.tsx` |
| 생성 | `components/panels/QuickActionsContext.tsx` |
| 생성 | `components/panels/AttendancePanel.tsx` |
| 생성 | `components/panels/SmsPanel.tsx` |
| 수정 | `app/(admin)/layout.tsx` |
| 수정 | `components/layout/Sidebar.tsx` |
| 수정 | `app/(admin)/timetable/page.tsx` |

---

### Task 1: SlidePanel 기반 컴포넌트

**Files:**
- Create: `components/panels/SlidePanel.tsx`

기존 `Modal`은 센터 오버레이 방식이므로 우측 슬라이드-오버는 별도 컴포넌트 필요.

- [ ] **Step 1: components/panels/SlidePanel.tsx 생성**

```tsx
'use client';

import { useEffect } from 'react';

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: 'sm' | 'md';
}

export function SlidePanel({ open, onClose, title, children, width = 'md' }: SlidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const widths = { sm: 'w-80', md: 'w-96' };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full ${widths[width]} bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9E9E7] flex-shrink-0">
          <h2 className="text-base font-semibold text-[#37352F]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#787774] hover:text-[#37352F] transition-colors"
            aria-label="닫기"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/panels/SlidePanel.tsx
git commit -m "feat: SlidePanel 슬라이드-오버 기반 컴포넌트 추가"
```

---

### Task 2: QuickActionsContext

**Files:**
- Create: `components/panels/QuickActionsContext.tsx`

패널 열림 상태, SMS 설정, 출석 오버라이드를 전역 관리. 오버라이드를 Context에 보관하면 패널을 닫았다 다시 열어도 처리 내용이 유지된다.

- [ ] **Step 1: components/panels/QuickActionsContext.tsx 생성**

```tsx
'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export interface SmsRecipient {
  studentId: string;
  name: string;
  phone: string;
}

export type SmsTemplate = 'absence' | 'unpaid' | 'custom';

export interface SmsConfig {
  recipients: SmsRecipient[];
  template: SmsTemplate;
}

export type AttendanceOverride = 'late' | 'absent';

interface QuickActionsCtx {
  activePanel: 'attendance' | 'sms' | null;
  openAttendance: () => void;
  openSms: (config?: SmsConfig) => void;
  close: () => void;
  smsConfig: SmsConfig | null;
  attendanceOverrides: Record<string, AttendanceOverride>;
  setOverride: (studentId: string, status: AttendanceOverride) => void;
}

const QuickActionsContext = createContext<QuickActionsCtx | null>(null);

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<'attendance' | 'sms' | null>(null);
  const [smsConfig, setSmsConfig] = useState<SmsConfig | null>(null);
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceOverride>>({});

  const openAttendance = useCallback(() => setActivePanel('attendance'), []);

  const openSms = useCallback((config?: SmsConfig) => {
    if (config) setSmsConfig(config);
    setActivePanel('sms');
  }, []);

  const close = useCallback(() => setActivePanel(null), []);

  const setOverride = useCallback((studentId: string, status: AttendanceOverride) => {
    setAttendanceOverrides(prev => ({ ...prev, [studentId]: status }));
  }, []);

  return (
    <QuickActionsContext.Provider value={{
      activePanel, openAttendance, openSms, close,
      smsConfig, attendanceOverrides, setOverride,
    }}>
      {children}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions() {
  const ctx = useContext(QuickActionsContext);
  if (!ctx) throw new Error('useQuickActions must be used within QuickActionsProvider');
  return ctx;
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/panels/QuickActionsContext.tsx
git commit -m "feat: QuickActionsContext — 패널 상태·출석 오버라이드·SMS 설정 관리"
```

---

### Task 3: AttendancePanel

**Files:**
- Create: `components/panels/AttendancePanel.tsx`

키오스크 자동 출석 현황 표시 + 미도착 학생 즉시 처리 + SMS 패널 체이닝.

- [ ] **Step 1: components/panels/AttendancePanel.tsx 생성**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { SlidePanel } from '@/components/panels/SlidePanel';
import { useQuickActions } from '@/components/panels/QuickActionsContext';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { AttendanceDot } from '@/components/ui/Badge';
import { classes, todaySessions, initialAttendance, getStudentsByClass } from '@/lib/mock-data';

export function AttendancePanel() {
  const { activePanel, close, openSms, attendanceOverrides, setOverride } = useQuickActions();
  const open = activePanel === 'attendance';

  const todayClasses = useMemo(
    () => classes.filter(c => todaySessions.some(s => s.class_id === c.id)),
    []
  );

  const [selectedClassId, setSelectedClassId] = useState(todayClasses[0]?.id ?? '');

  const selectedClass = todayClasses.find(c => c.id === selectedClassId);
  const session = todaySessions.find(s => s.class_id === selectedClassId);
  const classStudents = useMemo(() => getStudentsByClass(selectedClassId), [selectedClassId]);

  const attendedIds = new Set(
    initialAttendance.filter(a => a.status === 'attend').map(a => a.student_id)
  );

  const attendedStudents = classStudents.filter(s => attendedIds.has(s.id));
  const processedStudents = classStudents.filter(s => !attendedIds.has(s.id) && !!attendanceOverrides[s.id]);
  const pendingStudents = classStudents.filter(s => !attendedIds.has(s.id) && !attendanceOverrides[s.id]);

  function handleSendSms() {
    const targets = [...pendingStudents, ...processedStudents];
    openSms({
      recipients: targets.map(s => ({ studentId: s.id, name: s.name, phone: s.parent_phone })),
      template: 'absence',
    });
  }

  return (
    <SlidePanel open={open} onClose={close} title="출석 체크">
      <div className="px-5 py-4 space-y-5">
        {/* 반 선택 */}
        <Select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          options={todayClasses.map(c => ({ value: c.id, label: `${c.schedule} ${c.course}` }))}
        />

        {session && (
          <p className="text-xs text-[#787774]">
            수업시작 {session.start_time} · 담당 {selectedClass?.teacher}
          </p>
        )}

        {/* 키오스크 출석 완료 */}
        {attendedStudents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#0F7B6C] mb-2">
              ✅ 출석 (키오스크) {attendedStudents.length}명
            </p>
            <div className="flex flex-wrap gap-1.5">
              {attendedStudents.map(s => (
                <span
                  key={s.id}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-full text-xs text-[#0F7B6C]"
                >
                  <AttendanceDot status="attend" />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 처리 완료 */}
        {processedStudents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#787774] mb-2">처리 완료 {processedStudents.length}명</p>
            <div className="space-y-1.5">
              {processedStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-[#F7F7F5] rounded-lg">
                  <span className="text-sm text-[#37352F]">{s.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    attendanceOverrides[s.id] === 'late'
                      ? 'bg-[#FFF8E6] text-[#D9A80A]'
                      : 'bg-[#FDECEA] text-[#EB5757]'
                  }`}>
                    {attendanceOverrides[s.id] === 'late' ? '지각' : '결석'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 미도착 */}
        {pendingStudents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#EB5757] mb-2">
              ⚠️ 미도착 {pendingStudents.length}명
            </p>
            <div className="space-y-2">
              {pendingStudents.map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-3 py-2 bg-[#FDECEA]/40 border border-[#EB5757]/20 rounded-lg"
                >
                  <span className="text-sm font-medium text-[#37352F]">{s.name}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setOverride(s.id, 'late')}
                      className="px-2.5 py-1 text-xs rounded-md bg-[#FFF8E6] text-[#D9A80A] border border-[#D9A80A]/30 hover:bg-[#D9A80A]/10 transition-colors"
                    >
                      지각
                    </button>
                    <button
                      onClick={() => setOverride(s.id, 'absent')}
                      className="px-2.5 py-1 text-xs rounded-md bg-[#FDECEA] text-[#EB5757] border border-[#EB5757]/30 hover:bg-[#EB5757]/10 transition-colors"
                    >
                      결석
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전원 출석 */}
        {pendingStudents.length === 0 && processedStudents.length === 0 && attendedStudents.length > 0 && (
          <div className="text-center py-4 text-sm text-[#0F7B6C] font-medium">
            🎉 전원 출석 완료
          </div>
        )}

        {/* 문자발송 연동 */}
        {(pendingStudents.length > 0 || processedStudents.length > 0) && (
          <div className="pt-2 border-t border-[#E9E9E7]">
            <Button className="w-full" variant="secondary" onClick={handleSendSms}>
              미도착/결석 {pendingStudents.length + processedStudents.length}명 문자발송
            </Button>
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/panels/AttendancePanel.tsx
git commit -m "feat: AttendancePanel 출석체크 슬라이드-오버 패널 추가"
```

---

### Task 4: SmsPanel

**Files:**
- Create: `components/panels/SmsPanel.tsx`

컨텍스트 기반 수신자 자동 세팅, 템플릿 3종, 90자 제한 메시지.

- [ ] **Step 1: components/panels/SmsPanel.tsx 생성**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { SlidePanel } from '@/components/panels/SlidePanel';
import { useQuickActions, SmsRecipient, SmsTemplate } from '@/components/panels/QuickActionsContext';
import { Button } from '@/components/ui/Button';

const TEMPLATES: Record<SmsTemplate, string> = {
  absence: '[D.LAB 판교] 안녕하세요. 오늘 수업에 미도착/결석 처리되었습니다. 문의: 031-000-0000',
  unpaid: '[D.LAB 판교] 안녕하세요. 이번 달 수강료 미납 안내드립니다. 확인 부탁드립니다.',
  custom: '',
};

const TEMPLATE_LABELS: Record<SmsTemplate, string> = {
  absence: '결석 알림',
  unpaid: '미납 안내',
  custom: '직접 입력',
};

export function SmsPanel() {
  const { activePanel, close, smsConfig } = useQuickActions();
  const open = activePanel === 'sms';

  const [recipients, setRecipients] = useState<SmsRecipient[]>([]);
  const [template, setTemplate] = useState<SmsTemplate>('custom');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open && smsConfig) {
      setRecipients(smsConfig.recipients);
      setTemplate(smsConfig.template);
      setMessage(TEMPLATES[smsConfig.template]);
      setSent(false);
    }
    if (!open) setSent(false);
  }, [open, smsConfig]);

  function handleTemplateChange(t: SmsTemplate) {
    setTemplate(t);
    setMessage(TEMPLATES[t]);
  }

  function removeRecipient(studentId: string) {
    setRecipients(prev => prev.filter(r => r.studentId !== studentId));
  }

  function handleSend() {
    if (!message.trim() || recipients.length === 0) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(close, 1200);
    }, 800);
  }

  return (
    <SlidePanel open={open} onClose={close} title="문자 발송">
      <div className="px-5 py-4 space-y-5">
        {/* 수신자 */}
        <div>
          <p className="text-xs font-semibold text-[#787774] mb-2">수신자</p>
          <div className="flex flex-wrap gap-1.5 p-3 bg-[#F7F7F5] rounded-lg min-h-[48px]">
            {recipients.length === 0 && (
              <span className="text-xs text-[#787774]">수신자를 선택하세요</span>
            )}
            {recipients.map(r => (
              <span
                key={r.studentId}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E9E9E7] rounded-full text-xs text-[#37352F]"
              >
                {r.name} 부모님
                <button
                  onClick={() => removeRecipient(r.studentId)}
                  className="text-[#787774] hover:text-[#EB5757] ml-0.5 transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 템플릿 */}
        <div>
          <p className="text-xs font-semibold text-[#787774] mb-2">템플릿</p>
          <div className="flex gap-2">
            {(['absence', 'unpaid', 'custom'] as SmsTemplate[]).map(t => (
              <button
                key={t}
                onClick={() => handleTemplateChange(t)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  template === t
                    ? 'bg-[#FF6C37] text-white border-[#FF6C37]'
                    : 'bg-white text-[#787774] border-[#E9E9E7] hover:border-[#FF6C37]/50'
                }`}
              >
                {TEMPLATE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* 메시지 */}
        <div>
          <p className="text-xs font-semibold text-[#787774] mb-2">메시지</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 90))}
            rows={4}
            placeholder="메시지를 입력하세요"
            className="w-full px-3 py-2.5 text-sm text-[#37352F] bg-white border border-[#E9E9E7] rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#FF6C37] focus:border-[#FF6C37]"
          />
          <p className={`text-right text-xs mt-1 ${message.length >= 85 ? 'text-[#EB5757]' : 'text-[#787774]'}`}>
            {message.length} / 90자
          </p>
        </div>

        {/* 발송 */}
        {sent ? (
          <div className="text-center py-3 bg-[#EDF7F5] rounded-lg text-sm font-semibold text-[#0F7B6C]">
            ✓ 발송 완료
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleSend}
            loading={sending}
            disabled={recipients.length === 0 || !message.trim()}
          >
            {recipients.length > 0 ? `${recipients.length}명에게 발송` : '발송하기'}
          </Button>
        )}
      </div>
    </SlidePanel>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add components/panels/SmsPanel.tsx
git commit -m "feat: SmsPanel 문자발송 슬라이드-오버 패널 추가"
```

---

### Task 5: AdminLayout — Provider + 패널 마운트

**Files:**
- Modify: `app/(admin)/layout.tsx`

`QuickActionsProvider`는 Client Component이므로 layout.tsx는 server component를 유지하면서 import만 추가. Provider 안에 Sidebar, main, 패널 2개를 함께 배치.

- [ ] **Step 1: app/(admin)/layout.tsx 수정**

```tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { QuickActionsProvider } from '@/components/panels/QuickActionsContext';
import { AttendancePanel } from '@/components/panels/AttendancePanel';
import { SmsPanel } from '@/components/panels/SmsPanel';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <QuickActionsProvider>
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen">
          <div className="max-w-[1440px] mx-auto px-10 py-10">
            {children}
          </div>
        </main>
        <AttendancePanel />
        <SmsPanel />
      </QuickActionsProvider>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/(admin)/layout.tsx
git commit -m "feat: AdminLayout에 QuickActionsProvider 및 패널 마운트"
```

---

### Task 6: Sidebar — 빠른 실행 섹션 추가

**Files:**
- Modify: `components/layout/Sidebar.tsx`

`/timetable` 항목 제거, `useQuickActions` 연동, 사이드바 하단에 "빠른 실행" 섹션 추가.

- [ ] **Step 1: components/layout/Sidebar.tsx 전체 교체**

```tsx
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
    href: '/attendance',
    label: '출결 현황',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    href: '/dashboard',
    label: '매출 대시보드',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
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

        {/* 키오스크 링크 */}
        <div className="mt-4 pt-4 border-t border-[#E9E9E7]">
          <Link
            href="/kiosk"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#787774] hover:bg-[#EFEFEE] transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            키오스크 화면
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
```

- [ ] **Step 2: 커밋**

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: Sidebar에 빠른 실행 섹션 추가, /timetable 메뉴 제거"
```

---

### Task 7: /timetable → /attendance 리디렉트

**Files:**
- Modify: `app/(admin)/timetable/page.tsx`

출석체크 기능이 패널로 이전됐으므로 기존 URL은 출결 현황으로 리디렉트.

- [ ] **Step 1: timetable/page.tsx를 리디렉트로 교체**

```tsx
import { redirect } from 'next/navigation';

export default function TimetablePage() {
  redirect('/attendance');
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/(admin)/timetable/page.tsx
git commit -m "feat: /timetable → /attendance 리디렉트 (출석체크 패널로 대체)"
```

---

## Self-Review

**스펙 커버리지:**
- ✅ 사이드바 "빠른 실행" 섹션 — Task 6
- ✅ /timetable 메뉴 제거 — Task 6
- ✅ 출석체크 슬라이드-오버 패널 — Task 3
- ✅ 즉시 저장 (낙관적 업데이트) — `setOverride` 클릭 즉시 호출 — Task 3
- ✅ 패널 닫혀도 상태 유지 — Context의 `attendanceOverrides` — Task 2
- ✅ 키오스크 출석자 읽기 전용 — Task 3
- ✅ 미도착 → 지각/결석 버튼 — Task 3
- ✅ "미도착 N명 문자발송" → SMS 패널 체이닝 — Task 3
- ✅ 문자발송 3가지 트리거 — Task 4 + Task 6
- ✅ 컨텍스트별 수신자 자동 세팅 — Task 4 `useEffect`
- ✅ 템플릿 3종 — Task 4
- ✅ 90자 제한 — Task 4

**타입 일관성:**
- `SmsRecipient`, `SmsTemplate`, `SmsConfig`, `AttendanceOverride` — QuickActionsContext 정의 → AttendancePanel·SmsPanel import ✅
- `SlidePanel` props `open/onClose/title/children/width` — Task 1 정의, Task 3·4 동일하게 사용 ✅
