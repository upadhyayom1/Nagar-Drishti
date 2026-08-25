'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Radio, Server, WifiOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard } from '@/components/ui/StatCard';
import { analyticsService } from '@/services/analyticsService';
import { formatDateTime } from '@/lib/utils';

function statusVariant(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'ONLINE') return 'success';
  if (status === 'MAINTENANCE') return 'warning';
  return 'danger';
}

export default function SystemDiagnosticsPage() {
  const { data: health, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: analyticsService.getSystemHealth,
    refetchInterval: 30_000,
  });
  const nodes = health?.nodes ?? [];
  const summary = health?.summary;
  const responsiveNodes = nodes.filter((node) => Number.isFinite(node.responseMs));
  const averageLatency = responsiveNodes.length
    ? Math.round(responsiveNodes.reduce((total, node) => total + (node.responseMs || 0), 0) / responsiveNodes.length)
    : null;

  return (
    <PageWrapper className="space-y-6 font-body">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">System Diagnostics</h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-wider">Persisted camera health and backend telemetry</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="px-3 py-2 rounded-xl border border-cyan-500/30 text-xs font-display font-bold text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50">
          {isFetching ? 'Refreshing…' : 'Refresh telemetry'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Online Nodes" value={`${summary?.online ?? 0}/${summary?.total ?? 0}`} subtitle={`${summary?.warning ?? 0} maintenance`} icon={Server} colorTheme="emerald" />
        <StatCard label="Offline Nodes" value={summary?.offline ?? 0} subtitle="Recorded camera status" icon={WifiOff} colorTheme="rose" />
        <StatCard label="Average Response" value={averageLatency === null ? '—' : `${averageLatency} ms`} subtitle="Latest health record" icon={Activity} colorTheme="cyan" />
        <StatCard label="Active Alerts" value={summary?.activeAlerts ?? 0} subtitle="Backend alert queue" icon={AlertTriangle} colorTheme="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2"><Radio size={14} className="text-cyan-400" /> Camera Health Telemetry</h2>
            <Badge variant="info" dot pulse size="sm">Database-backed</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 border-b border-white/10">
                <tr style={{ background: 'rgba(5,7,17,0.7)' }}><th className="p-4">Camera</th><th className="p-4">Location</th><th className="p-4">Status</th><th className="p-4">Response</th><th className="p-4">Last update</th></tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-4"><p className="font-mono font-extrabold text-cyan-400 text-xs">{node.cameraCode}</p><p className="text-[10px] text-slate-500 mt-1">{node.name}</p></td>
                    <td className="p-4 text-xs text-white font-semibold font-display">{node.zone}</td>
                    <td className="p-4"><Badge variant={statusVariant(node.status)} size="sm" dot>{node.status.toLowerCase()}</Badge></td>
                    <td className="p-4 font-mono text-xs text-slate-400">{node.responseMs === null ? '—' : `${node.responseMs} ms`}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{formatDateTime(node.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard padding="md" className="flex flex-col items-center justify-center text-center min-h-[280px]">
          {isLoading ? <div className="w-8 h-8 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" /> : summary?.offline ? (
            <><div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25"><AlertTriangle size={24} className="text-rose-400" /></div><p className="text-sm font-bold text-white font-display mt-4">Attention Required</p><p className="text-xs text-slate-400 mt-2">{summary.offline} camera node{summary.offline === 1 ? '' : 's'} reported offline in the latest backend health record.</p></>
          ) : (
            <><div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25"><CheckCircle size={24} className="text-emerald-400" /></div><p className="text-sm font-bold text-white font-display mt-4">No Offline Nodes</p><p className="text-xs text-slate-400 mt-2">This status reflects the latest stored camera health records.</p></>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
