'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { kioskPosters, type Student } from '@/lib/mock-data';
import { ROLE_STORAGE_KEY } from '@/lib/roles';
import { AuthEntry } from '@/components/kiosk/AuthEntry';
import { AttendanceComplete } from '@/components/kiosk/AttendanceComplete';
import { StudentDashboard } from '@/components/kiosk/StudentDashboard';

type Mode = 'home' | 'attend' | 'shop';

export default function KioskPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('home');
  const [done, setDone] = useState<Student | null>(null);     // 출석 완료 학생
  const [shopStudent, setShopStudent] = useState<Student | null>(null);  // 상점 입장 학생
  const [posterIdx, setPosterIdx] = useState(0);
  const [authKey, setAuthKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setPosterIdx(i => (i + 1) % kioskPosters.length), 5000);
    return () => clearInterval(t);
  }, []);

  // 데모: 역할을 원장으로 되돌리고 관리자 화면으로 복귀
  function backToAdmin() {
    if (typeof window !== 'undefined') window.localStorage.setItem(ROLE_STORAGE_KEY, '원장');
    router.push('/dashboard');
  }

  function goHome() {
    if (timer.current) clearTimeout(timer.current);
    setDone(null);
    setShopStudent(null);
    setAuthKey(k => k + 1);
    setMode('home');
  }

  function handleAttend(s: Student) {
    setDone(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => finishAttend(), 6000);
  }
  function finishAttend() {
    if (timer.current) clearTimeout(timer.current);
    setDone(null);
    setAuthKey(k => k + 1);   // 다음 학생용 키패드 초기화
  }

  const poster = kioskPosters[posterIdx];

  const backBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} className="fixed top-4 left-4 z-50 text-xs font-semibold px-3 py-1.5 rounded-lg"
      style={{ color: 'var(--kiosk-muted)', background: 'var(--kiosk-surface)', border: '1px solid var(--kiosk-border)' }}>
      {label}
    </button>
  );

  // ── 홈(랜딩) — 출석 / 포인트 상점 진입 ──
  if (mode === 'home') {
    return (
      <div className="px-6 py-8 min-h-screen flex items-center justify-center">
        {backBtn('← 관리자 화면으로 (데모)', backToAdmin)}
        <div className="w-full" style={{ maxWidth: 900 }}>
          <div className="text-center mb-8">
            <div className="text-5xl">🏫</div>
            <div className="text-2xl font-extrabold text-white mt-3">D.LAB 키오스크</div>
            <p className="text-sm mt-2" style={{ color: 'var(--kiosk-muted)' }}>무엇을 하시겠어요?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button onClick={() => { setAuthKey(k => k + 1); setMode('attend'); }}
              className="rounded-3xl p-10 border text-center transition-all active:scale-95"
              style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <div className="text-6xl">📲</div>
              <div className="text-xl font-extrabold text-white mt-4">출석 체크</div>
              <p className="text-sm mt-2" style={{ color: 'var(--kiosk-muted)' }}>이름을 누르면 출석돼요</p>
            </button>
            <button onClick={() => { setAuthKey(k => k + 1); setShopStudent(null); setMode('shop'); }}
              className="rounded-3xl p-10 border text-center transition-all active:scale-95"
              style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <div className="text-6xl">🛍️</div>
              <div className="text-xl font-extrabold text-white mt-4">포인트 상점 · 마이페이지</div>
              <p className="text-sm mt-2" style={{ color: 'var(--kiosk-muted)' }}>포인트로 교환하고 내 정보를 봐요</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 출석 체크 (가로 iPad 2열) ──
  if (mode === 'attend') {
    return (
      <div className="px-6 py-6 min-h-screen flex items-center">
        {backBtn('← 홈', goHome)}
        <div className="mx-auto w-full grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_minmax(380px,460px)] lg:items-start" style={{ maxWidth: 1180 }}>
          {/* 왼쪽 — 공지 포스터 */}
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
              ? <AttendanceComplete student={done} onDone={finishAttend} />
              : <AuthEntry key={authKey} icon="📲" title="D.LAB 출석 체크" listSub="이름을 누르면 출석돼요" cta="출석 →" onPick={handleAttend} />}
          </div>
        </div>
      </div>
    );
  }

  // ── 포인트 상점 · 마이페이지 ──
  return (
    <div className="px-6 py-8 min-h-screen">
      {backBtn('← 홈', goHome)}
      {!shopStudent ? (
        <div className="mx-auto" style={{ maxWidth: 520, marginTop: '2vh' }}>
          <AuthEntry key={authKey} icon="🛍️" title="포인트 상점 · 마이페이지" listSub="이름을 누르면 들어가요" cta="입장 →" onPick={setShopStudent} />
        </div>
      ) : (
        <StudentDashboard student={shopStudent} onLogout={goHome} mode="web" />
      )}
    </div>
  );
}
