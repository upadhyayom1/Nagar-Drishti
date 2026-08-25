'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Car, Eye, MapPin, Star, ArrowRight, Radio, Shield } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { Input }       from '@/components/ui/Input';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { vehicleService } from '@/services/vehicleService';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const statusVariant = vehicle.status === 'blacklist' ? 'danger' : vehicle.status === 'watchlist' ? 'warning' : 'success';
  const glowType = vehicle.status === 'blacklist' ? 'crimson' : vehicle.status === 'watchlist' ? 'amber' : 'cyan';

  return (
    <Link href={`/vehicles/${vehicle.plate}`} className="block h-full">
      <GlassCard hover glow={glowType} className="h-full flex flex-col justify-between gap-4 p-5">
        <div>
          <div className="flex items-start justify-between mb-3">
            <span className="text-lg font-data font-extrabold text-cyan-300 tracking-wider">{vehicle.plate}</span>
            <Badge variant={statusVariant} size="sm">{vehicle.status}</Badge>
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-body">
            <div className="flex items-center gap-2">
              <Car size={13} className="text-indigo-400 shrink-0" />
              <span>{vehicle.vehicleType} · {vehicle.color}</span>
            </div>
            <div className="flex items-center gap-2 font-data">
              <Eye size={13} className="text-cyan-400 shrink-0" />
              <span><span className="text-white font-bold">{vehicle.totalDetections}</span> detections</span>
            </div>
            <div className="flex items-center gap-2 font-data">
              <MapPin size={13} className="text-pink-400 shrink-0" />
              <span><span className="text-white font-bold">{vehicle.camerasVisited}</span> cameras visited</span>
            </div>
          </div>
        </div>

        {vehicle.registeredCity && (
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-data text-slate-400">
            <span>REG: {vehicle.registeredCity}</span>
            <ArrowRight size={12} className="text-cyan-400" />
          </div>
        )}
      </GlassCard>
    </Link>
  );
}

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults = [] } = useQuery({
    queryKey: ['vehicleSearch', searchQuery],
    queryFn: () => vehicleService.searchVehicles(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const { data: recentVehicles = [] } = useQuery({
    queryKey: ['recentVehicles'],
    queryFn: () => vehicleService.getRecentVehicles(8),
  });

  const displayVehicles = searchQuery.length > 0 ? searchResults : recentVehicles;

  return (
    <PageWrapper className="space-y-8 font-body">
      {/* Search Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-4">
        <h1 className="text-3xl font-bold text-white font-display">Vehicle Intelligence</h1>
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Query city-wide ANPR optical recognition records and trajectory histories
        </p>
        <div className="max-w-xl mx-auto">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter full or partial license plate (e.g. TN38AB1234)"
            showSearchIcon
            shortcutHint="Global Search"
            className="h-12 text-base text-center"
          />
        </div>
      </div>

      {/* Quick Access Card with Multi-Chromatic Spectral Glow */}
      {searchQuery.length === 0 && (
        <div>
          <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Star size={14} className="text-yellow-400" /> Featured Intelligence Target
          </p>
          <Link href="/vehicles/TN38AB1234">
            <GlassCard
              hover
              glow="spectral"
              accent="spectral"
              className="max-w-xl border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.2)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-data font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300">
                      TN38AB1234
                    </span>
                    <Badge variant="cyan" size="sm">Active Target</Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 font-body">
                    White Sedan · 4 Key Chennai Intersections · 12 Detections
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-cyan-500/20 to-pink-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <ArrowRight size={20} />
                </div>
              </div>
            </GlassCard>
          </Link>
        </div>
      )}

      {/* Vehicle Cards Grid with Staggered Entrance */}
      <div>
        <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-400 mb-4">
          {searchQuery.length > 0 ? `Search Query Matches (${displayVehicles.length})` : 'Recently Sighted Vehicles'}
        </p>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {displayVehicles.map((v: Vehicle) => (
            <motion.div variants={itemVariants} key={v.plate} className="h-full">
              <VehicleCard vehicle={v} />
            </motion.div>
          ))}
        </motion.div>
        {searchQuery.length > 0 && displayVehicles.length === 0 && (
          <div className="text-center py-20">
            <Search size={40} className="mx-auto mb-3 text-cyan-400/20" />
            <p className="text-xs font-mono text-slate-400">No vehicles located with plate pattern "{searchQuery}"</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
