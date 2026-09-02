'use client';

import { use, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Video, MapPin, Clock, Activity, Maximize2, Minimize2, Car, Radio, Zap } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService } from '@/services/cameraService';
import { formatTime } from '@/lib/utils';
import { getCameraFeedImage } from '@/lib/cameraImages';
import type { Detection } from '@/types';

export default function CameraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: camera }          = useQuery({ queryKey: ['camera', id],     queryFn: () => cameraService.getCameraById(id) });
  const { data: detections = [] } = useQuery({ queryKey: ['detections', id], queryFn: () => cameraService.getDetectionsByCamera(id) });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  if (!camera) return (
    <PageWrapper className="flex items-center justify-center min-h-[450px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Radio size={14} className="animate-pulse" /> Synchronizing Neural Optical Feed...
        </span>
      </div>
    </PageWrapper>
  );

  const statusVariant = camera.status === 'online' ? 'ok' : camera.status === 'warning' ? 'warn' : 'critical';

  return (
    <PageWrapper className="space-y-6 font-body">
      <Link href="/cameras" className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-cyan-400 transition-colors">
        <ArrowLeft size={14} /> Back to Live Cameras
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">{camera.name}</h1>
            <Badge variant={statusVariant} dot pulse={camera.status === 'online'} size="md">{camera.status}</Badge>
          </div>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">{camera.location} · Sector Zone: {camera.zone}</p>
        </div>
        <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-3.5 py-1.5 rounded-xl border border-cyan-400/30 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
          NODE: {camera.id}
        </span>
      </div>

      <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        <div className={`space-y-4 ${isFullscreen ? '' : 'lg:col-span-2'}`}>
          {/* Main Optical Video Stream with Simulated Bounding Box + OCR Overlays */}
          <GlassCard padding="none" className="relative aspect-video overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.15)] rounded-3xl">
            <div className="absolute inset-0 bg-[#060913] flex items-center justify-center">
              <img
                src={getCameraFeedImage(camera.cameraCode, camera.name).url}
                alt={camera.name}
                className="w-full h-full object-cover brightness-[0.88] contrast-[1.05]"
              />
            </div>

            {/* Glowing Scan-line sweep animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/[0.04] to-cyan-400/[0.1] pointer-events-none" />
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 animate-pulse pointer-events-none" style={{ top: '35%' }} />

            {/* Simulated Bounding Box + OCR Plate Readout Overlays with Neon Halos */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute border-2 border-cyan-400 rounded shadow-[0_0_15px_rgba(0,240,255,0.8)]" style={{ left: '22%', top: '44%', width: '14%', height: '20%' }}>
                <span className="absolute -top-5 left-0 text-[9px] font-mono bg-cyan-400 text-[#060913] px-1 py-0.5 rounded-sm whitespace-nowrap font-bold shadow-md">TN38AB1234 · 95%</span>
              </div>
              <div className="absolute border-2 border-fuchsia-500 rounded shadow-[0_0_15px_rgba(236,72,153,0.8)]" style={{ left: '56%', top: '48%', width: '12%', height: '18%' }}>
                <span className="absolute -top-5 left-0 text-[9px] font-mono bg-fuchsia-500 text-white px-1 py-0.5 rounded-sm whitespace-nowrap font-bold shadow-md">UP70CD5678 · 88%</span>
              </div>
              <div className="absolute border-2 border-amber-400 rounded shadow-[0_0_15px_rgba(245,158,11,0.8)]" style={{ left: '74%', top: '42%', width: '9%', height: '14%' }}>
                <span className="absolute -top-5 left-0 text-[9px] font-mono bg-amber-400 text-[#060913] px-1 py-0.5 rounded-sm whitespace-nowrap font-bold shadow-md">UP70EF9012 · 76%</span>
              </div>
            </div>

            {/* Live Status Indicators */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge variant="critical" dot pulse size="sm">LIVE</Badge>
              <span className="text-[10px] font-mono bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-white font-bold border border-white/15">
                {camera.detectionCount} detections
              </span>
            </div>

            {/* Fullscreen Toggle */}
            <div className="absolute top-3 right-3">
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand Feed'}
                className="p-2 bg-black/80 backdrop-blur-md rounded-xl hover:bg-cyan-500/20 transition-all text-[var(--text-secondary)] hover:text-cyan-400 border border-white/10 hover:border-cyan-400/40"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            <div className="absolute bottom-3 left-3">
              <span className="text-[10px] font-mono bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-cyan-400 font-bold border border-cyan-400/30 shadow-lg">
                {camera.cameraCode} · LAT {camera.lat.toFixed(4)}, LNG {camera.lng.toFixed(4)}
              </span>
            </div>
          </GlassCard>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <GlassCard padding="sm" glow="cyan" className="p-3.5">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                <Car size={13} className="text-cyan-400" />
                <span className="text-[9px] font-mono uppercase tracking-wider font-semibold">Total Detected</span>
              </div>
              <span className="text-lg font-bold font-data tabular-nums text-[var(--text-primary)]">{camera.vehiclesDetected}</span>
            </GlassCard>

            <GlassCard padding="sm" glow="emerald" className="p-3.5">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                <Activity size={13} className="text-emerald-400" />
                <span className="text-[9px] font-mono uppercase tracking-wider font-semibold">Traffic Density</span>
              </div>
              <span className="text-lg font-bold font-display text-[var(--text-primary)] capitalize">{camera.trafficLevel}</span>
            </GlassCard>

            <GlassCard padding="sm" glow="violet" className="p-3.5">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                <MapPin size={13} className="text-violet-400" />
                <span className="text-[9px] font-mono uppercase tracking-wider font-semibold">Sector Coordinates</span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{camera.lat.toFixed(3)}, {camera.lng.toFixed(3)}</span>
            </GlassCard>

            <GlassCard padding="sm" glow="amber" className="p-3.5">
              <div className="flex items-center gap-1.5 text-[var(--text-secondary)] mb-1">
                <Clock size={13} className="text-amber-400" />
                <span className="text-[9px] font-mono uppercase tracking-wider font-semibold">Telemetry Sync</span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{formatTime(camera.lastUpdated)}</span>
            </GlassCard>
          </div>
        </div>

        {/* Real-time Detections Side Panel */}
        {!isFullscreen && (
          <GlassCard padding="sm" glow="cyan" className="flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--glass-border)]">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <Zap size={14} className="text-cyan-400" /> Recent Sighting Events
              </h3>
              <Badge variant="info" size="sm">{detections.length}</Badge>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {detections.map((d: Detection) => (
                <Link
                  key={d.id}
                  href={`/vehicles/${d.vehiclePlate}`}
                  className="block p-3 rounded-xl bg-white/[0.03] border border-[var(--glass-border)] hover:border-cyan-400/50 hover:bg-white/[0.06] hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400">{d.vehiclePlate}</span>
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{formatTime(d.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                    <span>{d.vehicleType} · {d.direction}</span>
                    <span className="text-emerald-400 font-bold">{d.confidence}% match</span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-tertiary)] mt-1 flex justify-between">
                    <span>Velocity: <strong className="text-[var(--text-primary)]">{d.speed} km/h</strong></span>
                  </div>
                </Link>
              ))}

              {detections.length === 0 && (
                <p className="text-center text-xs font-mono text-[var(--text-tertiary)] py-12">No recent detection events</p>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </PageWrapper>
  );
}
