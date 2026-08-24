'use client';

import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingStyles = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function GlassCard({ children, className, padding = 'md', hover = false, onClick, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        // The Perfect Premium Glass:
        // 1. Semi-transparent slate base
        // 2. Heavy blur
        // 3. Ring (10% white) to replace the buggy border
        // 4. Inset top shadow (15% white) for the physical "glass lip" light reflection
        'relative overflow-hidden rounded-[1.5rem]',
        'bg-slate-900/40 backdrop-blur-2xl',
        'ring-1 ring-white/10',
        'shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_8px_32px_rgba(0,0,0,0.4)]',
        'transition-all duration-300 ease-out',
        paddingStyles[padding],
        hover && 'cursor-pointer hover:bg-slate-800/50 hover:-translate-y-1 hover:ring-white/20 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),_0_16px_48px_rgba(0,195,255,0.15)]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}