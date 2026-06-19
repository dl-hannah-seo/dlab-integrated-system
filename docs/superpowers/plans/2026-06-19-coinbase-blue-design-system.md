# Coinbase 블루 디자인 시스템 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin 웹의 브랜드를 주황(`#FF6C37`)에서 Coinbase 블루(`#0052ff`)로 전면 전환한다 — 토큰 교체 + 8개 UI 프리미티브 토큰화 + 페이지 hex 스윕.

**Architecture:** `app/globals.css`의 `@theme inline` 토큰 값을 교체(이름 보존)하고, `components/ui/` 프리미티브의 하드코딩 hex를 시맨틱 토큰 유틸리티(`bg-primary`, `text-text`, `border-border` 등)로 바꾼다. 페이지(.tsx)에 흩어진 arbitrary hex는 스크립트로 hex→hex 일괄 치환한다. 회귀 방지는 `lib/design-system.test.ts`의 소스 스캔 테스트(잔여 주황/Notion 그레이 hex 0건)로 강제한다.

**Tech Stack:** Next.js(App Router), Tailwind CSS v4(`@theme inline`), Pretendard, vitest.

## Global Constraints

- **격리 worktree에서 실행한다.** 동시 세션이 `app/`·`components/`에 미커밋 변경을 갖고 있어(메모리: git-staging-isolation), 대규모 스윕이 다른 세션 작업과 엉키지 않도록 현재 HEAD에서 깨끗한 worktree를 만들어 작업한다.
- **키오스크는 절대 건드리지 않는다.** `app/globals.css`의 `.kiosk-scope { … }` 블록과 `components/kiosk/**`는 변경 금지. 스윕 대상은 `*.tsx`이며 `components/kiosk/`는 제외, `.css`는 스크립트 스윕 대상이 아님(키오스크 주황 `--kiosk-orange: #FF6C37` 보존).
- **폰트는 Pretendard 유지** — 한글 때문에 CoinbaseSans/Display로 교체하지 않는다.
- **저장된 디자인 규칙 준수:** 입력 필드 안쪽 배경 무조건 흰색(`bg-white`) / DeleteButton은 약화된 빨강 텍스트 링크 / 동위 라벨 동일 굵기.
- **radius는 Tailwind 빌트인 유틸리티로 매핑**(전역 `--radius-*` 토큰 덮어쓰기 금지): 8px=`rounded-lg`, 12px=`rounded-xl`, 16px=`rounded-2xl`, 20px=`rounded-[20px]`.
- **danger/success 의미색 유지**(`#EB5757`/`#0F7B6C`), 출결/상태 배지색 유지.
- **토큰 매핑(이 계획 전체에서 동일하게 적용):**

| 기존 hex | → 신규 | 토큰 유틸리티 |
|---|---|---|
| `#FF6C37` | `#0052ff` | `*-primary` |
| `#E85A27` | `#0043d1` | `*-primary-hover` |
| `#FFF1EC` | `#E8EEFF` | `*-primary-light` |
| `#37352F` | `#0A0B0D` | `*-text` |
| `#787774` | `#6B7280` | `*-text-secondary` |
| `#E9E9E7` | `#E5E7EB` | `*-border` |
| `#F7F7F5` | `#F5F6F8` | `*-sidebar`(hover는 프리미티브에서 `*-row-hover`=`#EEF0F3`) |
| `#BEBDBA`(placeholder) | `#8A919E` | `*-text-tertiary` |

---

### Task 0: 격리 worktree 준비

**Files:** 없음(환경 준비)

- [ ] **Step 1: 현재 HEAD에서 worktree 생성**

Run:
```bash
cd "c:/Users/d.lab/Desktop/통합시스템"
git worktree add ../통합시스템-coinbase -b feat/coinbase-blue-design
```
Expected: `../통합시스템-coinbase`에 깨끗한 작업 트리 생성. 이후 모든 작업/커밋은 이 worktree에서 수행한다.

