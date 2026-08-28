'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'violet' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: cn(
    'relative overflow-hidden font-display font-bold text-[#050b14]',
    'bg-gradient-to-r from-cyan-400 via-cyan-500 to-sky-500',
    'border border-cyan-200/50',
    'shadow-[0_0_22px_rgba(0,240,255,0.45)]',
    'hover:shadow-[0_0_32px_rgba(0,240,255,0.7)] hover:from-cyan-300 hover:to-cyan-400 hover:scale-[1.02]',
    'active:scale-[0.98]',
  ),
  cyan: cn(
    'font-display font-semibold text-[#050b14] font-bold',
    'bg-gradient-to-r from-cyan-400 to-sky-500',
    'border border-cyan-300/50',
    'shadow-[0_0_20px_rgba(0,240,255,0.4)]',
    'hover:shadow-[0_0_30px_rgba(0,240,255,0.65)] hover:scale-[1.02]',
    'active:scale-[0.98]',
  ),
  secondary: cn(
    'bg-[var(--glass-surface)] backdrop-blur-xl text-[var(--text-primary)] font-body font-medium',
    'border border-[var(--glass-border)] border-top-[var(--glass-highlight)]',
    'shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
    'hover:border-cyan-400/60 hover:bg-white/[0.08] hover:text-[var(--text-primary)] hover:shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:scale-[1.015]',
    'active:scale-[0.98]',
  ),
  ghost: cn(
    'text-[var(--text-secondary)] bg-transparent font-body font-medium',
    'border border-transparent',
    'hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface)] hover:border-[var(--glass-border)]',
    'active:scale-[0.98]',
  ),
  violet: cn(
    'bg-violet-500/15 backdrop-blur-xl text-violet-600 dark:text-violet-300 font-body font-medium',
    'border border-violet-500/35',
    'shadow-[0_0_16px_rgba(139,92,246,0.25)]',
    'hover:bg-violet-500/25 hover:border-violet-500/60 hover:shadow-[0_0_25px_rgba(139,92,246,0.45)] hover:scale-[1.015]',
    'active:scale-[0.98]',
  ),
  danger: cn(
    'bg-rose-500/15 backdrop-blur-xl text-rose-600 dark:text-rose-300 font-body font-medium',
    'border border-rose-500/35',
    'shadow-[0_0_16px_rgba(244,63,94,0.25)]',
    'hover:bg-rose-500/25 hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.45)] hover:scale-[1.015]',
    'active:scale-[0.98]',
  ),
  success: cn(
    'bg-emerald-500/15 backdrop-blur-xl text-emerald-600 dark:text-emerald-300 font-body font-medium',
    'border border-emerald-500/35',
    'shadow-[0_0_16px_rgba(16,185,129,0.25)]',
    'hover:bg-emerald-500/25 hover:border-emerald-500/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] hover:scale-[1.015]',
    'active:scale-[0.98]',
  ),
};

const sizeStyles = {
  sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-xl',
  md: 'text-sm px-4.5 py-2 gap-2 rounded-xl',
  lg: 'text-base px-6 py-2.5 gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center cursor-pointer',
        'transition-all duration-150 ease-out outline-none',
        'focus-visible:ring-2 focus-visible:ring-cyan-400/50',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
