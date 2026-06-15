import { redirect } from 'next/navigation';

// 수납 내역은 '수납 관리'(/payments)로 통합되었습니다.
export default function PaymentHistoryPage() {
  redirect('/payments');
}
