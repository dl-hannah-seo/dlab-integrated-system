import { useMemo, useSyncExternalStore } from 'react';
import { type Lead, type LeadStage } from './mock-data';

// ── 홍보 채널 (랩장 수동 입력) ─────────────────────────────────
export type PromoChannel = 'blog' | 'sns' | 'sms' | 'kakao' | 'etc';
export const PROMO_CHANNELS: PromoChannel[] = ['blog', 'sns', 'sms', 'kakao', 'etc'];
export const CHANNEL_LABELS: Record<PromoChannel, string> = {
  blog: '블로그',
  sns: 'SNS',
  sms: '문자',
  kakao: '카카오톡',
  etc: '기타',
};

/** 한 분기의 채널별 홍보 건수 */
export type PromoQuarter = Record<PromoChannel, number>;

export function emptyQuarter(): PromoQuarter {
  return { blog: 0, sns: 0, sms: 0, kakao: 0, etc: 0 };
}

/** 채널 합산 = 퍼널의 '홍보' 단계 값 */
export function promoSum(q: PromoQuarter): number {
  return PROMO_CHANNELS.reduce((s, c) => s + (q[c] || 0), 0);
}

// ── 분기 헬퍼 ─────────────────────────────────────────────────
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 'YYYY-MM-DD' → 'YYYY-Qn' */
export function quarterOf(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

export function currentQuarter(today: string): string {
  return quarterOf(today);
}

/** 'YYYY-Qn' → '2026년 2분기' */
export function quarterLabel(key: string): string {
  const [y, q] = key.split('-Q');
  return `${y}년 ${q}분기`;
}

/** 'YYYY-Qn' 의 시작·종료일(YYYY-MM-DD) */
export function quarterRange(key: string): { start: string; end: string } {
  const [y, q] = key.split('-Q').map(Number);
  const startMonth = (q - 1) * 3; // 0-based
  const start = new Date(y, startMonth, 1);
  const end = new Date(y, startMonth + 3, 0); // 다음 분기 0일 = 이번 분기 말일
  return { start: fmt(start), end: fmt(end) };
}

/** today 기준 최신순 n개 분기 키 */
export function lastNQuarters(today: string, n: number): string[] {
  const d = new Date(today);
  let y = d.getFullYear();
  let q = Math.floor(d.getMonth() / 3) + 1;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(`${y}-Q${q}`);
    q -= 1;
    if (q < 1) { q = 4; y -= 1; }
  }
  return out;
}

// ── 상담·입관 집계 (분기 단위) ────────────────────────────────
const CONSULTED_STAGES: LeadStage[] = ['상담완료', '등록', '미등록'];

/** 해당 분기 inquiry_date 기준 상담·입관 집계 */
export function quarterFunnel(leads: Lead[], key: string): { consult: number; enroll: number } {
  const { start, end } = quarterRange(key);
  const win = leads.filter(l => l.inquiry_date >= start && l.inquiry_date <= end);
  return {
    consult: win.filter(l => CONSULTED_STAGES.includes(l.stage)).length,
    enroll: win.filter(l => l.stage === '등록').length,
  };
}

/** 전환율(%) = numer / denom, denom 0이면 0 */
export function rate(numer: number, denom: number): number {
  return denom === 0 ? 0 : Math.round((numer / denom) * 1000) / 10;
}

// ── 데모 시드 ─────────────────────────────────────────────────
// 과거 분기는 리드 데이터가 없어 표가 비므로 데모용 시드를 사용.
// 현재 분기 상담·입관은 항상 실데이터(quarterFunnel)로 계산한다.
const PAST_SEED: Record<string, { promo: PromoQuarter; consult: number; enroll: number }> = {
  '2026-Q1': { promo: { blog: 42, sns: 38, sms: 25, kakao: 30, etc: 8 }, consult: 48, enroll: 19 },
  '2025-Q4': { promo: { blog: 35, sns: 30, sms: 20, kakao: 22, etc: 5 }, consult: 40, enroll: 15 },
  '2025-Q3': { promo: { blog: 28, sns: 25, sms: 18, kakao: 18, etc: 4 }, consult: 33, enroll: 12 },
  '2025-Q2': { promo: { blog: 22, sns: 20, sms: 14, kakao: 15, etc: 3 }, consult: 26, enroll: 9 },
};

