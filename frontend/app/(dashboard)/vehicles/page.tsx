'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car, Eye, MapPin, Search, Shield, ShieldOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { blacklistService } from '@/services/blacklistService';
import { vehicleService } from '@/services/vehicleService';
import type { AlertSeverity, Vehicle } from '@/types';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const statusVariant = vehicle.status === 'blacklist' ? 'danger' : vehicle.status === 'watchlist' ? 'warning' : 'success';
  const glowType = vehicle.status === 'blacklist' ? 'crimson' : vehicle.status === 'watchlist' ? 'amber' : 'cyan';

  return (
    <Link href={`/vehicles/${vehicle.plate}`} className="block h-full">
      <GlassCard hover glow={glowType} className="h-full flex flex-col justify-between gap-4 p-5">
        <div>
          <div className="flex items-start justify-between mb-3"><span className="text-lg font-data font-extrabold text-cyan-300 tracking-wider">{vehicle.plate}</span><Badge variant={statusVariant} size="sm">{vehicle.status}</Badge></div>
          <div className="space-y-2 text-xs text-slate-300 font-body">
            <div className="flex items-center gap-2"><Car size={13} className="text-indigo-400 shrink-0" /><span>{vehicle.vehicleType} · {vehicle.color}</span></div>
            <div className="flex items-center gap-2 font-data"><Eye size={13} className="text-cyan-400 shrink-0" /><span><span className="text-white font-bold">{vehicle.totalDetections}</span> detections</span></div>
            <div className="flex items-center gap-2 font-data"><MapPin size={13} className="text-pink-400 shrink-0" /><span><span className="text-white font-bold">{vehicle.camerasVisited}</span> cameras visited</span></div>
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
    <PageWrapper className="space-y-8 font-body">
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-4">
        <h1 className="text-3xl font-bold text-white font-display">Vehicle Intelligence</h1>
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Search backend ANPR records and recorded trajectory histories</p>
        <div className="max-w-xl mx-auto"><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value.toUpperCase())} placeholder="Enter full or partial plate (e.g. UP70AB1234)" showSearchIcon shortcutHint={isSearching ? 'Searching…' : 'Live search'} className="h-12 text-base text-center" /></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard padding="md" className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4"><p className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">{searchQuery.trim() ? `Search matches (${displayVehicles.length})` : 'Recently sighted vehicles'}</p><Badge variant="info" size="sm">Backend records</Badge></div>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayVehicles.map((vehicle) => <motion.div variants={itemVariants} key={vehicle.plate} className="h-full"><VehicleCard vehicle={vehicle} /></motion.div>)}
          </motion.div>
          {displayVehicles.length === 0 && <div className="text-center py-16"><Search size={40} className="mx-auto mb-3 text-cyan-400/20" /><p className="text-xs font-mono text-slate-400">{searchQuery.trim() ? `No vehicles match "${searchQuery}"` : 'No recent vehicle detections are available.'}</p></div>}
        </GlassCard>

        <div className="space-y-5">
          <GlassCard padding="md">
            <div className="flex items-center gap-2 mb-4"><Shield size={16} className="text-rose-400" /><h2 className="text-xs font-display font-bold text-white uppercase tracking-wider">Add Blacklist Record</h2></div>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!plateNumber.trim()) return;
                addBlacklist.mutate({ plateNumber, reason, severity });
              }}
            >
              <Input value={plateNumber} onChange={(event) => setPlateNumber(event.target.value.toUpperCase())} placeholder="Plate number" className="h-10 text-xs font-mono" />
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for watchlist entry" className="w-full min-h-20 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/50" />
              <select value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity)} className="w-full h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-cyan-400/50">
                <option value="low">Low severity</option><option value="medium">Medium severity</option><option value="high">High severity</option><option value="critical">Critical severity</option>
              </select>
              <button type="submit" disabled={addBlacklist.isPending} className="w-full h-10 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs font-display font-bold text-rose-300 hover:bg-rose-500/25 disabled:opacity-50">{addBlacklist.isPending ? 'Saving…' : 'Add to blacklist'}</button>
              {addBlacklist.isError && <p className="text-xs text-rose-400">Unable to add this record. It may already be blacklisted.</p>}
            </form>
          </GlassCard>

          <GlassCard padding="md">
            <div className="flex items-center justify-between gap-2 mb-4"><div className="flex items-center gap-2"><Shield size={16} className="text-rose-400" /><h2 className="text-xs font-display font-bold text-white uppercase tracking-wider">Active Blacklist</h2></div><Badge variant="danger" size="sm">{blacklistedVehicles.length}</Badge></div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {blacklistedVehicles.map((record) => (
                <div key={record.id} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center justify-between gap-2"><Link href={`/vehicles/${record.plateNumber}`} className="font-mono text-xs font-extrabold text-rose-300 hover:text-white">{record.plateNumber}</Link><Badge variant={record.severity === 'critical' ? 'danger' : record.severity === 'high' ? 'warning' : 'info'} size="sm">{record.severity}</Badge></div>
                  <p className="text-[11px] text-slate-400 mt-1.5">{record.reason}</p>
                  <button onClick={() => deactivateBlacklist.mutate(record.id)} disabled={deactivateBlacklist.isPending} className="mt-2 text-[10px] font-display font-bold text-slate-300 hover:text-white flex items-center gap-1"><ShieldOff size={11} /> Deactivate</button>
                </div>
              ))}
              {blacklistedVehicles.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No active blacklist records.</p>}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<PageWrapper className="min-h-[450px] flex items-center justify-center text-xs font-mono text-slate-400">Loading vehicle search...</PageWrapper>}>
      <VehiclesPageContent />
    </Suspense>
  );
}
