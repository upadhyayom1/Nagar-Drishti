'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Camera,
  Car,
  BarChart3,
  Network,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const navGroups = [
  {
    label: 'Intelligence Grid',
    items: [
      { name: 'Command Center',       href: '/dashboard', icon: LayoutDashboard, gradient: 'from-cyan-500/25 via-blue-500/15 to-transparent', activeColor: 'text-cyan-300' },
      { name: 'Optical Feed Grid',    href: '/cameras',   icon: Camera, gradient: 'from-emerald-500/25 via-teal-500/15 to-transparent', activeColor: 'text-emerald-300' },
      { name: 'Vehicle Intelligence', href: '/vehicles',  icon: Car, gradient: 'from-violet-500/25 via-indigo-500/15 to-transparent', activeColor: 'text-violet-300' },
      { name: 'Traffic Analytics',    href: '/analytics', icon: BarChart3, gradient: 'from-sky-500/25 via-cyan-500/15 to-transparent', activeColor: 'text-sky-300' },
      { name: 'Movement Network',     href: '/network',   icon: Network, gradient: 'from-pink-500/25 via-purple-500/15 to-transparent', activeColor: 'text-pink-300' },
    ],
  },
  {
    label: 'Operations & Sentinel',
    items: [
      { name: 'Sentinel Alerts',   href: '/alerts', icon: Bell, gradient: 'from-rose-500/25 via-orange-500/15 to-transparent', activeColor: 'text-rose-300' },
      { name: 'System Diagnostics', href: '/system', icon: Settings, gradient: 'from-amber-500/25 via-yellow-500/15 to-transparent', activeColor: 'text-amber-300' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar    = useUIStore((s) => s.toggleSidebar);

  return (
    <div className="flex flex-col h-full py-4 select-none font-body overflow-hidden">

      {/* ── Brand Mark Header (Always Pinned At Top with Frosted Glass) ─────────── */}
      <div className={cn('flex items-center gap-3.5 mb-5 shrink-0', sidebarCollapsed ? 'px-3 justify-center' : 'px-4')}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-pink-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] shrink-0 group hover:scale-105 transition-transform p-0.5">
          <div className="w-full h-full rounded-[14px] bg-[#050711]/50 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Zap size={19} className="text-white font-extrabold fill-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight text-white leading-none font-display">
              Urban<span className="text-gradient-spectral">Pulse</span>
            </h1>
            <span className="text-[9px] font-mono font-bold text-slate-400 tracking-[0.2em] uppercase mt-1 block">
              AI Command OS
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation Links (Frosted Glass Items with Left Accent Bar) ─────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-5 px-2.5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    scroll={false}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl transition-all duration-200 outline-none group relative overflow-hidden',
                      sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5',
                      isActive
                        ? cn(
                            'bg-gradient-to-r text-white border border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.25),_inset_0_1px_0_rgba(255,255,255,0.18)] font-semibold backdrop-blur-xl',
                            item.gradient
                          )
                        : 'text-slate-400 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-transparent hover:text-white font-medium backdrop-blur-sm',
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-gradient-to-b from-cyan-400 to-indigo-500 shadow-[0_0_12px_#06b6d4]" />
                    )}

                    <item.icon
                      size={18}
                      className={cn(
                         'shrink-0 transition-all duration-200',
                         isActive
                           ? cn(item.activeColor, 'drop-shadow-[0_0_10px_currentColor]')
                           : 'text-slate-400 group-hover:text-white',
                      )}
                    />

                    {!sidebarCollapsed && (
                      <span className={cn(
                        'text-[13px] tracking-wide truncate transition-all duration-200 font-display',
                        isActive ? 'text-white font-bold' : 'text-slate-400',
                      )}>
                        {item.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Collapse Toggle & Operations Status (Frosted Glass Chip) ─────── */}
      <div className={cn('mt-3 shrink-0', sidebarCollapsed ? 'px-2' : 'px-3')}>
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center gap-2 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10 border border-transparent transition-all duration-150 mb-2 backdrop-blur-md',
            sidebarCollapsed ? 'justify-center' : 'px-3',
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs font-display font-medium">Collapse Sidebar</span></>}
        </button>

        {!sidebarCollapsed && (
          <div className="p-2.5 rounded-2xl bg-[rgba(10,15,35,0.7)] backdrop-blur-2xl border border-cyan-500/25 text-center shadow-[0_4px_20px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.1)]">
            <p className="text-[9px] font-mono text-cyan-300 uppercase tracking-widest leading-tight font-bold drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]">
              Autonomous Grid Synced
            </p>
          </div>
        )}
      </div>
    </div>
  );
}