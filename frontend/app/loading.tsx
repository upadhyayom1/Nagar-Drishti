'use client';

import { Radio, ShieldCheck, Video, Cpu, Activity } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-[520px] w-full flex flex-col items-center justify-center p-8 font-body select-none">
      <div className="w-full max-w-sm rounded-3xl p-7 bg-[var(--bg-elevated)] border border-white/[0.08] dark:border-white/[0.08] shadow-[var(--glass-shadow)] backdrop-blur-2xl text-center space-y-5">
        
        {/* Animated Brand Ring & Telemetry Beacon */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--brand-teal)]/20 border-t-[var(--brand-teal)] animate-spin" />
          <div className="w-9 h-9 rounded-full bg-[var(--brand-teal)]/10 border border-[var(--brand-teal)]/30 flex items-center justify-center text-[var(--brand-teal)]">
            <Radio size={16} className="animate-pulse" />
          </div>
        </div>

        {/* Title and System Descriptor */}
        <div className="space-y-1">
          <h2 className="text-sm font-display font-bold text-[var(--text-primary)] tracking-wide">
            NagarDrishti Command Center
          </h2>
          <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
            Synchronizing municipal traffic intelligence...
          </p>
        </div>

        {/* Telemetry Readiness Pulse Indicators */}
        <div className="pt-2 border-t border-white/[0.06] dark:border-white/[0.06] space-y-2 text-left text-[10px] font-mono">
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Video size={11} className="text-[var(--brand-teal)]" />
              Sensor Grid
            </span>
            <span className="text-[var(--brand-teal)] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-teal)] animate-ping" />
              ONLINE
            </span>
          </div>

          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Cpu size={11} className="text-cyan-400" />
              Vision Analytics
            </span>
            <span className="text-cyan-400 font-bold">READY</span>
          </div>

          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-emerald-400" />
              Threat Sentinel
            </span>
            <span className="text-emerald-400 font-bold">MONITORING</span>
          </div>
        </div>

        {/* Smooth indeterminate progress line */}
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-transparent via-[var(--brand-teal)] to-transparent w-1/2 animate-[shimmer_1.5s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
}
