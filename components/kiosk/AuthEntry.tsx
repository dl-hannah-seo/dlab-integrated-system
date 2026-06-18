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

  const display = digits.padEnd(4, ' ').split('').map(c => (c === ' ' ? '_' : c)).join(' ');

  return (
    <div className="rounded-3xl p-7 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
      <div className="text-center mb-5">
        <div className="text-3xl">{icon}</div>
        <div className="text-lg font-extrabold text-white mt-2">{title}</div>
        <div className="text-sm mt-1" style={{ color: 'var(--kiosk-muted)' }}>전화번호 뒤 4자리를 눌러주세요</div>
      </div>

      <div className="rounded-2xl py-6 mb-4 text-center text-3xl font-extrabold tracking-[0.3em]"
        style={{ background: 'var(--kiosk-card)', color: digits ? 'var(--kiosk-text)' : 'var(--kiosk-muted)' }}>
        {display}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
          <button key={n} onClick={() => press(n)}
            className="h-14 rounded-xl text-2xl font-bold transition-all active:scale-95"
            style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-text)' }}>{n}</button>
        ))}
        <button onClick={() => press('clear')} className="h-14 rounded-xl text-xl font-bold text-white transition-all active:scale-95" style={{ background: 'var(--kiosk-orange)' }}>C</button>
        <button onClick={() => press('0')} className="h-14 rounded-xl text-2xl font-bold transition-all active:scale-95" style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-text)' }}>0</button>
        <button onClick={() => press('back')} className="h-14 rounded-xl text-xl font-bold text-white transition-all active:scale-95" style={{ background: 'var(--kiosk-orange)' }}>←</button>
      </div>

      <button onClick={confirm} disabled={digits.length !== 4}
        className="w-full h-13 mt-4 py-3.5 rounded-xl text-base font-extrabold transition-all active:scale-95"
        style={{
          background: digits.length === 4 ? 'var(--kiosk-orange)' : 'var(--kiosk-border)',
          color: digits.length === 4 ? 'white' : 'var(--kiosk-muted)',
          cursor: digits.length === 4 ? 'pointer' : 'not-allowed',
        }}>확인</button>

      {/* 결과 */}
      {!confirmed ? (
        <div className="flex items-center justify-center gap-2 mt-4">
          {hintCodes.map(code => (
            <span key={code} className="text-sm font-bold px-3 py-1 rounded-md"
              style={{ background: 'rgba(255,108,55,0.15)', color: 'var(--kiosk-orange)' }}>{code}</span>
          ))}
        </div>
      ) : matches.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm mb-2" style={{ color: 'var(--kiosk-muted)' }}>{listSub} ({matches.length}명)</p>
          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {matches.map(s => {
              const cls = classes.find(c => c.id === s.class_id);
              return (
                <button key={s.id} onClick={() => onPick(s)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all hover:border-[var(--kiosk-orange)] active:scale-[0.99]"
                  style={{ background: 'var(--kiosk-card)', borderColor: 'var(--kiosk-border)' }}>
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
        </div>
      ) : (
        <div className="text-center mt-5">
          <div className="text-3xl">😅</div>
          <div className="text-sm font-bold text-white mt-2">일치하는 학생이 없어요</div>
          <div className="text-xs mt-1" style={{ color: 'var(--kiosk-muted)' }}>번호를 다시 확인해 주세요</div>
        </div>
      )}
    </div>
  );
}
