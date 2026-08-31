import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, className, action }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-10 px-4 gap-3', className)}>
      {/* Breathing icon with soft pulse */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated-2)] border border-[var(--glass-border)] flex items-center justify-center animate-empty-breathe">
          <Icon size={22} className="text-[var(--text-tertiary)]" />
        </div>
        {/* Subtle halo ring */}
        <div className="absolute inset-0 rounded-2xl border border-[var(--glass-border)] opacity-0 animate-empty-ring" />
      </div>

      <div className="space-y-1 max-w-[240px]">
        <p className="text-sm font-display font-semibold text-[var(--text-secondary)]">{title}</p>
        {subtitle && (
          <p className="text-[11px] font-mono text-[var(--text-tertiary)] leading-relaxed">{subtitle}</p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
