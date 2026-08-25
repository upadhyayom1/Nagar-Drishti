'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--brand-cyan)]/70 group-focus-within:text-[var(--brand-cyan)] transition-colors">
            {icon ?? <Search size={16} />}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl bg-[rgba(11,20,42,0.7)] backdrop-blur-xl',
            'border border-[rgba(56,189,248,0.18)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
            'px-4 py-2.5 text-xs text-[var(--text-primary)]',
            'font-data placeholder:text-[var(--text-tertiary)] placeholder:font-body placeholder:text-xs placeholder:tracking-normal',
            'transition-all duration-200 ease-out outline-none',
            'focus:border-[var(--brand-cyan)] focus:bg-[rgba(16,28,58,0.9)] focus:shadow-[0_0_25px_rgba(0,229,255,0.25),_inset_0_1px_0_rgba(255,255,255,0.1)]',
            hasIcon ? 'pl-10' : undefined,
            shortcutHint ? 'pr-20' : undefined,
            className,
          )}
          {...props}
        />
        {shortcutHint && (
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-[rgba(0,229,255,0.1)] border border-[rgba(0,229,255,0.25)] text-[9px] font-mono text-[var(--brand-cyan)] font-bold tracking-wider uppercase shadow-sm">
            {shortcutHint}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
