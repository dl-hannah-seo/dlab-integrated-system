import type { Metadata } from 'next';
import { Agentation } from 'agentation';
import './globals.css';

export const metadata: Metadata = {
  title: 'D.LAB OS',
  description: 'D.LAB 학원 관리 솔루션',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  );
}
