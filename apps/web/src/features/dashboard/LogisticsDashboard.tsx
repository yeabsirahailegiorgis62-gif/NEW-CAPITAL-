import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { LogisticsDashboardStats, Booking, Vehicle, User } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PrintableTransportFormModal } from '@/features/bookings/PrintableTransportFormModal';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
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
  Printer,
  Users,
  UserCheck,
  FileText,
} from 'lucide-react';

interface LogisticsDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenBooking: (booking: Booking) => void;
  onAssignVehicle?: (booking: Booking) => void;
}

// ── Reusable SVG Donut Chart Component ──
interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

const SvgDonutChart: React.FC<{
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSublabel?: string;
}> = ({ data, size = 180, strokeWidth = 24, centerLabel, centerSublabel }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-slate-400">
        No data available
      </div>
    );
  }

  let cumulativeAngle = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        {data.map((seg, idx) => {
          if (seg.value === 0) return null;
          const strokeDasharray = `${(seg.value / total) * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativeAngle;
          cumulativeAngle += (seg.value / total) * circumference;

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 hover:opacity-85"
            />
          );
        })}
      </svg>

      {/* Center HUD */}
      {(centerLabel || centerSublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          {centerLabel && (
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
              {centerLabel}
            </span>
          )}
          {centerSublabel && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
              {centerSublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const LogisticsDashboard: React.FC<LogisticsDashboardProps> = ({
  onNavigateTab,
  onOpenBooking,
  onAssignVehicle,
}) => {
  const [stats, setStats] = useState<LogisticsDashboardStats | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab filter for Immediate Action Required: 'all' | 'pending' | 'approved'
  const [actionFilter, setActionFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Printable Form Modal state
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState<Booking | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsData, bookingsData, vehiclesData, usersData] = await Promise.all([
        api.getLogisticsDashboardStats(),
        api.getBookings(),
        api.getVehicles(),
        api.getUsers().catch(() => []),
      ]);
      setStats(statsData);
      setAllBookings(bookingsData);
      setVehicles(vehiclesData);
      // Filter drivers by role or job title
      const driverUsers = (usersData as User[]).filter(
        (u) => u.role === 'DRIVER' || u.jobTitle?.toLowerCase().includes('driver') || u.jobTitle?.toLowerCase().includes('chauffeur')
      );
      setDrivers(driverUsers);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Today's trips
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrips = useMemo(() => {
    return allBookings.filter((b) => {
      try {
        const depStr = new Date(b.departureAt).toISOString().split('T')[0];
        return depStr === todayStr || b.status === 'IN_PROGRESS';
      } catch {
        return false;
      }
    });
  }, [allBookings, todayStr]);

  const pendingRequests = useMemo(
    () => allBookings.filter((b) => b.status === 'PENDING_APPROVAL'),
    [allBookings]
  );

  const awaitingAssignment = useMemo(
    () => allBookings.filter((b) => b.status === 'APPROVED' && (!b.assignments || b.assignments.length === 0)),
    [allBookings]
  );

  // Immediate Action Requests (Pending review + Approved awaiting vehicle/driver)
  const actionableRequests = useMemo(() => {
    if (actionFilter === 'pending') return pendingRequests;
    if (actionFilter === 'approved') return awaitingAssignment;
    return [...pendingRequests, ...awaitingAssignment];
  }, [actionFilter, pendingRequests, awaitingAssignment]);

  // Fleet breakdown
  const inUseVehicleIds = new Set(
    allBookings
      .filter((b) => b.status === 'IN_PROGRESS')
      .flatMap((b) => b.assignments?.map((a) => a.vehicleId).filter(Boolean) || [])
  );
  const inUseVehiclesCount = vehicles.filter((v) => inUseVehicleIds.has(v.id)).length;
  const availableVehiclesCount = vehicles.filter(
    (v) => v.operationalStatus === 'ACTIVE' && !inUseVehicleIds.has(v.id)
  ).length;
  const inMaintenanceVehiclesCount = vehicles.filter((v) => v.operationalStatus === 'MAINTENANCE').length;
  const outOfServiceVehiclesCount = vehicles.filter(
    (v) => v.operationalStatus === 'OUT_OF_SERVICE' || v.operationalStatus === 'INACTIVE'
  ).length;

  const fleetDonutData: DonutSegment[] = [
    { name: 'Available', value: availableVehiclesCount, color: '#10b981' },
    { name: 'In Use', value: inUseVehiclesCount, color: '#3b82f6' },
    { name: 'Maintenance', value: inMaintenanceVehiclesCount, color: '#f59e0b' },
    { name: 'Out of Service', value: outOfServiceVehiclesCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Driver breakdown
  // Estimate driver status: drivers currently assigned to active trips
  const activeDriverIds = new Set(
    allBookings
      .filter((b) => b.status === 'IN_PROGRESS')
      .flatMap((b) => b.assignments?.map((a) => a.driverId).filter(Boolean) || [])
  );

  const driverOnTripCount = drivers.filter((d) => activeDriverIds.has(d.id)).length;
  const driverAvailableCount = Math.max(0, drivers.length - driverOnTripCount);

  const driverDonutData: DonutSegment[] = [
    { name: 'Available', value: driverAvailableCount, color: '#10b981' },
    { name: 'On Trip', value: driverOnTripCount, color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* ── Executive Header: Today's Overview & Dispatch Command Center ── */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/5 dark:bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dispatch Command Center
            </span>
            <span className="text-xs font-mono text-slate-400">
              ADDIS ABABA LOGISTICS
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Today's Overview
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            You have{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {todayTrips.length} trips
            </strong>{' '}
            scheduled today and{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-bold">
              {pendingRequests.length} requests
            </strong>{' '}
            waiting for your review.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto z-10">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateTab('availability')}
            leftIcon={<Calendar className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            View Schedule
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => onNavigateTab('requests-queue')}
            leftIcon={<FileText className="w-4 h-4" />}
            className="shadow-md shadow-brand-500/20"
          >
            Review Requests ({pendingRequests.length})
          </Button>
        </div>
      </div>

      {/* ── 4 Primary KPI Metric Cards (VisionFund Layout) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pending Approval */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-800 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Pending Approval
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {pendingRequests.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Requisitions needing action
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/80 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Awaiting Assignment */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              Awaiting Assignment
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {awaitingAssignment.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Approved, unallocated
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/80 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Available Vehicles */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Available Vehicles
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {availableVehiclesCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Ready for immediate dispatch
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80 shrink-0">
            <Car className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Available Drivers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              Available Drivers
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {driverAvailableCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Chauffeurs on standby
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/80 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Section: Immediate Action Required ── */}
      <section className="pt-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Immediate Action Required
              </h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {actionableRequests.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Requisitions requiring prompt approval or fleet resource allocation
            </p>
          </div>

          {/* Filter Pills & View All Link */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActionFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  actionFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All ({pendingRequests.length + awaitingAssignment.length})
              </button>
              <button
                type="button"
                onClick={() => setActionFilter('pending')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  actionFilter === 'pending'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Pending ({pendingRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setActionFilter('approved')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  actionFilter === 'approved'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Awaiting Allocation ({awaitingAssignment.length})
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('requests-queue')}
              className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              View all requests
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading action queue...
            </div>
          ) : actionableRequests.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white text-base">All clear!</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                There are no pending requests or unassigned approvals requiring your attention.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">Request #</th>
                    <th className="py-3.5 px-4">Department & Requester</th>
                    <th className="py-3.5 px-4">Destination & Purpose</th>
                    <th className="py-3.5 px-4">Departure & Timing</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Dispatch Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {actionableRequests.slice(0, 10).map((b) => {
                    const isPending = b.status === 'PENDING_APPROVAL';
                    const isApproved = b.status === 'APPROVED';

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                            {b.bookingReference}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            {formatEthiopianDateOnly(b.createdAt)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {b.requester?.name || 'Staff Member'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {b.requester?.department?.name || 'Corporate'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{b.destination}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] block mt-0.5">
                            {b.purpose}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          <div>{formatEthiopianDateTime(b.departureAt)}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3" />
                            {b.passengerCount} {b.passengerCount === 1 ? 'passenger' : 'passengers'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge status={b.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVoucherBooking(b)}
                              title="Print A4 Transport Voucher"
                              leftIcon={<Printer className="w-3.5 h-3.5 text-slate-500" />}
                              className="h-[38px] px-2.5 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                            >
                              <span className="hidden md:inline text-xs">Print</span>
                            </Button>

                            {isPending && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onOpenBooking(b)}
                                className="h-[38px] px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                              >
                                Review Request
                              </Button>
                            )}

                            {isApproved && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => (onAssignVehicle ? onAssignVehicle(b) : onOpenBooking(b))}
                                className="h-[38px] px-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs"
                              >
                                Assign Vehicle
                              </Button>
                            )}

                            {!isPending && !isApproved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenBooking(b)}
                                className="h-[38px] px-3 text-xs font-semibold border-slate-300 dark:border-slate-700"
                              >
                                Details
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Section: Fleet Utilization & Driver Status Donut Charts (2-Column Grid) ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Fleet Utilization */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <CardTitle className="text-base text-slate-900 dark:text-white">
                Fleet Utilization
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <SvgDonutChart
                data={fleetDonutData}
                centerLabel={String(vehicles.length)}
                centerSublabel="Vehicles"
              />

              {/* Legend with Metrics */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Available</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {availableVehiclesCount} ({vehicles.length > 0 ? Math.round((availableVehiclesCount / vehicles.length) * 100) : 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">In Use / On Road</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {inUseVehiclesCount} ({vehicles.length > 0 ? Math.round((inUseVehiclesCount / vehicles.length) * 100) : 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Maintenance</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {inMaintenanceVehiclesCount} ({vehicles.length > 0 ? Math.round((inMaintenanceVehiclesCount / vehicles.length) * 100) : 0}%)
                  </span>
                </div>

                {outOfServiceVehiclesCount > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Out of Service</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {outOfServiceVehiclesCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CHART 2: Driver Status */}
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-base text-slate-900 dark:text-white">
                Driver Status
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <SvgDonutChart
                data={driverDonutData}
                centerLabel={String(drivers.length)}
                centerSublabel="Drivers"
              />

              {/* Legend with Metrics */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Available</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {driverAvailableCount} ({drivers.length > 0 ? Math.round((driverAvailableCount / drivers.length) * 100) : 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">On Active Trip</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {driverOnTripCount} ({drivers.length > 0 ? Math.round((driverOnTripCount / drivers.length) * 100) : 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Total Chauffeurs</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {drivers.length} Registered
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Printable Transport Form Modal ── */}
      <PrintableTransportFormModal
        isOpen={!!selectedVoucherBooking}
        onClose={() => setSelectedVoucherBooking(null)}
        booking={selectedVoucherBooking}
      />
    </div>
  );
};
