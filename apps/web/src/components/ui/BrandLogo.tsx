import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className,
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
  };

  const titleSizes = {
    sm: 'text-sm font-black',
    md: 'text-base font-black',
    lg: 'text-xl font-black',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1 py-0.2',
    md: 'text-[10px] px-1.5 py-0.5',
    lg: 'text-xs px-2 py-0.5',
  };

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {/* Icon Emblem — White, Red, Green Brand Palette */}
      <div
        className={cn(
          'relative flex items-center justify-center font-extrabold tracking-widest text-white shadow-lg shadow-brand-600/25 ring-1 ring-white/20 transition-transform duration-200 hover:scale-105',
          'bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900',
          iconSizes[size]
        )}
      >
        <span className="text-white drop-shadow-sm">CF</span>
        {/* Emerald Green Operational Beacon */}
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 animate-pulse"
          title="Fleet Operations Active"
        />
      </div>

      {/* Brand Text & Real Estate Tag */}
      <div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'tracking-tight text-slate-900 dark:text-white',
              titleSizes[size]
            )}
          >
            CAPITAL FLEET
          </span>
          <span
            className={cn(
              'font-extrabold uppercase tracking-wider rounded font-mono',
              'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/80',
              badgeSizes[size]
            )}
          >
            LOGISTICS
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Capital Real Estate Corp</span>
            <span className="text-brand-600 dark:text-brand-400">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Fleet Network</span>
          </div>
        )}
      </div>
    </div>
  );
};
