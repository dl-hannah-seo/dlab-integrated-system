import type { Metadata } from 'next';
import { KioskShell } from '@/components/kiosk/KioskShell';

export const metadata: Metadata = {
  title: 'D.LAB — 학생 포털',
};

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return <KioskShell>{children}</KioskShell>;
}
