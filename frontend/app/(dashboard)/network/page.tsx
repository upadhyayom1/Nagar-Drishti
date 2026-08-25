'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Route, Activity, Zap, TrendingUp, Radio } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard } from '@/components/ui/StatCard';
import { analyticsService } from '@/services/analyticsService';

const formatDuration = (seconds: number) => seconds ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : 'No observations';

export default function MovementNetworkPage() {
  const { data: network, isLoading } = useQuery({ queryKey: ['network'], queryFn: analyticsService.getNetwork, refetchInterval: 30_000 });
  const routes = network?.corridors ?? [];
  const summary = network?.summary;
  const totalFlow = routes.reduce((total, route) => total + route.volume, 0);
  const peak = routes[0];

  return (
    <PageWrapper className="space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">Movement Network</h1>
        <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-wider">Observed camera-to-camera vehicle transitions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Observed Corridors" value={summary?.corridorCount ?? 0} icon={Route} colorTheme="cyan" />
        <StatCard label="Avg Transit Time" value={formatDuration(summary?.averageTravelSeconds ?? 0)} icon={Activity} colorTheme="violet" />
        <StatCard label="Peak Corridor" value={summary?.peakVolume ?? 0} subtitle={peak ? `${peak.origin.code} → ${peak.destination.code}` : 'No observations'} icon={Zap} colorTheme="amber" />
        <StatCard label="Recorded Flow" value={totalFlow} subtitle="Stored transitions" icon={TrendingUp} colorTheme="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard padding="none" className="lg:col-span-2 flex flex-col">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2"><Route size={16} className="text-cyan-400" /> Major Transit Corridors</h2>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Database observations</span>
          </div>
          <div className="p-5 space-y-3.5">
            {isLoading ? <p className="text-xs font-mono text-slate-400">Loading transition data…</p> : routes.length === 0 ? <p className="text-xs font-mono text-slate-400">No camera-to-camera transitions have been recorded yet.</p> : routes.map((route) => (
              <div key={`${route.origin.id}-${route.destination.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/[0.07] hover:border-cyan-400/30 transition-all gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-cyan-400 font-extrabold">{route.origin.code} ({route.origin.name})</span>
                  <ArrowRightLeft size={14} className="text-slate-500 shrink-0" />
                  <span className="font-mono text-xs text-violet-400 font-extrabold">{route.destination.code} ({route.destination.name})</span>
                </div>
                <div className="flex items-center gap-6 justify-between sm:justify-end">
                  <div className="text-right"><div className="font-mono text-xs font-extrabold text-white">{route.volume.toLocaleString()} transitions</div><div className="text-[10px] text-slate-400 font-mono">Avg: {formatDuration(route.averageTravelSeconds)} · {route.averageSpeed} km/h</div></div>
                  <Badge variant="success" size="sm" dot>Observed</Badge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="md" className="flex flex-col">
          <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider mb-1">Origin-Destination Flow</h2>
          <p className="text-[10px] font-mono text-slate-400 mb-4">Transition records grouped by source and destination camera</p>
          <div className="flex-1 min-h-[260px] rounded-2xl bg-black/40 border border-white/[0.08] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3.5 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]"><Route size={28} /></div>
            <p className="text-xs font-bold text-white mb-1 font-display">{routes.length ? 'Observed Network Ready' : 'Awaiting Transitions'}</p>
            <p className="text-[10px] font-mono text-slate-400">{routes.length ? `${totalFlow.toLocaleString()} camera transitions are available for analysis.` : 'Generate historical data or ingest live detections to populate this view.'}</p>
            <div className="mt-4 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-extrabold uppercase tracking-widest flex items-center gap-1.5"><Radio size={11} className="animate-pulse" /> Backend stream</div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
