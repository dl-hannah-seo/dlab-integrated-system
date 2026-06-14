'use client';

import { useState } from 'react';
import { students, classes, todaySessions, Student } from '@/lib/mock-data';
import Link from 'next/link';

type Step = 'input' | 'select' | 'ready' | 'done';

export default function KioskPage() {
  const [step, setStep] = useState<Step>('input');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [matched, setMatched] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [checkinTime, setCheckinTime] = useState('');

  function handlePhoneInput(digit: string) {
    if (phone.length < 8) setPhone(p => p + digit);
  }
  function handleBackspace() {
    setPhone(p => p.slice(0, -1));
    setPhoneError('');
  }
  function handleSearch() {
    if (phone.length !== 8) { setPhoneError('8자리를 모두 입력하세요'); return; }
    // 학부모 연락처 뒤 8자리 매칭 (하이픈 제거 후)
    const suffix = phone;
    const found = students.filter(s => s.parent_phone.replace(/-/g, '').slice(-8) === suffix);
    if (found.length === 0) { setPhoneError('일치하는 원생이 없습니다'); return; }
    setMatched(found);
    if (found.length === 1) { setSelected(found[0]); setStep('ready'); }
    else setStep('select');
  }
  function handleCheckin() {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setCheckinTime(timeStr);
    setStep('done');
  }
  function handleReset() {
    setStep('input'); setPhone(''); setPhoneError('');
    setMatched([]); setSelected(null); setCheckinTime('');
  }

  const todayClass = selected ? classes.find(c => c.id === selected.class_id) : null;
  const todaySession = todayClass ? todaySessions.find(s => s.class_id === todayClass.id) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: 'linear-gradient(135deg, #0F0F14 0%, #1A1A28 100%)' }}>

      {/* 헤더 */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold" style={{ color: 'var(--kiosk-orange)' }}>D.LAB</span>
          <span className="text-2xl font-bold text-white">강남 캠퍼스</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>출석 체크인</p>
      </div>

      {/* 카드 */}
      <div className="w-full max-w-sm rounded-2xl p-8 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>

        {step === 'input' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-1 text-center">부모님 연락처 뒤 8자리</h2>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--kiosk-muted)' }}>예: 010-1234-<strong style={{color:'var(--kiosk-orange)'}}>5678</strong> → 12345678</p>

            {/* 입력 표시 */}
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="w-9 h-10 flex items-center justify-center rounded-lg border text-lg font-bold text-white"
                  style={{ borderColor: phone.length === i ? 'var(--kiosk-orange)' : 'var(--kiosk-border)', background: 'var(--kiosk-card)' }}>
                  {phone[i] ? '•' : ''}
                </div>
              ))}
            </div>
            {phoneError && <p className="text-center text-sm mb-3" style={{ color: '#FF6C37' }}>{phoneError}</p>}

            {/* 숫자 패드 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1','2','3','4','5','6','7','8','9','','0','←'].map((d) => (
                <button key={d} disabled={!d && d !== '0'}
                  onClick={() => d === '←' ? handleBackspace() : d !== '' && handlePhoneInput(d)}
                  className="h-14 rounded-xl text-xl font-semibold transition-all active:scale-95"
                  style={{
                    background: d === '←' ? 'var(--kiosk-border)' : 'var(--kiosk-card)',
                    color: d === '←' ? 'var(--kiosk-muted)' : 'var(--kiosk-text)',
                    opacity: d === '' ? 0 : 1,
                  }}>
                  {d}
                </button>
              ))}
            </div>

            <button onClick={handleSearch}
              className="w-full h-14 rounded-xl text-base font-bold text-white transition-all active:scale-95"
              style={{ background: 'var(--kiosk-orange)' }}>
              확인
            </button>
          </div>
        )}

        {step === 'select' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4 text-center">본인을 선택하세요</h2>
            <div className="space-y-3">
              {matched.map(s => (
                <button key={s.id} onClick={() => { setSelected(s); setStep('ready'); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-[#FF6C37]"
                  style={{ background: 'var(--kiosk-card)', borderColor: 'var(--kiosk-border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{ background: 'var(--kiosk-orange)', color: 'white' }}>
                    {s.name[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>{s.grade} · {classes.find(c => c.id === s.class_id)?.schedule}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={handleReset} className="mt-4 w-full text-sm py-3 rounded-xl" style={{ color: 'var(--kiosk-muted)', background: 'var(--kiosk-border)' }}>
              다시 입력
            </button>
          </div>
        )}

        {step === 'ready' && selected && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, var(--kiosk-orange), var(--kiosk-orange2))' }}>
              {selected.name[0]}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{selected.name}</h2>
            <p className="mb-1" style={{ color: 'var(--kiosk-muted)' }}>{selected.grade} · {selected.school}</p>
            {todaySession && (
              <div className="mt-3 mb-6 px-4 py-2.5 rounded-xl border inline-block" style={{ borderColor: 'var(--kiosk-orange)', background: 'rgba(255,108,55,0.1)' }}>
                <p className="text-sm" style={{ color: 'var(--kiosk-orange)' }}>
                  오늘 수업: {todayClass?.schedule} · {todaySession.session_no}회차
                </p>
              </div>
            )}
            <div className="mb-4 flex items-center justify-center gap-4 text-sm" style={{ color: 'var(--kiosk-muted)' }}>
              <span>⚡ {selected.streak}일 연속출석</span>
              <span>💎 {selected.points.toLocaleString()} DP</span>
            </div>
            <button onClick={handleCheckin}
              className="w-full h-16 rounded-2xl text-xl font-bold text-white mb-3 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--kiosk-orange), #FF9A5A)' }}>
              ✅ 출석 체크인
            </button>
            <button onClick={handleReset} className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>취소</button>
          </div>
        )}

        {step === 'done' && selected && (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">{selected.name}</h2>
            <p className="text-lg mb-1" style={{ color: 'var(--kiosk-orange)' }}>{checkinTime} 등원 완료!</p>
            <p className="text-sm mb-6" style={{ color: 'var(--kiosk-muted)' }}>학부모님께 알림톡이 발송되었습니다</p>

            {/* 포인트 획득 */}
            <div className="rounded-xl p-4 mb-4 border" style={{ background: 'var(--kiosk-card)', borderColor: 'var(--kiosk-border)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--kiosk-muted)' }}>획득 포인트</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--kiosk-gold)' }}>+50 DP</p>
              <p className="text-xs mt-1" style={{ color: 'var(--kiosk-muted)' }}>정시 출석 보너스 포함</p>
            </div>

            {/* 칭호 */}
            {selected.title && (
              <div className="rounded-xl p-3 mb-6 border" style={{ background: 'rgba(255,108,55,0.1)', borderColor: 'var(--kiosk-orange)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--kiosk-orange)' }}>🏆 {selected.title}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/kiosk/info"
                className="flex-1 py-3 rounded-xl font-medium text-sm text-center transition-all"
                style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-text)', border: '1px solid var(--kiosk-border)' }}>
                내 정보 보기
              </Link>
              <button onClick={handleReset}
                className="flex-1 py-3 rounded-xl font-medium text-sm text-white transition-all active:scale-95"
                style={{ background: 'var(--kiosk-orange)' }}>
                완료
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 링크 */}
      <div className="mt-6 flex gap-4 text-sm" style={{ color: 'var(--kiosk-muted)' }}>
        <Link href="/kiosk/info" className="hover:text-white transition-colors">내 정보</Link>
        <span>·</span>
        <Link href="/kiosk/shop" className="hover:text-white transition-colors">포인트 상점</Link>
      </div>
    </div>
  );
}
