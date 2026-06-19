# TDS 기반 디자인 시스템 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin 웹의 디자인 토큰과 `components/ui/` 8개 프리미티브를 TDS(Toss Design System) 구조로 교체한다(주황 primary 유지).

**Architecture:** `app/globals.css`의 `@theme` 토큰 값을 TDS 그레이스케일·radius·타이포로 교체/추가하고, 8개 컴포넌트의 하드코딩 hex를 `@theme`가 생성하는 의미론적 유틸리티 클래스(`text-text`, `border-border`, `bg-fill`, `rounded-field` 등)로 교체한다. 페이지(.tsx)는 토큰·배지 클래스를 통해 자동 반영되며 직접 수정하지 않는다.

**Tech Stack:** Next 16, React 19, Tailwind CSS v4 (`@theme inline`), Pretendard.

## Global Constraints

- 대상은 **Admin 웹(라이트)만**. 키오스크 다크 테마(`.kiosk-scope`)와 페이지 레이아웃은 건드리지 않는다.
- **토큰 이름 보존**: 기존 `--color-*` 이름은 유지하고 값만 교체. 신규 토큰만 추가.
- **primary 주황 `#FF6C37` 유지**. `--color-success`는 `#0F7B6C` 유지.
- 저장된 규칙 준수: 입력 필드 안쪽 배경은 **무조건 흰색(`bg-white`)** / DeleteButton은 **약화 빨강 텍스트 링크** / 동위 라벨은 **동일 굵기**(특정 라벨만 볼드 금지).
- radius 토큰은 Tailwind 기본(`md/lg/xl`)과 충돌하지 않게 **커스텀 이름**(`--radius-field/card/modal`) 사용.
- 동시 세션 오염 방지: 각 커밋은 **해당 작업 파일만 스코프 스테이징**.
- 각 작업 종료 시 `npx tsc --noEmit` 통과 후 커밋.

---

### Task 1: 디자인 토큰 교체/추가 (`app/globals.css`)

**Files:**
- Modify: `app/globals.css:34-46` (`@theme inline` 블록)

**Interfaces:**
- Produces: Tailwind 유틸리티 클래스 — 색상 `text-text`, `text-text-secondary`, `text-text-tertiary`, `border-border`, `bg-sidebar`, `bg-row-hover`, `bg-fill`, `text-danger`/`border-danger`, `text-primary`/`bg-primary`/`border-primary`, `bg-primary-light`, `text-success`; radius `rounded-field`(12px), `rounded-card`(16px), `rounded-modal`(20px). 이후 모든 Task가 이 클래스들을 사용.

- [ ] **Step 1: `@theme inline` 블록 교체**

`app/globals.css`의 34–46행 `@theme inline { ... }` 블록을 아래로 교체:

