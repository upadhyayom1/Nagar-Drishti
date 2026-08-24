'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Camera as CameraIcon, Car, Gauge, AlertTriangle, Activity } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService } from '@/services/cameraService';
import { analyticsService } from '@/services/analyticsService';
import { alertService } from '@/services/alertService';
import { formatTime } from '@/lib/utils';
import { useFilterStore } from '@/store/filterStore';
import type { Camera, Alert } from '@/types';

// Dynamic import for map — MUST be SSR: false
const MapView = dynamic(() => import('@/components/map/MapView').then(mod => ({ default: mod.MapView })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-bg-elevated rounded-[var(--radius-card)]">
      <div className="text-text-secondary text-sm">Loading map...</div>
    </div>
  ),
});

function AlertSeverityBadge({ severity }: { severity: string }) {
  const variant = severity === 'critical' ? 'danger' : severity === 'high' ? 'warning' : severity === 'medium' ? 'info' : 'default';
  return <Badge variant={variant} size="sm">{severity}</Badge>;
}

export default function DashboardPage() {
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => cameraService.getCameras(),
  });

  const { data: stats } = useQuery({
    queryKey: ['trafficStats'],
    queryFn: () => analyticsService.getTrafficStats(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: () => alertService.getRecentAlerts(5),
  });

  const { showHeatmap, showTrajectories, showTrafficDensity, toggleHeatmap, toggleTrajectories, toggleTrafficDensity } = useFilterStore();

  return (
    <PageWrapper className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Cameras"
          value={stats?.activeCameras ?? '--'}
          icon={CameraIcon}
          trend={{ value: 2.5, isPositive: true }}
          accentColor="var(--accent-cyan)"
        />
        <StatCard
          label="Vehicles Today"
          value={stats?.totalVehiclesToday?.toLocaleString() ?? '--'}
          icon={Car}
          trend={{ value: 12.3, isPositive: true }}
          accentColor="var(--accent-blue)"
        />
        <StatCard
          label="Avg Speed"
          value={stats ? `${stats.avgSpeed} km/h` : '--'}
          icon={Gauge}
          trend={{ value: 3.1, isPositive: false }}
          accentColor="var(--status-warn)"
        />
        <StatCard
          label="Active Alerts"
          value={stats?.activeAlerts ?? '--'}
          icon={AlertTriangle}
          subtitle="2 critical"
          accentColor="var(--status-critical)"
        />
      </div>

      {/* Map + Alerts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Area */}
        <div className="lg:col-span-3 space-y-3">
          <div className="h-[500px] rounded-[var(--radius-card)] overflow-hidden border border-border-glass">
            <MapView cameras={cameras} />
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary mr-2">Layers:</span>
            {[
              { label: 'Traffic Density', active: showTrafficDensity, toggle: toggleTrafficDensity },
              { label: 'Heatmap', active: showHeatmap, toggle: toggleHeatmap },
              { label: 'Trajectories', active: showTrajectories, toggle: toggleTrajectories },
            ].map((layer) => (
              <button
                key={layer.label}
                onClick={layer.toggle}
                className={`px-3 py-1 text-xs rounded-full border transition-all duration-150 ${
                  layer.active
                    ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                    : 'border-border-glass bg-surface-glass text-text-secondary hover:text-text-primary'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Alerts Panel */}
        <GlassCard className="lg:col-span-1" padding="sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold font-display">Recent Alerts</h3>
            <Badge variant="danger" size="sm">{alerts.length}</Badge>
          </div>
          <div className="space-y-2">
            {alerts.map((alert: Alert) => (
              <div
                key={alert.id}
                className="p-2.5 rounded-lg bg-white/[0.02] border border-border-glass hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-primary truncate max-w-[160px]">
                    {alert.title}
                  </span>
                  <AlertSeverityBadge severity={alert.severity} />
                </div>
                <p className="text-[10px] text-text-secondary truncate">{alert.description}</p>
                <div className="flex items-center justify-between mt-1.5">
                  {alert.vehiclePlate && (
                    <span className="text-[10px] font-data text-accent-cyan">{alert.vehiclePlate}</span>
                  )}
                  <span className="text-[10px] text-text-secondary font-data">
                    {formatTime(alert.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
