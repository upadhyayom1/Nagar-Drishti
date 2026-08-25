'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { X, Bell, Shield, TrendingUp, AlertTriangle, WifiOff, Car, ExternalLink } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { alertService } from '@/services/alertService';
import { Badge } from '@/components/ui/Badge';
import { formatTime } from '@/lib/utils';
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

function severityVariant(s: string): 'danger' | 'warning' | 'info' | 'default' {
  if (s === 'critical') return 'danger';
  if (s === 'high')     return 'warning';
  if (s === 'medium')   return 'info';
  return 'default';
}

export function NotificationsPanel() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: alerts = [] } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: () => alertService.getRecentAlerts(8),
    enabled: notificationsOpen,
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
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={() => setNotificationsOpen(false)}
      />

      {/* Slide-in Panel */}
      <div
        ref={panelRef}
        className="fixed top-4 right-4 z-50 w-[380px] max-h-[calc(100dvh-2rem)] flex flex-col animate-slide-in-right"
        style={{
          background: 'rgba(10, 14, 30, 0.97)',
          backdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderTop: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '1.35rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30">
              <Bell size={15} className="text-rose-400" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-white">Sentinel Alerts</p>
              <p className="text-[10px] font-mono text-slate-400">
                {criticalCount > 0 ? (
                  <span className="text-rose-400 font-bold">{criticalCount} Critical · </span>
                ) : null}
                {alerts.length} Active
              </p>
            </div>
          </div>
          <button
            onClick={() => setNotificationsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Alerts List */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {alerts.map((alert: Alert) => {
            const Icon = getAlertIcon(alert.type);
            const isCritical = alert.severity === 'critical';
            const isHigh = alert.severity === 'high';

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCritical
                    ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.12)]'
                    : isHigh
                    ? 'bg-amber-500/10 border-amber-500/25'
                    : 'bg-white/[0.04] border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isCritical ? 'bg-rose-500/20 text-rose-400' :
                    isHigh ? 'bg-amber-500/20 text-amber-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-xs font-display font-bold text-white truncate">{alert.title}</p>
                      <Badge variant={severityVariant(alert.severity)} size="sm">{alert.severity}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 font-body">{alert.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      {alert.vehiclePlate && (
                        <Link
                          href={`/vehicles/${alert.vehiclePlate}`}
                          onClick={() => setNotificationsOpen(false)}
                          className="flex items-center gap-1 text-[10px] font-data font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-lg hover:bg-cyan-500/20 transition-colors"
                        >
                          <Car size={11} /> {alert.vehiclePlate}
                        </Link>
                      )}
                      <span className="text-[10px] font-data text-slate-500 ml-auto">{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 shrink-0">
          <Link
            href="/alerts"
            onClick={() => setNotificationsOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-pink-500/20 border border-white/15 text-xs font-display font-bold text-white hover:from-indigo-500/30 hover:via-cyan-500/30 hover:to-pink-500/30 transition-all"
          >
            <ExternalLink size={13} />
            View All Sentinel Alerts
          </Link>
        </div>
      </div>
    </>
  );
}
