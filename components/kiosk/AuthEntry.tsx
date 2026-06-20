'use client';

import { useState } from 'react';
import { students, classes, kioskCodes, type Student } from '@/lib/mock-data';
import { levelOf } from '@/lib/kiosk';

const hintCodes = [...new Set(students.map(s => kioskCodes[s.id]))].slice(0, 3);

/** 전화 뒤 4자리 입력 → 일치 학생 선택. 출석/대시보드 공용. */
export function AuthEntry({
  icon, title, listSub, cta, onPick,
}: {
  icon: string;
  title: string;
  listSub: string;
  cta: string;
  onPick: (s: Student) => void;
}) {
  const [digits, setDigits] = useState('');
  const [confirmed, setConfirmed] = useState('');

  const matches = confirmed.length === 4
    ? students.filter(s => kioskCodes[s.id] === confirmed && s.status === '재원').sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    : [];

  function press(key: string) {
    setConfirmed('');
    if (key === 'clear') setDigits('');
    else if (key === 'back') setDigits(d => d.slice(0, -1));
    else if (digits.length < 4) setDigits(d => d + key);
  }
  function confirm() { if (digits.length === 4) setConfirmed(digits); }
  function dismiss() { setConfirmed(''); }

  const display = digits.padEnd(4, ' ').split('').map(c => (c === ' ' ? '_' : c)).join(' ');
  const showModal = confirmed.length === 4;

  return (
    <div className="rounded-3xl px-6 pt-5 pb-4 border flex flex-col h-full"
      style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>

      {/* 헤더 */}
      <div className="text-center mb-3 flex-shrink-0">
        <div className="text-3xl">{icon}</div>
        <div className="text-xl font-extrabold text-white mt-2">{title}</div>
        <div className="text-sm mt-1" style={{ color: 'var(--kiosk-muted)' }}>전화번호 뒤 4자리를 눌러주세요</div>
      </div>

      {/* 숫자 표시 */}
      <div className="rounded-2xl py-4 mb-3 text-center text-3xl font-extrabold tracking-[0.3em] flex-shrink-0"
        style={{ background: 'var(--kiosk-card)', color: digits ? 'var(--kiosk-orange)' : 'var(--kiosk-muted)' }}>
        {display}
      </div>

      {/* 키패드 영역 — 남은 공간을 채움 */}
      <div className="relative flex-1 min-h-0">
        {/* 키패드 (항상 렌더, 오버레이 시 invisible) */}
        <div className={`flex flex-col h-full gap-3${showModal ? ' invisible pointer-events-none' : ''}`}>
          {/* 숫자 그리드 — flex-1로 늘어남, 각 행 균등 분배 */}
          <div className="grid grid-cols-3 gap-2 flex-1 auto-rows-fr">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button key={n} onClick={() => press(n)}
                className="rounded-xl text-2xl font-bold transition-all active:scale-95"
                style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-orange)' }}>{n}</button>
            ))}
            <button onClick={() => press('clear')}
              className="rounded-xl text-xl font-bold text-white transition-all active:scale-95"
              style={{ background: 'var(--kiosk-orange)' }}>C</button>
            <button onClick={() => press('0')}
              className="rounded-xl text-2xl font-bold transition-all active:scale-95"
              style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-orange)' }}>0</button>
            <button onClick={() => press('back')}
              className="rounded-xl text-xl font-bold text-white transition-all active:scale-95"
              style={{ background: 'var(--kiosk-orange)' }}>←</button>
          </div>

          {/* 확인 버튼 */}
          <button onClick={confirm} disabled={digits.length !== 4}
            className="w-full py-3 rounded-xl text-base font-extrabold transition-all active:scale-95 flex-shrink-0"
            style={{
              background: digits.length === 4 ? 'var(--kiosk-orange)' : 'var(--kiosk-border)',
              color: digits.length === 4 ? 'white' : 'var(--kiosk-muted)',
              cursor: digits.length === 4 ? 'pointer' : 'not-allowed',
            }}>확인</button>

          {/* 힌트 코드 */}
          <div className="flex items-center justify-center gap-2 flex-shrink-0">
            {hintCodes.map(code => (
              <span key={code} className="text-sm font-bold px-3 py-1 rounded-md"
                style={{ background: 'rgba(255,108,55,0.15)', color: 'var(--kiosk-orange)' }}>{code}</span>
            ))}
          </div>
        </div>

        {/* 학생 선택 오버레이 — 키패드 위에 모달처럼 */}
        {showModal && (
          <div className="absolute inset-0 rounded-2xl flex flex-col overflow-hidden" style={{ background: 'var(--kiosk-card)' }}>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b" style={{ borderColor: 'var(--kiosk-border)' }}>
              <button onClick={dismiss}
                className="text-sm font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ color: 'var(--kiosk-muted)', background: 'var(--kiosk-surface)', border: '1px solid var(--kiosk-border)' }}>
                ← 다시 입력
              </button>
            </div>

            {matches.length > 0 ? (
              <div className="flex flex-col gap-2 overflow-y-auto p-3">
                {matches.map(s => {
                  const cls = classes.find(c => c.id === s.class_id);
                  return (
                    <button key={s.id} onClick={() => onPick(s)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all hover:border-[var(--kiosk-orange)] active:scale-[0.99]"
                      style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
                      <div className="w-10 h-10 flex items-center justify-center rounded-full font-bold flex-shrink-0"
                        style={{ background: 'rgba(255,108,55,0.18)', color: 'var(--kiosk-orange)' }}>{s.name.charAt(1) || s.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white">{s.name}</div>
                        <div className="text-sm truncate" style={{ color: 'var(--kiosk-muted)' }}>{cls?.course} · Lv.{levelOf(s.points)} · {s.points}P</div>
                      </div>
                      <span className="px-3 h-9 inline-flex items-center rounded-xl font-bold text-white flex-shrink-0" style={{ background: 'var(--kiosk-orange)' }}>{cta}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
                <div className="text-3xl">😅</div>
                <div className="text-sm font-bold text-white mt-2">일치하는 학생이 없어요</div>
                <div className="text-xs mt-1" style={{ color: 'var(--kiosk-muted)' }}>번호를 다시 확인해 주세요</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
