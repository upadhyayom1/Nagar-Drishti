'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { AuthGuard } from '@/components/layout/AuthGuard';

export default function UserPortalLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useUIStore();

  return (
    <AuthGuard allowedRoles={['USER']}>
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] flex flex-col font-body selection:bg-[var(--brand-teal)]/30">
      
      {/* ── Ambient Lights ── */}
      <div className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full blur-[180px] pointer-events-none z-0 bg-[var(--brand-teal)]/[0.04]" />
      <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full blur-[180px] pointer-events-none z-0 bg-[var(--signal-cyan)]/[0.04]" />

      {/* ── User Header ── */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3.5 border-b border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Logo size="sm" />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Color Theme"
              className="p-2 rounded-xl bg-white/[0.04] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--brand-teal)] transition-all"
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-[var(--signal-violet)]" />}
            </button>

            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={13} /> Command Center
              </Button>
            </Link>
          </div>

        </div>
      </header>

      {/* ── Page Viewport ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 relative z-10">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="py-6 px-4 text-center border-t border-[var(--glass-border)] text-xs text-[var(--text-tertiary)] font-body relative z-10">
        <p>© {new Date().getFullYear()} NagarDrishti Public Safety · Municipal Citizen Reporting System</p>
      </footer>
    </div>
    </AuthGuard>
  );
}
