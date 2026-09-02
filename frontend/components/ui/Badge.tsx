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
  ok:       'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  success:  'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  emerald:  'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  
  warn:     'bg-amber-500/15 text-[var(--status-warn)] border border-amber-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  warning:  'bg-amber-500/15 text-[var(--status-warn)] border border-amber-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  amber:    'bg-amber-500/15 text-[var(--status-warn)] border border-amber-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  
  critical: 'bg-red-500/15 text-[var(--status-critical)] border border-red-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  danger:   'bg-red-500/15 text-[var(--status-critical)] border border-red-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  rose:     'bg-red-500/15 text-[var(--status-critical)] border border-red-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  
  info:     'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  cyan:     'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  blue:     'bg-[var(--bg-elevated-2)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  violet:   'bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  pink:     'bg-[var(--bg-elevated-2)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  spectral: 'bg-[var(--bg-elevated-2)] text-[var(--text-primary)] border border-[var(--glass-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
  
  default:  'bg-[var(--bg-elevated-2)] text-[var(--text-secondary)] border border-[var(--glass-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
};

const dotColors: Record<BadgeVariant, string> = {
  ok:       'bg-[var(--status-ok)] shadow-[0_0_8px_var(--status-ok)]',
  success:  'bg-[var(--status-ok)] shadow-[0_0_8px_var(--status-ok)]',
  emerald:  'bg-[var(--status-ok)] shadow-[0_0_8px_var(--status-ok)]',
  
  warn:     'bg-[var(--status-warn)] shadow-[0_0_8px_var(--status-warn)]',
  warning:  'bg-[var(--status-warn)] shadow-[0_0_8px_var(--status-warn)]',
  amber:    'bg-[var(--status-warn)] shadow-[0_0_8px_var(--status-warn)]',
  
  critical: 'bg-[var(--status-critical)] shadow-[0_0_8px_var(--status-critical)]',
  danger:   'bg-[var(--status-critical)] shadow-[0_0_8px_var(--status-critical)]',
  rose:     'bg-[var(--status-critical)] shadow-[0_0_8px_var(--status-critical)]',
  
  info:     'bg-[var(--status-ok)] shadow-[0_0_8px_var(--status-ok)]',
  cyan:     'bg-[var(--status-ok)] shadow-[0_0_8px_var(--status-ok)]',
  blue:     'bg-[var(--text-primary)]',
  violet:   'bg-purple-500',
  pink:     'bg-pink-500',
  spectral: 'bg-[var(--status-ok)]',
  
  default:  'bg-[var(--text-tertiary)]',
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
