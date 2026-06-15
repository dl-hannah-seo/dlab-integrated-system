# 수납 입력 필드 보강 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 레거시 창구수납 화면 기준으로 수납 입력 모달과 원생 정보 카드에 누락된 필드를 추가한다.

**Architecture:** 2개 파일만 수정. `lib/mock-data.ts`에서 Payment 타입 확장 → `app/(admin)/payments/page.tsx`에서 UI 반영 (모달 폼, 원생 요약 카드, 수납 이력 테이블). 모달 폼은 기존 uncontrolled input 패턴 유지.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS

---

## 파일 맵

| 파일 | 변경 내용 |
|------|-----------|
| `lib/mock-data.ts` | `Payment` 인터페이스에 5개 옵셔널 필드 추가, `buildInvoices()`에 데모 데이터 보강 |
| `app/(admin)/payments/page.tsx` | 모달 폼 필드 추가, 원생 요약 카드 연락처 행 추가, 수납 이력 테이블 컬럼 추가 |

---

## Task 1: Payment 타입 확장

**Files:**
- Modify: `lib/mock-data.ts:478-489` (Payment 인터페이스)
- Modify: `lib/mock-data.ts:517-531` (buildInvoices 내 payment push)

- [ ] **Step 1: Payment 인터페이스에 필드 추가**

`lib/mock-data.ts`의 `Payment` 인터페이스를 아래로 교체:

```typescript
export interface Payment {
  id: string;
  invoice_id: string;
  student_id: string;
  card_amount: number;
  cash_amount: number;
  method: PayMethod;
  card_type: string;           // 카드사 (국민, 신한, 삼성, 현대 등)
  card_detail?: string;        // 카드 세부종류 (일반/체크/기업)
  cash_receipt: boolean;
  cash_receipt_no?: string;    // 현금영수증 번호
  amount: number;
  paid_at: string;
  cancellation_no?: string;    // 취소번호
  special_note?: string;       // 특이사항
  terminal_id?: string;        // 결제단말기
}
```

- [ ] **Step 2: buildInvoices()에서 card_detail 데모 데이터 추가**

`buildInvoices()` 내 `payments.push(...)` 블록에서 `card_type` 아래에 `card_detail` 추가:

```typescript
payments.push({
  id: `pay-${s.id}`,
  invoice_id: invoiceId,
  student_id: s.id,
  card_amount: method === '카드' ? total - (i % 10 === 0 ? 20000 : 0) : 0,
  cash_amount: method === '현금' ? total : 0,
  method,
  card_type: method === '카드' ? ['국민', '신한', '삼성', '현대'][i % 4] + '카드' : '',
  card_detail: method === '카드' ? ['일반', '체크', '기업'][i % 3] : undefined,
  cash_receipt: method === '현금' && i % 2 === 0,
  cash_receipt_no: method === '현금' && i % 2 === 0 ? `CR${String(20260600 + i).padStart(10, '0')}` : undefined,
  amount: total - (i % 10 === 0 ? 20000 : 0),
  paid_at: `2026-06-0${(i % 9) + 1}T10:00:00`,
});
```

- [ ] **Step 3: 타입 체크**

```powershell
cd "c:\Users\user\OneDrive\Desktop\통합시스템" && npx tsc --noEmit 2>&1
```

Expected: 에러 없음 (또는 payments/page.tsx 관련 에러만 — Task 2에서 해결)

- [ ] **Step 4: 커밋**

```bash
git add lib/mock-data.ts
git commit -m "feat(payment): Payment 타입에 card_detail·취소번호·특이사항·결제단말기 필드 추가"
```

---

## Task 2: 수납 입력 모달 폼 보강

**Files:**
- Modify: `app/(admin)/payments/page.tsx:275-330` (Modal 내부)

레거시 대비 추가할 필드: 수납일자(date), 수강기간(read-only), 수납대상금액(computed), 누적수납(read-only), 카드종류 2단계, 취소번호, 현금영수증 radio, 특이사항, 결제단말기

- [ ] **Step 1: 모달 내부 form 컨텐츠 교체**

`app/(admin)/payments/page.tsx`의 `{/* 수납 입력 모달 */}` 블록 내 `<div className="space-y-4">...</div>` 전체를 아래로 교체:

