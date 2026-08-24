'use client';

import { ArrowRightLeft, Route } from 'lucide-react';

export default function NetworkPage() {
  const routes = [
    { origin: 'CAM-001', dest: 'CAM-003', volume: 4520, time: '3m 12s', status: 'Optimal' },
    { origin: 'CAM-003', dest: 'CAM-006', volume: 3810, time: '5m 45s', status: 'Congested' },
    { origin: 'CAM-006', dest: 'CAM-010', volume: 2905, time: '2m 30s', status: 'Optimal' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-space-grotesk font-bold">Movement Network</h1>
        <p className="text-gray-400">Inter-node transit analytics and vehicle flow mapping.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--surface-glass)] border border-[var(--border-glass)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Route size={18} /> Major Transit Corridors</h2>
          </div>
          
          <div className="space-y-4">
            {routes.map((route, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-[var(--border-glass)]">
                <div className="flex items-center gap-4">
                  <span className="font-jetbrains text-[var(--accent-cyan)]">{route.origin}</span>
                  <ArrowRightLeft size={16} className="text-gray-600" />
                  <span className="font-jetbrains text-[var(--accent-cyan)]">{route.dest}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{route.volume.toLocaleString()} veh/hr</div>
                  <div className="text-sm text-gray-400 font-jetbrains">Avg Transit: {route.time}</div>
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${route.status === 'Congested' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                    {route.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface-glass)] border border-[var(--border-glass)] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Origin-Destination Matrix</h2>
          <div className="aspect-square bg-black/50 border border-[var(--border-glass)] rounded-lg flex items-center justify-center flex-col text-gray-500">
             {/* Placeholder for actual D3/Canvas matrix visualization */}
             <Route size={32} className="mb-2 opacity-50" />
             <p className="text-sm">Matrix Visualization Area</p>
             <p className="text-xs font-jetbrains mt-2">Connects to /api/analytics/matrix</p>
          </div>
        </div>
      </div>
    </div>
  );
}