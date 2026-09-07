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
    <div className="rounded-xl px-3.5 py-2.5 text-xs bg-[var(--bg-elevated)] border border-white/10 dark:border-white/10 shadow-xl font-mono text-[var(--text-primary)] backdrop-blur-md">
      <p className="text-[var(--text-tertiary)] mb-1 text-[10px] font-medium uppercase tracking-wider">{label}</p>
      {payload.map((entry, index) => (
        <p key={`${entry.name}-${index}`} className="text-[var(--text-primary)] font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[var(--text-secondary)] font-medium font-body">{entry.name}:</span>
          <span className="text-[var(--brand-teal)] font-bold">{entry.value?.toLocaleString()}</span>
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
  color = '#10a37f',
  gradientId = 'areaGradient',
}: AreaChartWrapperProps) {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)';
  const axisColor = 'transparent';
  const tickFill  = isDark ? '#a1a1aa' : '#64748b';

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 15, left: -15, bottom: 10 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={isDark ? 0.35 : 0.25} />
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
            strokeWidth={2}
            activeDot={{ r: 4, fill: '#ffffff', stroke: color, strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
