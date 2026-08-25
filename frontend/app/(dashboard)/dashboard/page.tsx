'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Camera as CameraIcon, Car, Gauge, AlertTriangle, Layers, Radio } from 'lucide-react';
import { StatCard }    from '@/components/ui/StatCard';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService }    from '@/services/cameraService';
import { analyticsService } from '@/services/analyticsService';
import { alertService }     from '@/services/alertService';
import { formatTime, cn }   from '@/lib/utils';
import { useFilterStore }   from '@/store/filterStore';
import type { Alert } from '@/types';

// Dynamic import for Leaflet map with zero SSR issues
const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[rgba(13,19,40,0.8)] rounded-2xl">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin mb-3 shadow-[0_0_25px_rgba(6,182,212,0.5)]" />
        <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest flex items-center gap-2 font-bold">
          <Radio size={14} className="animate-pulse" />
          Synchronizing Municipal Sensor Grid...
        </p>
      </div>
    ),
  }
);

function severityVariant(s: string): 'danger' | 'warning' | 'info' | 'default' {
  if (s === 'critical') return 'danger';
  if (s === 'high')     return 'warning';
  if (s === 'medium')   return 'info';
  return 'default';
}

function LayerPill({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'text-xs font-display font-semibold px-4 py-1.5 rounded-xl border transition-all duration-200 backdrop-blur-xl',
        active
          ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-indigo-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3),_inset_0_1px_0_rgba(255,255,255,0.2)] font-bold'
          : 'bg-white/[0.04] text-slate-400 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white',
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
  });

  const { data: stats } = useQuery({
    queryKey: ['trafficStats'],
    queryFn: () => analyticsService.getTrafficStats(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: () => alertService.getRecentAlerts(5),
  });

  const {
    showHeatmap, showTrajectories, showTrafficDensity,
    toggleHeatmap, toggleTrajectories, toggleTrafficDensity,
  } = useFilterStore();

  return (
    <PageWrapper className="space-y-6">

      {/* ── Multi-Chromatic KPI Stat Cards Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Optical Nodes"
          value={stats?.activeCameras ?? 0}
          icon={CameraIcon}
          colorTheme="emerald"
        />
        <StatCard
          label="Vehicles Tracked Today"
          value={stats?.totalVehiclesToday?.toLocaleString('en-IN') ?? 0}
          icon={Car}
          colorTheme="violet"
        />
        <StatCard
          label="Average City Velocity"
          value={stats ? `${stats.avgSpeed}` : '—'}
          icon={Gauge}
          subtitle="km / h transit velocity"
          colorTheme="cyan"
        />
        <StatCard
          label="Active Sentinel Flags"
          value={stats?.activeAlerts ?? 0}
          icon={AlertTriangle}
          subtitle="Backend alert queue"
          colorTheme="rose"
        />
      </div>

      {/* ── Interactive Map + Alerts Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Map Column */}
        <div className="lg:col-span-3 flex flex-col gap-3.5">
          <div className="h-[520px] w-full rounded-[1.5rem] overflow-hidden border border-white/10 bg-[#050711] shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-0">
            <MapView cameras={cameras} />
          </div>

          {/* Map Layer Controls */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs font-display font-bold text-[var(--text-secondary)] flex items-center gap-1.5 mr-2">
              <Layers size={14} className="text-cyan-400" /> Neural Overlays:
            </span>
            <LayerPill label="Traffic Density" active={showTrafficDensity} onToggle={toggleTrafficDensity} />
            <LayerPill label="Density Heatmap" active={showHeatmap}        onToggle={toggleHeatmap} />
            <LayerPill label="Trajectory Vectors" active={showTrajectories} onToggle={toggleTrajectories} />
          </div>
        </div>

        {/* Real-Time Sentinel Feed Column */}
        <GlassCard padding="sm" glow="spectral" accent="spectral" className="lg:col-span-1 flex flex-col h-[575px]">
          <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-white/10">
            <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio size={14} className="text-pink-400 animate-pulse" />
              Live Sentinel Feed
            </h3>
            <Badge variant="danger" size="sm" dot pulse>{alerts.length}</Badge>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {alerts.map((alert: Alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer',
                  alert.severity === 'critical'
                    ? 'bg-rose-500/10 border-rose-500/35 hover:bg-rose-500/20 hover:border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : alert.severity === 'high'
                    ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                    : 'bg-[rgba(13,19,40,0.8)] border-white/10 hover:bg-[rgba(20,28,60,0.95)] hover:border-cyan-400/40',
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-white truncate font-display">
                    {alert.title}
                  </span>
                  <Badge variant={severityVariant(alert.severity)} size="sm">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2.5 leading-relaxed font-normal font-body">
                  {alert.description}
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  {alert.vehiclePlate && (
                    <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-400/30">
                      {alert.vehiclePlate}
                    </span>
                  )}
                  <span className="text-[var(--text-tertiary)] ml-auto font-data">
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
