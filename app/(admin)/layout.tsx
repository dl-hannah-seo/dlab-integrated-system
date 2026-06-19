import { Sidebar } from '@/components/layout/Sidebar';
import { QuickActionsProvider } from '@/components/panels/QuickActionsContext';
import { MakeupProvider } from '@/components/panels/MakeupContext';
import { LeadsProvider } from '@/components/panels/LeadsContext';
import { LeadConsultProvider } from '@/components/panels/LeadConsultContext';
import { FeedbackProvider } from '@/components/panels/FeedbackContext';
import { RoleProvider } from '@/components/layout/RoleContext';
import { AttendancePanel } from '@/components/panels/AttendancePanel';
import { SmsPanel } from '@/components/panels/SmsPanel';
import { RecordingPanel } from '@/components/panels/RecordingPanel';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F4F6FA]">
      <RoleProvider>
      <QuickActionsProvider>
        <MakeupProvider>
        <LeadsProvider>
        <LeadConsultProvider>
        <FeedbackProvider>
          <Sidebar />
          <main className="flex-1 ml-60 min-h-screen">
            <div className="max-w-[1440px] mx-auto px-10 py-10">
              {children}
            </div>
          </main>
          <AttendancePanel />
          <SmsPanel />
          <RecordingPanel />
        </FeedbackProvider>
        </LeadConsultProvider>
        </LeadsProvider>
        </MakeupProvider>
      </QuickActionsProvider>
      </RoleProvider>
    </div>
  );
}
