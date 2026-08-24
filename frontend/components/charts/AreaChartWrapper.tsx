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
    <div className="glass-panel rounded-lg px-3 py-2 text-xs border border-[var(--border-glass)]">
      <p className="text-[var(--text-secondary)] mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-data text-[var(--text-primary)]" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export function AreaChartWrapper({ data, dataKey, xAxisKey, height = 300, color = '#22d3ee', gradientId = 'areaGradient' }: AreaChartWrapperProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xAxisKey} tick={{ fill: '#8a8d99', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
        <YAxis tick={{ fill: '#8a8d99', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
