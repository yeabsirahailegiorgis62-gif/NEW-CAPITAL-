import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LogisticsDashboardStats, Booking } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime } from '@/lib/utils';
import {
  Clock,
  Car,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';

interface LogisticsDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenBooking: (booking: Booking) => void;
}

export const LogisticsDashboard: React.FC<LogisticsDashboardProps> = ({
  onNavigateTab,
  onOpenBooking,
}) => {
  const [stats, setStats] = useState<LogisticsDashboardStats | null>(null);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [inProgressBookings, setInProgressBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, allBookings] = await Promise.all([
        api.getLogisticsDashboardStats(),
        api.getBookings(),
      ]);
      setStats(statsData);
      setPendingBookings(allBookings.filter((b) => b.status === 'PENDING_APPROVAL'));
      setInProgressBookings(allBookings.filter((b) => b.status === 'IN_PROGRESS'));
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top operational summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.pendingRequests ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Requests needing action</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200/80 bg-gradient-to-b from-blue-50/40 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>Awaiting Vehicle</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.approvedAwaitingAssignment ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Approved, unassigned</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Assigned Today</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.vehiclesAssignedToday ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Dispatched schedules</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Available Fleet</span>
              <Car className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-bold text-brand-700 mt-2">
              {stats?.availableVehicles ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready for booking</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>Trips In Progress</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.tripsInProgress ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Currently on the road</p>
          </CardContent>
        </Card>

        <Card className="border-red-200/80 bg-gradient-to-b from-red-50/40 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-red-700">
              <span>Under Service</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats?.vehiclesInMaintenance ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Blocked in workshop</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Requests Review Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <CardTitle>Requests Awaiting Review ({pendingBookings.length})</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('requests-queue')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Full Queue
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                All booking requests have been reviewed!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingBookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onOpenBooking(b)}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-brand-700">
                          {b.bookingReference}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {b.requester?.name} ({b.requester?.department?.name || 'Staff'})
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {b.destination}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span>Dep: {formatEthiopianDateTime(b.departureAt)}</span>
                        <span>Passengers: {b.passengerCount}</span>
                      </div>
                    </div>
                    <Badge status="PENDING_APPROVAL" size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trips Currently in Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <CardTitle>Active Trips in Progress ({inProgressBookings.length})</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('availability')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Fleet Calendar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {inProgressBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No vehicles are currently dispatched on active trips.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inProgressBookings.map((b) => {
                  const assigned = b.assignments?.[0];
                  return (
                    <div
                      key={b.id}
                      onClick={() => onOpenBooking(b)}
                      className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-brand-700">
                            {b.bookingReference}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-semibold text-emerald-700">
                            {assigned?.vehicle?.name} ({assigned?.vehicle?.registrationNumber})
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {b.destination}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Driver: {assigned?.driverName || 'Self-driven'}</span>
                          <span>Expected Return: {formatEthiopianDateTime(b.expectedReturnAt)}</span>
                        </div>
                      </div>
                      <Badge status="IN_PROGRESS" size="sm" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
