'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Car,
  User,
  Clock,
  CheckCircle2,
  Send,
  XCircle,
  Trash2,
  Image as ImageIcon,
  Video,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { submissionService } from '@/services/submissionService';
import { formatTime, formatRelativeTime, formatDateTime } from '@/lib/utils';
import type { CitizenSubmission } from '@/types';
import Link from 'next/link';

export default function FieldSubmissionsPage() {
  const queryClient = useQueryClient();
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'HIGH' | 'LOW' | 'PENDING' | 'DISPATCHED'>('ALL');

  const { data: submissions = [], refetch, isFetching } = useQuery({
    queryKey: ['citizenSubmissions'],
    queryFn: submissionService.getSubmissions,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CitizenSubmission['status'] }) =>
      submissionService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['citizenSubmissions'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => submissionService.deleteSubmission(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['citizenSubmissions'] }),
  });

  // Sort: HIGH priority first, then latest timestamps
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
    if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const filtered = sortedSubmissions.filter((sub) => {
    if (filterPriority === 'ALL') return true;
    if (filterPriority === 'HIGH') return sub.priority === 'HIGH';
    if (filterPriority === 'LOW') return sub.priority === 'LOW';
    if (filterPriority === 'PENDING') return sub.status === 'PENDING';
    if (filterPriority === 'DISPATCHED') return sub.status === 'DISPATCHED';
    return true;
  });

  const highPriorityCount = submissions.filter((s) => s.priority === 'HIGH').length;
  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  return (
    <PageWrapper className="space-y-6 font-body">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">Citizen Field Submissions</h1>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">
            Incoming citizen incident uploads · <span className="text-[var(--status-critical)] font-bold">{highPriorityCount} High Priority</span> · {pendingCount} Pending Dispatch
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/report">
            <Button variant="secondary" size="sm">
              Citizen Portal View
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Sync Queue
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-[var(--text-tertiary)] mr-1" />
        {(['ALL', 'HIGH', 'LOW', 'PENDING', 'DISPATCHED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterPriority(tab)}
            className={`text-xs font-display font-semibold px-3.5 py-1.5 rounded-xl border transition-all duration-150 capitalize ${
              filterPriority === tab
                ? 'bg-[var(--brand-teal)]/15 text-[var(--brand-teal)] border-[var(--brand-teal)]/40 shadow-[0_0_15px_rgba(31,217,168,0.2)] font-bold'
                : 'bg-white/[0.03] text-[var(--text-secondary)] border-[var(--glass-border)] hover:border-white/20 hover:text-[var(--text-primary)]'
            }`}
          >
            {tab === 'ALL' ? `All Reports (${submissions.length})` : tab}
          </button>
        ))}
      </div>

      {/* Submissions Queue */}
      <div className="space-y-3.5">
        <AnimatePresence mode="popLayout">
          {filtered.map((sub, i) => {
            const isHigh = sub.priority === 'HIGH';
            const isPending = sub.status === 'PENDING';
            const isDispatched = sub.status === 'DISPATCHED';

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <GlassCard
                  hover
                  glow={isHigh ? 'critical' : 'teal'}
                  className={`p-5 border transition-all ${
                    isHigh
                      ? 'border-[var(--status-critical)]/40 shadow-[0_0_24px_rgba(255,77,79,0.12)]'
                      : 'border-[var(--glass-border)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    
                    {/* Media Type / Priority Icon Capsule */}
                    <div className={`p-3.5 rounded-2xl shrink-0 border border-white/10 ${
                      isHigh
                        ? 'bg-[var(--status-critical)]/15 text-[var(--status-critical)]'
                        : 'bg-[var(--brand-teal)]/15 text-[var(--brand-teal)]'
                    }`}>
                      {isHigh ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      
                      {/* Top Row: Ref ID, Priority Badge, Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-[var(--brand-teal)] bg-[var(--brand-teal)]/10 px-2 py-0.5 rounded border border-[var(--brand-teal)]/25">
                            {sub.id}
                          </span>
                          <h3 className="text-sm font-bold text-[var(--text-primary)] font-display truncate">{sub.title}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={isHigh ? 'critical' : 'ok'} size="sm" dot={isHigh} pulse={isHigh}>
                            {sub.priority} PRIORITY
                          </Badge>
                          <Badge
                            variant={isDispatched ? 'ok' : isPending ? 'warn' : 'default'}
                            size="sm"
                          >
                            {sub.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-secondary)] mb-3.5 leading-relaxed font-body">
                        {sub.description}
                      </p>

                      {/* Metadata Grid */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-mono text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1.5 font-body text-[var(--text-primary)]">
                          <MapPin size={13} className="text-[var(--brand-teal)] shrink-0" />
                          {sub.location}
                        </span>

                        {sub.vehiclePlate && (
                          <Link
                            href={`/vehicles/${sub.vehiclePlate}`}
                            className="flex items-center gap-1 text-[var(--signal-cyan)] font-bold bg-[var(--signal-cyan)]/10 px-2 py-0.5 rounded border border-[var(--signal-cyan)]/25 hover:underline"
                          >
                            <Car size={13} /> {sub.vehiclePlate}
                          </Link>
                        )}

                        <span className="flex items-center gap-1.5">
                          <User size={13} className="text-[var(--text-tertiary)] shrink-0" />
                          {sub.submitterName} {sub.submitterContact ? `(${sub.submitterContact})` : ''}
                        </span>

                        <span
                          title={formatDateTime(sub.timestamp)}
                          className="flex items-center gap-1.5 text-[var(--text-tertiary)] ml-auto cursor-help"
                        >
                          <Clock size={13} />
                          {formatRelativeTime(sub.timestamp)}
                        </span>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between gap-2.5 mt-4 pt-3.5 border-t border-[var(--glass-border)] flex-wrap">
                        <div className="flex items-center gap-2">
                          {sub.status !== 'DISPATCHED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: sub.id, status: 'DISPATCHED' })}
                            >
                              <Send size={13} /> Dispatch Unit
                            </Button>
                          )}
                          {sub.status === 'PENDING' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: sub.id, status: 'REVIEWED' })}
                            >
                              <CheckCircle2 size={13} /> Mark Reviewed
                            </Button>
                          )}
                          {sub.status !== 'DISMISSED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: sub.id, status: 'DISMISSED' })}
                            >
                              <XCircle size={13} /> Dismiss
                            </Button>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(sub.id)}
                          className="text-[var(--text-tertiary)] hover:text-[var(--status-critical)]"
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-xs font-mono text-[var(--text-tertiary)]">
            <Inbox size={40} className="mx-auto mb-3 text-[var(--brand-teal)]/20" />
            No citizen submissions match the selected criteria
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