```tsx
<div className="space-y-3">
  {/* Row 1: 수강년월 + 수납일자 */}
  <div className="grid grid-cols-2 gap-3">
    <Input label="수강년월" type="month" defaultValue={monthFilter} />
    <Input label="수납일자" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
  </div>

  {/* Row 2: 수강기간 (read-only) */}
  <div className="bg-[#F7F7F5] rounded-lg px-3 py-2 text-sm text-[#37352F]">
    <span className="text-xs text-[#787774] mr-2">수강기간</span>
    {cls ? `${cls.start_date} ~ ${cls.end_date}` : '-'}
  </div>

  {/* Row 3: 수납구분 + 수납방법 */}
  <div className="grid grid-cols-2 gap-3">
    <Select label="수납구분" options={[
      { value: '완납', label: '완납' },
      { value: '분납', label: '분납' },
    ]} />
    <Select label="수납방법" options={[
      { value: '카드', label: '카드' },
      { value: '현금', label: '현금' },
      { value: '계좌이체', label: '계좌이체' },
    ]} />
  </div>

  {/* Row 4: 대상금액 + 할인금액 */}
  <div className="grid grid-cols-2 gap-3">
    <Input label="대상금액" type="number" defaultValue={String(totalAmount)} suffix="원" />
    <Input label="할인금액" type="number" defaultValue="0" suffix="원" />
  </div>

  {/* Row 5: 수납대상금액(computed) + 누적수납(read-only) */}
  <div className="grid grid-cols-2 gap-3">
    <div className="bg-[#FFF8F5] border border-[#FFD4C2] rounded-lg px-3 py-2">
      <p className="text-xs text-[#787774] mb-0.5">수납대상금액</p>
      <p className="text-sm font-bold text-[#FF6C37] tabular-nums">{fmt(totalAmount)}</p>
    </div>
    <div className="bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg px-3 py-2">
      <p className="text-xs text-[#787774] mb-0.5">누적수납</p>
      <p className="text-sm font-bold text-[#37352F] tabular-nums">
        {fmt(studentPayments.reduce((sum, p) => sum + p.amount, 0))}
      </p>
    </div>
  </div>

  {/* Row 6: 카드 수납액 + 현금 수납액 */}
  <div className="grid grid-cols-2 gap-3">
    <Input label="카드수납" type="number" defaultValue={String(totalAmount)} suffix="원" />
    <Input label="현금수납" type="number" defaultValue="0" suffix="원" />
  </div>

  {/* Row 7: 카드종류 2단계 */}
  <div className="grid grid-cols-2 gap-3">
    <Select label="카드사" options={['국민', '신한', '삼성', '현대', '하나', '우리'].map(s => ({ value: s, label: s + '카드' }))} />
    <Select label="카드종류" options={[
      { value: '일반', label: '일반' },
      { value: '체크', label: '체크' },
      { value: '기업', label: '기업' },
    ]} />
  </div>

  {/* Row 8: 취소번호 + 결제단말기 */}
  <div className="grid grid-cols-2 gap-3">
    <Input label="취소번호" placeholder="승인취소 시 입력" />
    <Input label="결제단말기" placeholder="단말기 ID" />
  </div>

  {/* Row 9: 현금영수증 radio */}
  <div>
    <p className="text-xs font-medium text-[#37352F] mb-1.5">현금영수증</p>
    <div className="flex gap-4">
      <label className="flex items-center gap-1.5 text-sm text-[#37352F] cursor-pointer">
        <input type="radio" name="cash_receipt" value="발행" defaultChecked className="accent-[#FF6C37]" />
        발행
      </label>
      <label className="flex items-center gap-1.5 text-sm text-[#37352F] cursor-pointer">
        <input type="radio" name="cash_receipt" value="미발행" className="accent-[#FF6C37]" />
        미발행
      </label>
    </div>
  </div>

  {/* Row 10: 특이사항 */}
  <Input label="특이사항" placeholder="메모 입력" />

  {paySuccess && (
    <div className="bg-[#EDF7F5] border border-[#0F7B6C]/20 rounded-lg px-4 py-3 text-sm font-semibold text-[#0F7B6C]">
      ✓ 수납 처리 완료. 청구서 상태가 완납으로 변경됩니다.
    </div>
  )}
</div>
```

- [ ] **Step 2: 타입 체크**

```powershell
cd "c:\Users\user\OneDrive\Desktop\통합시스템" && npx tsc --noEmit 2>&1
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/(admin)/payments/page.tsx
git commit -m "feat(payment): 수납 입력 모달에 수납일자·수강기간·수납대상금액·누적수납·카드종류2단계·취소번호·현금영수증radio·특이사항·결제단말기 추가"
```

---

## Task 3: 원생 요약 카드 연락처 행 추가

**Files:**
- Modify: `app/(admin)/payments/page.tsx:160-188` (원생 요약 카드)

- [ ] **Step 1: 원생 이름/학년 라인 아래에 연락처 행 추가**

`app/(admin)/payments/page.tsx`의 원생 요약 Card 안, `</div>` (학년/스케줄 줄) 바로 아래에 다음 삽입:

```tsx
{/* 연락처 정보 행 */}
<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#787774]">
  {selectedStudent.school && (
    <span>🏫 {selectedStudent.school}</span>
  )}
  {selectedStudent.student_phone && (
    <span>📱 {selectedStudent.student_phone}</span>
  )}
  <span>👩 모 {selectedStudent.parent_phone}</span>
  {selectedStudent.father_phone && (
    <span>👨 부 {selectedStudent.father_phone}</span>
  )}
</div>
```

