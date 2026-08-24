'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Video, MapPin, Clock, Activity, Maximize2, Car } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService } from '@/services/cameraService';
import { formatTime, formatDateTime } from '@/lib/utils';
import type { Detection } from '@/types';

export default function CameraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: camera } = useQuery({
    queryKey: ['camera', id],
    queryFn: () => cameraService.getCameraById(id),
  });

  const { data: detections = [] } = useQuery({
    queryKey: ['detections', id],
    queryFn: () => cameraService.getDetectionsByCamera(id),
  });

  if (!camera) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading camera data...</div>
      </PageWrapper>
    );
  }

  const statusVariant = camera.status === 'online' ? 'success' : camera.status === 'warning' ? 'warning' : 'danger';

  return (
    <PageWrapper className="space-y-6">
      {/* Back Button */}
      <Link href="/cameras" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={16} />
        Back to Cameras
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-display">{camera.name}</h1>
            <Badge variant={statusVariant} dot pulse={camera.status === 'online'} size="md">
              {camera.status}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary mt-1">{camera.location} • {camera.zone}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-data text-xs text-text-secondary">{camera.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed Area */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard padding="none" className="relative aspect-video overflow-hidden">
            {/* Mock video background */}
            <div className="absolute inset-0 bg-bg-void flex items-center justify-center">
              <Video size={64} className="text-text-secondary/20" />
            </div>

            {/* Mock bounding boxes */}
            <div className="absolute inset-0">
              {/* Vehicle bounding box 1 */}
              <div
                className="absolute border-2 border-status-ok rounded"
                style={{ left: '20%', top: '45%', width: '12%', height: '18%' }}
              >
                <span className="absolute -top-5 left-0 text-[9px] font-data bg-status-ok/90 text-white px-1 py-0.5 rounded-sm whitespace-nowrap">
                  TN38AB1234 • 95%
                </span>
              </div>
              {/* Vehicle bounding box 2 */}
              <div
                className="absolute border-2 border-accent-cyan rounded"
                style={{ left: '55%', top: '50%', width: '10%', height: '15%' }}
              >
                <span className="absolute -top-5 left-0 text-[9px] font-data bg-accent-cyan/90 text-white px-1 py-0.5 rounded-sm whitespace-nowrap">
                  TN09CD5678 • 87%
                </span>
              </div>
              {/* Vehicle bounding box 3 */}
              <div
                className="absolute border-2 border-status-warn rounded"
                style={{ left: '72%', top: '40%', width: '8%', height: '12%' }}
              >
                <span className="absolute -top-5 left-0 text-[9px] font-data bg-status-warn/90 text-white px-1 py-0.5 rounded-sm whitespace-nowrap">
                  TN10EF9012 • 72%
                </span>
              </div>
            </div>

            {/* Overlay controls */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge variant="danger" dot pulse size="sm">LIVE</Badge>
              <span className="text-[10px] font-data bg-black/60 px-2 py-0.5 rounded text-text-primary">
                {camera.fps} FPS
              </span>
            </div>
            <div className="absolute top-3 right-3">
              <button className="p-1.5 bg-black/60 rounded hover:bg-black/80 transition-colors text-text-primary">
                <Maximize2 size={14} />
              </button>
            </div>
            <div className="absolute bottom-3 left-3">
              <span className="text-[10px] font-data bg-black/60 px-2 py-0.5 rounded text-accent-cyan">
                {camera.id} • {camera.name}
              </span>
            </div>
          </GlassCard>

          {/* Camera Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Vehicles Detected', value: camera.vehiclesDetected, icon: Car },
              { label: 'Traffic Level', value: camera.trafficLevel, icon: Activity },
              { label: 'Location', value: `${camera.lat.toFixed(3)}, ${camera.lng.toFixed(3)}`, icon: MapPin },
              { label: 'Last Updated', value: formatTime(camera.lastUpdated), icon: Clock },
            ].map((stat) => (
              <GlassCard key={stat.label} padding="sm">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon size={12} className="text-text-secondary" />
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">{stat.label}</span>
                </div>
                <span className="text-sm font-data text-text-primary">{stat.value}</span>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Recent Detections Panel */}
        <GlassCard padding="sm" className="h-fit">
          <h3 className="text-sm font-semibold font-display mb-3">Recent Detections</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {detections.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">No detections available</p>
            ) : (
              detections.map((detection: Detection) => (
                <Link
                  key={detection.id}
                  href={`/vehicles/${detection.vehiclePlate}`}
                  className="block p-2.5 rounded-lg bg-white/[0.02] border border-border-glass hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-data text-accent-cyan font-medium">{detection.vehiclePlate}</span>
                    <span className="text-[10px] font-data text-text-secondary">{formatTime(detection.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-secondary">
                    <span>{detection.vehicleType} • {detection.direction}</span>
                    <span className="font-data">{detection.confidence}% conf</span>
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5">
                    Speed: <span className="font-data text-text-primary">{detection.speed} km/h</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
