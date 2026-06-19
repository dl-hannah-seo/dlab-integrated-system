# Coinbase 블루 디자인 시스템 전환 — 설계 문서

- 작성일: 2026-06-19
- 범위: **디자인 토큰 + `components/ui/` 8개 프리미티브 + 페이지 hex 스윕**
- 대상 표면: **Admin 웹(라이트 테마)만** — 키오스크 다크 테마(`.kiosk-scope`)는 손대지 않음
- 브랜드 방향: **주황 `#FF6C37` → Coinbase 블루 `#0052ff` 전면 전환**

## 0. 배경 — TDS 계획 대체

직전 `2026-06-19-tds-design-system-design.md`는 **주황 유지 + Toss 구조**였으나, 사용자가 Coinbase 레퍼런스(파란색 핀테크)를 채택하기로 결정해 **브랜드 컬러를 블루로 전면 전환**한다. TDS 문서의 *구조적 접근*(토큰 주도, 하드코딩 hex → 시맨틱 유틸리티, 8개 프리미티브 리디자인)은 그대로 재사용하되, 값과 브랜드 방향이 다르다. 이 문서가 색/브랜드 측면에서 TDS 문서를 대체한다.

확정된 결정:
1. **파란색 `#0052ff` 전면 전환** (주황 정체성 폐기)
2. **Admin 웹만** — 키오스크 다크 테마 보존
3. **절제된 radius** — 블루 컬러·타이포·flat·블루 포커스 링은 채용, 버튼은 pill 대신 12px radius

핵심 원칙:
- **토큰 이름은 보존**한다. 값만 교체 + 신규 토큰(radius/fill/tertiary) 추가 → 기존 사용처가 깨지지 않는다.
- 컴포넌트·페이지의 **하드코딩 hex를 의미론적 토큰 유틸리티로 교체**해 토큰 주도(token-driven) 시스템으로 만든다.
- 저장된 디자인 규칙 준수: 입력 필드 안쪽 흰 배경 / DeleteButton 약화 빨강 텍스트 링크 / 동위 라벨 동일 굵기.

## 1. Coinbase 레퍼런스에서 추출한 값

- Primary (Coinbase Blue): `#0052ff`
- Hover Blue (라이트 틴트): `#578bfa`
- Cool Gray (secondary surface): `#eef0f3`
- Near Black (text): `#0a0b0d`
- Muted (secondary text): `#6b7280`
- Radius: 8 / 16 / 32 / 56 / pill — 본 작업은 절제 적용(8/12/16/20)
- Elevation: **Flat(그림자 없음)**, Focus = 블루 링
- Forms: default border / focus 블루 링 / error 레드 보더

## 2. 디자인 토큰 (`app/globals.css` `@theme inline`)

### 2.1 값 교체 (이름 보존)

| 토큰 | 현재 | → Coinbase | 용도 |
|---|---|---|---|
| `--color-primary` | `#FF6C37` | `#0052ff` | 브랜드 블루 |
| `--color-primary-hover` | `#E85A27` | `#0043d1` | 채운 버튼 hover(어두운 톤) |
| `--color-primary-light` | `#FFF1EC` | `#E8EEFF` | 블루 틴트 배지/하이라이트 |
| `--color-text` | `#37352F` | `#0A0B0D` | Near Black, 본문/헤딩 |
| `--color-text-secondary` | `#787774` | `#6B7280` | Text Muted |
| `--color-border` | `#E9E9E7` | `#E5E7EB` | 보더 |
| `--color-sidebar` | `#F7F7F5` | `#F5F6F8` | 표면/사이드바 |
| `--color-row-hover` | `#F7F7F5` | `#EEF0F3` | Cool Gray, hover/fill |
| `--color-bg` | `#FFFFFF` | `#FFFFFF` | 변경 없음 |
| `--color-danger` | `#EB5757` | `#EB5757` | 유지 |
| `--color-success` | `#0F7B6C` | `#0F7B6C` | 유지 |

> 비고: 원본 "Hover Blue `#578bfa`"는 라이트 틴트(아웃라인/고스트 hover용)다. 채운 primary 버튼 hover에는 어두운 `#0043d1`가 자연스러워 이를 `--color-primary-hover`로 둔다.

### 2.2 신규 토큰

```css
--color-fill:          #EEF0F3;  /* secondary 버튼·칩 배경 (Cool Gray) */
--color-text-tertiary: #8A919E;  /* placeholder/caption */
```

### 2.3 신규 radius 스케일

```css
--radius-sm: 8px;   /* 배지·인풋 */
--radius-md: 12px;  /* 버튼 (pill 아님) */
--radius-lg: 16px;  /* 카드 */
--radius-xl: 20px;  /* 모달 */
```

