import React, { useState } from 'react';
import { Booking, BookingStatus, User } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime } from '@/lib/utils';
import { Search, Filter, Car, Clock, ArrowUpDown, ChevronRight } from 'lucide-react';

interface BookingsTableProps {
  bookings: Booking[];
  currentUser: User;
  onSelectBooking: (booking: Booking) => void;
  onRefresh?: () => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  currentUser,
  onSelectBooking,
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reference, destination, or staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
        {filteredBookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Car className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
            <p className="text-sm">No bookings found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ref #</th>
                  {isLogisticsOrAdmin && <th className="py-3 px-4">Requester</th>}
                  <th className="py-3 px-4">Destination & Purpose</th>
                  <th className="py-3 px-4">Schedule (EAT)</th>
                  <th className="py-3 px-4">Vehicle / Driver</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const assigned = b.assignments?.[0];
                  return (
                    <tr
                      key={b.id}
                      onClick={() => onSelectBooking(b)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-brand-700">
                        {b.bookingReference}
                      </td>

                      {isLogisticsOrAdmin && (
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900 block">{b.requester?.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {b.requester?.department?.name || 'Staff'}
                          </span>
                        </td>
                      )}

                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-semibold text-slate-900 block truncate">
                          {b.destination}
                        </span>
                        <span className="text-xs text-slate-500 truncate block">{b.purpose}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs text-slate-700 block">
                          Dep: {formatEthiopianDateTime(b.departureAt)}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Ret: {formatEthiopianDateTime(b.expectedReturnAt)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {assigned?.vehicle ? (
                          <div>
                            <span className="font-medium text-slate-900 block">
                              {assigned.vehicle.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {assigned.vehicle.registrationNumber}
                              {assigned.driverName && ` · ${assigned.driverName}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unallocated</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge status={b.status} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-right">
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
