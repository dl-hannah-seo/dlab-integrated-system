'use client';

import { useState } from 'react';
import { students, classes, kioskShopItems, kioskCodes, Student } from '@/lib/mock-data';

type Stage = 'input' | 'done';

const levelOf = (points: number) => Math.floor(points / 300) + 1;
// 사용 가능 포인트: 시드에 balance가 있으면 사용, 없으면 누적 포인트에서 파생
const baseBalance = (s: Student) => s.balance ?? Math.round((s.points * 0.4) / 10) * 10;

// 재원생 전체를 누적 포인트 내림차순으로 정렬한 랭킹 (체크인 후 표시용)
const rankedStudents = [...students]
  .filter(s => s.status === '재원')
  .sort((a, b) => b.points - a.points);

export default function KioskPage() {
  const [stage, setStage] = useState<Stage>('input');
  const [digits, setDigits] = useState('');
  const [active, setActive] = useState<Student | null>(null);
  const [points, setPoints] = useState(0);    // 활성 학생 누적 포인트 (출석 +30 반영)
  const [balance, setBalance] = useState(0);   // 활성 학생 사용 가능 포인트 (시연 차감)
  const [checkinTime, setCheckinTime] = useState('');

  // 힌트 칩: 키오스크 코드(원본 전화 뒤 4자리)에서 고유값 3개
  const hintCodes = [...new Set(students.map(s => kioskCodes[s.id]))].slice(0, 3);

  // 번호를 누르는 즉시 코드가 일치(접두) 하는 학생 리스트를 오른쪽에 표시
  const matches = digits.length > 0
    ? students
        .filter(s => kioskCodes[s.id].startsWith(digits))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    : [];

  function press(key: string) {
    if (key === 'clear') setDigits('');
    else if (key === 'back') setDigits(d => d.slice(0, -1));
    else if (digits.length < 4) setDigits(d => d + key);
  }

  function checkIn(s: Student) {
    const now = new Date();
    setCheckinTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setActive(s);
    setPoints(s.points + 30);
    setBalance(baseBalance(s) + 30);
    setStage('done');
  }

  function reset() {
    setStage('input');
    setDigits('');
    setActive(null);
  }

  function buy(cost: number) {
    if (balance < cost) return;
    setBalance(b => b - cost);
  }

  // ── 체크인 후 대시보드 ──────────────────────────────────────
  if (stage === 'done' && active) {
    const cls = classes.find(c => c.id === active.class_id);
    const level = levelOf(points);
    const toNext = 300 - (points % 300);
    const lvlPct = Math.round(((points % 300) / 300) * 100);
    const myRank = (rankedStudents.findIndex(s => s.id === active.id) + 1) || rankedStudents.length;

    const topRows = rankedStudents.slice(0, 3).map((s, i) => {
      const me = s.id === active.id;
      return (
        <div key={s.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={me ? { background: 'rgba(255,108,55,0.12)', border: '1px solid var(--kiosk-orange)' } : {}}>
          <div className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-extrabold"
            style={{
              background: i === 0 ? 'rgba(245,200,66,0.18)' : i === 1 ? 'rgba(192,192,192,0.18)' : 'rgba(205,127,50,0.18)',
              color: i === 0 ? 'var(--kiosk-gold)' : i === 1 ? '#C0C0C0' : '#CD7F32',
            }}>
            {i + 1}
          </div>
          <span className="flex-1 text-sm font-semibold">{s.name}{me ? ' (나)' : ''}</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--kiosk-gold)' }}>
            {(me ? points : s.points).toLocaleString()}P
          </span>
        </div>
      );
    });

    return (
      <div className="px-6 py-8">
        <div className="mx-auto grid grid-cols-1 gap-4 lg:grid-cols-[1.04fr_0.96fr]" style={{ maxWidth: 1060 }}>

          {/* 좌측 컬럼 */}
          <div className="flex flex-col gap-4">
            {/* 환영 카드 */}
            <div className="flex items-center gap-4 rounded-2xl p-6"
              style={{ background: 'linear-gradient(135deg, var(--kiosk-orange), var(--kiosk-orange2))' }}>
              <div className="text-4xl kiosk-float">🎉</div>
              <div>
                <div className="text-xl font-extrabold text-white">{active.name}, 환영해요!</div>
                <div className="text-sm text-white/90 mt-0.5">{checkinTime} 입실 완료 · 오늘도 화이팅! 🚀</div>
              </div>
            </div>

            {/* 포인트 2카드 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
                <div className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>사용 가능 포인트</div>
                <div className="text-3xl font-extrabold text-white mt-1">{balance}P</div>
                <span className="inline-block mt-3 text-xs font-bold px-2.5 py-1 rounded-md"
                  style={{ background: 'rgba(15,123,108,0.18)', color: '#4ECDC4' }}>⭐ 방금 +30P</span>
              </div>
              <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
                <div className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>레벨 포인트</div>
                <div className="text-3xl font-extrabold text-white mt-1">{points}P</div>
                <span className="inline-block mt-3 text-xs font-bold px-2.5 py-1 rounded-md"
                  style={{ background: 'rgba(255,108,55,0.15)', color: 'var(--kiosk-orange)' }}>🏆 Lv.{level} · {myRank}위</span>
              </div>
            </div>

            {/* 오늘의 수업 */}
            <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <div className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>오늘의 수업</div>
              <div className="text-xl font-extrabold text-white mt-1">{cls?.course ?? '-'}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--kiosk-muted)' }}>
                {cls?.teacher} 선생님 · {cls?.schedule}
              </div>
              <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--kiosk-card)' }}>🎯 「{cls?.course}」 미션</span>
              <div className="h-2 rounded-full overflow-hidden mt-4" style={{ background: 'var(--kiosk-border)' }}>
                <div className="h-full rounded-full" style={{ width: `${lvlPct}%`, background: 'linear-gradient(90deg, var(--kiosk-orange), var(--kiosk-gold))' }} />
              </div>
              <div className="text-xs mt-1.5" style={{ color: 'var(--kiosk-muted)' }}>다음 레벨까지 {toNext}P</div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 h-12 rounded-xl font-bold text-white transition-all active:scale-95"
                style={{ background: 'var(--kiosk-orange)' }}>
                처음 화면으로
              </button>
              <button disabled
                className="flex-1 h-12 rounded-xl font-bold"
                style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-muted)', border: '1px solid var(--kiosk-border)', cursor: 'not-allowed' }}>
                내 대시보드
              </button>
            </div>
          </div>

          {/* 우측 컬럼 */}
          <div className="flex flex-col gap-4">
            {/* 포인트 랭킹 */}
            <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <h2 className="text-base font-extrabold mb-3">🏆 포인트 랭킹</h2>
              <div className="flex flex-col gap-1.5">
                {topRows}
                {myRank > 3 && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,108,55,0.12)', border: '1px solid var(--kiosk-orange)' }}>
                    <div className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-extrabold"
                      style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-muted)' }}>{myRank}</div>
                    <span className="flex-1 text-sm font-semibold">{active.name} (나)</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--kiosk-gold)' }}>{points.toLocaleString()}P</span>
                  </div>
                )}
              </div>
            </div>

            {/* 포인트 상점 */}
            <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-extrabold">🛍️ 포인트 상점</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md"
                  style={{ background: 'rgba(245,200,66,0.15)', color: 'var(--kiosk-gold)' }}>사용가능 {balance}P</span>
              </div>
              <div className="flex flex-col gap-2">
                {kioskShopItems.map(item => {
                  const can = balance >= item.cost;
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--kiosk-card)' }}>
                      <div className="text-2xl">{item.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{item.name}</div>
                        <div className="text-xs" style={{ color: 'var(--kiosk-gold)' }}>{item.cost}P</div>
                      </div>
                      <button onClick={() => buy(item.cost)} disabled={!can}
                        className="px-4 h-9 rounded-lg text-sm font-bold transition-all active:scale-95"
                        style={{
                          background: can ? 'var(--kiosk-orange)' : 'var(--kiosk-border)',
                          color: can ? 'white' : 'var(--kiosk-muted)',
                          cursor: can ? 'pointer' : 'not-allowed',
                        }}>
                        {can ? '교환' : '부족'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 입력 단계 ───────────────────────────────────────────────
  const display = digits.padEnd(4, ' ').split('').map(c => (c === ' ' ? '_' : c)).join(' ');

  return (
    <div className="px-6 py-8">
      <div className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,420px)_1fr]" style={{ maxWidth: 980 }}>

        {/* 키패드 카드 */}
        <div className="rounded-3xl p-8 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
          <div className="text-center mb-5">
            <div className="text-3xl">📲</div>
            <div className="text-lg font-extrabold text-white mt-2">D.LAB 출석 체크</div>
            <div className="text-sm mt-1" style={{ color: 'var(--kiosk-muted)' }}>전화번호 뒤 4자리를 눌러주세요</div>
          </div>

          <div className="rounded-2xl py-7 mb-5 text-center text-3xl font-extrabold tracking-[0.3em]"
            style={{ background: 'var(--kiosk-card)', color: digits ? 'var(--kiosk-text)' : 'var(--kiosk-muted)' }}>
            {display}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button key={n} onClick={() => press(n)}
                className="h-16 rounded-xl text-2xl font-bold transition-all active:scale-95"
                style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-text)' }}>
                {n}
              </button>
            ))}
            <button onClick={() => press('clear')}
              className="h-16 rounded-xl text-xl font-bold text-white transition-all active:scale-95"
              style={{ background: 'var(--kiosk-orange)' }}>C</button>
            <button onClick={() => press('0')}
              className="h-16 rounded-xl text-2xl font-bold transition-all active:scale-95"
              style={{ background: 'var(--kiosk-card)', color: 'var(--kiosk-text)' }}>0</button>
            <button onClick={() => press('back')}
              className="h-16 rounded-xl text-xl font-bold text-white transition-all active:scale-95"
              style={{ background: 'var(--kiosk-orange)' }}>←</button>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div>
          {digits.length === 0 ? (
            <div className="rounded-3xl p-10 border flex flex-col items-center justify-center text-center min-h-[260px]"
              style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <div className="text-5xl kiosk-wave">👋</div>
              <div className="text-lg font-bold text-white mt-4 leading-snug">번호를 누르면<br />학생 정보가 여기에 나와요</div>
              <div className="flex gap-2 mt-4">
                {hintCodes.map(code => (
                  <span key={code} className="text-sm font-bold px-3 py-1 rounded-md"
                    style={{ background: 'rgba(255,108,55,0.15)', color: 'var(--kiosk-orange)' }}>{code}</span>
                ))}
              </div>
            </div>
          ) : matches.length > 0 ? (
            <div className="rounded-3xl p-6 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <h2 className="text-lg font-extrabold text-white">학생 선택</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--kiosk-muted)' }}>이름을 누르면 바로 출석돼요 ({matches.length}명)</p>
              <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {matches.map(s => {
                  const cls = classes.find(c => c.id === s.class_id);
                  return (
                    <button key={s.id} onClick={() => checkIn(s)}
                      className="flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:border-[var(--kiosk-orange)] active:scale-[0.99]"
                      style={{ background: 'var(--kiosk-card)', borderColor: 'var(--kiosk-border)' }}>
                      <div className="w-11 h-11 flex items-center justify-center rounded-full font-bold flex-shrink-0"
                        style={{ background: 'rgba(255,108,55,0.18)', color: 'var(--kiosk-orange)' }}>
                        {s.name.charAt(1) || s.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white">{s.name}</div>
                        <div className="text-sm truncate" style={{ color: 'var(--kiosk-muted)' }}>
                          {cls?.course} · Lv.{levelOf(s.points)} · {s.points}P
                        </div>
                      </div>
                      <span className="px-3 h-9 inline-flex items-center rounded-xl font-bold text-white flex-shrink-0"
                        style={{ background: 'var(--kiosk-orange)' }}>출석 →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl p-10 border flex flex-col items-center justify-center text-center min-h-[260px]"
              style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              <div className="text-5xl">😅</div>
              <div className="text-lg font-bold text-white mt-4">일치하는 학생이 없어요</div>
              <div className="text-sm mt-1" style={{ color: 'var(--kiosk-muted)' }}>번호를 다시 확인해 주세요</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
