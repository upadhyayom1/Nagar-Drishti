'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  showSearchIcon?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, showSearchIcon = false, ...props }, ref) => {
    return (
      <div className="relative">
        {(icon || showSearchIcon) && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {icon || <Search size={16} />}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-white/[0.04] border border-border-glass rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 font-body',
            'focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20',
            'transition-all duration-150',
            (icon || showSearchIcon) ? 'pl-10' : undefined,
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
