'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, Moon, Search, Sun, X, User, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PulseDot } from '@/components/ui/PulseDot';
import { useUIStore } from '@/store/uiStore';
import { alertService } from '@/services/alertService';
import { analyticsService } from '@/services/analyticsService';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/dashboard':   'Command Center',
  '/cameras':     'Live Optical Grid',
  '/vehicles':    'Vehicle Intelligence',
  '/detect':      'AI Plate Detection',
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
  return pageTitles[pathname] ?? 'NagarDrishti';
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
  const [prevAlertCount, setPrevAlertCount] = useState(0);
  const [badgeAnimKey, setBadgeAnimKey] = useState(0);
  const bellRef = useRef<HTMLButtonElement>(null);

  const user = useAuthStore((state) => state.user);
  const displayName = user?.name || user?.username || 'Operator';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const { data: alertCount = 0 } = useQuery({
    queryKey: ['activeAlertCount'],
    queryFn: alertService.getActiveAlertCount,
    refetchInterval: 5_000,
  });
  const { data: recentAlerts = [] } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: () => alertService.getRecentAlerts(5),
    refetchInterval: 5_000,
    enabled: notificationsOpen,
  });
  const { data: systemHealth } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: analyticsService.getSystemHealth,
    refetchInterval: 15_000,
  });

  // Badge pop on count increase
  useEffect(() => {
    if (alertCount > prevAlertCount) {
      setBadgeAnimKey((k) => k + 1);
    }
    setPrevAlertCount(alertCount);
  }, [alertCount]);

  // Initialize theme from localStorage or system preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('nagardrishti_theme') as 'dark' | 'light' | null;
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

  function severityColor(sev: string) {
    if (sev === 'critical') return 'text-red-400';
    if (sev === 'high') return 'text-amber-400';
    return 'text-[#10a37f]';
  }

  return (
    <>
      <div className="h-14 lg:h-16 w-full rounded-full border border-[var(--glass-border)] true-glass flex items-center justify-between px-4 lg:px-6 transition-colors">
        {/* Left: Mobile Hamburger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleMobileMenu}
            aria-label="Open Navigation Menu"
            className="md:hidden p-2 rounded-xl bg-white/[0.04] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[#10a37f]"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-sm sm:text-base md:text-lg font-extrabold text-[var(--text-primary)] tracking-tight truncate flex items-center gap-2">
              {getPageTitle(pathname)}
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 font-semibold mt-0.5 text-[var(--text-secondary)] truncate">
              <PulseDot variant="emerald" size="sm" />
              <span className="text-[var(--brand-teal)] font-bold truncate">{systemHealth?.summary.online ?? 0} CAMERA NODES ONLINE</span>
              <span className="hidden sm:inline text-[var(--text-tertiary)]">·</span>
              <span className="hidden sm:inline truncate text-[var(--text-secondary)]">PRAYAGRAJ SECTOR</span>
            </p>
          </div>
        </div>

        {/* Desktop & Tablet Search Bar */}
        <div className="w-72 lg:w-96 shrink-0 hidden md:block">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search plate (e.g. TN38AB1234)..."
            showSearchIcon
            shortcutHint="↵ Enter"
            className="h-10 text-xs font-mono"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle Search"
            className="md:hidden p-2.5 rounded-full bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated-2)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            {mobileSearchOpen ? <X size={16} /> : <Search size={16} />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Color Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-full bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated-2)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            {theme === 'dark'
              ? <Sun size={15} className="text-amber-400" />
              : <Moon size={15} className="text-violet-500" />
            }
          </button>

          {/* Operator Identity Chip */}
          <button
            onClick={() => setProfileModalOpen(true)}
            title="Open Operator Profile"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated-2)] border border-[var(--glass-border)] transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
          >
            <div className="w-6 h-6 rounded-full bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--brand-teal)] group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="text-[10px] leading-tight font-mono text-left hidden lg:block">
              <span className="text-[var(--text-primary)] font-bold block group-hover:text-[var(--brand-teal)] transition-colors">{displayName}</span>
              <span className="text-[var(--text-secondary)] block text-[9px]">{user?.role === 'ADMIN' ? 'Municipal Administrator' : 'Authenticated User'}</span>
            </div>
          </button>

          {/* Notifications Bell with pop animation on count increase */}
          <div className="relative">
            <button
              ref={bellRef}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 rounded-full bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--glass-border)] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)]"
              aria-label="Sentinel Alerts"
            >
              <Bell size={16} />
              <AnimatePresence mode="wait">
                {alertCount > 0 && (
                  <motion.span
                    key={badgeAnimKey}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white border border-red-400 text-[9px] font-mono font-bold flex items-center justify-center"
                  >
                    {alertCount > 99 ? '99+' : alertCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Notifications Dropdown — slide+fade */}
            <AnimatePresence>
              {notificationsOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-80 z-40 glass-panel p-0 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
                      <span className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                        <PulseDot variant="rose" size="sm" />
                        Live Alerts
                      </span>
                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded focus-visible:ring-2 focus-visible:ring-cyan-400"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Alert List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-[var(--glass-border)]">
                      {recentAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                          <CheckCircle2 size={24} className="text-emerald-400/50" />
                          <p className="text-xs font-mono text-[var(--text-tertiary)]">No active alerts</p>
                        </div>
                      ) : (
                        recentAlerts.map((alert: any) => (
                          <div 
                            key={alert.id} 
                            onClick={() => { setNotificationsOpen(false); router.push('/alerts'); }}
                            className="px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <AlertCircle size={13} className={`shrink-0 mt-0.5 ${severityColor(alert.severity)}`} />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate font-display">{alert.title}</p>
                                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-relaxed font-body">{alert.description}</p>
                                </div>
                              </div>
                              <Badge
                                variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'warn' : 'info'}
                                size="sm"
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1.5 flex items-center gap-1">
                              <Clock size={9} /> {formatRelativeTime(alert.timestamp)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-[var(--glass-border)]">
                      <button
                        onClick={() => { setNotificationsOpen(false); router.push('/alerts'); }}
                        className="w-full text-center text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors font-semibold focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
                      >
                        View all alerts →
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Expandable Mobile Search Popover */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="md:hidden absolute top-full left-0 right-0 p-3 bg-[var(--bg-elevated)] border-b border-[var(--glass-border)] shadow-2xl z-30"
            >
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search license plate (↵ ENTER)"
                showSearchIcon
                autoFocus
                className="h-10 text-xs font-mono"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </>
  );
}
