'use client';

import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { useUIStore } from '@/store/uiStore';

export interface SankeyData {
  nodes: { name: string; code?: string }[];
  links: { source: number; target: number; value: number }[];
}

export function SankeyChartWrapper({
  data,
  height = 350,
}: {
  data: SankeyData;
  height?: number;
}) {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  if (!data || !data.nodes || data.nodes.length === 0) return null;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          node={{
            stroke: isDark ? '#ffffff' : '#000000',
            strokeWidth: 2,
            fill: '#0ea5e9',
          }}
          nodePadding={50}
          link={{
            stroke: '#14b8a6',
            strokeOpacity: 0.3,
          }}
        >
          <Tooltip
            content={({ payload }) => {
              if (payload && payload.length) {
                const data = payload[0].payload;
                if (data.source && data.target) {
                  // It's a link
                  return (
                    <div className="rounded-lg px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-md font-mono text-[var(--text-primary)]">
                      <p className="font-bold text-teal-400">Flow: {data.source.name} → {data.target.name}</p>
                      <p className="text-[var(--text-secondary)]">{data.value} transitions</p>
                    </div>
                  );
                } else {
                  // It's a node
                  return (
                    <div className="rounded-lg px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-md font-mono text-[var(--text-primary)]">
                      <p className="font-bold text-cyan-400">Node: {data.name}</p>
                      <p className="text-[var(--text-secondary)]">Total Flow: {data.value}</p>
                    </div>
                  );
                }
              }
              return null;
            }}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
