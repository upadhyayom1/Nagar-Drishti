'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ChartDatum = object;
type TooltipEntry = { color?: string; name?: string; value?: string | number };
type CustomTooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string | number };

interface BarChartWrapperProps {
  data: ChartDatum[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl px-4 py-3 text-xs bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 shadow-[0_12px_36px_rgba(0,0,0,0.85)] font-mono text-white">
      <p className="text-slate-400 mb-1 text-[11px] font-display font-medium">{label}</p>
      {payload.map((entry, index) => (
        <p key={`${entry.name}-${index}`} className="text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="text-cyan-300">{entry.value?.toLocaleString()} veh</span>
        </p>
      ))}
    </div>
  );
};

// Formatter to shorten camera station names so they don't get truncated
function formatCameraLabel(name: string): string {
  if (!name) return '';
  return name.replace(' Junction', '').replace(' Flyover', '').replace(' Expressway', '').replace(' Cyber Corridor', '').slice(0, 10);
}

export function BarChartWrapper({
  data,
  dataKey,
  xAxisKey,
  height = 280,
  color = '#06b6d4',
}: BarChartWrapperProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatCameraLabel}
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
            dy={8}
            interval={0}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
