'use client';

import { useState } from 'react';
import {
  students, classes, kioskShopItems, purchases as seedPurchases,
  type Student, type Purchase,
} from '@/lib/mock-data';
import { levelOf, baseBalance, toNextLevel, levelPct, purchasesOf } from '@/lib/kiosk';
import { TITLES, TIER_ORDER, TIER_STYLE, earnedTitleIds, titleByName, type TitleCategory } from '@/lib/titles';

const TABS = ['내 수업', '포인트 상점', '구매 이력', '마이페이지'] as const;
type Tab = typeof TABS[number];
const CATEGORIES: TitleCategory[] = ['출석', '질문', '수상'];

const rankedStudents = [...students].filter(s => s.status === '재원').sort((a, b) => b.points - a.points);

let purSeq = 0;

export function StudentDashboard({ student, onLogout }: { student: Student; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('내 수업');
  const [balance, setBalance] = useState(baseBalance(student));
  const [sessionPurchases, setSessionPurchases] = useState<Purchase[]>([]);
  const [toast, setToast] = useState('');

  const cls = classes.find(c => c.id === student.class_id);
  const points = student.points;
  const myRank = (rankedStudents.findIndex(s => s.id === student.id) + 1) || rankedStudents.length;
  const allPurchases = purchasesOf(student.id, [...seedPurchases, ...sessionPurchases]);
  const earned = earnedTitleIds(student);
  const currentTitle = titleByName(student.title);

  function showToast(m: string) { setToast(m); setTimeout(() => setToast(''), 1800); }

  function buy(itemId: string, name: string, cost: number) {
    if (balance < cost) return;
    setBalance(b => b - cost);
    purSeq += 1;
    setSessionPurchases(p => [
      { id: `pur-new-${purSeq}`, student_id: student.id, item_id: itemId, item_name: name, cost, date: '2026-06-14' },
      ...p,
    ]);
    showToast(`${name} 교환 완료! 🎁`);
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 560 }}>
      {/* 헤더 */}
      <div className="flex items-center gap-4 rounded-2xl p-5 mb-4" style={{ background: 'linear-gradient(135deg, var(--kiosk-orange), var(--kiosk-orange2))' }}>
        <div className="text-3xl kiosk-float">🎮</div>
        <div className="flex-1">
          <div className="text-xl font-extrabold text-white">{student.name}님</div>
          <div className="text-sm text-white/90">Lv.{levelOf(points)} · {student.title || '새내기'} · {myRank}위</div>
        </div>
        <button onClick={onLogout} className="px-3 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'rgba(0,0,0,0.2)' }}>로그아웃</button>
      </div>

      {/* 탭 (모바일 2×2, 데스크톱 4열) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="py-2.5 rounded-xl text-sm font-bold transition-all"
            style={tab === t
              ? { background: 'var(--kiosk-orange)', color: 'white' }
              : { background: 'var(--kiosk-surface)', color: 'var(--kiosk-muted)', border: '1px solid var(--kiosk-border)' }}>
            {t}
          </button>
        ))}
      </div>

      {/* 내 수업 */}
      {tab === '내 수업' && (
        <div className="rounded-2xl p-6 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
          <div className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>오늘의 수업</div>
          <div className="text-2xl font-extrabold text-white mt-1">{cls?.course ?? '-'}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--kiosk-muted)' }}>{cls?.teacher} 선생님 · {cls?.schedule}</div>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-white" style={{ background: 'var(--kiosk-orange)' }}>
            🚪 {cls?.room || '강의실'}(으)로 이동
          </div>
          <div className="h-2 rounded-full overflow-hidden mt-5" style={{ background: 'var(--kiosk-border)' }}>
            <div className="h-full rounded-full" style={{ width: `${levelPct(points)}%`, background: 'linear-gradient(90deg, var(--kiosk-orange), var(--kiosk-gold))' }} />
          </div>
          <div className="text-xs mt-1.5" style={{ color: 'var(--kiosk-muted)' }}>다음 레벨까지 {toNextLevel(points)}P</div>
        </div>
      )}

      {/* 포인트 상점 */}
      {tab === '포인트 상점' && (
        <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-white">🛍️ 포인트 상점</h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ background: 'rgba(245,200,66,0.15)', color: 'var(--kiosk-gold)' }}>사용가능 {balance}P</span>
          </div>
          <div className="flex flex-col gap-2">
            {kioskShopItems.map(item => {
              const can = balance >= item.cost;
              return (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--kiosk-card)' }}>
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-xs" style={{ color: 'var(--kiosk-gold)' }}>{item.cost}P</div>
                  </div>
                  <button onClick={() => buy(item.id, item.name, item.cost)} disabled={!can}
                    className="px-4 h-9 rounded-lg text-sm font-bold transition-all active:scale-95"
                    style={{ background: can ? 'var(--kiosk-orange)' : 'var(--kiosk-border)', color: can ? 'white' : 'var(--kiosk-muted)', cursor: can ? 'pointer' : 'not-allowed' }}>
                    {can ? '교환' : '부족'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 구매 이력 */}
      {tab === '구매 이력' && (
        <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
          <h2 className="text-base font-extrabold text-white mb-3">🧾 구매 이력</h2>
          {allPurchases.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--kiosk-muted)' }}>아직 구매 내역이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {allPurchases.map(p => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'var(--kiosk-card)' }}>
                  <div>
                    <div className="text-sm font-semibold text-white">{p.item_name}</div>
                    <div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>{p.date}</div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: 'var(--kiosk-gold)' }}>-{p.cost}P</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 마이페이지 */}
      {tab === '마이페이지' && (
        <div className="flex flex-col gap-4">
          {/* 현재 칭호 */}
          <div className="rounded-2xl p-6 border text-center" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
            <div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>현재 칭호</div>
            <div className="text-2xl font-extrabold text-white mt-1">{student.title || '새내기'}</div>
            {currentTitle && (
              <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-md" style={{ background: TIER_STYLE[currentTitle.tier].bg, color: TIER_STYLE[currentTitle.tier].color }}>
                {currentTitle.tier} · {currentTitle.category}
              </span>
            )}
            <div className="flex justify-center gap-6 mt-4">
              <div><div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>레벨 포인트</div><div className="text-lg font-extrabold text-white">{points}P</div></div>
              <div><div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>레벨</div><div className="text-lg font-extrabold text-white">Lv.{levelOf(points)}</div></div>
              <div><div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>랭킹</div><div className="text-lg font-extrabold" style={{ color: 'var(--kiosk-gold)' }}>{myRank}위</div></div>
            </div>
          </div>

          {/* 전체 칭호 도감 */}
          <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
            <h2 className="text-base font-extrabold text-white mb-1">🏅 칭호 도감</h2>
            <p className="text-xs mb-3" style={{ color: 'var(--kiosk-muted)' }}>보유 {earned.size} / 전체 {TITLES.length}</p>
            {CATEGORIES.map(cat => (
              <div key={cat} className="mb-4 last:mb-0">
                <div className="text-sm font-bold mb-2" style={{ color: 'var(--kiosk-orange)' }}>{cat} 계열</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TITLES.filter(t => t.category === cat)
                    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
                    .map(t => {
                      const has = earned.has(t.id);
                      const st = TIER_STYLE[t.tier];
                      return (
                        <div key={t.id} className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--kiosk-card)', opacity: has ? 1 : 0.45 }}>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: st.bg, color: st.color }}>{t.tier}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-1">
                              {has && <span style={{ color: '#34C7A8' }}>✓</span>}{t.name}
                            </div>
                            <div className="text-[11px] truncate" style={{ color: 'var(--kiosk-muted)' }}>{t.condition}{!t.auto && ' · 수동'}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 bottom-10 -translate-x-1/2 px-6 py-3.5 rounded-xl font-extrabold text-white shadow-lg z-50" style={{ background: 'var(--kiosk-orange)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
