'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Camera,
  Car,
  BarChart3,
  Network,
  Bell,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Inbox,
  ScanLine,
  TrendingUp,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  color: string;
  bgActive: string;
  borderActive: string;
  glowShadow: string;
  leftPillColor: string;
  iconColor: string;
  hoverClass: string;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Intelligence Grid',
    items: [
      {
        name: 'Command Center',
        href: '/dashboard',
        icon: LayoutDashboard,
        color: '#00f0ff',
        bgActive: 'bg-cyan-500/15',
        borderActive: 'border-cyan-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(0,240,255,0.35)]',
        leftPillColor: 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]',
        iconColor: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]',
        hoverClass: 'hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:shadow-[0_0_16px_rgba(0,240,255,0.2)] hover:text-cyan-400',
      },
      {
        name: 'Live Cameras',
        href: '/cameras',
        icon: Camera,
        color: '#00E6B0',
        bgActive: 'bg-emerald-500/15',
        borderActive: 'border-emerald-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(0,230,176,0.35)]',
        leftPillColor: 'bg-[#00E6B0] shadow-[0_0_10px_#00E6B0]',
        iconColor: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(0,230,176,0.7)]',
        hoverClass: 'hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:shadow-[0_0_16px_rgba(0,230,176,0.2)] hover:text-emerald-400',
      },
      {
        name: 'Vehicle Intelligence',
        href: '/vehicles',
        icon: Car,
        color: '#38bdf8',
        bgActive: 'bg-sky-500/15',
        borderActive: 'border-sky-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(56,189,248,0.35)]',
        leftPillColor: 'bg-[#38bdf8] shadow-[0_0_10px_#38bdf8]',
        iconColor: 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]',
        hoverClass: 'hover:border-sky-400/50 hover:bg-sky-500/10 hover:shadow-[0_0_16px_rgba(56,189,248,0.2)] hover:text-sky-400',
      },
      {
        name: 'AI Plate Detection',
        href: '/detect',
        icon: ScanLine,
        color: '#22d3ee',
        bgActive: 'bg-cyan-500/15',
        borderActive: 'border-cyan-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(34,211,238,0.35)]',
        leftPillColor: 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]',
        iconColor: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]',
        hoverClass: 'hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:shadow-[0_0_16px_rgba(34,211,238,0.2)] hover:text-cyan-400',
      },
      {
        name: 'Traffic Analytics',
        href: '/analytics',
        icon: BarChart3,
        color: '#8b5cf6',
        bgActive: 'bg-violet-500/15',
        borderActive: 'border-violet-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(139,92,246,0.35)]',
        leftPillColor: 'bg-[#8b5cf6] shadow-[0_0_10px_#8b5cf6]',
        iconColor: 'text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.7)]',
        hoverClass: 'hover:border-violet-400/50 hover:bg-violet-500/10 hover:shadow-[0_0_16px_rgba(139,92,246,0.2)] hover:text-violet-400',
      },
      {
        name: 'Traffic Forecast',
        href: '/forecast',
        icon: TrendingUp,
        color: '#facc15',
        bgActive: 'bg-yellow-500/15',
        borderActive: 'border-yellow-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(250,204,21,0.35)]',
        leftPillColor: 'bg-[#facc15] shadow-[0_0_10px_#facc15]',
        iconColor:
          'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]',
        hoverClass:
          'hover:border-yellow-400/50 hover:bg-yellow-500/10 hover:shadow-[0_0_16px_rgba(250,204,21,0.2)] hover:text-yellow-400',
      },
      {
        name: 'Movement Network',
        href: '/network',
        icon: Network,
        color: '#ec4899',
        bgActive: 'bg-pink-500/15',
        borderActive: 'border-pink-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(236,72,153,0.35)]',
        leftPillColor: 'bg-[#ec4899] shadow-[0_0_10px_#ec4899]',
        iconColor: 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.7)]',
        hoverClass: 'hover:border-pink-400/50 hover:bg-pink-500/10 hover:shadow-[0_0_16px_rgba(236,72,153,0.2)] hover:text-pink-400',
      },
    ],
  },

  {
    label: 'Operations & Sentinel',
    items: [
      {
        name: 'Field Submissions',
        href: '/submissions',
        icon: Inbox,
        color: '#f59e0b',
        bgActive: 'bg-amber-500/15',
        borderActive: 'border-amber-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(245,158,11,0.35)]',
        leftPillColor: 'bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]',
        iconColor: 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]',
        hoverClass: 'hover:border-amber-400/50 hover:bg-amber-500/10 hover:shadow-[0_0_16px_rgba(245,158,11,0.2)] hover:text-amber-400',
      },
      {
        name: 'Sentinel Alerts',
        href: '/alerts',
        icon: Bell,
        color: '#f43f5e',
        bgActive: 'bg-rose-500/15',
        borderActive: 'border-rose-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(244,63,94,0.35)]',
        leftPillColor: 'bg-[#f43f5e] shadow-[0_0_10px_#f43f5e]',
        iconColor: 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]',
        hoverClass: 'hover:border-rose-400/50 hover:bg-rose-500/10 hover:shadow-[0_0_16px_rgba(244,63,94,0.2)] hover:text-rose-400',
      },
      {
        name: 'Threat Watchlist',
        href: '/blacklist',
        icon: Shield,
        color: '#fb7185',
        bgActive: 'bg-rose-500/15',
        borderActive: 'border-rose-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(251,113,133,0.35)]',
        leftPillColor: 'bg-[#fb7185] shadow-[0_0_10px_#fb7185]',
        iconColor: 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.7)]',
        hoverClass: 'hover:border-rose-400/50 hover:bg-rose-500/10 hover:shadow-[0_0_16px_rgba(251,113,133,0.2)] hover:text-rose-400',
      },
      {
        name: 'System Diagnostics',
        href: '/system',
        icon: Settings,
        color: '#14b8a6',
        bgActive: 'bg-teal-500/15',
        borderActive: 'border-teal-400/60',
        glowShadow: 'shadow-[0_0_22px_rgba(20,184,166,0.35)]',
        leftPillColor: 'bg-[#14b8a6] shadow-[0_0_10px_#14b8a6]',
        iconColor: 'text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.7)]',
        hoverClass: 'hover:border-teal-400/50 hover:bg-teal-500/10 hover:shadow-[0_0_16px_rgba(20,184,166,0.2)] hover:text-teal-400',
      },
    ],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <div className="flex flex-col h-full py-3.5 select-none font-body overflow-hidden">

      {/* Brand Mark Header */}
      <div
        className={cn(
          'flex items-center gap-3 mb-4 shrink-0',
          sidebarCollapsed ? 'px-2 justify-center' : 'px-3.5'
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_18px_rgba(0,240,255,0.35)] shrink-0">
          <ShieldCheck size={19} className="text-cyan-400" />
        </div>

        {!sidebarCollapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)] leading-none font-display">
              Nagar<span className="text-gradient-spectral">Drishti</span>
            </h1>
            <span className="text-[9px] font-mono text-[var(--text-secondary)] tracking-[0.16em] uppercase mt-1 block">
              AI Command OS
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 px-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!sidebarCollapsed && (
              <p className="text-[9px] font-display font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-2.5 mb-1.5">
                {group.label}
              </p>
            )}

            <div className="space-y-1 relative">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    scroll={false}
                    onClick={onNavigate}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl transition-all duration-200 outline-none group relative overflow-hidden border',
                      sidebarCollapsed
                        ? 'justify-center px-2 py-2.5'
                        : 'px-3 py-2',
                      isActive
                        ? cn(
                            item.bgActive,
                            item.borderActive,
                            item.glowShadow,
                            'font-semibold text-[var(--text-primary)]'
                          )
                        : cn(
                            'text-[var(--text-secondary)] border-transparent font-medium hover:scale-[1.01]',
                            item.hoverClass
                          )
                    )}
                  >
                    {/* Shared-layout sliding active pill — slides between items on route change */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          className={cn(
                            'absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-full',
                            item.leftPillColor
                          )}
                          initial={{ opacity: 0, scaleY: 0.5 }}
                          animate={{ opacity: 1, scaleY: 1 }}
                          exit={{ opacity: 0, scaleY: 0.5 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>

                    <item.icon
                      size={16}
                      className={cn(
                        'shrink-0 transition-colors duration-200',
                        isActive
                          ? item.iconColor
                          : 'text-[var(--text-secondary)] group-hover:text-current'
                      )}
                    />

                    {!sidebarCollapsed && (
                      <span
                        className={cn(
                          'text-xs tracking-wide truncate transition-colors duration-200 font-display',
                          isActive
                            ? 'text-[var(--text-primary)] font-semibold'
                            : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                        )}
                      >
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

      {/* Collapse Toggle & Authorized Operations Notice */}
      <div
        className={cn(
          'mt-2 shrink-0 hidden md:block',
          sidebarCollapsed ? 'px-1.5' : 'px-2.5'
        )}
      >
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center gap-2 py-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] border border-transparent transition-all duration-150 mb-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400',
            sidebarCollapsed ? 'justify-center' : 'px-2.5'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={14} />
          ) : (
            <>
              <ChevronLeft size={14} />
              <span className="text-[11px] font-display">Collapse Sidebar</span>
            </>
          )}
        </button>

        {!sidebarCollapsed && (
          <div className="p-2 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] text-center">
            <p className="text-[8px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Authorized Operations
            </p>
            <p className="text-[8px] text-[var(--text-tertiary)] mt-0.5 leading-tight font-body">
              NagarDrishti Command Grid
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