- [ ] **Step 2: 의존성·빌드 동작 확인 (베이스라인)**

Run:
```bash
cd ../통합시스템-coinbase
npm install
npm test
```
Expected: 기존 테스트 PASS(베이스라인). 실패 시 환경 문제이므로 먼저 해결.

---

### Task 1: 디자인 토큰 교체 (`app/globals.css`)

**Files:**
- Modify: `app/globals.css` (`@theme inline` 블록, body, 스크롤바, `.badge-submitted`)
- Test: `lib/design-system.test.ts`

**Interfaces:**
- Produces: Tailwind 유틸리티 `bg-primary` `text-primary` `bg-primary-hover` `bg-primary-light` `text-text` `text-text-secondary` `text-text-tertiary` `border-border` `bg-sidebar` `bg-row-hover` `bg-fill` `text-danger` `bg-danger` `bg-success` `fill-text` `fill-text-secondary` (모두 `@theme inline`의 `--color-*`에서 생성됨). 이후 모든 Task가 이 유틸리티를 소비한다.

- [ ] **Step 1: 실패 테스트 작성**

Create `lib/design-system.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CSS = () => readFileSync('app/globals.css', 'utf8');
/** .kiosk-scope 블록을 제거한 admin 영역 CSS (키오스크 주황은 검사 제외) */
const adminCss = () => CSS().replace(/\.kiosk-scope\s*\{[\s\S]*?\n\}/, '');

describe('design tokens (globals.css)', () => {
  it('primary는 Coinbase 블루', () => {
    expect(CSS()).toMatch(/--color-primary:\s*#0052ff/i);
    expect(CSS()).toMatch(/--color-primary-hover:\s*#0043d1/i);
    expect(CSS()).toMatch(/--color-primary-light:\s*#E8EEFF/i);
  });
  it('텍스트/보더/표면 토큰 교체', () => {
    expect(CSS()).toMatch(/--color-text:\s*#0A0B0D/i);
    expect(CSS()).toMatch(/--color-text-secondary:\s*#6B7280/i);
    expect(CSS()).toMatch(/--color-border:\s*#E5E7EB/i);
    expect(CSS()).toMatch(/--color-sidebar:\s*#F5F6F8/i);
    expect(CSS()).toMatch(/--color-row-hover:\s*#EEF0F3/i);
  });
  it('신규 토큰 존재', () => {
    expect(CSS()).toMatch(/--color-fill:\s*#EEF0F3/i);
    expect(CSS()).toMatch(/--color-text-tertiary:\s*#8A919E/i);
  });
  it('키오스크 주황은 보존', () => {
    expect(CSS()).toMatch(/--kiosk-orange:\s*#FF6C37/i);
  });
  it('admin 영역에 주황/Notion 그레이 잔존 없음', () => {
    expect(adminCss()).not.toMatch(/#FF6C37|#E85A27|#FFF1EC/i);
    expect(adminCss()).not.toMatch(/#37352F|#787774|#E9E9E7|#F7F7F5/i);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- design-system`
Expected: FAIL (현재 `--color-primary: #FF6C37`, admin CSS에 주황/그레이 잔존).

- [ ] **Step 3: `@theme inline` 토큰 교체**

`app/globals.css`의 `@theme inline` 블록(33–46행)을 다음으로 교체:
```css
@theme inline {
  --color-bg:             #FFFFFF;
  --color-sidebar:        #F5F6F8;
  --color-text:           #0A0B0D;
  --color-text-secondary: #6B7280;
  --color-text-tertiary:  #8A919E;
  --color-border:         #E5E7EB;
  --color-primary:        #0052ff;
  --color-primary-hover:  #0043d1;
  --color-primary-light:  #E8EEFF;
  --color-fill:           #EEF0F3;
  --color-danger:         #EB5757;
  --color-success:        #0F7B6C;
  --color-row-hover:      #EEF0F3;
}
```
> `.kiosk-scope` 블록(48–59행)은 그대로 둔다.

