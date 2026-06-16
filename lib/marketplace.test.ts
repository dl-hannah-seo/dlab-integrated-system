import { describe, it, expect } from 'vitest';
import {
  filterByCategory,
  addToCart,
  setQty,
  removeFromCart,
  cartCount,
  cartTotal,
  formatDuration,
  type CartLine,
} from './marketplace';
import type { LessonProduct } from './mock-data';

const p = (id: string, priceWon: number, category = '파이썬'): LessonProduct => ({
  id, title: id, category, type: '교안', instructor: '강사', level: '입문',
  lessons: 1, durationMin: 60, rating: 4.5, students: 10, skills: [],
  priceWon, thumbnailEmoji: '🐍',
});

describe('filterByCategory', () => {
  const all = [p('a', 1000, '파이썬'), p('b', 2000, '웹·앱')];
  it("'전체'면 전부 반환한다", () => {
    expect(filterByCategory(all, '전체')).toHaveLength(2);
  });
  it('카테고리로 필터한다', () => {
    expect(filterByCategory(all, '웹·앱').map(x => x.id)).toEqual(['b']);
  });
});

describe('addToCart', () => {
  it('새 상품은 수량 1로 추가한다', () => {
    const cart = addToCart([], p('a', 1000));
    expect(cart).toEqual([{ product: p('a', 1000), qty: 1 }]);
  });
  it('이미 담긴 상품은 수량을 +1 한다', () => {
    const cart = addToCart([{ product: p('a', 1000), qty: 1 }], p('a', 1000));
    expect(cart).toEqual([{ product: p('a', 1000), qty: 2 }]);
  });
  it('원본 배열을 변경하지 않는다(불변)', () => {
    const original: CartLine[] = [];
    addToCart(original, p('a', 1000));
    expect(original).toEqual([]);
  });
});

describe('setQty', () => {
  it('수량을 설정한다', () => {
    const cart = setQty([{ product: p('a', 1000), qty: 1 }], 'a', 3);
    expect(cart[0].qty).toBe(3);
  });
  it('수량이 0 이하면 라인을 제거한다', () => {
    const cart = setQty([{ product: p('a', 1000), qty: 1 }], 'a', 0);
    expect(cart).toEqual([]);
  });
});

describe('removeFromCart', () => {
  it('해당 상품 라인을 제거한다', () => {
    const cart = removeFromCart([{ product: p('a', 1000), qty: 2 }], 'a');
    expect(cart).toEqual([]);
  });
});

describe('cartCount', () => {
  it('담긴 수량의 합을 반환한다', () => {
    expect(cartCount([
      { product: p('a', 1000), qty: 2 },
      { product: p('b', 2000), qty: 1 },
    ])).toBe(3);
  });
  it('빈 장바구니는 0', () => {
    expect(cartCount([])).toBe(0);
  });
});

describe('cartTotal', () => {
  it('수량 × 가격의 합을 반환한다', () => {
    expect(cartTotal([
      { product: p('a', 1000), qty: 2 },
      { product: p('b', 2000), qty: 1 },
    ])).toBe(4000);
  });
});

describe('formatDuration', () => {
  it('시간+분', () => expect(formatDuration(370)).toBe('6시간 10분'));
  it('정시는 분 생략', () => expect(formatDuration(360)).toBe('6시간'));
  it('1시간 미만은 분만', () => expect(formatDuration(45)).toBe('45분'));
});
