import { Sidebar } from '@/components/layout/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-[960px] mx-auto px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
