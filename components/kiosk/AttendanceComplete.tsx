'use client';

import { classes, type Student } from '@/lib/mock-data';
import { levelOf } from '@/lib/kiosk';

const ATTEND_POINTS = 30;

export function AttendanceComplete({ student, onDone }: { student: Student; onDone: () => void }) {
  const cls = classes.find(c => c.id === student.class_id);
  const room = cls?.room || '강의실';

  const displayTitle = student.title || '새내기';

  return (
    <div className="rounded-3xl p-8 border text-center" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
      <div className="text-5xl kiosk-float">🎉</div>
      <div className="text-2xl font-extrabold text-white mt-3">{student.name} 학생, 출석 완료!</div>

      {/* 학부모 알림 */}
      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: 'rgba(15,123,108,0.18)', color: '#34C7A8' }}>
        ✅ 학부모님께 출석 완료 알림이 발송되었습니다.
      </div>

      {/* 오늘 수업 · 이동 안내 */}
      <div className="mt-5 rounded-2xl p-5 text-left" style={{ background: 'var(--kiosk-card)' }}>
        <div className="text-sm" style={{ color: 'var(--kiosk-muted)' }}>오늘 수업</div>
        <div className="text-xl font-extrabold text-white mt-1">{cls?.course ?? '-'}</div>
        <div className="text-sm mt-1" style={{ color: 'var(--kiosk-muted)' }}>{cls?.teacher} 선생님 · {cls?.schedule}</div>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-white" style={{ background: 'var(--kiosk-orange)' }}>
          🚪 {room}(으)로 이동하세요
        </div>
      </div>

      {/* 포인트 · 칭호 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4" style={{ background: 'var(--kiosk-card)' }}>
          <div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>획득</div>
          <div className="text-lg font-extrabold" style={{ color: 'var(--kiosk-gold)' }}>+{ATTEND_POINTS}P</div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--kiosk-card)' }}>
          <div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>레벨</div>
          <div className="text-lg font-extrabold text-white">Lv.{levelOf(student.points)}</div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--kiosk-card)' }}>
          <div className="text-xs" style={{ color: 'var(--kiosk-muted)' }}>칭호</div>
          <div className="text-sm font-extrabold" style={{ color: 'var(--kiosk-orange)' }}>{displayTitle}</div>
        </div>
      </div>

      <button onClick={onDone}
        className="w-full mt-6 py-3.5 rounded-xl text-base font-extrabold text-white transition-all active:scale-95"
        style={{ background: 'var(--kiosk-orange)' }}>확인</button>
    </div>
  );
}
