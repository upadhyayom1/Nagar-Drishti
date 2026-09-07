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
import { Logo } from '@/components/ui/Logo';
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
        color: '#06b6d4',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-cyan-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        leftPillColor: 'bg-cyan-400 shadow-[0_0_12px_#06b6d4]',
        iconColor: 'text-cyan-400 dark:text-cyan-300',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-cyan-400',
      },
      {
        name: 'Live Cameras',
        href: '/cameras',
        icon: Camera,
        color: '#00f59b',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-emerald-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(0,245,155,0.15)]',
        leftPillColor: 'bg-[#00f59b] shadow-[0_0_12px_#00f59b]',
        iconColor: 'text-emerald-500 dark:text-[#00f59b]',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-[#00f59b]',
      },
      {
        name: 'Vehicle Intelligence',
        href: '/vehicles',
        icon: Car,
        color: '#3b82f6',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-blue-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        leftPillColor: 'bg-blue-500 shadow-[0_0_12px_#3b82f6]',
        iconColor: 'text-blue-500 dark:text-blue-400',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-blue-400',
      },
      {
        name: 'AI Plate Detection',
        href: '/detect',
        icon: ScanLine,
        color: '#a855f7',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-purple-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]',
        leftPillColor: 'bg-purple-500 shadow-[0_0_12px_#a855f7]',
        iconColor: 'text-purple-500 dark:text-purple-400',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-purple-400',
      },
      {
        name: 'Traffic Analytics',
        href: '/analytics',
        icon: BarChart3,
        color: '#f59e0b',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-amber-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
        leftPillColor: 'bg-amber-400 shadow-[0_0_12px_#f59e0b]',
        iconColor: 'text-amber-500 dark:text-amber-400',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-amber-400',
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
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-pink-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]',
        leftPillColor: 'bg-pink-500 shadow-[0_0_12px_#ec4899]',
        iconColor: 'text-pink-500 dark:text-pink-400',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-pink-400',
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
        color: '#14b8a6',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-teal-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(20,184,166,0.15)]',
        leftPillColor: 'bg-teal-400 shadow-[0_0_12px_#14b8a6]',
        iconColor: 'text-teal-500 dark:text-teal-400',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-teal-400',
      },
      {
        name: 'Sentinel Alerts',
        href: '/alerts',
        icon: Bell,
        color: '#ff3355',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-red-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(255,51,85,0.15)]',
        leftPillColor: 'bg-[#ff3355] shadow-[0_0_12px_#ff3355]',
        iconColor: 'text-rose-500 dark:text-[#ff3355]',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-rose-400',
      },
      {
        name: 'Threat Watchlist',
        href: '/blacklist',
        icon: Shield,
        color: '#f97316',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-orange-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]',
        leftPillColor: 'bg-orange-500 shadow-[0_0_12px_#f97316]',
        iconColor: 'text-orange-500 dark:text-orange-400',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-orange-400',
      },
      {
        name: 'System Diagnostics',
        href: '/system',
        icon: Settings,
        color: '#84cc16',
        bgActive: 'bg-[var(--bg-elevated-2)]',
        borderActive: 'border-lime-500/30',
        glowShadow: 'shadow-[0_0_15px_rgba(132,204,22,0.15)]',
        leftPillColor: 'bg-lime-400 shadow-[0_0_12px_#84cc16]',
        iconColor: 'text-lime-600 dark:text-lime-400',
        hoverClass: 'hover:bg-[var(--bg-elevated)] hover:text-lime-400',
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

      {/* Brand Mark Header with subtle teal separator */}
      <div className={cn('mb-4 shrink-0', sidebarCollapsed ? 'px-2 flex justify-center' : 'px-3.5')}>
        <Logo size="sm" showText={!sidebarCollapsed} />
        {!sidebarCollapsed && (
          <div className="mt-3 h-px bg-gradient-to-r from-teal-500/40 via-teal-400/20 to-transparent rounded-full" />
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 px-2">
        {navGroups.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.14em] px-3 mb-1.5 text-[var(--text-tertiary)] flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-neutral-600/60 shrink-0" />
                  {group.label}
                </p>
              )}

            <div className="space-y-0.5 relative">
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
                      'flex items-center gap-2.5 rounded-2xl transition-all duration-200 outline-none group relative overflow-hidden',
                      sidebarCollapsed
                        ? 'justify-center px-2 py-2'
                        : 'px-3 py-2',
                      isActive
                        ? cn(
                            item.bgActive,
                            'font-semibold text-[var(--text-primary)] shadow-sm'
                          )
                        : cn(
                            'text-[var(--text-secondary)] font-medium hover:scale-[1.01]',
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