- [ ] **Step 4: body 색·스크롤바·primary 배지 교체**

`app/globals.css`에서:
- body `color: #37352F;` → `color: #0A0B0D;`
- 스크롤바 `::-webkit-scrollbar-thumb { background: #E9E9E7; … }` → `background: #E5E7EB;`
- `.badge-submitted { background: #FFF1EC; color: #FF6C37; }` → `.badge-submitted { background: #E8EEFF; color: #0052ff; }`

> 그 외 배지 클래스(reviewing/confirmed/completed/paid/danger/warn/출결)는 변경하지 않는다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- design-system`
Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add app/globals.css lib/design-system.test.ts
git commit -m "feat: Coinbase 블루 디자인 토큰 교체 (globals.css)"
```

---

### Task 2: Button 프리미티브 토큰화

**Files:**
- Modify: `components/ui/Button.tsx:19-26`
- Test: `lib/design-system.test.ts` (describe 추가)

**Interfaces:**
- Consumes: Task 1의 `bg-primary`/`bg-primary-hover`/`bg-fill`/`text-text`/`bg-danger`/`bg-row-hover`.
- Produces: 변경 없음(`Button` props API 동일: `variant`/`size`/`loading`).

- [ ] **Step 1: 실패 테스트 작성**

`lib/design-system.test.ts`에 추가:
```ts
describe('Button', () => {
  const src = () => readFileSync('components/ui/Button.tsx', 'utf8');
  it('주황 hex 없음', () => {
    expect(src()).not.toMatch(/#FF6C37|#E85A27/i);
  });
  it('토큰 유틸리티 + 블루 포커스 링 사용', () => {
    expect(src()).toMatch(/bg-primary/);
    expect(src()).toMatch(/hover:bg-primary-hover/);
    expect(src()).toMatch(/rounded-xl/);
    expect(src()).toMatch(/focus-visible:ring/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- design-system`
Expected: FAIL (Button에 `bg-[#FF6C37]` 존재).

- [ ] **Step 3: Button.tsx 교체**

