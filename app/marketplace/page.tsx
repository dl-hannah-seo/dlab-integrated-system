'use client';

import { useState } from 'react';
import { lessonProducts, LessonProduct } from '@/lib/mock-data';
import {
  filterByCategory, addToCart, setQty, removeFromCart,
  cartCount, cartTotal, formatDuration, type CartLine,
} from '@/lib/marketplace';

const CATEGORIES = ['전체', '파이썬', '아두이노·로보틱스', 'AI·데이터', '웹·앱'];

const won = (n: number) => `${n.toLocaleString()}원`;

export default function MarketplacePage() {
  const [cat, setCat] = useState('전체');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const filtered = filterByCategory(lessonProducts, cat);
  const count = cartCount(cart);
  const total = cartTotal(cart);

  function add(p: LessonProduct) {
    setCart(c => addToCart(c, p));
    setCartOpen(true);
  }

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-8">
      {/* 상단 바 */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">교안 마켓플레이스</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FFF1EC', color: '#FF6C37' }}>D.LAB</span>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[#EFEFEE]"
          style={{ borderColor: '#E9E9E7' }}
        >
          🛒 장바구니
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: '#FF6C37' }}>
              {count}
            </span>
          )}
        </button>
      </header>

      {/* 타이틀 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">검증된 교안·강의로 수업을 시작하세요</h1>
        <p className="text-sm" style={{ color: '#787774' }}>구매한 교안과 강의는 학생 수업·교재로 바로 활용됩니다.</p>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all border"
            style={{
              background: cat === c ? '#FF6C37' : 'white',
              color: cat === c ? 'white' : '#37352F',
              borderColor: cat === c ? '#FF6C37' : '#E9E9E7',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(p => (
          <article key={p.id} className="rounded-xl border overflow-hidden bg-white flex flex-col" style={{ borderColor: '#E9E9E7', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            {/* 썸네일 */}
            <div className="relative h-36 flex items-center justify-center text-5xl" style={{ background: '#F1F1EF' }}>
              {p.thumbnailEmoji}
              <span className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-md text-white" style={{ background: p.type === '교안' ? '#37352F' : '#FF6C37' }}>{p.type}</span>
              <span className="absolute top-2 right-2 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border" style={{ color: '#787774', borderColor: '#E9E9E7' }}>{p.level}</span>
              {p.badge && (
                <span className="absolute bottom-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: p.badge === '베스트' ? '#FFF1EC' : '#EAF5EA', color: p.badge === '베스트' ? '#FF6C37' : '#2E7D32' }}>{p.badge}</span>
              )}
            </div>
            {/* 본문 */}
            <div className="p-4 flex flex-col flex-1">
              <h2 className="text-sm font-semibold leading-snug mb-1.5 line-clamp-2">{p.title}</h2>
              <p className="text-xs mb-2" style={{ color: '#787774' }}>{p.instructor} · {p.lessons}차시 · {formatDuration(p.durationMin)}</p>
              <p className="text-xs mb-3" style={{ color: '#787774' }}>
                <span style={{ color: '#F5A623' }}>★</span> {p.rating.toFixed(1)} <span style={{ color: '#B8B8B5' }}>(수강생 {p.students.toLocaleString()}명)</span>
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {p.skills.map(s => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: '#F1F1EF', color: '#787774' }}>{s}</span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-base font-bold">{won(p.priceWon)}</span>
                <button onClick={() => add(p)} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ background: '#FF6C37' }}>담기</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* 장바구니 슬라이드오버 */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setCartOpen(false)}>
          <div className="w-full max-w-md h-full bg-white flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 h-14 border-b" style={{ borderColor: '#E9E9E7' }}>
              <span className="text-base font-bold">장바구니 ({count})</span>
              <button onClick={() => setCartOpen(false)} className="text-sm" style={{ color: '#787774' }}>닫기 ✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: '#787774' }}>담은 교안·강의가 없습니다.</div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {cart.map(line => (
                  <div key={line.product.id} className="flex gap-3 p-3 rounded-lg border" style={{ borderColor: '#E9E9E7' }}>
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-2xl rounded-md" style={{ background: '#F1F1EF' }}>{line.product.thumbnailEmoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1 line-clamp-1">{line.product.title}</p>
                      <p className="text-xs mb-2" style={{ color: '#787774' }}>{won(line.product.priceWon)}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCart(c => setQty(c, line.product.id, line.qty - 1))} className="w-6 h-6 rounded border text-sm" style={{ borderColor: '#E9E9E7' }}>−</button>
                        <span className="text-sm w-6 text-center">{line.qty}</span>
                        <button onClick={() => setCart(c => setQty(c, line.product.id, line.qty + 1))} className="w-6 h-6 rounded border text-sm" style={{ borderColor: '#E9E9E7' }}>+</button>
                        <button onClick={() => setCart(c => removeFromCart(c, line.product.id))} className="ml-auto text-xs" style={{ color: '#C0392B' }}>삭제</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-4 border-t" style={{ borderColor: '#E9E9E7' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: '#787774' }}>합계</span>
                <span className="text-lg font-bold">{won(total)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => setPaid(true)}
                className="w-full py-3 rounded-lg text-sm font-bold text-white transition-colors"
                style={{ background: cart.length === 0 ? '#E9E9E7' : '#FF6C37', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 결제 확인 모달 (목업) */}
      {paid && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-5" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => { setPaid(false); setCart([]); setCartOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl p-6 bg-white text-center" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-lg font-bold mb-2">결제 완료!</h2>
            <p className="text-sm mb-1" style={{ color: '#787774' }}>{count}개 · {won(total)}</p>
            <p className="text-xs mb-5" style={{ color: '#787774' }}>구매한 교안·강의는 내 강의실에서 수강할 수 있습니다.</p>
            <button onClick={() => { setPaid(false); setCart([]); setCartOpen(false); }} className="w-full py-3 rounded-lg text-sm font-bold text-white" style={{ background: '#FF6C37' }}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
