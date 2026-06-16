# 출석 시연 재생(Demo Playback) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 빠른 실행 "출석 체크" 패널에 재생 버튼을 추가해, 키오스크 순차 체크인을 1.2초 간격으로 시뮬레이션하고 미도착→출석 실시간 이동을 시연한다.

**Architecture:** 데모 로직 전부를 격리된 훅 `useAttendanceDemo.ts`에 담는다. `AttendancePanel`은 훅이 노출하는 값(`demoAttendedIds` 등)만 소비하며, 데모 관련 코드는 모두 `DEMO ONLY` 마커로 감싼다 → 삭제 시 파일 1개 삭제 + 마커 블록 제거로 끝나는 임시(throwaway) 기능.

**Tech Stack:** React 18 hooks(useState/useEffect/useRef/useCallback), Next.js App Router, Tailwind CSS, `lib/mock-data.ts`의 기존 `demoCheckinSequence`.

> **테스트 정책:** 이 프로젝트에는 테스트 러너(vitest/jest 등)가 없고, 본 기능은 추후 삭제할 데모용이다. 따라서 TDD 대신 기존 코드베이스 관례대로 **`npx tsc --noEmit` 타입 체크 + `npm run dev` 수동 스모크 테스트**로 검증한다.

---

## 파일 맵

| 작업 | 파일 | 책임 |
|------|------|------|
| 생성 | `components/panels/useAttendanceDemo.ts` | 데모 재생 상태·타이머·초기화 로직 격리 (DEMO ONLY 전용 파일) |
| 수정 | `components/panels/AttendancePanel.tsx` | 훅 소비 + 출석 id 합집합 병합 + 시연 컨트롤 바 (모두 DEMO ONLY 마커) |

---

### Task 1: 격리된 데모 훅 생성

**Files:**
- Create: `components/panels/useAttendanceDemo.ts`

`demoCheckinSequence`를 `STEP_MS`(1200ms) 간격으로 한 명씩 점등. `active`(패널 열림 여부)가 false가 되면 자동 초기화. 언마운트 시 타이머 정리.

- [ ] **Step 1: components/panels/useAttendanceDemo.ts 생성**

```ts
// components/panels/useAttendanceDemo.ts — DEMO ONLY, 추후 삭제
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { demoCheckinSequence } from '@/lib/mock-data';

const STEP_MS = 1200;

export interface AttendanceDemo {
  demoAttendedIds: Set<string>;
  playedCount: number;
  totalCount: number;
  isPlaying: boolean;
  isComplete: boolean;
  play: () => void;
  reset: () => void;
}

export function useAttendanceDemo(active: boolean): AttendanceDemo {
  const [demoAttendedIds, setDemoAttendedIds] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);

  const totalCount = demoCheckinSequence.length;
  const playedCount = demoAttendedIds.size;
  const isComplete = playedCount >= totalCount;

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    stepRef.current = 0;
    setIsPlaying(false);
    setDemoAttendedIds(new Set());
  }, []);

  const play = useCallback(() => {
    if (isPlaying || stepRef.current >= demoCheckinSequence.length) return;
    setIsPlaying(true);

    const tick = () => {
      const entry = demoCheckinSequence[stepRef.current];
      if (!entry) {
        setIsPlaying(false);
        timerRef.current = null;
        return;
      }
      setDemoAttendedIds(prev => {
        const next = new Set(prev);
        next.add(entry.student_id);
        return next;
      });
      stepRef.current += 1;
      if (stepRef.current < demoCheckinSequence.length) {
        timerRef.current = setTimeout(tick, STEP_MS);
      } else {
        setIsPlaying(false);
        timerRef.current = null;
      }
    };

    timerRef.current = setTimeout(tick, STEP_MS);
  }, [isPlaying]);

  // 패널 닫힘(active=false) 시 자동 초기화
  useEffect(() => {
    if (!active) reset();
  }, [active, reset]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { demoAttendedIds, playedCount, totalCount, isPlaying, isComplete, play, reset };
}
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (출력 없이 종료)

- [ ] **Step 3: 커밋**

```bash
git add components/panels/useAttendanceDemo.ts
git commit -m "feat: useAttendanceDemo 데모 재생 훅 추가 (DEMO ONLY)"
```

---

### Task 2: AttendancePanel에 훅 연동 + 시연 컨트롤 바

**Files:**
- Modify: `components/panels/AttendancePanel.tsx`

훅을 소비해 데모 점등 학생을 기존 출석자 집합에 합치고, 세션 정보 줄 아래에 시연 컨트롤 바를 추가한다. 모든 데모 코드는 `// DEMO ONLY ↓↓↓ ~ ↑↑↑` 마커로 감싼다.

- [ ] **Step 1: import 추가 (파일 상단 import 블록 끝)**

`AttendancePanel.tsx`의 마지막 import 줄
```tsx
import { classes, todaySessions, initialAttendance, getStudentsByClass } from '@/lib/mock-data';
```
바로 아래에 추가:
```tsx
// DEMO ONLY ↓↓↓
import { useAttendanceDemo } from '@/components/panels/useAttendanceDemo';
// DEMO ONLY ↑↑↑
```

- [ ] **Step 2: 훅 호출 + 반 변경 시 초기화 effect 추가**

