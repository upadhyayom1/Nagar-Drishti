'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bell, Menu, Moon, Search, Sun, X, User } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/store/uiStore';
import { alertService } from '@/services/alertService';
import { analyticsService } from '@/services/analyticsService';
import { UserProfileModal } from '@/components/profile/UserProfileModal';

const pageTitles: Record<string, string> = {
  '/dashboard':   'Command Center',
  '/cameras':     'Live Optical Grid',
  '/vehicles':    'Vehicle Intelligence',
  '/analytics':   'Traffic Analytics',
  '/network':     'Movement Network',
  '/alerts':      'Sentinel Alerts',
  '/system':      'System Diagnostics',
  '/submissions': 'Citizen Field Submissions',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/cameras/'))                                       return 'Camera Feed Telemetry';
  if (pathname.startsWith('/vehicles/') && pathname.endsWith('/trajectory')) return 'Trajectory Reconstruction';
  if (pathname.startsWith('/vehicles/') && pathname !== '/vehicles')         return 'Vehicle Intelligence Profile';
  return pageTitles[pathname] ?? 'UrbanPulse';
}

export function TopBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const {
    searchQuery, setSearchQuery,
    notificationsOpen, setNotificationsOpen,
    toggleMobileMenu,
    theme, toggleTheme, setTheme,
  } = useUIStore();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const { data: alertCount = 0 } = useQuery({ queryKey: ['activeAlertCount'], queryFn: alertService.getActiveAlertCount });
  const { data: systemHealth } = useQuery({ queryKey: ['systemHealth'], queryFn: analyticsService.getSystemHealth });

  // Initialize theme from localStorage or system preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('urbanpulse_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      document.documentElement.setAttribute('data-theme', initial);
    }
  }, [setTheme]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/vehicles?search=${encodeURIComponent(searchQuery.trim().toUpperCase())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-18 w-full font-body border-b border-[var(--glass-border)] bg-[var(--glass-surface)] backdrop-blur-2xl relative">

        {/* Left: Mobile Hamburger & Page Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile Hamburger Trigger (< 768px) */}
          <button
            onClick={toggleMobileMenu}
            aria-label="Open Navigation Menu"
            className="md:hidden p-2 rounded-xl bg-white/[0.04] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-sm sm:text-base md:text-lg font-bold text-[var(--text-primary)] tracking-tight truncate flex items-center gap-2">
              {getPageTitle(pathname)}
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 font-medium mt-0.5 text-[var(--text-secondary)] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse shrink-0" />
              <span className="text-cyan-400 font-semibold truncate">{systemHealth?.summary.online ?? 10} Camera Nodes Online</span>
              <span className="hidden sm:inline text-[var(--text-tertiary)]">·</span>
              <span className="hidden sm:inline truncate">Prayagraj Sector</span>
            </p>
          </div>
        </div>

        {/* Desktop & Tablet Search Bar */}
        <div className="w-64 lg:w-80 shrink-0 hidden md:block">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search license plate (e.g. TN38AB1234)"
            showSearchIcon
            shortcutHint="↵ ENTER"
            className="h-9 text-xs font-mono"
          />
        </div>

        {/* Right Controls: Mobile Search Trigger, Theme Switcher, Operator Chip, Notifications */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Mobile Search Toggle (< 768px) */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle Search"
            className="md:hidden p-2 rounded-xl bg-white/[0.04] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {mobileSearchOpen ? <X size={16} /> : <Search size={16} />}
          </button>

          {/* Theme Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Color Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-white/[0.04] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-400/40 transition-all duration-150"
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> : <Moon size={16} className="text-violet-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />}
          </button>

          {/* Operator Identity Chip — Clickable to open Profile Modal */}
          <button
            onClick={() => setProfileModalOpen(true)}
            title="Open Operator Profile"
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-[var(--glass-border)] hover:border-cyan-400/40 transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00f0ff] via-[#6366f1] to-[#ec4899] flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_12px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform">
              RK
            </div>
            <div className="text-[10px] leading-tight font-mono text-left hidden lg:block">
              <span className="text-[var(--text-primary)] font-semibold block group-hover:text-cyan-400 transition-colors">Rahul Krishnan</span>
              <span className="text-[var(--text-tertiary)] block text-[9px]">Sector Operator · On Shift</span>
            </div>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl bg-white/[0.03] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] border border-[var(--glass-border)] hover:border-cyan-400/40 transition-all duration-150 outline-none hover:scale-[1.02]"
            aria-label="Sentinel Alerts"
          >
            <Bell size={16} />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500/25 text-rose-400 border border-rose-500/40 text-[9px] font-mono font-bold flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                {alertCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Mobile Search Popover */}
        {mobileSearchOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 p-3 bg-[var(--bg-elevated)] border-b border-[var(--glass-border)] shadow-2xl z-30 animate-in fade-in slide-in-from-top-2 duration-150">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search license plate (↵ ENTER)"
              showSearchIcon
              autoFocus
              className="h-10 text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </>
  );
}
