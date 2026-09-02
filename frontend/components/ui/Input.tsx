'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  showSearchIcon?: boolean;
  shortcutHint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, showSearchIcon = false, shortcutHint, ...props }, ref) => {
    const hasIcon = Boolean(icon) || showSearchIcon;

    return (
      <div className="relative w-full group">
        {hasIcon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-cyan)] transition-colors duration-150">
            {icon ?? <Search size={15} />}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-full backdrop-blur-2xl',
            'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-mono font-medium',
            'border border-[var(--glass-border)] hover:border-[var(--brand-teal)]/40',
            'shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_2px_10px_rgba(0,0,0,0.15)]',
            'px-4 py-2 text-xs',
            'placeholder:text-[var(--text-tertiary)] placeholder:font-body placeholder:text-xs',
            'transition-all duration-200 ease-out outline-none',
            'focus:border-[var(--brand-teal)] focus:ring-1 focus:ring-[var(--brand-teal)]/30 focus:shadow-[0_0_16px_rgba(0,245,155,0.2)]',
            hasIcon ? 'pl-9' : undefined,
            shortcutHint ? 'pr-24' : undefined,
            className,
          )}
          {...props}
        />
        {shortcutHint && (
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated-2)] border border-[var(--glass-border)] text-[9px] font-mono font-bold text-[var(--text-secondary)] tracking-wider uppercase shadow-sm">
            {shortcutHint}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
