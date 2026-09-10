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
  Shield,
  Settings,
  Inbox,
  ScanLine,
  TrendingUp,
  User,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Dock, type DockItemData } from '@/components/ui/Dock';

interface SidebarProps {
  onNavigate?: () => void;
  isMobile?: boolean;
}

const navItems = [
  {
    name: 'Command Center',
    href: '/dashboard',
    icon: LayoutDashboard,
    color: '#06b6d4',
  },
  {
    name: 'Live Cameras',
    href: '/cameras',
    icon: Camera,
    color: '#00f59b',
  },
  {
    name: 'Vehicle Intelligence',
    href: '/vehicles',
    icon: Car,
    color: '#3b82f6',
  },
  {
    name: 'AI Plate Detection',
    href: '/detect',
    icon: ScanLine,
    color: '#a855f7',
  },
  {
    name: 'Traffic Analytics',
    href: '/analytics',
    icon: BarChart3,
    color: '#f59e0b',
  },
  {
    name: 'Traffic Forecast',
    href: '/forecast',
    icon: TrendingUp,
    color: '#facc15',
  },
  {
    name: 'Movement Network',
    href: '/network',
    icon: Network,
    color: '#ec4899',
  },
  {
    name: 'Field Submissions',
    href: '/submissions',
    icon: Inbox,
    color: '#14b8a6',
  },
  {
    name: 'Sentinel Alerts',
    href: '/alerts',
    icon: Bell,
    color: '#ff3355',
  },
  {
    name: 'Threat Watchlist',
    href: '/blacklist',
    icon: Shield,
    color: '#f97316',
  },
  {
    name: 'System Diagnostics',
    href: '/system',
    icon: Settings,
    color: '#84cc16',
  },
];

export function Sidebar({ onNavigate, isMobile = false }: SidebarProps) {
  const pathname = usePathname();

  // Mobile drawer view: clean touch-friendly list with labels
  if (isMobile) {
    return (
      <div className="flex flex-col h-full py-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                isActive
                  ? 'bg-cyan-500/15 text-white font-semibold border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white'
              )}
            >
              <Icon
                size={18}
                style={{ color: isActive ? item.color : undefined }}
                className={isActive ? '' : 'text-[var(--text-secondary)]'}
              />
              <span className="text-xs font-display">{item.name}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  // Desktop Cyber Dock view: sleek vertical magnification dock
  const dockItems: DockItemData[] = navItems.map((item) => {
    const isActive =
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href));
    const Icon = item.icon;

    return {
      icon: (
        <Icon
          size={18}
          style={{ color: isActive ? item.color : undefined }}
          className={cn(
            'transition-colors duration-200',
            isActive ? 'drop-shadow-[0_0_8px_currentColor]' : 'text-[var(--text-secondary)]'
          )}
        />
      ),
      label: (
        <span className="flex items-center gap-2 font-display text-xs">
          <span>{item.name}</span>
          {item.name === 'Sentinel Alerts' && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          )}
        </span>
      ),
      href: item.href,
      onClick: onNavigate,
      active: isActive,
      color: item.color,
    };
  });

  return (
    <div className="flex flex-col items-center justify-between h-full py-3 select-none font-body w-full">
      {/* Brand Mark Icon Header */}
      <div className="shrink-0 flex flex-col items-center gap-2 mb-1">
        <Link href="/dashboard" className="p-2 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors" title="NagarDrishti Dashboard">
          <Logo size="sm" showText={false} clickable={false} />
        </Link>
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>

      {/* Interactive Vertical Dock */}
      <div className="flex-1 flex items-center justify-center w-full py-1 overflow-visible">
        <Dock
          items={dockItems}
          direction="vertical"
          baseItemSize={40}
          magnification={56}
          distance={125}
          spring={{ mass: 0.1, stiffness: 220, damping: 16 }}
        />
      </div>

      {/* Bottom Profile / Quick Access Icon */}
      <div className="shrink-0 flex flex-col items-center gap-2 mt-1 pt-2 border-t border-[var(--glass-border)]">
        <Link
          href="/profile"
          className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 border cursor-pointer',
            pathname === '/profile'
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-500 dark:text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'bg-black/[0.03] dark:bg-white/[0.03] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-[var(--text-primary)]'
          )}
          title="Operator Profile"
        >
          <User size={16} />
        </Link>
      </div>
    </div>
  );
}
