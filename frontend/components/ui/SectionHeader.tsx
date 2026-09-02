'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: React.ReactNode;
  /** Decorative teal underline bar beneath title */
  accent?: boolean;
  className?: string;
}

/**
 * Consistent page/section header component.
 * Replaces the scattered `<h2 className="text-xs font-mono uppercase tracking-widest">` pattern
 * with a richer, soft-maximalist treatment.
 */
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-teal-400',
  badge,
  accent = false,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className={cn('shrink-0 mt-0.5', iconColor)}>
            <Icon size={16} />
          </span>
        )}
        <div className="min-w-0">
          <h2
            className={cn(
              'font-display font-bold text-sm text-[var(--text-primary)] leading-tight',
              accent && 'relative pb-1.5 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-8 after:rounded-full after:bg-gradient-to-r after:from-teal-400 after:to-teal-600/0',
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[var(--text-tertiary)] font-body mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}
