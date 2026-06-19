# 원장 대시보드 재구성 — 설계 문서

작성일: 2026-06-19 · 대상 화면: `app/(admin)/dashboard` (원장 role 뷰 한정)

## 1. 목적

원장(원장님) 대시보드를 운영 의사결정 중심으로 재구성한다. 손익을 한눈에 보고, AI 운영 인사이트를 시각적으로 크게 드러내며, "퇴원 가능성 높은 학생"과 "상담 미정(공백) 학생"을 워치리스트로 노출한다.

교사·SO role 뷰는 **변경하지 않는다** (기존 분기 유지).

## 2. 범위

### 추가
- **손익 KPI 스트립** — 총매출 / 총지출 / 영업이익(마진%). 카드 클릭 시 `/revenue` 상세로 이동.
- **AI 인사이트 히어로** — 기존 `LabBenchmarkCard`(가맹랩 운영 벤치마킹)의 확대형. 글자·막대그래프를 히어로 크기로. 큰 헤드라인(종합 순위 요약) + 8지표 막대(우리 랩 vs 전체 평균) + 권장 조치 1~2개.
- **퇴원 가능성 高 리스트** — 복합 위험점수 상위 N명 + 위험사유 배지.
- **상담 미정 리스트** — 최근 90일 상담 공백(또는 상담 0건) 재원생.

### 유지
- 인사 배너 (greeting + 오늘 출석률)
- 납부현황 도넛 + 미납 원생 리스트

### 제거
- 주간 출결 추이 그래프
- 오늘 수업 카드
- (원장 뷰의) 기존 빠른 실행 블록은 교사·SO 전용이므로 원장 뷰에는 원래 없음 — 변경 없음

### 지표 교체 (네트워크 전역)
- `parent_response_rate`(학부모 반응 %) → `payment_collection_rate`(수강료 수납률 %)
- 영향: `/ai` 메뉴의 `LabBenchmarkCard`에도 동일 반영(의도된 일관성)

## 3. 레이아웃 (위 → 아래)

```
① 인사 배너 (유지)              원장님 👋   |  오늘 출석률 93%
② 손익 KPI 스트립 (신규)   [총매출][총지출][영업이익·마진]  → /revenue
③ AI 인사이트 히어로 (신규·강조)
   "판교랩 종합 N위/9 · 8개 지표 중 M개 평균 상회"  (큰 헤드라인)
   [ 큰 막대그래프: 가맹랩 8지표, 우리 랩 vs 전체 평균 세로선 ]
   💡 권장 조치 1~2개
④-A 퇴원 가능성 高 (상위 N) | ④-B 상담 미정 (공백 90일+)
⑤ 납부현황 도넛 + 미납 원생 리스트 (유지)
```

## 4. 데이터 로직 (순수함수 + 테스트)

기존 `lib/*.ts` 패턴(순수함수, 결정적 정렬, 동반 `.test.ts`)을 따른다.

### 4-1. `lib/at-risk.ts` (신규)

퇴원 가능성 복합 위험점수.

```
score(student) = (미납 ? 3 : 0) + (streak ≤ 2 ? 2 : 0) + (휴원 ? 2 : 0)
```

- 미납 판정: `getUnpaidStudents()`(또는 동등 미납 집합) 포함 여부.
- 입력: 재원/휴원 학생 목록 + 미납 학생 집합.
- 출력: `{ student, score, reasons: ('미납'|'streak↓'|'휴원')[] }[]`, score 내림차순(동점은 이름 오름차순), score > 0만, 상위 N(기본 5) 슬라이스는 호출부에서.
- 함수: `atRiskStudents(students, unpaidIds): AtRiskEntry[]`, `riskReasons(student, unpaidIds): string[]`.
- 동반 테스트: 점수 계산·정렬·사유 배열·score 0 제외.

### 4-2. `lib/consultations.ts` — `consultationGapStudents()` 추가

```
consultationGapStudents(students, consultations, asOf, gapDays = 90): GapEntry[]
```

