'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import {
  Map as MapIcon,
  Layers,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  Columns2,
  Maximize2,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cameraService } from '@/services/cameraService';
import { roadService } from '@/services/roadService';
import { useFilterStore } from '@/store/filterStore';
import { cn } from '@/lib/utils';
import type { Camera } from '@/types';

// Dynamic import for MapLibre map (SSR disabled)
const NagarMapLibre = dynamic(
  () => import('@/components/map/NagarMapLibre').then((m) => ({ default: m.NagarMapLibre })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] flex items-center justify-center bg-[#080a10] rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
          <span className="text-xs font-mono uppercase tracking-wider text-white/50">
            Initializing MapLibre GL Engine...
          </span>
        </div>
      </div>
    ),
  }
);

// Dynamic import for Legacy Leaflet Map (SSR disabled)
const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[520px] flex items-center justify-center bg-[#080a10] rounded-2xl">
        <span className="text-xs font-mono uppercase tracking-wider text-white/50">
          Loading Legacy Leaflet Map...
        </span>
      </div>
    ),
  }
);

function LayerPill({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'text-xs font-mono px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center gap-1.5 select-none',
        active
          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
          : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:border-white/20'
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-cyan-400' : 'bg-white/20')} />
      {label}
    </button>
  );
}

export default function MapTestPage() {
  const [viewMode, setViewMode] = useState<'maplibre' | 'leaflet' | 'split'>('maplibre');

  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: cameraService.getCameras,
  });

  const { data: roads = [] } = useQuery({
    queryKey: ['roads'],
    queryFn: roadService.getRoads,
  });

  const {
    showHeatmap,
    toggleHeatmap,
    showTrajectories,
    toggleTrajectories,
    showTrafficDensity,
    toggleTrafficDensity,
  } = useFilterStore();

  const onlineCameras = cameras.filter((c: Camera) => c.status === 'online').length;

  return (
    <PageWrapper className="space-y-6 font-body">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success" dot pulse size="sm">
              NEW IMPLEMENTATION
            </Badge>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Isolated Test Bench
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display flex items-center gap-2.5">
            <MapIcon size={24} className="text-cyan-400" />
            NagarMapLibre Engine Preview
          </h1>
          <p className="text-xs font-mono text-white/50 mt-0.5 uppercase tracking-wider">
            OpenFreeMap Dark · 100% Free &amp; Open Source · Zero API Key Watermark
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setViewMode('maplibre')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              viewMode === 'maplibre'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-white/60 hover:text-white'
            )}
          >
            <Zap size={13} className="text-cyan-400" />
            MapLibre GL (New)
          </button>

          <button
            onClick={() => setViewMode('leaflet')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              viewMode === 'leaflet'
                ? 'bg-white/15 text-white border border-white/30'
                : 'text-white/60 hover:text-white'
            )}
          >
            Leaflet (Legacy)
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              viewMode === 'split'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-400/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'text-white/60 hover:text-white'
            )}
          >
            <Columns2 size={13} className="text-violet-400" />
            Side-by-Side
          </button>
        </div>
      </div>

      {/* ── Layer Controls & Telemetry Bar ──────────────────────────── */}
      <GlassCard padding="sm" className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-display font-semibold text-white/60 flex items-center gap-1.5 mr-1">
            <Layers size={14} className="text-cyan-400" /> Layer Overlays:
          </span>
          <LayerPill label="Traffic Density" active={showTrafficDensity} onToggle={toggleTrafficDensity} />
          <LayerPill label="Density Heatmap" active={showHeatmap} onToggle={toggleHeatmap} />
          <LayerPill label="Trajectory Vectors" active={showTrajectories} onToggle={toggleTrajectories} />
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-white/60">
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-[#00f59b]" />
            <span>
              <strong className="text-white">{cameras.length}</strong> Camera Nodes (
              <span className="text-[#00f59b]">{onlineCameras} live</span>)
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-cyan-400" />
            <span>
              <strong className="text-white">{roads.length}</strong> Trajectory Corridors
            </span>
          </div>
        </div>
      </GlassCard>

      {/* ── Main Map Canvas Area ─────────────────────────────────────── */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* MapLibre Side */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold px-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} /> MapLibre GL · OpenFreeMap Dark (No Watermark)
              </span>
              <span className="text-[10px] text-white/40">GPU ACCELERATED</span>
            </div>
            <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#080a10] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
              <NagarMapLibre cameras={cameras} />
            </div>
          </div>

          {/* Leaflet Side */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-white/70 font-bold px-1">
              <span>Leaflet + CARTO Basemap (Untouched Legacy)</span>
              <span className="text-[10px] text-rose-400/80">HAS CARTO WATERMARK</span>
            </div>
            <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#080a10] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
              <MapView cameras={cameras} />
            </div>
          </div>
        </div>
      ) : viewMode === 'maplibre' ? (
        <div className="space-y-2">
          <div className="h-[580px] w-full rounded-2xl overflow-hidden border border-cyan-500/25 bg-[#080a10] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            <NagarMapLibre cameras={cameras} />
            {/* Subtle inner cinematic vignette */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)]" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-[580px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#080a10] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            <MapView cameras={cameras} />
          </div>
        </div>
      )}

      {/* ── Technical Diagnostics & Verification Matrix ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard padding="md">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <ShieldCheck size={16} />
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-white">
              Basemap Engine &amp; Cost
            </h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-body">
            Powered by <strong>OpenFreeMap Dark</strong> (<code className="text-cyan-300">tiles.openfreemap.org</code>). Completely open source, free to use, and eliminates all CARTO &quot;API KEY REQUIRED&quot; watermarks without any subscription.
          </p>
        </GlassCard>

        <GlassCard padding="md">
          <div className="flex items-center gap-2 mb-2 text-[#00f59b]">
            <CheckCircle2 size={16} />
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-white">
              Backend Integrity
            </h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-body">
            100% consuming live backend APIs (<code className="text-[#00f59b]">/cameras</code> and <code className="text-[#00f59b]">/roads</code>). Zero fake/mock data in production. Node telemetry and coordinate systems remain completely unchanged.
          </p>
        </GlassCard>

        <GlassCard padding="md">
          <div className="flex items-center gap-2 mb-2 text-violet-400">
            <Zap size={16} />
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-white">
              Legacy Isolation
            </h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed font-body">
            The existing Leaflet implementation in <code className="text-violet-300">MapView.tsx</code> has been left completely untouched. You can test and benchmark both implementations concurrently with zero risk.
          </p>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
