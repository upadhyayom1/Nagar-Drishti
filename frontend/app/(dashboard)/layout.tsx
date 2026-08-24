'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useUIStore } from '@/store/uiStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#08080a] text-gray-100 relative">
      
      {/* Deep Ambient Glows for Glass Refraction */}
      <div className="absolute top-0 left-1/4 w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[40vw] h-[40vw] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Sidebar (Hidden on mobile) */}
      <aside 
        className="hidden md:flex flex-col z-20 transition-all duration-300 ease-in-out p-4 pr-2 shrink-0"
        style={{ width: sidebarCollapsed ? '104px' : '280px' }}
      >
        <div className="w-full h-full rounded-[1.5rem] bg-white/[0.015] backdrop-blur-2xl border border-white/[0.02] shadow-2xl flex flex-col overflow-hidden">
          <Sidebar />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 p-4 pl-2 gap-4">
        
        {/* Restored TopBar Container */}
        <header className="shrink-0 rounded-[1.5rem] bg-white/[0.015] backdrop-blur-2xl border border-white/[0.02] shadow-lg">
          <TopBar />
        </header>

        {/* Scrolling Page Content */}
        <main className="flex-1 overflow-y-auto rounded-[1.5rem] bg-white/[0.01] backdrop-blur-2xl border border-white/[0.02] shadow-inner p-4 md:p-6 no-scrollbar">
          {children}
        </main>
        
      </div>
    </div>
  );
}