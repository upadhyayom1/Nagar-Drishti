import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'cyan' | 'azure' | 'cobalt' | 'violet' | 'emerald' | 'amber' | 'rose' | 'spectral' | 'mint';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  default:  'bg-[rgba(13,19,40,0.8)] text-slate-300 border border-white/10',
  success:  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  warning:  'bg-amber-500/15 text-amber-300 border border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  danger:   'bg-rose-500/15 text-rose-300 border border-rose-500/35 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
  info:     'bg-sky-500/15 text-sky-300 border border-sky-500/35 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
  cyan:     'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
  azure:    'bg-sky-500/15 text-sky-300 border border-sky-500/35 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
  cobalt:   'bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 shadow-[0_0_12px_rgba(99,102,241,0.25)]',
  violet:   'bg-violet-500/15 text-violet-300 border border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.25)]',
  emerald:  'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  amber:    'bg-amber-500/15 text-amber-300 border border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  rose:     'bg-rose-500/15 text-rose-300 border border-rose-500/35 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
  spectral: 'bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-pink-500/20 text-cyan-200 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  mint:     'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35',
};

const dotColors: Record<string, string> = {
  default:  'bg-slate-400',
  success:  'bg-emerald-400',
  warning:  'bg-amber-400',
  danger:   'bg-rose-400',
  info:     'bg-sky-400',
  cyan:     'bg-cyan-400',
  azure:    'bg-sky-400',
  cobalt:   'bg-indigo-400',
  violet:   'bg-violet-400',
  emerald:  'bg-emerald-400',
  amber:    'bg-amber-400',
  rose:     'bg-rose-400',
  spectral: 'bg-cyan-400',
  mint:     'bg-cyan-400',
};

const sizeStyles = {
  sm: 'text-[9px] px-2.5 py-0.5 tracking-wider',
  md: 'text-[10px] px-3 py-1 tracking-wider',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  pulse = false,
  className,
}: BadgeProps) {
  const pulseClass = variant === 'danger' ? 'animate-pulse-critical' : 'animate-pulse-live';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-display font-bold uppercase rounded-full shrink-0',
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant] || dotColors.default,
            pulse && pulseClass,
          )}
        />
      )}
      {children}
    </span>
  );
}
