'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { kioskPosters, students, type Student } from '@/lib/mock-data';
import { ROLE_STORAGE_KEY } from '@/lib/roles';
import { AuthEntry } from '@/components/kiosk/AuthEntry';
import { AttendanceComplete } from '@/components/kiosk/AttendanceComplete';
import { StudentDashboard } from '@/components/kiosk/StudentDashboard';

const HOF_MEDALS = ['🥇', '🥈', '🥉'];
const top3 = [...students].filter(s => s.status === '재원').sort((a, b) => b.points - a.points).slice(0, 3);

type Mode = 'attend' | 'shop';

export default function KioskPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('attend');
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
    setMode('attend');
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

  // ── 출석 체크 (메인 화면) ──
  if (mode === 'attend') {
    return (
      <div className="px-4 py-4 h-screen overflow-hidden flex flex-col">
        {backBtn('← 관리자 화면으로 (데모)', backToAdmin)}
        <div className="flex-1 min-h-0 w-full grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* 왼쪽 — 포스터 전체 */}
          <div className="rounded-3xl border overflow-hidden flex flex-col min-h-0" style={{ borderColor: 'var(--kiosk-border)' }}>
            {poster.hallOfFame ? (
              <div className="flex-1 flex flex-col p-10" style={{ background: poster.bg }}>
                <div className="text-2xl font-extrabold text-white mb-1">🏆 포인트 명예의 전당</div>
                <div className="text-sm text-white/70 mb-6">이달 최다 포인트 TOP 3</div>
                <div className="flex flex-col gap-4 flex-1">
                  {top3.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-4 px-6 rounded-2xl flex-1"
                      style={{ background: 'rgba(0,0,0,0.22)' }}>
                      <span className="text-4xl">{HOF_MEDALS[i]}</span>
                      <span className="flex-1 font-bold text-white text-2xl">{s.name}</span>
                      <span className="text-2xl font-extrabold" style={{ color: '#FFD700' }}>{s.points.toLocaleString()}P</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center transition-all" style={{ background: poster.bg }}>
                <div className="text-7xl mb-6">{poster.emoji}</div>
                <div className="text-3xl font-extrabold text-white leading-tight">{poster.title}</div>
                <div className="text-lg text-white/90 mt-3">{poster.desc}</div>
              </div>
            )}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ background: 'var(--kiosk-surface)' }}>
              <span className="text-sm font-bold text-white">📢 학원 공지</span>
              <div className="flex gap-1.5">
                {kioskPosters.map((p, i) => (
                  <button key={p.id} onClick={() => setPosterIdx(i)} className="w-2.5 h-2.5 rounded-full transition-all"
                    style={{ background: i === posterIdx ? 'var(--kiosk-orange)' : 'var(--kiosk-border)' }} />
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽 — 출석 체크 + 포인트 상점 버튼 */}
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-0">
              {done
                ? <AttendanceComplete student={done} onDone={finishAttend} />
                : <AuthEntry key={authKey} icon="📲" title="출석 체크하기" listSub="이름을 누르면 출석돼요" cta="출석 →" onPick={handleAttend} />
              }
            </div>
            <button
              onClick={() => { setAuthKey(k => k + 1); setShopStudent(null); setMode('shop'); }}
              className="rounded-2xl px-8 py-6 border flex items-center justify-between transition-all active:scale-95 flex-shrink-0"
              style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <div className="flex items-center gap-4">
                <span className="text-4xl">🛍️</span>
                <div className="font-extrabold text-white text-xl">포인트 상점</div>
              </div>
              <span className="font-bold text-xl" style={{ color: 'var(--kiosk-orange)' }}>입장 →</span>
            </button>
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
