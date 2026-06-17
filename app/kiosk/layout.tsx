import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'D.LAB OS — 키오스크',
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kiosk-scope min-h-screen" style={{ background: 'var(--kiosk-bg)', color: 'var(--kiosk-text)' }}>
      <header className="flex items-center h-14 px-6 border-b" style={{ borderColor: 'var(--kiosk-border)' }}>
        <h1 className="text-lg font-extrabold tracking-tight">출석 키오스크</h1>
      </header>
      {children}
    </div>
  );
}
