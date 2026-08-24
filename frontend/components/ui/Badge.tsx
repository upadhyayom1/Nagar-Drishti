import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', dot = false, pulse = false, className }: BadgeProps) {
  const variants = {
    default: 'bg-white/[0.06] text-text-secondary border-white/[0.08]',
    success: 'bg-status-ok/10 text-status-ok border-status-ok/20',
    warning: 'bg-status-warn/10 text-status-warn border-status-warn/20',
    danger: 'bg-status-critical/10 text-status-critical border-status-critical/20',
    info: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  };

  const dotColors = {
    default: 'bg-text-secondary',
    success: 'bg-status-ok',
    warning: 'bg-status-warn',
    danger: 'bg-status-critical',
    info: 'bg-accent-cyan',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border font-body uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotColors[variant],
            pulse && 'animate-pulse-live'
          )}
        />
      )}
      {children}
    </span>
  );
}
