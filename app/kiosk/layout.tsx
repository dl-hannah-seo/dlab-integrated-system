import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'D.LAB OS — 키오스크',
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kiosk-scope min-h-screen" style={{ background: 'var(--kiosk-bg)', color: 'var(--kiosk-text)' }}>
      {/* 키오스크 전용 애니메이션 (전역 globals.css 오염 방지를 위해 스코프 내 정의) */}
      <style>{`
        @keyframes kioskWave { 0%,60%,100%{transform:rotate(0)} 15%{transform:rotate(16deg)} 30%{transform:rotate(-8deg)} 45%{transform:rotate(12deg)} }
        @keyframes kioskFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        .kiosk-wave { display:inline-block; transform-origin:70% 80%; animation:kioskWave 1.8s ease-in-out infinite; }
        .kiosk-float { display:inline-block; animation:kioskFloat 1.6s ease-in-out infinite; }
      `}</style>
      {children}
    </div>
  );
}
