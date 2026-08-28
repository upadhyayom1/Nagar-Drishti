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
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
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
      (v.lastSighting?.cameraName && v.lastSighting.cameraName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity =
      severityFilter === 'all' || v.severity.toLowerCase() === severityFilter.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const criticalCount = vehicles.filter((v: BlacklistIntelligenceVehicle) => v.severity === 'CRITICAL').length;
  const highCount = vehicles.filter((v: BlacklistIntelligenceVehicle) => v.severity === 'HIGH').length;
  const activeCount = vehicles.filter((v: BlacklistIntelligenceVehicle) => v.status === 'ACTIVE').length;

  return (
    <PageWrapper className="space-y-8 font-body">
      {/* ── Top Header & KPI Bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-display">Watchlist Threat Intelligence</h1>
              <p className="text-xs font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
                Dedicated surveillance grid for blacklisted and high-risk priority vehicles
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin text-cyan-400' : ''} />
            Sync Grid
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold bg-gradient-to-r from-rose-500 via-crimson-500 to-amber-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
          >
            <Plus size={14} />
            Flag Vehicle
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Bar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <GlassCard padding="sm" className="border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">Total Flagged</span>
            <Shield size={16} className="text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-white font-data mt-1">{vehicles.length}</p>
          <span className="text-[10px] text-slate-400 font-mono">Monitored across 52 optical nodes</span>
        </GlassCard>

        <GlassCard padding="sm" className="border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-rose-300 uppercase font-bold">Critical Threats</span>
            <Badge variant="danger" size="sm" dot pulse>{criticalCount}</Badge>
          </div>
          <p className="text-2xl font-extrabold text-rose-400 font-data mt-1">{criticalCount}</p>
          <span className="text-[10px] text-rose-400/80 font-mono">Immediate intercept priority</span>
        </GlassCard>

        <GlassCard padding="sm" className="border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-300 uppercase font-bold">High Priority</span>
            <Badge variant="warning" size="sm">{highCount}</Badge>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 font-data mt-1">{highCount}</p>
          <span className="text-[10px] text-amber-400/80 font-mono">Active warrant investigations</span>
        </GlassCard>

        <GlassCard padding="sm" className="border-cyan-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyan-300 uppercase font-bold">Active Status</span>
            <Badge variant="success" size="sm">{activeCount} Active</Badge>
          </div>
          <p className="text-2xl font-extrabold text-cyan-400 font-data mt-1">{activeCount}</p>
          <span className="text-[10px] text-cyan-400/80 font-mono">Real-time alert tracking enabled</span>
        </GlassCard>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by plate number, threat reason, or junction..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all font-body"
          />
        </div>

        {/* Severity Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-slate-400 mr-1" />
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={cn(
                'text-[11px] font-mono px-3 py-1.5 rounded-xl border transition-all capitalize',
                severityFilter === s
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Blacklisted Vehicles Intelligence Cards ─────────────────────────── */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredVehicles.map((vehicle: BlacklistIntelligenceVehicle, index: number) => {
            const isCritical = vehicle.severity === 'CRITICAL';
            const isHigh = vehicle.severity === 'HIGH';
            const svVariant = isCritical ? 'danger' : isHigh ? 'warning' : 'default';

            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <GlassCard
                  hover
                  glow={isCritical ? 'crimson' : isHigh ? 'amber' : 'cyan'}
                  className={cn(
                    'border relative overflow-hidden',
                    isCritical
                      ? 'border-rose-500/40 shadow-[0_0_35px_rgba(244,63,94,0.15)]'
                      : isHigh
                      ? 'border-amber-500/35 shadow-[0_0_25px_rgba(251,191,36,0.1)]'
                      : 'border-white/10',
                  )}
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className={cn(
                      'absolute top-0 left-0 right-0 h-1',
                      isCritical
                        ? 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500'
                        : isHigh
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500',
                    )}
                  />

                  <div className="space-y-5 pt-2">
                    {/* Top Row: Plate, Badges, Reason & Actions */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                          <Car size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-xl font-extrabold text-white font-data tracking-wider">
                              {vehicle.plateNumber}
                            </span>
                            <Badge variant={svVariant} size="sm" dot pulse={isCritical}>
                              {vehicle.severity} THREAT
                            </Badge>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                              {vehicle.vehicleIntelligence.vehicleType}
                            </span>
                          </div>
                          <p className="text-xs text-rose-300 font-medium font-body mt-1 flex items-center gap-1.5">
                            <ShieldAlert size={13} className="shrink-0 text-rose-400" />
                            {vehicle.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/vehicles/${vehicle.plateNumber}/trajectory`}>
                          <Button variant="secondary" size="sm" className="text-xs">
                            <Navigation size={13} />
                            Track Trajectory
                          </Button>
                        </Link>
                        <Link href={`/vehicles/${vehicle.plateNumber}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <ExternalLink size={13} />
                            Full Profile
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Dual Telemetry & Prediction Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* ── CARD 1: LAST SIGHTED TELEMETRY ──────────────────────────── */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-cyan-300 font-display text-xs font-bold">
                            <MapPin size={14} className="text-cyan-400" />
                            <span>LAST SIGHTED LOCATION</span>
                          </div>
                          {vehicle.lastSighting && (
                            <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/25">
                              {vehicle.lastSighting.cameraCode}
                            </span>
                          )}
                        </div>

                        {vehicle.lastSighting ? (
                          <div className="space-y-2.5 text-xs font-body">
                            <div>
                              <p className="font-bold text-white text-sm font-display leading-tight">
                                {vehicle.lastSighting.cameraName}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Sector: {vehicle.lastSighting.zone} · {vehicle.lastSighting.road}
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.05] text-[10px] font-data">
                              <div>
                                <span className="text-slate-400 block text-[9px] font-display uppercase font-bold">TIME</span>
                                <span className="text-white font-bold">{formatTime(vehicle.lastSighting.timestamp)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] font-display uppercase font-bold">VELOCITY</span>
                                <span className="text-cyan-400 font-bold">{vehicle.lastSighting.speed} km/h</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] font-display uppercase font-bold">HEADING</span>
                                <span className="text-violet-400 font-bold">{vehicle.lastSighting.direction}</span>
                              </div>
                            </div>

                            <Link href={`/cameras/${vehicle.lastSighting.cameraId}`} className="block pt-1">
                              <span className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors">
                                <Camera size={12} /> Open Optical Feed ({vehicle.lastSighting.cameraCode}) →
                              </span>
                            </Link>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-500 text-xs font-mono">
                            No optical sightings logged for this vehicle
                          </div>
                        )}
                      </div>

                      {/* ── CARD 2: NEXT PROBABLE CAMERA LOCATION (ML SENTRY) ───────── */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/[0.08] space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-violet-300 font-display text-xs font-bold">
                            <Sparkles size={14} className="text-violet-400" />
                            <span>NEXT PROBABLE CAMERA LOCATION</span>
                          </div>
                          <span className="text-[10px] font-mono text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/25">
                            ML Sentry
                          </span>
                        </div>

                        {/* ML Prediction Rendering or Clean Configured Pending State */}
                        {vehicle.nextProbableCamera ? (
                          <div className="space-y-2.5 text-xs font-body">
                            <div>
                              <p className="font-bold text-white text-sm font-display leading-tight">
                                {vehicle.nextProbableCamera.cameraName} ({vehicle.nextProbableCamera.cameraCode})
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Sector: {vehicle.nextProbableCamera.zone || 'Target Sector'}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.05] text-[10px] font-data">
                              <div><span className="block text-[9px] font-display uppercase font-bold text-slate-400">Estimated arrival</span><span className="font-bold text-cyan-300">{vehicle.nextProbableCamera.etaMinutes ? `~${vehicle.nextProbableCamera.etaMinutes} min` : 'Calculating'}</span></div>
                              <div><span className="block text-[9px] font-display uppercase font-bold text-slate-400">Confidence</span><span className="font-bold text-violet-300">{vehicle.nextProbableCamera.confidence || 'LOW'}</span></div>
                            </div>

                            {/* Probability Bar */}
                            <div>
                              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                                <span>Transition Probability</span>
                                <span className="text-violet-300 font-bold">
                                  {Math.round(vehicle.nextProbableCamera.probability * 100)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
                                <div
                                  className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full transition-all"
                                  style={{ width: `${Math.round(vehicle.nextProbableCamera.probability * 100)}%` }}
                                />
                              </div>
                            </div>

                            <Link href={`/cameras/${vehicle.nextProbableCamera.cameraId}`} className="block pt-1">
                              <span className="text-[11px] font-mono text-violet-300 hover:text-violet-200 flex items-center gap-1 font-semibold transition-colors"><Camera size={12} /> Open predicted camera feed ({vehicle.nextProbableCamera.cameraCode}) →</span>
                            </Link>
                            {vehicle.nextProbableCamera.alternativeCameras && vehicle.nextProbableCamera.alternativeCameras.length > 0 && <p className="text-[10px] font-mono text-slate-400">Alternatives: {vehicle.nextProbableCamera.alternativeCameras.map((camera) => `${camera.cameraCode} (${Math.round(camera.probability * 100)}%)`).join(' · ')}</p>}
                          </div>
                        ) : (
                          <div className="py-3 px-3.5 rounded-xl bg-black/40 border border-dashed border-violet-500/20 text-center space-y-2">
                            <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400">
                              <Zap size={14} className="animate-pulse" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200 font-display">No route prediction yet</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 leading-relaxed">
                                A prediction appears after this vehicle receives a camera sighting and the network has an onward camera route.
                              </p>
                            </div>
                            <span className="inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">
                              Status: waiting for route telemetry
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Intelligence Metrics Strip */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.06] text-xs font-data text-slate-400 flex-wrap">
                      <div className="flex items-center gap-5 flex-wrap">
                        <span>
                          Detections: <span className="text-white font-bold">{vehicle.vehicleIntelligence.totalDetections}</span>
                        </span>
                        <span>
                          Cameras Visited: <span className="text-cyan-400 font-bold">{vehicle.vehicleIntelligence.camerasVisited}</span>
                        </span>
                        <span>
                          First Sighted: <span className="text-slate-300 font-bold">{formatDateTime(vehicle.vehicleIntelligence.firstSeen)}</span>
                        </span>
                        <span>
                          Avg Speed: <span className="text-emerald-400 font-bold">{vehicle.vehicleIntelligence.averageSpeed} km/h</span>
                        </span>
                      </div>

                      <button
                        onClick={() => deactivateMutation.mutate(vehicle.id)}
                        disabled={deactivateMutation.isPending}
                        className="text-xs text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1.5 transition-colors"
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
          <GlassCard padding="lg" className="text-center py-16 border-dashed border-white/10">
            <Shield size={40} className="mx-auto mb-3 text-rose-400/30" />
            <p className="text-sm font-display font-bold text-white">No blacklisted vehicles match the selected filter</p>
            <p className="text-xs font-mono text-slate-400 mt-1">Try clearing search terms or changing threat severity</p>
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
            <GlassCard padding="md" className="border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.2)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-rose-400">
                  <ShieldAlert size={20} />
                  <h3 className="font-bold text-base text-white font-display">Flag Vehicle on Watchlist</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono"
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
                  <label className="block text-xs font-mono text-slate-300 uppercase font-bold mb-1.5">
                    License Plate Number
                  </label>
                  <input
                    type="text"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                    placeholder="e.g. UP70EX7525"
                    className="w-full bg-slate-950/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white font-data placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all uppercase"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase font-bold mb-1.5">
                    Threat Severity Level
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setNewSeverity(sev.toLowerCase() as AlertSeverity)}
                        className={cn(
                          'py-2 rounded-xl text-xs font-mono font-bold border transition-all',
                          newSeverity === sev.toLowerCase()
                            ? sev === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                              : sev === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                            : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white',
                        )}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase font-bold mb-1.5">
                    Surveillance Reason / Investigation Docket
                  </label>
                  <textarea
                    rows={3}
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="e.g. Stolen vehicle case #PYG-2026-0819, flagged by Central Station..."
                    className="w-full bg-slate-950/90 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={addMutation.isPending}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
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