구체적 위치 — 현재 코드 기준:
```tsx
// 교체 전 (line 164-166):
<div>
  <h2 className="text-base font-bold text-[#37352F]">{selectedStudent.name}</h2>
  <p className="text-sm text-[#787774]">{selectedStudent.grade} · {cls?.schedule} · {cls?.course}</p>
</div>

// 교체 후:
<div>
  <h2 className="text-base font-bold text-[#37352F]">{selectedStudent.name}</h2>
  <p className="text-sm text-[#787774]">{selectedStudent.grade} · {cls?.schedule} · {cls?.course}</p>
  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#787774]">
    {selectedStudent.school && <span>학교 {selectedStudent.school}</span>}
    {selectedStudent.student_phone && <span>원생 {selectedStudent.student_phone}</span>}
    <span>모 {selectedStudent.parent_phone}</span>
    {selectedStudent.father_phone && <span>부 {selectedStudent.father_phone}</span>}
  </div>
</div>
```

- [ ] **Step 2: 타입 체크**

```powershell
cd "c:\Users\user\OneDrive\Desktop\통합시스템" && npx tsc --noEmit 2>&1
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/(admin)/payments/page.tsx
git commit -m "feat(payment): 원생 요약 카드에 학교·원생 전화번호·부모HP 부/모 구분 표시 추가"
```

---

## Task 4: 수납 이력 테이블 컬럼 보강

**Files:**
- Modify: `app/(admin)/payments/page.tsx:220-233` (수납 이력 Table)

레거시 기준 추가 컬럼: 수납내용(반명), 상태, 수강기간

- [ ] **Step 1: Table columns 교체**

`app/(admin)/payments/page.tsx`의 `<Table columns={[...]} .../>` 블록을 아래로 교체:

```tsx
<Table
  columns={[
    {
      key: 'paid_at',
      header: '수납일자',
      render: r => <span className="tabular-nums text-xs">{String(r.paid_at).slice(0, 10)}</span>,
    },
    {
      key: 'invoice_id',
      header: '수납내용',
      render: r => {
        const inv = invoices.find(i => i.id === String(r.invoice_id));
        const cl = inv ? classes.find(c => c.id === inv.class_id) : null;
        return <span className="text-xs text-[#37352F]">{cl ? cl.name : '-'}</span>;
      },
    },
    {
      key: 'invoice_id',
      header: '상태',
      render: r => {
        const inv = invoices.find(i => i.id === String(r.invoice_id));
        return (
          <Badge variant={inv?.status === '완납' ? 'paid' : 'unpaid'}>
            {inv?.status ?? '-'}
          </Badge>
        );
      },
    },
    { key: 'method', header: '수납방법' },
    {
      key: 'card_type',
      header: '카드종류',
      render: r => {
        const detail = r.card_detail ? ` (${r.card_detail})` : '';
        return <span className="text-xs text-[#787774]">{String(r.card_type) || '-'}{detail}</span>;
      },
    },
    {
      key: 'amount',
      header: '수납금액',
      render: r => <span className="tabular-nums font-medium">{Number(r.amount).toLocaleString()}원</span>,
    },
  ]}
  data={studentPayments as unknown as Record<string, unknown>[]}
/>
```

- [ ] **Step 2: 타입 체크**

```powershell
cd "c:\Users\user\OneDrive\Desktop\통합시스템" && npx tsc --noEmit 2>&1
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add app/(admin)/payments/page.tsx
git commit -m "feat(payment): 수납 이력 테이블에 수납내용·상태·카드세부종류 컬럼 추가"
```

---

## Self-Review

### Spec coverage
- [x] 수납일자 date input → Task 2
- [x] 수강기간 read-only → Task 2
- [x] 수납대상금액 computed → Task 2
- [x] 누적수납 read-only → Task 2
- [x] 카드종류 2단계 → Task 2
- [x] 취소번호 → Task 2
- [x] 현금영수증 radio → Task 2
- [x] 특이사항 → Task 2
- [x] 결제단말기 → Task 2
- [x] 원생 전화번호/학교/부모HP 부모 구분 → Task 3
- [x] 수납 이력 수납내용·상태 컬럼 → Task 4
- [x] Payment 타입에 신규 필드 추가 → Task 1

### Placeholder scan
없음 — 모든 step에 실제 코드 포함

### Type consistency
- `card_detail?: string` — Task 1 인터페이스 → Task 2 모달(입력만, 타입 사용 없음) → Task 4 테이블(`r.card_detail`)
- `studentPayments` — payments/page.tsx line 60에서 이미 정의됨, Task 2에서 누적수납 계산에 사용
- `invoices`, `classes` — 이미 import됨, Task 4에서 수납내용 조회에 사용
- `Badge` — 이미 import됨, Task 4에서 상태 컬럼에 사용
