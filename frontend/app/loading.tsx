'use client';

import { Radio, Zap } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-[500px] w-full flex flex-col items-center justify-center p-8 font-body select-none">
      <div className="relative w-20 h-20 flex items-center justify-center mb-5">
        {/* Outer Rotating Cyan Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        
        {/* Middle Counter-Rotating Fuchsia Ring */}
        <div className="absolute inset-2.5 rounded-full border-2 border-fuchsia-500/20 border-b-fuchsia-500 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
        
        {/* Inner Pulsing Core */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 animate-pulse shadow-[0_0_16px_rgba(61,118,121,0.8)] flex items-center justify-center">
          <Zap size={12} className="text-white" />
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 flex items-center justify-center gap-2">
          <Radio size={13} className="animate-pulse" />
          Synchronizing Municipal Neural Stream...
        </p>
        <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
          Prayagraj Optical Sensor Matrix · Zone 1
        </p>
      </div>
    </div>
  );
}
