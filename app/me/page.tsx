'use client';

import { useState } from 'react';
import { type Student } from '@/lib/mock-data';
import { AuthEntry } from '@/components/kiosk/AuthEntry';
import { StudentDashboard } from '@/components/kiosk/StudentDashboard';

export default function StudentPortalPage() {
  const [student, setStudent] = useState<Student | null>(null);

  return (
    <div className="px-6 py-8 min-h-screen">
      {!student ? (
        <div className="mx-auto" style={{ maxWidth: 440, marginTop: '4vh' }}>
          <AuthEntry icon="🎮" title="포인트 상점 · 마이페이지" listSub="이름을 누르면 들어가요" cta="입장 →" onPick={setStudent} />
          <p className="text-center text-xs mt-4" style={{ color: 'var(--kiosk-muted)' }}>내 휴대폰·노트북에서 이용할 수 있어요</p>
        </div>
      ) : (
        <StudentDashboard student={student} onLogout={() => setStudent(null)} />
      )}
    </div>
  );
}
