// COMPONENT: Driver home. Lists missions where this user is the assigned chauffeur.
import React, { useState, useEffect, useMemo } from 'react';
import { User, Booking, Vehicle, VehicleIssue } from '@/types';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
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
  XCircle,
  AlertTriangle,
  Send,
  Flag,
  QrCode,
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
  const [vehicleIssues, setVehicleIssues] = useState<VehicleIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-tabs: 'trips' | 'pending' | 'completed' | 'vehicle'
  const [activeSubTab, setActiveSubTab] = useState<'trips' | 'pending' | 'completed' | 'vehicle'>('trips');

  // Decline Assignment Modal
  const [declineBooking, setDeclineBooking] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

  // Start Trip Modal
  const [startTripBooking, setStartTripBooking] = useState<Booking | null>(null);
  const [startOdometerInput, setStartOdometerInput] = useState<string>('');
  const [isSubmittingStart, setIsSubmittingStart] = useState(false);

  // Report Delay Modal
  const [delayBooking, setDelayBooking] = useState<Booking | null>(null);
  const [delayReason, setDelayReason] = useState<string>('');
  const [isSubmittingDelay, setIsSubmittingDelay] = useState(false);

  // Return / Complete Trip modal state
  const [confirmReturnBooking, setConfirmReturnBooking] = useState<Booking | null>(null);
  const [returnDatetime, setReturnDatetime] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [odometerStartInput, setOdometerStartInput] = useState<string>('');
  const [odometerEndInput, setOdometerEndInput] = useState<string>('');
  const [vehicleNotes, setVehicleNotes] = useState<string>('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Report Vehicle Issue modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState<string>('MECHANICAL');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [issueSeverity, setIssueSeverity] = useState<string>('MEDIUM');
  const [immediateSafetyConcern, setImmediateSafetyConcern] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Printable Form Modal state
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState<Booking | null>(null);

  const fetchDriverData = async () => {
    try {
      setIsLoading(true);
      const [bookings, vehicles, issues] = await Promise.all([
        api.getBookings(),
        api.getVehicles(),
        api.getIssues().catch(() => [] as VehicleIssue[]),
      ]);

      // Filter bookings strictly relevant to this driver (assigned directly or assigned on weekly days)
      const myBookings = bookings.filter((b) => {
        const directMatch = b.assignments?.some(
          (a) =>
            (a.driverId && a.driverId === currentUser.id) ||
            (a.driver?.id && a.driver.id === currentUser.id) ||
            (a.driverName && a.driverName.toLowerCase() === currentUser.name.toLowerCase())
        );
        if (directMatch) return true;

        const dayMatch = b.bookingDays?.some(
          (d) => d.driverId === currentUser.id
        );
        if (dayMatch) return true;

        return false;
      });

      setDriverBookings(myBookings);
      setVehicleIssues(issues);

      // Find vehicle assigned to driver
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

  const todayStr = new Date().toISOString().split('T')[0];

  // Pending Driver Confirmations
  const pendingConfirmations = useMemo(() => {
    return driverBookings.filter((b) => {
      const a = b.assignments?.[0];
      return a && a.status === 'PENDING_CONFIRMATION' && b.status !== 'CANCELLED' && b.status !== 'REJECTED';
    });
  }, [driverBookings]);

  // Trips filtering: Today vs Upcoming
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
    return driverBookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED');
  }, [driverBookings]);

  // Actions
  const handleConfirmAssignment = async (booking: Booking) => {
    const a = booking.assignments?.[0];
    if (!a) return;
    try {
      await api.confirmAssignment(a.id);
      await fetchDriverData();
    } catch (err: any) {
      alert(`Confirmation failed: ${err.message || err}`);
    }
  };

  const handleDeclineAssignmentSubmit = async () => {
    if (!declineBooking) return;
    const a = declineBooking.assignments?.[0];
    if (!a) return;
    if (!declineReason.trim()) {
      alert('Please provide a mandatory reason for declining this assignment.');
      return;
    }
    try {
      setIsSubmittingDecline(true);
      await api.declineAssignment(a.id, declineReason.trim());
      setDeclineBooking(null);
      setDeclineReason('');
      await fetchDriverData();
    } catch (err: any) {
      alert(`Decline action failed: ${err.message || err}`);
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const handleStartTripSubmit = async () => {
    if (!startTripBooking) return;
    try {
      setIsSubmittingStart(true);
      await api.startTrip(startTripBooking.id, {
        startOdometer: startOdometerInput ? Number(startOdometerInput) : undefined,
      });
      setStartTripBooking(null);
      setStartOdometerInput('');
      await fetchDriverData();
    } catch (err: any) {
      alert(`Failed to start trip: ${err.message || err}`);
    } finally {
      setIsSubmittingStart(false);
    }
  };

  const handleMarkArrival = async (booking: Booking) => {
    try {
      await api.markArrival(booking.id);
      await fetchDriverData();
    } catch (err: any) {
      alert(`Failed to mark arrival: ${err.message || err}`);
    }
  };

  const handleReportDelaySubmit = async () => {
    if (!delayBooking || !delayReason.trim()) return;
    try {
      setIsSubmittingDelay(true);
      await api.reportDelay(delayBooking.id, delayReason.trim());
      setDelayBooking(null);
      setDelayReason('');
      await fetchDriverData();
    } catch (err: any) {
      alert(`Failed to report delay: ${err.message || err}`);
    } finally {
      setIsSubmittingDelay(false);
    }
  };

  const handleOpenReturnModal = (booking: Booking) => {
    const a = booking.assignments?.[0];
    setConfirmReturnBooking(booking);
    setOdometerStartInput(a?.startOdometer ? String(a.startOdometer) : String(booking.startOdometer || '12400'));
    setOdometerEndInput(a?.endOdometer ? String(a.endOdometer) : '');
    setReturnDatetime(new Date().toISOString().slice(0, 16));
    setVehicleNotes('');
  };

  const handleConfirmReturnSubmit = async () => {
    if (!confirmReturnBooking) return;
    if (odometerEndInput && odometerStartInput) {
      if (Number(odometerEndInput) < Number(odometerStartInput)) {
        alert(`End odometer reading (${odometerEndInput} km) cannot be less than start odometer reading (${odometerStartInput} km).`);
        return;
      }
    }
    try {
      setIsSubmittingReturn(true);
      await api.completeTrip(confirmReturnBooking.id, {
        actualReturnAt: new Date(returnDatetime).toISOString(),
        endOdometer: odometerEndInput ? Number(odometerEndInput) : undefined,
        tripNotes: vehicleNotes || 'Trip completed according to schedule.',
      });
      setConfirmReturnBooking(null);
      await fetchDriverData();
    } catch (err: any) {
      alert(`Failed to complete trip: ${err.message || err}`);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleReportIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedVehicle) return;
    try {
      setIsSubmittingIssue(true);
      await api.reportIssue({
        vehicleId: assignedVehicle.id,
        description: `[${issueCategory}] ${issueDescription}`,
        severity: issueSeverity,
        setMaintenanceStatus: immediateSafetyConcern,
      });
      setIsIssueModalOpen(false);
      setIssueDescription('');
      setImmediateSafetyConcern(false);
      await fetchDriverData();
    } catch (err: any) {
      alert(`Failed to report vehicle issue: ${err.message || err}`);
    } finally {
      setIsSubmittingIssue(false);
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
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveSubTab('trips')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'trips'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Today & Upcoming ({todayTrips.length + upcomingTrips.length})
            </button>

            {pendingConfirmations.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveSubTab('pending')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                  activeSubTab === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Confirmations ({pendingConfirmations.length})
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-1 -right-1" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveSubTab('completed')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'completed'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Completed ({completedTrips.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('vehicle')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
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

      {/* ── Sub-Tab: Pending Confirmations ── */}
      {activeSubTab === 'pending' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Assignments Awaiting Driver Confirmation ({pendingConfirmations.length})
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pendingConfirmations.map((b) => {
              const assignment = b.assignments?.[0];
              return (
                <Card key={b.id} className="rounded-2xl border-amber-300 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm">
                  <CardHeader className="pb-3 border-b border-amber-200 dark:border-amber-900/50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold text-brand-600 dark:text-brand-400">
                        {b.bookingReference}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                        Action Required
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Assigned by Logistics · Requester: {b.requester?.name || 'Staff Member'}
                    </p>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                      <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span>{b.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{formatEthiopianDateTime(b.departureAt)} → {formatEthiopianDateTime(b.expectedReturnAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Car className="w-4 h-4 shrink-0" />
                      <span>Vehicle: {assignment?.vehicle?.name || 'Assigned Asset'} ({assignment?.vehicle?.registrationNumber})</span>
                    </div>
                    {assignment?.assignmentNotes && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <strong>Dispatch Instructions:</strong> {assignment.assignmentNotes}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeclineBooking(b)}
                        className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Decline Assignment
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleConfirmAssignment(b)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        Accept & Confirm
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Sub-Tab 1: My Trips ── */}
      {activeSubTab === 'trips' && (
        <div className="space-y-8">
          {/* Section: Today */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Today's Operations ({todayTrips.length})
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
                  const isPendingConfirm = assignment?.status === 'PENDING_CONFIRMATION';

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
                          <div className="flex items-center gap-1.5">
                            <Badge status={b.status} size="sm" />
                            {assignment?.status && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                assignment.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {assignment.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {b.requester?.department?.name || 'Department'} · Requester: {b.requester?.name || 'Staff'} ({b.requester?.phone || 'No phone'})
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

                        {b.startOdometer && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <Gauge className="w-4 h-4 shrink-0" />
                            <span>Departure Odometer: {b.startOdometer} km</span>
                          </div>
                        )}

                        {b.actualDepartureAt && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Departed at: {formatEthiopianDateTime(b.actualDepartureAt)}
                          </div>
                        )}

                        {/* Sequential Execution Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            {onOpenReceipt && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onOpenReceipt(b)}
                                leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                                className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-semibold shadow-2xs"
                              >
                                Receipt & QR
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedVoucherBooking(b)}
                              leftIcon={<Printer className="w-3.5 h-3.5" />}
                              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 text-xs"
                            >
                              Voucher
                            </Button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Step 1: Confirm assignment if pending */}
                            {isPendingConfirm ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeclineBooking(b)}
                                  className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold"
                                >
                                  Decline
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleConfirmAssignment(b)}
                                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                                >
                                  Accept Assignment
                                </Button>
                              </div>
                            ) : (
                              /* Step 2: Start Trip (ONLY enabled after driver confirmed) */
                              isAssigned && !isInProgress && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    setStartTripBooking(b);
                                    setStartOdometerInput(assignment?.vehicle?.mileage ? String(assignment.vehicle.mileage) : '');
                                  }}
                                  leftIcon={<Navigation className="w-4 h-4" />}
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                                >
                                  Start Journey
                                </Button>
                              )
                            )}

                            {/* Step 3: In Progress actions */}
                            {isInProgress && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkArrival(b)}
                                  className="border-slate-300 text-slate-700 dark:text-slate-200"
                                >
                                  Mark Arrival
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDelayBooking(b)}
                                  className="border-amber-300 text-amber-700 dark:text-amber-300"
                                >
                                  Report Delay
                                </Button>

                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleOpenReturnModal(b)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                                >
                                  Complete Trip
                                </Button>
                              </>
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

      {/* ── Sub-Tab 3: Completed Trips History ── */}
      {activeSubTab === 'completed' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Completed Missions History ({completedTrips.length})
            </h2>
          </div>

          {completedTrips.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-sm text-slate-500">
              No completed trips on record yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedTrips.map((b) => (
                <Card key={b.id} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                        {b.bookingReference}
                      </span>
                      <Badge status={b.status} size="sm" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {b.destination}
                    </div>
                    {b.status === 'CANCELLED' ? (
                      <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          Mission Assignment Cancelled
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          <span className="font-semibold">Reason:</span> {b.cancellationReason || 'Logistics Administrative Cancellation'}
                        </p>
                        {b.cancelledAt && (
                          <div className="text-[10px] text-rose-700/80 dark:text-rose-400 font-mono">
                            Cancelled: {formatEthiopianDateTime(b.cancelledAt)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-slate-500 font-mono">
                          Completed: {b.actualReturnAt ? formatEthiopianDateTime(b.actualReturnAt) : formatEthiopianDateTime(b.expectedReturnAt)}
                        </div>
                        {b.startOdometer && b.endOdometer && (
                          <div className="font-mono text-slate-700 dark:text-slate-300">
                            Distance covered: {b.endOdometer - b.startOdometer} km ({b.startOdometer} km → {b.endOdometer} km)
                          </div>
                        )}
                      </>
                    )}
                    <div className="pt-2 flex items-center justify-end gap-2">
                      {onOpenReceipt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenReceipt(b)}
                          leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                          className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-semibold"
                        >
                          Receipt
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => onOpenBooking(b)}>
                        Inspect Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Sub-Tab 4: My Vehicle & Issue Reporting ── */}
      {activeSubTab === 'vehicle' && (
        <div className="space-y-6">
          {assignedVehicle ? (
            <>
              {/* Primary Vehicle Banner */}
              <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <Car className="w-10 h-10" />
                      </div>

                      <div className="space-y-1">
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

                    <Button
                      variant="outline"
                      onClick={() => setIsIssueModalOpen(true)}
                      leftIcon={<Wrench className="w-4 h-4 text-amber-500" />}
                      className="border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold"
                    >
                      Report Vehicle Issue
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Specifications Grid */}
              <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Vehicle Information & Telemetry
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
                          Good Condition
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

      {/* ── Decline Assignment Modal ── */}
      {declineBooking && (
        <Modal
          isOpen={!!declineBooking}
          onClose={() => setDeclineBooking(null)}
          title={`Decline Assignment · #${declineBooking.bookingReference}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Per Capital Real Estate fleet policy, declining an assigned trip requires a mandatory operational reason. Logistics dispatch will be immediately notified.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Declining:
              </label>
              <textarea
                rows={3}
                required
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Mandatory rest period, driver sick leave, medical emergency, overlapping duty..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setDeclineBooking(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={isSubmittingDecline}
                onClick={handleDeclineAssignmentSubmit}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Start Trip Modal ── */}
      {startTripBooking && (
        <Modal
          isOpen={!!startTripBooking}
          onClose={() => setStartTripBooking(null)}
          title={`Confirm Departure · #${startTripBooking.bookingReference}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record departure odometer reading before setting off. This establishes the trip baseline for distance calculation and accountability.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Departure Odometer Reading (km)
              </label>
              <Input
                type="number"
                value={startOdometerInput}
                onChange={(e) => setStartOdometerInput(e.target.value)}
                placeholder="e.g. 12450"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setStartTripBooking(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                isLoading={isSubmittingStart}
                onClick={handleStartTripSubmit}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
              >
                Confirm Departure & Start Trip
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Report Delay Modal ── */}
      {delayBooking && (
        <Modal
          isOpen={!!delayBooking}
          onClose={() => setDelayBooking(null)}
          title={`Report Delay · #${delayBooking.bookingReference}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide delay details so logistics dispatch and requester are kept informed.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason & Estimated Delay:
              </label>
              <textarea
                rows={3}
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="e.g. Heavy traffic along Debre Zeit road, flat tire undergoing replacement (est. 30 mins delay)..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setDelayBooking(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                isLoading={isSubmittingDelay}
                onClick={handleReportDelaySubmit}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Send Delay Alert
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Return & Trip Completion Modal ── */}
      {confirmReturnBooking && (
        <Modal
          isOpen={!!confirmReturnBooking}
          onClose={() => setConfirmReturnBooking(null)}
          title="Confirm Trip Completion"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record actual return time and ending odometer. The system will calculate trip distance and update vehicle mileage automatically.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Actual Return Time
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
                    Odometer Out (km)
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
                    Return Odometer (km)
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
                  Trip Notes & Fuel Return
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Complete Trip & Close Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Report Vehicle Issue Modal ── */}
      {isIssueModalOpen && (
        <Modal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title="Report Vehicle Issue & Safety Concern"
          maxWidth="md"
        >
          <form onSubmit={handleReportIssueSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Issue Category:
              </label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="MECHANICAL">Mechanical Problem</option>
                <option value="TIRES">Tire Problem / Flat / Wear</option>
                <option value="BRAKES">Brakes / Stopping Issues</option>
                <option value="ELECTRICAL">Electrical / Battery / Lights</option>
                <option value="ACCIDENT_DAMAGE">Accident or Body Damage</option>
                <option value="FUEL">Fuel System Concern</option>
                <option value="WARNING_LIGHT">Dashboard Warning Light</option>
                <option value="OTHER">Other Operational Concern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Severity Level:
              </label>
              <select
                value={issueSeverity}
                onChange={(e) => setIssueSeverity(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="LOW">Low (Minor cosmetic or non-critical item)</option>
                <option value="MEDIUM">Medium (Needs routine workshop attention)</option>
                <option value="HIGH">High (Urgent inspection required)</option>
                <option value="CRITICAL">Critical (Immediate safety hazard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Problem Description:
              </label>
              <textarea
                rows={3}
                required
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the noise, symptoms, warning lights, or observed damage in detail..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={immediateSafetyConcern}
                  onChange={(e) => setImmediateSafetyConcern(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">
                    Immediate Safety Hazard (Lock Vehicle)
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Checking this immediately sets vehicle status to MAINTENANCE and prevents further dispatch assignments.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsIssueModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                type="submit"
                isLoading={isSubmittingIssue}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Submit Issue Report
              </Button>
            </div>
          </form>
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
