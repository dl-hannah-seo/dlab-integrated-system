# 시간표 페이지 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/schedule` 라우트에 학기별 수업 시간표를 주간 그리드 + 요일 카드 두 가지 뷰로 보여주는 페이지를 추가하고, 사이드바에 "시간표" 메뉴를 삽입한다.

**Architecture:** 기존 `lib/mock-data.ts`의 `ClassGroup` · `Class` · `Semester`를 조합해 클라이언트 컴포넌트 하나(`app/(admin)/schedule/page.tsx`)에서 모든 뷰를 렌더링한다. 별도 서버 액션/API 없음. 팝오버는 외부 라이브러리 없이 `useState` + `getBoundingClientRect`로 구현한다.

**Tech Stack:** Next.js App Router, React 18 (`'use client'`), Tailwind CSS, `lib/mock-data.ts` (mock)

---

## 파일 맵

| 동작 | 경로 | 역할 |
|------|------|------|
| **수정** | `components/layout/Sidebar.tsx` | "시간표" 메뉴 항목 추가 |
| **생성** | `app/(admin)/schedule/page.tsx` | 시간표 페이지 전체 |

---

## Task 1: 사이드바에 "시간표" 메뉴 추가

**Files:**
- Modify: `components/layout/Sidebar.tsx` (adminNav 배열)

- [ ] **Step 1: adminNav에 시간표 항목 삽입**

`components/layout/Sidebar.tsx` 의 `adminNav` 배열에서 `href: '/timetable'` 항목 바로 아래에 추가:

```tsx
const adminNav: NavItem[] = [
  {
    href: '/timetable',
    label: '출석 체크',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  // ── 아래 항목 추가 ──
  {
    href: '/schedule',
    label: '시간표',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>,
  },
  // ── 기존 항목 유지 ──
  {
    href: '/attendance',
    // ...
```

- [ ] **Step 2: TypeScript 확인**

```bash
cd "C:/Users/user/OneDrive/Desktop/통합시스템" && npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

오류 없으면 통과.

- [ ] **Step 3: 커밋**

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: 사이드바에 시간표 메뉴 추가 (/schedule)"
```

---

## Task 2: 페이지 기본 구조 — 헤더 + 상태 + 헬퍼

**Files:**
- Create: `app/(admin)/schedule/page.tsx`

- [ ] **Step 1: 파일 생성 — 헬퍼 함수 + 상태 선언**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { classes, classGroups, semesters, Class, ClassGroup } from '@/lib/mock-data';

// ── 헬퍼 ────────────────────────────────────────────────────────
const DAY_ORDER = ['월', '화', '수', '목', '금', '토'] as const;

function parseDays(dayGroup: string): string[] {
  const map: Record<string, string[]> = {
    '토': ['토'],
    '화목': ['화', '목'],
    '월수금': ['월', '수', '금'],
  };
  return map[dayGroup] ?? [...dayGroup];
}

function fmtSlot(slot: string): string {
  return `${slot.slice(0, 2)}:${slot.slice(2)}`;
}

function dayLabel(dayGroup: string): string {
  const map: Record<string, string> = {
    '토': '토요일',
    '화목': '화요일 · 목요일',
    '월수금': '월·수·금요일',
  };
  return map[dayGroup] ?? dayGroup;
}

