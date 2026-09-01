'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Car,
  Camera,
  Clock,
  Navigation,
  Sparkles,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { blacklistService } from '@/services/blacklistService';
import { formatDateTime, formatTime, cn } from '@/lib/utils';
import type { AlertSeverity, BlacklistIntelligenceVehicle } from '@/types';

export default function BlacklistPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for adding to watchlist
  const [newPlate, setNewPlate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newSeverity, setNewSeverity] = useState<AlertSeverity>('high');
  const [formError, setFormError] = useState('');

  // Fetch enriched blacklist intelligence
  const { data: vehicles = [], refetch, isFetching } = useQuery({
    queryKey: ['blacklistIntelligence'],
    queryFn: () => blacklistService.getIntelligenceVehicles('ALL'),
    refetchInterval: 6_000,
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => blacklistService.deactivateVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistIntelligence'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['recentAlerts'] });
    },
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (input: { plateNumber: string; reason: string; severity: AlertSeverity }) =>
      blacklistService.addVehicle(input),
    onSuccess: () => {
      setShowAddModal(false);
      setNewPlate('');
      setNewReason('');
      setNewSeverity('high');
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['blacklistIntelligence'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to add vehicle to watchlist');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) {
      setFormError('Please enter a valid license plate number');
      return;
    }
    if (!newReason.trim()) {
      setFormError('Please provide a reason or surveillance docket');
      return;
    }
    addMutation.mutate({
      plateNumber: newPlate.trim().toUpperCase(),
      reason: newReason.trim(),
      severity: newSeverity,
    });
  };

  // Filtering
  const filteredVehicles = vehicles.filter((v: BlacklistIntelligenceVehicle) => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicleIntelligence.vehicleType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || v.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const criticalCount = vehicles.filter((v) => v.severity === 'CRITICAL').length;
  const highCount = vehicles.filter((v) => v.severity === 'HIGH').length;

  return (
    <PageWrapper className="space-y-6 font-body">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.3)]">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display tracking-tight">
                Sentinel Watchlist &amp; Blacklist Operations
              </h1>
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">
                Law enforcement hotlist · Spatiotemporal threat tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-400/40 transition-all cursor-pointer"
            title="Refresh Watchlist Grid"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>

          <Button
            variant="danger"
            size="md"
            onClick={() => setShowAddModal(true)}
            className="shadow-[0_0_20px_rgba(244,63,94,0.3)] cursor-pointer"
          >
            <Plus size={16} /> Flag Vehicle on Watchlist
          </Button>
        </div>
      </div>

      {/* ── KPI Stats Cards Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard padding="md" glow="rose" accent="rose">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
            <span>ACTIVE WATCHLIST</span>
            <ShieldAlert size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-data text-[var(--text-primary)] mt-1.5">{vehicles.length}</div>
          <div className="text-[10px] font-mono text-rose-400 mt-1 flex items-center gap-1">
            <Zap size={10} /> Continuous Optical Scanning
          </div>
        </GlassCard>

        <GlassCard padding="md" glow="rose" accent="rose">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
            <span>CRITICAL THREATS</span>
            <AlertTriangle size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-data text-rose-400 mt-1.5">{criticalCount}</div>
          <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">High-priority law enforcement flags</div>
        </GlassCard>

        <GlassCard padding="md" glow="amber" accent="amber">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
            <span>HIGH THREATS</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-data text-amber-400 mt-1.5">{highCount}</div>
          <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">Elevated surveillance docket</div>
        </GlassCard>

        <GlassCard padding="md" glow="cyan" accent="cyan">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
            <span>DETECTIONS TODAY</span>
            <Camera size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-data text-cyan-400 mt-1.5">
            {vehicles.reduce((sum, v) => sum + (v.vehicleIntelligence.totalDetections || 0), 0)}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">Total optical match hits</div>
        </GlassCard>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plate number, reason, or model..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-rose-400/60 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Filter size={14} className="text-[var(--text-tertiary)] shrink-0" />
          {(['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                'text-xs font-mono font-semibold px-3 py-1.5 rounded-xl border capitalize transition-all shrink-0 cursor-pointer',
                severityFilter === sev
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-[var(--glass-surface)] text-[var(--text-secondary)] border-[var(--glass-border)] hover:text-[var(--text-primary)] hover:border-rose-400/30'
              )}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* ── Blacklisted Vehicles Grid ────────────────────────────────── */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredVehicles.map((vehicle: BlacklistIntelligenceVehicle, index: number) => {
            const isCritical = vehicle.severity === 'CRITICAL';
            const isHigh = vehicle.severity === 'HIGH';

            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
              >
                <GlassCard
                  padding="md"
                  glow={isCritical ? 'rose' : isHigh ? 'amber' : 'violet'}
                  accent={isCritical ? 'rose' : isHigh ? 'amber' : 'violet'}
                  className="p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left Column: Plate & Reason */}
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/vehicles/${vehicle.plateNumber}`}
                          className="text-2xl font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                        >
                          {vehicle.plateNumber}
                          <ExternalLink size={15} className="opacity-70" />
                        </Link>

                        <Badge variant={isCritical ? 'danger' : isHigh ? 'warning' : 'info'} size="sm">
                          {vehicle.severity} THREAT
                        </Badge>

                        <span className="text-xs font-mono text-[var(--text-secondary)] px-2.5 py-0.5 rounded-md bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                          {vehicle.vehicleIntelligence.vehicleType} · {vehicle.vehicleIntelligence.color}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-body">
                        <span className="font-semibold text-[var(--text-primary)]">Docket Reason:</span> {vehicle.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[var(--text-tertiary)] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-rose-400" /> Flagged: {formatDateTime(vehicle.flaggedAt)}
                        </span>
                        <span>Flagged by: <span className="text-[var(--text-secondary)]">Municipal Operator</span></span>
                      </div>
                    </div>

                    {/* Middle Column: Last Sighting Intelligence */}
                    {vehicle.lastSighting ? (
                      <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-1.5 min-w-[240px]">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-tertiary)]">
                          <span className="flex items-center gap-1 font-bold text-cyan-400">
                            <Navigation size={11} /> Last Sight Telemetry
                          </span>
                          <span>{formatTime(vehicle.lastSighting.timestamp)}</span>
                        </div>
                        <p className="text-xs font-semibold text-[var(--text-primary)] font-display truncate">
                          {vehicle.lastSighting.cameraName}
                        </p>
                        <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                          <span>Node: {vehicle.lastSighting.cameraId}</span>
                          <span>Speed: <span className="text-cyan-400 font-bold">{vehicle.lastSighting.speed} km/h</span></span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-center text-xs font-mono text-[var(--text-tertiary)] min-w-[240px]">
                        No active sightings today
                      </div>
                    )}

                    {/* Right Column: Actions */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--glass-border)]">
                      <div className="text-right hidden lg:block">
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)] block">OPTICAL HITS TODAY</span>
                        <span className="text-lg font-bold font-data text-rose-400">{vehicle.vehicleIntelligence.totalDetections}</span>
                      </div>

                      <button
                        onClick={() => deactivateMutation.mutate(vehicle.id)}
                        disabled={deactivateMutation.isPending}
                        className="text-xs text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        Deactivate Watchlist Flag
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredVehicles.length === 0 && (
          <GlassCard padding="lg" className="text-center py-16 border-dashed border-[var(--glass-border)]">
            <Shield size={40} className="mx-auto mb-3 text-rose-400/30" />
            <p className="text-sm font-display font-bold text-[var(--text-primary)]">No blacklisted vehicles match the selected filter</p>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">Try clearing search terms or changing threat severity</p>
          </GlassCard>
        )}
      </div>

      {/* ── Add to Blacklist Modal ───────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <GlassCard padding="md" className="border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.2)] bg-[var(--glass-surface)] backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-rose-400">
                  <ShieldAlert size={20} />
                  <h3 className="font-bold text-base text-[var(--text-primary)] font-display">Flag Vehicle on Watchlist</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase font-bold mb-1.5">
                    License Plate Number
                  </label>
                  <input
                    type="text"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    placeholder="e.g. UP70EX7525"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] font-data placeholder-[var(--text-tertiary)] focus:outline-none focus:border-rose-500 transition-all uppercase"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase font-bold mb-1.5">
                    Threat Severity Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setNewSeverity(sev.toLowerCase() as AlertSeverity)}
                        className={cn(
                          'py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer',
                          newSeverity === sev.toLowerCase()
                            ? sev === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                              : sev === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                            : 'bg-white/[0.04] text-[var(--text-secondary)] border-[var(--glass-border)] hover:text-[var(--text-primary)]',
                        )}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase font-bold mb-1.5">
                    Surveillance Reason / Investigation Docket
                  </label>
                  <textarea
                    rows={3}
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="e.g. Stolen vehicle case #PYG-2026-0819, flagged by Central Station..."
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--glass-border)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-rose-500 transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={addMutation.isPending}
                    className="cursor-pointer font-bold"
                  >
                    {addMutation.isPending ? 'Flagging...' : 'Add to Watchlist'}
                  </Button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
}
