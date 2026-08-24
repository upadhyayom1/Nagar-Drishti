'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Car, Gauge, AlertTriangle, TrendingUp, MapPin, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { analyticsService } from '@/services/analyticsService';

// Dynamic chart imports to avoid SSR issues with container measurement
const AreaChartWrapper = dynamic(
  () => import('@/components/charts/AreaChartWrapper').then(mod => ({ default: mod.AreaChartWrapper })),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center text-text-secondary text-sm">Loading chart...</div> }
);
const BarChartWrapper = dynamic(
  () => import('@/components/charts/BarChartWrapper').then(mod => ({ default: mod.BarChartWrapper })),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center text-text-secondary text-sm">Loading chart...</div> }
);

export default function AnalyticsPage() {
  const { data: stats } = useQuery({
    queryKey: ['trafficStats'],
    queryFn: () => analyticsService.getTrafficStats(),
  });

  const { data: hourlyData = [] } = useQuery({
    queryKey: ['hourlyTraffic'],
    queryFn: () => analyticsService.getHourlyTraffic(),
  });

  const { data: cameraTraffic = [] } = useQuery({
    queryKey: ['cameraTraffic'],
    queryFn: () => analyticsService.getCameraTraffic(),
  });

  const { data: busiestRoads = [] } = useQuery({
    queryKey: ['busiestRoads'],
    queryFn: () => analyticsService.getBusiestRoads(),
  });

  const { data: anomalies = [] } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => analyticsService.getTrafficAnomalies(),
  });

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Traffic Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">City-wide traffic patterns, trends, and anomalies</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Vehicles" value={stats?.totalVehiclesToday?.toLocaleString() ?? '--'} icon={Car} trend={{ value: 8.2, isPositive: true }} accentColor="var(--accent-cyan)" />
        <StatCard label="Avg Speed" value={stats ? `${stats.avgSpeed} km/h` : '--'} icon={Gauge} trend={{ value: 3.1, isPositive: false }} accentColor="var(--accent-blue)" />
        <StatCard label="Congestion Index" value={stats?.congestionIndex ?? '--'} icon={TrendingUp} subtitle="out of 100" accentColor="var(--status-warn)" />
        <StatCard label="Incidents Today" value={stats?.incidentsToday ?? '--'} icon={AlertTriangle} accentColor="var(--status-critical)" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vehicles Per Hour */}
        <GlassCard>
          <h3 className="text-sm font-semibold font-display mb-4">Vehicles Per Hour</h3>
          <AreaChartWrapper data={hourlyData} dataKey="vehicles" xAxisKey="hour" color="#22d3ee" gradientId="vehiclesGradient" />
        </GlassCard>

        {/* Traffic by Camera */}
        <GlassCard>
          <h3 className="text-sm font-semibold font-display mb-4">Traffic Density by Camera</h3>
          <BarChartWrapper data={cameraTraffic} dataKey="vehicleCount" xAxisKey="cameraName" color="#5b8cff" />
        </GlassCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Busiest Roads */}
        <GlassCard>
          <h3 className="text-sm font-semibold font-display mb-4">Busiest Roads</h3>
          <div className="space-y-3">
            {busiestRoads.map((road, index) => (
              <div key={road.id} className="flex items-center gap-3">
                <span className="text-xs font-data text-accent-cyan w-5">{String(index + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary">{road.name}</span>
                    <span className="text-xs font-data text-text-secondary">{road.vehicleCount} vehicles</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue"
                      style={{ width: `${(road.vehicleCount / (busiestRoads[0]?.vehicleCount || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <Badge
                  variant={road.congestionLevel === 'congested' ? 'danger' : road.congestionLevel === 'high' ? 'warning' : 'default'}
                  size="sm"
                >
                  {road.congestionLevel}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Traffic Anomalies */}
        <GlassCard>
          <h3 className="text-sm font-semibold font-display mb-4">Traffic Anomalies</h3>
          <div className="space-y-2">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-status-warn/5 border border-status-warn/15">
                <AlertTriangle size={14} className="text-status-warn flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-primary">{anomaly}</p>
              </div>
            ))}
            {anomalies.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-4">No anomalies detected</p>
            )}
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
