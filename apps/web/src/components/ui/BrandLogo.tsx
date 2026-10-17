import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'emblem' | 'full' | 'icon-only';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'emblem',
  showSubtitle = true,
  className,
}) => {
  const emblemSizes = {
    sm: 'w-8 h-8 rounded-xl p-1',
    md: 'w-10 h-10 rounded-xl p-1.5',
    lg: 'w-12 h-12 rounded-2xl p-1.5',
    xl: 'w-16 h-16 rounded-3xl p-2',
  };

  const fullLogoSizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  const titleSizes = {
    sm: 'text-sm font-black',
    md: 'text-base font-black',
    lg: 'text-xl font-black',
    xl: 'text-2xl font-black',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1 py-0.2',
    md: 'text-[10px] px-1.5 py-0.5',
    lg: 'text-xs px-2 py-0.5',
    xl: 'text-xs px-2.5 py-1',
  };

  // If full logo variant is requested
  if (variant === 'full') {
    return (
      <div className={cn('flex items-center gap-3 select-none', className)}>
        <img
          src="/assets/capital-logo.png"
          alt="Capital Real Estate & Apartment"
          className={cn('object-contain max-w-full drop-shadow-sm', fullLogoSizes[size])}
        />
      </div>
    );
  }

  // If icon-only variant is requested
  if (variant === 'icon-only') {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-900/5 select-none transition-transform duration-200 hover:scale-105 shrink-0',
          emblemSizes[size],
          className
        )}
      >
        <img
          src="/assets/capital-emblem.png"
          alt="Capital Real Estate Emblem"
          className="w-full h-full object-contain"
        />
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950 animate-pulse"
          title="Fleet Operations Active"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {/* Official Capital Real Estate & Apartment Circular Emblem */}
      <div
        className={cn(
          'relative flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-900/5 select-none transition-transform duration-200 hover:scale-105 shrink-0',
          emblemSizes[size]
        )}
      >
        <img
          src="/assets/capital-emblem.png"
          alt="Capital Real Estate & Apartment Logo"
          className="w-full h-full object-contain"
        />
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
              'tracking-tight text-slate-900 dark:text-white leading-none',
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
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Capital Real Estate & Apartment
            </span>
            <span className="text-brand-600 dark:text-brand-400">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Fleet Operations</span>
          </div>
        )}
      </div>
    </div>
  );
};
