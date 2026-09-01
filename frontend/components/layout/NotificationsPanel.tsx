'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Bell, Shield, TrendingUp, AlertTriangle, WifiOff, Car, ExternalLink, CheckCheck } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { alertService } from '@/services/alertService';
import { Badge } from '@/components/ui/Badge';
import { formatTime, formatRelativeTime } from '@/lib/utils';
import type { Alert } from '@/types';

function getAlertIcon(type: string) {
  switch (type) {
    case 'BLACKLIST_VEHICLE': return Shield;
    case 'ROUTE_ANOMALY':     return TrendingUp;
    case 'TRAFFIC_SURGE':     return AlertTriangle;
    case 'CAMERA_OFFLINE':    return WifiOff;
    default:                  return Bell;
  }
}

function severityVariant(s: string): 'critical' | 'warn' | 'info' | 'default' {
  if (s === 'critical') return 'critical';
  if (s === 'high')     return 'warn';
  if (s === 'medium')   return 'info';
  return 'default';
}

export function NotificationsPanel() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notificationSummary, isLoading } = useQuery({
    queryKey: ['notificationSummary'],
    queryFn: () => alertService.getNotificationSummary(8),
    enabled: notificationsOpen,
    refetchInterval: notificationsOpen ? 5_000 : false,
  });
  const alerts = notificationSummary?.items ?? [];
  const queryClient = useQueryClient();

  const { mutate: markAllAsRead, isPending: isMarking } = useMutation({
    mutationFn: () => alertService.acknowledgeAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSummary'] });
      queryClient.invalidateQueries({ queryKey: ['systemHealth'] });
      queryClient.invalidateQueries({ queryKey: ['trafficStats'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    if (!notificationsOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notificationsOpen, setNotificationsOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotificationsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setNotificationsOpen]);

  if (!notificationsOpen) return null;

  const criticalCount = alerts.filter((a: Alert) => a.severity === 'critical').length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setNotificationsOpen(false)}
      />

      {/* Slide-in Panel */}
      <div
        ref={panelRef}
        className="fixed top-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] flex flex-col glass-panel-elevated shadow-[0_24px_64px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-right-5 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--glass-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--status-critical)]/15 border border-[var(--status-critical)]/30">
              <Bell size={15} className="text-[var(--status-critical)]" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-white">Sentinel Alerts</p>
              <p className="text-[10px] font-mono text-[var(--text-secondary)]">
                {criticalCount > 0 ? (
                  <span className="text-[var(--status-critical)] font-bold">{criticalCount} Critical · </span>
                ) : null}
                {isLoading ? 'Synchronizing…' : `${notificationSummary?.total ?? 0} Active`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => markAllAsRead()}
              disabled={isMarking || alerts.length === 0}
              aria-label="Mark all as read"
              title="Mark all as read"
              className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck size={16} />
            </button>
            <button
              onClick={() => setNotificationsOpen(false)}
              aria-label="Close Notifications"
              className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {!isLoading && alerts.length === 0 && (
            <p className="px-3 py-8 text-center text-xs font-mono text-[var(--text-secondary)]">No active alerts.</p>
          )}
          {alerts.map((alert: Alert) => {
            const Icon = getAlertIcon(alert.type);
            const isCritical = alert.severity === 'critical';
            const isHigh = alert.severity === 'high';

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCritical
                    ? 'bg-[var(--status-critical)]/10 border-[var(--status-critical)]/30 shadow-[0_0_16px_rgba(255,77,79,0.12)]'
                    : isHigh
                    ? 'bg-[var(--status-warn)]/10 border-[var(--status-warn)]/25'
                    : 'bg-white/[0.03] border-[var(--glass-border)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isCritical ? 'bg-[var(--status-critical)]/20 text-[var(--status-critical)]' :
                    isHigh ? 'bg-[var(--status-warn)]/20 text-[var(--status-warn)]' :
                    'bg-[var(--signal-cyan)]/20 text-[var(--signal-cyan)]'
                  }`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-xs font-display font-bold text-white truncate">{alert.title}</p>
                      <Badge variant={severityVariant(alert.severity)} size="sm">{alert.severity}</Badge>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2 font-body">{alert.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      {alert.vehiclePlate && (
                        <Link
                          href={`/vehicles/${alert.vehiclePlate}`}
                          onClick={() => setNotificationsOpen(false)}
                          className="flex items-center gap-1 text-[10px] font-mono font-bold text-[var(--brand-teal)] bg-[var(--brand-teal)]/10 border border-[var(--brand-teal)]/30 px-2 py-0.5 rounded-md hover:bg-[var(--brand-teal)]/20 transition-colors"
                        >
                          <Car size={11} /> {alert.vehiclePlate}
                        </Link>
                      )}
                      <span 
                        title={formatTime(alert.timestamp)} 
                        className="text-[10px] font-mono text-[var(--text-tertiary)] ml-auto cursor-help"
                      >
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--glass-border)] shrink-0">
          <Link
            href="/alerts"
            onClick={() => setNotificationsOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[var(--brand-teal)]/10 border border-[var(--brand-teal)]/30 text-xs font-display font-bold text-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/20 transition-all shadow-[0_0_12px_rgba(31,217,168,0.15)]"
          >
            <ExternalLink size={13} />
            View All Sentinel Alerts
          </Link>
        </div>
      </div>
    </>
  );
}
