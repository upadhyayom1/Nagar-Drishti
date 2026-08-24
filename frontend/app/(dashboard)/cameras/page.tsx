'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Camera as CameraIcon, Video, Activity, Clock, Wifi, WifiOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService } from '@/services/cameraService';
import { formatTime } from '@/lib/utils';
import { useFilterStore } from '@/store/filterStore';
import type { Camera } from '@/types';

function CameraCard({ camera }: { camera: Camera }) {
  const statusVariant = camera.status === 'online' ? 'success' : camera.status === 'warning' ? 'warning' : 'danger';
  const statusIcon = camera.status === 'offline' ? <WifiOff size={14} /> : <Wifi size={14} />;

  return (
    <Link href={`/cameras/${camera.id}`}>
      <GlassCard hover className="h-full">
        {/* Thumbnail Placeholder */}
        <div className="relative aspect-video bg-bg-void rounded-lg mb-3 overflow-hidden border border-border-glass">
          <div className="absolute inset-0 flex items-center justify-center">
            <Video size={32} className="text-text-secondary/30" />
          </div>
          {/* Status indicator */}
          <div className="absolute top-2 left-2">
            <Badge variant={statusVariant} size="sm" dot pulse={camera.status === 'online'}>
              {camera.status}
            </Badge>
          </div>
          {/* FPS counter */}
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-data bg-black/60 px-1.5 py-0.5 rounded text-text-primary">
              {camera.fps} FPS
            </span>
          </div>
          {/* Camera ID */}
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] font-data bg-black/60 px-1.5 py-0.5 rounded text-accent-cyan">
              {camera.id}
            </span>
          </div>
        </div>

        {/* Camera Info */}
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold font-display text-text-primary truncate">{camera.name}</h3>
            <p className="text-xs text-text-secondary truncate">{camera.location}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <CameraIcon size={12} />
              <span>Zone {camera.zone}</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Activity size={12} />
              <span className="font-data">{camera.vehiclesDetected}</span>
              <span>vehicles</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-secondary pt-1 border-t border-border-glass">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              Last: <span className="font-data">{formatTime(camera.lastUpdated)}</span>
            </span>
            <Badge
              variant={camera.trafficLevel === 'congested' ? 'danger' : camera.trafficLevel === 'high' ? 'warning' : 'default'}
              size="sm"
            >
              {camera.trafficLevel}
            </Badge>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export default function CamerasPage() {
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => cameraService.getCameras(),
  });

  const { cameraStatusFilter, setCameraStatusFilter } = useFilterStore();

  const filteredCameras = cameraStatusFilter === 'all'
    ? cameras
    : cameras.filter(c => c.status === cameraStatusFilter);

  const onlineCount = cameras.filter(c => c.status === 'online').length;
  const warningCount = cameras.filter(c => c.status === 'warning').length;
  const offlineCount = cameras.filter(c => c.status === 'offline').length;

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Live Cameras</h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitoring <span className="font-data text-text-primary">{cameras.length}</span> camera feeds across the city
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="success" dot>{onlineCount} Online</Badge>
            <Badge variant="warning" dot>{warningCount} Warning</Badge>
            <Badge variant="danger" dot>{offlineCount} Offline</Badge>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'online', 'warning', 'offline'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setCameraStatusFilter(status)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-150 capitalize ${
              cameraStatusFilter === status
                ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                : 'border-border-glass bg-surface-glass text-text-secondary hover:text-text-primary'
            }`}
          >
            {status === 'all' ? 'All Cameras' : status}
          </button>
        ))}
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCameras.map((camera) => (
          <CameraCard key={camera.id} camera={camera} />
        ))}
      </div>

      {filteredCameras.length === 0 && !isLoading && (
        <div className="text-center py-12 text-text-secondary">
          <CameraIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p>No cameras match the current filter</p>
        </div>
      )}
    </PageWrapper>
  );
}
