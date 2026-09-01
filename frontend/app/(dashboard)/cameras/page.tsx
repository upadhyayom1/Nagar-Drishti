'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera as CameraIcon, Activity, Clock } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { PulseDot }    from '@/components/ui/PulseDot';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService }  from '@/services/cameraService';
import { formatTime } from '@/lib/utils';
import { useFilterStore } from '@/store/filterStore';
import { cn } from '@/lib/utils';
import type { Camera } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function CameraCard({ camera }: { camera: Camera }) {
  const isOnline  = camera.status === 'online';
  const isWarn    = camera.status === 'warning';
  const statusVar = isOnline ? 'ok' : isWarn ? 'warn' : 'critical';
  const glowType  = isOnline ? 'emerald' : isWarn ? 'amber' : 'rose';

  const trafficVar =
    camera.trafficLevel === 'congested' ? 'critical' :
    camera.trafficLevel === 'high'      ? 'warn' : 'info';

  return (
    <Link href={`/cameras/${camera.id}`} className="block h-full">
      <GlassCard hover glow={glowType} className="h-full flex flex-col gap-3.5 p-4 transition-all duration-150">

        {/* Video Thumbnail Box — animated scanline placeholder */}
        <div className="relative aspect-video rounded-xl overflow-hidden camera-feed-bg border border-[var(--glass-border)] shrink-0 shadow-inner">
          {/* Scanline sweep animation */}
          <div className="camera-scanline" />

          {/* CRT grid lines overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.5) 2px, rgba(0,240,255,0.5) 3px)',
              backgroundSize: '100% 6px',
            }}
          />

          {/* Camera icon centred */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CameraIcon size={28} className="text-cyan-400/20" />
          </div>

          {/* Status badge */}
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={statusVar} size="sm" dot pulse={isOnline}>{camera.status}</Badge>
          </div>

          {/* Detection count */}
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[9px] font-mono bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-white font-bold border border-white/15">
              {camera.vehiclesDetected} vehicles
            </span>
          </div>

          {/* Camera code pill */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="text-[9px] font-mono bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded text-cyan-400 font-bold border border-cyan-400/40 shadow-md">
              {camera.cameraCode}
            </span>
          </div>

          {/* LIVE indicator with PulseDot */}
          {isOnline && (
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-emerald-400/30">
              <PulseDot variant="emerald" size="sm" />
              <span className="text-[8px] font-mono text-emerald-400 font-bold">LIVE</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 flex-1">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] truncate font-display">{camera.name}</h3>
            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-body">{camera.location}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] font-mono">
            <div className="flex items-center gap-1.5 font-body truncate">
              <CameraIcon size={12} className="text-cyan-400 shrink-0" />
              <span className="truncate">{camera.zone}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Activity size={12} className="text-violet-400 shrink-0" />
              <span className="text-[var(--text-primary)] font-bold">{camera.vehiclesDetected}</span>
              <span>veh</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2.5 border-t border-[var(--glass-border)] mt-auto">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] flex items-center gap-1">
              <Clock size={10} />
              {formatTime(camera.lastUpdated)}
            </span>
            <Badge variant={trafficVar} size="sm">{camera.trafficLevel}</Badge>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs font-display font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border transition-all duration-200 capitalize cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400',
        active
          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] font-bold'
          : 'bg-white/[0.03] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-cyan-400/30 hover:text-[var(--text-primary)]'
      )}
    >
      {label}
    </button>
  );
}

export default function CamerasPage() {
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: cameraService.getCameras,
  });

  const { cameraStatusFilter, setCameraStatusFilter } = useFilterStore();

  const filtered = cameraStatusFilter === 'all'
    ? cameras
    : cameras.filter((c: Camera) => c.status === cameraStatusFilter);

  const onlineCount = cameras.filter((c: Camera) => c.status === 'online').length;
  const warnCount   = cameras.filter((c: Camera) => c.status === 'warning').length;
  const offCount    = cameras.filter((c: Camera) => c.status === 'offline').length;

  return (
    <PageWrapper className="space-y-6 font-body">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">Live Optical Grid</h1>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">
            Distributed ANPR sensor stations · Real-time camera feeds
          </p>
        </div>

        {/* Status Counters with PulseDot */}
        <div className="flex items-center gap-2">
          <Badge variant="ok" dot pulse>
            <PulseDot variant="emerald" size="sm" className="-ml-0.5" />
            {onlineCount} Online
          </Badge>
          {warnCount > 0 && <Badge variant="warn" dot>{warnCount} Warn</Badge>}
          {offCount  > 0 && <Badge variant="critical" dot>{offCount} Offline</Badge>}
        </div>
      </div>

      {/* ── Filter Pills ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterPill label="All Cameras" active={cameraStatusFilter === 'all'}     onClick={() => setCameraStatusFilter('all')} />
        <FilterPill label="Online"      active={cameraStatusFilter === 'online'}  onClick={() => setCameraStatusFilter('online')} />
        <FilterPill label="Warning"     active={cameraStatusFilter === 'warning'} onClick={() => setCameraStatusFilter('warning')} />
        <FilterPill label="Offline"     active={cameraStatusFilter === 'offline'} onClick={() => setCameraStatusFilter('offline')} />
      </div>

      {/* ── Camera Grid ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} variant="tile" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {filtered.map((camera: Camera) => (
            <motion.div key={camera.id} variants={itemVariants} className="h-full">
              <CameraCard camera={camera} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageWrapper>
  );
}