function fmtCurrency(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function blockColor(dayGroup: string) {
  if (dayGroup === '토') return { block: '#FF6C37', colBg: '#FFF8F5', headerText: '#FF6C37' };
  return { block: '#3B82F6', colBg: '#F0F7FF', headerText: '#3B82F6' };
}

type Popover = { cls: Class; group: ClassGroup; top: number; left: number };

// ── 메인 ────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [selectedSemId, setSelectedSemId] = useState('sem-01');
  const [view, setView] = useState<'grid' | 'card'>('grid');
  const [popover, setPopover] = useState<Popover | null>(null);

  // 선택된 학기의 반 목록
  const semGroups = classGroups.filter(g => g.semester_id === selectedSemId);
  const semClasses = classes.filter(c =>
    semGroups.some(g => g.id === c.class_group_id),
  );

  const sem = semesters.find(s => s.id === selectedSemId);

  function handleBlockClick(
    e: React.MouseEvent<HTMLDivElement>,
    cls: Class,
    group: ClassGroup,
  ) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ cls, group, top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 224) });
  }

  return (
    <div onClick={() => setPopover(null)}>
      {/* 헤더 */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#37352F]">시간표</h1>
          <p className="text-sm text-[#787774] mt-1">
            {sem ? `${sem.year}년 ${sem.season}학기` : ''} · 판교 캠퍼스
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 학기 선택 */}
          <select
            value={selectedSemId}
            onChange={e => setSelectedSemId(e.target.value)}
            className="text-sm border border-[#E9E9E7] rounded-lg px-3 py-1.5 text-[#37352F] bg-white focus:outline-none"
          >
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.year} {s.season}학기</option>
            ))}
          </select>
          {/* 뷰 토글 */}
          <div className="flex bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg p-0.5">
            {(['grid', 'card'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  view === v ? 'bg-white text-[#37352F] shadow-sm' : 'text-[#787774]'
                }`}
              >
                {v === 'grid' ? '그리드' : '카드'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 뷰 렌더링 — Task 3, 4에서 추가 */}
      <p className="text-sm text-[#787774]">뷰 구현 예정</p>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
cd "C:/Users/user/OneDrive/Desktop/통합시스템" && npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add app/"(admin)"/schedule/page.tsx
git commit -m "feat: 시간표 페이지 스캐폴드 — 헤더·학기 선택·뷰 토글"
```

---

## Task 3: 주간 그리드 뷰

**Files:**
- Modify: `app/(admin)/schedule/page.tsx` — GridView 컴포넌트 + 메인에 삽입

- [ ] **Step 1: 그리드 데이터 계산 로직 + GridView 컴포넌트 추가**

`SchedulePage` 함수 바깥(파일 하단)에 추가:

```tsx
function GridView({
  semClasses,
  semGroups,
  onBlockClick,
}: {
  semClasses: Class[];
  semGroups: ClassGroup[];
  onBlockClick: (e: React.MouseEvent<HTMLDivElement>, cls: Class, group: ClassGroup) => void;
}) {
  // 시간대 목록 (정렬)
  const times = [...new Set(semGroups.map(g => fmtSlot(g.time_slot)))].sort();

  // 셀 맵: { day: { time: { cls, group } } }
  const cellMap: Record<string, Record<string, { cls: Class; group: ClassGroup }>> = {};
  for (const cls of semClasses) {
    const group = semGroups.find(g => g.id === cls.class_group_id);
    if (!group) continue;
    for (const day of parseDays(group.day_group)) {
      if (!cellMap[day]) cellMap[day] = {};
      cellMap[day][fmtSlot(group.time_slot)] = { cls, group };
    }
  }

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid border-b border-[#E9E9E7]" style={{ gridTemplateColumns: '52px repeat(6, 1fr)' }}>
        <div className="bg-[#F7F7F5] px-3 py-3" />
        {DAY_ORDER.map(day => {
          const isSat = day === '토';
          return (
            <div
              key={day}
              className="px-3 py-3 text-center text-sm font-semibold border-l border-[#E9E9E7]"
              style={{ background: isSat ? '#FFF8F5' : '#F7F7F5', color: isSat ? '#FF6C37' : '#787774' }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 시간대 행 */}
      {times.map((time, idx) => (
        <div
          key={time}
          className="grid border-[#E9E9E7]"
          style={{
            gridTemplateColumns: '52px repeat(6, 1fr)',
            borderBottomWidth: idx < times.length - 1 ? 1 : 0,
            borderBottomStyle: 'solid',
            minHeight: 68,
          }}
        >
          {/* 시간 레이블 */}
          <div className="px-3 py-3 bg-[#F7F7F5] border-r border-[#E9E9E7] flex items-center">
            <span className="text-xs font-semibold text-[#787774]">{time}</span>
          </div>

          {/* 요일 셀 */}
          {DAY_ORDER.map(day => {
            const cell = cellMap[day]?.[time];
            const isSat = day === '토';
            const color = cell ? blockColor(cell.group.day_group) : null;
            return (
              <div
                key={day}
                className="border-l border-[#E9E9E7] p-1.5"
                style={{ background: isSat && !cell ? '#FFFBF9' : undefined }}
              >
                {cell && color && (
                  <div
                    onClick={e => onBlockClick(e, cell.cls, cell.group)}
                    className="h-full rounded-md px-2 py-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: color.block }}
                  >
                    <p className="text-xs font-semibold text-white leading-tight">{cell.cls.course}</p>
                    <p className="text-xs text-white/80 mt-0.5">{cell.cls.teacher}</p>
                    <p className="text-xs text-white/70">{cell.cls.enrolled_count}명</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: SchedulePage 본문에서 GridView 렌더링**

`"뷰 구현 예정"` 플레이스홀더를 아래로 교체:

```tsx
      {view === 'grid' && (
        <GridView
          semClasses={semClasses}
          semGroups={semGroups}
          onBlockClick={handleBlockClick}
        />
      )}
      {view === 'card' && (
        <p className="text-sm text-[#787774]">카드 뷰 구현 예정</p>
      )}
```

- [ ] **Step 3: TypeScript 확인**

```bash
cd "C:/Users/user/OneDrive/Desktop/통합시스템" && npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

- [ ] **Step 4: 커밋**

```bash
git add app/"(admin)"/schedule/page.tsx
git commit -m "feat: 시간표 주간 그리드 뷰 구현"
```

---

## Task 4: 요일별 카드 뷰

**Files:**
- Modify: `app/(admin)/schedule/page.tsx` — CardView 컴포넌트 추가

- [ ] **Step 1: CardView 컴포넌트 추가** (파일 하단, GridView 아래)

```tsx
function CardView({
  semClasses,
  semGroups,
  onBlockClick,
}: {
  semClasses: Class[];
  semGroups: ClassGroup[];
  onBlockClick: (e: React.MouseEvent<HTMLDivElement>, cls: Class, group: ClassGroup) => void;
}) {
  // 고유 day_group 순서 유지 (ClassGroup 순서 기준)
  const uniqueGroups = semGroups.reduce<ClassGroup[]>((acc, g) => {
    if (!acc.some(a => a.day_group === g.day_group)) acc.push(g);
    return acc;
  }, []);

  return (
    <div className="space-y-4">
      {uniqueGroups.map(groupRep => {
        const color = blockColor(groupRep.day_group);
        // 이 day_group에 속하는 ClassGroup들 (시간순)
        const slots = semGroups
          .filter(g => g.day_group === groupRep.day_group)
          .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

        return (
          <div key={groupRep.day_group} className="bg-white border border-[#E9E9E7] rounded-lg overflow-hidden">
            {/* 카드 헤더 */}
            <div
              className="px-5 py-3 border-b border-[#E9E9E7]"
              style={{ background: color.colBg }}
            >
              <span className="text-sm font-semibold" style={{ color: color.block }}>
                {dayLabel(groupRep.day_group)}
              </span>
            </div>

            {/* 시간대 행 */}
            <div className="divide-y divide-[#E9E9E7]">
              {slots.map(slot => {
                const cls = semClasses.find(c => c.class_group_id === slot.id);
                if (!cls) return null;
                return (
                  <div
                    key={slot.id}
                    onClick={e => onBlockClick(e, cls, slot)}
                    className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[#F7F7F5] transition-colors"
                  >
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded text-white min-w-[52px] text-center"
                      style={{ background: color.block }}
                    >
                      {fmtSlot(slot.time_slot)}
                    </span>
                    <span className="text-sm font-medium text-[#37352F]">{cls.course}</span>
                    <span className="text-sm text-[#787774]">{cls.teacher} 선생님</span>
                    <span className="text-sm text-[#787774] ml-auto">{cls.enrolled_count}명</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: SchedulePage에서 CardView 렌더링**

`"카드 뷰 구현 예정"` 플레이스홀더를 교체:

```tsx
      {view === 'card' && (
        <CardView
          semClasses={semClasses}
          semGroups={semGroups}
          onBlockClick={handleBlockClick}
        />
      )}
```

- [ ] **Step 3: TypeScript 확인**

```bash
cd "C:/Users/user/OneDrive/Desktop/통합시스템" && npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

- [ ] **Step 4: 커밋**

```bash
git add app/"(admin)"/schedule/page.tsx
git commit -m "feat: 시간표 요일별 카드 뷰 구현"
```

---

## Task 5: 팝오버

**Files:**
- Modify: `app/(admin)/schedule/page.tsx` — ClassPopover 컴포넌트 + 렌더링

- [ ] **Step 1: ClassPopover 컴포넌트 추가** (파일 하단)

```tsx
function ClassPopover({
  popover,
  onClose,
}: {
  popover: Popover;
  onClose: () => void;
}) {
  const { cls, group, top, left } = popover;
  const color = blockColor(group.day_group);

  return (
    <div
      onClick={e => e.stopPropagation()}
      className="fixed z-50 w-56 bg-white border border-[#E9E9E7] rounded-lg shadow-xl"
      style={{ top, left }}
    >
      {/* 팝오버 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E9E9E7]">
        <span className="text-sm font-semibold" style={{ color: color.block }}>
          {cls.course}
        </span>
        <button
          onClick={onClose}
          className="text-[#787774] hover:text-[#37352F] text-xs"
        >
          ✕
        </button>
      </div>

      {/* 팝오버 내용 */}
      <div className="px-4 py-3 space-y-1.5 text-sm text-[#37352F]">
        <p>📅 {dayLabel(group.day_group)} {fmtSlot(group.time_slot)}</p>
        <p>👨‍🏫 {cls.teacher} 선생님</p>
        <p>
          👥 {cls.enrolled_count}명{' '}
          <span className="text-[#787774]">/ 정원 {cls.capacity}명</span>
        </p>
        <p>📆 {cls.start_date} ~ {cls.end_date}</p>
        <p>
          💰 {cls.payment_method === '매월' ? '월 ' : '일시 '}
          {fmtCurrency(cls.tuition_fee)}
        </p>
      </div>

      {/* 하단 링크 */}
      <div className="px-4 py-3 border-t border-[#E9E9E7]">
        <Link
          href={`/classes/${cls.id}`}
          className="text-xs text-[#3B82F6] hover:underline"
        >
          반 상세 페이지로 이동 →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: SchedulePage 반환부에 팝오버 렌더링 추가**

`</div>` 닫기 태그 바로 앞(최상위 div 안쪽 끝)에 추가:

```tsx
      {popover && (
        <ClassPopover popover={popover} onClose={() => setPopover(null)} />
      )}
    </div>  {/* 최상위 div 닫기 */}
```

- [ ] **Step 3: TypeScript 확인**

```bash
cd "C:/Users/user/OneDrive/Desktop/통합시스템" && npx tsc --noEmit --project tsconfig.json 2>&1 | head -20
```

- [ ] **Step 4: 커밋**

```bash
git add app/"(admin)"/schedule/page.tsx
git commit -m "feat: 시간표 수업 블록 팝오버 구현"
```

---

## 검증 체크리스트

구현 완료 후 브라우저에서 직접 확인:

- [ ] 사이드바 "시간표" 클릭 → `/schedule` 진입
- [ ] 헤더에 "2026년 여름학기 · 판교 캠퍼스" 표시
- [ ] 그리드 뷰: 토 09~11시(오렌지), 화목 16~18시(블루) 블록 표시
- [ ] 그리드 → 카드 토글 전환
- [ ] 카드 뷰: 토요일 / 화요일·목요일 그룹 카드 표시
- [ ] 학기 드롭다운에서 "2025 봄학기" 선택 → 해당 수업만 표시
- [ ] 수업 블록 클릭 → 팝오버 표시 (수업명·선생님·인원·기간·요금)
- [ ] 팝오버 "반 상세 페이지로 이동" 클릭 → `/classes/[id]` 이동
- [ ] 팝오버 외부 클릭 → 팝오버 닫힘
