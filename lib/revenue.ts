// 매출 현황(재무 현황) — 본사 정산 계산 로직.
// 가맹 캠퍼스가 본사에 납부하는 로열티(교육 매출의 6%)와 콘텐츠 사용료를 산출한다.
// mock-data를 주입받는 순수 함수만 둔다. 설계: docs/superpowers/specs/2026-06-17-revenue-dashboard-design.md
import type { Class } from './mock-data';

// 가맹 로열티율 (교육 매출 대비)
export const ROYALTY_RATE = 0.06;

// 콘텐츠 사용료 청구 한 줄 (과목 = 콘텐츠 단위)
export interface ContentBillRow {
  content: string;    // 콘텐츠명 (course)
  students: number;   // 사용 학생 수 (Σ enrolled_count)
  unitPrice: number;  // 1인 단가 (content_fee)
  amount: number;     // 청구액 (students × unitPrice)
}

export interface RevenueSummary {
  eduRevenue: number;            // 교육 매출 — Σ(수강료 × 재원 학생수)
  royalty: number;               // 가맹 로열티 — 교육 매출 × 6% (본사 납부)
  contentTotal: number;          // 콘텐츠 사용료 합계 (본사 납부)
  hqTotal: number;               // 본사 납부 합계 — 로열티 + 콘텐츠 사용료
  contentRows: ContentBillRow[]; // 콘텐츠 사용료 청구 상세
}

// 정산 대상 = 재원 반(진행 중). 종강 반은 enrolled_count가 0이라 자연히 제외된다.
function isActive(c: Class): boolean {
  return c.enrolled_count > 0;
}

export function computeRevenue(classes: Class[]): RevenueSummary {
  const active = classes.filter(isActive);

  const eduRevenue = active.reduce((sum, c) => sum + c.tuition_fee * c.enrolled_count, 0);
  const royalty = Math.round(eduRevenue * ROYALTY_RATE);

  // content_fee > 0인 반을 과목(course)별로 묶어 학생 수를 합산한다.
  const byContent = new Map<string, ContentBillRow>();
  for (const c of active) {
    if (c.content_fee <= 0) continue;
    const existing = byContent.get(c.course);
    if (existing) {
      existing.students += c.enrolled_count;
      existing.amount = existing.students * existing.unitPrice;
    } else {
      byContent.set(c.course, {
        content: c.course,
        students: c.enrolled_count,
        unitPrice: c.content_fee,
        amount: c.enrolled_count * c.content_fee,
      });
    }
  }
  const contentRows = [...byContent.values()];
  const contentTotal = contentRows.reduce((sum, row) => sum + row.amount, 0);

  return {
    eduRevenue,
    royalty,
    contentTotal,
    hqTotal: royalty + contentTotal,
    contentRows,
  };
}

export function fmt(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}
