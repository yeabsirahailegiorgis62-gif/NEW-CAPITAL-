// COMPONENT: Logistics assignment UI. Loads recommendations then POST /api/bookings/:id/assign.
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { Booking, Vehicle, VehicleRecommendation, DriverRecommendation } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatEthiopianDateTime } from '@/lib/utils';
import {
  Car,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
  Phone,
  FileText,
  Clock,
  Calendar,
  Users,
  MapPin,
  Check,
  Fuel,
  Key,
  Filter,
  Sparkles,
  AlertTriangle,
  Search,
  ArrowRight,
  RefreshCw,
  RotateCw,
  XCircle,
  CalendarRange,
} from 'lucide-react';

interface AssignVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onAssigned: () => void;
}

const DISPATCH_INSTRUCTION_PRESETS = [
  'Pick up vehicle keys and fuel voucher at Gate 1 Dispatch office before departure.',
  'Vehicle pre-inspected and parked in Dispatch Bay 3. Return keys to Key Box B upon return.',
  'Present digital booking QR clearance at security gate upon exiting HQ.',
];

export const AssignVehicleModal: React.FC<AssignVehicleModalProps> = ({
  isOpen,
  onClose,
  booking,
  onAssigned,
}) => {
  const [vehicleRecommendations, setVehicleRecommendations] = useState<VehicleRecommendation[]>([]);
  const [driverRecommendations, setDriverRecommendations] = useState<DriverRecommendation[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [driverMode, setDriverMode] = useState<'company' | 'self'>('company');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Search filters inside modal
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [showUnavailableVehicles, setShowUnavailableVehicles] = useState(false);
  const [showUnavailableDrivers, setShowUnavailableDrivers] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReassignment = Boolean(
    booking && (booking.status === 'ASSIGNED' || (booking.assignments && booking.assignments.length > 0))
  );

  const currentAssignment = booking?.currentAssignment || booking?.assignments?.[0];

  useEffect(() => {
    if (booking && isOpen) {
      setSelectedVehicleId('');
      setSelectedDriverId(null);
      setError(null);
      setSelectedCategory('ALL');
      setVehicleSearchQuery('');
      setDriverSearchQuery('');
      setShowUnavailableVehicles(false);

      if (booking.requiresDriver) {
        setDriverMode('company');
      } else {
        setDriverMode('self');
        setDriverName(booking.requester?.name || 'Self-Driven');
        setDriverPhone(booking.requester?.phone || '');
      }

      setAssignmentNotes('Pick up vehicle keys and fuel voucher at Gate 1 Dispatch office before departure.');

      setIsLoading(true);
      Promise.all([
        api.getVehicleRecommendations(booking.id).catch((err) => {
          console.warn('Failed to load vehicle recommendations:', err);
          return [] as VehicleRecommendation[];
        }),
        api.getDriverRecommendations(booking.id).catch((err) => {
          console.warn('Failed to load driver recommendations:', err);
          return [] as DriverRecommendation[];
        }),
      ])
        .then(async ([initialVRecs, initialDRecs]) => {
          let vRecs = initialVRecs || [];
          let dRecs = initialDRecs || [];

          // Resilient fallback: If recommendations endpoint returns empty, query fleet availability
          if (vRecs.length === 0) {
            try {
              const avail = await api.getFleetAvailability(booking.departureAt, booking.expectedReturnAt);
              if (avail && avail.length > 0) {
                vRecs = avail.map((item) => ({
                  vehicle: item.vehicle,
                  isAvailable: item.isAvailable,
                  isCapacitySuitable: item.vehicle.passengerCapacity >= booking.passengerCount,
                  score: item.isAvailable ? 85 : 0,
                  reasons: item.reason ? [item.reason] : [item.isAvailable ? 'Available for booking schedule' : 'Unavailable'],
                  conflictDetails: item.activeBookingConflict
                    ? {
                        bookingReference: item.activeBookingConflict.bookingReference || 'N/A',
                        destination: item.activeBookingConflict.destination || 'N/A',
                        departureAt: item.activeBookingConflict.departureAt || '',
                        expectedReturnAt: item.activeBookingConflict.expectedReturnAt || '',
                      }
                    : null,
                }));
              }
            } catch (availErr) {
              console.warn('Fallback availability fetch failed:', availErr);
            }
          }

          // Resilient fallback: If driver recommendations return empty, query users for active chauffeurs
          if (dRecs.length === 0) {
            try {
              const users = await api.getUsers();
              const activeDrivers = users.filter((u) => u.role === 'DRIVER' && u.isActive);
              if (activeDrivers && activeDrivers.length > 0) {
                dRecs = activeDrivers.map((d) => ({
                  driver: d,
                  isAvailable: true,
                  hasValidLicense: Boolean(d.licenseNumber && d.licenseNumber.trim()),
                  score: 90,
                  reasons: ['Registered active chauffeur in fleet directory'],
                  conflictDetails: null,
                }));
              }
            } catch (usersErr) {
              console.warn('Fallback users fetch failed:', usersErr);
            }
          }

          setVehicleRecommendations(vRecs);
          setDriverRecommendations(dRecs);

          // If reassigning, default to current vehicle if available, or first available
          if (currentAssignment?.vehicleId) {
            setSelectedVehicleId(currentAssignment.vehicleId);
            if (currentAssignment.driverId) {
              setSelectedDriverId(currentAssignment.driverId);
              setDriverName(currentAssignment.driverName || '');
              setDriverPhone(currentAssignment.driverPhone || '');
            }
          } else {
            // Preselect top available vehicle
            const topAvailVehicle = vRecs.find((r) => r.isAvailable ?? (r as any).isEligible);
            if (topAvailVehicle) {
              setSelectedVehicleId(topAvailVehicle.vehicle.id);
            }

            // Preselect top driver if in company mode
            if (booking.requiresDriver) {
              const topDriver = dRecs.find((d) => d.isAvailable && (d as any).hasValidLicense !== false);
              if (topDriver) {
                setSelectedDriverId(topDriver.driver.id);
                setDriverName(topDriver.driver.name);
                setDriverPhone(topDriver.driver.phone || '');
              }
            }
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [booking, isOpen]);

  const handleDriverModeChange = (mode: 'company' | 'self') => {
    setDriverMode(mode);
    if (mode === 'self') {
      setSelectedDriverId(null);
      setDriverName(booking?.requester?.name || 'Self-Driven (Staff)');
      setDriverPhone(booking?.requester?.phone || '');
    } else {
      const topDriver = driverRecommendations.find((d) => d.isAvailable) || driverRecommendations[0];
      if (topDriver) {
        setSelectedDriverId(topDriver.driver.id);
        setDriverName(topDriver.driver.name);
        setDriverPhone(topDriver.driver.phone || '');
      } else {
        setSelectedDriverId(null);
        setDriverName('');
        setDriverPhone('');
      }
    }
  };

  const handleSelectDriver = (rec: DriverRecommendation) => {
    if (!rec.isAvailable) return;
    setDriverMode('company');
    setSelectedDriverId(rec.driver.id);
    setDriverName(rec.driver.name);
    setDriverPhone(rec.driver.phone || '');
  };

  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!booking) return;

    if (!selectedVehicleId) {
      setError('Please select an eligible vehicle from the fleet to assign.');
      return;
    }

    const chosenRec = vehicleRecommendations.find((item) => item.vehicle.id === selectedVehicleId);
    if (chosenRec && (!chosenRec.isAvailable || (chosenRec as any).isEligible === false)) {
      setError('This vehicle is already assigned to another trip during the selected time. Please select an available vehicle.');
      return;
    }

    if (driverMode === 'company' && !selectedDriverId && !driverName.trim()) {
      setError('Please select an available corporate chauffeur or enter driver details.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.assignVehicle(booking.id, {
        vehicleId: selectedVehicleId,
        driverId: driverMode === 'company' ? selectedDriverId || undefined : undefined,
        driverName: driverName.trim() || undefined,
        driverPhone: driverPhone.trim() || undefined,
        assignmentNotes: assignmentNotes.trim() || undefined,
      });

      onAssigned();
      onClose();
    } catch (err: any) {
      setError(
        err?.message ||
          'Vehicle assignment failed: The selected vehicle or driver has a scheduling conflict or is no longer available.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAutoSelectAndAssign = async () => {
    if (!booking) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await api.autoAssignBooking(booking.id);
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Automatic assignment failed. Please pick vehicle and driver manually below.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter vehicles by category and search term
  const { availableVehicles, unavailableVehicles } = useMemo(() => {
    const avail: VehicleRecommendation[] = [];
    const unavail: VehicleRecommendation[] = [];

    vehicleRecommendations.forEach((item) => {
      const v = item.vehicle;
      if (selectedCategory !== 'ALL' && v.category !== selectedCategory) {
        return;
      }
      if (vehicleSearchQuery.trim()) {
        const q = vehicleSearchQuery.toLowerCase().trim();
        const matches =
          v.name.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.registrationNumber.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q);
        if (!matches) return;
      }

      const isAvail = item.isAvailable ?? (item as any).isEligible ?? true;
      if (isAvail) {
        avail.push(item);
      } else {
        unavail.push(item);
      }
    });

    return { availableVehicles: avail, unavailableVehicles: unavail };
  }, [vehicleRecommendations, selectedCategory, vehicleSearchQuery]);

  // Filter drivers by search term
  const { eligibleDrivers, unavailableDrivers } = useMemo(() => {
    const eligible: DriverRecommendation[] = [];
    const unavailable: DriverRecommendation[] = [];

    driverRecommendations.forEach((dRec) => {
      if (driverSearchQuery.trim()) {
        const q = driverSearchQuery.toLowerCase().trim();
        const matches =
          dRec.driver.name.toLowerCase().includes(q) ||
          dRec.driver.phone?.toLowerCase().includes(q) ||
          dRec.driver.employeeId?.toLowerCase().includes(q) ||
          dRec.driver.licenseNumber?.toLowerCase().includes(q);
        if (!matches) return;
      }

      if (dRec.isAvailable) {
        eligible.push(dRec);
      } else {
        unavailable.push(dRec);
      }
    });

    return { eligibleDrivers: eligible, unavailableDrivers: unavailable };
  }, [driverRecommendations, driverSearchQuery]);

  const selectedVehicleItem = vehicleRecommendations.find((item) => item.vehicle.id === selectedVehicleId);
  const selectedVehicleObj = selectedVehicleItem?.vehicle;
  const selectedDriverObj = driverRecommendations.find((item) => item.driver.id === selectedDriverId);

  const calculateDuration = (start: string, end: string) => {
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

  const tripDuration = booking
    ? calculateDuration(booking.departureAt, booking.expectedReturnAt)
    : 'Standard Trip';

  // Status calculation for pre-confirmation block (Part 1.D)
  const isReadyForAssignment = Boolean(selectedVehicleId && (driverMode === 'self' || selectedDriverId || driverName.trim()));

  if (!booking) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isReassignment
          ? `Reassign Fleet Vehicle & Driver · #${booking.bookingReference}`
          : `Assign Fleet Vehicle & Driver · #${booking.bookingReference}`
      }
      description={`Official Travel Requisition to ${booking.destination} · ${formatEthiopianDateTime(booking.departureAt)} – ${formatEthiopianDateTime(booking.expectedReturnAt)}`}
      maxWidth="4xl"
    >
      <form onSubmit={handleConfirmAssignment} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm rounded-xl flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Assignment Prevented</strong>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Reassignment Notice Banner (Part 1.F) */}
        {isReassignment && currentAssignment && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" /> Currently Assigned Vehicle & Driver:
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                Vehicle: <strong>{currentAssignment.vehicle?.name || 'Assigned Vehicle'}</strong> ({currentAssignment.vehicle?.registrationNumber || 'N/A'})
                {' · '} Chauffeur: <strong>{currentAssignment.driverName || 'Self-Driven'}</strong>
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold shrink-0">
              Safe Reassignment Mode
            </span>
          </div>
        )}

        {/* 1. Request Details Banner (Part 1.C Top) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Employee Requester
              </span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-0.5 truncate">
                {booking.requester?.name || 'Staff Member'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {booking.requester?.department?.name || 'Capital Real Estate'}
                {booking.requester?.employeeId && ` (${booking.requester.employeeId})`}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Destination & Schedule
              </span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-0.5 truncate flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                {booking.destination}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Duration: {tripDuration}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Passenger Requirement
              </span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-0.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {booking.passengerCount} Passenger{booking.passengerCount !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {booking.preferredVehicle ? `Prefers: ${booking.preferredVehicle.name}` : 'No model preference'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Driver Policy
              </span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                {booking.requiresDriver ? 'Chauffeur Required' : 'Self-Driven Permitted'}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Live Conflict Engine Active
              </span>
            </div>
          </div>
        </div>

        {/* 1.5 Auto-Allocate Quick Action Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-brand-50 to-amber-50 dark:from-brand-950/30 dark:to-amber-950/20 border border-brand-200 dark:border-brand-800/60 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              ⚡
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Intelligent Fleet Auto-Allocation
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                1-Click auto-assignment matches the top conflict-free vehicle and qualified chauffeur instantly.
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleQuickAutoSelectAndAssign}
            disabled={isSubmitting}
            leftIcon={isSubmitting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            className="shrink-0 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
          >
            {isSubmitting ? 'Allocating Fleet...' : '⚡ 1-Click Auto Assign & Confirm'}
          </Button>
        </div>

        {/* 2. Selection Layout (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Vehicle Selection (Part 1.C: 1. SELECT AVAILABLE VEHICLE) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  1. Select Available Vehicle
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Only vehicles eligible and free of conflicts for the requested timeframe
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 text-xs">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-[11px] py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SEDAN">Sedans</option>
                  <option value="SUV">SUVs</option>
                  <option value="PICKUP">Pickups</option>
                  <option value="MINIBUS">Minibuses</option>
                </select>
              </div>
            </div>

            {/* Vehicle Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vehicles by plate number, make, model..."
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Vehicles List */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Car className="w-8 h-8 mx-auto animate-bounce text-brand-500" />
                <p>Verifying vehicle operational statuses and reservation schedules...</p>
              </div>
            ) : availableVehicles.length === 0 && unavailableVehicles.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500">
                No vehicles found matching search.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {/* Available Vehicles Section */}
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <span>Available Eligible Vehicles ({availableVehicles.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ready for dispatch</span>
                </div>

                {availableVehicles.length === 0 ? (
                  <div className="p-4 text-center bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                    No vehicles are currently available for the selected date and time. Please choose another time or check again later.
                  </div>
                ) : (
                  availableVehicles.map((item) => {
                    const v = item.vehicle;
                    const isSelected = selectedVehicleId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-brand-600 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/25 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="vehicleChoice"
                            checked={isSelected}
                            onChange={() => setSelectedVehicleId(v.id)}
                            className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer mt-1"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {v.name}
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  {v.registrationNumber}
                                </span>
                              </div>

                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                Available ({item.score}% Match)
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{v.make} {v.model}</span>
                              <span>•</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                Capacity: {v.passengerCapacity} Passengers
                              </span>
                              <span>•</span>
                              <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                {v.category}
                              </span>
                            </div>

                            {item.reasons.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.reasons.slice(0, 2).map((r, i) => (
                                  <span key={i} className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                                    ✓ {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Unavailable Vehicles Collapsible Section */}
                {unavailableVehicles.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUnavailableVehicles(!showUnavailableVehicles)}
                      className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold flex items-center gap-1.5 w-full py-1.5"
                    >
                      <span>Unavailable Vehicles ({unavailableVehicles.length})</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({showUnavailableVehicles ? 'click to hide' : 'click to inspect conflicts'})
                      </span>
                    </button>

                    {showUnavailableVehicles && (
                      <div className="space-y-2 mt-1.5 opacity-70">
                        {unavailableVehicles.map((item) => {
                          const v = item.vehicle;
                          return (
                            <div
                              key={v.id}
                              onClick={() => {
                                setError('This vehicle is already assigned to another trip during the selected time. Please select an available vehicle.');
                              }}
                              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 text-xs cursor-not-allowed transition-all hover:border-red-300 dark:hover:border-red-800"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {v.name}
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-500">
                                      {v.registrationNumber}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500">
                                    Capacity: {v.passengerCapacity} Passengers
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 shrink-0">
                                  Unavailable
                                </span>
                              </div>
                              {item.reasons.length > 0 && (
                                <div className="mt-1 text-[11px] text-red-700 dark:text-red-400">
                                  {item.reasons.join(' • ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Driver Selection (Part 1.C: 2. SELECT AVAILABLE DRIVER) */}
          <div className="lg:col-span-5 space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="pb-1 border-b border-slate-200 dark:border-slate-700/80">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  2. Select Available Driver
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assign qualified driver eligible for requested schedule
                </p>
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Driver Assignment Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDriverModeChange('company')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                      driverMode === 'company'
                        ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Corporate Chauffeur
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDriverModeChange('self')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                      driverMode === 'self'
                        ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Self-Driven
                  </button>
                </div>
              </div>

              {/* Driver Search & List if Corporate */}
              {driverMode === 'company' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search drivers by name or ID..."
                      value={driverSearchQuery}
                      onChange={(e) => setDriverSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                    {eligibleDrivers.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        No corporate drivers eligible. You can enter details manually below.
                      </p>
                    ) : (
                      eligibleDrivers.map((dRec) => {
                        const isSelected = selectedDriverId === dRec.driver.id;
                        return (
                          <button
                            key={dRec.driver.id}
                            type="button"
                            onClick={() => handleSelectDriver(dRec)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/50 ring-2 ring-brand-500/20 font-semibold text-brand-700 dark:text-brand-300'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {dRec.driver.avatarUrl ? (
                                <img
                                  src={dRec.driver.avatarUrl}
                                  alt={dRec.driver.name}
                                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                  {dRec.driver.name.charAt(0)}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                                    {dRec.driver.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md shrink-0">
                                    Available
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span>{dRec.driver.phone || 'No phone'}</span>
                                  {dRec.driver.licenseNumber ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-medium">
                                      • Lic: {dRec.driver.licenseNumber}
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 italic">
                                      • No License
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}

                    {/* Toggle Unavailable Drivers */}
                    {unavailableDrivers.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowUnavailableDrivers(!showUnavailableDrivers)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                        >
                          <span>{showUnavailableDrivers ? 'Hide' : 'Show'} Unavailable Drivers ({unavailableDrivers.length})</span>
                        </button>

                        {showUnavailableDrivers && (
                          <div className="flex flex-col gap-1.5 mt-1.5">
                            {unavailableDrivers.map((dRec) => (
                              <div
                                key={dRec.driver.id}
                                className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {dRec.driver.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md">
                                    Unavailable
                                  </span>
                                </div>
                                <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                                  {dRec.reasons.join(' • ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Driver Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Input
                  id="driverName"
                  label="Driver Full Name"
                  placeholder="e.g. Abebe Molla"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  id="driverPhone"
                  label="Contact Phone"
                  placeholder="e.g. +251 91 123 4567"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Handover Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Dispatch Instructions:
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {DISPATCH_INSTRUCTION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAssignmentNotes(preset)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-500"
                    >
                      {idx === 0 ? 'Gate 1 Keys' : idx === 1 ? 'Bay 3' : 'Security QR'}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Collect vehicle keys and fuel voucher at Gate 1 Dispatch office before departure."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SHOW AVAILABILITY BEFORE CONFIRMATION (Part 1.D) */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Assignment Pre-Confirmation Summary
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">STATUS:</span>
              {isReadyForAssignment ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ready for Assignment
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Incomplete Selection
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">EMPLOYEE:</span>
              <strong className="text-slate-900 dark:text-white block mt-0.5 truncate">
                {booking.requester?.name || 'Staff Member'}
              </strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DESTINATION:</span>
              <strong className="text-slate-900 dark:text-white block mt-0.5 truncate">
                {booking.destination}
              </strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TRAVEL DATE:</span>
              <strong className="text-slate-900 dark:text-white block mt-0.5 truncate">
                {new Date(booking.departureAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DEPARTURE / RETURN:</span>
              <strong className="text-slate-900 dark:text-white block mt-0.5 truncate">
                {new Date(booking.departureAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – {new Date(booking.expectedReturnAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SELECTED VEHICLE:</span>
              {selectedVehicleObj ? (
                <span className="font-bold text-brand-600 dark:text-brand-400 block mt-0.5">
                  {selectedVehicleObj.name} · {selectedVehicleObj.registrationNumber} ({selectedVehicleObj.passengerCapacity} Seats)
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 italic block mt-0.5 font-medium">
                  None selected
                </span>
              )}
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SELECTED CHAUFFEUR:</span>
              {selectedDriverObj ? (
                <div className="flex items-center gap-2 mt-1">
                  {selectedDriverObj.driver.avatarUrl ? (
                    <img
                      src={selectedDriverObj.driver.avatarUrl}
                      alt={selectedDriverObj.driver.name}
                      className="w-6 h-6 rounded-lg object-cover ring-1 ring-brand-500 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {selectedDriverObj.driver.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-bold text-brand-600 dark:text-brand-400 truncate">
                    {selectedDriverObj.driver.name}
                    {selectedDriverObj.driver.phone ? ` · ${selectedDriverObj.driver.phone}` : ''}
                    {selectedDriverObj.driver.licenseNumber ? ` (Lic: ${selectedDriverObj.driver.licenseNumber})` : ''}
                  </span>
                </div>
              ) : (
                <span className="font-bold text-brand-600 dark:text-brand-400 block mt-0.5">
                  {driverName.trim() || (driverMode === 'self' ? 'Self-Driven (Staff Member)' : 'None selected')}
                  {driverPhone ? ` · ${driverPhone}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. Action Buttons (Sticky anchored bottom bar with clear visual cues) */}
        <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-3.5 pb-2 border-t border-slate-200 dark:border-slate-800 -mx-6 px-6 -mb-6 rounded-b-2xl shadow-[0_-8px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_20px_rgba(0,0,0,0.35)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-center sm:text-left">
            {!selectedVehicleId ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Select a vehicle from the fleet list to confirm
              </span>
            ) : driverMode === 'company' && !selectedDriverId && !driverName.trim() ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Select a chauffeur or switch to Self-Driven mode
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Ready to assign · Real-time schedule verified
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              type="button"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-11 px-5 w-full sm:w-auto font-semibold border-slate-300 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              size="md"
              isLoading={isSubmitting}
              disabled={!isReadyForAssignment}
              leftIcon={<Car className="w-4 h-4" />}
              className="h-11 px-6 w-full sm:w-auto font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 text-sm"
            >
              {isReassignment ? 'Confirm Reassignment' : 'Confirm Assignment'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
