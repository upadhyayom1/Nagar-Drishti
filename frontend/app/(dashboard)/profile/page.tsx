'use client';

import { motion } from 'framer-motion';
import { Shield, User, Clock, MapPin, Radio, Key, LogOut, Sun, Moon, CheckCircle2, Award, Zap, ShieldCheck, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function UserProfilePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useUIStore();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.logout);
  const displayName = user?.name || user?.username || 'Operator';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await authService.logout().catch(() => undefined);
    clearUser();
    router.push('/login');
  };

  return (
    <PageWrapper className="max-w-4xl mx-auto space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] tracking-tight">Operator Profile &amp; Clearance</h1>
        <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">
          Active shift credentials · Cryptographic tokens · Municipal dispatch scope
        </p>
      </div>

      {/* Main Profile Header Card */}
      <GlassCard padding="lg" glow="spectral" className="relative overflow-hidden border border-cyan-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00f0ff] via-[#6366f1] to-[#ec4899] p-0.5 shadow-[0_0_24px_rgba(0,240,255,0.5)]">
                <div className="w-full h-full rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center text-2xl font-bold font-display text-white">
                  {initials}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-400 border-2 border-[var(--bg-elevated)] shadow-[0_0_10px_#10b981]" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold font-display text-[var(--text-primary)]">{displayName}</h2>
                <Badge variant="cyan" size="md">{user?.role === 'ADMIN' ? 'ADMIN ACCESS' : 'USER ACCESS'}</Badge>
              </div>
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
                {user?.role === 'ADMIN' ? 'Municipal command center account' : 'Citizen reporting account'}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-emerald-400">
                <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Biometrics Verified</span>
                <span>·</span>
                <span className="text-cyan-400">Active Shift: 4h 32m</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button variant="secondary" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-violet-400" />}
              {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Telemetry Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard padding="md" glow="cyan">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Activity size={16} />
            <span className="text-xs font-display font-bold uppercase tracking-wider">Shift Performance</span>
          </div>
          <div className="text-2xl font-bold font-data tabular-nums text-[var(--text-primary)]">99.8%</div>
          <p className="text-xs text-[var(--text-secondary)] font-body mt-1">Telemetry response rate across all 10 nodes</p>
        </GlassCard>

        <GlassCard padding="md" glow="violet">
          <div className="flex items-center gap-2 text-violet-400 mb-2">
            <Radio size={16} />
            <span className="text-xs font-display font-bold uppercase tracking-wider">Dispatched Triage</span>
          </div>
          <div className="text-2xl font-bold font-data tabular-nums text-[var(--text-primary)]">24 Events</div>
          <p className="text-xs text-[var(--text-secondary)] font-body mt-1">Field incidents handled in current shift</p>
        </GlassCard>

        <GlassCard padding="md" glow="emerald">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ShieldCheck size={16} />
            <span className="text-xs font-display font-bold uppercase tracking-wider">Sector Authority</span>
          </div>
          <div className="text-2xl font-bold font-data tabular-nums text-[var(--text-primary)]">Zone 1 &amp; 2</div>
          <p className="text-xs text-[var(--text-secondary)] font-body mt-1">Full municipal optical surveillance jurisdiction</p>
        </GlassCard>
      </div>

      {/* Security Credentials & Audit Log */}
      <GlassCard padding="md" glow="cyan">
        <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Key size={14} className="text-cyan-400" /> Operational Security Matrix
        </h3>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
            <span className="text-[var(--text-secondary)]">Municipal Grid Operator ID:</span>
            <span className="font-bold text-cyan-300">OP-PRAYAGRAJ-0948</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
            <span className="text-[var(--text-secondary)]">Session Security Signature:</span>
            <span className="font-bold text-emerald-400">ED25519-AES256-GCM-ACTIVE</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
            <span className="text-[var(--text-secondary)]">Assigned Station:</span>
            <span className="font-bold text-[var(--text-primary)]">Prayagraj Central Operations Control</span>
          </div>
        </div>
      </GlassCard>
    </PageWrapper>
  );
}
