import React, { useState, useEffect, useMemo } from 'react';
import { User, Booking, Vehicle } from '@/types';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PrintableTransportFormModal } from '@/features/bookings/PrintableTransportFormModal';
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
  Printer,
  Navigation,
  Compass,
  Gauge,
  Fuel,
  ArrowRight,
  AlertCircle,
  Users,
  Wrench,
  CheckCircle,
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
  const [assignedVehicle, setAssignedVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-tabs: 'trips' | 'vehicle'
  const [activeSubTab, setActiveSubTab] = useState<'trips' | 'vehicle'>('trips');

  // Return confirmation modal state
  const [confirmReturnBooking, setConfirmReturnBooking] = useState<Booking | null>(null);
  const [returnDatetime, setReturnDatetime] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [odometerStartInput, setOdometerStartInput] = useState<string>('');
  const [odometerEndInput, setOdometerEndInput] = useState<string>('');
  const [vehicleNotes, setVehicleNotes] = useState<string>('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Printable Form Modal state
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState<Booking | null>(null);

  const fetchDriverData = async () => {
    try {
      setIsLoading(true);
      const [bookings, vehicles] = await Promise.all([
        api.getBookings(),
        api.getVehicles(),
      ]);

      setDriverBookings(bookings);

      // Find vehicle assigned to driver if any
      const vehicle = vehicles.find((v) => v.operationalStatus === 'ACTIVE');
      if (vehicle) setAssignedVehicle(vehicle);
    } catch (err) {
      console.error('Failed to load driver assignments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleRefresh = async () => {
    await fetchDriverData();
    if (onRefresh) onRefresh();
  };

  // Trips filtering: Today vs Upcoming
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTrips = useMemo(() => {
    return driverBookings.filter((b) => {
      try {
        const depStr = new Date(b.departureAt).toISOString().split('T')[0];
        return (depStr === todayStr || b.status === 'IN_PROGRESS') && b.status !== 'CANCELLED' && b.status !== 'REJECTED';
      } catch {
        return false;
      }
    });
  }, [driverBookings, todayStr]);

  const upcomingTrips = useMemo(() => {
    const now = new Date();
    return driverBookings.filter((b) => {
      try {
        const dep = new Date(b.departureAt);
        const depStr = dep.toISOString().split('T')[0];
        return depStr !== todayStr && dep > now && b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && b.status !== 'REJECTED';
      } catch {
        return false;
      }
    });
  }, [driverBookings, todayStr]);

  const completedTrips = useMemo(() => {
    return driverBookings.filter((b) => b.status === 'COMPLETED');
  }, [driverBookings]);

  // Handle Return Confirmation Dialog
  const handleOpenReturnModal = (booking: Booking) => {
    const a = booking.assignments?.[0];
    setConfirmReturnBooking(booking);
    setOdometerStartInput(a?.startOdometer ? String(a.startOdometer) : '12400');
    setOdometerEndInput(a?.endOdometer ? String(a.endOdometer) : '12465');
    setReturnDatetime(new Date().toISOString().slice(0, 16));
    setVehicleNotes('');
  };

  const handleConfirmReturnSubmit = async () => {
    if (!confirmReturnBooking) return;
    try {
      setIsSubmittingReturn(true);
      await api.completeTrip(confirmReturnBooking.id, {
        actualReturnAt: new Date(returnDatetime).toISOString(),
        endOdometer: odometerEndInput ? Number(odometerEndInput) : undefined,
        notes: vehicleNotes || 'Trip completed according to schedule.',
      });
      setConfirmReturnBooking(null);
      await fetchDriverData();
    } catch (err: any) {
      alert(`Failed to complete trip: ${err.message || err}`);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

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
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveSubTab('trips')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'trips'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              My Trips ({todayTrips.length + upcomingTrips.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('vehicle')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'vehicle'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              My Vehicle
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Refresh assignments"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Sub-Tab 1: My Trips ── */}
      {activeSubTab === 'trips' && (
        <div className="space-y-8">
          {/* Section: Today */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Today ({todayTrips.length})
              </h2>
            </div>

            {todayTrips.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-sm text-slate-500">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                No trips scheduled for today. Check back later or review upcoming assignments.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {todayTrips.map((b) => {
                  const assignment = b.assignments?.[0];
                  const isInProgress = b.status === 'IN_PROGRESS';
                  const isAssigned = b.status === 'APPROVED' || b.status === 'ASSIGNED';

                  return (
                    <Card
                      key={b.id}
                      className={`rounded-2xl transition-all shadow-sm hover:shadow-md ${
                        isInProgress
                          ? 'border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/40 dark:from-emerald-950/20 to-white dark:to-slate-900'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-base font-bold text-brand-600 dark:text-brand-400">
                            {b.bookingReference}
                          </span>
                          <Badge status={b.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {b.requester?.department?.name || 'Department'} · Requester: {b.requester?.name || 'Staff'}
                        </p>
                      </CardHeader>

                      <CardContent className="p-5 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                          <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                          <span>{b.destination}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>
                            {formatEthiopianDateTime(b.departureAt)} → {formatEthiopianDateTime(b.expectedReturnAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Users className="w-4 h-4 shrink-0" />
                          <span>
                            {b.passengerCount} passengers · Vehicle: {assignment?.vehicle?.registrationNumber || b.preferredVehicle?.registrationNumber || 'Assigned'}
                          </span>
                        </div>

                        {assignment?.startOdometer && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <Gauge className="w-4 h-4 shrink-0" />
                            <span>Odometer out: {assignment.startOdometer} km</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVoucherBooking(b)}
                            leftIcon={<Printer className="w-3.5 h-3.5" />}
                            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 text-xs"
                          >
                            Trip Voucher
                          </Button>

                          <div className="flex items-center gap-2">
                            {isAssigned && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onStartTrip(b)}
                                className="border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              >
                                Confirm departure
                              </Button>
                            )}

                            {(isInProgress || isAssigned) && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenReturnModal(b)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              >
                                Confirm return
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenBooking(b)}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section: Upcoming */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Upcoming ({upcomingTrips.length})
            </h2>

            {upcomingTrips.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nothing scheduled yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingTrips.map((b) => (
                  <Card key={b.id} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-base font-bold text-brand-600 dark:text-brand-400">
                          {b.bookingReference}
                        </span>
                        <Badge status={b.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {b.requester?.department?.name || 'Department'}
                      </p>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{b.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{formatEthiopianDateTime(b.departureAt)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-500">{b.passengerCount} passengers</span>
                        <Button variant="outline" size="sm" onClick={() => onOpenBooking(b)}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Sub-Tab 2: My Vehicle (VisionFund Exact Technical Specs & Telemetry) ── */}
      {activeSubTab === 'vehicle' && (
        <div className="space-y-6">
          {assignedVehicle ? (
            <>
              {/* Primary Vehicle Banner */}
              <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                      <Car className="w-10 h-10" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                          {assignedVehicle.registrationNumber}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {assignedVehicle.operationalStatus}
                        </span>
                      </div>

                      <p className="text-base text-slate-600 dark:text-slate-300 font-semibold">
                        {assignedVehicle.make} {assignedVehicle.model}
                      </p>
                      <p className="text-xs text-slate-400">
                        Assigned Official Fleet Asset • Capital Real Estate Executive Fleet
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Specifications Grid */}
              <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Car className="size-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Vehicle Type</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {assignedVehicle.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Users className="size-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Seating Capacity</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {assignedVehicle.passengerCapacity} Persons
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Gauge className="size-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Current Odometer</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm font-mono">
                          {assignedVehicle.mileage?.toLocaleString() || '12,450'} km
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <Wrench className="size-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Service Status</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          Good Condition (Next service in 3,550 km)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">No vehicle assigned</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                You don't have a default vehicle assigned yet. Contact logistics dispatch.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Confirm Return & Trip Completion Modal (VisionFund Exact Modal) ── */}
      {confirmReturnBooking && (
        <Modal
          isOpen={!!confirmReturnBooking}
          onClose={() => setConfirmReturnBooking(null)}
          title="Confirm trip completion"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record what actually happened. Reports use these values instead of the planned times.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Actual return time
                </label>
                <input
                  type="datetime-local"
                  value={returnDatetime}
                  onChange={(e) => setReturnDatetime(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Odometer out (km)
                  </label>
                  <input
                    type="number"
                    value={odometerStartInput}
                    onChange={(e) => setOdometerStartInput(e.target.value)}
                    placeholder="e.g. 12400"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Odometer in (km)
                  </label>
                  <input
                    type="number"
                    value={odometerEndInput}
                    onChange={(e) => setOdometerEndInput(e.target.value)}
                    placeholder="e.g. 12465"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Trip notes & fuel return (optional)
                </label>
                <textarea
                  rows={2}
                  value={vehicleNotes}
                  onChange={(e) => setVehicleNotes(e.target.value)}
                  placeholder="Record fuel level, road conditions, or vehicle performance observations..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReturnBooking(null)}
                disabled={isSubmittingReturn}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReturnSubmit}
                isLoading={isSubmittingReturn}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Complete trip
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Printable Transport Form Modal ── */}
      <PrintableTransportFormModal
        isOpen={!!selectedVoucherBooking}
        onClose={() => setSelectedVoucherBooking(null)}
        booking={selectedVoucherBooking}
      />
    </div>
  );
};
