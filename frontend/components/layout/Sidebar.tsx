'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Camera, 
  Car, 
  BarChart3, 
  Network, 
  Bell, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', group: 1 },
  { label: 'Live Cameras', icon: Camera, href: '/cameras', group: 1 },
  { label: 'Vehicle Intelligence', icon: Car, href: '/vehicles', group: 1 },
  { label: 'Traffic Analytics', icon: BarChart3, href: '/analytics', group: 1 },
  { label: 'Movement Network', icon: Network, href: '/network', group: 1 },
  { label: 'Alerts', icon: Bell, href: '/alerts', group: 2 },
  { label: 'System', icon: Settings, href: '/system', group: 2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <aside 
      className="glass-panel flex flex-col fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out z-50 border-r border-[var(--border-glass)] bg-[var(--surface-glass)]"
      style={{ width: sidebarCollapsed ? '72px' : 'var(--sidebar-width, 260px)' }}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 flex-shrink-0">
        <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-full'}`}>
          <h1 className="text-xl font-bold font-space-grotesk accent-gradient-text">
            UrbanPulse
          </h1>
          <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-inter">
            Command Center
          </span>
        </div>
        {sidebarCollapsed && (
          <div className="w-full flex justify-center text-[var(--accent-cyan)] font-bold font-space-grotesk text-xl">
            UP
          </div>
        )}
      </div>

      <div className="h-[2px] w-full bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] opacity-50" />

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2 custom-scrollbar">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const showSeparator = index > 0 && navItems[index - 1].group !== item.group;

          return (
            <React.Fragment key={item.href}>
              {showSeparator && (
                <div className="h-px bg-[var(--border-glass)] my-2 mx-2" />
              )}
              <Link 
                href={item.href}
                className={`
                  group flex items-center h-10 px-3 rounded-md transition-all duration-150 ease-out font-inter text-[14px]
                  ${isActive 
                    ? 'bg-white/[0.06] text-[var(--text-primary)] border-l-2 border-l-[var(--accent-cyan)] pl-[10px]' 
                    : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)] border-l-2 border-transparent pl-[10px]'}
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon 
                  size={18} 
                  className={`flex-shrink-0 ${isActive ? 'text-[var(--accent-cyan)]' : 'text-inherit'}`} 
                />
                {!sidebarCollapsed && (
                  <span className="ml-2 whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                )}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[var(--border-glass)] flex flex-col gap-4 flex-shrink-0">
        {!sidebarCollapsed && (
          <p className="text-[10px] text-[var(--text-secondary)] opacity-60 leading-tight font-inter text-center">
            Designed for authorized traffic management & public-safety operations
          </p>
        )}
        
        <button 
          onClick={toggleSidebar}
          className="flex items-center justify-center h-8 w-full rounded hover:bg-white/[0.04] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
