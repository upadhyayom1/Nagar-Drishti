'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/store/uiStore';

export function TopBar() {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, notificationsOpen, setNotificationsOpen } = useUIStore();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  const getPageTitle = () => {
    if (pathname?.startsWith('/cameras/')) return 'Camera Detail';
    if (pathname?.startsWith('/vehicles/') && pathname?.endsWith('/trajectory')) return 'Trajectory View';
    if (pathname?.startsWith('/vehicles/') && pathname !== '/vehicles') return 'Vehicle Profile';
    switch (pathname) {
      case '/dashboard': return 'Command Center';
      case '/cameras': return 'Live Cameras';
      case '/vehicles': return 'Vehicle Intelligence';
      case '/analytics': return 'Traffic Analytics';
      case '/network': return 'Movement Network';
      case '/alerts': return 'Alerts Center';
      case '/system': return 'System Status';
      default: return 'UrbanPulse';
    }
  };

  return (
    <header
      className="fixed top-0 right-0 h-[var(--topbar-height,64px)] z-40 glass-panel border-b border-[var(--border-glass)] flex items-center justify-between px-6 transition-all duration-300 ease-in-out"
      style={{ left: sidebarCollapsed ? '72px' : 'var(--sidebar-width, 260px)' }}
    >
      <div className="flex-1">
        <h1 className="font-display text-lg font-semibold text-[var(--text-primary)]">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex-1 max-w-md flex justify-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicle plate (e.g., TN38AB1234)"
            className="w-full pl-9 bg-[var(--bg-elevated)] border-[var(--border-glass)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] font-data focus:border-[var(--accent-cyan)] focus:ring-1 focus:ring-[var(--accent-cyan)] transition-colors h-9"
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-4">
        <Badge variant="success" dot pulse className="bg-[var(--surface-glass)] border-[var(--border-glass)]">
          All Systems Online
        </Badge>

        <div className="w-[1px] h-6 bg-[var(--border-glass)]" />

        <button 
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-glass)] rounded-md"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-[var(--status-critical)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-data flex items-center justify-center min-w-[18px] h-[18px]">
            4
          </span>
        </button>
      </div>
    </header>
  );
}
