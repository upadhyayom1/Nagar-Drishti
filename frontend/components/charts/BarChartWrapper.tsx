'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartWrapperProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
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

export function BarChartWrapper({ data, dataKey, xAxisKey, height = 300, color = '#5b8cff' }: BarChartWrapperProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey={xAxisKey} tick={{ fill: '#8a8d99', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
        <YAxis tick={{ fill: '#8a8d99', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
