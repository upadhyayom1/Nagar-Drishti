'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useUIStore } from '@/store/uiStore';
import { alertService } from '@/services/alertService';
import { analyticsService } from '@/services/analyticsService';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Command Center',
  '/cameras':   'Optical Feed Grid',
  '/vehicles':  'Vehicle Intelligence',
  '/analytics': 'Traffic Analytics',
  '/network':   'Movement Network',
  '/alerts':    'Sentinel Alerts',
  '/system':    'System Diagnostics',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/cameras/'))                                       return 'Optical Feed Telemetry';
  if (pathname.startsWith('/vehicles/') && pathname.endsWith('/trajectory')) return 'Trajectory Reconstruction';
  if (pathname.startsWith('/vehicles/') && pathname !== '/vehicles')         return 'Vehicle Intelligence Profile';
  return pageTitles[pathname] ?? 'UrbanPulse';
}

export function TopBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { searchQuery, setSearchQuery, notificationsOpen, setNotificationsOpen } = useUIStore();
  const { logout } = useAuthStore();
  const { data: alertCount = 0 } = useQuery({ queryKey: ['activeAlertCount'], queryFn: alertService.getActiveAlertCount });
  const { data: systemHealth } = useQuery({ queryKey: ['systemHealth'], queryFn: analyticsService.getSystemHealth });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/vehicles?search=${encodeURIComponent(searchQuery.trim().toUpperCase())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 px-6 h-20 w-full font-body border-b border-white/[0.08] bg-[rgba(5,7,17,0.75)] backdrop-blur-2xl">

      {/* Page Title & Multi-color Status Pill */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-lg sm:text-xl font-extrabold text-white tracking-tight truncate flex items-center gap-2">
          {getPageTitle(pathname)}
        </h1>
        <p className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 font-bold mt-0.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-live shadow-[0_0_10px_#10b981]" />
          <span className="text-cyan-400">{systemHealth?.summary.online ?? 0} sensor nodes online</span>
          <span className="text-slate-600">·</span>
          <span className="text-indigo-300">Prayagraj traffic network</span>
        </p>
      </div>

      {/* Global License Plate Search */}
      <div className="w-80 md:w-96 shrink-0 hidden md:block">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search a vehicle plate"
          showSearchIcon
          shortcutHint="↵ ENTER"
          className="h-10 text-xs font-mono"
        />
      </div>

      {/* Right Side Status & Operator Pill */}
      <div className="flex items-center gap-3.5 shrink-0">
        {/* Notifications Bell */}
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2.5 rounded-xl bg-[rgba(13,19,40,0.7)] text-slate-300 hover:text-cyan-300 hover:bg-[rgba(20,28,60,0.9)] border border-white/10 hover:border-cyan-400/50 transition-all duration-200 outline-none shadow-sm hover:scale-105"
          aria-label="Sentinel Alerts"
        >
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-mono font-extrabold flex items-center justify-center shadow-[0_0_14px_rgba(244,63,94,0.9)] animate-pulse">
            {alertCount}
          </span>
        </button>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="relative p-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-200 outline-none shadow-sm hover:scale-105"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
