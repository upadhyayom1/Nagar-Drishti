'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useUIStore } from '@/store/uiStore';

type ChartDatum = object;
type TooltipPayloadEntry = { color?: string; name?: string; value?: string | number; payload?: Record<string, unknown> };
type CustomTooltipProps = { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string | number };

interface BarChartWrapperProps {
  data: ChartDatum[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const fullLabel = String(label ?? '');
  return (
    <div className="rounded-lg px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-neutral-700 shadow-md font-mono text-[var(--text-primary)]">
      <p className="text-[var(--text-secondary)] mb-1 text-[11px] font-medium truncate max-w-[200px]">{fullLabel}</p>
      {payload.map((entry, index) => (
        <p key={`${entry.name}-${index}`} className="text-[var(--text-primary)] font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#10a37f' }} />
          <span className="text-[#10a37f]">{entry.value?.toLocaleString()} veh</span>
        </p>
      ))}
    </div>
  );
};

/** Truncate label to max chars with ellipsis for angled x-axis ticks */
function formatLabel(name: string, maxLen = 10): string {
  if (!name) return '';
  const clean = name
    .replace(/ Junction$/, '')
    .replace(/ Flyover$/, '')
    .replace(/ Expressway$/, '')
    .replace(/ Cyber Corridor$/, '')
    .replace(/ Chowk$/, '');
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
}

export function BarChartWrapper({
  data,
  dataKey,
  xAxisKey,
  height = 280,
  color = '#10a37f',
}: BarChartWrapperProps) {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#262626' : '#e5e5e5';
  const axisColor = isDark ? '#333333' : '#e5e5e5';
  const tickFill  = isDark ? '#737373' : '#8e8e8e';

  // Show at most ~10 labels regardless of how many bars there are
  const labelInterval = data.length > 12 ? Math.ceil(data.length / 10) : 0;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 72 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={(v) => formatLabel(String(v ?? ''), 9)}
            tick={{
              fill: tickFill,
              fontSize: 9,
              fontFamily: 'var(--font-mono), monospace',
            }}
            axisLine={{ stroke: axisColor }}
            tickLine={false}
            dy={6}
            interval={labelInterval}
            angle={-65}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: tickFill, fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}
            axisLine={{ stroke: axisColor }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={true} animationDuration={800} animationEasing="ease-out">
            {data.map((_, index) => {
              const opacity = 0.55 + ((index % 5) * 0.1);
              return (
                <Cell
                  key={`cell-${index}`}
                  fill="#10a37f"
                  fillOpacity={opacity}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
