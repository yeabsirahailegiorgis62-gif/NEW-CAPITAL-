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
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (status) {
    // Booking Statuses
    case 'PENDING_APPROVAL':
      label = 'Pending approval';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'APPROVED':
      label = 'Approved';
      colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
      dotColor = 'bg-blue-500';
      break;
    case 'REJECTED':
      label = 'Rejected';
      colorClass = 'bg-red-50 text-red-800 border-red-200';
      dotColor = 'bg-red-500';
      break;
    case 'ASSIGNED':
      label = 'Vehicle assigned';
      colorClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      dotColor = 'bg-indigo-600';
      break;
    case 'IN_PROGRESS':
      label = 'Trip in progress';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotColor = 'bg-emerald-500 animate-pulse';
      break;
    case 'COMPLETED':
      label = 'Completed';
      colorClass = 'bg-slate-100 text-slate-800 border-slate-200';
      dotColor = 'bg-slate-500';
      break;
    case 'CANCELLED':
      label = 'Cancelled';
      colorClass = 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      dotColor = 'bg-slate-400';
      break;

    // Vehicle Operational Statuses
    case 'ACTIVE':
      label = 'Operational';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case 'MAINTENANCE':
      label = 'Under maintenance';
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'OUT_OF_SERVICE':
      label = 'Out of service';
      colorClass = 'bg-red-50 text-red-800 border-red-200';
      dotColor = 'bg-red-500';
      break;
    case 'INACTIVE':
      label = 'Deactivated';
      colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      break;

    // Availability labels
    case 'AVAILABLE':
      label = 'Available';
      colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case 'UNAVAILABLE':
      label = 'Unavailable';
      colorClass = 'bg-red-50 text-red-800 border-red-200';
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
