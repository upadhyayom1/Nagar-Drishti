'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, Camera, Car, Clock, Filter, AlertTriangle, Shield, TrendingUp, WifiOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { alertService } from '@/services/alertService';
import { formatDateTime } from '@/lib/utils';
import { useFilterStore } from '@/store/filterStore';
import type { Alert } from '@/types';

function getAlertIcon(type: string) {
  switch (type) {
    case 'BLACKLIST_VEHICLE': return Shield;
    case 'ROUTE_ANOMALY': return TrendingUp;
    case 'TRAFFIC_SURGE': return AlertTriangle;
    case 'CAMERA_OFFLINE': return WifiOff;
    default: return Bell;
  }
}

function AlertCard({ alert, index }: { alert: Alert; index: number }) {
  const Icon = getAlertIcon(alert.type);
  const severityVariant = alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : alert.severity === 'medium' ? 'info' : 'default';
  const borderClass = alert.severity === 'critical' ? 'border-status-critical/20 status-glow-critical' : 'border-border-glass';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <GlassCard className={borderClass}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-2 rounded-lg flex-shrink-0 ${
            alert.severity === 'critical' ? 'bg-status-critical/10' :
            alert.severity === 'high' ? 'bg-status-warn/10' :
            'bg-accent-cyan/10'
          }`}>
            <Icon size={18} className={`${
              alert.severity === 'critical' ? 'text-status-critical' :
              alert.severity === 'high' ? 'text-status-warn' :
              'text-accent-cyan'
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-text-primary truncate">{alert.title}</h3>
              <Badge variant={severityVariant} size="sm">{alert.severity}</Badge>
            </div>
            <p className="text-xs text-text-secondary mb-2">{alert.description}</p>

            <div className="flex items-center gap-4 text-[10px] text-text-secondary">
              {alert.vehiclePlate && (
                <span className="flex items-center gap-1">
                  <Car size={10} />
                  <span className="font-data text-accent-cyan">{alert.vehiclePlate}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Camera size={10} />
                {alert.cameraName}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                <span className="font-data">{formatDateTime(alert.timestamp)}</span>
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              {alert.vehiclePlate && (
                <Link href={`/vehicles/${alert.vehiclePlate}`}>
                  <Button variant="ghost" size="sm">
                    <Car size={12} />
                    View Vehicle
                  </Button>
                </Link>
              )}
              <Link href={`/cameras/${alert.cameraId}`}>
                <Button variant="ghost" size="sm">
                  <Camera size={12} />
                  View Camera
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function AlertsPage() {
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertService.getAlerts(),
  });

  const { alertSeverityFilter, setAlertSeverityFilter } = useFilterStore();

  const filteredAlerts = alertSeverityFilter === 'all'
    ? alerts
    : alerts.filter((a: Alert) => a.severity === alertSeverityFilter);

  // Sort by severity: critical first
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedAlerts = [...filteredAlerts].sort((a, b) =>
    (severityOrder[a.severity as keyof typeof severityOrder] ?? 4) - (severityOrder[b.severity as keyof typeof severityOrder] ?? 4)
  );

  const criticalCount = alerts.filter((a: Alert) => a.severity === 'critical').length;
  const highCount = alerts.filter((a: Alert) => a.severity === 'high').length;

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Alerts Center</h1>
          <p className="text-sm text-text-secondary mt-1">
            <span className="font-data text-text-primary">{alerts.length}</span> active alerts across the network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="danger" dot pulse>{criticalCount} Critical</Badge>
          <Badge variant="warning" dot>{highCount} High</Badge>
        </div>
      </div>

      {/* Severity Filter */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-text-secondary" />
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((severity) => (
          <button
            key={severity}
            onClick={() => setAlertSeverityFilter(severity)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-150 capitalize ${
              alertSeverityFilter === severity
                ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                : 'border-border-glass bg-surface-glass text-text-secondary hover:text-text-primary'
            }`}
          >
            {severity === 'all' ? 'All Alerts' : severity}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {sortedAlerts.map((alert: Alert, index: number) => (
          <AlertCard key={alert.id} alert={alert} index={index} />
        ))}
      </div>

      {sortedAlerts.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p>No alerts match the current filter</p>
        </div>
      )}
    </PageWrapper>
  );
}
