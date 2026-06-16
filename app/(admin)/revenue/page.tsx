import { redirect } from 'next/navigation';

// 매출현황은 수납 관리(/payments)로 통합되었습니다.
export default function RevenuePage() {
  redirect('/payments');
}
