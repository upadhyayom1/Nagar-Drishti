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

  const trafficVar =
    camera.trafficLevel === 'congested' ? 'critical' :
    camera.trafficLevel === 'high'      ? 'warn' : 'ok';

  return (
    <Link href={`/cameras/${encodeURIComponent(camera.name)}`} className="block h-full group">
      <div className="h-full rounded-3xl p-3.5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-elevated)] backdrop-blur-2xl shadow-[var(--glass-shadow)] hover:border-[var(--brand-teal)]/50 hover:shadow-[0_20px_45px_rgba(0,0,0,0.4),0_0_25px_rgba(0,245,155,0.15)] hover:-translate-y-1.5">

        {/* Specular top rim highlight */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--glass-highlight)] to-transparent pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

        {/* Liquid Glass CCTV Viewport Box */}
        <div className="relative aspect-video rounded-2xl overflow-hidden shrink-0 border border-[var(--glass-border)] bg-gradient-to-br from-black/90 via-[#0a0d14]/80 to-black/95 shadow-inner group/feed">
          {/* CRT scanline texture */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,155,0.5) 2px, rgba(0,245,155,0.5) 3px)',
              backgroundSize: '100% 6px',
            }}
          />
          <div className="camera-scanline pointer-events-none opacity-35" />

          {/* Center: Frosted Glass Lens Ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-3.5 rounded-full bg-[var(--brand-teal)]/10 border border-[var(--brand-teal)]/25 group-hover:scale-110 group-hover:bg-[var(--brand-teal)]/20 transition-all duration-300 shadow-[0_0_24px_rgba(0,245,155,0.15)]">
              <CameraIcon size={26} className="text-[var(--brand-teal)]/60 group-hover:text-[var(--brand-teal)] transition-colors" />
            </div>
          </div>

          {/* Viewfinder crosshair brackets */}
          <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-white/40 pointer-events-none" />
          <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-white/40 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-white/40 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-white/40 pointer-events-none" />

          {/* Top-Left: Glass Status Badge */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge variant={statusVar} size="sm" dot pulse={isOnline} className="backdrop-blur-md bg-black/60 shadow-md">
              {camera.status}
            </Badge>
          </div>

          {/* Top-Right: Glass Detection Count */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="text-[9px] font-mono bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full text-white font-bold border border-white/20 shadow-md">
              {camera.detectionCount || 12} detections
            </span>
          </div>

          {/* Bottom-Left: Camera ID Chip */}
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="text-[9px] font-mono bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[var(--brand-teal)] font-bold border border-[var(--brand-teal)]/40 shadow-sm">
              {camera.name}
            </span>
          </div>

          {/* Bottom-Right: LIVE Beacon */}
          {isOnline && (
            <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-400/40 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-teal)] animate-ping" />
              <span className="text-[8px] font-mono text-[var(--brand-teal)] font-bold tracking-wider">LIVE {camera.fps || 30}FPS</span>
            </div>
          )}
        </div>

        {/* Info & Telemetry */}
        <div className="flex flex-col gap-2 pt-3 flex-1">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-teal)] truncate font-display transition-colors">
              {camera.name}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-mono">
              {camera.location}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] font-mono">
            <div className="flex items-center gap-1.5 truncate">
              <CameraIcon size={12} className="text-[var(--brand-teal)] shrink-0" />
              <span className="truncate">{camera.zone}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Activity size={12} className="text-violet-400 shrink-0" />
              <span className="text-[var(--text-primary)] font-bold font-display">{camera.vehiclesDetected}</span>
              <span className="text-[10px]">veh</span>
            </div>
          </div>

          {/* Footer with Specular Rim */}
          <div className="flex items-center justify-between pt-2.5 border-t border-[var(--glass-border)] mt-auto">
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] flex items-center gap-1">
              <Clock size={10} />
              {formatTime(camera.lastUpdated)}
            </span>
            <Badge variant={trafficVar} size="sm">{camera.trafficLevel}</Badge>
          </div>
        </div>

      </div>
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
        'text-xs font-display font-semibold uppercase tracking-wider px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] backdrop-blur-xl',
        active
          ? 'bg-[var(--brand-teal)]/20 text-[var(--brand-teal)] border-[var(--brand-teal)]/50 shadow-[0_0_16px_rgba(0,245,155,0.25)] font-bold'
          : 'bg-[var(--bg-elevated)]/60 text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-[var(--brand-teal)]/40 hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)]'
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
