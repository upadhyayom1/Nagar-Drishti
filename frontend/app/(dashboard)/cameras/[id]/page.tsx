'use client';

import { use, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Video, MapPin, Clock, Activity, Maximize2, Minimize2, Car, Radio } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { cameraService } from '@/services/cameraService';
import { formatTime, formatDateTime } from '@/lib/utils';
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
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Connecting Sensor Stream...</span>
      </div>
    </PageWrapper>
  );

  const statusVariant = camera.status === 'online' ? 'success' : camera.status === 'warning' ? 'warning' : 'danger';

  return (
    <PageWrapper className="space-y-6 font-body">
      <Link href="/cameras" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors">
        <ArrowLeft size={14} /> Back to Optical Feed Grid
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-display">{camera.name}</h1>
            <Badge variant={statusVariant} dot pulse={camera.status === 'online'} size="md">{camera.status}</Badge>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">{camera.location} · Sector Zone: {camera.zone}</p>
        </div>
        <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-3.5 py-1.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          NODE: {camera.id}
        </span>
      </div>

      <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        <div className={`space-y-4 ${isFullscreen ? '' : 'lg:col-span-2'}`}>
          {/* Main Optical Video Stream */}
          <GlassCard padding="none" className="relative aspect-video overflow-hidden">
            <div className="absolute inset-0 bg-[#050711] flex items-center justify-center">
              <Video size={64} className="text-cyan-500/20" />
            </div>

            {/* Scan-line overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-cyan-500/[0.06] pointer-events-none" />

            {/* Neural ANPR Bounding Boxes */}
            <div className="absolute inset-0">
              <div className="absolute border-2 border-cyan-400 rounded-sm shadow-[0_0_15px_rgba(6,182,212,0.7)]" style={{ left: '22%', top: '44%', width: '13%', height: '18%' }}>
                <span className="absolute -top-5 left-0 text-[9px] font-mono bg-cyan-400 text-slate-950 px-1.5 py-0.5 rounded-sm whitespace-nowrap font-extrabold">
                  TN38AB1234 · 98.4%
                </span>
              </div>
              <div className="absolute border-2 border-sky-400 rounded-sm shadow-[0_0_12px_rgba(56,189,248,0.6)]" style={{ left: '56%', top: '48%', width: '11%', height: '16%' }}>
                <span className="absolute -top-5 left-0 text-[9px] font-mono bg-sky-400 text-slate-950 px-1.5 py-0.5 rounded-sm whitespace-nowrap font-extrabold">
                  TN09CD5678 · 91.2%
                </span>
              </div>
              <div className="absolute border-2 border-amber-400 rounded-sm shadow-[0_0_12px_rgba(251,191,36,0.6)]" style={{ left: '74%', top: '42%', width: '9%', height: '14%' }}>
                <span className="absolute -top-5 left-0 text-[9px] font-mono bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-sm whitespace-nowrap font-extrabold">
                  TN10EF9012 · 76.5%
                </span>
              </div>
            </div>

            {/* Live Overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge variant="danger" dot pulse size="sm">LIVE</Badge>
              <span className="text-[10px] font-mono bg-black/80 backdrop-blur-sm px-2.5 py-0.5 rounded-lg text-white font-bold border border-white/10">
                {camera.fps} FPS
              </span>
            </div>

            {/* Fullscreen Toggle */}
            <div className="absolute top-3 right-3">
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand Feed'}
                className="p-2 bg-black/80 backdrop-blur-sm rounded-xl hover:bg-cyan-500/20 transition-all text-slate-400 hover:text-cyan-400 border border-white/10 hover:border-cyan-500/40"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            <div className="absolute bottom-3 left-3">
              <span className="text-[10px] font-mono bg-black/80 backdrop-blur-sm px-3 py-1 rounded-xl text-cyan-400 font-extrabold border border-cyan-500/30 shadow-lg">
                {camera.id} · LAT {camera.lat.toFixed(4)}, LNG {camera.lng.toFixed(4)}
              </span>
            </div>
          </GlassCard>

          {/* Node Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Vehicles Sighted', value: String(camera.vehiclesDetected), icon: Car,      color: 'text-cyan-400' },
              { label: 'Traffic Density',   value: camera.trafficLevel,             icon: Activity, color: 'text-violet-400' },
              { label: 'GPS Coordinates',   value: `${camera.lat.toFixed(3)}, ${camera.lng.toFixed(3)}`, icon: MapPin, color: 'text-emerald-400' },
              { label: 'Telemetry Synced',  value: formatTime(camera.lastUpdated),  icon: Clock,    color: 'text-amber-400' },
            ].map((s) => (
              <GlassCard key={s.label} padding="sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <s.icon size={11} className={s.color} />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">{s.label}</span>
                </div>
                <span className="text-sm font-mono text-white font-extrabold">{s.value}</span>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Recent Detections */}
        {!isFullscreen && (
          <GlassCard padding="sm" className="flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-white/10">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Radio size={13} className="text-cyan-400" />
                Optical Detections ({detections.length})
              </p>
              <Badge variant="info" size="sm">ANPR</Badge>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {detections.length === 0 ? (
                <p className="text-xs font-mono text-center text-slate-500 py-10">No detections recorded on this node</p>
              ) : (
                detections.map((d: Detection) => (
                  <Link
                    key={d.id}
                    href={`/vehicles/${d.vehiclePlate}`}
                    className="block p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-cyan-400/40 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-cyan-400 font-extrabold">{d.vehiclePlate}</span>
                      <span className="text-[10px] font-mono text-slate-400">{formatTime(d.timestamp)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>{d.vehicleType} · {d.direction}</span>
                      <span className="text-violet-400 font-bold">{d.confidence}% Conf</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Velocity: <span className="text-white font-bold">{d.speed} km/h</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </PageWrapper>
  );
}
