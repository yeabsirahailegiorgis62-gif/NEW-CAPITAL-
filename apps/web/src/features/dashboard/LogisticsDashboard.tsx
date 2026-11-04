// COMPONENT: Logistics home. Uses GET /api/bookings/stats plus the shared bookings list.
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { LogisticsDashboardStats, Booking, Vehicle, User } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
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
  XCircle,
  QrCode,
  Eye,
  Search,
} from 'lucide-react';

interface LogisticsDashboardProps {
  currentUser?: User;
  onNavigateTab: (tab: string) => void;
  onOpenBooking: (booking: Booking) => void;
  onAssignVehicle?: (booking: Booking) => void;
  onCancelBooking?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onApproveBooking?: (bookingId: string) => Promise<void> | void;
  onRejectBooking?: (bookingId: string, reason: string) => Promise<void> | void;
  onRefresh?: () => void;
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
  currentUser,
  onNavigateTab,
  onOpenBooking,
  onAssignVehicle,
  onCancelBooking,
  onOpenReceipt,
  onApproveBooking,
  onRejectBooking,
  onRefresh,
}) => {
  const toast = useToast();
  const [stats, setStats] = useState<LogisticsDashboardStats | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab filter: 'all' | 'pending' | 'approved' | 'assigned' | 'in_transit' | 'completed' | 'cancelled'
  const [actionFilter, setActionFilter] = useState<
    'all' | 'pending' | 'approved' | 'assigned' | 'in_transit' | 'completed' | 'cancelled'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');

  // Operational Action states
  const [operatingId, setOperatingId] = useState<string | null>(null);
  const [autoAssigningId, setAutoAssigningId] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

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

  const handleApprove = async (id: string) => {
    try {
      setOperatingId(id);
      if (onApproveBooking) {
        await onApproveBooking(id);
      } else {
        await api.approveBooking(id);
        toast.success('Booking Approved', 'Request approved and ready for vehicle allocation.');
      }
      await fetchDashboardData();
      onRefresh?.();
    } catch (err: any) {
      toast.error('Approval Failed', err?.message || 'Could not approve request.');
    } finally {
      setOperatingId(null);
    }
  };

  const handleConfirmDecline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!declineTarget) return;
    if (!declineReason.trim()) {
      toast.warning('Reason Required', 'Please provide a justification for declining this request.');
      return;
    }
    try {
      setIsSubmittingDecline(true);
      if (onRejectBooking) {
        await onRejectBooking(declineTarget.id, declineReason.trim());
      } else {
        await api.rejectBooking(declineTarget.id, declineReason.trim());
        toast.info('Request Declined', 'The employee has been notified of the decline.');
      }
      setDeclineTarget(null);
      setDeclineReason('');
      await fetchDashboardData();
      onRefresh?.();
    } catch (err: any) {
      toast.error('Decline Failed', err?.message || 'Could not decline request.');
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const handleAutoAssign = async (b: Booking) => {
    try {
      setAutoAssigningId(b.id);
      await api.autoAssignBooking(b.id);
      toast.success(
        '⚡ Vehicle Auto-Assigned!',
        `Successfully matched and allocated optimal fleet resources for trip #${b.bookingReference}.`
      );
      await fetchDashboardData();
      onRefresh?.();
    } catch (err: any) {
      console.warn('Auto-assign endpoint returned:', err);
      toast.info('Manual Selection Prompt', err?.message || 'Auto-assign requires manual review. Opening assignment console.');
      if (onAssignVehicle) {
        onAssignVehicle(b);
      }
    } finally {
      setAutoAssigningId(null);
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

  const approvedRequests = useMemo(
    () => allBookings.filter((b) => b.status === 'APPROVED'),
    [allBookings]
  );

  const assignedRequests = useMemo(
    () => allBookings.filter((b) => b.status === 'ASSIGNED'),
    [allBookings]
  );

  const inTransitRequests = useMemo(
    () => allBookings.filter((b) => b.status === 'IN_PROGRESS'),
    [allBookings]
  );

  const completedRequests = useMemo(
    () => allBookings.filter((b) => b.status === 'COMPLETED'),
    [allBookings]
  );

  const cancelledRequests = useMemo(
    () => allBookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REJECTED'),
    [allBookings]
  );

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    allBookings.forEach((b) => {
      if (b.requester?.department?.name) set.add(b.requester.department.name);
    });
    return Array.from(set).sort();
  }, [allBookings]);

  // Filtered requests according to tab, department & search
  const displayedRequests = useMemo(() => {
    let list = allBookings;
    if (actionFilter === 'pending') list = pendingRequests;
    else if (actionFilter === 'approved') list = approvedRequests;
    else if (actionFilter === 'assigned') list = assignedRequests;
    else if (actionFilter === 'in_transit') list = inTransitRequests;
    else if (actionFilter === 'completed') list = completedRequests;
    else if (actionFilter === 'cancelled') list = cancelledRequests;

    if (selectedDepartment !== 'ALL') {
      list = list.filter((b) => b.requester?.department?.name === selectedDepartment);
    }

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    return list.filter((b) => {
      const asg = b.assignments?.[0];
      return (
        b.bookingReference.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q) ||
        b.purpose.toLowerCase().includes(q) ||
        b.requester?.name?.toLowerCase().includes(q) ||
        (b.requester?.employeeId && b.requester.employeeId.toLowerCase().includes(q)) ||
        b.requester?.department?.name?.toLowerCase().includes(q) ||
        (asg?.vehicle?.registrationNumber && asg.vehicle.registrationNumber.toLowerCase().includes(q)) ||
        (asg?.vehicle?.name && asg.vehicle.name.toLowerCase().includes(q)) ||
        (asg?.driverName && asg.driverName.toLowerCase().includes(q)) ||
        (asg?.assignedBy?.name && asg.assignedBy.name.toLowerCase().includes(q))
      );
    });
  }, [allBookings, actionFilter, pendingRequests, approvedRequests, assignedRequests, inTransitRequests, completedRequests, cancelledRequests, selectedDepartment, searchTerm]);

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

        {/* 2. Approved Requests */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              Approved Requests
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {approvedRequests.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Approved, pending dispatch
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

      {/* ── Section: Logistics Transport Allocation & Dispatch Command ── */}
      <section className="pt-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Logistics Transport Requisitions & Operations
              </h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                {displayedRequests.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Operational control for review, approvals, digital QR receipts, and trip cancellations
            </p>
          </div>

          {/* Quick Tab Links */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('requests-queue')}
              className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-semibold"
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Full Review Queue
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('availability')}
              className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-semibold"
              rightIcon={<Calendar className="w-4 h-4 ml-1" />}
            >
              Fleet Schedule
            </Button>
          </div>
        </div>

        {/* Filter Bar: Status Tabs + Search */}
        <div className="mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => setActionFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                actionFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({allBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              className={`px-3 py-1.5 rounded-lg transition-all ${
                actionFilter === 'approved'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Awaiting Allocation ({approvedRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('assigned')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                actionFilter === 'assigned'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Assigned ({assignedRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('in_transit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                actionFilter === 'in_transit'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              In Transit ({inTransitRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                actionFilter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Completed ({completedRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                actionFilter === 'cancelled'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Cancelled ({cancelledRequests.length})
            </button>
          </div>

          {/* Department Filter & Search Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {departmentsList.length > 0 && (
              <select
                aria-label="Filter by department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}

            {/* Instant Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ref, staff, vehicle, driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading logistics transport requests...
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white text-base">No Requests Found</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                There are no transport requests matching the selected filters and search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Request Reference</th>
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3">Requested Date</th>
                    <th className="py-3 px-3">Approval Status</th>
                    <th className="py-3 px-3">Assigned Vehicle</th>
                    <th className="py-3 px-3">Driver</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {displayedRequests.slice(0, 30).map((b) => {
                    const isPending = b.status === 'PENDING_APPROVAL';
                    const isApproved = b.status === 'APPROVED';
                    const isAssigned = b.status === 'ASSIGNED';
                    const isCancellable =
                      b.status !== 'COMPLETED' &&
                      b.status !== 'CANCELLED' &&
                      b.status !== 'REJECTED' &&
                      b.status !== 'IN_PROGRESS';
                    const asg = b.assignments?.[0];

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* 1. Request Reference */}
                        <td className="py-3 px-3 align-middle">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">
                              {b.bookingReference}
                            </span>
                            {(b.priority === 'HIGH' || b.priority === 'VIP') && (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                b.priority === 'VIP'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}>
                                {b.priority}
                              </span>
                            )}
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {b.requestType || 'DAILY'}
                          </span>
                        </td>

                        {/* 2. Employee */}
                        <td className="py-3 px-3 align-middle">
                          <span className="font-bold text-slate-900 dark:text-white block text-xs">
                            {b.requester?.name || 'Staff Member'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {b.requester?.employeeId ? `ID: ${b.requester.employeeId}` : (b.requesterId ? `EMP-${b.requesterId.slice(0, 5).toUpperCase()}` : '')}
                          </span>
                        </td>

                        {/* 3. Department */}
                        <td className="py-3 px-3 align-middle text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {b.requester?.department?.name || 'Capital Real Estate'}
                        </td>

                        {/* 4. Destination */}
                        <td className="py-3 px-3 align-middle">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{b.destination}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] block mt-0.5">
                            {b.purpose}
                          </span>
                        </td>

                        {/* 5. Requested Date */}
                        <td className="py-3 px-3 align-middle font-mono text-xs text-slate-700 dark:text-slate-300">
                          <div>{formatEthiopianDateOnly(b.departureAt)}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-sans">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(b.departureAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                            <span>•</span>
                            <span>{b.passengerCount} pax</span>
                          </div>
                        </td>

                        {/* 6. Approval Status */}
                        <td className="py-3 px-3 align-middle">
                          <Badge status={b.status} size="sm" />
                        </td>

                        {/* 7. Assigned Vehicle */}
                        <td className="py-3 px-3 align-middle">
                          {asg?.vehicle ? (
                            <div>
                              <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {asg.vehicle.registrationNumber}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[120px] mt-0.5">
                                {asg.vehicle.name}
                              </span>
                            </div>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                              Ready for allocation
                            </span>
                          ) : isPending ? (
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded font-medium">
                              Pending review
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        {/* 8. Driver */}
                        <td className="py-3 px-3 align-middle">
                          {asg?.driverName || asg?.driver?.name ? (
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block text-xs truncate max-w-[120px]">
                                {asg.driverName || asg.driver?.name}
                              </span>
                              {asg.driverPhone && (
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {asg.driverPhone}
                                </span>
                              )}
                            </div>
                          ) : isApproved ? (
                            <span className="text-slate-400 italic text-[11px]">Awaiting driver</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              {b.requiresDriver ? 'Chauffeur needed' : 'Self-Driven'}
                            </span>
                          )}
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3 px-3 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* 1. Pending: Quick Approve, Decline, Details & Cancel */}
                            {isPending && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApprove(b.id)}
                                  disabled={operatingId === b.id}
                                  title="Approve request for vehicle allocation"
                                  leftIcon={operatingId === b.id ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                  className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs rounded-xl"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setDeclineTarget(b);
                                    setDeclineReason('');
                                  }}
                                  title="Decline / Reject this transport request"
                                  leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                                  className="h-8 px-2 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100 font-semibold text-xs shadow-2xs rounded-xl"
                                >
                                  Decline
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onOpenBooking(b)}
                                  title="Review request details"
                                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                                  className="h-8 px-2 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                                >
                                  Details
                                </Button>
                                {isCancellable && onCancelBooking && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onCancelBooking(b)}
                                    title="Cancel this transport request"
                                    leftIcon={<XCircle className="w-3.5 h-3.5 text-slate-400" />}
                                    className="h-8 px-2 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 font-medium text-xs rounded-xl"
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </>
                            )}

                            {/* 2. Approved: Professional Assign Vehicle, Auto-Assign, View Details & Cancel */}
                            {isApproved && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => onAssignVehicle ? onAssignVehicle(b) : onOpenBooking(b)}
                                  title="Assign available company vehicle and driver"
                                  leftIcon={<Car className="w-3.5 h-3.5" />}
                                  className="h-8 px-3 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  Assign Vehicle
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAutoAssign(b)}
                                  disabled={autoAssigningId === b.id}
                                  title="Automatically allocate the best matching vehicle and chauffeur"
                                  leftIcon={autoAssigningId === b.id ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                  className="h-8 px-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs rounded-xl transition-all"
                                >
                                  {autoAssigningId === b.id ? 'Auto...' : '⚡ Auto'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onOpenBooking(b)}
                                  title="Inspect booking details"
                                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                                  className="h-8 px-2.5 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                                >
                                  Details
                                </Button>
                                {isCancellable && onCancelBooking && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onCancelBooking(b)}
                                    title="Cancel this transport request"
                                    leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                                    className="h-8 px-2 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 font-semibold text-xs shadow-2xs rounded-xl"
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </>
                            )}

                            {/* 3. Assigned: View Details & Reassign & Cancel */}
                            {isAssigned && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onOpenBooking(b)}
                                  title="Inspect active fleet allocation and trip details"
                                  leftIcon={<Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                                  className="h-8 px-2.5 text-xs font-bold border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/30 shadow-2xs rounded-xl"
                                >
                                  Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onAssignVehicle ? onAssignVehicle(b) : onOpenBooking(b)}
                                  title="Reassign to another vehicle or driver"
                                  leftIcon={<RotateCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
                                  className="h-8 px-2.5 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                  Reassign
                                </Button>
                                {isCancellable && onCancelBooking && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onCancelBooking(b)}
                                    title="Cancel this transport request"
                                    leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                                    className="h-8 px-2 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 font-semibold text-xs shadow-2xs rounded-xl"
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </>
                            )}

                            {/* 4. Other states (In progress, Completed, Cancelled, Rejected): View Details */}
                            {!isPending && !isApproved && !isAssigned && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenBooking(b)}
                                title="View request archive and history"
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                                className="h-8 px-3 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                              >
                                View Details
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

      {/* ── Quick Decline Request Modal ── */}
      <Modal
        isOpen={!!declineTarget}
        onClose={() => {
          setDeclineTarget(null);
          setDeclineReason('');
        }}
        title="Decline Transport Request"
      >
        <form onSubmit={handleConfirmDecline} className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
            Declining transport request <strong className="font-mono">#{declineTarget?.bookingReference}</strong> for destination <strong>"{declineTarget?.destination}"</strong>. Please provide a clear explanation for the employee.
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Declining *
            </label>
            <textarea
              required
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Fleet fully booked for this time window; or route requires 4x4 pickup which is scheduled for maintenance."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDeclineTarget(null);
                setDeclineReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isSubmittingDecline || !declineReason.trim()}
              leftIcon={isSubmittingDecline ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Decline
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
