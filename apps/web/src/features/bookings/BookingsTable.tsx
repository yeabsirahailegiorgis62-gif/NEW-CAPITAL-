import React, { useState } from 'react';
import { Booking, BookingStatus, User } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime } from '@/lib/utils';
import { Search, Filter, Car, Clock, ArrowUpDown, ChevronRight, QrCode } from 'lucide-react';

interface BookingsTableProps {
  bookings: Booking[];
  currentUser: User;
  onSelectBooking: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onRefresh?: () => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  currentUser,
  onSelectBooking,
  onOpenReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const isLogisticsOrAdmin =
    currentUser.role === 'LOGISTICS_ADMIN' || currentUser.role === 'SYSTEM_ADMIN';

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.requester?.name && b.requester.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reference, destination, or staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="APPROVED">Approved (Awaiting vehicle)</option>
            <option value="ASSIGNED">Vehicle assigned</option>
            <option value="IN_PROGRESS">Trip in progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {filteredBookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <Car className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600 stroke-1" />
            <p className="text-sm">No bookings found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ref #</th>
                  {isLogisticsOrAdmin && <th className="py-3 px-4">Requester</th>}
                  <th className="py-3 px-4">Destination & Purpose</th>
                  <th className="py-3 px-4">Schedule (EAT)</th>
                  <th className="py-3 px-4">Vehicle / Driver</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.map((b) => {
                  const assigned = b.assignments?.[0];
                  return (
                    <tr
                      key={b.id}
                      onClick={() => onSelectBooking(b)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400">
                        {b.bookingReference}
                      </td>

                      {isLogisticsOrAdmin && (
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900 dark:text-slate-100 block">{b.requester?.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {b.requester?.department?.name || 'Staff'}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                          {b.destination}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">{b.purpose}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs text-slate-700 dark:text-slate-300 block">
                          Dep: {formatEthiopianDateTime(b.departureAt)}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Ret: {formatEthiopianDateTime(b.expectedReturnAt)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {assigned?.vehicle ? (
                          <div>
                            <span className="font-medium text-slate-900 dark:text-slate-100 block">
                              {assigned.vehicle.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {assigned.vehicle.registrationNumber}
                              {assigned.driverName && ` · ${assigned.driverName}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs italic">Unallocated</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge status={b.status} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {onOpenReceipt &&
                          (b.status === 'APPROVED' ||
                            b.status === 'ASSIGNED' ||
                            b.status === 'IN_PROGRESS' ||
                            b.status === 'COMPLETED') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenReceipt(b);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs mr-1.5"
                              title="View official digital receipt & QR pass"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Receipt</span>
                            </button>
                          )}
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
