import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'D.LAB OS',
  description: 'D.LAB 학원 관리 솔루션',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
