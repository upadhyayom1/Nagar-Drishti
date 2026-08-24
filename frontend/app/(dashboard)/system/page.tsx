'use client';

import { useState, useEffect } from 'react';
import { Activity, Cpu, Server, HardDrive, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function SystemDiagnosticsPage() {
  // 1. Static default values for SSR so the server and client HTML match perfectly
  const [nodes, setNodes] = useState(
    Array.from({ length: 5 }).map((_, i) => ({
      id: `CAM-00${i+1}`,
      status: i === 3 ? 'Warning' : 'Online',
      latency: i === 3 ? '450ms' : '35ms',
      temp: '48°C'
    }))
  );

  // 2. Use useEffect to generate the randomized data ONLY on the client after hydration
  useEffect(() => {
    setNodes(
      Array.from({ length: 5 }).map((_, i) => ({
        id: `CAM-00${i+1}`,
        status: i === 3 ? 'Warning' : 'Online',
        latency: i === 3 ? '450ms' : `${Math.floor(Math.random() * 40 + 20)}ms`,
        temp: `${Math.floor(Math.random() * 15 + 45)}°C`
      }))
    );
  }, []);

  const metrics = [
    { label: 'Active Edge Nodes', val: '9/10', sub: '1 Degraded (CAM-004)', icon: Server, color: 'text-emerald-400', ring: 'ring-emerald-400/20', bg: 'bg-emerald-400/10' },
    { label: 'ANPR Engine', val: '64 FPS', sub: 'Inference: 142ms', icon: Cpu, color: 'text-cyan-400', ring: 'ring-cyan-400/20', bg: 'bg-cyan-400/10' },
    { label: 'API Gateway', val: '98ms', sub: '99.9% Uptime', icon: Activity, color: 'text-blue-400', ring: 'ring-blue-400/20', bg: 'bg-blue-400/10' },
    { label: 'Storage Cluster', val: '72%', sub: '2.4 TB Available', icon: HardDrive, color: 'text-purple-400', ring: 'ring-purple-400/20', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">System Diagnostics</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time infrastructure health and edge telemetry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((m, i) => (
          <GlassCard key={i} padding="md" className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${m.bg} ${m.ring} ring-1`}>
                <m.icon size={18} className={m.color} />
              </div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{m.label}</span>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">{m.val}</span>
            <span className="text-xs text-slate-500 font-medium mt-1">{m.sub}</span>
          </GlassCard>
        ))}
      </div>

      <GlassCard padding="none" className="flex flex-col overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Edge Node Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/40 text-slate-400 border-b border-white/5 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Node ID</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Latency</th>
                <th className="p-4 font-semibold">Core Temp</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {nodes.map((node) => (
                <tr key={node.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono font-medium text-cyan-300">{node.id}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ring-1 ${node.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-400 ring-amber-500/30'}`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-300">{node.latency}</td>
                  <td className="p-4 text-slate-300">{node.temp}</td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-200 transition-colors outline-none" title="Reboot Node">
                      <RefreshCw size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}