# 출석 시연 재생(Demo Playback) 기능 설계

> **임시(throwaway) 기능.** 데모 시연 목적이며 추후 삭제 예정. 삭제 용이성을 1순위 제약으로 설계한다.

## 목표

빠른 실행 → "출석 체크" 패널에서 **재생 버튼**을 누르면, 키오스크를 통해 아이들이 순차적으로 체크인하는 상황을 1.2초 간격으로 시뮬레이션한다. 시퀀스 학생들이 "⚠️ 미도착"에서 "✅ 출석(키오스크)"으로 실시간 이동하는 모습을 시연한다.

## 결정 사항

- **종료 동작:** 시퀀스(s-03~s-13) 점등 완료 후 멈춤. 끝까지 안 온 학생(s-06·s-09·s-12·s-14)은 "미도착"으로 잔류 → 이후 수동 지각/결석 처리·문자발송 플로우까지 자연스럽게 시연.
- **컨트롤:** 재생(▶) + 초기화(↺).
- **속도:** 1.2초 간격 (`STEP_MS = 1200`).
- **패널 닫으면 데모 초기화** — 매 시연을 처음부터 시작.

## 아키텍처 (격리된 훅)

데모 로직 전부를 `components/panels/useAttendanceDemo.ts` 한 파일에 격리한다. `AttendancePanel`은 훅이 노출하는 값만 소비하므로, 삭제 시 **파일 1개 삭제 + 패널의 표시된(DEMO ONLY) 블록 제거**로 끝난다.

### 인터페이스

```ts
// components/panels/useAttendanceDemo.ts — DEMO ONLY, 추후 삭제
function useAttendanceDemo(active: boolean): {
  demoAttendedIds: Set<string>;  // 지금까지 점등된 학생 id
  playedCount: number;           // 진행 표시용 (n)
  totalCount: number;            // 시퀀스 전체 (= demoCheckinSequence.length)
  isPlaying: boolean;
  isComplete: boolean;           // 시퀀스 전부 점등됨
  play: () => void;
  reset: () => void;             // 타이머 정지 + Set 비우기
}
```

- `demoCheckinSequence`(mock-data에 기존재)를 `STEP_MS` 간격으로 한 명씩 `demoAttendedIds`에 추가.
- `active`(= 패널 열림 여부)가 `false`가 되면 자동 `reset()` → "패널 닫으면 초기화" 구현.
- 언마운트·초기화 시 `clearTimeout`으로 타이머 정리(메모리 누수/유령 타이머 방지).

## 데이터 흐름

1. `AttendancePanel`이 `useAttendanceDemo(open)` 호출.
2. 기존 `attendedIds`(initialAttendance 기반)와 `demoAttendedIds`를 **합집합**으로 묶어 출석/처리완료/미도착 분류.
3. 재생 진행에 따라 시퀀스 학생이 미도착 → 출석(키오스크)으로 이동.
4. 시퀀스에 없는 학생은 미도착 잔류.

## UI

패널 상단(세션 정보 줄 아래)에 **DEMO ONLY 컨트롤 바**:

- `▶ 출석 시연` 버튼 — 재생 중이면 `시연 중…`(disabled), 완료 후 비활성.
- `↺ 초기화` 버튼.
- 진행 표시 `(n/총)`.
- 영역을 점선 테두리 + 옅은 배경으로 감싸 "시연용"임을 시각 구분 → 추후 통째로 제거 용이.

## 엣지 케이스

- **반(class) 변경 시 데모 초기화** — 시퀀스가 cl-01 학생 기준이므로 다른 반에선 무의미 → 혼선 방지.
- **패널 닫힘 시 초기화** — `active=false`에서 reset.
- **중복 재생 방지** — `isPlaying` 또는 `isComplete`이면 play 무시.

## 삭제 방법(추후)

1. `components/panels/useAttendanceDemo.ts` 삭제.
2. `AttendancePanel.tsx`에서 `// DEMO ONLY ↓↓↓ ~ ↑↑↑` 마커로 감싼 블록(import·훅 호출·합집합 병합·컨트롤 바 JSX) 제거.
3. (선택) mock-data의 `demoCheckinSequence` 정리.
