'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: cn(
    'relative overflow-hidden font-bold text-slate-950',
    'bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400',
    'backdrop-blur-2xl border border-white/30',
    'shadow-[0_0_25px_rgba(6,182,212,0.45),_inset_0_1px_0_rgba(255,255,255,0.4),_0_8px_24px_rgba(0,0,0,0.5)]',
    'hover:shadow-[0_0_35px_rgba(6,182,212,0.7),_inset_0_1px_0_rgba(255,255,255,0.6)] hover:scale-[1.02]',
    'active:scale-[0.98]',
    'before:absolute before:inset-0 before:bg-white/20 before:opacity-0 before:hover:opacity-100 before:transition-opacity',
  ),
  secondary: cn(
    'bg-[rgba(13,20,44,0.65)] backdrop-blur-2xl text-white',
    'border border-white/15',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.18),_0_8px_24px_rgba(0,0,0,0.5)]',
    'hover:border-cyan-400/60 hover:bg-cyan-500/15 hover:text-cyan-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.3),_inset_0_1px_0_rgba(255,255,255,0.3)] hover:scale-[1.02]',
    'active:scale-[0.98]',
  ),
  ghost: cn(
    'text-slate-300 bg-white/[0.03] backdrop-blur-xl',
    'border border-white/[0.08]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    'hover:text-white hover:bg-white/[0.08] hover:border-cyan-400/40 hover:shadow-[0_0_18px_rgba(6,182,212,0.2)] hover:scale-[1.01]',
    'active:scale-[0.98]',
  ),
  danger: cn(
    'bg-rose-500/15 backdrop-blur-xl text-rose-300',
    'border border-rose-500/35',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),_0_0_20px_rgba(244,63,94,0.2)]',
    'hover:bg-rose-500/25 hover:border-rose-500/70 hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:scale-[1.02]',
    'active:scale-[0.98]',
  ),
  success: cn(
    'bg-emerald-500/15 backdrop-blur-xl text-emerald-300',
    'border border-emerald-500/35',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),_0_0_20px_rgba(16,185,129,0.2)]',
    'hover:bg-emerald-500/25 hover:border-emerald-500/70 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02]',
    'active:scale-[0.98]',
  ),
};

const sizeStyles = {
  sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-xl font-medium',
  md: 'text-sm px-4.5 py-2 gap-2 rounded-xl font-semibold',
  lg: 'text-base px-6.5 py-3 gap-2.5 rounded-2xl font-bold tracking-tight',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center',
        'transition-all duration-200 ease-out font-display',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50',
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
