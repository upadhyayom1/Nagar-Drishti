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
            'w-full rounded-xl bg-[var(--surface-glass)] backdrop-blur-xl',
            'border border-[var(--border-glass)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
            'px-4 py-2 text-xs text-[var(--text-primary)] font-mono',
            'placeholder:text-[var(--text-tertiary)] placeholder:font-body placeholder:text-xs',
            'transition-all duration-150 ease-out outline-none',
            'focus:border-[var(--accent-cyan)]/70 focus:bg-white/[0.05] focus:shadow-[0_0_20px_rgba(34,211,238,0.2)]',
            hasIcon ? 'pl-9' : undefined,
            shortcutHint ? 'pr-20' : undefined,
            className,
          )}
          {...props}
        />
        {shortcutHint && (
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white/[0.04] border border-[var(--border-glass)] text-[9px] font-mono text-[var(--text-secondary)] tracking-wider uppercase">
            {shortcutHint}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