### 2.4 타이포그래피

- 폰트는 **Pretendard 유지**(한글 — CoinbaseSans/Display로 교체 불가).
- 가중치: 본문 `400–500`, 강조/버튼/라벨 `600`, 헤딩 `700`.
- **동위 라벨은 동일 굵기 유지** — 특정 라벨만 볼드 금지(저장된 규칙).

### 2.5 배지 클래스 (`globals.css`)

- `.badge-paid` 등 파랑이 어울리는 정보 배지는 Coinbase 블루 틴트(`#E8EEFF`/`#0052ff`)로 정렬.
- 출결/상태 의미색(`.badge-attend`/`.badge-absent`/`.badge-pending`/`.badge-makeup` 및 success/danger/warn 계열)은 **의미 보존을 위해 유지**.

## 3. 컴포넌트 리디자인 (`components/ui/`)

공통: 하드코딩 hex → 의미론적 토큰 유틸리티(`bg-primary`, `text-text`, `text-text-secondary`, `border-border`, `bg-sidebar`, `bg-fill`, `hover:bg-row-hover` 등 `@theme`가 생성하는 클래스)로 교체. arbitrary hex(`bg-[#FF6C37]`)는 남기지 않는다.

| 컴포넌트 | 변경 | 보존 |
|---|---|---|
| **Button** | primary `bg-primary`/`hover:bg-primary-hover`, secondary `bg-fill`/`text-text`, danger·ghost 토큰화. radius→12px, **flat**, `focus-visible:` 블루 링 추가, weight 500→600 | 4 variant·size·loading API 유지 |
| **Input/Textarea/Select** | radius 8px, border `border`, placeholder `text-tertiary`, focus 보더+링 **블루**(현재 주황) | **안쪽 bg 무조건 흰색** |
| **Card** | radius→16px, border `border`, flat | API/구조 유지 |
| **Modal** | radius→20px, overlay 톤 유지 | props API 유지 |
| **Table** | header `bg-sidebar`, row hover `bg-row-hover`, 구분선 `border` | 구조/제네릭 유지 |
| **Badge** | radius→8px, 패딩 정리 | globals.css 배지 색 클래스 유지 |
| **DeleteButton** | 토큰화 | **약화 빨강 텍스트 링크 유지** |
| **DonutChart** | 필요 시 색만 토큰 정렬 | 로직 유지 |

## 4. 페이지 hex 스윕 (작업량의 핵심)

약 43개 `.tsx`가 arbitrary hex를 직접 사용 → globals.css 토큰만으로는 반영 안 됨. 코드베이스 전체에서 아래를 토큰 유틸리티/신규 hex로 일괄 치환한다(키오스크 `.kiosk-scope` 및 `components/kiosk/` 제외).

| 기존 hex | → 치환 |
|---|---|
| `#FF6C37` (주황 primary) | `#0052ff` 또는 `*-primary` 유틸리티 |
| `#E85A27` (주황 hover) | `#0043d1` 또는 `*-primary-hover` |
| `#FFF1EC` (주황 틴트) | `#E8EEFF` 또는 `*-primary-light` |
| `#37352F` (텍스트) | `*-text` |
| `#787774` (보조) | `*-text-secondary` |
| `#E9E9E7` (보더) | `*-border` |
| `#F7F7F5` (표면/hover) | `*-sidebar` 또는 `*-row-hover` |

스윕 절차: grep으로 사용처를 열거 → 파일별로 유틸리티 치환(arbitrary hex는 정확히 같은 의미일 때만 유틸리티로, 그 외엔 신규 hex로) → 빌드/육안 확인. 키오스크 색(`#FF6C37`이 `.kiosk-scope`·`components/kiosk/`에 쓰인 경우)은 **건드리지 않는다**.

## 5. 영향 범위 / 안전장치

- 출결/상태 의미 배지색은 보존(여러 페이지 의존).
- 동시 세션 오염 방지: 이 작업의 파일만 **스코프 스테이징**, 커밋 전 확인(git-guard).
- 키오스크 표면(다크 테마)은 어떤 경우에도 변경하지 않는다.

## 6. 비범위 (YAGNI)

- 키오스크 다크 테마, 폰트 교체, 페이지 레이아웃 개편, pill 버튼, 신규 컴포넌트 추가는 하지 않는다.

## 7. 검증

- `npm run build`(또는 typecheck) 통과.
- Admin 주요 화면(대시보드/학생/리드/수납) 육안 확인: 블루 primary·flat·블루 포커스 링·radius·그레이 톤이 Coinbase로 바뀌고 기능 동작 유지.
- 잔여 주황 hex 부재 확인: `grep -r "FF6C37\|E85A27\|FFF1EC" app/ components/` 에서 키오스크 외 매치 0건.
