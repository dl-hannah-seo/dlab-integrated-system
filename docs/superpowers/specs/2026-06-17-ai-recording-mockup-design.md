# AI 녹음 (수업 녹음 → STT 전사) 목업 설계

**날짜:** 2026-06-17
**작성자:** Hannah Seo
**상태:** 승인됨
**성격:** 목업 (DEMO ONLY) — 데모 시연에서 타 랩장 니즈 검증용. 검증 후 실기능 구현 예정.

---

## 배경 및 목표

수업 내용을 **녹음 → STT 전사 → 데이터로 활용**하는 기능에 대한 니즈가 있는지 데모로 검증하려 한다. 실제 녹음·STT·서버 저장 없이, **클릭 가능한 가짜 플로우**로 "이런 흐름이면 수업 요약 데이터를 얻을 수 있다"를 시연한다.

YAGNI: 실제 MediaRecorder, STT API, 영속 저장, 녹음 이력은 이번 스코프 밖.

---

## 아키텍처 결정

기존 빠른 실행(출석 체크·문자 발송)의 **Context + 슬라이드 패널** 패턴을 그대로 따른다. 세 번째 패널을 추가한다.

| 항목 | 변경 |
|------|------|
| `components/panels/QuickActionsContext.tsx` | `activePanel` 유니온에 `'recording'` 추가, `openRecording()` 액션 추가 |
| `components/panels/RecordingPanel.tsx` | **신규** — `SlidePanel` 사용, 4단계 플로우 |
| `app/(admin)/layout.tsx` | `<RecordingPanel />` 마운트 |
| `components/layout/Sidebar.tsx` | 빠른 실행 섹션에 "AI 녹음" 버튼 추가 (마이크 아이콘) |
| `app/(admin)/dashboard/page.tsx` | 빠른 실행 카드 버튼 2개 → 3개 |

데이터·전환은 전부 패널 내부 목업 상수 + `useState`. 서버 호출 없음.

---

## 패널 설계 — 4단계 클릭 플로우

상태: `type Stage = 'idle' | 'recording' | 'transcribing' | 'result'`

```
[1] idle (준비)
    반 선택  [토 14:00 코딩 기초 ▼]
    🎙  "녹음을 시작하면 수업 내용이 자동으로 전사됩니다"
    [녹음 시작]
        ↓ 클릭 → stage='recording', 타이머 시작

[2] recording (녹음 중)
    ● REC  00:23                  ← setInterval 1초 카운트업
    ▁▃▅▇▅▃▁▃▅▇  (CSS 가짜 파형)   ← 막대별 animation-delay, Math.random 없음
    [녹음 종료]
        ↓ 클릭 → stage='transcribing'

[3] transcribing (전사 중)
    ⟳  음성을 텍스트로 변환 중…
        ↓ setTimeout 1.5s → stage='result'

[4] result (결과)
    ── 수업 요약 (AI 자동 생성) ──────────
    • 오늘은 반복문(for) 개념을 다뤘습니다.
    • 1부터 10까지 합 구하기 예제로 누적 변수 패턴을 연습했습니다.
    • 중첩 반복문에서 일부 학생이 헷갈려 해 별도 설명이 필요합니다.
    (목업 상수, 3~5줄)

    ▸ 전사 원문 보기            ← 접기/펼치기, 가짜 transcript 단락
      "자 오늘은 반복문을 배워볼 거예요…" (목업)

    [요약 저장]   [다시 녹음]
        요약 저장 → "저장되었습니다" 토스트/문구 (목업, 실제 저장 없음)
        다시 녹음 → stage='idle' 리셋
```

### 가짜 파형
- 막대 ~10개, 각 막대에 `animation-delay`를 다르게 준 CSS `@keyframes`(scaleY 상하). `Math.random()` 미사용 → SSR 하이드레이션 안전.
- Tailwind arbitrary keyframe 또는 인라인 style + 전역 keyframe 중 기존 코드 컨벤션에 맞춰 선택.

### 타이머
- `recording` 진입 시 `setInterval`로 초 카운트, 종료/언마운트 시 `clearInterval`.
- 패널 닫힘(`close`) 시 stage·타이머 초기화.

---

## DEMO 표식 컨벤션

기존 출석 데모(`// DEMO ONLY ↓↓↓ / ↑↑↑`) 컨벤션을 따른다. 패널 상단/목업 상수 블록에 표식을 달아 실기능 교체 지점을 명확히 한다. (참고: 출석 "시연 재생"과 동일하게 추후 삭제 가능 대상.)

---

## 미래 스코프 (이번 설계 밖)

- 실제 마이크 녹음(MediaRecorder) + STT API 연동
- 전사 결과 영속 저장 및 녹음 이력 조회
- 산출물 확장: 핵심 개념·키워드, 학생별 참여 메모, 공지·과제 추출
- AI 요약(/ai) 페이지와의 데이터 연동

---

## 영향받는 파일

- `components/panels/QuickActionsContext.tsx` — `'recording'` 상태·액션 추가
- `components/panels/RecordingPanel.tsx` — 신규
- `app/(admin)/layout.tsx` — 패널 마운트
- `components/layout/Sidebar.tsx` — 빠른 실행 버튼 추가
- `app/(admin)/dashboard/page.tsx` — 빠른 실행 버튼 추가