/** 현재 분기 미입력 시 기본값(데모) */
export const CURRENT_QUARTER_SEED: PromoQuarter = { blog: 48, sns: 45, sms: 30, kakao: 35, etc: 10 };

// 퇴원율(%) 데모 — 퇴원 집계 연동 전 임시값
const DEMO_WITHDRAW_RATE: Record<string, number> = {
  '2026-Q2': 4.2,
  '2026-Q1': 5.1,
  '2025-Q4': 6.3,
  '2025-Q3': 5.8,
  '2025-Q2': 7.0,
};
function withdrawRateOf(key: string): number {
  return DEMO_WITHDRAW_RATE[key] ?? 0;
}

// ── localStorage 저장소 ──────────────────────────────────────
export type PromoStore = Record<string, PromoQuarter>;
const STORE_KEY = 'dlab.promo.v1';
const STORE_EVENT = 'dlab-promo-change'; // 같은 탭 내 동기화용 커스텀 이벤트

export function loadStore(): PromoStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as PromoStore) : {};
  } catch {
    return {};
  }
}

export function saveQuarter(key: string, q: PromoQuarter): void {
  if (typeof window === 'undefined') return;
  try {
    const store = loadStore();
    store[key] = q;
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(STORE_EVENT));
  } catch {
    /* 저장 실패는 무시 (시크릿 모드 등) */
  }
}

// ── localStorage 구독 훅 (SSR-safe) ──────────────────────────
function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);   // 다른 탭
  window.addEventListener(STORE_EVENT, cb); // 같은 탭
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(STORE_EVENT, cb);
  };
}
// 원시 문자열 스냅샷을 반환해야 useSyncExternalStore가 안정적으로 동작한다.
function getRawSnapshot(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORE_KEY) ?? '';
}
function getServerSnapshot(): string {
  return '';
}

/** localStorage 홍보 저장소를 구독해 PromoStore로 반환 (변경 시 자동 리렌더) */
export function usePromoStore(): PromoStore {
  const raw = useSyncExternalStore(subscribe, getRawSnapshot, getServerSnapshot);
  return useMemo<PromoStore>(() => {
    if (!raw) return {};
    try {
      return JSON.parse(raw) as PromoStore;
    } catch {
      return {};
    }
  }, [raw]);
}

/** 분기 채널 입력값 조회 — 저장값 > 시드 > 빈값 */
export function getQuarter(store: PromoStore, key: string, today: string): PromoQuarter {
  if (store[key]) return store[key];
  if (key === currentQuarter(today)) return { ...CURRENT_QUARTER_SEED };
  return PAST_SEED[key]?.promo ? { ...PAST_SEED[key].promo } : emptyQuarter();
}

export interface QuarterRow {
  key: string;
  promo: PromoQuarter;
  promoTotal: number;
  consult: number;
  enroll: number;
  withdrawRate: number; // 퇴원율(%) — 데모
}

/** 최신순 n개 분기 행 — 현재 분기는 실데이터, 과거는 시드(저장값 우선) */
export function quarterRows(leads: Lead[], store: PromoStore, today: string, n = 5): QuarterRow[] {
  const cur = currentQuarter(today);
  return lastNQuarters(today, n).map(key => {
    const promo = getQuarter(store, key, today);
    const seeded = PAST_SEED[key];
    const f = key === cur || !seeded ? quarterFunnel(leads, key) : { consult: seeded.consult, enroll: seeded.enroll };
    return { key, promo, promoTotal: promoSum(promo), consult: f.consult, enroll: f.enroll, withdrawRate: withdrawRateOf(key) };
  });
}
