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
import { BentoStatDeck } from '@/components/ui/BentoStatDeck';
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

      {/* ── KPI Stats Bento Grid ── */}
      <BentoStatDeck
        items={[
          {
            hero: true,
            category: 'WATCHLIST CENSUS',
            title: 'Active Surveillance Dockets',
            badge: { text: 'ENFORCEMENT LIVE', variant: 'rose' },
            value: vehicles.length,
            unit: 'flagged',
            trend: { text: '100% Optical Scanning', isPositive: true },
            note: `${criticalCount} Critical Priority Flags`,
            icon: ShieldAlert,
            colorTheme: 'rose',
            visual: 'none',
          },
          {
            category: 'CRITICAL THREATS',
            title: 'Immediate intercept flags',
            value: criticalCount,
            badge: { text: 'CRITICAL', variant: 'critical' },
            icon: AlertTriangle,
            colorTheme: 'rose',
            visual: 'action-link',
            visualMeta: {
              subNote: 'High-priority law enforcement',
            },
          },
          {
            category: 'HIGH THREATS',
            title: 'Elevated surveillance docket',
            value: highCount,
            icon: Shield,
            colorTheme: 'amber',
            visual: 'segmented-bar',
            visualMeta: {
              subLabel: 'Surveillance Load',
              subNote: `${highCount} active investigations`,
            },
          },
          {
            category: 'DETECTIONS TODAY',
            title: 'Total optical match hits',
            value: vehicles.reduce((sum, v) => sum + (v.vehicleIntelligence?.totalDetections || 0), 0),
            icon: Camera,
            colorTheme: 'cyan',
            visual: 'ring',
            visualMeta: {
              ringValue: 98,
              ringText: '98%',
              subLabel: 'Match Confidence',
              subNote: 'OCR Verification',
            },
          },
        ]}
      />

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
                  padding="none"
                  glow={isCritical ? 'rose' : isHigh ? 'amber' : 'violet'}
                  accent={isCritical ? 'rose' : isHigh ? 'amber' : 'violet'}
                  className="p-5 flex flex-col gap-5 border-white/5"
                >
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0 border border-rose-500/20">
                        <Car size={24} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xl font-bold font-mono text-white tracking-wider">{vehicle.plateNumber}</span>
                          <Badge variant={isCritical ? 'danger' : isHigh ? 'warning' : 'info'} size="sm">
                            ● {vehicle.severity} THREAT
                          </Badge>
                          <Badge variant="default" size="sm" className="border-white/10 text-[var(--text-secondary)] bg-white/5">
                            {vehicle.vehicleIntelligence.vehicleType}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                          <ShieldAlert size={12} className="text-rose-400 shrink-0" />
                          {vehicle.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Link href={`/vehicles/${vehicle.plateNumber}/trajectory`}>
                        <Button variant="secondary" size="sm" className="gap-2 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white font-mono text-[11px] h-8 cursor-pointer">
                          <Navigation size={12} /> Track Trajectory
                        </Button>
                      </Link>
                      <Link href={`/vehicles/${vehicle.plateNumber}`} className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-white flex items-center gap-1.5 transition-colors">
                        <ExternalLink size={12} /> Full Profile
                      </Link>
                    </div>
                  </div>

                  {/* Main Panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Panel: Last Sighted Location */}
                    <div className="rounded-2xl bg-[#0B0F19]/60 border border-white/5 p-5 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold tracking-wider font-mono">
                            <MapPin size={12} /> LAST SIGHTED LOCATION
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {vehicle.lastSighting?.cameraCode || vehicle.lastSighting?.cameraId || 'UNKNOWN'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1 font-display tracking-tight">{vehicle.lastSighting?.cameraName || 'Unknown Location'}</h3>
                        <p className="text-[11px] text-[var(--text-secondary)] font-mono">Sector: {vehicle.lastSighting?.zone || 'Unknown'} • {vehicle.lastSighting?.road || 'Unknown'}</p>

                        <div className="mt-5 p-3 rounded-xl bg-black/40 border border-white/5 grid grid-cols-3 gap-4">
                          <div>
                            <span className="block text-[9px] text-[var(--text-tertiary)] font-bold mb-1 uppercase tracking-wider font-mono">Time</span>
                            <span className="text-xs font-mono text-white font-bold">{vehicle.lastSighting ? formatTime(vehicle.lastSighting.timestamp) : '--:--:--'}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-[var(--text-tertiary)] font-bold mb-1 uppercase tracking-wider font-mono">Velocity</span>
                            <span className="text-xs font-mono text-cyan-400 font-bold">{vehicle.lastSighting?.speed || '--'} km/h</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-[var(--text-tertiary)] font-bold mb-1 uppercase tracking-wider font-mono">Heading</span>
                            <span className="text-xs font-mono text-violet-400 font-bold uppercase">{vehicle.lastSighting?.direction || 'UNKNOWN'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 relative z-10">
                        <button className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer">
                          <Camera size={12} /> Open Optical Feed ({vehicle.lastSighting?.cameraCode || vehicle.lastSighting?.cameraId || 'CAM'}) →
                        </button>
                      </div>
                    </div>

                    {/* Right Panel: Next Probable Camera Location */}
                    <div className="rounded-2xl bg-[#0B0F19]/60 border border-white/5 p-5 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        {vehicle.nextProbableCamera ? (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-violet-400 text-[10px] font-bold tracking-wider font-mono">
                                  <Sparkles size={12} /> NEXT PROBABLE CAMERA LOCATION
                                </div>
                              </div>
                              <h3 className="text-lg font-bold text-white mb-1 font-display tracking-tight">
                                {vehicle.nextProbableCamera.cameraName} <span className="text-[var(--text-secondary)] font-normal text-sm">({vehicle.nextProbableCamera.cameraCode || vehicle.nextProbableCamera.cameraId})</span>
                              </h3>
                              <p className="text-[11px] text-[var(--text-secondary)] font-mono">Sector: {vehicle.nextProbableCamera.zone || 'Unknown'} • {vehicle.nextProbableCamera.road || 'Unknown'}</p>

                              <div className="mt-5 grid grid-cols-2 gap-4">
                                <div>
                                  <span className="block text-[9px] text-[var(--text-tertiary)] font-bold mb-1 uppercase tracking-wider font-mono">Estimated Arrival</span>
                                  <span className="text-xs font-mono text-emerald-400 font-bold">~{vehicle.nextProbableCamera.etaMinutes || (vehicle.nextProbableCamera as any).estimatedTimeMins || '--'} min</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-[var(--text-tertiary)] font-bold mb-1 uppercase tracking-wider font-mono">Confidence</span>
                                  <span className="text-xs font-mono text-white font-bold">{vehicle.nextProbableCamera.confidence || (vehicle.nextProbableCamera.probability > 0.7 ? 'HIGH' : vehicle.nextProbableCamera.probability > 0.4 ? 'MEDIUM' : 'LOW')}</span>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">
                                  <span>Transition Probability</span>
                                  <span className="text-white font-bold">{Math.round(vehicle.nextProbableCamera.probability * 100)}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                                    style={{ width: `${Math.round(vehicle.nextProbableCamera.probability * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              <button className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer">
                                <Camera size={12} /> Open predicted camera feed ({vehicle.nextProbableCamera.cameraCode || vehicle.nextProbableCamera.cameraId}) →
                              </button>
                              {vehicle.nextProbableCamera.alternativeCameras && vehicle.nextProbableCamera.alternativeCameras.length > 0 && (
                                <p className="text-[10px] font-mono text-[var(--text-tertiary)] truncate">
                                  Alternatives: {vehicle.nextProbableCamera.alternativeCameras.map((c: any) => `${c.cameraCode || c.cameraId} (${Math.round(c.probability * 100)}%)`).join(' • ')}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-xs font-mono text-[var(--text-tertiary)]">
                            Insufficient telemetry for prediction
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-1 mt-1 border-t border-white/5 gap-4">
                    <div className="flex items-center gap-4 sm:gap-6 text-[10px] font-mono text-[var(--text-secondary)] flex-wrap">
                      <span>Detections: <span className="text-white font-bold">{vehicle.vehicleIntelligence.totalDetections}</span></span>
                      <span>Cameras Visited: <span className="text-cyan-400 font-bold">{vehicle.vehicleIntelligence.camerasVisited}</span></span>
                      <span>First Sighted: <span className="text-white font-bold">{formatDateTime(vehicle.vehicleIntelligence.firstSeen)}</span></span>
                      <span>Avg Speed: <span className="text-emerald-400 font-bold">{vehicle.vehicleIntelligence.averageSpeed ? `${Math.round(vehicle.vehicleIntelligence.averageSpeed)} km/h` : '--'}</span></span>
                    </div>

                    <button
                      onClick={() => deactivateMutation.mutate(vehicle.id)}
                      disabled={deactivateMutation.isPending}
                      className="text-[11px] font-mono text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 size={12} /> Deactivate Watchlist Flag
                    </button>
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
