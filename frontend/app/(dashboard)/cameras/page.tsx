'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Camera as CameraIcon, Video, Activity, Clock } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService }  from '@/services/cameraService';
import { formatTime } from '@/lib/utils';
import { useFilterStore } from '@/store/filterStore';
import type { Camera } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function CameraCard({ camera }: { camera: Camera }) {
  const isOnline  = camera.status === 'online';
  const isWarn    = camera.status === 'warning';
  const statusVar = isOnline ? 'success' : isWarn ? 'warning' : 'danger';
  const glowType  = isOnline ? 'emerald' : isWarn ? 'amber' : 'crimson';

  const trafficVar =
    camera.trafficLevel === 'congested' ? 'danger' :
    camera.trafficLevel === 'high'      ? 'warning' : 'default';

  return (
    <Link href={`/cameras/${camera.id}`} className="block h-full">
      <GlassCard hover glow={glowType} className="h-full flex flex-col gap-3.5">

        {/* Video Thumbnail */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#050711] border border-white/[0.08] shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-cyan-500/[0.05]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Video size={32} className="text-cyan-500/30" />
          </div>
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={statusVar} size="sm" dot pulse={isOnline}>{camera.status}</Badge>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[10px] font-data bg-black/80 backdrop-blur-sm px-2.5 py-0.5 rounded-lg text-white font-bold border border-white/10">
              {camera.detectionCount} detections
            </span>
          </div>
          <div className="absolute bottom-2.5 left-2.5">
            <span className="text-[10px] font-data bg-black/80 backdrop-blur-sm px-2.5 py-0.5 rounded-lg text-cyan-400 font-bold border border-cyan-500/30">
              {camera.cameraCode}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2.5 flex-1">
          <div>
            <h3 className="text-sm font-bold text-white truncate font-display">{camera.name}</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5 font-body">{camera.location}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-data">
            <div className="flex items-center gap-1.5 font-body">
              <CameraIcon size={12} className="text-cyan-400" />
              <span>{camera.zone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity size={12} className="text-violet-400" />
              <span className="text-white font-bold">{camera.vehiclesDetected}</span>
              <span>veh</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.07] mt-auto">
            <span className="text-[10px] font-data text-slate-500 flex items-center gap-1">
              <Clock size={10} className="text-slate-500" />
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
      className={`text-xs font-display font-semibold px-4 py-1.5 rounded-xl border transition-all duration-200 capitalize ${
        active
          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.18)]'
          : 'bg-white/[0.04] text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
      }`}
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
    : cameras.filter((c) => c.status === cameraStatusFilter);

  const counts = {
    online:  cameras.filter((c) => c.status === 'online').length,
    warning: cameras.filter((c) => c.status === 'warning').length,
    offline: cameras.filter((c) => c.status === 'offline').length,
  };

  return (
    <PageWrapper className="space-y-6 font-body">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">Optical Feed Grid</h1>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">
            Monitoring <span className="text-[var(--brand-cyan)] font-bold">{cameras.length}</span> optical nodes across Prayagraj
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>{counts.online} Online</Badge>
          <Badge variant="warning" dot>{counts.warning} Degraded</Badge>
          <Badge variant="danger"  dot>{counts.offline} Offline</Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'online', 'warning', 'offline'] as const).map((s) => (
          <FilterPill
            key={s}
            label={s === 'all' ? 'All Feeds' : s}
            active={cameraStatusFilter === s}
            onClick={() => setCameraStatusFilter(s)}
          />
        ))}
      </div>

      {/* Camera Card Grid with Framer Motion Stagger */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      >
        {filtered.map((camera) => (
          <motion.div variants={itemVariants} key={camera.id} className="h-full">
            <CameraCard camera={camera} />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <CameraIcon size={44} className="mx-auto mb-3 text-[var(--brand-cyan)]/20" />
          <p className="text-xs font-mono text-[var(--text-secondary)]">No cameras match the current filter</p>
        </div>
      )}
    </PageWrapper>
  );
}
