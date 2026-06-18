import { labWeeklyMetrics, type LabWeeklyMetric } from './mock-data';

export type MetricKey =
  | 'promo_count' | 'inquiry_count' | 'new_enroll_count' | 're_enroll_count'
  | 'attendance_rate' | 'makeup_done_rate' | 'withdraw_rate' | 'parent_response_rate';

export const METRIC_LABELS: Record<MetricKey, string> = {
  promo_count: '주간 홍보 건수',
  inquiry_count: '상담 문의',
  new_enroll_count: '신규 등록',
  re_enroll_count: '재등록',
  attendance_rate: '출석률(%)',
  makeup_done_rate: '보강 완료율(%)',
  withdraw_rate: '퇴원율(%)',
  parent_response_rate: '학부모 반응(%)',
};

/** 퇴원율만 낮을수록 좋음, 나머지는 높을수록 좋음 */
export const LOWER_IS_BETTER: Record<MetricKey, boolean> = {
  promo_count: false, inquiry_count: false, new_enroll_count: false, re_enroll_count: false,
  attendance_rate: false, makeup_done_rate: false, withdraw_rate: true, parent_response_rate: false,
};

/** 비교 표시 순서 */
export const METRIC_ORDER: MetricKey[] = [
  'promo_count', 'inquiry_count', 'new_enroll_count', 're_enroll_count',
  'attendance_rate', 'makeup_done_rate', 'withdraw_rate', 'parent_response_rate',
];

export function metricsForWeek(week: string): LabWeeklyMetric[] {
  return labWeeklyMetrics.filter(m => m.week === week);
}

export function labMetricForWeek(labId: string, week: string): LabWeeklyMetric | undefined {
  return labWeeklyMetrics.find(m => m.lab_id === labId && m.week === week);
}

/** 전체 평균 (소수 1자리) */
export function averageOf(metrics: LabWeeklyMetric[], key: MetricKey): number {
  if (metrics.length === 0) return 0;
  const sum = metrics.reduce((acc, m) => acc + m[key], 0);
  return Math.round((sum / metrics.length) * 10) / 10;
}

/** 개인 - 평균 (소수 1자리) */
export function deltaVsAverage(value: number, avg: number): number {
  return Math.round((value - avg) * 10) / 10;
}

export type MetricAverages = Record<MetricKey, number>;

export function averagesForWeek(week: string): MetricAverages {
  const list = metricsForWeek(week);
  return METRIC_ORDER.reduce((acc, k) => { acc[k] = averageOf(list, k); return acc; }, {} as MetricAverages);
}

// ── 벤치마킹 (가맹랩 순위·분위) ──────────────────────────────
export interface Rank {
  rank: number;       // 1 = 최상
  total: number;
  percentile: number; // 상위 % (작을수록 우수)
}

/** 해당 주차 내 labId의 key 기준 순위·분위 (퇴원율은 낮을수록 1위) */
export function rankOf(labId: string, week: string, key: MetricKey): Rank | null {
  const list = metricsForWeek(week);
  const me = list.find(m => m.lab_id === labId);
  if (!me) return null;
  const lower = LOWER_IS_BETTER[key];
  const sorted = [...list].sort((a, b) => (lower ? a[key] - b[key] : b[key] - a[key]));
  const rank = sorted.findIndex(m => m.lab_id === labId) + 1;
  const total = sorted.length;
  const percentile = Math.round((rank / total) * 100);
  return { rank, total, percentile };
}

// ── 전환 퍼널 (홍보 → 문의 → 등록) ──────────────────────────
export interface Funnel {
  promo: number;
  inquiry: number;
  enroll: number;
  promoToInquiry: number; // %
  inquiryToEnroll: number; // %
}

export function funnelOf(m: LabWeeklyMetric): Funnel {
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);
  return {
    promo: m.promo_count,
    inquiry: m.inquiry_count,
    enroll: m.new_enroll_count,
    promoToInquiry: pct(m.inquiry_count, m.promo_count),
    inquiryToEnroll: pct(m.new_enroll_count, m.inquiry_count),
  };
}

// ── 규칙 기반 인사이트 (추후 Claude API로 대체) ──────────────
export type InsightTone = 'good' | 'warn' | 'info';
export interface Insight {
  tone: InsightTone;
  text: string;
  action?: string;  // 권장 조치
}

export function buildInsights(my: LabWeeklyMetric, avg: MetricAverages): Insight[] {
  const out: Insight[] = [];
  const f = funnelOf(my);
  const avgPromoToInquiry = avg.promo_count === 0 ? 0 : Math.round((avg.inquiry_count / avg.promo_count) * 1000) / 10;

  // 홍보량 대비 문의 전환 저조 → 콘텐츠 품질
  if (my.promo_count >= avg.promo_count * 1.5 && my.inquiry_count <= avg.inquiry_count) {
    out.push({
      tone: 'warn',
      text: `홍보 ${my.promo_count}건(평균 ${avg.promo_count})으로 많지만 문의는 ${my.inquiry_count}건(평균 ${avg.inquiry_count})으로 낮습니다. 홍보→문의 전환율 ${f.promoToInquiry}%가 평균 ${avgPromoToInquiry}%를 밑돕니다.`,
      action: '콘텐츠 품질·타겟팅을 점검하세요. 반응 좋은 채널(SNS/블로그) 위주로 재편을 권장합니다.',
    });
  }

  // 출결 낮고 퇴원율 높음 → 이탈 위험
  if (my.attendance_rate < avg.attendance_rate && my.withdraw_rate > avg.withdraw_rate) {
    out.push({
      tone: 'warn',
      text: `출석률 ${my.attendance_rate}%(평균 ${avg.attendance_rate}%)는 낮고 퇴원율 ${my.withdraw_rate}%(평균 ${avg.withdraw_rate}%)는 높습니다.`,
      action: '결석 누적 학생 학부모 상담·보강을 우선 배정해 이탈을 예방하세요.',
    });
  }

  // 문의는 받지만 등록 전환 낮음
  if (my.inquiry_count >= avg.inquiry_count && my.new_enroll_count < avg.new_enroll_count) {
    out.push({
      tone: 'info',
      text: `문의 대비 등록 전환율이 ${f.inquiryToEnroll}%로 낮습니다.`,
      action: '상담 후 등록 클로징 단계를 점검하세요.',
    });
  }

  // 보강 완료율 저조
  if (my.makeup_done_rate < avg.makeup_done_rate) {
    out.push({
      tone: 'info',
      text: `보강 완료율 ${my.makeup_done_rate}%가 평균 ${avg.makeup_done_rate}%보다 낮습니다.`,
      action: '미완료 보강 일정을 확정하고 안내 문자를 발송하세요.',
    });
  }

  // 신규+재등록 우수
  if (my.new_enroll_count + my.re_enroll_count >= (avg.new_enroll_count + avg.re_enroll_count) * 1.2) {
    out.push({ tone: 'good', text: '신규·재등록 합계가 평균을 상회합니다 — 등록 성과가 우수합니다.' });
  }

  if (out.length === 0) {
    out.push({ tone: 'info', text: '주요 지표가 전반적으로 평균 수준입니다.' });
  }
  return out;
}
