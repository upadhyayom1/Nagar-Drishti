'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Radio, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/store/uiStore';

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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/vehicles/${searchQuery.trim().toUpperCase()}`);
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
          <span className="text-cyan-400">Autonomous Sensor Grid Synced</span>
          <span className="text-slate-600">·</span>
          <span className="text-indigo-300">Sector Chennai Central</span>
        </p>
      </div>

      {/* Global License Plate Search */}
      <div className="w-80 md:w-96 shrink-0 hidden md:block">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search license plate (e.g. TN38AB1234)"
          showSearchIcon
          shortcutHint="↵ ENTER"
          className="h-10 text-xs font-mono"
        />
      </div>

      {/* Right Side Status & Operator Pill */}
      <div className="flex items-center gap-3.5 shrink-0">
        {/* Operator Identity Chip with Iridescent Gradient Avatar */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/10 bg-[rgba(13,19,40,0.6)] backdrop-blur-xl shadow-sm hover:border-cyan-500/30 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 via-cyan-400 to-pink-500 flex items-center justify-center text-[10px] font-display font-extrabold text-white shadow-[0_0_14px_rgba(99,102,241,0.4)]">
            RK
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-[11px] font-display font-bold text-white leading-tight">Rahul Krishnan</span>
            <span className="text-[9px] font-mono text-cyan-300 font-semibold leading-tight">Sector Operator · On Shift</span>
          </div>
        </div>

        {/* Notifications Bell */}
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2.5 rounded-xl bg-[rgba(13,19,40,0.7)] text-slate-300 hover:text-cyan-300 hover:bg-[rgba(20,28,60,0.9)] border border-white/10 hover:border-cyan-400/50 transition-all duration-200 outline-none shadow-sm hover:scale-105"
          aria-label="Sentinel Alerts"
        >
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-mono font-extrabold flex items-center justify-center shadow-[0_0_14px_rgba(244,63,94,0.9)] animate-pulse">
            4
          </span>
        </button>
      </div>
    </div>
  );
}
