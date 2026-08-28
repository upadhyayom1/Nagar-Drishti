'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar }             from '@/components/layout/Sidebar';
import { TopBar }              from '@/components/layout/TopBar';
import { NotificationsPanel }  from '@/components/layout/NotificationsPanel';
import { useUIStore }          from '@/store/uiStore';
import { cn }                  from '@/lib/utils';
import { X }                   from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const pathname = usePathname();

  // Scroll to top and close mobile menu on route changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  return (
    <div
      className="fixed inset-0 flex w-screen h-screen overflow-hidden select-none font-body bg-[var(--bg-void)] text-[var(--text-primary)]"
    >
      {/* ── Multi-Chromatic Ambient Glowing Orbs ── */}
      <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full blur-[180px] pointer-events-none z-0 bg-cyan-500/[0.08]" />
      <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[190px] pointer-events-none z-0 bg-indigo-500/[0.08]" />
      <div className="absolute bottom-[-15%] left-[30%] w-[50vw] h-[50vw] rounded-full blur-[200px] pointer-events-none z-0 bg-pink-500/[0.05]" />

      {/* ── Desktop / Tablet Sidebar Shell ── */}
      <aside
        className={cn(
          'hidden md:flex flex-col z-20 transition-all duration-300 ease-in-out p-3.5 pr-1.5 shrink-0 h-full overflow-hidden',
          sidebarCollapsed ? 'w-[76px]' : 'w-[76px] xl:w-[260px]',
        )}
      >
        <div className="w-full h-full glass-panel flex flex-col overflow-hidden">
          <Sidebar />
        </div>
      </aside>

      {/* ── Mobile Off-Canvas Drawer (< 768px) ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Glass Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-[80vw] h-full glass-panel-elevated p-4 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--glass-border)]">
              <span className="font-display font-bold text-sm text-[var(--text-primary)]">Command Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-white/[0.04] text-[var(--text-secondary)] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 z-10 p-2.5 sm:p-3.5 pl-2 sm:pl-2 gap-2.5 sm:gap-3 h-full overflow-hidden">

        {/* Floating TopBar */}
        <header className="shrink-0 glass-panel rounded-2xl overflow-hidden">
          <TopBar />
        </header>

        {/* Inner Scrollable Page Viewport */}
        <main
          className="flex-1 overflow-y-auto rounded-2xl p-3 sm:p-5 relative z-10 bg-[var(--glass-surface)] border border-[var(--glass-border)]"
        >
          {children}
        </main>

      </div>

      {/* ── Global Notifications Panel ── */}
      <NotificationsPanel />
    </div>
  );
}