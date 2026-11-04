// COMPONENT: Logistics queue for pending/approved bookings. Approve/reject/assign call App handlers → API.
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { Booking, User, Vehicle } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatEthiopianDateTime } from '@/lib/utils';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Car,
  Clock,
  ArrowRight,
  User as UserIcon,
  MapPin,
  AlertCircle,
  RotateCw,
  QrCode,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Users,
  Mail,
  KeyRound,
  ShieldCheck,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  CalendarRange,
  Phone,
  UserCheck,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';

interface ReviewRequestsQueueProps {
  currentUser: User;
  bookings?: Booking[];
  initialTab?: 'pending' | 'approved' | 'assigned' | 'all';
  onRefreshQueue?: () => Promise<void>;
  onSelectBooking: (booking: Booking) => void;
  onAssignVehicle?: (booking: Booking) => void;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string, reason: string) => Promise<void> | void;
  onCancelBooking?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onPrintForm?: (booking: Booking) => void;
}

export const ReviewRequestsQueue: React.FC<ReviewRequestsQueueProps> = ({
  currentUser,
  bookings: propBookings,
  initialTab = 'pending',
  onRefreshQueue,
  onSelectBooking,
  onAssignVehicle,
  onApprove,
  onReject,
  onCancelBooking,
  onOpenReceipt,
  onPrintForm,
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<string>(initialTab);
  const [bookings, setBookings] = useState<Booking[]>(propBookings || []);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(!propBookings);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Search and Advanced Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedRequestType, setSelectedRequestType] = useState('ALL'); // ALL, DAILY, WEEKLY
  const [selectedDriverRequirement, setSelectedDriverRequirement] = useState('ALL'); // ALL, DRIVER_REQUIRED, SELF_DRIVEN
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL'); // ALL, TODAY, THIS_WEEK, UPCOMING
  const [sortBy, setSortBy] = useState<'submitted_desc' | 'travel_asc' | 'passenger_desc'>('submitted_desc');

  // Rejection modal
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [autoAssigningId, setAutoAssigningId] = useState<string | null>(null);

  const canAssign = currentUser.role === 'LOGISTICS_ADMIN' || currentUser.role === 'SYSTEM_ADMIN';

  useEffect(() => {
    if (initialTab) {
      setActiveFilterTab(initialTab);
    }
  }, [initialTab]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchWorkspaceData = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, vehiclesData, usersData] = await Promise.all([
        api.getBookings().catch(() => [] as Booking[]),
        api.getVehicles().catch(() => [] as Vehicle[]),
        api.getUsers().catch(() => [] as User[]),
      ]);
      setBookings(bookingsData);
      setVehicles(vehiclesData);
      setDrivers(usersData.filter((u) => u.role === 'DRIVER' && u.isActive));
    } catch (err) {
      console.error('Failed to load workspace data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propBookings) {
      setBookings(propBookings);
      // Still fetch vehicles and drivers for the top overview stats
      Promise.all([
        api.getVehicles().catch(() => [] as Vehicle[]),
        api.getUsers().catch(() => [] as User[]),
      ]).then(([vehiclesData, usersData]) => {
        setVehicles(vehiclesData);
        setDrivers(usersData.filter((u) => u.role === 'DRIVER' && u.isActive));
      });
      setIsLoading(false);
    } else {
      fetchWorkspaceData();
    }
  }, [propBookings]);

  // Compute 7 real backend stats for top KPI overview
  const now = new Date();
  const pendingRequests = useMemo(() => bookings.filter((b) => b.status === 'PENDING_APPROVAL'), [bookings]);
  const approvedUnassigned = useMemo(() => bookings.filter((b) => b.status === 'APPROVED'), [bookings]);
  const assignedRequests = useMemo(() => bookings.filter((b) => b.status === 'ASSIGNED'), [bookings]);
  const activeTrips = useMemo(() => bookings.filter((b) => b.status === 'IN_PROGRESS'), [bookings]);
  const completedTrips = useMemo(() => bookings.filter((b) => b.status === 'COMPLETED'), [bookings]);

  // Available vehicles: active status, not in maintenance, no safety alert, and not currently assigned to active trip
  const activeAssignedVehicleIds = useMemo(() => {
    const ids = new Set<string>();
    bookings.forEach((b) => {
      if (b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS') {
        const vId = b.currentAssignment?.vehicleId || b.assignments?.[0]?.vehicleId;
        if (vId) ids.add(vId);
      }
    });
    return ids;
  }, [bookings]);

  const availableVehiclesCount = useMemo(() => {
    return vehicles.filter(
      (v) => v.operationalStatus === 'ACTIVE' && !(v as any).hasSafetyAlert && !activeAssignedVehicleIds.has(v.id)
    ).length;
  }, [vehicles, activeAssignedVehicleIds]);

  // Available drivers: active driver not assigned to currently active trip
  const activeAssignedDriverIds = useMemo(() => {
    const ids = new Set<string>();
    bookings.forEach((b) => {
      if (b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS') {
        const dId = b.currentAssignment?.driverId || b.assignments?.[0]?.driverId;
        if (dId) ids.add(dId);
      }
    });
    return ids;
  }, [bookings]);

  const availableDriversCount = useMemo(() => {
    return drivers.filter((d) => d.isActive && !activeAssignedDriverIds.has(d.id)).length;
  }, [drivers, activeAssignedDriverIds]);

  // Unique departments for filter dropdown
  const departmentOptions = useMemo(() => {
    const depts = new Set<string>();
    bookings.forEach((b) => {
      if (b.requester?.department?.name) {
        depts.add(b.requester.department.name);
      }
    });
    return Array.from(depts).sort();
  }, [bookings]);

  // Filtered and Sorted Request List
  const displayedRequests = useMemo(() => {
    return bookings
      .filter((b) => {
        // Tab / Category Filter
        if (activeFilterTab === 'pending' && b.status !== 'PENDING_APPROVAL') return false;
        if (activeFilterTab === 'approved' && b.status !== 'APPROVED') return false;
        if (activeFilterTab === 'assigned' && b.status !== 'ASSIGNED') return false;
        if (activeFilterTab === 'active_trips' && b.status !== 'IN_PROGRESS') return false;
        if (activeFilterTab === 'completed' && b.status !== 'COMPLETED') return false;
        if (activeFilterTab === 'avail_vehicles' && b.status !== 'APPROVED') return false;
        if (activeFilterTab === 'avail_drivers' && (!b.requiresDriver || b.status !== 'APPROVED')) return false;

        // Search Filter (ID, Requester, Employee ID, Destination, Purpose)
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matches =
            b.bookingReference?.toLowerCase().includes(q) ||
            b.destination?.toLowerCase().includes(q) ||
            b.purpose?.toLowerCase().includes(q) ||
            b.requester?.name?.toLowerCase().includes(q) ||
            b.requester?.employeeId?.toLowerCase().includes(q) ||
            b.requester?.phone?.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Department Filter
        if (selectedDepartment !== 'ALL' && b.requester?.department?.name !== selectedDepartment) {
          return false;
        }

        // Request Type Filter (DAILY vs WEEKLY)
        if (selectedRequestType !== 'ALL') {
          const isWeekly = b.requestType === 'WEEKLY' || (b.bookingDays && b.bookingDays.length > 0);
          if (selectedRequestType === 'WEEKLY' && !isWeekly) return false;
          if (selectedRequestType === 'DAILY' && isWeekly) return false;
        }

        // Driver Requirement Filter
        if (selectedDriverRequirement === 'DRIVER_REQUIRED' && !b.requiresDriver) return false;
        if (selectedDriverRequirement === 'SELF_DRIVEN' && b.requiresDriver) return false;

        // Date Filter
        if (selectedDateFilter !== 'ALL') {
          const depDate = new Date(b.departureAt);
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59);

          if (selectedDateFilter === 'TODAY') {
            if (depDate < startOfToday || depDate > endOfToday) return false;
          } else if (selectedDateFilter === 'THIS_WEEK') {
            if (depDate < startOfToday || depDate > endOfWeek) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'travel_asc') {
          return new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();
        }
        if (sortBy === 'passenger_desc') {
          return b.passengerCount - a.passengerCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    bookings,
    activeFilterTab,
    searchTerm,
    selectedDepartment,
    selectedRequestType,
    selectedDriverRequirement,
    selectedDateFilter,
    sortBy,
    now,
  ]);

  const handleApprove = async (id: string) => {
    try {
      setIsProcessingId(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'APPROVED' } : b)));
      setActiveFilterTab('approved');
      await onApprove(id);
      if (onRefreshQueue) {
        await onRefreshQueue();
      } else {
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error('Failed to approve booking', err);
      if (onRefreshQueue) await onRefreshQueue();
      else await fetchWorkspaceData();
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking || !rejectReason.trim()) return;
    const targetId = rejectingBooking.id;
    const reason = rejectReason.trim();

    try {
      setIsProcessingId(targetId);
      setBookings((prev) =>
        prev.map((b) => (b.id === targetId ? { ...b, status: 'REJECTED', rejectionReason: reason } : b))
      );
      setRejectingBooking(null);
      setRejectReason('');
      await onReject(targetId, reason);
      if (onRefreshQueue) {
        await onRefreshQueue();
      } else {
        await fetchWorkspaceData();
      }
    } catch (err) {
      console.error('Failed to reject booking', err);
      if (onRefreshQueue) await onRefreshQueue();
      else await fetchWorkspaceData();
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleAutoAssign = async (b: Booking) => {
    try {
      setAutoAssigningId(b.id);
      await api.autoAssignBooking(b.id);
      if (onRefreshQueue) {
        await onRefreshQueue();
      } else {
        await fetchWorkspaceData();
      }
    } catch (err: any) {
      console.warn('Auto-assign notice:', err);
      if (onAssignVehicle) {
        onAssignVehicle(b);
      }
    } finally {
      setAutoAssigningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Assignment Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 p-2 flex items-center justify-center border border-brand-200 dark:border-brand-800 shadow-2xs shrink-0">
            {canAssign ? (
              <KeyRound className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            ) : (
              <ClipboardList className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {canAssign
                ? 'Fleet Vehicle & Driver Assignment Workspace'
                : 'Transport Requests & Review Workspace'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {canAssign
                ? 'Review staff transport requests, verify live resource availability, and assign vehicles and chauffeurs safely without conflicts.'
                : 'Review staff transport requisitions, approve or reject bookings, view digital QR receipts, and manage fleet transport.'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => (onRefreshQueue ? onRefreshQueue() : fetchWorkspaceData())}
          className="h-11 px-4 flex items-center gap-2 border-slate-300 dark:border-slate-700 font-semibold shadow-2xs shrink-0"
          disabled={isLoading}
        >
          <RotateCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Workspace</span>
        </Button>
      </div>

      {/* 2. Seven (7) Interactive Summary Cards (Part 1.A) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Pending Requests */}
        <button
          type="button"
          onClick={() => setActiveFilterTab('pending')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeFilterTab === 'pending'
              ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Pending
            </span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {pendingRequests.length}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Awaiting Review
          </span>
        </button>

        {/* 2. Approved Requests */}
        <button
          type="button"
          onClick={() => setActiveFilterTab('approved')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeFilterTab === 'approved'
              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Approved
            </span>
            {canAssign ? (
              <KeyRound className="w-4 h-4 text-blue-500 shrink-0" />
            ) : (
              <Layers className="w-4 h-4 text-blue-500 shrink-0" />
            )}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {approvedUnassigned.length}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {canAssign ? 'Awaiting Vehicle' : 'Approved Requests'}
          </span>
        </button>

        {/* 3. Assigned Requests */}
        <button
          type="button"
          onClick={() => setActiveFilterTab('assigned')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeFilterTab === 'assigned'
              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Assigned
            </span>
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {assignedRequests.length}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Fleet Allocated
          </span>
        </button>

        {/* 4. Available Vehicles */}
        <button
          type="button"
          onClick={() => setActiveFilterTab('avail_vehicles')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeFilterTab === 'avail_vehicles'
              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Vehicles
            </span>
            <Car className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {availableVehiclesCount}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Available Now
          </span>
        </button>

        {/* 5. Available Drivers */}
        <button
          type="button"
          onClick={() => setActiveFilterTab('avail_drivers')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeFilterTab === 'avail_drivers'
              ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 ring-2 ring-teal-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Drivers
            </span>
            <UserCheck className="w-4 h-4 text-teal-500 shrink-0" />
          </div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">
            {availableDriversCount}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Available Chauffeurs
          </span>
        </button>

        {/* 6. Active Trips */}
        <button
          type="button"
          onClick={() => setActiveFilterTab('active_trips')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeFilterTab === 'active_trips'
              ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Active Trips
            </span>
            <Activity className="w-4 h-4 text-purple-500 shrink-0" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {activeTrips.length}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            On the Road
          </span>
        </button>

        {/* 7. Completed Trips */}
        <button
          type="button"
          onClick={() => setActiveFilterTab('completed')}
          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeFilterTab === 'completed'
              ? 'border-slate-500 bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Completed
            </span>
            <CheckCircle className="w-4 h-4 text-slate-500 shrink-0" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {completedTrips.length}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Successfully Closed
          </span>
        </button>
      </div>

      {/* 3. Comprehensive Filtering & Search Bar (Part 1.B) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box (5 cols) */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Request ID, staff name, employee ID, destination, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Request Type: Daily vs Weekly (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedRequestType}
              onChange={(e) => setSelectedRequestType(e.target.value)}
              className="w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="ALL">All Types (Daily & Weekly)</option>
              <option value="DAILY">Daily Requests Only</option>
              <option value="WEEKLY">Weekly Recurring Schedules</option>
            </select>
          </div>

          {/* Sort By (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="submitted_desc">Newest Submitted</option>
              <option value="travel_asc">Travel Date (Soonest)</option>
              <option value="passenger_desc">Most Passengers</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px] mr-1">Filter View:</span>
            <button
              type="button"
              onClick={() => setActiveFilterTab('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeFilterTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Requests ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('pending')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeFilterTab === 'pending'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              Pending Approval ({pendingRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('approved')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeFilterTab === 'approved'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              Awaiting Allocation ({approvedUnassigned.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('assigned')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeFilterTab === 'assigned'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              Vehicle Assigned ({assignedRequests.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              Showing <strong className="text-slate-900 dark:text-white">{displayedRequests.length}</strong> of {bookings.length} requests
            </span>
          </div>
        </div>
      </div>

      {/* 4. Requests List / Cards (Part 1.B) */}
      <div className="space-y-4">
        {displayedRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-slate-700">
              <ClipboardList className="w-7 h-7 text-slate-400" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              No Transport Requests Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No requests match the selected filters or search query. Try clearing your search or switching to "All Requests".
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setActiveFilterTab('all');
                setSearchTerm('');
                setSelectedDepartment('ALL');
                setSelectedRequestType('ALL');
              }}
              className="mt-4 h-10 px-4 text-xs font-semibold"
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          displayedRequests.map((b) => {
            const isExpanded = expandedIds.has(b.id);
            const isWeekly = b.requestType === 'WEEKLY' || (b.bookingDays && b.bookingDays.length > 0);
            const assignment = b.currentAssignment || b.assignments?.[0];
            const allocatedVehicle = assignment?.vehicle;

            const calculateDuration = (start: string | Date | null | undefined, end: string | Date | null | undefined) => {
              if (!start || !end) return 'Standard Trip';
              try {
                const s = new Date(start).getTime();
                const e = new Date(end).getTime();
                const diff = e - s;
                if (isNaN(diff) || diff <= 0) return 'Standard Trip';
                const hours = Math.round(diff / (1000 * 60 * 60));
                if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'}`;
                const days = Math.floor(hours / 24);
                const remHours = hours % 24;
                return remHours > 0 ? `${days}d ${remHours}h` : `${days} day${days === 1 ? '' : 's'}`;
              } catch {
                return 'Standard Trip';
              }
            };

            const durationText = calculateDuration(b.departureAt, b.expectedReturnAt);

            return (
              <Card
                key={b.id}
                className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all dark:bg-slate-900 dark:border-slate-800 shadow-xs"
              >
                {/* 1. Card Header Strip */}
                <div className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-lg border border-brand-200 dark:border-brand-800 shadow-2xs">
                        #{b.bookingReference}
                      </span>
                      <Badge status={b.status} size="sm" />

                      {isWeekly ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <CalendarRange className="w-3.5 h-3.5 text-purple-500" /> Weekly Schedule
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Daily Request
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Requested by</span>
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {b.requester?.name || 'Staff Member'}
                        </strong>
                        {b.requester?.employeeId && (
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                            ({b.requester.employeeId})
                          </span>
                        )}
                        <span className="text-slate-400 dark:text-slate-500">
                          • {b.requester?.department?.name || 'Staff'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {b.requiresDriver ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Driver Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Self-Driven
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {b.passengerCount} Seat{b.passengerCount !== 1 ? 's' : ''}
                      </span>

                      {b.preferredVehicle && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Prefers: {b.preferredVehicle.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Main Card Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Destination & Purpose */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0 mt-0.5 shadow-2xs">
                        <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          Official Destination
                        </span>
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                          {b.destination}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          <strong className="text-slate-800 dark:text-slate-200">Purpose: </strong>
                          {b.purpose}
                        </p>
                      </div>
                    </div>

                    {b.requester?.phone && (
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Requester Contact
                        </span>
                        <a
                          href={`tel:${b.requester.phone}`}
                          className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center sm:justify-end gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" /> {b.requester.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Allocated Fleet Summary Card (if already assigned) */}
                  {allocatedVehicle && (
                    <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-10 rounded-lg bg-white dark:bg-slate-800 overflow-hidden border border-emerald-200 dark:border-emerald-700/60 shrink-0">
                          <img
                            src={
                              allocatedVehicle.imageUrl ||
                              (allocatedVehicle.category === 'SUV'
                                ? '/vehicles/prado.png'
                                : allocatedVehicle.category === 'PICKUP'
                                ? '/vehicles/hilux.png'
                                : allocatedVehicle.category === 'MINIBUS'
                                ? '/vehicles/hiace.png'
                                : '/vehicles/corolla.png')
                            }
                            alt={allocatedVehicle.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                            Assigned Fleet Vehicle:
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {allocatedVehicle.name}
                          </span>
                          <span className="ml-2 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {allocatedVehicle.registrationNumber}
                          </span>
                          <span className="ml-2 text-xs text-slate-500">
                            ({allocatedVehicle.passengerCapacity} Seats)
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Assigned Chauffeur
                        </span>
                        <strong className="text-slate-900 dark:text-white text-sm">
                          {assignment?.driverName || (b.requiresDriver ? 'Chauffeur Pending' : 'Self-Driven (Staff)')}
                        </strong>
                        {assignment?.driverPhone && (
                          <span className="text-xs font-mono text-slate-500 block mt-0.5">
                            {assignment.driverPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Multi-Day Weekly Days Preview if Weekly */}
                  {isWeekly && b.bookingDays && b.bookingDays.length > 0 && (
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/50">
                      <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <CalendarRange className="w-3.5 h-3.5 text-purple-600" />
                        Weekly Recurring Schedule Days:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {b.bookingDays.map((day) => (
                          <span
                            key={day.id}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            <span className="font-bold">{day.dayOfWeek}:</span> {new Date(day.tripDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({day.timeSlot})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                        Departure Time
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span className="truncate">{formatEthiopianDateTime(b.departureAt)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                        Expected Return
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formatEthiopianDateTime(b.expectedReturnAt)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                        Trip Duration
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{durationText}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                        Submitted Date
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatEthiopianDateTime(b.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Expandable Drawer */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                            Requester Email:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {b.requester?.email || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                            Department Structure:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {b.requester?.department?.name || 'Capital Real Estate Staff'}
                          </span>
                        </div>
                      </div>

                      {b.additionalNotes && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                          <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                            Additional Operational Notes:
                          </span>
                          <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                            {b.additionalNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Action Footer Bar (Comfortable 42-44px buttons with prominent labels) */}
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Left: Detail Inspection & Toggle */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => onSelectBooking(b)}
                      leftIcon={<Eye className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                      className="h-11 px-4 border-slate-300 dark:border-slate-700 font-semibold shadow-2xs text-slate-800 dark:text-slate-100"
                    >
                      View Details
                    </Button>

                    {onPrintForm && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => onPrintForm(b)}
                        leftIcon={<Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                        className="h-11 px-3.5 border-slate-300 dark:border-slate-700 font-semibold shadow-2xs text-slate-700 dark:text-slate-300"
                      >
                        Print Form
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => toggleExpand(b.id)}
                      className="h-11 px-3 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" /> Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" /> More
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Right: Primary Operational Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* 1. Pending: Approve, Decline, Review Request, & Cancel */}
                    {b.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleApprove(b.id)}
                          disabled={isProcessingId === b.id}
                          leftIcon={<CheckCircle className="w-4 h-4 text-white" />}
                          className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => {
                            setRejectingBooking(b);
                            setRejectReason('');
                          }}
                          leftIcon={<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                          className="h-11 px-4 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100 font-semibold shadow-2xs"
                        >
                          Decline
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => onSelectBooking(b)}
                          leftIcon={<Eye className="w-4 h-4" />}
                          className="h-11 px-4 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold shadow-2xs"
                        >
                          Review Request
                        </Button>
                        {onCancelBooking && (
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => onCancelBooking(b)}
                            leftIcon={<XCircle className="w-4 h-4 text-slate-400" />}
                            className="h-11 px-3 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-medium shadow-2xs"
                          >
                            Cancel
                          </Button>
                        )}
                      </>
                    )}

                    {/* 2. Approved: Assign Vehicle, Auto-Assign, View Details & Cancel */}
                    {b.status === 'APPROVED' && (
                      <>
                        {canAssign && onAssignVehicle && (
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => onAssignVehicle(b)}
                            leftIcon={<Car className="w-4 h-4" />}
                            rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                            className="h-11 px-6 font-bold text-sm shadow-md bg-brand-600 hover:bg-brand-700 focus:ring-4 focus:ring-brand-500/20"
                          >
                            Assign Vehicle & Driver
                          </Button>
                        )}
                        {canAssign && (
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleAutoAssign(b)}
                            disabled={autoAssigningId === b.id}
                            leftIcon={autoAssigningId === b.id ? <RotateCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            className="h-11 px-4 font-bold text-sm shadow-sm bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            {autoAssigningId === b.id ? 'Auto...' : '⚡ Auto-Assign'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => onSelectBooking(b)}
                          leftIcon={<Eye className="w-4 h-4" />}
                          className="h-11 px-5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold shadow-2xs"
                        >
                          View Details
                        </Button>
                        {onCancelBooking && (
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => onCancelBooking(b)}
                            leftIcon={<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                            className="h-11 px-4 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-semibold shadow-2xs"
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </>
                    )}

                    {/* 3. Assigned: View Assignment & Cancel Booking */}
                    {b.status === 'ASSIGNED' && (
                      <>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => onSelectBooking(b)}
                          leftIcon={<Eye className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                          className="h-11 px-5 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 font-bold shadow-2xs"
                        >
                          View Assignment
                        </Button>
                        {canAssign && onAssignVehicle && (
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => onAssignVehicle(b)}
                            leftIcon={<Car className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                            className="h-11 px-4 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold shadow-2xs"
                          >
                            Reassign
                          </Button>
                        )}
                        {onCancelBooking && (
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => onCancelBooking(b)}
                            leftIcon={<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                            className="h-11 px-4 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-semibold shadow-2xs"
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </>
                    )}

                    {/* 4. Completed or Cancelled: View Details */}
                    {b.status !== 'PENDING_APPROVAL' && b.status !== 'APPROVED' && b.status !== 'ASSIGNED' && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => onSelectBooking(b)}
                        leftIcon={<Eye className="w-4 h-4 text-slate-500" />}
                        className="h-11 px-5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold shadow-2xs"
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 5. Reject Request Modal */}
      {rejectingBooking && (
        <Modal
          isOpen={!!rejectingBooking}
          onClose={() => setRejectingBooking(null)}
          title={`Reject Transport Request #${rejectingBooking.bookingReference}`}
          description="Please state why this request cannot be approved so the employee understands."
          maxWidth="md"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button variant="outline" size="md" className="h-11 px-5" onClick={() => setRejectingBooking(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="h-11 px-5 font-bold"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Operational Rejection Reason:
            </label>
            <textarea
              rows={4}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. All fleet vehicles of requested capacity are reserved for ongoing field missions; please reschedule or coordinate shared transport."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
