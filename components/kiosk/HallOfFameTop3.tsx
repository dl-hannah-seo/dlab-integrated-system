import { students } from '@/lib/mock-data';

const MEDALS = ['🥇', '🥈', '🥉'];

export function HallOfFameTop3() {
  const top3 = [...students]
    .filter(s => s.status === '재원')
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return (
    <div className="rounded-3xl border p-5 h-full flex flex-col" style={{ background: 'var(--kiosk-surface)', borderColor: 'var(--kiosk-border)' }}>
      <div className="text-base font-bold text-white mb-4">🏆 이달의 포인트 TOP 3</div>
      <div className="flex flex-col gap-3 flex-1">
        {top3.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 px-5 rounded-xl flex-1"
            style={{ background: 'var(--kiosk-card)' }}>
            <span className="text-2xl">{MEDALS[i]}</span>
            <span className="flex-1 font-bold text-white text-base">{s.name}</span>
            <span className="text-base font-bold" style={{ color: 'var(--kiosk-orange)' }}>
              {s.points.toLocaleString()}P
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
