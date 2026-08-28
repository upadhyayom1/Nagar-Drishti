import { cn } from '@/lib/utils';

export type BadgeVariant = 
  | 'ok' | 'warn' | 'critical' | 'info' | 'default' 
  | 'success' | 'warning' | 'danger' 
  | 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'pink' | 'spectral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  ok:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  success:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  emerald:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
  
  warn:     'bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  warning:  'bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  amber:    'bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
  
  critical: 'bg-rose-500/15 text-rose-400 border-rose-500/45 shadow-[0_0_16px_rgba(244,63,94,0.35)]',
  danger:   'bg-rose-500/15 text-rose-400 border-rose-500/45 shadow-[0_0_16px_rgba(244,63,94,0.35)]',
  rose:     'bg-rose-500/15 text-rose-400 border-rose-500/45 shadow-[0_0_16px_rgba(244,63,94,0.35)]',
  
  info:     'bg-cyan-500/15 text-cyan-400 border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
  cyan:     'bg-cyan-500/15 text-cyan-400 border-cyan-500/35 shadow-[0_0_12px_rgba(0,240,255,0.3)]',
  blue:     'bg-sky-500/15 text-sky-400 border-sky-500/35 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
  violet:   'bg-violet-500/15 text-violet-400 border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.25)]',
  pink:     'bg-pink-500/15 text-pink-400 border-pink-500/35 shadow-[0_0_12px_rgba(236,72,153,0.3)]',
  spectral: 'bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-pink-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_16px_rgba(0,240,255,0.3)]',
  
  default:  'bg-white/[0.05] text-[var(--text-secondary)] border-[var(--glass-border)]',
};

const dotColors: Record<BadgeVariant, string> = {
  ok:       'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]',
  success:  'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]',
  emerald:  'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]',
  
  warn:     'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]',
  warning:  'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]',
  amber:    'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]',
  
  critical: 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]',
  danger:   'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]',
  rose:     'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.9)]',
  
  info:     'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]',
  cyan:     'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.9)]',
  blue:     'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
  violet:   'bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.9)]',
  pink:     'bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.9)]',
  spectral: 'bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,1)]',
  
  default:  'bg-[var(--text-secondary)]',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  pulse = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider rounded-full border backdrop-blur-md transition-all',
        size === 'sm' ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant],
            pulse && 'animate-pulse duration-1000'
          )}
        />
      )}
      {children}
    </span>
  );
}
