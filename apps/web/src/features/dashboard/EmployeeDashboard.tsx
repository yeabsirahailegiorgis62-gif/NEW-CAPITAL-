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
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: User;
  onNewBookingClick: () => void;
  onOpenBooking: (booking: Booking) => void;
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  onNewBookingClick,
  onOpenBooking,
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
  const pastBookings = myBookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED');

  return (
    <div className="space-y-6">
      {/* Welcome & Primary Action Card */}
      <div className="bg-gradient-to-r from-navy-900 via-brand-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-brand-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide uppercase border border-brand-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Official Travel Portal • Capital Real Estate
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Ready to plan your next site visit?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl">
            Submit a vehicle booking request for project sites, client meetings, or administrative travel across Addis Ababa.
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={onNewBookingClick}
          className="bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/30 shrink-0 z-10"
          leftIcon={<PlusCircle className="w-5 h-5" />}
        >
          Book a Company Vehicle
        </Button>
      </div>

      {/* Trips Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pending Requests
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingBookings.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/80">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Upcoming Trips
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{upcomingBookings.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/80">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Active Trips
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeBookings.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Trip Banner if currently on a trip */}
      {activeBookings.length > 0 && (
        <Card className="border-emerald-300 bg-emerald-50/40">
          <CardHeader className="border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
              You have an active trip currently in progress
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => onOpenBooking(b)}
                className="bg-white p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-subtle transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700">{b.bookingReference}</span>
                    <Badge status="IN_PROGRESS" size="sm" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mt-1">{b.destination}</h4>
                  <p className="text-xs text-slate-500">
                    Vehicle: {b.assignments?.[0]?.vehicle?.name} ({b.assignments?.[0]?.vehicle?.registrationNumber}) · Driver: {b.assignments?.[0]?.driverName || 'Self-driven'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onOpenBooking(b)}>
                  View Trip Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Split: My Upcoming/Pending Requests vs Fleet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming & Pending Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>My Current Requests & Bookings</CardTitle>
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
                <div className="p-8 text-center text-slate-400 text-sm">
                  <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  You haven't requested any vehicles yet.
                  <div className="mt-3">
                    <Button variant="primary" size="sm" onClick={onNewBookingClick}>
                      Create Your First Booking
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {[...pendingBookings, ...upcomingBookings].slice(0, 5).map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onOpenBooking(b)}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-brand-700">
                            {b.bookingReference}
                          </span>
                          <Badge status={b.status} size="sm" />
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {b.destination}
                        </div>
                        <div className="text-xs text-slate-500">
                          Dep: {formatEthiopianDateTime(b.departureAt)} · Passengers: {b.passengerCount}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Small Fleet Availability Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm">Available Fleet Today</CardTitle>
                <span className="text-xs font-semibold text-emerald-600">
                  {vehicles.filter((v) => v.operationalStatus === 'ACTIVE').length} Ready
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {vehicles.slice(0, 4).map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-slate-800 block">{v.name}</span>
                    <span className="text-slate-400">{v.category} · {v.passengerCapacity} seats</span>
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
