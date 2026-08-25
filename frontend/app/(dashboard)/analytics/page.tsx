'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Car, Gauge, TrendingUp, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { StatCard }    from '@/components/ui/StatCard';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { Button }      from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { analyticsService } from '@/services/analyticsService';

const AreaChartWrapper = dynamic(
  () => import('@/components/charts/AreaChartWrapper').then((m) => ({ default: m.AreaChartWrapper })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const BarChartWrapper = dynamic(
  () => import('@/components/charts/BarChartWrapper').then((m) => ({ default: m.BarChartWrapper })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function ChartSkeleton() {
  return (
    <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin mb-2" />
      <span>Loading Telemetry Curve...</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'today' | '24h' | '7d' | '30d'>('today');
  const analyticsWindow = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    if (timeRange === 'today') from.setHours(0, 0, 0, 0);
    if (timeRange === '24h') from.setHours(from.getHours() - 24);
    if (timeRange === '7d') from.setDate(from.getDate() - 7);
    if (timeRange === '30d') from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [timeRange]);
  const { data: stats, refetch, isFetching } = useQuery({ queryKey: ['trafficStats', analyticsWindow], queryFn: () => analyticsService.getTrafficStats(analyticsWindow) });
  const { data: hourlyData = [] }   = useQuery({ queryKey: ['hourlyTraffic', analyticsWindow],  queryFn: () => analyticsService.getHourlyTraffic(analyticsWindow) });
  const { data: cameraTraffic = [] } = useQuery({ queryKey: ['cameraTraffic', analyticsWindow],  queryFn: () => analyticsService.getCameraTraffic(analyticsWindow) });
  const { data: busiestRoads = [] }  = useQuery({ queryKey: ['busiestRoads', analyticsWindow],  queryFn: () => analyticsService.getBusiestRoads(analyticsWindow) });
  const { data: anomalies = [] }    = useQuery({ queryKey: ['anomalies'],     queryFn: analyticsService.getTrafficAnomalies });

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      timeRange,
      stats,
      hourlyTraffic: hourlyData,
      cameraTraffic,
      busiestRoads,
      anomalies,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UrbanPulse_Traffic_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PageWrapper className="space-y-6 font-body">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">Traffic Analytics</h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
            City-wide traffic density · Diurnal volume curves · Congestion indexing
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-display">
            {(['today', '24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[10px] font-bold transition-all ${
                  timeRange === range
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin text-cyan-400' : ''} />
            Sync
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportReport}
            className="text-xs"
          >
            <Download size={13} />
            Export Intel
          </Button>
        </div>
      </div>

      {/* Multi-Color KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`Total Volume (${timeRange})`} value={stats?.totalVehiclesToday?.toLocaleString('en-IN') ?? 0} icon={Car} colorTheme="violet" />
        <StatCard label="Network Velocity"   value={stats ? `${stats.avgSpeed} km/h` : '—'} icon={Gauge} colorTheme="cyan" />
        <StatCard label="Congestion Index"  value={stats?.congestionIndex ?? 0} icon={TrendingUp} subtitle="/ 100 max density" colorTheme="amber" />
        <StatCard label="Incident Anomalies" value={stats?.incidentsToday ?? 0} icon={AlertTriangle} colorTheme="rose" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard accent="violet" glow="violet">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-300">
              Hourly Vehicle Distribution
            </p>
            <Badge variant="violet" size="sm">Diurnal Curve</Badge>
          </div>
          <AreaChartWrapper data={hourlyData} dataKey="vehicles" xAxisKey="hour" color="#8b5cf6" gradientId="vehiclesGrad" />
        </GlassCard>

        <GlassCard accent="cyan" glow="cyan">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-300">
              Traffic Density by Camera Station
            </p>
            <Badge variant="cyan" size="sm">{cameraTraffic.length} Sensor Nodes</Badge>
          </div>
          <BarChartWrapper data={cameraTraffic} dataKey="vehicleCount" xAxisKey="cameraName" color="#06b6d4" />
        </GlassCard>
      </div>

      {/* Corridors + Anomalies Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Busiest Corridors */}
        <GlassCard accent="emerald" glow="emerald">
          <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-300 mb-4">
            Busiest Transit Corridors
          </p>
          <div className="space-y-4">
            {busiestRoads.map((road, i) => (
              <div key={road.id} className="flex items-center gap-3.5">
                <span className="text-xs font-mono text-cyan-400 font-extrabold w-6 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white truncate font-display">{road.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2 font-semibold">
                      {road.vehicleCount.toLocaleString()} detections
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                      style={{ width: `${(road.vehicleCount / (busiestRoads[0]?.vehicleCount || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <Badge
                  variant={road.congestionLevel === 'congested' ? 'danger' : road.congestionLevel === 'high' ? 'warning' : 'success'}
                  size="sm"
                >
                  {road.congestionLevel}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Traffic Anomalies */}
        <GlassCard accent="amber" glow="amber">
          <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-300 mb-4">
            Automated Anomaly Detection
          </p>
          <div className="space-y-3.5">
            {anomalies.map((a, i) => (
              <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white leading-snug font-normal font-body">{a}</p>
              </div>
            ))}
            {anomalies.length === 0 && (
              <p className="text-center text-xs font-mono text-slate-500 py-8">No active traffic anomalies detected</p>
            )}
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
