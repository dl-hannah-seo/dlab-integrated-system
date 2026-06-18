// 키오스크 모드 — 출석은 '등록된 키오스크 기기'에서만 가능하게 하는 게이트.
// 등록 상태는 기기 localStorage에 저장(개인기기엔 없음 → 출석 화면 미노출).

const STORAGE_KEY = 'dlab_kiosk';
/** 관리자 셋업 코드 (데모) — 실제 운영 시 서버 발급 토큰으로 대체 */
export const KIOSK_SETUP_CODE = '2024';

/** 입력 코드가 셋업 코드와 일치하는지 */
export function isValidSetupCode(code: string): boolean {
  return code.trim() === KIOSK_SETUP_CODE;
}

/** 이 기기가 키오스크로 등록되었는지 (클라이언트 전용) */
export function isKioskRegistered(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === '1';
}

/** 셋업 코드로 키오스크 등록 시도 — 성공 여부 반환 */
export function registerKiosk(code: string): boolean {
  if (!isValidSetupCode(code)) return false;
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, '1');
  return true;
}

/** 키오스크 등록 해제 */
export function unregisterKiosk(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
}
