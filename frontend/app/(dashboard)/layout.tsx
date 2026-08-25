'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar }             from '@/components/layout/Sidebar';
import { TopBar }              from '@/components/layout/TopBar';
import { NotificationsPanel }  from '@/components/layout/NotificationsPanel';
import { useUIStore }          from '@/store/uiStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const pathname = usePathname();

  // Ensure window scroll is always locked to top (prevents browser auto-scrolling to clicked bottom links)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div
      className="fixed inset-0 flex w-screen h-screen overflow-hidden select-none font-body"
      style={{ backgroundColor: 'var(--bg-void)', color: 'var(--text-primary)' }}
    >
      {/* ── Multi-Chromatic Ambient Light Orbs ── */}
      <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full blur-[180px] pointer-events-none z-0"
           style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent)' }} />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full blur-[190px] pointer-events-none z-0"
           style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07), transparent)' }} />
      <div className="absolute top-[40%] right-[25%] w-[40vw] h-[40vw] rounded-full blur-[200px] pointer-events-none z-0"
           style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.04), transparent)' }} />

      {/* ── Sidebar Shell ── */}
      <aside
        className="hidden md:flex flex-col z-20 transition-all duration-300 ease-in-out p-3.5 pr-1.5 shrink-0 h-full overflow-hidden"
        style={{ width: sidebarCollapsed ? '94px' : '270px' }}
      >
        <div className="w-full h-full glass-panel flex flex-col overflow-hidden">
          <Sidebar />
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 z-10 p-3.5 pl-2 gap-3 h-full overflow-hidden">

        {/* Floating TopBar */}
        <header className="shrink-0 glass-panel rounded-[1.25rem] overflow-hidden">
          <TopBar />
        </header>

        {/* Inner Scrollable Page Viewport */}
        <main
          className="flex-1 overflow-y-auto rounded-[1.25rem] p-5 relative z-10"
          style={{
            background: 'rgba(10,14,30,0.4)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.7)',
          }}
        >
          {children}
        </main>

      </div>

      {/* ── Global Notifications Panel ── */}
      <NotificationsPanel />
    </div>
  );
}