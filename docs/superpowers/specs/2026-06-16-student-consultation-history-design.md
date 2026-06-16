# 원생별 상담이력 설계

작성일: 2026-06-16

## 목적

원생 관리(`/students`)에서 원생별 상담 기록을 남기고 조회·수정·삭제할 수 있도록 한다.
학원 상담(전화/대면 등)의 실제 내용을 누적 기록하여 원생별 상담 이력을 한곳에서 관리한다.

## 범위

### 포함
- 원생 상세 모달에 `상담이력` 탭 추가 (네 번째 탭).
- 상담 기록 한 건당: 상담일자 · 상담유형 · 상담자 · 상담내용.
- 탭 안에서 인라인으로 추가 / 수정 / 삭제 (CRUD).

### 범위 밖 (YAGNI)
- 메인 원생 테이블의 "최근 상담일" 컬럼.
- 전 원생 통합 상담 조회/검색 페이지.
- 첨부파일, 후속조치 알림, 다음 상담 예정일, 학부모 공유 여부 등 운영 부가 필드.

이 기능들은 필요해지면 별도 스펙으로 다룬다.

## 데이터 모델 (`lib/mock-data.ts`)

기존 `enrollments` / `payments`와 동일하게 `student_id`로 학생과 연결되는 별도 배열로 둔다.
학생 본인 레코드(`Student`)는 변경하지 않는다.

```ts
export type ConsultMethod = '전화' | '대면' | '문자·카톡' | '기타';

export interface Consultation {
  id: string;
  student_id: string;
  date: string;        // 상담일자 YYYY-MM-DD
  method: ConsultMethod;
  counselor: string;   // 상담자
  content: string;     // 상담내용
}

export const consultations: Consultation[] = [
  // 일부 학생에 대한 샘플 2~3건 (id는 'cons-...' 형태)
];
```

- `ConsultMethod`는 상담 "수단" 기준의 고정 옵션 4종.
- 샘플 데이터는 기존 학생 id(`s-01` 등) 중 일부에 2~3건을 부여해 빈 상태/채워진 상태를 모두 확인할 수 있게 한다.

## 상태 관리 (`app/(admin)/students/page.tsx`)

기존 `localStudents` / `localEnrollments` 패턴을 그대로 따른다.

```ts
const [localConsultations, setLocalConsultations] = useState<Consultation[]>(consultations);
```

- 현재 상세 학생의 기록: `localConsultations.filter(c => c.student_id === s.id)`를
  상담일자(`date`) **내림차순(최신순)** 으로 정렬해 표시.
- id 생성: 결정적(deterministic)으로 충돌 없는 값 사용 (예: `cons-${student_id}-${목록 내 시퀀스}` 또는 기존 카운터 패턴). `Date.now()`/랜덤 미사용 — 기존 코드 컨벤션 유지.

CRUD 동작:
- **추가**: 입력폼 값으로 새 `Consultation`을 `localConsultations`에 prepend/append (표시는 정렬로 최신순 보장).
- **수정**: 해당 `id`의 레코드를 교체.
- **삭제**: 해당 `id`의 레코드를 제거.

## 탭 UI / 인터랙션

`DETAIL_TABS`에 `'상담이력'`을 추가하여 `기본정보 / 수강이력 / 수납이력 / 상담이력` 순으로 둔다.

### 입력폼 (탭 상단, 신규 추가)
- 상담일자: `type="date"`, 기본값 = 오늘(`today`, 기존 페이지에 이미 존재).
- 상담유형: `Select` — 전화 / 대면 / 문자·카톡 / 기타.
- 상담자: `datalist` 입력. 후보로 기존 담임 목록(`TEACHERS`)을 제안하되 자유 입력도 허용
  (메인 필터의 "학교" datalist 입력과 동일한 패턴).
- 상담내용: `textarea`.
- `추가` 버튼: 상담내용이 비어 있으면 비활성화.

### 기록 카드 목록 (입력폼 아래, 최신순)
- 각 카드: 상담일자 · 상담유형 배지 · 상담자 + 상담내용(여러 줄 유지, `whitespace-pre-line`).
- 카드 우측 액션:
  - `수정` → 해당 카드가 인라인 편집폼으로 전환(저장 / 취소). 한 번에 한 카드만 편집.
  - `삭제` → `DeleteButton`(약화된 빨강 텍스트 링크) 톤으로 통일. 확인 후 제거.
- 기록이 없으면 "등록된 상담 이력이 없습니다." 안내.

### 편집 모드와의 관계
- 기존 `수강이력` / `수납이력` 탭은 모달 하단 `편집` 버튼과 연동되며 "편집할 수 없습니다" 안내를 둔다.
- `상담이력` 탭은 탭 자체가 **상시 편집 가능**(인라인 CRUD)하므로, 모달 하단 `편집`/`삭제`(기본정보용) 버튼과 독립적으로 동작한다.
- 상담이력 탭일 때 모달 하단 푸터는 다른 비편집 탭과 동일하게 `닫기` 버튼만 노출한다.

## 디자인 일관성

- 기존 `students/page.tsx`의 색상 토큰(`#37352F`, `#787774`, `#FF6C37`, `#E9E9E7` 등)과
  `Field` / `Badge` / `Select` / `Input` / `Textarea` / `DeleteButton` 컴포넌트를 재사용한다.
- 삭제 액션은 프로젝트 컨벤션(약화된 빨강 텍스트 링크 `DeleteButton`)을 따른다.
- 같은 위계의 라벨은 같은 굵기를 유지한다(특정 라벨만 볼드 금지).

## 테스트

- 데이터 모델/정렬·CRUD 순수 로직이 별도 헬퍼로 분리되는 경우 `vitest` 단위 테스트 추가를 고려.
- 단, 현재 페이지는 컴포넌트 내 상태 위주이므로, 순수 로직이 의미 있게 분리될 때만 테스트를 둔다(과도한 테스트 지양).
