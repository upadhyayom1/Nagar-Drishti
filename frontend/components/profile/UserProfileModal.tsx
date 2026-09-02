'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, User, Clock, MapPin, Radio, Key, LogOut, Sun, Moon, CheckCircle2, Zap, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useUIStore();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.logout);
  const [copiedToken, setCopiedToken] = useState(false);

  const displayName = user?.name || user?.username || 'Operator';
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!isOpen) return null;

  const handleLogout = async () => {
    await authService.logout().catch(() => undefined);
    clearUser();
    onClose();
    router.push('/login');
  };

  const copyToken = () => {
    navigator.clipboard?.writeText('ED25519-AUTH-SEC-4');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none font-body">
        {/* Optical Blur Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Liquid Glass Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md z-10 rounded-3xl overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-elevated)] backdrop-blur-2xl shadow-[var(--glass-shadow),0_28px_80px_rgba(0,0,0,0.7)]"
        >
          {/* Specular Rim Light */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--glass-highlight)] to-transparent pointer-events-none opacity-80" />

          {/* Header Profile Area */}
          <div className="relative p-6 pb-5 border-b border-[var(--glass-border)] bg-[var(--bg-surface)]/40">
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close Profile"
              className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.05] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-4">
              {/* Avatar with Prismatic Halo Ring */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl p-[1.5px] bg-gradient-to-br from-[var(--brand-teal)] via-cyan-400 to-indigo-500 shadow-[0_0_24px_rgba(0,245,155,0.25)]">
                  <div className="w-full h-full rounded-[14px] bg-[var(--bg-void)] flex items-center justify-center text-xl font-bold font-display text-[var(--brand-teal)] tracking-wider">
                    {initials}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00f59b] border-2 border-[var(--bg-void)] shadow-[0_0_10px_#00f59b]" />
              </div>

              {/* Identity & Privileges */}
              <div className="min-w-0 pr-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold font-display text-[var(--text-primary)] truncate">
                    {displayName}
                  </h2>
                  <Badge variant="ok" size="sm" dot pulse>
                    {user?.role === 'ADMIN' ? 'ADMIN ACCESS' : 'OPERATOR'}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-teal)]" />
                  {user?.role === 'ADMIN' ? 'Municipal Command Center' : 'Citizen Reporting Unit'}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            {/* Bento-style Telemetry Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
              <div className="p-3 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--glass-border)] shadow-sm hover:border-[var(--glass-highlight)] transition-all">
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase tracking-wider font-semibold mb-1">
                  Shift Active
                </span>
                <span className="text-sm font-bold text-cyan-400 font-display">4h 32m</span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--glass-border)] shadow-sm hover:border-[var(--glass-highlight)] transition-all">
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase tracking-wider font-semibold mb-1">
                  Reliability
                </span>
                <span className="text-sm font-bold text-[#00f59b] font-display">99.8%</span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-surface)]/60 border border-[var(--glass-border)] shadow-sm hover:border-[var(--glass-highlight)] transition-all">
                <span className="text-[10px] text-[var(--text-tertiary)] block uppercase tracking-wider font-semibold mb-1">
                  Grid Nodes
                </span>
                <span className="text-sm font-bold text-violet-400 font-display">10 Sync</span>
              </div>
            </div>

            {/* Operational Specs Rows */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface)]/40 border border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)] flex items-center gap-2 font-body">
                  <MapPin size={14} className="text-cyan-400 shrink-0" />
                  Operational Sector:
                </span>
                <span className="font-bold text-[var(--text-primary)] truncate max-w-[190px]">
                  Prayagraj Municipal Grid
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface)]/40 border border-[var(--glass-border)]">
                <span className="text-[var(--text-secondary)] flex items-center gap-2 font-body">
                  <Key size={14} className="text-violet-400 shrink-0" />
                  Encryption Token:
                </span>
                <button
                  onClick={copyToken}
                  title="Click to copy token"
                  className="flex items-center gap-1.5 font-bold text-[var(--brand-teal)] hover:underline cursor-pointer"
                >
                  <span>ED25519-AUTH-SEC-4</span>
                  {copiedToken ? (
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} className="text-[var(--text-tertiary)]" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-between gap-3">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--glass-border)] hover:border-[var(--brand-teal)]/40 text-xs font-display font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated-2)] transition-all cursor-pointer shadow-sm"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={14} className="text-amber-400" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-violet-400" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all font-semibold text-xs cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.12)]"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
