'use client';

import { ArrowRightLeft, Route, Activity, Zap, TrendingUp, Radio } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard }    from '@/components/ui/StatCard';

export default function MovementNetworkPage() {
  const routes = [
    { origin: 'CAM-001 (Anna Nagar)', dest: 'CAM-003 (T. Nagar)',     volume: 4520, time: '3m 12s', speed: '48 km/h', status: 'Optimal' },
    { origin: 'CAM-003 (T. Nagar)',   dest: 'CAM-006 (Guindy)',        volume: 3810, time: '5m 45s', speed: '32 km/h', status: 'Congested' },
    { origin: 'CAM-006 (Guindy)',     dest: 'CAM-009 (Kathipara)',     volume: 3240, time: '3m 50s', speed: '42 km/h', status: 'Optimal' },
    { origin: 'CAM-002 (Koyambedu)', dest: 'CAM-005 (Marina Beach)',  volume: 2905, time: '6m 10s', speed: '28 km/h', status: 'Congested' },
    { origin: 'CAM-007 (OMR Toll)',   dest: 'CAM-008 (Velachery)',     volume: 2150, time: '2m 30s', speed: '55 km/h', status: 'Optimal' },
  ];

  return (
    <PageWrapper className="space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">Movement Network</h1>
        <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
          Inter-node transit analytics · Origin-Destination vehicle flow mapping
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Major Corridors"   value="12 Active" icon={Route}      colorTheme="cyan" />
        <StatCard label="Avg Transit Time"  value="4.2 min"   icon={Activity}   colorTheme="violet" />
        <StatCard label="Peak Corridor"     value="4,520/hr"  icon={Zap}        subtitle="Anna Nagar → T. Nagar" colorTheme="amber" />
        <StatCard label="Network Flow Rate" value="94.2%"     icon={TrendingUp} trend={{ value: 4.1, isPositive: true }} colorTheme="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Major Transit Corridors Table */}
        <GlassCard padding="none" className="lg:col-span-2 flex flex-col">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Route size={16} className="text-cyan-400" />
              Major Transit Corridors
            </h2>
            <span className="text-[10px] font-mono text-slate-400 font-bold">Live Throughput Index</span>
          </div>

          <div className="p-5 space-y-3.5">
            {routes.map((route, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/[0.07] hover:border-cyan-400/30 transition-all gap-4"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-cyan-400 font-extrabold">{route.origin}</span>
                  <ArrowRightLeft size={14} className="text-slate-500 shrink-0" />
                  <span className="font-mono text-xs text-violet-400 font-extrabold">{route.dest}</span>
                </div>

                <div className="flex items-center gap-6 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="font-mono text-xs font-extrabold text-white">{route.volume.toLocaleString()} veh/hr</div>
                    <div className="text-[10px] text-slate-400 font-mono">Avg: {route.time} · {route.speed}</div>
                  </div>
                  <Badge variant={route.status === 'Congested' ? 'danger' : 'success'} size="sm" dot>
                    {route.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Flow Visualizer Panel */}
        <GlassCard padding="md" className="flex flex-col">
          <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider mb-1">
            Origin-Destination Flow
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mb-4">
            Markov inter-zone transition density
          </p>

          <div className="flex-1 min-h-[260px] rounded-2xl bg-black/40 border border-white/[0.08] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3.5 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
              <Route size={28} />
            </div>
            <p className="text-xs font-bold text-white mb-1 font-display">Spatial Matrix Interpolator</p>
            <p className="text-[10px] font-mono text-slate-400">
              Correlating 10 optical sensor feeds in real-time
            </p>
            <div className="mt-4 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Radio size={11} className="animate-pulse" />
              Live Stream Active
            </div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}