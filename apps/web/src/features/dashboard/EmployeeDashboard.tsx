import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Booking, User, Vehicle } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime } from '@/lib/utils';
import {
  PlusCircle,
  Clock,
  Car,
  CheckCircle2,
  Calendar,
  MapPin,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Compass,
  Sparkles,
  QrCode,
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: User;
  onNewBookingClick: () => void;
  onOpenBooking: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  onNewBookingClick,
  onOpenBooking,
  onOpenReceipt,
  onNavigateTab,
}) => {
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [bookingsData, vehiclesData] = await Promise.all([
          api.getBookings(),
          api.getVehicles(),
        ]);
        setMyBookings(bookingsData);
        setVehicles(vehiclesData);
      } catch (err) {
        console.error('Failed to load employee dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const pendingBookings = myBookings.filter((b) => b.status === 'PENDING_APPROVAL');
  const activeBookings = myBookings.filter((b) => b.status === 'IN_PROGRESS');
  const upcomingBookings = myBookings.filter((b) => b.status === 'ASSIGNED' || b.status === 'APPROVED');
  const completedBookings = myBookings.filter((b) => b.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Welcome & Executive Travel HUD */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide uppercase border border-brand-400/30 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Official Traveler Portal • {currentUser.department?.name || 'Capital Real Estate'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {currentUser.name}
          </h2>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Submit a vehicle booking request for project sites, client meetings, or administrative travel across Addis Ababa.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 z-10 w-full sm:w-auto">
          <Button
            size="lg"
            variant="primary"
            onClick={onNewBookingClick}
            className="shadow-lg shadow-brand-500/25 whitespace-nowrap"
            leftIcon={<PlusCircle className="w-5 h-5" />}
          >
            Book a Company Vehicle
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigateTab('availability')}
            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700 whitespace-nowrap"
            leftIcon={<Compass className="w-5 h-5 text-emerald-400" />}
          >
            Check Fleet Availability
          </Button>
        </div>
      </div>

      {/* Trips Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-800 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Pending Review
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {pendingBookings.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Awaiting logistics officer
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/80 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Upcoming Trips */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
              Upcoming Trips
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {upcomingBookings.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Approved or vehicle assigned
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/80 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Active Trips */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              On the Road
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {activeBookings.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Active mission in progress
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Trips */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Past Missions
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {completedBookings.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Returned & logged
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Trip Banner if currently on a trip */}
      {activeBookings.length > 0 && (
        <Card className="border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/80 dark:from-emerald-950/30 to-white dark:to-slate-900 shadow-md">
          <CardHeader className="border-emerald-200/60 dark:border-emerald-800/60 pb-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Active Dispatch In Progress
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => onOpenBooking(b)}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      {b.bookingReference}
                    </span>
                    <Badge status="IN_PROGRESS" size="sm" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mt-1 text-base">{b.destination}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Vehicle: <strong className="text-slate-900 dark:text-slate-100">{b.assignments?.[0]?.vehicle?.name}</strong> ({b.assignments?.[0]?.vehicle?.registrationNumber}) · Driver: {b.assignments?.[0]?.driverName || 'Authorized Staff'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenReceipt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReceipt(b);
                      }}
                      leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600" />}
                      className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      Receipt
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onOpenBooking(b)}>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Split: My Upcoming/Pending Requests vs Fleet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming & Pending Requests */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  My Current Requests & Bookings
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateTab('my-bookings')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View All History
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {myBookings.length === 0 ? (
                <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                  <Car className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  You haven't requested any vehicles yet.
                  <div className="mt-4">
                    <Button variant="primary" size="sm" onClick={onNewBookingClick}>
                      Create Your First Booking
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...pendingBookings, ...upcomingBookings].slice(0, 5).map((b) => (
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
                          <Badge status={b.status} size="sm" />
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {b.destination}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Dep: {formatEthiopianDateTime(b.departureAt)} · Passengers: {b.passengerCount}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onOpenReceipt &&
                          (b.status === 'APPROVED' ||
                            b.status === 'ASSIGNED' ||
                            b.status === 'IN_PROGRESS' ||
                            b.status === 'COMPLETED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenReceipt(b);
                              }}
                              leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600" />}
                              className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            >
                              Receipt
                            </Button>
                          )}
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Small Fleet Availability Summary */}
        <div className="space-y-6">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm text-slate-900 dark:text-white">Available Fleet Today</CardTitle>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {vehicles.filter((v) => v.operationalStatus === 'ACTIVE').length} Ready
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {vehicles.slice(0, 4).map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">{v.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{v.category} · {v.passengerCapacity} seats</span>
                  </div>
                  <Badge status={v.operationalStatus} size="sm" />
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => onNavigateTab('availability')}
              >
                Open Fleet Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
