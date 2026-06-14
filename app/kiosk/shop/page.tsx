'use client';

import { useState } from 'react';
import { products, students, Product } from '@/lib/mock-data';
import Link from 'next/link';

const DEMO_STUDENT = students.find(s => s.id === 's-01')!;
const CATEGORIES = ['전체', '상품권', '식음료', '학용품', '전자기기'];

export default function KioskShopPage() {
  const [cat, setCat] = useState('전체');
  const [buyModal, setBuyModal] = useState<Product | null>(null);
  const [step, setStep] = useState<'confirm' | 'pending' | 'done'>('confirm');
  const [points, setPoints] = useState(DEMO_STUDENT.points);

  const filtered = cat === '전체' ? products : products.filter(p => p.category === cat);

  function handleBuy(product: Product) {
    setBuyModal(product); setStep('confirm');
  }
  function confirmBuy() {
    if (!buyModal) return;
    setStep('pending');
    if (buyModal.requires_approval) return; // 승인 필요는 pending에서 멈춤
    setTimeout(() => {
      setPoints(p => p - buyModal.price_dp);
      setStep('done');
    }, 800);
  }

  return (
    <div className="min-h-screen px-5 py-8 max-w-md mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/kiosk/info" className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>← 내 정보</Link>
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: 'var(--kiosk-muted)' }}>{DEMO_STUDENT.name}</span>
          <span className="font-bold" style={{ color: 'var(--kiosk-gold)' }}>💎 {points.toLocaleString()} DP</span>
        </div>
      </div>

      <h1 className="text-xl font-bold text-white mb-5">포인트 상점</h1>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all"
            style={{
              background: cat === c ? 'var(--kiosk-orange)' : 'var(--kiosk-card)',
              color: cat === c ? 'white' : 'var(--kiosk-muted)',
              border: `1px solid ${cat === c ? 'transparent' : 'var(--kiosk-border)'}`,
            }}>
            {c}
          </button>
        ))}
      </div>

      {/* 상품 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(p => {
          const canBuy = points >= p.price_dp && p.stock > 0;
          return (
            <div key={p.id} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
              {/* 이미지 placeholder */}
              <div className="h-28 flex items-center justify-center text-4xl" style={{ background: 'var(--kiosk-card)' }}>
                {p.category === '상품권' ? '🎫' : p.category === '식음료' ? '🍦' : p.category === '학용품' ? '✏️' : '🎧'}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-white mb-1 leading-tight">{p.name}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--kiosk-gold)' }}>{p.price_dp.toLocaleString()} DP</span>
                  <span className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>재고 {p.stock}</span>
                </div>
                {p.requires_approval && (
                  <span className="text-xs px-2 py-0.5 rounded-full block text-center mb-2" style={{ background: 'rgba(217,168,10,0.2)', color: '#D9A80A' }}>승인 필요</span>
                )}
                <button onClick={() => handleBuy(p)} disabled={!canBuy}
                  className="w-full py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: canBuy ? 'var(--kiosk-orange)' : 'var(--kiosk-border)',
                    color: canBuy ? 'white' : 'var(--kiosk-muted)',
                    cursor: canBuy ? 'pointer' : 'not-allowed',
                  }}>
                  {!canBuy && points < p.price_dp ? 'DP 부족' : p.stock === 0 ? '품절' : '구매'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 구매 모달 */}
      {buyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={step !== 'pending' ? () => setBuyModal(null) : undefined}>
          <div className="w-full max-w-sm rounded-2xl p-6 border" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}
            onClick={e => e.stopPropagation()}>

            {step === 'confirm' && (
              <>
                <h2 className="text-lg font-bold text-white mb-4">구매 확인</h2>
                <div className="p-4 rounded-xl mb-4 border text-center" style={{ background: 'var(--kiosk-card)', borderColor: 'var(--kiosk-border)' }}>
                  <p className="text-base font-semibold text-white mb-2">{buyModal.name}</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--kiosk-gold)' }}>{buyModal.price_dp.toLocaleString()} DP</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--kiosk-muted)' }}>잔여: {points.toLocaleString()} → {(points - buyModal.price_dp).toLocaleString()} DP</p>
                </div>
                {buyModal.requires_approval && (
                  <div className="mb-4 px-3 py-2.5 rounded-xl border text-xs" style={{ borderColor: '#D9A80A', color: '#D9A80A', background: 'rgba(217,168,10,0.1)' }}>
                    ⚠️ 고가 상품으로 관리자 승인 후 수령합니다.
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setBuyModal(null)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--kiosk-border)', color: 'var(--kiosk-muted)' }}>취소</button>
                  <button onClick={confirmBuy} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--kiosk-orange)' }}>
                    {buyModal.requires_approval ? '구매 요청' : '구매 확정'}
                  </button>
                </div>
              </>
            )}

            {step === 'pending' && buyModal.requires_approval && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">⏳</div>
                <h2 className="text-lg font-bold text-white mb-2">구매 요청 완료</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--kiosk-muted)' }}>관리자 승인 후 수령 가능합니다</p>
                <button onClick={() => setBuyModal(null)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--kiosk-orange)' }}>확인</button>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-lg font-bold text-white mb-2">구매 완료!</h2>
                <p className="text-sm mb-1" style={{ color: 'var(--kiosk-gold)' }}>잔여 포인트: {(points).toLocaleString()} DP</p>
                <p className="text-xs mb-4" style={{ color: 'var(--kiosk-muted)' }}>데스크에서 상품을 수령하세요</p>
                <button onClick={() => setBuyModal(null)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--kiosk-orange)' }}>확인</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
