import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { Booking, Vehicle, User, Department, BookingStatus } from '@/types';
import { exportToCsv } from '@/lib/csvExport';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  TrendingUp,
  Car,
  Users,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  Filter,
  PieChart,
  ShieldCheck,
  Zap,
  Activity,
  UserCheck,
  FileText,
  QrCode,
  XCircle,
  CheckCircle,
  Search,
  ArrowRight,
  MapPin,
  KeyRound,
  Eye,
} from 'lucide-react';

interface AdminAnalyticsDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onOpenBooking?: (booking: Booking) => void;
  onAssignVehicle?: (booking: Booking) => void;
  onCancelBooking?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
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
        No request data
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

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  onNavigateTab,
  onOpenBooking,
  onAssignVehicle,
  onCancelBooking,
  onOpenReceipt,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Analytics Filters
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | 'month'>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');

  // Dispatch Queue Table Filters
  const [tableFilterStatus, setTableFilterStatus] = useState<string>('ALL');
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, vehiclesData, usersData, deptsData] = await Promise.all([
        api.getBookings(),
        api.getVehicles(),
        api.getUsers().catch(() => []),
        api.getDepartments().catch(() => []),
      ]);
      setBookings(bookingsData);
      setVehicles(vehiclesData);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err) {
      console.error('Failed to load admin analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter bookings by date and department
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      const tripDate = new Date(b.departureAt || b.createdAt);
      if (dateRange === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        const tripStr = tripDate.toISOString().split('T')[0];
        if (todayStr !== tripStr) return false;
      } else if (dateRange === '7days') {
        const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (tripDate < past7) return false;
      } else if (dateRange === 'month') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (tripDate < past30) return false;
      }

      if (selectedDeptId !== 'all') {
        if (b.requester?.departmentId !== selectedDeptId) return false;
      }

      return true;
    });
  }, [bookings, dateRange, selectedDeptId]);

  // Key KPI Calculations
  const totalUsers = users.length;

  const inUseVehicleIds = new Set(
    bookings
      .filter((b) => b.status === 'IN_PROGRESS')
      .flatMap((b) => b.assignments?.map((a) => a.vehicleId).filter(Boolean) || [])
  );
  const inUseVehicles = vehicles.filter((v) => inUseVehicleIds.has(v.id)).length;
  const availableVehicles = vehicles.filter(
    (v) => v.operationalStatus === 'ACTIVE' && !inUseVehicleIds.has(v.id)
  ).length;
  const inMaintenanceVehicles = vehicles.filter((v) => v.operationalStatus === 'MAINTENANCE').length;

  const drivers = useMemo(() => {
    return users.filter(
      (u) => u.role === 'DRIVER' || u.jobTitle?.toLowerCase().includes('driver') || u.jobTitle?.toLowerCase().includes('chauffeur')
    );
  }, [users]);

  const activeDriverIds = new Set(
    bookings
      .filter((b) => b.status === 'IN_PROGRESS')
      .flatMap((b) => b.assignments?.map((a) => a.driverId).filter(Boolean) || [])
  );
  const assignedDrivers = drivers.filter((d) => activeDriverIds.has(d.id)).length;
  const availableDrivers = Math.max(0, drivers.length - assignedDrivers);

  // Approval Rate Calculation
  const reviewedBookings = filteredBookings.filter(
    (b) => b.status === 'APPROVED' || b.status === 'REJECTED' || b.status === 'COMPLETED' || b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED'
  );
  const approvedCount = filteredBookings.filter(
    (b) => b.status === 'APPROVED' || b.status === 'COMPLETED' || b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED'
  ).length;
  const approvalRate = reviewedBookings.length > 0 ? Math.round((approvedCount / reviewedBookings.length) * 100) : 100;

  // Average Turnaround (submission to completion in hours)
  const completedWithTimes = filteredBookings.filter((b) => b.status === 'COMPLETED');
  const avgTurnaroundHours = completedWithTimes.length > 0
    ? Math.round(
        completedWithTimes.reduce((acc, b) => {
          const dep = new Date(b.departureAt).getTime();
          const ret = new Date(b.expectedReturnAt).getTime();
          return acc + Math.max(1, (ret - dep) / (1000 * 60 * 60));
        }, 0) / completedWithTimes.length
      )
    : 4;

  // Requests Over Last 7 Days (Data Points)
  const last7DaysData = useMemo(() => {
    const days: { label: string; dateStr: string; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = bookings.filter((b) => {
        try {
          return new Date(b.createdAt).toISOString().split('T')[0] === dateStr;
        } catch {
          return false;
        }
      }).length;
      days.push({ label, dateStr, count });
    }
    return days;
  }, [bookings]);

  const max7DayCount = Math.max(...last7DaysData.map((d) => d.count), 5);

  // Status Breakdown Donut
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  }, [filteredBookings]);

  const statusDonutData: DonutSegment[] = [
    { name: 'Submitted / Pending', value: statusCounts['PENDING_APPROVAL'] || 0, color: '#f59e0b' },
    { name: 'Approved', value: statusCounts['APPROVED'] || 0, color: '#10b981' },
    { name: 'In Progress / Assigned', value: (statusCounts['IN_PROGRESS'] || 0) + (statusCounts['ASSIGNED'] || 0), color: '#3b82f6' },
    { name: 'Completed', value: statusCounts['COMPLETED'] || 0, color: '#14b8a6' },
    { name: 'Rejected / Cancelled', value: (statusCounts['REJECTED'] || 0) + (statusCounts['CANCELLED'] || 0), color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Department Volume Ranking
  const departmentUsageStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code?: string; trips: number; passengers: number }>();
    departments.forEach((d) => {
      map.set(d.id, {
        id: d.id,
        name: d.name,
        code: (d as any).code || undefined,
        trips: 0,
        passengers: 0,
      });
    });

    filteredBookings.forEach((b) => {
      const deptId = b.requester?.departmentId;
      if (deptId && map.has(deptId)) {
        const cur = map.get(deptId)!;
        cur.trips += 1;
        cur.passengers += b.passengerCount || 1;
      }
    });

    const arr = Array.from(map.values()).sort((a, b) => b.trips - a.trips);
    const maxTrips = Math.max(...arr.map((a) => a.trips), 1);
    return arr.map((item) => ({
      ...item,
      relativePercent: Math.round((item.trips / maxTrips) * 100),
    }));
  }, [departments, filteredBookings]);

  // Live Activity Feed
  const liveActivityFeed = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
      .map((b) => {
        const isCompleted = b.status === 'COMPLETED';
        const isAssigned = b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS';
        const assignment = b.assignments?.[0];

        return {
          id: b.id,
          booking: b,
          label: isCompleted
            ? `Trip completed to ${b.destination}`
            : isAssigned
            ? `Vehicle assigned for ${b.destination}`
            : `New request to ${b.destination}`,
          detail: isAssigned && assignment?.driverName
            ? `${assignment.driverName} · ${assignment.vehicle?.registrationNumber || 'Vehicle'}`
            : b.requester?.department?.name || 'Department Requisition',
          time: b.createdAt,
          type: isCompleted ? 'completed' : isAssigned ? 'assigned' : 'request',
        };
      });
  }, [bookings]);

  // Dispatch Queue Table Status Counts
  const tableStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: bookings.length,
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    bookings.forEach((b) => {
      if (counts[b.status] !== undefined) {
        counts[b.status]++;
      }
    });
    return counts;
  }, [bookings]);

  // Dispatch Queue Table Filtered List
  const tableFilteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (tableFilterStatus !== 'ALL' && b.status !== tableFilterStatus) {
        return false;
      }
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase().trim();
        const matches =
          b.bookingReference?.toLowerCase().includes(q) ||
          b.destination?.toLowerCase().includes(q) ||
          b.purpose?.toLowerCase().includes(q) ||
          b.requester?.name?.toLowerCase().includes(q) ||
          b.requester?.employeeId?.toLowerCase().includes(q) ||
          b.requester?.department?.name?.toLowerCase().includes(q) ||
          b.assignments?.[0]?.driverName?.toLowerCase().includes(q) ||
          b.assignments?.[0]?.vehicle?.registrationNumber?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [bookings, tableFilterStatus, tableSearchQuery]);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Reference ID',
      'Date',
      'Requester',
      'Department',
      'Destination',
      'Purpose',
      'Passengers',
      'Vehicle',
      'Plate',
      'Chauffeur',
      'Status',
    ];
    const rows = filteredBookings.map((b) => [
      b.bookingReference,
      formatEthiopianDateOnly(b.departureAt),
      b.requester?.name || 'Staff',
      b.requester?.department?.name || 'N/A',
      b.destination,
      b.purpose,
      b.passengerCount,
      b.assignments?.[0]?.vehicle?.name || 'Unassigned',
      b.assignments?.[0]?.vehicle?.registrationNumber || 'N/A',
      b.assignments?.[0]?.driverName || 'Self / Unassigned',
      b.status,
    ]);
    exportToCsv(`capital-fleet-analytics-${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* ── Greeting Banner / System Health (VisionFund Exact Admin Banner) ── */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Executive Admin Telemetrics
            </span>
            <span className="text-xs font-mono text-slate-400">
              POSTGRESQL LIVE
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back, Administrator
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            The transport network is operating with{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {availableVehicles} available vehicles
            </strong>{' '}
            and{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
              {availableDrivers} available drivers
            </strong>
            .
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto z-10">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Export CSV
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            title="Refresh telemetrics"
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Top 4 KPI Metrics (VisionFund Exact Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              Total Staff
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {totalUsers}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Active company user profiles
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/80 shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Total Requests
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {filteredBookings.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Transport requisitions submitted
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Approval Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Approval Rate
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {approvalRate}%
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-semibold">
              High operational throughput
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Turnaround */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              Avg Turnaround
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {avgTurnaroundHours}h
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Based on completed trips
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/80 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Secondary Fleet Asset Status Strip (5 Metrics) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Available Vehicles
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
            {availableVehicles}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
            Assigned Vehicles
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
            {inUseVehicles}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            In Maintenance
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
            {inMaintenanceVehicles}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
            Available Drivers
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
            {availableDrivers}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
            Assigned Drivers
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
            {assignedDrivers}
          </span>
        </div>
      </div>

      {/* ── Main Analytics & Live Stream Grid (3-Column Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Center 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* CHART: Requests Over Last 7 Days (Responsive SVG Trend Line Chart) */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Requests Over Last 7 Days
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Responsive SVG Sparkline Trend */}
              <div className="h-52 w-full flex flex-col justify-between">
                <div className="relative flex-1 w-full flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160" preserveAspectRatio="none">
                    {/* Horizontal Grid Lines */}
                    <line x1="0" y1="40" x2="700" y2="40" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />
                    <line x1="0" y1="80" x2="700" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />
                    <line x1="0" y1="120" x2="700" y2="120" stroke="currentColor" strokeDasharray="3 3" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />

                    {/* Trend Polyline */}
                    <polyline
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={last7DaysData
                        .map((d, i) => {
                          const x = (i / (last7DaysData.length - 1)) * 680 + 10;
                          const y = 140 - (d.count / max7DayCount) * 120;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />

                    {/* Data Points */}
                    {last7DaysData.map((d, i) => {
                      const x = (i / (last7DaysData.length - 1)) * 680 + 10;
                      const y = 140 - (d.count / max7DayCount) * 120;
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="5" fill="#dc2626" className="shadow-md" />
                          <circle cx={x} cy={y} r="8" fill="#dc2626" opacity="0.2" />
                          <text
                            x={x}
                            y={y - 12}
                            textAnchor="middle"
                            className="text-[11px] font-bold font-mono fill-slate-700 dark:fill-slate-300"
                          >
                            {d.count}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* X Axis Labels */}
                <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-400">
                  {last7DaysData.map((d, i) => (
                    <span key={i} className="text-center">{d.label}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CHART: Top Departments by Volume */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Top Departments by Volume
                  </CardTitle>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {departments.length} Monitored Units
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-4">
                {departmentUsageStats.slice(0, 5).map((dept, index) => (
                  <div key={dept.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold w-4">{index + 1}.</span>
                        <span className="font-bold text-slate-900 dark:text-white">{dept.name}</span>
                        {dept.code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                            {dept.code}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {dept.trips} {dept.trips === 1 ? 'request' : 'requests'}
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700"
                        style={{ width: `${Math.max(6, dept.relativePercent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Requests by Status & Live Activity Stream */}
        <div className="space-y-6">
          {/* Requests by Status Donut */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Requests by Status
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center">
                <SvgDonutChart
                  data={statusDonutData}
                  centerLabel={String(filteredBookings.length)}
                  centerSublabel="Requests"
                  size={160}
                />

                <div className="w-full space-y-2 mt-4">
                  {statusDonutData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Live Activity
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {liveActivityFeed.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No recent activity.</p>
              ) : (
                <div className="space-y-4">
                  {liveActivityFeed.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onOpenBooking && onOpenBooking(item.booking)}
                      className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 mt-0.5">
                        <FileText className="size-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.detail}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatEthiopianDateTime(item.time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Enterprise Transport Allocation & Dispatch Queue Table ── */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20 shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Enterprise Transport Allocation & Dispatch Command</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                    {tableFilteredBookings.length} {tableFilteredBookings.length === 1 ? 'Trip' : 'Trips'}
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct administrative action: review requests, allocate fleet vehicles & drivers, generate digital receipts, or process cancellations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                leftIcon={<RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                className="h-9 text-xs border-slate-200 dark:border-slate-700"
              >
                Refresh
              </Button>
              {onNavigateTab && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigateTab('assign-queue')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}
                  className="h-9 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Full Assignment Queue
                </Button>
              )}
            </div>
          </div>

          {/* Filter Bar: Status Tabs + Search */}
          <div className="mt-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Requests', count: tableStatusCounts.ALL },
                { id: 'PENDING_APPROVAL', label: 'Pending Review', count: tableStatusCounts.PENDING_APPROVAL },
                { id: 'APPROVED', label: 'Awaiting Allocation', count: tableStatusCounts.APPROVED },
                { id: 'ASSIGNED', label: 'Assigned', count: tableStatusCounts.ASSIGNED },
                { id: 'IN_PROGRESS', label: 'In Transit', count: tableStatusCounts.IN_PROGRESS },
                { id: 'COMPLETED', label: 'Completed', count: tableStatusCounts.COMPLETED },
                { id: 'CANCELLED', label: 'Cancelled', count: tableStatusCounts.CANCELLED },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTableFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tableFilterStatus === tab.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      tableFilterStatus === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trip reference, staff, destination..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {tableSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTableSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {tableFilteredBookings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <Car className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No transport requests found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No trip records matched your active status filter or search keywords.
              </p>
              {(tableFilterStatus !== 'ALL' || tableSearchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTableFilterStatus('ALL');
                    setTableSearchQuery('');
                  }}
                  className="mt-4 text-xs font-semibold"
                >
                  Reset Filter & Search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Request # & Date</th>
                    <th className="py-3.5 px-4">Requester & Dept</th>
                    <th className="py-3.5 px-4">Destination & Schedule</th>
                    <th className="py-3.5 px-4">Allocated Fleet & Driver</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {tableFilteredBookings.map((b) => {
                    const assignment = b.assignments?.[0];
                    const vehicle = assignment?.vehicle;
                    const driverName = assignment?.driverName || assignment?.driver?.name;
                    const canCancel =
                      b.status !== 'COMPLETED' &&
                      b.status !== 'CANCELLED' &&
                      b.status !== 'REJECTED';

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Request Reference & Date */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">
                              {b.bookingReference}
                            </span>
                            {(b.priority === 'HIGH' || b.priority === 'VIP') && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                b.priority === 'VIP'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}>
                                {b.priority}
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                            {formatEthiopianDateOnly(b.departureAt)}
                          </span>
                          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {b.requestType || 'DAILY'} TRIP
                          </span>
                        </td>

                        {/* Requester & Department */}
                        <td className="py-3.5 px-4 align-top">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {b.requester?.name || 'Staff Member'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {b.requester?.department?.name || 'Corporate'}
                          </span>
                          {b.requester?.phone && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {b.requester.phone}
                            </span>
                          )}
                        </td>

                        {/* Destination & Schedule */}
                        <td className="py-3.5 px-4 align-top max-w-[240px]">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{b.destination}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 block mt-0.5">
                            {b.purpose}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatEthiopianDateTime(b.departureAt)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {b.passengerCount} pax
                            </span>
                          </div>
                        </td>

                        {/* Allocated Fleet & Driver */}
                        <td className="py-3.5 px-4 align-top">
                          {vehicle ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                {vehicle.name}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {vehicle.registrationNumber}
                                </span>
                                {driverName && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-emerald-600" />
                                    {driverName}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              Awaiting Allocation
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-top">
                          <Badge status={b.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right align-top">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* 1. Cancel Booking Button */}
                            {canCancel && onCancelBooking && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onCancelBooking(b)}
                                title="Cancel this booking request"
                                leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                                className="h-[36px] px-2.5 text-xs border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-semibold"
                              >
                                <span>Cancel Booking</span>
                              </Button>
                            )}

                            {/* 2. Review & Assign / Assign Vehicle Button */}
                            {b.status === 'APPROVED' && onAssignVehicle && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onAssignVehicle(b)}
                                title="Assign fleet vehicle and driver"
                                leftIcon={<Car className="w-3.5 h-3.5" />}
                                rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
                                className="h-[36px] px-3.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
                              >
                                <span>Assign Vehicle</span>
                              </Button>
                            )}

                            {b.status === 'PENDING_APPROVAL' && onAssignVehicle && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onAssignVehicle(b)}
                                title="Review and allocate vehicle"
                                leftIcon={<Car className="w-3.5 h-3.5" />}
                                rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
                                className="h-[36px] px-3.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
                              >
                                <span>Review & Assign</span>
                              </Button>
                            )}

                            {b.status === 'ASSIGNED' && onAssignVehicle && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAssignVehicle(b)}
                                title="Change assigned vehicle or driver"
                                leftIcon={<Car className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                                className="h-[36px] px-3 text-xs font-semibold border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                              >
                                <span>Reassign</span>
                              </Button>
                            )}

                            {/* 3. Digital Receipt & QR Button */}
                            {onOpenReceipt && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenReceipt(b)}
                                title="View official dispatch receipt & QR pass"
                                leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                                className="h-[36px] px-2.5 text-xs border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-semibold"
                              >
                                <span>Receipt</span>
                              </Button>
                            )}

                            {/* 4. Full Details Button */}
                            {onOpenBooking && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenBooking(b)}
                                title="View full booking details"
                                leftIcon={<Eye className="w-3.5 h-3.5 text-slate-500" />}
                                className="h-[36px] px-2.5 text-xs text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <span>Details</span>
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
        </CardContent>
      </Card>
    </div>
  );
};
