import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import type { LucideIcon } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, trend, subtitle, accentColor, className }: any) {
  return (
    <GlassCard className={cn('relative overflow-hidden flex flex-col', className)}>
      <div className="flex items-start justify-between flex-1">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">{label}</p>
          
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {value}
          </p>
          
          {trend && (
            <p className={cn(
              'text-[12px] font-semibold flex items-center gap-1 mt-2',
              trend.isPositive ? 'text-cyan-400' : 'text-rose-400'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-slate-500 font-medium ml-1">vs yesterday</span>
            </p>
          )}
          
          {subtitle && (
            <p className="text-[12px] text-slate-500 font-medium mt-1">{subtitle}</p>
          )}
        </div>
        
        <div
          className="p-3 rounded-[1rem] backdrop-blur-md shadow-inner"
          style={{ 
            backgroundColor: accentColor ? `${accentColor}15` : 'rgba(255, 255, 255, 0.05)',
            boxShadow: `inset 0 1px 1px ${accentColor ? `${accentColor}30` : 'rgba(255,255,255,0.1)'}`
          }}
        >
          <Icon size={22} style={{ color: accentColor || '#e2e8f0' }} />
        </div>
      </div>
    </GlassCard>
  );
}