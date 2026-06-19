import { redirect } from 'next/navigation';

// 학생 포털은 키오스크 화면(/kiosk)으로 통합됨 — 기존 링크 호환용 리디렉션
export default function MePage() {
  redirect('/kiosk');
}