```css
/* ── 관리자 웹 디자인 토큰 (TDS 기반) ── */
@theme inline {
  --color-bg:             #FFFFFF;
  --color-sidebar:        #F9FAFB;   /* TDS Grey 50 */
  --color-text:           #191F28;   /* TDS Grey 900 */
  --color-text-secondary: #6B7684;   /* TDS Grey 600 */
  --color-text-tertiary:  #8B95A1;   /* TDS Grey 500 (placeholder/caption) */
  --color-border:         #E5E8EB;   /* TDS Grey 200 */
  --color-fill:           #F2F4F6;   /* TDS Grey 100 (secondary fill) */
  --color-primary:        #FF6C37;
  --color-primary-hover:  #E85A27;
  --color-primary-light:  #FFF1EC;
  --color-danger:         #F04452;   /* TDS Red */
  --color-success:        #0F7B6C;
  --color-row-hover:      #F2F4F6;   /* TDS Grey 100 */

  --radius-field: 12px;  /* 버튼·인풋 */
  --radius-card:  16px;  /* 카드 */
  --radius-modal: 20px;  /* 모달 */
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (CSS만 변경)

- [ ] **Step 3: 커밋**

```bash
git add app/globals.css
git commit -m "feat(ds): TDS 그레이스케일·radius 토큰으로 교체"
```

---

### Task 2: Button (`components/ui/Button.tsx`)

**Files:**
- Modify: `components/ui/Button.tsx:19-32`

**Interfaces:**
- Consumes: `rounded-field`, `bg-fill`, `text-text`, `bg-row-hover`, `bg-primary`/`hover:bg-primary-hover`(Task 1).
- Produces: 변경 없음(props API 동일: `variant`, `size`, `loading`).

- [ ] **Step 1: `base`/`variants`/`sizes` 교체**

`Button.tsx`의 19–32행을 아래로 교체(weight 600, radius 12px, active 상태, secondary는 TDS 그레이):

```tsx
  const base = 'inline-flex items-center justify-center font-semibold rounded-field transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover',
    secondary: 'bg-fill text-[#4E5968] hover:bg-[#E5E8EB] active:bg-[#E5E8EB]',
    danger:    'bg-danger text-white hover:brightness-95 active:brightness-90',
    ghost:     'text-text hover:bg-row-hover active:bg-row-hover',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-xs gap-1',
    md: 'px-4 py-2.5 text-sm gap-1.5',
    lg: 'px-5 py-3 text-sm gap-2',
  };
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/ui/Button.tsx
git commit -m "feat(ds): Button TDS 스타일(12px radius·semibold·TDS 그레이 secondary)"
```

---

### Task 3: Input / Textarea / Select (`components/ui/Input.tsx`)

**Files:**
- Modify: `components/ui/Input.tsx` (12, 15, 18, 20, 69, 71, 74, 88, 90, 97행의 하드코딩 hex)

**Interfaces:**
- Consumes: `rounded-field`, `border-border`, `text-text`, `text-text-secondary`, `text-tertiary`, `border-primary`, `bg-sidebar`, `text-danger`, `border-danger`(Task 1).
- Produces: 변경 없음(props API 동일).

- [ ] **Step 1: `Input`의 label/input/suffix/error 클래스 교체 (11–20행)**

```tsx
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text">{label}</label>}
      <div className="relative flex items-center">
        <input
          className={`w-full bg-white border border-border rounded-field px-3.5 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors disabled:bg-sidebar disabled:text-text-secondary ${suffix ? 'pr-10' : ''} ${error ? 'border-danger' : ''} ${className}`}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-sm text-text-secondary">{suffix}</span>}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
