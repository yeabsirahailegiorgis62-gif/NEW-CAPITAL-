import React, { useState, useEffect } from 'react';
import { User, Booking } from '@/types';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
import {
  Car,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Phone,
  UserCheck,
  ShieldCheck,
  RotateCw,
  QrCode,
  FileText,
  Navigation,
  Compass,
  Gauge,
  Fuel,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface DriverDashboardProps {
  currentUser: User;
  onOpenBooking: (booking: Booking) => void;
  onStartTrip: (booking: Booking) => void;
  onCompleteTrip: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onRefresh?: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  currentUser,
  onOpenBooking,
  onStartTrip,
  onCompleteTrip,
  onOpenReceipt,
  onRefresh,
}) => {
  const [driverBookings, setDriverBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'completed'>('all');

  const fetchDriverTrips = async () => {
    try {
      setIsLoading(true);
      const bookings = await api.getBookings();
      // Scoped automatically by API or client fallback
      setDriverBookings(bookings);
    } catch (err) {
      console.error('Failed to load driver assignments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverTrips();
  }, []);

  const handleRefresh = async () => {
    await fetchDriverTrips();
    if (onRefresh) onRefresh();
  };

  // Trips in progress or ready to depart
  const activeMission = driverBookings.find(
    (b) => b.status === 'IN_PROGRESS' || (b.status === 'APPROVED' && b.assignments && b.assignments.length > 0)
  );

  const upcomingTrips = driverBookings.filter(
    (b) => b.status === 'APPROVED' && b.id !== activeMission?.id
  );

  const completedTrips = driverBookings.filter((b) => b.status === 'COMPLETED');

  // Statistics
  const totalMissions = driverBookings.length;
  const completedCount = completedTrips.length;
  const inProgressCount = driverBookings.filter((b) => b.status === 'IN_PROGRESS').length;
  const totalKmDriven = completedTrips.reduce((acc, b) => {
    const a = b.assignments?.[0];
    if (a?.startOdometer && a?.endOdometer && a.endOdometer >= a.startOdometer) {
      return acc + (a.endOdometer - a.startOdometer);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* ── Driver Profile & Duty HUD ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 md:p-8 text-white shadow-xl border border-slate-700/60">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 p-1 flex items-center justify-center overflow-hidden shadow-lg">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <UserCheck className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Chauffeur Portal
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {currentUser.employeeId || 'DRV-OFFICIAL'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currentUser.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span>{currentUser.jobTitle || 'Executive Fleet Chauffeur'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  License: {currentUser.licenseNumber || 'ET-DL-VERIFIED'}
                </span>
                {currentUser.phone && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-300 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {currentUser.phone}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Telematics Metric Badges */}
          <div className="flex items-center gap-3 sm:gap-4 bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 shadow-inner">
            <div className="text-center px-3 border-r border-slate-700">
              <div className="text-2xl font-black text-amber-400 font-mono">
                {completedCount}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Completed
              </div>
            </div>

            <div className="text-center px-3 border-r border-slate-700">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {inProgressCount}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                En Route
              </div>
            </div>

            <div className="text-center px-3">
              <div className="text-2xl font-black text-white font-mono">
                {totalKmDriven.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Km Logged
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-2 bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700"
              title="Refresh assignments"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Active Mission Focus Banner (If Any) ── */}
      {activeMission ? (
        <Card className="border-2 border-amber-500/80 dark:border-amber-500/60 bg-gradient-to-r from-amber-500/5 via-white to-amber-500/10 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/20 shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-amber-200/60 dark:border-amber-800/60 bg-amber-500/10 py-3.5 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-amber-500 text-white shadow-xs">
                <Navigation className="w-4 h-4 animate-spin-slow" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Chauffeur Mission · #{activeMission.bookingReference}
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {activeMission.status === 'IN_PROGRESS'
                    ? 'Trip currently underway. Keep dispatch updated upon arrival.'
                    : 'Assigned mission ready for departure.'}
                </p>
              </div>
            </div>

            <Badge status={activeMission.status} size="md" />
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Split Route & Vehicle Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Destination */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Destination
                </span>
                <div className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{activeMission.destination}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Purpose: {activeMission.purpose}
                </div>
              </div>

              {/* Schedule */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Departure Time
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{formatEthiopianDateTime(activeMission.departureAt)}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Return: {formatEthiopianDateTime(activeMission.expectedReturnAt)}
                </div>
              </div>

              {/* Assigned Vehicle */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Assigned Vehicle
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <Car className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{activeMission.assignments?.[0]?.vehicle?.name || 'Assigned Vehicle'}</span>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {activeMission.assignments?.[0]?.vehicle?.registrationNumber || 'Pending Plate'}
                </div>
              </div>

              {/* Passenger Contact */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Requester / Lead Passenger
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {activeMission.requester?.name || 'Staff Member'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activeMission.requester?.department?.name || 'Capital Real Estate'}
                </div>
                {activeMission.requester?.phone && (
                  <a
                    href={`tel:${activeMission.requester.phone}`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 hover:underline pt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    {activeMission.requester.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Chauffeur Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenBooking(activeMission)}
                  leftIcon={<FileText className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  View Mission Details
                </Button>
                {onOpenReceipt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenReceipt(activeMission)}
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Gate Pass
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {activeMission.status === 'APPROVED' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onStartTrip(activeMission)}
                    className="bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 font-bold"
                    leftIcon={<Gauge className="w-4 h-4" />}
                  >
                    Start Trip & Record Odometer
                  </Button>
                )}

                {activeMission.status === 'IN_PROGRESS' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onCompleteTrip(activeMission)}
                    className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 font-bold"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Complete Trip & Record Return Odometer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-6 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Active Trip Underway
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are currently on standby. Any new vehicle dispatch or upcoming assignment assigned by logistics will appear directly here.
            </p>
          </div>
        </Card>
      )}

      {/* ── Upcoming Assignments & Completed History ── */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Assignments ({totalMissions})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('active')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'active'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Upcoming ({upcomingTrips.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('completed')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'completed'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completed Log ({completedTrips.length})
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {driverBookings.length} Total Assignments
          </span>
        </div>

        {/* Assignments Table */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {driverBookings.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
                <Car className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                No assignments found for this chauffeur account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Ref & Date</th>
                      <th className="py-3 px-4">Destination & Purpose</th>
                      <th className="py-3 px-4">Lead Traveler</th>
                      <th className="py-3 px-4">Assigned Vehicle</th>
                      <th className="py-3 px-4">Odometer Log</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(filterMode === 'active'
                      ? upcomingTrips
                      : filterMode === 'completed'
                      ? completedTrips
                      : driverBookings
                    ).map((b) => {
                      const a = b.assignments?.[0];
                      const distance =
                        a?.startOdometer && a?.endOdometer && a.endOdometer >= a.startOdometer
                          ? a.endOdometer - a.startOdometer
                          : null;

                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            <div>#{b.bookingReference}</div>
                            <div className="text-[11px] font-normal text-slate-500">
                              {formatEthiopianDateOnly(b.departureAt)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate max-w-xs">
                              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                              <span>{b.destination}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {b.purpose}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {b.requester?.name || 'Staff'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {b.requester?.department?.name || 'Department'}
                            </div>
                            {b.requester?.phone && (
                              <a
                                href={`tel:${b.requester.phone}`}
                                className="text-[11px] font-mono text-brand-600 dark:text-brand-400 hover:underline"
                              >
                                {b.requester.phone}
                              </a>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {a?.vehicle?.name || '—'}
                            </div>
                            <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {a?.vehicle?.registrationNumber || ''}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            {a?.startOdometer ? (
                              <div className="space-y-0.5">
                                <div>Start: {a.startOdometer.toLocaleString()} km</div>
                                {a?.endOdometer && (
                                  <div>End: {a.endOdometer.toLocaleString()} km</div>
                                )}
                                {distance !== null && (
                                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                    Dist: +{distance.toLocaleString()} km
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not recorded</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge status={b.status} size="sm" />
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenBooking(b)}
                              className="text-xs"
                            >
                              Inspect
                            </Button>

                            {b.status === 'APPROVED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onStartTrip(b)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                              >
                                Start
                              </Button>
                            )}

                            {b.status === 'IN_PROGRESS' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onCompleteTrip(b)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-xs"
                              >
                                Complete
                              </Button>
                            )}
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
    </div>
  );
};
