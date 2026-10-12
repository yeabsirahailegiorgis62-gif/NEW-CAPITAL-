import React from 'react';
import { cn } from '@/lib/utils';
import { BookingStatus, VehicleOperationalStatus } from '@/types';

interface BadgeProps {
  status: BookingStatus | VehicleOperationalStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, className, size = 'md' }) => {
  let label = status;
  let colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  let dotColor = 'bg-slate-400';

  switch (status) {
    // Booking Statuses
    case 'PENDING_APPROVAL':
      label = 'Pending approval';
      colorClass = 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      dotColor = 'bg-amber-500';
      break;
    case 'APPROVED':
      label = 'Approved';
      colorClass = 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      dotColor = 'bg-blue-500';
      break;
    case 'REJECTED':
      label = 'Rejected';
      colorClass = 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60';
      dotColor = 'bg-red-500';
      break;
    case 'ASSIGNED':
      label = 'Vehicle assigned';
      colorClass = 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      dotColor = 'bg-indigo-600';
      break;
    case 'IN_PROGRESS':
      label = 'Trip in progress';
      colorClass = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      dotColor = 'bg-emerald-500 animate-pulse';
      break;
    case 'COMPLETED':
      label = 'Completed';
      colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      dotColor = 'bg-slate-500';
      break;
    case 'CANCELLED':
      label = 'Cancelled';
      colorClass = 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 line-through';
      dotColor = 'bg-slate-400';
      break;

    // Vehicle Operational Statuses
    case 'ACTIVE':
      label = 'Operational';
      colorClass = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      dotColor = 'bg-emerald-500';
      break;
    case 'MAINTENANCE':
      label = 'Under maintenance';
      colorClass = 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      dotColor = 'bg-amber-500';
      break;
    case 'OUT_OF_SERVICE':
      label = 'Out of service';
      colorClass = 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60';
      dotColor = 'bg-red-500';
      break;
    case 'INACTIVE':
      label = 'Deactivated';
      colorClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      dotColor = 'bg-slate-400';
      break;

    // Availability labels
    case 'AVAILABLE':
      label = 'Available';
      colorClass = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      dotColor = 'bg-emerald-500';
      break;
    case 'UNAVAILABLE':
      label = 'Unavailable';
      colorClass = 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60';
      dotColor = 'bg-red-500';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        colorClass,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
