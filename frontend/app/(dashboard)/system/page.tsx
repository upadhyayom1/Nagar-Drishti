'use client';

import { useState, useEffect } from 'react';
import { Activity, Cpu, Server, HardDrive, RefreshCw, Radio, CheckCircle, AlertTriangle } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard }    from '@/components/ui/StatCard';

type NodeStatus = 'Online' | 'Warning' | 'Rebooting' | 'Recovered';

interface NodeState {
  id: string;
  name: string;
  status: NodeStatus;
  latency: string;
  temp: string;
  fps: number;
}

const initialNodes: NodeState[] = [
  { id: 'CAM-001', name: 'Anna Nagar Junction',       status: 'Online',   latency: '24ms',  temp: '42°C', fps: 29 },
  { id: 'CAM-002', name: 'Koyambedu Flyover',         status: 'Online',   latency: '31ms',  temp: '44°C', fps: 28 },
  { id: 'CAM-003', name: 'T. Nagar Panagal Park',     status: 'Online',   latency: '28ms',  temp: '43°C', fps: 30 },
  { id: 'CAM-004', name: 'Guindy Kathipara Hub',       status: 'Warning',  latency: '420ms', temp: '61°C', fps: 14 },
  { id: 'CAM-005', name: 'Marina Beach Expressway',    status: 'Online',   latency: '22ms',  temp: '41°C', fps: 30 },
  { id: 'CAM-006', name: 'OMR Cyber Corridor',         status: 'Online',   latency: '19ms',  temp: '40°C', fps: 30 },
];

function statusVariant(s: NodeStatus): 'success' | 'warning' | 'danger' | 'cobalt' {
  if (s === 'Online' || s === 'Recovered') return 'success';
  if (s === 'Warning') return 'warning';
  if (s === 'Rebooting') return 'cobalt';
  return 'warning';
}

export default function SystemDiagnosticsPage() {
  const [nodes, setNodes] = useState<NodeState[]>(initialNodes);
  const [rebootLog, setRebootLog] = useState<{ id: string; msg: string; time: Date }[]>([]);

  // Randomize latency/temp on mount for realism
  useEffect(() => {
    setNodes(prev => prev.map(n =>
      n.status === 'Online' ? {
        ...n,
        latency: `${Math.floor(Math.random() * 20 + 18)}ms`,
        temp: `${Math.floor(Math.random() * 8 + 40)}°C`,
        fps: Math.floor(Math.random() * 3 + 28),
      } : n
    ));
  }, []);

  const handleReboot = (id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status: 'Rebooting', latency: '—', fps: 0 } : n));
    setRebootLog(prev => [{ id, msg: `Reboot sequence initiated on ${id}`, time: new Date() }, ...prev.slice(0, 4)]);

    // Simulate recovery after 3.5s
    setTimeout(() => {
      setNodes(prev => prev.map(n =>
        n.id === id ? {
          ...n,
          status: 'Recovered',
          latency: `${Math.floor(Math.random() * 15 + 18)}ms`,
          temp: `${Math.floor(Math.random() * 5 + 40)}°C`,
          fps: Math.floor(Math.random() * 3 + 28),
        } : n
      ));
      setRebootLog(prev => [{ id, msg: `${id} recovered — stream nominal`, time: new Date() }, ...prev.slice(0, 4)]);

      // Reset to Online after 2 more seconds
      setTimeout(() => {
        setNodes(prev => prev.map(n => n.id === id && n.status === 'Recovered' ? { ...n, status: 'Online' } : n));
      }, 2000);
    }, 3500);
  };

  const onlineCount  = nodes.filter(n => n.status === 'Online' || n.status === 'Recovered').length;
  const warningCount = nodes.filter(n => n.status === 'Warning').length;

  return (
    <PageWrapper className="space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">System Diagnostics</h1>
        <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
          Edge node health · Neural ANPR inference latency · Cluster throughput
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Edge Nodes"  value={`${onlineCount}/${nodes.length}`} subtitle={`${warningCount} Degraded`}   icon={Server}     colorTheme="emerald" />
        <StatCard label="ANPR Engine FPS"    value="64 FPS"                           subtitle="Avg Latency: 142ms"             icon={Cpu}        colorTheme="violet" />
        <StatCard label="API Gateway Ping"   value="28ms"                             subtitle="99.99% Core Uptime"             icon={Activity}   colorTheme="cyan" />
        <StatCard label="Edge Storage Pool"  value="72%"                              subtitle="2.4 TB Available"               icon={HardDrive}  colorTheme="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edge Node Table */}
        <GlassCard padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio size={14} className="text-cyan-400" />
              Edge Node Health Telemetry
            </h2>
            <Badge variant="success" dot pulse size="sm">Real-time</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 border-b border-white/10">
                <tr style={{ background: 'rgba(5,7,17,0.7)' }}>
                  <th className="p-4">Node ID</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Latency</th>
                  <th className="p-4">Optical FPS</th>
                  <th className="p-4">Core Temp</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="p-4 font-mono font-extrabold text-cyan-400 text-xs">{node.id}</td>
                    <td className="p-4 text-xs text-white font-semibold font-display">{node.name}</td>
                    <td className="p-4">
                      <Badge variant={statusVariant(node.status)} size="sm" dot pulse={node.status === 'Rebooting'}>
                        {node.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">{node.latency}</td>
                    <td className="p-4 font-mono text-xs text-violet-400 font-bold">
                      {node.fps > 0 ? `${node.fps} FPS` : '—'}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">{node.temp}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleReboot(node.id)}
                        disabled={node.status === 'Rebooting'}
                        title="Reboot Node Stream"
                        className="p-2 hover:bg-white/[0.08] rounded-xl text-slate-400 hover:text-cyan-400 transition-all outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <RefreshCw
                          size={14}
                          className={node.status === 'Rebooting' ? 'animate-spin text-violet-400' : ''}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Reboot Activity Log */}
        <GlassCard padding="md" className="flex flex-col">
          <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity size={14} className="text-emerald-400" />
            Reboot Activity Log
          </h2>

          {rebootLog.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <CheckCircle size={24} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white font-display">All Systems Nominal</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Click the reboot icon on any node to restart its stream
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {rebootLog.map((log, i) => (
                <div key={i} className={`p-3.5 rounded-2xl border text-xs ${
                  log.msg.includes('recovered')
                    ? 'bg-emerald-500/10 border-emerald-500/25'
                    : 'bg-cyan-500/10 border-cyan-500/25'
                }`}>
                  <p className="font-display font-bold text-white text-[11px]">{log.msg}</p>
                  <p className="text-[10px] text-slate-400 font-data mt-1">
                    {log.time.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}