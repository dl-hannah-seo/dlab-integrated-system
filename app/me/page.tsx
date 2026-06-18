'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Student } from '@/lib/mock-data';
import { ROLE_STORAGE_KEY } from '@/lib/roles';
import { AuthEntry } from '@/components/kiosk/AuthEntry';
import { StudentDashboard } from '@/components/kiosk/StudentDashboard';

export default function StudentPortalPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const router = useRouter();

  // 데모: 역할을 원장으로 되돌리고 관리자 화면으로 복귀
  function backToAdmin() {
    if (typeof window !== 'undefined') window.localStorage.setItem(ROLE_STORAGE_KEY, '원장');
    router.push('/dashboard');
  }

  return (
    <div className="px-6 py-8 min-h-screen">
      {/* 데모용 복귀 버튼 */}
      <div className="mx-auto mb-4" style={{ maxWidth: 560 }}>
        <button onClick={backToAdmin}
          className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{ color: 'var(--kiosk-muted)', background: 'var(--kiosk-surface)', border: '1px solid var(--kiosk-border)' }}>
          ← 관리자 화면으로 (데모)
        </button>
      </div>

      {!student ? (
        <div className="mx-auto" style={{ maxWidth: 440, marginTop: '2vh' }}>
          <AuthEntry icon="🎮" title="포인트 상점 · 마이페이지" listSub="이름을 누르면 들어가요" cta="입장 →" onPick={setStudent} />
          <p className="text-center text-xs mt-4" style={{ color: 'var(--kiosk-muted)' }}>내 휴대폰·노트북에서 이용할 수 있어요</p>
        </div>
      ) : (
        <StudentDashboard student={student} onLogout={() => setStudent(null)} />
      )}
    </div>
  );
}