```

- [ ] **Step 2: `Textarea` 클래스 교체 (68–74행)**

```tsx
      {label && <label className="text-sm font-medium text-text">{label}</label>}
      <textarea
        className={`w-full bg-white border border-border rounded-field px-3.5 py-2.5 text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors resize-none disabled:bg-sidebar ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
```

- [ ] **Step 3: `Select` 클래스 교체 (87–97행)**

```tsx
      {label && <label className="text-sm font-medium text-text">{label}</label>}
      <select
        className={`w-full border border-border rounded-field px-3.5 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors bg-white ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-danger">{error}</span>}
```

- [ ] **Step 4: 입력 안쪽 흰 배경 확인**

`Input`·`Textarea`·`Select` 모두 `bg-white`가 남아 있는지 육안 확인(저장된 규칙). disabled만 `bg-sidebar` 허용.

- [ ] **Step 5: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add components/ui/Input.tsx
git commit -m "feat(ds): Input/Textarea/Select TDS 토큰화(12px radius·흰 배경 유지)"
```

---

### Task 4: Card (`components/ui/Card.tsx`)

**Files:**
- Modify: `components/ui/Card.tsx:13-21`

**Interfaces:**
- Consumes: `rounded-card`, `border-border`, `text-text`(Task 1).
- Produces: 변경 없음(props API 동일).

- [ ] **Step 1: 컨테이너/헤더/본문 클래스 교체**

```tsx
    <div className={`bg-white border border-border rounded-card ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between px-6 py-5 border-b border-border ${titleClassName}`}>
          {title && <h3 className="text-base font-semibold text-text">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/ui/Card.tsx
git commit -m "feat(ds): Card TDS 스타일(16px radius·여백 정리)"
```

---

### Task 5: Modal (`components/ui/Modal.tsx`)

**Files:**
- Modify: `components/ui/Modal.tsx:30-44`

**Interfaces:**
- Consumes: `rounded-modal`, `border-border`, `text-text`, `text-text-secondary`(Task 1).
- Produces: 변경 없음(props API 동일).

- [ ] **Step 1: 패널/헤더/풋터 클래스 교체**

```tsx
      <div className={`relative bg-white rounded-modal shadow-xl w-full ${widths[size]} mx-4 max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/ui/Modal.tsx
git commit -m "feat(ds): Modal TDS 스타일(20px radius·토큰화)"
```

---

### Task 6: Table (`components/ui/Table.tsx`)

**Files:**
- Modify: `components/ui/Table.tsx:27-57`

**Interfaces:**
- Consumes: `bg-sidebar`, `border-border`, `text-text`, `text-text-secondary`, `bg-row-hover`(Task 1).
- Produces: 변경 없음(props API 동일).

- [ ] **Step 1: thead/empty/tbody 클래스 교체 (행 높이↑, 토큰화)**

```tsx
          <tr className="bg-sidebar border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3.5 text-left font-semibold text-text whitespace-nowrap ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-border ${onRowClick ? 'cursor-pointer hover:bg-row-hover' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3.5 text-text ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add components/ui/Table.tsx
git commit -m "feat(ds): Table TDS 토큰화(행 높이·hover·구분선)"
```

---

### Task 7: Badge + AttendanceDot (`components/ui/Badge.tsx`)

**Files:**
- Modify: `components/ui/Badge.tsx:35` (Badge radius), `components/ui/Badge.tsx:43-48` (AttendanceDot 색 토큰화)

**Interfaces:**
- Consumes: `text-success`→배지 색 클래스는 globals.css 유지. AttendanceDot은 토큰 색 사용.
- Produces: 변경 없음(props API 동일). `.badge-*` 클래스는 그대로 유지.

- [ ] **Step 1: Badge radius 조정 (35행)**

`rounded`(4px)를 `rounded-lg`(8px, TDS 칩 감성)로:

```tsx
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${variantClass[variant]} ${className}`}>
```

- [ ] **Step 2: AttendanceDot 색을 토큰/danger로 정렬 (43–48행)**

```tsx
  const colors = {
    attend:  'bg-success',
    absent:  'bg-danger',
    pending: 'border-2 border-text-secondary bg-transparent',
    makeup:  'bg-[#D9A80A]',
  };
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add components/ui/Badge.tsx
git commit -m "feat(ds): Badge radius·AttendanceDot 색 토큰화"
```

---

### Task 8: DeleteButton + 최종 빌드/육안 검증

**Files:**
- Modify: `components/ui/DeleteButton.tsx:17`

**Interfaces:**
- Consumes: `text-danger`(Task 1).
- Produces: 변경 없음. **약화 빨강 텍스트 링크 형태 유지**(저장된 규칙).

- [ ] **Step 1: DeleteButton 색 토큰화 (17행)**

형태(텍스트 링크 + hover underline)는 유지하고 색만 토큰으로:

```tsx
      className={`text-sm text-danger hover:underline ${className}`}
```

- [ ] **Step 2: DonutChart 확인**

`components/ui/DonutChart.tsx`를 열어 하드코딩 색이 디자인 토큰과 명백히 충돌하면 토큰으로 정렬, 아니면 변경 없음(로직 보존). 변경이 없으면 스테이징하지 않는다.

- [ ] **Step 3: 전체 빌드**

Run: `npm run build`
Expected: 빌드 성공(에러 없음)

- [ ] **Step 4: 육안 검증**

`npm run dev` 후 Admin 주요 화면(대시보드/학생/리드) 확인: radius·여백·그레이 톤이 TDS로 바뀌고, 입력 필드 흰 배경·삭제 텍스트 링크·동위 라벨 굵기 규칙이 유지되는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add components/ui/DeleteButton.tsx
git commit -m "feat(ds): DeleteButton danger 토큰화(형태 유지)"
```

---

## Self-Review

**Spec coverage:**
- 토큰(2.1–2.4) → Task 1 ✅ (radius는 충돌 회피 위해 `field/card/modal` 커스텀 이름으로 구현 — 스펙 의도 유지, 이름만 변경)
- Button → Task 2 ✅ / Input·Textarea·Select → Task 3 ✅ / Card → Task 4 ✅ / Modal → Task 5 ✅ / Table → Task 6 ✅ / Badge·AttendanceDot → Task 7 ✅ / DeleteButton·DonutChart → Task 8 ✅
- 하드코딩 hex → 토큰 유틸리티 교체: 각 Task에 포함 ✅
- 저장된 규칙(흰 배경/삭제 링크/라벨 굵기) → Task 3 Step 4, Task 8 Step 1, Global Constraints ✅
- 검증(build/육안) → Task 8 ✅

**Placeholder scan:** 모든 코드 단계에 실제 클래스 문자열 포함, "TBD/TODO" 없음 ✅ (Task 8 Step 2 DonutChart는 조건부 — 변경 없으면 스킵으로 명시)

**Type consistency:** 토큰 유틸리티 이름(`text-text`, `border-border`, `bg-fill`, `rounded-field/card/modal`, `text-danger`)이 Task 1 정의와 Task 2–8 사용에서 일치 ✅
