'use client';

import React, { Component, type ReactNode, useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { useUIStore } from '@/store/uiStore';
import { Route } from 'lucide-react';

export interface SankeyNode {
  name: string;
  code?: string;
  role?: 'Origin' | 'Destination';
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

class SankeyErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Sankey chart layout error caught by ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-xs font-mono text-[var(--text-secondary)]">
            <p className="font-bold text-amber-400 mb-1">Diagram Complexity Notice</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">The transition mesh contains dense loops. Switching to table view.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export function sanitizeSankeyData(data: SankeyData): SankeyData {
  if (!data || !data.nodes || data.nodes.length === 0 || !data.links || data.links.length === 0) {
    return { nodes: [], links: [] };
  }

  // 1. Filter out self-loops (source === target) and invalid indices / non-positive values
  const validLinks = data.links.filter(
    (l) =>
      typeof l.source === 'number' &&
      typeof l.target === 'number' &&
      l.source >= 0 &&
      l.source < data.nodes.length &&
      l.target >= 0 &&
      l.target < data.nodes.length &&
      l.source !== l.target &&
      l.value > 0
  );

  if (validLinks.length === 0) {
    return { nodes: data.nodes, links: [] };
  }

  // 2. Cycle detection using Depth-First Search (DFS)
  // Recharts Sankey (d3-sankey) recurses indefinitely on cyclic graphs.
  const adj = new Map<number, number[]>();
  validLinks.forEach((l) => {
    if (!adj.has(l.source)) adj.set(l.source, []);
    adj.get(l.source)!.push(l.target);
  });

  const state = new Uint8Array(data.nodes.length); // 0 = unvisited, 1 = visiting, 2 = done
  let hasCycle = false;

  function dfs(node: number): boolean {
    state[node] = 1;
    const neighbors = adj.get(node) || [];
    for (const next of neighbors) {
      if (state[next] === 1) return true;
      if (state[next] === 0 && dfs(next)) return true;
    }
    state[node] = 2;
    return false;
  }

  for (let i = 0; i < data.nodes.length; i++) {
    if (state[i] === 0) {
      if (dfs(i)) {
        hasCycle = true;
        break;
      }
    }
  }

  if (!hasCycle) {
    return { nodes: data.nodes, links: validLinks };
  }

  // If a cycle is detected, automatically transform to an acyclic Bipartite Origin -> Destination DAG.
  // In traffic networks, bidirectional flows (A <-> B) are normal. Separating them into
  // Origin nodes (left) and Destination nodes (right) preserves 100% of the transitions and volumes
  // while guaranteeing a cycle-free graph.
  const originIndices = new Map<number, number>();
  const destIndices = new Map<number, number>();

  validLinks.forEach((l) => {
    if (!originIndices.has(l.source)) originIndices.set(l.source, originIndices.size);
    if (!destIndices.has(l.target)) destIndices.set(l.target, destIndices.size);
  });

  const newNodes: SankeyNode[] = [];
  originIndices.forEach((_, origIdx) => {
    const orig = data.nodes[origIdx];
    newNodes.push({ ...orig, name: orig?.name || `Node ${origIdx}`, role: 'Origin' });
  });

  const destOffset = newNodes.length;
  destIndices.forEach((_, destIdx) => {
    const dest = data.nodes[destIdx];
    newNodes.push({ ...dest, name: dest?.name || `Node ${destIdx}`, role: 'Destination' });
  });

  const newLinks: SankeyLink[] = validLinks.map((l) => ({
    source: originIndices.get(l.source)!,
    target: destOffset + destIndices.get(l.target)!,
    value: l.value,
  }));

  return { nodes: newNodes, links: newLinks };
}

// Custom Sankey Node renderer with clear label
function renderCustomNode({ x, y, width, height, index, payload }: any) {
  const isOrigin = payload?.role === 'Origin' || x < 200;
  const fillColor = isOrigin ? '#0ea5e9' : '#00f59b';
  const label = payload?.name || '';
  const truncatedLabel = label.length > 22 ? label.slice(0, 20) + '…' : label;

  return (
    <g key={`sankey-node-${index}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        fillOpacity={0.85}
        rx={3}
        ry={3}
        stroke="#ffffff"
        strokeWidth={1}
        strokeOpacity={0.2}
      />
      <text
        x={isOrigin ? x + width + 8 : x - 8}
        y={y + height / 2}
        textAnchor={isOrigin ? 'start' : 'end'}
        dominantBaseline="middle"
        fontSize={10}
        fontFamily="var(--font-mono, monospace)"
        className="fill-zinc-200 dark:fill-zinc-100 font-semibold select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      >
        {truncatedLabel}
      </text>
    </g>
  );
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

  const cleanData = useMemo(() => sanitizeSankeyData(data), [data]);

  if (!cleanData || !cleanData.nodes || cleanData.nodes.length < 2 || !cleanData.links || cleanData.links.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center text-center p-6" style={{ height }}>
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-400/30 flex items-center justify-center mb-2.5 text-teal-400">
          <Route size={20} />
        </div>
        <p className="text-xs font-bold text-[var(--text-primary)] mb-0.5 font-display">Awaiting Sufficient Transitions</p>
        <p className="text-[10px] font-mono text-[var(--text-secondary)]">Need at least two connected sensor nodes to map flow.</p>
      </div>
    );
  }

  return (
    <SankeyErrorBoundary>
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={cleanData}
            margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
            node={renderCustomNode}
            nodePadding={28}
            nodeWidth={12}
            link={{
              stroke: '#14b8a6',
              strokeOpacity: 0.35,
            }}
          >
            <Tooltip
              content={({ payload }) => {
                if (payload && payload.length) {
                  const item = payload[0].payload;
                  if (item.source && item.target) {
                    // Link payload
                    return (
                      <div className="rounded-xl px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-xl font-mono text-[var(--text-primary)]">
                        <p className="font-bold text-teal-400">
                          {item.source.name} → {item.target.name}
                        </p>
                        <p className="text-[var(--text-secondary)] mt-0.5">
                          <span className="font-bold text-[var(--text-primary)]">{item.value.toLocaleString()}</span> transitions
                        </p>
                      </div>
                    );
                  } else {
                    // Node payload
                    return (
                      <div className="rounded-xl px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-xl font-mono text-[var(--text-primary)]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="font-bold text-cyan-400">{item.name}</span>
                          {item.role && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                              {item.role}
                            </span>
                          )}
                        </div>
                        <p className="text-[var(--text-secondary)]">
                          Throughput: <span className="font-bold text-[var(--text-primary)]">{(item.value || 0).toLocaleString()}</span> transitions
                        </p>
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
    </SankeyErrorBoundary>
  );
}
