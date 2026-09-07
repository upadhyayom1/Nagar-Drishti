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
    <div className="rounded-xl px-3.5 py-2.5 text-xs bg-[var(--bg-elevated)] border border-white/10 dark:border-white/10 shadow-xl font-mono text-[var(--text-primary)] backdrop-blur-md">
      <p className="text-[var(--text-tertiary)] mb-1 text-[10px] font-medium truncate max-w-[200px] uppercase tracking-wider">{fullLabel}</p>
      {payload.map((entry, index) => (
        <p key={`${entry.name}-${index}`} className="text-[var(--text-primary)] font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'var(--brand-teal)' }} />
          <span className="text-[var(--brand-teal)] font-bold">{entry.value?.toLocaleString()} vehicles</span>
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
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)';
  const axisColor = 'transparent';
  const tickFill  = isDark ? '#a1a1aa' : '#64748b';

  // Show at most ~10 labels regardless of how many bars there are
  const labelInterval = data.length > 12 ? Math.ceil(data.length / 10) : 0;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 15, left: -15, bottom: 65 }}>
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
            angle={-55}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: tickFill, fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}
            axisLine={{ stroke: axisColor }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey={dataKey} radius={[6, 6, 2, 2]} maxBarSize={28} isAnimationActive={true} animationDuration={800} animationEasing="ease-out">
            {data.map((_, index) => {
              const opacity = 0.65 + ((index % 5) * 0.08);
              return (
                <Cell
                  key={`cell-${index}`}
                  fill="var(--brand-teal)"
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