`base`와 `variants`(19–26행)를 교체:
```tsx
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-fill text-text hover:bg-row-hover',
    danger:    'bg-danger text-white hover:opacity-90',
    ghost:     'text-text hover:bg-row-hover',
  };
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- design-system`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add components/ui/Button.tsx lib/design-system.test.ts
git commit -m "feat: Button 토큰화 + 블루 포커스 링"
```

---

### Task 3: Input / Textarea / Select 토큰화

**Files:**
- Modify: `components/ui/Input.tsx` (Input 12–18행, Textarea 69–73행, Select 89–97행)
- Test: `lib/design-system.test.ts`

**Interfaces:**
- Consumes: `border-border`/`text-text`/`text-text-tertiary`/`focus:border-primary`/`bg-sidebar`/`text-danger`.
- Produces: 변경 없음(API 동일). 안쪽 배경 `bg-white` 유지.

- [ ] **Step 1: 실패 테스트 작성**

```ts
describe('Input/Textarea/Select', () => {
  const src = () => readFileSync('components/ui/Input.tsx', 'utf8');
  it('주황/Notion hex 없음', () => {
    expect(src()).not.toMatch(/#FF6C37|#37352F|#787774|#E9E9E7|#EB5757|#BEBDBA|#F7F7F5/i);
  });
  it('블루 focus + 토큰화 + 흰 배경 유지', () => {
    expect(src()).toMatch(/focus:border-primary/);
    expect(src()).toMatch(/focus:ring-primary/);
    expect(src()).toMatch(/placeholder:text-text-tertiary/);
    expect((src().match(/bg-white/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- design-system`
Expected: FAIL.

- [ ] **Step 3: Input.tsx 교체**

Input의 `<input>` className(15행) →:
```tsx
          className={`w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors disabled:bg-sidebar disabled:text-text-secondary ${suffix ? 'pr-10' : ''} ${error ? 'border-danger' : ''} ${className}`}
```
Input label(12행) `text-[#37352F]` → `text-text`. suffix span(18행) `text-[#787774]` → `text-text-secondary`. error span(21행) `text-[#EB5757]` → `text-danger`.

Textarea label(69행) `text-[#37352F]` → `text-text`. Textarea(71행) →:
```tsx
        className={`w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors resize-none disabled:bg-sidebar ${error ? 'border-danger' : ''} ${className}`}
```
Textarea error span(74행) `text-[#EB5757]` → `text-danger`.

Select label(88행) `text-[#37352F]` → `text-text`. Select(90행) →:
```tsx
        className={`w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors bg-white ${error ? 'border-danger' : ''} ${className}`}
```
Select error span(98행) `text-[#EB5757]` → `text-danger`.

- [ ] **Step 4: 통과 확인**

Run: `npm test -- design-system`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add components/ui/Input.tsx lib/design-system.test.ts
git commit -m "feat: Input/Textarea/Select 토큰화 + 블루 focus 링"
```

---

### Task 4: Card / Modal 토큰화

**Files:**
- Modify: `components/ui/Card.tsx:13-16`, `components/ui/Modal.tsx:30-41`
- Test: `lib/design-system.test.ts`

**Interfaces:**
- Consumes: `border-border`/`text-text`/`text-text-secondary`.
- Produces: 변경 없음(API 동일).

- [ ] **Step 1: 실패 테스트 작성**

```ts
describe('Card/Modal', () => {
  const card = () => readFileSync('components/ui/Card.tsx', 'utf8');
  const modal = () => readFileSync('components/ui/Modal.tsx', 'utf8');
  it('Notion hex 없음', () => {
    expect(card()).not.toMatch(/#E9E9E7|#37352F/i);
    expect(modal()).not.toMatch(/#E9E9E7|#37352F|#787774/i);
  });
  it('radius 매핑', () => {
    expect(card()).toMatch(/rounded-2xl/);
    expect(modal()).toMatch(/rounded-\[20px\]/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- design-system`
Expected: FAIL.

- [ ] **Step 3: Card.tsx 교체**

- 13행: `bg-white border border-[#E9E9E7] rounded-lg` → `bg-white border border-border rounded-2xl`
- 15행: `border-b border-[#E9E9E7]` → `border-b border-border`
- 16행: `text-[#37352F]` → `text-text`

- [ ] **Step 4: Modal.tsx 교체**

- 30행: `rounded-xl shadow-xl` → `rounded-[20px] shadow-xl`
- 31행: `border-b border-[#E9E9E7]` → `border-b border-border`
- 32행: `text-[#37352F]` → `text-text`
- 33행: `text-[#787774] hover:text-[#37352F]` → `text-text-secondary hover:text-text`
- 41행: `border-t border-[#E9E9E7]` → `border-t border-border`

- [ ] **Step 5: 통과 확인**

Run: `npm test -- design-system`
Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add components/ui/Card.tsx components/ui/Modal.tsx lib/design-system.test.ts
git commit -m "feat: Card/Modal 토큰화 + radius 정렬"
```

---

### Task 5: Table / Badge / DeleteButton / DonutChart 토큰화

**Files:**
- Modify: `components/ui/Table.tsx`, `components/ui/Badge.tsx`, `components/ui/DeleteButton.tsx`, `components/ui/DonutChart.tsx`
- Test: `lib/design-system.test.ts`

**Interfaces:**
- Consumes: `bg-sidebar`/`border-border`/`text-text`/`text-text-secondary`/`bg-row-hover`/`bg-success`/`bg-danger`/`border-text-secondary`/`text-danger`/`text-primary`/`bg-primary-light`/`fill-text`/`fill-text-secondary`.
- Produces: 변경 없음(API 동일). DeleteButton은 약화 빨강 텍스트 링크 유지.

- [ ] **Step 1: 실패 테스트 작성**

```ts
describe('Table/Badge/DeleteButton/DonutChart', () => {
  const f = (p: string) => readFileSync(`components/ui/${p}`, 'utf8');
  it('주황/Notion hex 없음', () => {
    for (const p of ['Table.tsx', 'Badge.tsx', 'DeleteButton.tsx', 'DonutChart.tsx']) {
      expect(f(p)).not.toMatch(/#FF6C37|#FFF1EC|#37352F|#787774|#E9E9E7|#F7F7F5/i);
    }
  });
  it('Table 헤더/hover 토큰', () => {
    expect(f('Table.tsx')).toMatch(/bg-sidebar/);
    expect(f('Table.tsx')).toMatch(/hover:bg-row-hover/);
  });
  it('DeleteButton은 danger 토큰 텍스트 링크 유지', () => {
    expect(f('DeleteButton.tsx')).toMatch(/text-danger/);
    expect(f('DeleteButton.tsx')).toMatch(/hover:underline/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- design-system`
Expected: FAIL.

- [ ] **Step 3: Table.tsx 교체**

- 27행: `bg-[#F7F7F5] border-b border-[#E9E9E7]` → `bg-sidebar border-b border-border`
- 31행: `text-[#37352F]` → `text-text`
- 41행: `text-[#787774]` → `text-text-secondary`
- 49행: `border-b border-[#E9E9E7] ${onRowClick ? 'cursor-pointer hover:bg-[#F7F7F5]' : ''}` → `border-b border-border ${onRowClick ? 'cursor-pointer hover:bg-row-hover' : ''}`
- 53행: `text-[#37352F]` → `text-text`

- [ ] **Step 4: Badge.tsx 교체**

- 35행: `rounded text-xs` → `rounded-lg text-xs`
- AttendanceDot colors(43–48행):
```tsx
  const colors = {
    attend:  'bg-success',
    absent:  'bg-danger',
    pending: 'border-2 border-text-secondary bg-transparent',
    makeup:  'bg-[#D9A80A]',
  };
```
> `#D9A80A`(amber)는 토큰이 없고 주황/Notion 그레이가 아니므로 그대로 둔다.

- [ ] **Step 5: DeleteButton.tsx 교체**

- 17행: `text-[#EB5757] hover:underline` → `text-danger hover:underline`

- [ ] **Step 6: DonutChart.tsx 교체**

- 66행: `fill-[#37352F]` → `fill-text`
- 78행: `fill-[#787774]` → `fill-text-secondary`
- 92행: `text-[#37352F]` → `text-text`
- 95행: `text-[#FF6C37] bg-[#FFF1EC] px-1.5 py-0.5 rounded` → `text-primary bg-primary-light px-1.5 py-0.5 rounded`
- 100행: `text-[#37352F]` → `text-text`
> 슬라이스 색(`slice.color`, `style`)은 데이터에서 오므로 변경하지 않는다.

- [ ] **Step 7: 통과 확인**

Run: `npm test -- design-system`
Expected: PASS.

- [ ] **Step 8: 커밋**

```bash
git add components/ui/Table.tsx components/ui/Badge.tsx components/ui/DeleteButton.tsx components/ui/DonutChart.tsx lib/design-system.test.ts
git commit -m "feat: Table/Badge/DeleteButton/DonutChart 토큰화"
```

---

### Task 6: 페이지 hex 일괄 스윕 + 잔존 가드

**Files:**
- Modify: `app/**/*.tsx`, `components/**/*.tsx` (단, `components/kiosk/**` 제외)
- Test: `lib/design-system.test.ts` (전역 가드 describe 추가)

**Interfaces:**
- Consumes: Task 1의 신규 hex 값.
- Produces: admin 표면 `.tsx`에 주황/Notion 그레이 arbitrary hex 0건.

- [ ] **Step 1: 전역 가드 테스트 작성**

```ts
describe('no residual legacy hex in admin .tsx', () => {
  function walk(dir: string, acc: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        if (p.replace(/\\/g, '/').includes('components/kiosk')) continue;
        walk(p, acc);
      } else if (name.endsWith('.tsx')) acc.push(p);
    }
    return acc;
  }
  it('주황/Notion 그레이 hex 없음', () => {
    const offenders: string[] = [];
    for (const file of [...walk('app'), ...walk('components')]) {
      const c = readFileSync(file, 'utf8');
      if (/#FF6C37|#E85A27|#FFF1EC|#37352F|#787774|#E9E9E7|#F7F7F5/i.test(c)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- design-system`
Expected: FAIL (페이지 다수가 legacy hex 보유).

- [ ] **Step 3: 스윕 스크립트 실행**

Run (worktree 루트에서, Bash 도구):
```bash
find app components -name '*.tsx' -not -path 'components/kiosk/*' -print0 \
 | xargs -0 sed -i \
   -e 's/FF6C37/0052ff/Ig' \
   -e 's/E85A27/0043d1/Ig' \
   -e 's/FFF1EC/E8EEFF/Ig' \
   -e 's/37352F/0A0B0D/Ig' \
   -e 's/787774/6B7280/Ig' \
   -e 's/E9E9E7/E5E7EB/Ig' \
   -e 's/F7F7F5/F5F6F8/Ig'
```
> `components/ui/*.tsx`는 Task 2–5에서 이미 토큰화되어 매치가 없다(무해). `app/globals.css`는 `.css`라 대상 아님(키오스크 주황 보존). `components/kiosk/`는 `-not -path`로 제외.

- [ ] **Step 4: 통과 확인 + 타입/빌드 점검**

Run:
```bash
npm test -- design-system
```
Expected: PASS (offenders 빈 배열).

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 페이지 legacy hex → Coinbase 블루 일괄 스윕"
```

---

### Task 7: 빌드·린트·시각 검증

**Files:** 없음(검증)

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 전체 PASS.

- [ ] **Step 2: 린트**

Run: `npm run lint`
Expected: 신규 에러 없음(기존 경고는 무시 가능).

- [ ] **Step 3: 프로덕션 빌드**

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 4: 시각 확인 (dev 서버)**

Run: `npm run dev` 후 브라우저로 다음 화면 확인:
- `/dashboard`(원장 대시보드), `/students`, `/leads`, 수납 화면
- 체크: primary 버튼/링크가 블루(`#0052ff`), 입력 focus 시 블루 보더+링, 카드/모달 radius, 그레이 톤이 쿨그레이로, 기능 동작 정상.
- 키오스크(`/kiosk`)는 **다크+주황 그대로**인지 확인(회귀 없음).

- [ ] **Step 5: 잔존 주황 최종 확인**

Run:
```bash
grep -rn "FF6C37\|E85A27\|FFF1EC" app/ components/ --include='*.tsx' | grep -vi kiosk
```
Expected: 매치 0건.

- [ ] **Step 6: 완료 처리**

`superpowers:finishing-a-development-branch` 스킬로 worktree 병합/PR 여부를 결정한다.

---

## Self-Review

- **Spec 커버리지:** §2.1 토큰 교체→Task1 / §2.2 신규 토큰→Task1 / §2.3 radius→빌트인 유틸리티(Global Constraints+각 Task) / §2.5 배지→Task1 / §3 프리미티브 8개→Task2–5 / §4 페이지 스윕→Task6 / §5 안전장치(worktree·키오스크 보존)→Task0+Global Constraints / §7 검증→Task7. 누락 없음.
- **Placeholder:** 없음(모든 step에 실제 코드/명령 포함).
- **타입 일관성:** 프리미티브 props API는 전부 불변. 테스트는 동일 파일 `lib/design-system.test.ts`에 describe 누적. 토큰 유틸리티 이름은 Global Constraints 표와 Task1 Produces에 정의된 것만 사용.
