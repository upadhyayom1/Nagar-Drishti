'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Camera, Car, Clock, Filter, Shield, TrendingUp, AlertTriangle, WifiOff, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { Button }      from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { alertService }    from '@/services/alertService';
import { formatDateTime, cn } from '@/lib/utils';
import { useFilterStore }   from '@/store/filterStore';
import type { Alert } from '@/types';

function renderAlertIcon(type: string, className: string) {
  switch (type) {
    case 'BLACKLIST_VEHICLE': return <Shield size={22} className={className} />;
    case 'ROUTE_ANOMALY':     return <TrendingUp size={22} className={className} />;
    case 'TRAFFIC_SURGE':     return <AlertTriangle size={22} className={className} />;
    case 'CAMERA_OFFLINE':    return <WifiOff size={22} className={className} />;
    default:                  return <Bell size={22} className={className} />;
  }
}

function AlertCard({
  alert,
  index,
  onAcknowledge,
}: {
  alert: Alert;
  index: number;
  onAcknowledge: (id: string) => void;
}) {
  const isAcknowledged = alert.isRead;
  const isCritical = alert.severity === 'critical';
  const isHigh     = alert.severity === 'high';

  const iconColor = isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-cyan-400';
  const iconBg    = isCritical ? 'bg-rose-500/15' : isHigh ? 'bg-amber-500/15' : 'bg-cyan-500/15';
  const borderClass = isCritical
    ? 'border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.18)]'
    : isHigh
    ? 'border-amber-500/35 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
    : 'border-white/10';

  const svVariant = isCritical ? 'danger' : isHigh ? 'warning' : alert.severity === 'medium' ? 'info' : 'default';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <GlassCard 
        hover 
        glow={isCritical ? 'crimson' : isHigh ? 'amber' : 'cyan'} 
        className={cn('border', borderClass, isAcknowledged && 'opacity-70 bg-slate-900/40')}
      >
        <div className="flex items-start gap-4">
          <div className={cn('p-3.5 rounded-2xl shrink-0 border border-white/10 shadow-md', iconBg)}>
            {renderAlertIcon(alert.type, iconColor)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <h3 className="text-sm font-bold text-white font-display truncate">{alert.title}</h3>
                {isAcknowledged && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                    <CheckCircle2 size={11} /> Acknowledged
                  </span>
                )}
              </div>
              <Badge variant={svVariant} size="sm" dot pulse={isCritical && !isAcknowledged}>{alert.severity}</Badge>
            </div>

            <p className="text-xs text-slate-400 mb-3.5 leading-relaxed font-body">{alert.description}</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-data text-slate-400">
              {alert.vehiclePlate && (
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/25">
                  <Car size={13} /> {alert.vehiclePlate}
                </span>
              )}
              <span className="flex items-center gap-1.5 font-body">
                <Camera size={13} className="text-slate-500" /> {alert.cameraName}
              </span>
              <span className="flex items-center gap-1.5 font-data">
                <Clock size={13} className="text-slate-500" /> {formatDateTime(alert.timestamp)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2.5 mt-4 pt-3.5 border-t border-white/[0.06] flex-wrap">
              <div className="flex items-center gap-2">
                {alert.vehiclePlate && (
                  <Link href={`/vehicles/${alert.vehiclePlate}`}>
                    <Button variant="secondary" size="sm">
                      <Car size={13} /> View Vehicle Profile
                    </Button>
                  </Link>
                )}
                <Link href={`/cameras/${alert.cameraId}`}>
                  <Button variant="ghost" size="sm">
                    <Camera size={13} /> Live Camera Feed
                  </Button>
                </Link>
              </div>

              <button
                onClick={() => onAcknowledge(alert.id)}
                className={cn(
                  'text-xs font-display font-semibold px-3 py-1.5 rounded-xl border transition-all duration-200 flex items-center gap-1.5',
                  isAcknowledged
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-cyan-400/40 hover:text-cyan-300 hover:bg-cyan-500/10'
                )}
              >
                <CheckCircle2 size={13} />
                {isAcknowledged ? 'Acknowledged' : 'Acknowledge Threat'}
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function FilterPill({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs font-display font-semibold px-4 py-2 rounded-xl border transition-all duration-200 capitalize flex items-center gap-2',
        active
          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.18)] font-bold'
          : 'bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white',
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold', active ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/10 text-slate-400')}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const { data: alerts = [], refetch, isFetching } = useQuery({ queryKey: ['alerts'], queryFn: alertService.getAlerts, refetchInterval: 5_000 });
  const { alertSeverityFilter, setAlertSeverityFilter } = useFilterStore();
  const [activeCategory, setActiveCategory] = useState<'all' | 'blacklist' | 'congestion'>('all');

  const acknowledgeAlert = useMutation({
    mutationFn: alertService.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['recentAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['activeAlertCount'] });
      queryClient.invalidateQueries({ queryKey: ['trafficStats'] });
    },
  });

  const handleExportCSV = () => {
    if (alerts.length === 0) return;
    const headers = ['ID', 'Title', 'Severity', 'Type', 'Camera', 'VehiclePlate', 'Timestamp', 'Description'];
    const rows = alerts.map((a: Alert) => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      a.severity,
      a.type,
      `"${a.cameraName.replace(/"/g, '""')}"`,
      a.vehiclePlate || '',
      a.timestamp,
      `"${a.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UrbanPulse_Alerts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = alertSeverityFilter === 'all'
    ? alerts
    : alerts.filter((a: Alert) => a.severity === alertSeverityFilter);

  const blacklistAlerts = filtered.filter((a: Alert) => a.type === 'BLACKLIST_MATCH' || a.type === 'BLACKLIST_VEHICLE');
  const congestionAlerts = filtered.filter((a: Alert) => a.type === 'CONGESTION' || a.type === 'TRAFFIC_SURGE');

  const criticalCount = alerts.filter((a: Alert) => a.severity === 'critical').length;
  const highCount     = alerts.filter((a: Alert) => a.severity === 'high').length;

  return (
    <PageWrapper className="space-y-8 font-body">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Sentinel Threat & Congestion Alerts</h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
            <span className="text-rose-400 font-bold">{alerts.length}</span> active neural intelligence events detected across Prayagraj
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="danger" dot pulse>{criticalCount} Critical</Badge>
          <Badge variant="warning" dot>{highCount} High Priority</Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin text-cyan-400' : ''} />
            Sync
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs"
          >
            <Download size={13} />
            Export Log
          </Button>
        </div>
      </div>

      {/* Primary Category Switcher & Severity Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill label="All Alerts" count={alerts.length} active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
          <FilterPill label="Blacklisted Threats" count={blacklistAlerts.length} active={activeCategory === 'blacklist'} onClick={() => setActiveCategory('blacklist')} />
          <FilterPill label="Congestion Spikes" count={congestionAlerts.length} active={activeCategory === 'congestion'} onClick={() => setActiveCategory('congestion')} />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-slate-400 mr-1" />
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setAlertSeverityFilter(s)}
              className={cn(
                'text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all capitalize',
                alertSeverityFilter === s
                  ? 'bg-white/15 text-white border-white/30 font-bold'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-white',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 1: BLACKLISTED THREAT ALERTS ────────────────────────────────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'blacklist') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <Shield size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display">Blacklisted Vehicle Watchlist Triggers</h2>
                <p className="text-[11px] text-slate-400 font-mono">Real-time alerts for flagged or high-priority watchlist plates</p>
              </div>
            </div>
            <Badge variant="danger" size="md">{blacklistAlerts.length} Flagged</Badge>
          </div>

          <div className="space-y-3.5">
            <AnimatePresence>
              {blacklistAlerts.map((alert: Alert, index: number) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  index={index}
                  onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
                />
              ))}
            </AnimatePresence>
            {blacklistAlerts.length === 0 && (
              <GlassCard padding="md" className="text-center py-10 border-dashed border-white/10">
                <Shield size={32} className="mx-auto mb-2 text-rose-400/30" />
                <p className="text-xs font-mono text-slate-400">No active blacklisted vehicle threats detected at optical nodes.</p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* ── SECTION 2: TRAFFIC CONGESTION & VOLUME SURGES ───────────────────────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'congestion') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display">Traffic Congestion & Density Surges</h2>
                <p className="text-[11px] text-slate-400 font-mono">Automated alerts triggered when vehicle volume exceeds sector thresholds</p>
              </div>
            </div>
            <Badge variant="warning" size="md">{congestionAlerts.length} Surges</Badge>
          </div>

          <div className="space-y-3.5">
            <AnimatePresence>
              {congestionAlerts.map((alert: Alert, index: number) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  index={index}
                  onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
                />
              ))}
            </AnimatePresence>
            {congestionAlerts.length === 0 && (
              <GlassCard padding="md" className="text-center py-10 border-dashed border-white/10">
                <AlertTriangle size={32} className="mx-auto mb-2 text-amber-400/30" />
                <p className="text-xs font-mono text-slate-400">All city sectors and camera corridors are operating within normal traffic density parameters.</p>
              </GlassCard>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
