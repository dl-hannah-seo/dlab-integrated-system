import { describe, it, expect } from 'vitest';
import { isValidSetupCode, KIOSK_SETUP_CODE } from './kiosk-mode';

describe('isValidSetupCode', () => {
  it('셋업 코드 일치 시 true', () => {
    expect(isValidSetupCode(KIOSK_SETUP_CODE)).toBe(true);
    expect(isValidSetupCode(` ${KIOSK_SETUP_CODE} `)).toBe(true); // 공백 트림
  });
  it('불일치 시 false', () => {
    expect(isValidSetupCode('0000')).toBe(false);
    expect(isValidSetupCode('')).toBe(false);
  });
});
