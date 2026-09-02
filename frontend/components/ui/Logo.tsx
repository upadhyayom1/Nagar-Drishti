'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textOnly?: boolean;
  href?: string | null;
  clickable?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const sizeMap = {
  xs: { icon: 20, container: 'w-6 h-6', text: 'text-xs' },
  sm: { icon: 26, container: 'w-8 h-8', text: 'text-sm' },
  md: { icon: 34, container: 'w-10 h-10', text: 'text-base' },
  lg: { icon: 44, container: 'w-12 h-12', text: 'text-lg' },
  xl: { icon: 56, container: 'w-16 h-16', text: 'text-2xl' },
};

export function NagarDrishtiIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 transition-transform duration-300 group-hover:scale-105', className)}
    >
      <defs>
        <linearGradient id="nd-grad-spectral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#539194" />
          <stop offset="45%" stopColor="#315f62" />
          <stop offset="85%" stopColor="#bc4323" />
        </linearGradient>
        <linearGradient id="nd-grad-cyan" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00E6B0" />
          <stop offset="100%" stopColor="#539194" />
        </linearGradient>
        <radialGradient id="nd-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#539194" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#539194" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Radial Halo */}
      <circle cx="50" cy="50" r="46" fill="url(#nd-glow)" />

      {/* Sci-Fi Hexagonal/Circular Outer Aperture Ring */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="url(#nd-grad-spectral)"
        strokeWidth="2.5"
        strokeDasharray="12 4 6 4"
        opacity="0.85"
      />

      {/* Cardinal Sensor Nodes */}
      <circle cx="50" cy="8" r="2.5" fill="#539194" />
      <circle cx="92" cy="50" r="2.5" fill="#bc4323" />
      <circle cx="50" cy="92" r="2.5" fill="#315f62" />
      <circle cx="8" cy="50" r="2.5" fill="#00E6B0" />

      {/* Optical Eye/Lens Outer Arc (Drishti Vision Symbol) */}
      <path
        d="M 16 50 C 26 24, 74 24, 84 50 C 74 76, 26 76, 16 50 Z"
        stroke="url(#nd-grad-spectral)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Secondary Dynamic Lens Arc */}
      <path
        d="M 24 50 C 32 32, 68 32, 76 50 C 68 68, 32 68, 24 50 Z"
        stroke="url(#nd-grad-cyan)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        opacity="0.75"
        fill="none"
      />

      {/* Concentric Iris Circle */}
      <circle
        cx="50"
        cy="50"
        r="17"
        stroke="url(#nd-grad-cyan)"
        strokeWidth="3"
        fill="none"
      />

      {/* Central Diamond Core Pupil */}
      <polygon points="50,37 61,50 50,63 39,50" fill="url(#nd-grad-spectral)" />

      {/* Core AI Light Dot */}
      <circle cx="50" cy="50" r="4.5" fill="#ffffff" />
    </svg>
  );
}

export function Logo({
  size = 'md',
  showText = true,
  textOnly = false,
  href = '/',
  clickable = true,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  const config = sizeMap[size];

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 group select-none', className)}>
      {!textOnly && (
        <div
          className={cn(
            'rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_18px_rgba(61,118,121,0.35)] shrink-0 transition-all duration-300 group-hover:border-cyan-400 group-hover:shadow-[0_0_24px_rgba(61,118,121,0.5)]',
            config.container,
            iconClassName
          )}
        >
          <NagarDrishtiIcon size={config.icon} />
        </div>
      )}

      {showText && (
        <div className="min-w-0">
          <span className={cn('font-display font-bold tracking-tight text-[var(--text-primary)] leading-none block', config.text, textClassName)}>
            Nagar<span className="text-gradient-spectral">Drishti</span>
          </span>
          <span className="text-[9px] font-mono text-[var(--text-secondary)] tracking-[0.16em] uppercase mt-1 block">
            AI Command OS
          </span>
        </div>
      )}
    </div>
  );

  if (clickable && href) {
    return (
      <Link
        href={href}
        title="Return to NagarDrishti Landing Page"
        className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 rounded-xl transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}
