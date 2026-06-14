'use client';

import { useState } from 'react';
import { students, campusRanking, achievements } from '@/lib/mock-data';
import Link from 'next/link';

// 시연용: 김민준(s-01) 고정
const DEMO_STUDENT = students.find(s => s.id === 's-01')!;

export default function KioskInfoPage() {
  const s = DEMO_STUDENT;
  const maxPoints = 2500;
  const pct = Math.min(100, Math.round((s.points / maxPoints) * 100));

  const myAchievements = achievements.slice(0, 3);

  return (
    <div className="min-h-screen px-5 py-8 max-w-md mx-auto">
      {/* 상단 네비 */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/kiosk" className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>← 뒤로</Link>
        <Link href="/kiosk/shop" className="text-sm font-medium" style={{ color: 'var(--kiosk-orange)' }}>포인트 상점 →</Link>
      </div>

      {/* 프로필 카드 */}
      <div className="rounded-2xl p-6 mb-4 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg, var(--kiosk-orange), #FF9A5A)', color: 'white' }}>
            {s.name[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{s.name}</h2>
            <p className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>{s.grade} · {s.school}</p>
            {s.title && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(255,108,55,0.2)', color: 'var(--kiosk-orange)' }}>
                🏆 {s.title}
              </span>
            )}
          </div>
        </div>

        {/* 포인트 & 레벨 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold" style={{ color: 'var(--kiosk-gold)' }}>💎 {s.points.toLocaleString()} DP</span>
            <span className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>다음 레벨: {maxPoints.toLocaleString()} DP</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--kiosk-border)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--kiosk-orange), var(--kiosk-gold))' }} />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--kiosk-muted)' }}>{pct}%</p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '연속 출석', value: `${s.streak}일`, icon: '🔥' },
            { label: '총 포인트', value: `${s.points.toLocaleString()}`, icon: '💎' },
            { label: '보유 칭호', value: `${myAchievements.length}개`, icon: '🏆' },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3 text-center border" style={{ background: 'var(--kiosk-card)', borderColor: 'var(--kiosk-border)' }}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-sm font-bold text-white">{item.value}</div>
              <div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 오늘 수업 */}
      <div className="rounded-2xl p-5 mb-4 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--kiosk-muted)' }}>오늘 수업</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-white">파이썬 기초 · 3회차</p>
            <p className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>토 09:00 · 담당: 론</p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: 'rgba(15,123,108,0.2)', color: '#4ECDC4' }}>✓ 출석완료</span>
        </div>
      </div>

      {/* 보유 칭호 */}
      <div className="rounded-2xl p-5 mb-4 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--kiosk-muted)' }}>보유 칭호</h3>
        <div className="space-y-2">
          {myAchievements.map(ach => (
            <div key={ach.id} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ background: 'var(--kiosk-card)', borderColor: 'var(--kiosk-border)' }}>
              <span className="text-xl">{ach.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{ach.name}</p>
                <p className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>{ach.condition}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: ach.rarity === '전설' ? 'rgba(245,200,66,0.2)' : ach.rarity === '영웅' ? 'rgba(255,108,55,0.2)' : 'rgba(136,136,153,0.2)',
                color: ach.rarity === '전설' ? 'var(--kiosk-gold)' : ach.rarity === '영웅' ? 'var(--kiosk-orange)' : 'var(--kiosk-muted)',
              }}>{ach.rarity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 캠퍼스 랭킹 */}
      <div className="rounded-2xl p-5 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--kiosk-muted)' }}>🏅 캠퍼스 랭킹</h3>
        <div className="space-y-2">
          {campusRanking.slice(0, 5).map(r => (
            <div key={r.student_id} className={`flex items-center gap-3 p-2.5 rounded-xl ${r.student_id === s.id ? 'border' : ''}`}
              style={r.student_id === s.id ? { borderColor: 'var(--kiosk-orange)', background: 'rgba(255,108,55,0.08)' } : {}}>
              <span className={`w-6 text-center text-sm font-bold ${r.rank <= 3 ? '' : ''}`}
                style={{ color: r.rank === 1 ? 'var(--kiosk-gold)' : r.rank === 2 ? '#C0C0C0' : r.rank === 3 ? '#CD7F32' : 'var(--kiosk-muted)' }}>
                {r.rank === 1 ? '👑' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
              </span>
              <span className="flex-1 text-sm font-medium text-white">{r.name}</span>
              <span className="text-sm tabular-nums" style={{ color: 'var(--kiosk-gold)' }}>{r.points.toLocaleString()} DP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