`const open = activePanel === 'attendance';` 줄 바로 아래에 추가:
```tsx
// DEMO ONLY ↓↓↓
const demo = useAttendanceDemo(open);
// DEMO ONLY ↑↑↑
```

그리고 `const classStudents = useMemo(...)` 줄 바로 아래에 추가(반 변경 시 데모 초기화):
```tsx
// DEMO ONLY ↓↓↓ — 반 변경 시 데모 초기화
useEffect(() => { demo.reset(); }, [selectedClassId, demo.reset]);
// DEMO ONLY ↑↑↑
```

이를 위해 1번째 줄 React import에 `useEffect`를 추가한다. 기존:
```tsx
import { useState, useMemo } from 'react';
```
변경:
```tsx
import { useState, useMemo, useEffect } from 'react';
```

- [ ] **Step 3: 출석 id 합집합 병합**

기존 블록:
```tsx
  const attendedIds = new Set(
    initialAttendance.filter(a => a.status === 'attend').map(a => a.student_id)
  );
```
바로 아래에 데모 병합 추가:
```tsx
  // DEMO ONLY ↓↓↓ — 데모 점등 학생을 출석에 합침
  demo.demoAttendedIds.forEach(id => attendedIds.add(id));
  // DEMO ONLY ↑↑↑
```

- [ ] **Step 4: 시연 컨트롤 바 JSX 추가**

세션 정보 블록:
```tsx
        {session && (
          <p className="text-xs text-[#787774]">
            수업시작 {session.start_time} · 담당 {selectedClass?.teacher}
          </p>
        )}
```
바로 아래에 추가:
```tsx
        {/* DEMO ONLY ↓↓↓ — 시연 재생 컨트롤 (추후 삭제) */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#FF6C37]/40 bg-[#FFF8F5]">
          <span className="text-[10px] font-semibold text-[#FF6C37] uppercase tracking-wider">시연</span>
          <button
            onClick={demo.play}
            disabled={demo.isPlaying || demo.isComplete}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-[#FF6C37] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E85A27] transition-colors"
          >
            ▶ {demo.isPlaying ? '시연 중…' : '출석 시연'}
          </button>
          <button
            onClick={demo.reset}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-[#E9E9E7] text-[#787774] hover:bg-white transition-colors"
          >
            ↺ 초기화
          </button>
          <span className="ml-auto text-xs text-[#787774]">{demo.playedCount}/{demo.totalCount}</span>
        </div>
        {/* DEMO ONLY ↑↑↑ */}
```

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 수동 스모크 테스트**

Run: `npm run dev`
확인 절차:
1. 사이드바 하단 "빠른 실행" → "출석 체크" 클릭 → 패널 열림.
2. 반 선택이 첫 수업(09:00)인 상태에서 점선 테두리 "시연" 바의 `▶ 출석 시연` 클릭.
3. 약 1.2초 간격으로 미도착 학생이 한 명씩 "✅ 출석(키오스크)"로 이동, 진행 표시 `(n/7)` 증가.
4. 완료 후 s-06·s-09·s-12·s-14는 미도착 잔류.
5. `↺ 초기화` 클릭 → 처음 상태로 복귀.
6. 패널을 닫았다 다시 열면 데모가 초기화돼 있음.

Expected: 위 6단계 모두 정상.

- [ ] **Step 7: 커밋**

```bash
git add components/panels/AttendancePanel.tsx
git commit -m "feat: 출석 패널에 시연 재생 컨트롤 추가 (DEMO ONLY)"
```

---

## Self-Review

**스펙 커버리지:**
- ✅ 재생 버튼으로 1.2초 간격 순차 점등 — Task 1 `STEP_MS=1200` + Task 2 컨트롤 바
- ✅ 미도착→출석 실시간 이동 — Task 2 Step 3 합집합 병합
- ✅ 종료 후 미도착 잔류(s-06·s-09·s-12·s-14) — 시퀀스에 없는 학생은 병합 대상 아님
- ✅ 재생 + 초기화 컨트롤 — Task 2 Step 4
- ✅ 진행 표시 (n/총) — `playedCount`/`totalCount`
- ✅ 패널 닫으면 초기화 — Task 1 `useEffect(() => { if (!active) reset(); })`
- ✅ 반 변경 시 초기화 — Task 2 Step 2 effect
- ✅ 시각적 격리(점선 테두리) — Task 2 Step 4
- ✅ 삭제 용이성 — 파일 1개 + `DEMO ONLY` 마커 블록

**플레이스홀더 스캔:** 없음. 모든 스텝에 실제 코드/명령 포함.

**타입 일관성:**
- `useAttendanceDemo(active: boolean): AttendanceDemo` — Task 1 정의 → Task 2 `useAttendanceDemo(open)` 호출 ✅
- `AttendanceDemo` 필드 `demoAttendedIds/playedCount/totalCount/isPlaying/isComplete/play/reset` — Task 2에서 `demo.demoAttendedIds`, `demo.play`, `demo.reset`, `demo.isPlaying`, `demo.isComplete`, `demo.playedCount`, `demo.totalCount` 사용 ✅
- `demoCheckinSequence` (mock-data 기존 export, `{ student_id, checked_in_at }[]`) — Task 1에서 `entry.student_id` 사용 ✅
