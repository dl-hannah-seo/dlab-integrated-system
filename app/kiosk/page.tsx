'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { kioskPosters, type Student } from '@/lib/mock-data';
import { AuthEntry } from '@/components/kiosk/AuthEntry';
import { AttendanceComplete } from '@/components/kiosk/AttendanceComplete';
import { isKioskRegistered, registerKiosk, unregisterKiosk, isValidSetupCode } from '@/lib/kiosk-mode';

export default function KioskPage() {
  const [ready, setReady] = useState(false);       // 등록 상태 확인 완료(하이드레이션 후)
  const [registered, setRegistered] = useState(false);
  const [done, setDone] = useState<Student | null>(null);
  const [posterIdx, setPosterIdx] = useState(0);
  const [authKey, setAuthKey] = useState(0);
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseCode, setReleaseCode] = useState('');
  const [releaseError, setReleaseError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setRegistered(isKioskRegistered()); setReady(true); }, []);

  useEffect(() => {
    const t = setInterval(() => setPosterIdx(i => (i + 1) % kioskPosters.length), 5000);
    return () => clearInterval(t);
  }, []);

  function handleAttend(s: Student) {
    setDone(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => finish(), 6000);
  }
  function finish() {
    if (timer.current) clearTimeout(timer.current);
    setDone(null);
    setAuthKey(k => k + 1);
  }
  function trySetup() {
    if (registerKiosk(setupCode)) { setRegistered(true); setSetupError(false); setSetupCode(''); }
    else setSetupError(true);
  }
  function tryRelease() {
    if (isValidSetupCode(releaseCode)) {
      unregisterKiosk(); setRegistered(false);
      setReleasing(false); setReleaseCode(''); setReleaseError(false);
    } else setReleaseError(true);
  }
  function cancelRelease() { setReleasing(false); setReleaseCode(''); setReleaseError(false); }

  const poster = kioskPosters[posterIdx];

  // 하이드레이션 깜빡임 방지
  if (!ready) return <div className="min-h-screen" />;

  // ── 미등록 기기: 출석 차단 게이트 ──
  if (!registered) {
    return (
      <div className="px-6 py-8 min-h-screen flex items-center justify-center">
        <Link href="/dashboard" className="fixed top-4 left-4 z-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ color: 'var(--kiosk-muted)', background: 'var(--kiosk-surface)', border: '1px solid var(--kiosk-border)' }}>
          ← 데모 화면으로
        </Link>
        <div className="rounded-3xl p-10 border text-center" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)', maxWidth: 460 }}>
          <div className="text-5xl">🔒</div>
          <div className="text-xl font-extrabold text-white mt-4">이 기기는 키오스크가 아니에요</div>
          <p className="text-sm mt-2" style={{ color: 'var(--kiosk-muted)' }}>
            출석은 학원에 설치된 키오스크에서만 가능합니다.<br />포인트 상점·마이페이지는 아래에서 이용하세요.
          </p>
          <Link href="/me"
            className="block w-full mt-6 py-3.5 rounded-xl text-base font-extrabold text-white transition-all active:scale-95"
            style={{ background: 'var(--kiosk-orange)' }}>
            🎮 학생 포털로 이동
          </Link>

          {/* 관리자 키오스크 등록 */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--kiosk-border)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--kiosk-muted)' }}>관리자 · 이 기기를 키오스크로 등록</p>
            <div className="flex gap-2">
              <input
                value={setupCode}
                onChange={e => { setSetupCode(e.target.value); setSetupError(false); }}
                placeholder="셋업 코드"
                className="flex-1 px-3 py-2.5 rounded-xl text-center font-bold focus:outline-none"
                style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-text)', border: `1px solid ${setupError ? '#EB5757' : 'var(--kiosk-border)'}` }}
              />
              <button onClick={trySetup} className="px-4 rounded-xl font-bold text-white" style={{ background: 'var(--kiosk-orange)' }}>등록</button>
            </div>
            {setupError && <p className="text-xs mt-1.5" style={{ color: '#EB5757' }}>셋업 코드가 올바르지 않습니다.</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── 등록된 키오스크: 출석 화면 (가로 iPad 2열 최적화) ──
  return (
    <div className="px-6 py-6 min-h-screen flex items-center">
      <Link href="/dashboard" className="fixed top-4 left-4 z-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
        style={{ color: 'var(--kiosk-muted)', background: 'var(--kiosk-surface)', border: '1px solid var(--kiosk-border)' }}>
        ← 데모 화면으로
      </Link>
      <div className="mx-auto w-full grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_minmax(380px,460px)] lg:items-start" style={{ maxWidth: 1180 }}>
        {/* 왼쪽 — 공지 포스터 (오른쪽 높이와 독립, 고정 높이) */}
        <div className="rounded-3xl border overflow-hidden flex flex-col" style={{ borderColor: 'var(--kiosk-border)', height: 'min(80vh, 760px)' }}>
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center transition-all" style={{ background: poster.bg }}>
            <div className="text-7xl mb-6">{poster.emoji}</div>
            <div className="text-3xl font-extrabold text-white leading-tight">{poster.title}</div>
            <div className="text-lg text-white/90 mt-3">{poster.desc}</div>
          </div>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: 'var(--kiosk-surface)' }}>
            <span className="text-sm font-bold text-white">📢 학원 공지</span>
            <div className="flex gap-1.5">
              {kioskPosters.map((p, i) => (
                <button key={p.id} onClick={() => setPosterIdx(i)} className="w-2.5 h-2.5 rounded-full transition-all"
                  style={{ background: i === posterIdx ? 'var(--kiosk-orange)' : 'var(--kiosk-border)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽 — 출석 */}
        <div className="flex flex-col justify-center">
          {done
            ? <AttendanceComplete student={done} onDone={finish} />
            : <AuthEntry key={authKey} icon="📲" title="D.LAB 출석 체크" listSub="이름을 누르면 출석돼요" cta="출석 →" onPick={handleAttend} />}
          <div className="mt-4 text-center">
            {!releasing ? (
              <button onClick={() => setReleasing(true)} className="text-xs" style={{ color: 'var(--kiosk-border)' }}>키오스크 해제</button>
            ) : (
              <div className="inline-flex flex-col items-center gap-1.5">
                <div className="flex gap-2">
                  <input
                    value={releaseCode}
                    onChange={e => { setReleaseCode(e.target.value); setReleaseError(false); }}
                    placeholder="관리자 코드"
                    className="w-32 px-3 py-2 rounded-lg text-center text-sm font-bold focus:outline-none"
                    style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-text)', border: `1px solid ${releaseError ? '#EB5757' : 'var(--kiosk-border)'}` }}
                  />
                  <button onClick={tryRelease} className="px-3 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--kiosk-orange)' }}>해제</button>
                  <button onClick={cancelRelease} className="px-3 rounded-lg text-sm" style={{ color: 'var(--kiosk-muted)' }}>취소</button>
                </div>
                {releaseError && <p className="text-xs" style={{ color: '#EB5757' }}>관리자 코드가 올바르지 않습니다.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
