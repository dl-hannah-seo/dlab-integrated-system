import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'D.LAB OS — 키오스크',
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kiosk-scope min-h-screen" style={{ background: 'var(--kiosk-bg)', color: 'var(--kiosk-text)' }}>
      {children}
    </div>
  );
}
