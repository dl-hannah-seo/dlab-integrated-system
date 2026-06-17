import { Sidebar } from '@/components/layout/Sidebar';
import { QuickActionsProvider } from '@/components/panels/QuickActionsContext';
import { AttendancePanel } from '@/components/panels/AttendancePanel';
import { SmsPanel } from '@/components/panels/SmsPanel';
import { RecordingPanel } from '@/components/panels/RecordingPanel';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <QuickActionsProvider>
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen">
          <div className="max-w-[1440px] mx-auto px-10 py-10">
            {children}
          </div>
        </main>
        <AttendancePanel />
        <SmsPanel />
        <RecordingPanel />
      </QuickActionsProvider>
    </div>
  );
}
