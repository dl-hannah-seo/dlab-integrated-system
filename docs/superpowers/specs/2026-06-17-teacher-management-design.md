# 강사 관리 + 과목 기반 배정 설계

작성일: 2026-06-17
브랜치: feat/kiosk-points-redesign (또는 신규 브랜치)

## 배경 / 목표

학원 통합 시스템에 **강사 관리** 메뉴를 추가한다. 핵심 요구사항:

1. 강사 관리 메뉴 신설 (강사 CRUD)
2. 반 생성 시 그 반의 담임 강사를 드롭다운으로 선택
3. 강사 생성 시 그 강사가 맡을 수 있는 반만 배정 (강사 수준 = 가르칠 수 있는 과목 고려)

현재 상태:
- 강사는 독립 데이터가 아니라 `Class.teacher` 문자열 필드로만 존재(예: '론', '씨드'). `lib/mock-data.ts`.
- 데이터는 전부 인메모리 React state(목업). DB/localStorage 없음. 새로고침 시 초기화.
- 반에는 "수준" 개념 없음. 반의 `course`는 자유 텍스트("파이썬 기초", "아두이노", "맞춤수업").
- 폼은 `Modal` + `Input`/`Select` 패턴으로 일관(`components/ui/`).

## 핵심 결정 사항

- **"강사 수준"의 정의 = 가르칠 수 있는 과목 집합.** 등급/숫자 레벨 아님.
- **과목 단위 = 신설하는 과목 마스터 목록.** 기존 자유 텍스트 course를 과목 마스터로 이전.
- **매칭 규칙(단일 진실): 강사가 반을 맡을 수 있다 ⟺ `class.subject_id ∈ teacher.subject_ids`.** 양방향 폼 모두 이 한 규칙만 참조.
- **하드 필터: 자격 없는 후보는 드롭다운/목록에서 아예 숨김.**

## 데이터 모델 (`lib/mock-data.ts`)

### 신규 `Subject` (과목 마스터)
```ts
interface Subject {
  id: string;
  name: string;   // 예: "파이썬", "아두이노", "스크래치"
  order?: number;
}
```

### 신규 `Teacher` (강사)
```ts
interface Teacher {
  id: string;
  campus_id: string;
  name: string;
  subject_ids: string[];           // 가르칠 수 있는 과목 = "강사 수준"
  phone?: string;
  status: '재직' | '휴직' | '퇴직';
}
```

### 기존 `Class` 변경
- `subject_id: string` 추가 — 과목 마스터 참조. 표시 및 자동 반명 생성은 과목 마스터의 `name` 사용.
- `teacher_id?: string` 추가 — 강사 마스터 연결. 기존 `teacher`(이름 문자열)는 유지(표시 호환).
- 기존 데이터 시드: 현재 반들의 `teacher` 문자열로 `Teacher` 레코드 시드, 현재 `course` 문자열에서 과목 마스터 도출 후 `subject_id` 매핑. 기존 화면(students/schedule의 teacher 필터)이 깨지지 않게 함.

## 라우트 & 메뉴

- 신규 페이지: `app/(admin)/teachers/page.tsx` — 강사 목록 + 생성/수정 모달. `classes`/`students` 페이지 패턴 재사용.
- 과목 마스터: 별도 메뉴 없이 **강사 관리 페이지 상단의 "과목 관리" 영역/모달**로 둠(과목이 소수라 페이지 신설 불필요 — YAGNI). 반 생성 폼도 같은 과목 목록 참조.
- `components/layout/Sidebar.tsx`의 `adminNav`에 "강사 관리" 추가 — **"반 관리" 바로 다음** 위치.

## 양방향 배정 폼 (둘 다 하드 필터)

두 경로 모두 동일한 `class.teacher_id`(+ `teacher` 이름) 관계를 기록한다.

### A. 반 생성/수정 (`app/(admin)/classes/page.tsx`)
- `과목`: 과목 마스터 기반 `Select` (기존 자유 텍스트 입력 대체).
- `담임 강사`: `Select` 드롭다운 — 옵션은 선택된 과목을 `subject_ids`에 포함한 강사만 노출.
- 과목 미선택 시 강사 드롭다운 비활성 + "과목을 먼저 선택하세요" 안내.

### B. 강사 생성/수정 (`app/(admin)/teachers/page.tsx`)
- `가르칠 수 있는 과목`: 과목 마스터 멀티선택(체크박스). students의 "입반할 반" 체크박스 패턴.
- `맡을 반`: 체크박스 목록 — `class.subject_id`가 위에서 고른 과목에 포함되는 반만 노출. 과목 변경 시 실시간 갱신. 과목 미선택이면 "과목을 먼저 선택하세요".
- 한 반의 담임은 1명. 강사 쪽에서 이미 다른 강사가 담임인 반을 고르면 **담임 교체**(체크 시 "현재 담임 ○○ → 교체" 표기).

## 엣지 케이스

- 강사의 과목을 나중에 제거 시 이미 담임인 반과 불일치 발생 → 강사 상세에 "과목 불일치 반 N개" 경고만 표시(자동 해제 안 함).
- 과목 삭제는 그 과목을 사용하는 반/강사가 있으면 차단.
- 데이터는 인메모리 → 새로고침 시 초기화(기존 페이지들과 동일).

## 비범위 (YAGNI)

- 강사 인증/로그인, 권한, 급여, 시간표 자동 배정.
- 숫자 레벨/등급 체계.
- DB/영속화(기존 목업 방식 유지).
- 과목별 강사 숙련 등급(과목 + 등급 조합) — 이번엔 과목 단위 매칭만.

## 컴포넌트 경계

- `Subject`/`Teacher` 타입과 시드 데이터: `lib/mock-data.ts`에 집중.
- 매칭 헬퍼(`canTeach(teacher, class)`, `eligibleTeachers(classSubjectId, teachers)`, `eligibleClasses(subjectIds, classes)`): 한 곳(예: `lib/mock-data.ts` 또는 `lib/teacher-matching.ts`)에 두어 양쪽 폼이 동일 로직 재사용.
- 강사 관리 UI는 `teachers/page.tsx`에 격리. 과목 관리는 같은 페이지 내 작은 영역/모달.
