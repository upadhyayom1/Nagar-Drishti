'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Camera as CameraIcon, Car, Gauge, AlertTriangle, Layers, Radio, Activity, Zap, CheckCircle2, MapPin } from 'lucide-react';
import { StatCard }    from '@/components/ui/StatCard';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService }    from '@/services/cameraService';
import { analyticsService } from '@/services/analyticsService';
import { alertService }     from '@/services/alertService';
import { formatTime, formatRelativeTime, cn } from '@/lib/utils';
import { useFilterStore }   from '@/store/filterStore';
import { CongestionForecastWidget } from '@/components/dashboard/CongestionForecastWidget';
import type { Alert } from '@/types';

// Dynamic import for Leaflet map with zero SSR issues
const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[var(--glass-surface)] rounded-2xl">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin mb-3" />
        <p className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-semibold">
          <Radio size={13} className="animate-pulse" />
          Scanning optical grid & synchronizing sensors…
        </p>
      </div>
    ),
  }
);

function severityVariant(s: string): 'critical' | 'warn' | 'info' | 'default' {
  if (s === 'critical') return 'critical';
  if (s === 'high')     return 'warn';
  if (s === 'medium')   return 'info';
  return 'default';
}

function LayerPill({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'text-xs font-display font-semibold px-3 py-1.5 rounded-xl border transition-all duration-200 backdrop-blur-xl cursor-pointer',
        active
          ? 'bg-cyan-500/20 text-cyan-500 dark:text-cyan-300 border-cyan-400/50 shadow-[0_0_16px_rgba(0,240,255,0.35)] font-bold'
          : 'bg-white/[0.03] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-cyan-400/30 hover:bg-white/[0.06] hover:text-[var(--text-primary)]',
      )}
    >
      {label}
    </button>
  );
}

export default function DashboardPage() {
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: cameraService.getCameras,
    refetchInterval: 5_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['trafficStats'],
    queryFn: () => analyticsService.getTrafficStats(),
    refetchInterval: 5_000,
  });

  const { data: notificationSummary, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notificationSummary'],
    queryFn: () => alertService.getNotificationSummary(5),
    refetchInterval: 5_000,
  });
  const alerts = notificationSummary?.items ?? [];
  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: analyticsService.getSystemHealth,
    refetchInterval: 5_000,
  });

  const {
    showHeatmap, showTrajectories, showTrafficDensity,
    toggleHeatmap, toggleTrajectories, toggleTrafficDensity,
  } = useFilterStore();

  return (
    <PageWrapper className="space-y-6">

      {/* ── KPI Stat Cards Row with Glowing Top & Bottom Bars ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Optical Nodes"
          value={stats?.activeCameras ?? 0}
          isLoading={statsLoading}
          icon={CameraIcon}
          colorTheme="emerald"
        />
        <StatCard
          label="Vehicles Tracked Today"
          value={stats?.totalVehiclesToday?.toLocaleString('en-IN') ?? 0}
          isLoading={statsLoading}
          icon={Car}
          colorTheme="cyan"
        />
        <StatCard
          label="Average City Velocity"
          value={stats?.avgSpeed ? `${stats.avgSpeed} km/h` : '—'}
          isLoading={statsLoading}
          icon={Gauge}
          subtitle="Transit velocity curve"
          colorTheme="violet"
        />
        <StatCard
          label="Active Sentinel Flags"
          value={notificationSummary?.total ?? 0}
          isLoading={notificationsLoading}
          icon={AlertTriangle}
          subtitle="Real-time threat queue"
          colorTheme="rose"
        />
      </div>

      {/* ── Distinctive Multi-Colored Spectrum Bar & Telemetry Status ── */}
      <GlassCard padding="sm" glow="spectral" className="p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 font-display text-xs font-bold text-[var(--text-primary)]">
            <Activity size={14} className="text-cyan-500 dark:text-cyan-400 animate-pulse" />
            <span>MUNICIPAL SENSOR GRID TELEMETRY</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              {healthLoading ? 'Synchronizing nodes…' : `${systemHealth?.summary.online ?? 0}/${systemHealth?.summary.total ?? 0} Nodes Online`}
            </span>
            <span className="flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              Live telemetry synchronized
            </span>
            <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
              {healthLoading ? 'Loading alerts…' : `${systemHealth?.summary.activeAlerts ?? 0} Threat Flags`}
            </span>
          </div>
        </div>

        {/* Colorful Spectrum Gradient Progress Bar */}
        <div className="relative h-2.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 p-0.5 border border-[var(--glass-border)]">
          <div className="h-full rounded-full spectrum-bar animate-pulse duration-1000" style={{ width: '100%' }} />
        </div>
      </GlassCard>

      {/* ── Interactive Map + Alerts Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Map Column with Controls Positioned Above Map on RHS */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          
          {/* Header Bar Above Map: LHS Sector Title, RHS Map Overlays */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-display font-bold text-[var(--text-primary)]">
              <MapPin size={15} className="text-cyan-500 dark:text-cyan-400" />
              <span>Prayagraj Municipal Optical Grid</span>
            </div>

            {/* Overlays on RHS Above Map */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-display font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 mr-1 hidden sm:inline-flex">
                <Layers size={13} className="text-cyan-500 dark:text-cyan-400" /> Overlays:
              </span>
              <LayerPill label="Traffic Density" active={showTrafficDensity} onToggle={toggleTrafficDensity} />
              <LayerPill label="Density Heatmap" active={showHeatmap}        onToggle={toggleHeatmap} />
              <LayerPill label="Trajectory Vectors" active={showTrajectories} onToggle={toggleTrajectories} />
            </div>
          </div>

          <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-void)] shadow-[0_20px_50px_rgba(0,0,0,0.65)] relative z-0">
            <MapView cameras={cameras} />
          </div>
        </div>

        {/* Right Hand Side Column for Feed and Forecast */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-[575px]">
          
          {/* Real-Time Sentinel Feed */}
          <GlassCard padding="sm" glow="rose" accent="rose" className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-[var(--glass-border)]">
              <h3 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Radio size={13} className="text-rose-500 dark:text-rose-400 animate-pulse" />
                Live Sentinel Feed
              </h3>
              <Badge variant="critical" size="sm" dot pulse>{alerts.length}</Badge>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {alerts.map((alert: Alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all duration-200 cursor-pointer',
                    alert.severity === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60 shadow-[0_0_16px_rgba(244,63,94,0.2)]'
                      : alert.severity === 'high'
                      ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_14px_rgba(245,158,11,0.15)]'
                      : 'bg-white/[0.03] border-[var(--glass-border)] hover:border-cyan-400/40 hover:bg-white/[0.06]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate font-display">
                      {alert.title}
                    </span>
                    <Badge variant={severityVariant(alert.severity)} size="sm">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2 leading-relaxed font-body">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    {alert.vehiclePlate && (
                      <span className="text-cyan-500 dark:text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                        {alert.vehiclePlate}
                      </span>
                    )}
                    <span 
                      title={formatTime(alert.timestamp)} 
                      className="text-[var(--text-tertiary)] ml-auto cursor-help"
                    >
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* AI Traffic Congestion Forecast */}
          <div className="h-[250px] shrink-0">
            <CongestionForecastWidget />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
