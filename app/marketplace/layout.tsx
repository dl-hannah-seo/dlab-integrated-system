import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'D.LAB OS — 교안 마켓플레이스',
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#F7F7F5', color: '#37352F' }}>
      {children}
    </div>
  );
}
