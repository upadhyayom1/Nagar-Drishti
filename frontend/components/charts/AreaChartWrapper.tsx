'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartWrapperProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
  gradientId?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl px-4 py-3 text-xs bg-slate-900/95 backdrop-blur-xl border border-violet-400/30 shadow-[0_12px_36px_rgba(0,0,0,0.85)] font-mono text-white">
      <p className="text-slate-400 mb-1 text-[11px] font-display font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="text-violet-300">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export function AreaChartWrapper({
  data,
  dataKey,
  xAxisKey,
  height = 280,
  color = '#8b5cf6',
  gradientId = 'areaGradient',
}: AreaChartWrapperProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 15 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={`url(#${gradientId})`}
            strokeWidth={2.5}
            activeDot={{ r: 5, fill: '#ffffff', stroke: color, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
