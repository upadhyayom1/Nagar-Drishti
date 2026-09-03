'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car, Eye, MapPin, Search, Shield, ShieldOff, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { blacklistService } from '@/services/blacklistService';
import { vehicleService } from '@/services/vehicleService';
import type { AlertSeverity, Vehicle } from '@/types';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const statusVariant = vehicle.status === 'blacklist' ? 'critical' : vehicle.status === 'watchlist' ? 'warn' : 'ok';
  const glowType = vehicle.status === 'blacklist' ? 'rose' : vehicle.status === 'watchlist' ? 'amber' : 'cyan';

  return (
    <Link href={`/vehicles/${vehicle.plate}`} className="block h-full">
      <GlassCard hover glow={glowType} className="h-full flex flex-col justify-between gap-3.5 p-4">
        <div>
          <div className="flex items-start justify-between mb-2.5">
            <span className="text-base font-mono font-bold text-cyan-500 dark:text-cyan-400 tracking-wider">{vehicle.plate}</span>
            <Badge variant={statusVariant} size="sm">{vehicle.status}</Badge>
          </div>
          <div className="space-y-1.5 text-xs text-[var(--text-secondary)] font-body">
            <div className="flex items-center gap-2">
              <Car size={13} className="text-violet-500 dark:text-violet-400 shrink-0" />
              <span>{vehicle.vehicleType} · {vehicle.color}</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <Eye size={13} className="text-cyan-500 dark:text-cyan-400 shrink-0" />
              <span><span className="text-[var(--text-primary)] font-bold">{vehicle.totalDetections}</span> detections</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <MapPin size={13} className="text-amber-500 dark:text-amber-400 shrink-0" />
              <span><span className="text-[var(--text-primary)] font-bold">{vehicle.camerasVisited}</span> nodes visited</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

function VehiclesPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => (searchParams.get('search') || '').toUpperCase());
  const [plateNumber, setPlateNumber] = useState('');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('medium');

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['vehicleSearch', searchQuery],
    queryFn: () => vehicleService.searchVehicles(searchQuery),
    enabled: searchQuery.trim().length > 0,
  });
  const { data: recentVehicles = [] } = useQuery({ queryKey: ['recentVehicles'], queryFn: () => vehicleService.getRecentVehicles(12) });
  const { data: blacklistedVehicles = [] } = useQuery({ queryKey: ['blacklistedVehicles'], queryFn: blacklistService.getActiveVehicles });

  const addBlacklist = useMutation({
    mutationFn: blacklistService.addVehicle,
    onSuccess: () => {
      setPlateNumber('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['blacklistedVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['recentVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleSearch'] });
    },
  });
  const deactivateBlacklist = useMutation({
    mutationFn: blacklistService.deactivateVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistedVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['recentVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicleSearch'] });
    },
  });

  const displayVehicles = searchQuery.trim() ? searchResults : recentVehicles;

  return (
    <PageWrapper className="space-y-6 font-body">
      <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">Vehicle Intelligence</h1>
        <p className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">Search ANPR records and recorded trajectory histories</p>
        <div className="max-w-md mx-auto pt-1">
          <Input 
            value={searchQuery} 
            onChange={(event) => setSearchQuery(event.target.value.toUpperCase())} 
            placeholder="Search plate number (e.g. TN38AB1234)" 
            showSearchIcon 
            shortcutHint={isSearching ? 'Searching…' : 'Live Search'} 
            className="h-10 text-sm text-center" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <GlassCard padding="md" className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {searchQuery.trim() ? `Search matches (${displayVehicles.length})` : 'Recently sighted vehicles'}
            </p>
            <Badge variant="info" size="sm">ANPR Records</Badge>
          </div>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayVehicles.map((vehicle) => (
              <motion.div variants={itemVariants} key={vehicle.plate} className="h-full">
                <VehicleCard vehicle={vehicle} />
              </motion.div>
            ))}
          </motion.div>
          {displayVehicles.length === 0 && (
            <div className="text-center py-16">
              <Search size={36} className="mx-auto mb-2 text-cyan-400/20" />
              <p className="text-xs font-mono text-[var(--text-secondary)]">
                {searchQuery.trim() ? `No vehicles match "${searchQuery}"` : 'No recent vehicle detections available.'}
              </p>
            </div>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard padding="md" glow="rose">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-rose-500 dark:text-rose-400" />
              <h2 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider">Add Blacklist Record</h2>
            </div>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!plateNumber.trim() || !reason.trim()) return;
                addBlacklist.mutate({ plateNumber: plateNumber.trim().toUpperCase(), reason: reason.trim(), severity });
              }}
            >
              <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} placeholder="Plate number (e.g. TN38AB1234)" className="h-9 text-xs" />
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for blacklist flag" className="h-9 text-xs" />
              <div className="flex items-center gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`flex-1 py-1 text-[10px] font-mono font-semibold uppercase rounded-lg border transition-all ${
                      severity === level ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold' : 'bg-white/[0.04] border-[var(--glass-border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <Button variant="danger" size="sm" type="submit" className="w-full cursor-pointer" disabled={addBlacklist.isPending}>
                <Plus size={13} /> {addBlacklist.isPending ? 'Enlisting…' : 'Enlist to Watchlist'}
              </Button>
            </form>
          </GlassCard>

          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Shield size={14} className="text-rose-500 dark:text-rose-400" />
                Active Blacklist ({blacklistedVehicles.length})
              </h2>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {blacklistedVehicles.map((b) => (
                <div key={b.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-[var(--glass-border)] flex items-center justify-between gap-2 transition-colors hover:bg-white/[0.05]">
                  <Link href={`/vehicles/${b.plateNumber}`} className="min-w-0 flex-1 group">
                    <span className="font-mono font-bold text-xs text-rose-500 dark:text-rose-400 group-hover:text-rose-400 dark:group-hover:text-rose-300 transition-colors">{b.plateNumber}</span>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate group-hover:text-[var(--text-primary)] transition-colors">{b.reason}</p>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => deactivateBlacklist.mutate(b.id)} title="Deactivate Flag" className="cursor-pointer">
                    <ShieldOff size={13} />
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs font-mono text-[var(--text-secondary)]">Loading Vehicle Registry...</div>}>
      <VehiclesPageContent />
    </Suspense>
  );
}