- 재원생만 대상.
- 각 학생의 최신 상담일(`consultationsOf` 활용) 기준 경과일 계산.
- 상담 기록 없음 → 무한대 경과로 취급(최상위).
- `asOf - 최신상담일 ≥ gapDays`인 학생만, 경과일 내림차순(동률은 이름 오름차순).
- 출력: `{ student, lastDate: string | null, daysSince: number | null }[]`.
- `asOf`는 주입(데모 기준일 상수 사용, `Date.now()` 미사용 — 결정적 테스트).
- 동반 테스트: 공백 임계·상담 없음 케이스·정렬.

### 4-3. 지표 교체 — `payment_collection_rate`

- `lib/mock-data.ts`: `LabWeeklyMetric` 인터페이스의 `parent_response_rate` 필드를 `payment_collection_rate`로 교체하고, `labWeeklyMetrics` 각 행의 값도 교체(수납률 성격의 수치, 높을수록 좋음).
- `lib/lab-metrics.ts`: `MetricKey`, `METRIC_LABELS`('수강료 수납률(%)'), `LOWER_IS_BETTER`(false), `METRIC_ORDER`에서 키 교체. `buildInsights`는 해당 키를 참조하지 않으므로 로직 변경 없음.
- `lib/lab-metrics.test.ts`: `parent_response_rate` 참조를 새 키로 갱신.

## 5. 컴포넌트 (신규, `components/dashboard/`)

각 컴포넌트는 단일 책임 · props로 데이터 주입 · 트랙 A(차분) 디자인 준수.

| 컴포넌트 | 책임 | 입력 |
|---|---|---|
| `PnlSummaryStrip` | 총매출·총지출·영업이익 KPI 3카드, `/revenue` 링크 | `PnlSummary` |
| `AiBenchmarkHero` | 가맹랩 벤치마킹 확대형(큰 헤드라인·큰 막대·권장조치) | lab-metrics 파생값 |
| `AtRiskList` | 퇴원 위험 상위 N + 사유 배지 + 상담 CTA | `AtRiskEntry[]` |
| `ConsultGapList` | 상담 공백 재원생 + 경과일 + 상담 CTA | `GapEntry[]` |

- `AiBenchmarkHero`는 `LabBenchmarkCard`의 시각 로직(막대+평균 세로선)을 재사용하되, "AI 분석 실행" 버튼 게이팅 없이 항상 펼친 히어로로 렌더(대시보드 맥락). 막대 높이·라벨·헤드라인 타이포를 확대.
- 위험·CTA 색상은 DESIGN.md 트랙 A 토큰 사용(`#FF6C37`, `#EB5757`, `#787774` 등). 삭제 아닌 "상담" CTA는 일반 링크 스타일.

## 6. 디자인 준수

- DESIGN.md **트랙 A(관리자, 차분)** 를 따른다. "히어로"는 색을 요란하게 쓰는 게 아니라 **타이포·그래프 크기**로만 강조한다.
- 라벨 굵기 일관성·카드 그림자 없음·`tabular-nums` 등 기존 규칙 유지.

## 7. 비범위 (YAGNI)

- 실시간 Claude API 연동(기존처럼 규칙 기반 유지).
- 교사·SO 뷰 변경.
- at-risk 점수의 가중치 사용자 설정 UI(상수로 고정).
- 위험점수에 출석 결석 횟수 등 신규 데이터 모델 추가(현재 가용 필드 미·streak·휴원만 사용).

## 8. 검증

- 신규 순수함수 3종(at-risk, consultation-gap, 지표 교체 영향)에 단위 테스트.
- `npm test` 통과(기존 lab-metrics 테스트 갱신 포함).
- `/dashboard`(원장) 시각 확인: 5개 블록 노출, 제거 항목 부재, `/revenue` 이동, 막대그래프 '수강료 수납률' 표기.
- `/ai` 카드에 '수강료 수납률' 반영 확인.
