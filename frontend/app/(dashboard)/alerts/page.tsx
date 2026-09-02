'use client';

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
    case 'BLACKLIST_VEHICLE': return <Shield size={20} className={className} />;
    case 'ROUTE_ANOMALY':     return <TrendingUp size={20} className={className} />;
    case 'TRAFFIC_SURGE':     return <AlertTriangle size={20} className={className} />;
    case 'CAMERA_OFFLINE':    return <WifiOff size={20} className={className} />;
    default:                  return <Bell size={20} className={className} />;
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

  const iconColor = isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-teal-400';
  const iconBg    = isCritical ? 'bg-rose-500/10' : isHigh ? 'bg-amber-500/10' : 'bg-teal-500/10';
  const borderClass = isCritical
    ? 'border-rose-500/40 animate-urgency-critical'
    : isHigh
    ? 'border-amber-500/30 animate-urgency-high'
    : 'border-[var(--glass-border)]';

  const svVariant = isCritical ? 'critical' : isHigh ? 'warn' : alert.severity === 'medium' ? 'info' : 'default';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <GlassCard 
        hover 
        glow={isCritical ? 'rose' : isHigh ? 'amber' : 'cyan'} 
        className={cn('border p-5', borderClass, isAcknowledged && 'opacity-65')}
      >
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-xl shrink-0 border border-[var(--glass-border)]', iconBg)}>
            {renderAlertIcon(alert.type, iconColor)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-display truncate">{alert.title}</h3>
                {isAcknowledged && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={11} /> Acknowledged
                  </span>
                )}
              </div>
              <Badge variant={svVariant} size="sm" dot pulse={isCritical && !isAcknowledged}>{alert.severity}</Badge>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed font-body">{alert.description}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono text-[var(--text-secondary)]">
              {alert.vehiclePlate && (
                <span className="flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25">
                  <Car size={13} /> {alert.vehiclePlate}
                </span>
              )}
              <span className="flex items-center gap-1.5 font-body">
                <Camera size={13} className="text-[var(--text-tertiary)]" /> {alert.cameraName}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[var(--text-tertiary)]">
                <Clock size={13} /> {formatDateTime(alert.timestamp)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-[var(--glass-border)] flex-wrap">
              <div className="flex items-center gap-2">
                {alert.vehiclePlate && (
                  <Link href={`/vehicles/${alert.vehiclePlate}`}>
                    <Button variant="secondary" size="sm">
                      <Car size={13} /> View Vehicle
                    </Button>
                  </Link>
                )}
                <Link href={`/cameras/${alert.cameraId}`}>
                  <Button variant="ghost" size="sm">
                    <Camera size={13} /> View Sensor
                  </Button>
                </Link>
              </div>

              {!isAcknowledged && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onAcknowledge(alert.id)}
                  className="text-xs text-cyan-500 dark:text-cyan-400"
                >
                  <CheckCircle2 size={13} /> Mark Acknowledged
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const { data: alerts = [], refetch, isFetching } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertService.getAlerts,
    refetchInterval: 5_000,
  });
  const { alertSeverityFilter, setAlertSeverityFilter } = useFilterStore();

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => alertService.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['activeAlertCount'] });
    },
  });

  const filtered = alertSeverityFilter === 'all'
    ? alerts
    : alerts.filter((a: Alert) => a.severity === alertSeverityFilter);

  const handleExportCSV = () => {
    const header = 'ID,Type,Severity,Title,Description,Plate,Camera,Location,Timestamp,Resolved\n';
    const rows = filtered.map(a => 
      `"${a.id}","${a.type}","${a.severity}","${a.title}","${a.description}","${a.vehiclePlate ?? ''}","${a.cameraName}","${a.location}","${a.timestamp}","${a.isResolved}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nagardrishti_alerts_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high:     alerts.filter(a => a.severity === 'high').length,
    medium:   alerts.filter(a => a.severity === 'medium').length,
    low:      alerts.filter(a => a.severity === 'low').length,
  };

  return (
    <PageWrapper className="space-y-6 font-body">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">Sentinel Threat Center</h1>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">
            <span className="text-rose-500 dark:text-rose-400 font-bold">{alerts.length}</span> active threat signals across the municipal grid
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Sync Grid
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV}>
            <Download size={13} /> Export Threat Log
          </Button>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-[var(--text-tertiary)] mr-1" />
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => (
          <button
            key={s}
            onClick={() => setAlertSeverityFilter(s)}
            className={`text-xs font-display font-semibold px-3.5 py-1.5 rounded-xl border transition-all duration-150 capitalize cursor-pointer ${
              alertSeverityFilter === s
                ? 'bg-teal-500/20 text-teal-400 border-teal-400/50 shadow-[0_0_14px_rgba(13,148,136,0.25)] font-bold'
                : 'bg-white/[0.03] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-teal-400/30 hover:text-[var(--text-primary)]'
            }`}
          >
            {s === 'all' ? `All (${alerts.length})` : `${s} (${counts[s as keyof typeof counts] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((alert: Alert, i: number) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              index={i}
              onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-xs font-mono text-[var(--text-tertiary)]">
            <Bell size={40} className="mx-auto mb-3 text-cyan-400/20" />
            No sentinel alerts match the current filter
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
