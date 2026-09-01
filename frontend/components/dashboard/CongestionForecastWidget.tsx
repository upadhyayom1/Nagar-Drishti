'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { trafficService, TrafficForecast } from '@/services/trafficService';
import { AlertTriangle, Clock, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export function CongestionForecastWidget() {
  const [durationInput, setDurationInput] = useState('30');
  const [unit, setUnit] = useState<'minutes' | 'hours'>('minutes');
  const [horizonMinutes, setHorizonMinutes] = useState(30);
  const { data: forecast, isLoading, isFetching, isError } = useQuery<TrafficForecast>({
    queryKey: ['trafficForecast', horizonMinutes],
    queryFn: () => trafficService.getForecast(horizonMinutes),
    refetchInterval: 60_000,
  });

  const applyDuration = () => {
    const value = Number(durationInput);
    if (!Number.isInteger(value) || value < 1) return;
    const minutes = unit === 'hours' ? value * 60 : value;
    if (minutes <= 24 * 60) setHorizonMinutes(minutes);
  };

  const displayHorizon = horizonMinutes >= 60 && horizonMinutes % 60 === 0
    ? `${horizonMinutes / 60} hr${horizonMinutes === 60 ? '' : 's'}`
    : `${horizonMinutes} min`;

  if (!forecast && isLoading) {
    return <GlassCard padding="md" className="h-full flex items-center justify-center animate-pulse"><Activity className="text-cyan-500 animate-spin" /></GlassCard>;
  }

  if (!forecast || isError) return <GlassCard padding="md" className="h-full flex items-center justify-center text-xs text-[var(--text-secondary)]">Forecast is temporarily unavailable.</GlassCard>;

  const hasBottlenecks = forecast.bottlenecks_count > 0;

  return (
    <GlassCard
      padding="md"
      glow={hasBottlenecks ? 'critical' : 'cyan'}
      className={`h-full flex flex-col space-y-4 ${hasBottlenecks ? 'border-rose-500/50' : 'border-cyan-500/30'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className={hasBottlenecks ? 'text-rose-400' : 'text-cyan-400'} size={20} />
          <h3 className="font-display font-bold text-sm tracking-widest uppercase">
            AI Traffic Forecast
          </h3>
        </div>
        <Badge variant={hasBottlenecks ? 'danger' : 'info'} size="sm" className="flex items-center gap-1">
          <Clock size={12} />
          +{displayHorizon}
        </Badge>
      </div>

      <div className="flex items-end gap-2">
        <label className="flex-1 text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
          Forecast horizon
          <input
            type="number"
            min="1"
            max={unit === 'hours' ? 24 : 1440}
            value={durationInput}
            onChange={(event) => setDurationInput(event.target.value)}
            className="mt-1 h-8 w-full rounded-lg border border-[var(--glass-border)] bg-black/20 px-2 text-xs text-white outline-none focus:border-cyan-400"
          />
        </label>
        <select
          value={unit}
          onChange={(event) => setUnit(event.target.value as 'minutes' | 'hours')}
          className="h-8 rounded-lg border border-[var(--glass-border)] bg-black/20 px-2 text-xs text-white outline-none focus:border-cyan-400"
          aria-label="Forecast duration unit"
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
        </select>
        <Button variant="secondary" size="sm" onClick={applyDuration} disabled={isFetching} className="h-8 text-[10px]">Apply</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-black/40 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">Monitored Zones</p>
          <p className="text-xl font-bold font-display text-white">{forecast.total_cameras_monitored}</p>
        </div>
        <div className={`rounded-lg p-3 border ${hasBottlenecks ? 'bg-rose-500/10 border-rose-500/30' : 'bg-black/40 border-white/5'}`}>
          <p className={`text-[10px] font-mono uppercase ${hasBottlenecks ? 'text-rose-300' : 'text-[var(--text-tertiary)]'}`}>
            Predicted Bottlenecks
          </p>
          <p className={`text-xl font-bold font-display ${hasBottlenecks ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
            {forecast.bottlenecks_count}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
        {forecast.forecast_details.length === 0 ? (
          <div className="text-center py-4 text-xs font-mono text-[var(--text-secondary)]">
            No active detection logs to forecast.
          </div>
        ) : (
          <>
            {/* Congested Zones Section */}
            {forecast.forecast_details.filter(d => d.congestion_risk === 'HIGH').length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold font-display uppercase tracking-wider text-rose-400 border-b border-rose-500/20 pb-1 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Critical Congestion Zones
                </h4>
                {forecast.forecast_details
                  .filter(d => d.congestion_risk === 'HIGH')
                  .sort((a, b) => b.predicted_vehicle_count - a.predicted_vehicle_count)
                  .map((detail, idx) => (
                    <motion.div
                      key={`high-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-rose-500/10 border-rose-500/30"
                    >
                      <div>
                        <p className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                          Zone {detail.zone_id}
                        </p>
                        <p className="text-[10px] font-mono text-rose-300/70">Cam: {detail.camera_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-display text-rose-400">
                          {detail.predicted_vehicle_count} <span className="text-[10px] font-mono font-normal opacity-70">est.</span>
                        </p>
                        <p className="text-[9px] font-mono text-rose-300/50">
                          Now: {detail.current_vehicle_count}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* Nominal Zones Section */}
            {forecast.forecast_details.filter(d => d.congestion_risk !== 'HIGH').length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold font-display uppercase tracking-wider text-[var(--text-secondary)] border-b border-white/5 pb-1 flex items-center gap-1.5">
                  <Activity size={12} className="text-emerald-500" /> Nominal Flow Zones
                </h4>
                {forecast.forecast_details
                  .filter(d => d.congestion_risk !== 'HIGH')
                  .sort((a, b) => b.predicted_vehicle_count - a.predicted_vehicle_count)
                  .map((detail, idx) => (
                    <motion.div
                      key={`nom-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-white/[0.02] border-white/5"
                    >
                      <div>
                        <p className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                          Zone {detail.zone_id}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--text-secondary)]">Cam: {detail.camera_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-display text-emerald-400">
                          {detail.predicted_vehicle_count} <span className="text-[10px] font-mono font-normal opacity-70">est.</span>
                        </p>
                        <p className="text-[9px] font-mono text-[var(--text-tertiary)]">
                          Now: {detail.current_vehicle_count}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
