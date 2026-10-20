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
} from 'lucide-react';

interface AdminAnalyticsDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onOpenBooking?: (booking: Booking) => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  onNavigateTab,
  onOpenBooking,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | 'month'>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');

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
      // Date filter
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

      // Department filter
      if (selectedDeptId !== 'all') {
        if (b.requester?.departmentId !== selectedDeptId) return false;
      }

      return true;
    });
  }, [bookings, dateRange, selectedDeptId]);

  // Key KPI Calculations
  const totalUsers = users.length;
  const totalDepartments = departments.length;
  const totalVehicles = vehicles.length;

  const availableVehicles = vehicles.filter(
    (v) => v.operationalStatus === 'ACTIVE'
  ).length;

  const inMaintenanceVehicles = vehicles.filter(
    (v) => v.operationalStatus === 'MAINTENANCE'
  ).length;

  const inProgressTrips = filteredBookings.filter((b) => b.status === 'IN_PROGRESS').length;
  const pendingRequests = filteredBookings.filter((b) => b.status === 'PENDING_APPROVAL').length;
  const approvedRequests = filteredBookings.filter((b) => b.status === 'APPROVED').length;
  const completedTrips = filteredBookings.filter((b) => b.status === 'COMPLETED').length;
  const rejectedRequests = filteredBookings.filter((b) => b.status === 'REJECTED').length;

  // Fleet Utilization Rate (%)
  const activeFleetCount = totalVehicles - inMaintenanceVehicles;
  const utilizationRate =
    totalVehicles > 0
      ? Math.min(100, Math.round(((inProgressTrips + approvedRequests) / (totalVehicles || 1)) * 100))
      : 0;

  // Daily vs Weekly Bookings Analysis
  const bookingTypeStats = useMemo(() => {
    let dailyCount = 0;
    let weeklyCount = 0;

    filteredBookings.forEach((b) => {
      const dep = new Date(b.departureAt).getTime();
      const ret = new Date(b.expectedReturnAt).getTime();
      const diffHours = (ret - dep) / (1000 * 60 * 60);

      // Multi-day duration (> 24 hours) indicates weekly request
      if (diffHours > 24) {
        weeklyCount++;
      } else {
        dailyCount++;
      }
    });

    const total = dailyCount + weeklyCount || 1;
    return {
      daily: dailyCount,
      weekly: weeklyCount,
      dailyPercent: Math.round((dailyCount / total) * 100),
      weeklyPercent: Math.round((weeklyCount / total) * 100),
    };
  }, [filteredBookings]);

  // Department-Level Usage Ranking
  const departmentUsageStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code?: string; trips: number; passengers: number }>();

    // Initialize all departments
    departments.forEach((d) => {
      map.set(d.id, {
        id: d.id,
        name: d.name,
        code: d.code || undefined,
        trips: 0,
        passengers: 0,
      });
    });

    // Populate from filtered bookings
    filteredBookings.forEach((b) => {
      const deptId = b.requester?.departmentId;
      if (deptId && map.has(deptId)) {
        const current = map.get(deptId)!;
        current.trips += 1;
        current.passengers += b.passengerCount || 1;
      } else if (b.requester?.department?.name) {
        // Fallback matching by name
        const deptName = b.requester.department.name;
        let found = false;
        map.forEach((val) => {
          if (val.name === deptName) {
            val.trips += 1;
            val.passengers += b.passengerCount || 1;
            found = true;
          }
        });
        if (!found) {
          map.set(deptName, {
            id: deptName,
            name: deptName,
            trips: 1,
            passengers: b.passengerCount || 1,
          });
        }
      }
    });

    const arr = Array.from(map.values());
    const maxTrips = Math.max(...arr.map((a) => a.trips), 1);

    return arr
      .sort((a, b) => b.trips - a.trips)
      .map((item) => ({
        ...item,
        relativePercent: Math.round((item.trips / maxTrips) * 100),
      }));
  }, [departments, filteredBookings]);

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
      {/* ── Admin Analytics Header HUD ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-2xl border border-slate-700/60">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                ENTERPRISE TELEMETRICS & AUDIT INTELLIGENCE
              </span>
              <span className="text-xs text-slate-400 font-mono tracking-wider hidden sm:inline">
                LIVE POSTGRES DATA
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Executive Fleet Analytics & Departmental Insights
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consolidated real-time analytics across all 8 company departments, vehicle utilization metrics, daily vs weekly booking distributions, and operational readiness.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
              className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 font-semibold"
            >
              Export CSV Report
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700"
              title="Refresh telemetry"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters Bar Inside HUD */}
        <div className="mt-6 pt-5 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-300 uppercase tracking-wider">Date Scope:</span>
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setDateRange('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  dateRange === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setDateRange('today')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  dateRange === 'today'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateRange('7days')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  dateRange === '7days'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Past 7 Days
              </button>
              <button
                type="button"
                onClick={() => setDateRange('month')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  dateRange === 'month'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Past 30 Days
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 uppercase tracking-wider">Department:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-slate-900/90 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Key Performance Indicators (KPIs) Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Registered Staff</span>
              <Users className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              {totalUsers}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Across {totalDepartments} departments</p>
          </CardContent>
        </Card>

        {/* Total Vehicles */}
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Fleet Assets</span>
              <Car className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              {totalVehicles}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              {availableVehicles} Available · {inMaintenanceVehicles} Workshop
            </p>
          </CardContent>
        </Card>

        {/* Fleet Utilization Rate */}
        <Card className="rounded-2xl border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/60 dark:from-indigo-950/30 to-white dark:to-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              <span>Fleet Utilization</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              {utilizationRate}%
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${utilizationRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="rounded-2xl border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/60 dark:from-amber-950/30 to-white dark:to-slate-900 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <span>Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              {pendingRequests}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting logistics review</p>
          </CardContent>
        </Card>

        {/* Completed Trips */}
        <Card className="rounded-2xl border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/60 dark:from-emerald-950/30 to-white dark:to-slate-900 shadow-sm hover:shadow-md transition-all col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <span>Completed Trips</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              {completedTrips}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Missions logged & returned</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Visual Analytics Charts and Bars ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Daily vs. Weekly Booking Requests (Vertical Bars) */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Daily vs. Weekly Booking Distribution
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comparative volume of single-day requests vs. multi-day itineraries
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredBookings.length} Total
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Visual Bar Columns */}
            <div className="flex items-end justify-center gap-12 h-52 pt-8 border-b border-slate-100 dark:border-slate-800">
              {/* Daily Bar */}
              <div className="flex flex-col items-center gap-2 group w-24">
                <span className="text-xs font-mono font-black text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  {bookingTypeStats.daily} ({bookingTypeStats.dailyPercent}%)
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-40 rounded-2xl flex items-end p-1.5 overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-xl transition-all duration-700 shadow-lg shadow-red-500/20 group-hover:brightness-110"
                    style={{
                      height: `${Math.max(12, bookingTypeStats.dailyPercent)}%`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Daily Requests
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">Single-Day / Urgent</span>
                </div>
              </div>

              {/* Weekly Bar */}
              <div className="flex flex-col items-center gap-2 group w-24">
                <span className="text-xs font-mono font-black text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  {bookingTypeStats.weekly} ({bookingTypeStats.weeklyPercent}%)
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-40 rounded-2xl flex items-end p-1.5 overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-xl transition-all duration-700 shadow-lg shadow-indigo-500/20 group-hover:brightness-110"
                    style={{
                      height: `${Math.max(12, bookingTypeStats.weeklyPercent)}%`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Weekly Requests
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">Multi-Day Fleet</span>
                </div>
              </div>
            </div>

            {/* Explanatory Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Daily Protocols</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  Standard 24h Notice
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Short-range client & site visits</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Weekly Protocols</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  Standard 72h Notice
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Multi-day structural project teams</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CHART 2: Fleet Operational Readiness & Asset Status */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Fleet Asset Distribution & Status
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Breakdown of company vehicles by operational state
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {availableVehicles}/{totalVehicles} Ready
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Proportional Segmented Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">Asset Allocation</span>
                <span className="text-slate-900 dark:text-white font-mono">{totalVehicles} Vehicles Registered</span>
              </div>
              <div className="w-full h-5 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 flex gap-1 overflow-hidden">
                <div
                  className="bg-emerald-500 rounded-lg transition-all"
                  style={{
                    width: `${totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0}%`,
                  }}
                  title={`Available: ${availableVehicles}`}
                />
                <div
                  className="bg-indigo-500 rounded-lg transition-all"
                  style={{
                    width: `${totalVehicles > 0 ? (inProgressTrips / totalVehicles) * 100 : 0}%`,
                  }}
                  title={`In-Transit: ${inProgressTrips}`}
                />
                <div
                  className="bg-rose-500 rounded-lg transition-all"
                  style={{
                    width: `${totalVehicles > 0 ? (inMaintenanceVehicles / totalVehicles) * 100 : 0}%`,
                  }}
                  title={`In Maintenance: ${inMaintenanceVehicles}`}
                />
              </div>
            </div>

            {/* Legend & Asset Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Available</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                  {availableVehicles}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Ready for booking</p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>On Road</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                  {inProgressTrips}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Active trips</p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Workshop</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                  {inMaintenanceVehicles}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Service & repairs</p>
              </div>
            </div>

            {/* Request Status Breakdown Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Requisition Approval Ratios
              </span>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Approved: {approvedRequests + completedTrips}</span>
                <span>Pending: {pendingRequests}</span>
                <span>Rejected: {rejectedRequests}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── CHART 3: Department-Level Transport Usage (Horizontal Ranking Bars) ── */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Department-Level Transport Usage Ranking
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total booking volume and passenger movements across organizational units
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {departments.length} Monitored Departments
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            {departmentUsageStats.map((dept, index) => {
              const isTop = index === 0 && dept.trips > 0;
              return (
                <div key={dept.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-slate-400 font-bold w-5">{index + 1}.</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {dept.name}
                      </span>
                      {dept.code && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                          {dept.code}
                        </span>
                      )}
                      {isTop && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800">
                          Top Requester
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      <span>{dept.passengers} Passengers</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {dept.trips} {dept.trips === 1 ? 'Trip' : 'Trips'}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        index % 3 === 0
                          ? 'bg-gradient-to-r from-red-600 to-red-400'
                          : index % 3 === 1
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-400'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      }`}
                      style={{ width: `${Math.max(4, dept.relativePercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
