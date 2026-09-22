'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Camera as CameraIcon, Car, Gauge, AlertTriangle, Layers, Radio, Activity, Zap, CheckCircle2, MapPin } from 'lucide-react';
import { StatBentoGrid } from '@/components/dashboard/StatBentoGrid';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import Link from 'next/link';
import { cameraService }    from '@/services/cameraService';
import { analyticsService } from '@/services/analyticsService';
import { alertService }     from '@/services/alertService';
import { formatTime, formatRelativeTime, cn } from '@/lib/utils';
import { useFilterStore }   from '@/store/filterStore';
import type { Alert } from '@/types';

// Dynamic import for MapLibre map (OpenFreeMap Dark & Light - No Watermark) with zero SSR issues
const NagarMapLibre = dynamic(
  () => import('@/components/map/NagarMapLibre').then((m) => ({ default: m.NagarMapLibre })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[var(--glass-surface)] rounded-2xl">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin mb-3" />
        <p className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-semibold">
          <Radio size={13} className="animate-pulse" />
          Initializing Optical Matrix…
        </p>
      </div>
    ),
  }
);

// Dynamic import for interactive MagicBento with zero SSR issues
const MagicBento = dynamic(
  () => import('@/components/ui/MagicBento').then((m) => ({ default: m.MagicBento })),
  { ssr: false }
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
  });

  const { data: stats } = useQuery({
    queryKey: ['trafficStats'],
    queryFn: () => analyticsService.getTrafficStats(),
    refetchInterval: 5_000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: () => alertService.getRecentAlerts(5),
    refetchInterval: 5_000,
  });

  const {
    showHeatmap, showTrajectories, showTrafficDensity,
    toggleHeatmap, toggleTrajectories, toggleTrafficDensity,
  } = useFilterStore();

  return (
    <PageWrapper className="space-y-6">

      {/* ── Elevated Bento Grid: KPI Telemetry Deck with Diurnal Pulse & Status Gauges ── */}
      <StatBentoGrid stats={stats} totalNodes={cameras.length} />

        {/* ── Interactive Map + Alerts Row ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Map Column with Controls Positioned Above Map on RHS */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            
            {/* Header Bar Above Map: LHS Sector Title, RHS Map Overlays */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-display font-bold text-[var(--text-primary)]">
                <MapPin size={15} className="text-cyan-500 dark:text-cyan-400" />
                <span>Prayagraj Municipal <span className="bg-gradient-to-r from-cyan-400 to-[var(--brand-teal)] bg-clip-text text-transparent">Optical Grid</span></span>
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

            <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-white/[0.08] dark:border-white/[0.08] bg-[var(--bg-void)] shadow-[0_20px_50px_rgba(0,0,0,0.45)] relative z-0 group">
              <NagarMapLibre cameras={cameras} />
              {/* Subtle inner cinematic vignette to integrate map inside dashboard shell */}
              <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)]" />
            </div>
          </div>

          {/* Real-Time Sentinel Feed Column */}
          <GlassCard padding="sm" glow="none" className="lg:col-span-1 flex flex-col h-[575px]">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-white/[0.06] dark:border-white/[0.06]">
              <h3 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Radio size={13} className="text-rose-500 dark:text-rose-400 animate-pulse" />
                Live Alerts Feed
              </h3>
              <Badge variant="critical" size="sm" dot pulse>{alerts.length}</Badge>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {alerts.map((alert: Alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-xl transition-all duration-200 cursor-pointer border',
                    alert.severity === 'critical'
                      ? 'bg-rose-500/[0.08] border-rose-500/25 hover:border-rose-500/40 hover:bg-rose-500/[0.12]'
                      : alert.severity === 'high'
                      ? 'bg-amber-500/[0.08] border-amber-500/25 hover:border-amber-500/40 hover:bg-amber-500/[0.12]'
                      : 'bg-white/[0.02] border-transparent hover:border-white/10 hover:bg-white/[0.05]',
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
                      <Link
                        href={`/vehicles/${alert.vehiclePlate}`}
                        onClick={(e) => e.stopPropagation()}
                        title="View Vehicle Profile"
                        className="text-cyan-500 dark:text-cyan-400 font-bold bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded transition-colors cursor-pointer inline-block"
                      >
                        {alert.vehiclePlate}
                      </Link>
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
        </div>

        {/* ── Neural Telemetry & Urban Intelligence Grid (Magic Bento) ── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f59b] animate-pulse" />
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[var(--text-secondary)]">
                Neural Subsystems & Intelligence Matrix
              </h2>
            </div>
            <span className="text-[11px] font-mono text-cyan-400/70 hidden sm:inline-block">
              6 Core Subsystems Synchronized
            </span>
          </div>

          <MagicBento
            cards={[
              {
                title: 'ANPR Neural Telemetry',
                description: 'Real-time multi-angle license plate recognition, automated speed radar & vehicle classification.',
                label: '99.4% Optical Confidence',
                badge: 'Neural Engine',
                href: '/detect',
              },
              {
                title: 'Corridor Velocity & Flow',
                description: stats?.avgSpeed
                  ? `Average corridor speed profiling at ${Math.round(stats.avgSpeed)} km/h with automated green-wave traffic signal sync.`
                  : 'Corridor speed profiling and automated green-wave traffic signal synchronization.',
                label: stats?.congestionIndex ? `Congestion: ${stats.congestionIndex}/100` : 'Flow Analytics',
                badge: 'Real-Time Sync',
                href: '/analytics',
              },
              {
                title: 'Prayagraj Optical Sensor Matrix',
                description: 'City-wide optical surveillance grid streaming low-latency feeds with instant anomaly detection and coordinate mapping across all municipal sectors.',
                label: 'Municipal Grid',
                badge: `${cameras.length || 18} Active Nodes`,
                href: '/cameras',
              },
              {
                title: 'Predictive Demand & Surge AI',
                description: 'Deep spatial-temporal LSTM forecasting traffic surges, bottlenecks, and peak congestion up to 4 hours in advance with proactive signal rerouting.',
                label: 'AI Forecasting',
                badge: 'LSTM Active',
                href: '/forecast',
              },
              {
                title: 'Sentinel Threat Watchlist',
                description: 'Automated flagged vehicle alerts, blacklist matching, and stolen plate interception dispatch across all active road corridors.',
                label: 'Sentinel Defense',
                badge: `${alerts.length} Active Flags`,
                href: '/blacklist',
              },
              {
                title: 'Field Triage & Citizen Portal',
                description: 'Citizen incident reporting pipeline with instant optical verification, geo-tagging, and officer dispatch validation.',
                label: 'Citizen Portal',
                badge: 'Verified Desk',
                href: '/submissions',
              },
            ]}
            textAutoHide={true}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={320}
            particleCount={14}
            glowColor="0, 245, 155"
          />
        </div>
    </PageWrapper>
  );
}
