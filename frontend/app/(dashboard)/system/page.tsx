'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Radio, Server, WifiOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard } from '@/components/ui/StatCard';
import { analyticsService } from '@/services/analyticsService';
import { formatDateTime } from '@/lib/utils';

function statusVariant(status: string): 'ok' | 'warn' | 'critical' {
  if (status === 'ONLINE') return 'ok';
  if (status === 'MAINTENANCE') return 'warn';
  return 'critical';
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">System Diagnostics</h1>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">Persisted camera health and backend telemetry</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="px-3.5 py-1.5 rounded-xl border border-cyan-500/30 text-xs font-display font-bold text-cyan-500 dark:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 transition-all cursor-pointer">
          {isFetching ? 'Refreshing…' : 'Refresh Telemetry'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Online Nodes" value={`${summary?.online ?? 0}/${summary?.total ?? 0}`} subtitle={`${summary?.warning ?? 0} maintenance`} isLoading={isLoading} icon={Server} colorTheme="emerald" />
        <StatCard label="Offline Nodes" value={(summary?.offline ?? 0)} subtitle="Camera dropouts" isLoading={isLoading} icon={WifiOff} colorTheme="rose" />
        <StatCard label="Average Response" value={(averageLatency === null ? '0 ms' : `${averageLatency} ms`)} subtitle="Roundtrip latency" isLoading={isLoading} icon={Activity} colorTheme="cyan" />
        <StatCard label="Active Alerts" value={(summary?.activeAlerts ?? 0)} subtitle="Alert queue" isLoading={isLoading} icon={AlertTriangle} colorTheme="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Radio size={13} className="text-cyan-500 dark:text-cyan-400 animate-pulse" /> Camera Health Telemetry
            </h2>
            <Badge variant="info" dot pulse size="sm">Active Grid</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[9px] font-mono uppercase tracking-wider font-semibold text-[var(--text-secondary)] border-b border-[var(--glass-border)] bg-white/[0.02]">
                <tr>
                  <th className="p-3.5">Camera</th>
                  <th className="p-3.5">Zone</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Latency</th>
                  <th className="p-3.5">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-cyan-500 dark:text-cyan-400 text-xs">{node.cameraCode}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-body">{node.name}</p>
                    </td>
                    <td className="p-3.5 text-xs text-[var(--text-primary)] font-medium font-body">{node.zone}</td>
                    <td className="p-3.5"><Badge variant={statusVariant(node.status)} size="sm" dot>{node.status.toLowerCase()}</Badge></td>
                    <td className="p-3.5 font-mono text-xs text-[var(--text-secondary)]">{node.responseMs === null ? '—' : `${node.responseMs} ms`}</td>
                    <td className="p-3.5 font-mono text-xs text-[var(--text-tertiary)]">{formatDateTime(node.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard padding="md" className="flex flex-col items-center justify-center text-center min-h-[260px]">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
          ) : summary?.offline ? (
            <>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                <AlertTriangle size={22} className="text-rose-500 dark:text-rose-400" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)] font-display mt-3">Attention Required</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-body">{summary.offline} node(s) reported offline.</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <CheckCircle size={22} className="text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)] font-display mt-3">All Systems Operational</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-body">{summary?.online ?? 0} optical nodes streaming nominal telemetry.</p>
            </>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
