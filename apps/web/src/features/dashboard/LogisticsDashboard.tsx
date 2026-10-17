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
  Radio,
  ShieldCheck,
  Zap,
  Activity,
  Fuel,
  Wrench,
  RotateCw,
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

  const totalVehicles = (stats?.availableVehicles ?? 0) + (stats?.tripsInProgress ?? 0) + (stats?.vehiclesInMaintenance ?? 0);
  const fleetReadiness = totalVehicles > 0 ? Math.round(((stats?.availableVehicles ?? 0) / totalVehicles) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Executive Fleet Command Center Hero HUD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 md:p-8 text-white shadow-2xl border border-slate-700/60 dark:border-brand-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM ONLINE · ADDIS ABABA (UTC+3)
              </span>
              <span className="text-xs text-slate-400 font-mono tracking-widest hidden sm:inline">
                CAPITAL FLEET ENTERPRISE NETWORK
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
              Fleet Command & Logistics Operations
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time vehicle allocation, mission approvals, telematics synchronization, and preventive maintenance for Capital Real Estate.
            </p>
          </div>

          {/* Fleet Readiness Gauge HUD */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 shadow-inner">
            <div className="text-center px-3 border-r border-slate-700">
              <div className="text-3xl font-black text-brand-400 font-mono">
                {fleetReadiness}%
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Fleet Readiness
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 min-w-[140px]">
              <div className="flex justify-between">
                <span>Active Missions:</span>
                <span className="font-bold text-white">{stats?.tripsInProgress ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Review:</span>
                <span className="font-bold text-amber-400">{stats?.pendingRequests ?? 0}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateTab('requests-queue')}
                className="text-xs whitespace-nowrap shadow-md shadow-brand-500/20"
                leftIcon={<Zap className="w-3.5 h-3.5" />}
              >
                Review Queue ({stats?.pendingRequests ?? 0})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Top operational summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Pending Review */}
        <Card className="border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/60 dark:from-amber-950/30 to-white dark:to-slate-900 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats?.pendingRequests ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Requests needing action</p>
          </CardContent>
        </Card>

        {/* Awaiting Vehicle */}
        <Card className="border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/60 dark:from-blue-950/30 to-white dark:to-slate-900 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              <span>Approved</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats?.approvedAwaitingAssignment ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting allocation</p>
          </CardContent>
        </Card>

        {/* Assigned Today */}
        <Card className="border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/60 dark:from-emerald-950/30 to-white dark:to-slate-900 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <span>Assigned Today</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats?.vehiclesAssignedToday ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dispatched schedules</p>
          </CardContent>
        </Card>

        {/* Available Fleet */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <span>Available Fleet</span>
              <Car className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-2">
              {stats?.availableVehicles ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ready for booking</p>
          </CardContent>
        </Card>

        {/* Trips In Progress */}
        <Card className="border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/60 dark:from-indigo-950/30 to-white dark:to-slate-900 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              <span>On The Road</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats?.tripsInProgress ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Currently dispatched</p>
          </CardContent>
        </Card>

        {/* Under Service */}
        <Card className="border-red-200/80 dark:border-red-900/60 bg-gradient-to-b from-red-50/60 dark:from-red-950/30 to-white dark:to-slate-900 hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
              <span>Under Service</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats?.vehiclesInMaintenance ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">In repair workshop</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Requests Review Queue */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <CardHeader className="dark:border-slate-800">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-slate-900 dark:text-white text-base">
                  Requests Awaiting Review ({pendingBookings.length})
                </CardTitle>
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
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                All booking requests have been reviewed!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingBookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onOpenBooking(b)}
                    className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                          {b.bookingReference}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {b.requester?.name} ({b.requester?.department?.name || 'Staff'})
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {b.destination}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
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
        <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <CardHeader className="dark:border-slate-800">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-slate-900 dark:text-white text-base">
                  Active Trips in Progress ({inProgressBookings.length})
                </CardTitle>
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
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                <Car className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                No vehicles are currently dispatched on active trips.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {inProgressBookings.map((b) => {
                  const assigned = b.assignments?.[0];
                  return (
                    <div
                      key={b.id}
                      onClick={() => onOpenBooking(b)}
                      className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                            {b.bookingReference}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">·</span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {assigned?.vehicle?.name} ({assigned?.vehicle?.registrationNumber})
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {b.destination}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
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
