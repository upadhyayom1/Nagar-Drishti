'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUIStore } from '@/store/uiStore';

type ChartDatum = object;
type TooltipEntry = { color?: string; name?: string; value?: string | number };
type CustomTooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string | number };

interface AreaChartWrapperProps {
  data: ChartDatum[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
  gradientId?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl px-4 py-3 text-xs bg-[var(--bg-elevated)] backdrop-blur-xl border border-violet-400/30 shadow-[0_12px_36px_rgba(0,0,0,0.85)] font-mono text-[var(--text-primary)]">
      <p className="text-[var(--text-secondary)] mb-1 text-[11px] font-display font-medium">{label}</p>
      {payload.map((entry, index) => (
        <p key={`${entry.name}-${index}`} className="text-[var(--text-primary)] font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="text-violet-400">{entry.value?.toLocaleString()}</span>
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
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const tickFill  = isDark ? '#94a3b8' : '#64748b';

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
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: tickFill, fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}
            axisLine={{ stroke: axisColor }}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: tickFill, fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}
            axisLine={{ stroke: axisColor }}
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
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
