'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Car, Camera as CameraIcon, Gauge, AlertTriangle, Activity, ArrowUpRight, ShieldCheck, Zap, Radio, Sparkles } from 'lucide-react';
import { StatCounter } from '@/components/ui/StatCounter';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { TrafficStats } from '@/types';
import Link from 'next/link';

interface StatBentoGridProps {
  stats?: TrafficStats;
  totalNodes?: number;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 360, damping: 26 },
  },
};

export function StatBentoGrid({ stats, totalNodes = 0, className }: StatBentoGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Simulated 12-hour diurnal volume bar distribution (scaled 20% to 95%)
  const hourlyBars = [32, 45, 60, 78, 92, 85, 64, 70, 88, 95, 82, 68];

  const totalVehicles = stats?.totalVehiclesToday ?? 0;
  const activeCameras = stats?.activeCameras ?? 0;
  const avgSpeed = stats?.avgSpeed ?? 0;
  const activeAlerts = stats?.activeAlerts ?? 0;
  const totalCameras = totalNodes || activeCameras; // Fallback to activeCameras if not provided

  return (
    <div className={cn('space-y-4 font-body select-none', className)}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* ── CARD 1: DOMINANT HERO BENTO CARD (2 COLS) ── */}
        <motion.div
          variants={itemVariants}
          className="sm:col-span-2 lg:col-span-2 flex flex-col"
          onMouseEnter={() => setHoveredIndex(0)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <GlassCard
            hover
            glow="brand"
            className="flex-1 p-6 relative overflow-hidden flex flex-col justify-between group border bg-[var(--bg-elevated)] border-[var(--card-soft-border)] shadow-[var(--glass-shadow)]"
          >
            {/* Watermark icon with floating rotate effect */}
            <Car
              size={110}
              className="absolute -bottom-6 -right-6 text-[#10a37f]/10 pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-6"
            />

            <div>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                    <Car size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
                      Census Intelligence
                    </span>
                    <span className="text-xs font-display font-bold text-[var(--text-primary)]">
                      Vehicles Tracked Today
                    </span>
                  </div>
                </div>

                <Badge variant="cyan" size="sm" dot pulse>
                  LIVE ANPR
                </Badge>
              </div>

              {/* Main value display */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-[var(--text-primary)]">
                  <StatCounter value={totalVehicles} duration={1100} />
                </span>
                <span className="text-xs font-mono text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                  detections
                </span>
              </div>


            </div>

            {/* Diurnal Traffic Pulse Micro-Bars Visual */}
            <div className="mt-6 pt-3 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-secondary)] mb-2">
                <span>Diurnal Volume Rhythm (Past 12h)</span>
                <span className="text-[var(--brand-teal)] font-bold">{stats?.anprAccuracy != null ? stats.anprAccuracy : 98.4}% ANPR Accuracy</span>
              </div>

              <div className="grid grid-cols-12 gap-1.5 h-9 items-end">
                {hourlyBars.map((height, i) => (
                  <div
                    key={i}
                    className="h-full flex items-end justify-center group/bar relative"
                    title={`Hour ${i + 1}: ${Math.round((height / 100) * 340)} veh/hr`}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.03 }}
                      className="w-full rounded-t bg-[var(--brand-teal)]/50 hover:bg-[var(--brand-teal)] transition-all duration-300 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── CARD 2: ACTIVE OPTICAL NODES (1 COL) ── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col"
          onMouseEnter={() => setHoveredIndex(1)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <GlassCard
            hover
            glow="none"
            className="flex-1 p-5 relative overflow-hidden flex flex-col justify-between group border border-[var(--glass-border)] bg-[var(--bg-elevated)] backdrop-blur-2xl shadow-[var(--glass-shadow)] rounded-3xl"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Grid Nodes
                </span>
                <div className="p-2.5 rounded-2xl bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <CameraIcon size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-extrabold text-[var(--text-primary)]">
                  <StatCounter value={activeCameras} duration={900} />
                </span>
                <span className="text-xs font-mono text-[var(--text-tertiary)] font-semibold uppercase">
                  / {totalCameras}
                </span>
              </div>

              <p className="text-[11px] font-body text-[var(--text-secondary)] mt-1">
                Active camera sensor nodes
              </p>
            </div>

            {/* Circular Gauge Ring Visual */}
            <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" className="stroke-[var(--bg-elevated-2)]" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="var(--brand-teal)"
                      strokeWidth="3"
                      strokeDasharray={88}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-mono font-bold text-[var(--brand-teal)]">
                    {totalCameras > 0 ? Math.round((activeCameras / totalCameras) * 100) : 0}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-primary)] font-bold block leading-tight">6 Sectors</span>
                  <span className="text-[9px] font-mono text-[var(--text-tertiary)] block">
                    {totalCameras > 0 ? Math.round((activeCameras / totalCameras) * 100) : 0}% Online
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-[var(--brand-teal)] bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 px-2 py-0.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] font-bold">
                LOCKED
              </span>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── CARD 3: AVERAGE CITY VELOCITY (1 COL) ── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col"
          onMouseEnter={() => setHoveredIndex(2)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <GlassCard
            hover
            glow="none"
            className="flex-1 p-5 flex flex-col justify-between group border border-[var(--glass-border)] bg-[var(--bg-elevated)] backdrop-blur-2xl shadow-[var(--glass-shadow)] rounded-3xl"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Speed Corridor
                </span>
                <div className="p-2.5 rounded-2xl bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <Gauge size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-extrabold text-[var(--text-primary)]">
                  <StatCounter value={avgSpeed} format={(n) => `${n.toFixed(1)}`} duration={900} />
                </span>
                <span className="text-xs font-mono text-[var(--text-tertiary)] font-semibold uppercase">
                  km/h
                </span>
              </div>

              <p className="text-[11px] font-body text-[var(--text-secondary)] mt-1">
                Network transit velocity
              </p>
            </div>

            {/* Segmented Transit Bar Visual */}
            <div className="mt-4 pt-3 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                <span className="text-[var(--text-secondary)]">Transit Velocity Curve</span>
                <span className="text-[var(--brand-teal)] font-bold">Nominal Flow</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated-2)] overflow-hidden flex gap-0.5">
                <div className="h-full bg-[var(--brand-teal)]" style={{ width: '45%' }} />
                <div className="h-full bg-[var(--brand-teal)]/60" style={{ width: '35%' }} />
                <div className="h-full bg-[var(--text-tertiary)]/40" style={{ width: '20%' }} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── CARD 4: ACTIVE SENTINEL FLAGS (1 COL) ── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col"
          onMouseEnter={() => setHoveredIndex(3)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <GlassCard
            hover
            glow="none"
            className="flex-1 p-5 flex flex-col justify-between group border border-[var(--glass-border)] bg-[var(--bg-elevated)] backdrop-blur-2xl shadow-[var(--glass-shadow)] rounded-3xl"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Sentinel Radar
                </span>
                <div className="p-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-[var(--status-critical)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <AlertTriangle size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-extrabold text-[var(--text-primary)]">
                  <StatCounter value={activeAlerts} duration={800} />
                </span>
                <Badge variant={activeAlerts > 0 ? 'critical' : 'ok'} size="sm" dot pulse={activeAlerts > 0}>
                  {activeAlerts > 0 ? 'ACTIVE' : 'CLEAR'}
                </Badge>
              </div>

              <p className="text-[11px] font-body text-[var(--text-secondary)] mt-1">
                Real-time threat queue
              </p>
            </div>

            {/* Threat indicator details */}
            <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between text-[10px] font-mono">
              <span className="text-[var(--text-secondary)]">3 Watch · 1 Critical</span>
              <Link
                href="/alerts"
                className="text-[var(--status-critical)] font-bold hover:underline flex items-center gap-0.5"
              >
                Review <ArrowUpRight size={11} />
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── CARD 5: INTEGRATED MULTI-SENSOR TELEMETRY STRIP ── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
      >
        <GlassCard padding="sm" glow="none" className="px-5 py-3.5 border border-[var(--glass-border)] bg-[var(--bg-elevated)] backdrop-blur-3xl shadow-[var(--glass-shadow)] rounded-full">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Activity size={15} className="text-[var(--brand-teal)] shrink-0" />
              <span className="text-xs font-display font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
                Municipal Sensor Grid Telemetry
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
              <span className="flex items-center gap-1.5 text-[var(--brand-teal)] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-teal)] shadow-[0_0_10px_var(--brand-teal)]" />
                {activeCameras} Nodes Online ({totalCameras > 0 ? Math.round((activeCameras / totalCameras) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1.5 text-[var(--brand-teal)] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-teal)] shadow-[0_0_10px_var(--brand-teal)]" />
                {stats?.frameSyncPercentage != null ? stats.frameSyncPercentage : 98.6}% Frame Sync
              </span>
              <span className="flex items-center gap-1.5 text-[var(--text-secondary)] font-semibold hidden sm:inline-flex">
                <Zap size={11} />
                {stats?.latencyMs != null ? stats.latencyMs : 38}ms Latency
              </span>
              <span className="flex items-center gap-1.5 text-[var(--status-critical)] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-critical)] shadow-[0_0_10px_var(--status-critical)]" />
                {activeAlerts} Threat Flags
              </span>
            </div>
          </div>

          {/* Restrained Accent Line */}
          <div className="mt-2.5 h-1 rounded-full overflow-hidden bg-[var(--bg-elevated-2)]">
            <div className="h-full w-full rounded-full bg-[var(--brand-teal)]" />
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
