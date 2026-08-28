'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, User, Clock, MapPin, Radio, Key, LogOut, Sun, Moon, CheckCircle2, Award, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useUIStore();

  if (!isOpen) return null;

  const handleLogout = () => {
    onClose();
    router.push('/login');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg z-10"
        >
          <GlassCard padding="none" className="overflow-hidden border border-cyan-500/30 shadow-[0_24px_70px_rgba(0,0,0,0.8),0_0_30px_rgba(0,240,255,0.2)]">
            
            {/* Header Banner */}
            <div className="relative p-6 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-pink-500/20 border-b border-[var(--glass-border)]">
              <button
                onClick={onClose}
                aria-label="Close Profile"
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/[0.06] text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4">
                {/* Avatar with Spectral Ring */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00f0ff] via-[#6366f1] to-[#ec4899] p-0.5 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                    <div className="w-full h-full rounded-2xl bg-[#0c1222] flex items-center justify-center text-xl font-bold font-display text-white">
                      RK
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0c1222] shadow-[0_0_8px_#10b981]" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">Rahul Krishnan</h2>
                    <Badge variant="cyan" size="sm">LEVEL 4 CLEARANCE</Badge>
                  </div>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                    Sector Dispatch Director · Command Zone 1
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Body Details */}
            <div className="p-6 space-y-5 font-body">
              
              {/* Telemetry Chips */}
              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--glass-border)]">
                  <span className="text-[10px] text-[var(--text-secondary)] block uppercase tracking-wider">Shift Active</span>
                  <span className="text-sm font-bold text-cyan-400">4h 32m</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--glass-border)]">
                  <span className="text-[10px] text-[var(--text-secondary)] block uppercase tracking-wider">Reliability</span>
                  <span className="text-sm font-bold text-emerald-400">99.8%</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--glass-border)]">
                  <span className="text-[10px] text-[var(--text-secondary)] block uppercase tracking-wider">Grid Nodes</span>
                  <span className="text-sm font-bold text-violet-400">10 Sync</span>
                </div>
              </div>

              {/* Station Info */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
                  <span className="text-[var(--text-secondary)] flex items-center gap-2 font-body">
                    <MapPin size={14} className="text-cyan-400" /> Operational Sector:
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">Prayagraj Municipal Grid</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-[var(--glass-border)]">
                  <span className="text-[var(--text-secondary)] flex items-center gap-2 font-body">
                    <Key size={14} className="text-violet-400" /> Encryption Token:
                  </span>
                  <span className="font-bold text-cyan-300">ED25519-AUTH-SEC-4</span>
                </div>
              </div>

              {/* Quick Settings */}
              <div className="pt-2 border-t border-[var(--glass-border)] flex items-center justify-between gap-3">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-[var(--glass-border)] hover:border-cyan-400/40 text-xs font-display font-semibold text-[var(--text-primary)] transition-all"
                >
                  {theme === 'dark' ? (
                    <><Sun size={15} className="text-amber-400" /> Switch to Light Mode</>
                  ) : (
                    <><Moon size={15} className="text-violet-400" /> Switch to Dark Mode</>
                  )}
                </button>

                <Button variant="danger" size="sm" onClick={handleLogout}>
                  <LogOut size={13} /> Sign Out
                </Button>
              </div>

            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
