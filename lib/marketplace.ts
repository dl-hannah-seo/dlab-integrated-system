import type { LessonProduct } from './mock-data';

export interface CartLine {
  product: LessonProduct;
  qty: number;
}

/** 카테고리로 필터 ('전체'면 전부) */
export function filterByCategory(all: LessonProduct[], category: string): LessonProduct[] {
  return category === '전체' ? all : all.filter(p => p.category === category);
}

/** 담기: 이미 있으면 수량 +1, 없으면 새 라인 추가 (불변) */
export function addToCart(cart: CartLine[], product: LessonProduct): CartLine[] {
  if (cart.some(line => line.product.id === product.id)) {
    return cart.map(line =>
      line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line,
    );
  }
  return [...cart, { product, qty: 1 }];
}

/** 수량 변경: 0 이하가 되면 라인 제거 */
export function setQty(cart: CartLine[], productId: string, qty: number): CartLine[] {
  if (qty <= 0) return removeFromCart(cart, productId);
  return cart.map(line =>
    line.product.id === productId ? { ...line, qty } : line,
  );
}

/** 라인 제거 */
export function removeFromCart(cart: CartLine[], productId: string): CartLine[] {
  return cart.filter(line => line.product.id !== productId);
}

/** 담은 총 수량 (배지용) */
export function cartCount(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.qty, 0);
}

/** 합계 금액(원) */
export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.product.priceWon * line.qty, 0);
}

/** 분 → "N시간 M분" (정시는 분 생략, 1시간 미만은 "M분") */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
