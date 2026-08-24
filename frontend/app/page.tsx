'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Camera, Car, Activity, AlertTriangle, Layers } from 'lucide-react';

import { StatCard } from '@/components/ui/StatCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { cameraService } from '@/services/cameraService';
import { alertService } from '@/services/alertService';

// Dynamically import MapView to disable SSR safely
const MapView = dynamic(
  () => import('@/components/map/MapView').then((mod) => mod.MapView || mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/30 rounded-[1.5rem] animate-pulse">
        <Layers className="w-8 h-8 text-cyan-400/40 mb-2 animate-bounce" />
        <p className="text-slate-400 text-xs tracking-[0.2em] uppercase font-semibold">Initializing Neural Grid...</p>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => cameraService.getCameras(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertService.getAlerts(),
  });

  const activeCameras = cameras.filter((c: any) => c.status === 'online').length || 9;
  const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical').length || 2;

  return (
    <div className="space-y-4 md:space-y-6 pb-8 h-full flex flex-col font-sans">
      
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 shrink-0">
        <StatCard
          label="Active Cameras"
          value={activeCameras}
          icon={Camera}
          trend={{ value: 2.5, isPositive: true }}
          accentColor="#38bdf8"
        />
        <StatCard
          label="Vehicles Today"
          value="2,847"
          icon={Car}
          trend={{ value: 12.3, isPositive: true }}
          accentColor="#60a5fa"
        />
        <StatCard
          label="Avg Speed"
          value="38.5 km/h"
          icon={Activity}
          trend={{ value: 3.1, isPositive: false }}
          accentColor="#fbbf24"
        />
        <StatCard
          label="Active Alerts"
          value={alerts.length || 4}
          subtitle={`${criticalAlerts} critical`}
          icon={AlertTriangle}
          accentColor="#f87171"
        />
      </div>

      {/* Main Grid: Map & Alerts */}
      <div className="flex flex-col xl:flex-row gap-4 md:gap-6 flex-1 min-h-[600px]">
        
        {/* Map Section */}
        <div className="w-full xl:w-[68%] h-[520px] xl:h-auto flex flex-col relative z-0">
          <GlassCard className="flex-1 p-0 overflow-hidden shadow-2xl relative flex flex-col" padding="none">
            <MapView cameras={cameras} />
            
            {/* Map Layer Controls */}
            <div className="absolute bottom-5 left-5 z-[400] flex items-center gap-2">
              <button className="px-3.5 py-1.5 bg-slate-950/80 hover:bg-slate-900/90 text-cyan-300 ring-1 ring-cyan-500/30 rounded-full text-xs font-semibold tracking-wider backdrop-blur-xl transition-all shadow-lg hover:shadow-cyan-500/20">
                Traffic Density
              </button>
              <button className="px-3.5 py-1.5 bg-slate-950/60 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 ring-1 ring-white/10 rounded-full text-xs font-medium tracking-wider backdrop-blur-xl transition-all">
                Heatmap
              </button>
              <button className="px-3.5 py-1.5 bg-slate-950/60 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 ring-1 ring-white/10 rounded-full text-xs font-medium tracking-wider backdrop-blur-xl transition-all">
                Trajectories
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Recent Alerts Section */}
        <div className="w-full xl:w-[32%] flex flex-col h-[520px] xl:h-auto">
          <GlassCard className="flex-1 flex flex-col h-full" padding="md">
            
            <div className="flex items-center justify-between mb-4 shrink-0 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[0.18em]">Recent Alerts</h3>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <div className="px-2 py-0.5 rounded-full bg-rose-500/10 ring-1 ring-rose-500/20 text-[11px] text-rose-400 font-bold">
                {alerts.length || 4} Total
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
              {[
                { 
                  title: 'Route Anomaly Detected', 
                  time: '14:00:00', 
                  severity: 'HIGH', 
                  vehicle: 'TN38AB1234', 
                  severityType: 'high' 
                },
                { 
                  title: 'Traffic Surge Warning', 
                  time: '13:45:00', 
                  severity: 'MEDIUM', 
                  desc: 'Traffic volume 2.1x above normal in T. Nagar area.', 
                  severityType: 'medium' 
                },
                { 
                  title: 'Blacklisted Vehicle Detected', 
                  time: '13:35:00', 
                  severity: 'CRITICAL', 
                  vehicle: 'TN14YZ9012', 
                  severityType: 'critical' 
                },
                { 
                  title: 'Camera Connection Lost', 
                  time: '10:30:00', 
                  severity: 'HIGH', 
                  desc: 'Lost connection to CAM-010 at Porur Junction.', 
                  severityType: 'high' 
                }
              ].map((alert, i) => (
                <div 
                  key={i} 
                  className="p-3.5 rounded-[1.1rem] bg-slate-900/50 hover:bg-slate-850/70 ring-1 ring-white/5 hover:ring-white/10 transition-all duration-200 cursor-pointer group shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="text-[13px] font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {alert.title}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider shrink-0
                      ${alert.severityType === 'critical' ? 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30' : 
                        alert.severityType === 'high' ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30' : 
                        'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30'}`
                    }>
                      {alert.severity}
                    </span>
                  </div>
                  
                  {alert.vehicle ? (
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Vehicle detected on abnormal pattern:{' '}
                      <span className="text-cyan-300 font-mono font-medium tracking-tight bg-cyan-950/40 px-1.5 py-0.5 rounded ring-1 ring-cyan-500/20">
                        {alert.vehicle}
                      </span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 leading-relaxed">{alert.desc}</p>
                  )}
                  
                  <div className="text-[10px] text-slate-500 font-mono font-medium tracking-wider text-right mt-2.5">
                    {alert.time}
                  </div>
                </div>
              ))}
            </div>
            
          </GlassCard>
        </div>

      </div>
    </div>
  );
}