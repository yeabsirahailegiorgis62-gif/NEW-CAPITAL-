import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface AssignVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onAssigned: () => void;
}

const DISPATCH_INSTRUCTION_PRESETS = [
  'Pick up vehicle keys and fuel voucher at Gate 1 Dispatch office before departure.',
  'Vehicle pre-inspected and parked in Dispatch Bay 3. Return keys to Key Box B.',
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
  const [showAllCapacities, setShowAllCapacities] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (booking && isOpen) {
      setSelectedVehicleId('');
      setSelectedDriverId(null);
      setError(null);
      setSelectedCategory('ALL');
      setShowAllCapacities(false);

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
        .then(([vRecs, dRecs]) => {
          setVehicleRecommendations(vRecs);
          setDriverRecommendations(dRecs);

          // Preselect top available vehicle
          const topAvailVehicle = vRecs.find((r) => r.isAvailable);
          if (topAvailVehicle) {
            setSelectedVehicleId(topAvailVehicle.vehicle.id);
          }

          // Preselect top driver if in company mode
          if (booking.requiresDriver) {
            const topDriver = dRecs.find((d) => d.isAvailable && d.hasValidLicense);
            if (topDriver) {
              setSelectedDriverId(topDriver.driver.id);
              setDriverName(topDriver.driver.name);
              setDriverPhone(topDriver.driver.phone || '');
            }
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [booking, isOpen]);

  if (!booking) return null;

  const handleDriverModeChange = (mode: 'company' | 'self') => {
    setDriverMode(mode);
    if (mode === 'self') {
      setSelectedDriverId(null);
      setDriverName(booking.requester?.name || 'Self-Driven');
      setDriverPhone(booking.requester?.phone || '');
    } else {
      const topDriver = driverRecommendations.find((d) => d.isAvailable && d.hasValidLicense) || driverRecommendations[0];
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

    if (!selectedVehicleId) {
      setError('Please select an available vehicle from the fleet to assign.');
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
      setError(err?.message || 'Vehicle assignment failed: The selected vehicle or driver may have a scheduling conflict or is no longer available.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter recommendations according to category and capacity toggle
  const filteredVehicles = vehicleRecommendations.filter((item) => {
    const v = item.vehicle;
    if (selectedCategory !== 'ALL' && v.category !== selectedCategory) {
      return false;
    }
    if (!showAllCapacities && v.passengerCapacity < booking.passengerCount) {
      return false;
    }
    return true;
  });

  const selectedVehicleObj = vehicleRecommendations.find((item) => item.vehicle.id === selectedVehicleId)?.vehicle;

  const calculateDuration = (start: string, end: string) => {
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const diff = e - s;
      if (isNaN(diff) || diff <= 0) return 'Flexible';
      const hours = Math.round(diff / (1000 * 60 * 60));
      if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'}`;
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return remHours > 0 ? `${days}d ${remHours}h` : `${days} day${days === 1 ? '' : 's'}`;
    } catch {
      return 'Standard Trip';
    }
  };

  const tripDuration = calculateDuration(booking.departureAt, booking.expectedReturnAt);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Intelligent Vehicle & Driver Assignment · #${booking.bookingReference}`}
      description={`Official Mission to ${booking.destination} · ${formatEthiopianDateTime(booking.departureAt)} – ${formatEthiopianDateTime(booking.expectedReturnAt)}`}
      maxWidth="4xl"
    >
      <form onSubmit={handleConfirmAssignment} className="space-y-6">
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Assignment Prevented</strong>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* 1. Executive Requisition Summary Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Requester
              </span>
              <span className="font-semibold text-slate-900 dark:text-white block mt-0.5 truncate">
                {booking.requester?.name || 'Staff Member'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {booking.requester?.department?.name || 'Capital Real Estate'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Destination
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
                Required Capacity
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
                {booking.requiresDriver ? 'Company Chauffeur Required' : 'Self-Driven Permitted'}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Live Conflict Checked
              </span>
            </div>
          </div>
        </div>

        {/* 2. Interactive Selection Layout (Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Vehicle Recommendations (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Recommended Fleet Vehicles
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scored by capacity fit, availability, maintenance & preferences
                </p>
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAllCapacities(!showAllCapacities)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    showAllCapacities
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {showAllCapacities ? 'All Capacities' : `Min ${booking.passengerCount} Seats`}
                </button>
              </div>
            </div>

            {/* Vehicle Recommendations List */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Car className="w-8 h-8 mx-auto animate-bounce text-brand-500" />
                <p>Computing intelligent suitability scores and schedule availability...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="p-6 text-center bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs rounded-xl space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-amber-600 dark:text-amber-400" />
                <p className="font-semibold">No vehicles found matching current filter</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Try clicking <strong>"All Capacities"</strong> above or select <strong>"All Models"</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {filteredVehicles.map((item) => {
                  const v = item.vehicle;
                  const isAvail = item.isAvailable;
                  const isSelected = selectedVehicleId === v.id;

                  const fallbackImg =
                    v.category === 'SUV'
                      ? '/vehicles/prado.png'
                      : v.category === 'PICKUP'
                      ? (v.name + ' ' + (v.model || '')).toLowerCase().includes('ranger')
                        ? '/vehicles/ranger.png'
                        : (v.name + ' ' + (v.model || '')).toLowerCase().includes('d-max') ||
                          (v.name + ' ' + (v.model || '')).toLowerCase().includes('dmax')
                        ? '/vehicles/dmax.png'
                        : '/vehicles/hilux.png'
                      : v.category === 'MINIBUS'
                      ? '/vehicles/hiace.png'
                      : '/vehicles/corolla.png';

                  return (
                    <div
                      key={v.id}
                      onClick={() => isAvail && setSelectedVehicleId(v.id)}
                      className={`p-3.5 rounded-2xl border text-xs transition-all relative ${
                        !isAvail
                          ? 'opacity-65 bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 cursor-not-allowed'
                          : isSelected
                          ? 'border-brand-600 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/25 shadow-xs cursor-pointer'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="pt-1">
                          <input
                            type="radio"
                            name="vehicleChoice"
                            checked={isSelected}
                            disabled={!isAvail}
                            onChange={() => setSelectedVehicleId(v.id)}
                            className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                        </div>

                        <div className="w-20 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                          <img
                            src={v.imageUrl || fallbackImg}
                            alt={v.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

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

                            <div className="flex items-center gap-1.5">
                              {isAvail ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.score >= 80
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                }`}>
                                  {item.score}% Match
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                                  Unavailable
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{v.make} {v.model}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {v.passengerCapacity} Passenger Seats
                            </span>
                            <span>•</span>
                            <span className="uppercase text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                              {v.category}
                            </span>
                          </div>

                          {/* Recommendation explanation reasons */}
                          <div className="mt-2 space-y-1">
                            {item.reasons.map((reason, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>

                          {/* Conflict / Reason Explanation */}
                          {item.conflictDetails && (
                            <div className="mt-2 text-[11px] text-red-700 dark:text-red-300 font-medium bg-red-50/90 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900/50">
                              <span className="font-bold">Active Trip Conflict:</span> Assigned to #{item.conflictDetails.bookingReference} ({item.conflictDetails.destination}) from {formatEthiopianDateTime(item.conflictDetails.departureAt)} to {formatEthiopianDateTime(item.conflictDetails.expectedReturnAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Driver & Dispatch Coordination (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-200 dark:border-slate-700/80">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Driver & Dispatch Coordination
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assign qualified driver and dispatch instructions
                </p>
              </div>

              {/* Driver Mode Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Driver Assignment Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDriverModeChange('company')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      driverMode === 'company'
                        ? 'border-brand-600 bg-brand-500 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    Corporate Driver
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDriverModeChange('self')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      driverMode === 'self'
                        ? 'border-brand-600 bg-brand-500 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    Self-Driven
                  </button>
                </div>
              </div>

              {/* Real Corporate Drivers Recommendations List */}
              {driverMode === 'company' && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Available Verified Drivers (Live Status):
                  </span>
                  {driverRecommendations.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      No corporate drivers currently registered in staff roster. Enter driver details manually below.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {driverRecommendations.map((dRec) => {
                        const isSelected = selectedDriverId === dRec.driver.id;
                        const isAvail = dRec.isAvailable;
                        return (
                          <button
                            key={dRec.driver.id}
                            type="button"
                            disabled={!isAvail}
                            onClick={() => handleSelectDriver(dRec)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                              isSelected
                                ? 'border-brand-500 bg-white dark:bg-slate-800 ring-2 ring-brand-500/20 font-semibold text-brand-700 dark:text-brand-300'
                                : !isAvail
                                ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500'
                                : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {dRec.driver.name}
                              </span>
                              {isAvail ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                                  Available
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-md">
                                  Schedule Conflict
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{dRec.driver.phone || 'No phone'}</span>
                              {dRec.driver.licenseNumber && <span>• Lic: {dRec.driver.licenseNumber}</span>}
                            </div>
                            {dRec.conflictDetails && (
                              <div className="mt-1 text-[10px] text-red-600 font-medium">
                                Conflict: #{dRec.conflictDetails.bookingReference} ({dRec.conflictDetails.destination})
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Driver Contact Inputs */}
              <div className="space-y-3 pt-1">
                <Input
                  id="driverName"
                  label="Assigned Driver Full Name"
                  placeholder="e.g. Abebe Molla or Self-Driven"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  disabled={isSubmitting}
                />

                <Input
                  id="driverPhone"
                  label="Driver Contact Phone"
                  placeholder="e.g. +251 91 123 4567"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Handover Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Handover & Dispatch Instructions:
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {DISPATCH_INSTRUCTION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAssignmentNotes(preset)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-500"
                    >
                      {idx === 0 ? 'Gate 1 Keys' : idx === 1 ? 'Bay 3 Ready' : 'Security QR'}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="e.g. Collect vehicle keys and fuel voucher at Gate 1 Dispatch office before departure."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Selected Vehicle Indicator Card */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Selected for Assignment
              </span>
              {selectedVehicleObj ? (
                <div className="flex items-center gap-2.5 mt-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {selectedVehicleObj.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {selectedVehicleObj.registrationNumber} · {selectedVehicleObj.passengerCapacity} Seats
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 mt-1 block font-medium">
                  Please select an available vehicle on the left.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Modal Actions Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Assigning will notify the employee and driver, and lock the vehicle on the fleet calendar.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              isLoading={isSubmitting}
              disabled={!selectedVehicleId}
              leftIcon={<Car className="w-4 h-4" />}
              className="w-full sm:w-auto font-bold px-5 shadow-sm"
            >
              Confirm Vehicle Assignment
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
