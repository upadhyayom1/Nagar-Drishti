'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'violet' | 'cyan' | 'brand';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  /* Luminous Emerald Primary with liquid glass highlight */
  brand: cn(
    'font-display font-bold text-[var(--btn-primary-text)]',
    'bg-[var(--brand-teal)] hover:opacity-90',
    'border border-[var(--brand-teal)]/40',
    'shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_18px_rgba(0,0,0,0.2)]',
    'transition-all duration-200',
    'active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2',
  ),
  /* Primary = brand */
  primary: cn(
    'font-display font-bold text-[var(--btn-primary-text)]',
    'bg-[var(--brand-teal)] hover:opacity-90',
    'border border-[var(--brand-teal)]/40',
    'shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_18px_rgba(0,0,0,0.2)]',
    'transition-all duration-200',
    'active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2',
  ),
  /* Cyan alias */
  cyan: cn(
    'font-display font-bold text-[var(--btn-primary-text)]',
    'bg-[var(--brand-teal)] hover:opacity-90',
    'border border-[var(--brand-teal)]/40',
    'shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_18px_rgba(0,0,0,0.2)]',
    'transition-all duration-200',
    'active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2',
  ),
  secondary: cn(
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-body font-semibold backdrop-blur-xl',
    'border border-[var(--glass-border)] hover:border-[var(--text-secondary)]/30',
    'shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_14px_rgba(0,0,0,0.15)]',
    'hover:bg-[var(--bg-elevated-2)] hover:text-[var(--text-primary)]',
    'transition-all duration-200',
    'active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2',
  ),
  ghost: cn(
    'text-[var(--text-secondary)] bg-transparent font-body font-semibold',
    'border border-transparent',
    'hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    'transition-all duration-200',
    'active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2',
  ),
  violet: cn(
    'bg-white/[0.04] text-white border border-white/15 font-body font-medium backdrop-blur-xl',
    'hover:bg-white/[0.08] hover:border-white/25',
    'transition-all duration-200',
    'active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
  ),
  danger: cn(
    'bg-red-500/15 text-red-400 border border-red-500/30 font-body font-medium backdrop-blur-xl',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_14px_rgba(239,68,68,0.2)]',
    'hover:bg-red-500/25 hover:border-red-500/40',
    'transition-all duration-200',
    'active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
  ),
  success: cn(
    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-body font-medium backdrop-blur-xl',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_14px_rgba(16,185,129,0.2)]',
    'hover:bg-emerald-500/25 hover:border-emerald-500/40',
    'transition-all duration-200',
    'active:scale-[0.97]',
    'focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
  ),
};

const sizeStyles = {
  sm: 'text-xs px-4 py-1.5 gap-1.5 rounded-full',
  md: 'text-xs px-5 py-2.5 gap-2 rounded-full font-medium tracking-wide',
  lg: 'text-sm px-6 py-3 gap-2.5 rounded-full font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center cursor-pointer',
        'transition-all duration-150 ease-out outline-none',
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
