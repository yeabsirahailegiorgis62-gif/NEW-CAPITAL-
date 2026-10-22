import React, { useState, useEffect } from 'react';
import { Booking, BookingDay, User } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
import {
  AlertTriangle,
  Calendar,
  Car,
  MapPin,
  User as UserIcon,
  Clock,
  ShieldAlert,
  XCircle,
  CalendarDays,
  FileText,
} from 'lucide-react';

export interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirmCancel: (
    bookingId: string,
    data: { reason: string; notes?: string; bookingDayId?: string }
  ) => Promise<void>;
}

export const CANCELLATION_REASONS = [
  'Employee Unavailable',
  'Employee Reported an Accident',
  'Employee Cancelled the Request',
  'Trip No Longer Required',
  'Vehicle Unavailable',
  'Driver Unavailable',
  'Scheduling Conflict',
  'Other',
] as const;

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirmCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customExplanation, setCustomExplanation] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [scope, setScope] = useState<'ENTIRE' | 'SINGLE_DAY'>('ENTIRE');
  const [selectedBookingDayId, setSelectedBookingDayId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal opens or booking changes
  useEffect(() => {
    if (isOpen && booking) {
      setSelectedReason(CANCELLATION_REASONS[0]);
      setCustomExplanation('');
      setAdminNotes('');
      setScope('ENTIRE');
      setValidationError(null);
      setIsSubmitting(false);

      // Pre-select first eligible active day if weekly booking has active days
      const activeDays = (booking.bookingDays || []).filter(
        (d) => d.status !== 'CANCELLED' && d.status !== 'COMPLETED'
      );
      if (activeDays.length > 0) {
        setSelectedBookingDayId(activeDays[0].id);
      } else {
        setSelectedBookingDayId('');
      }
    }
  }, [isOpen, booking]);

  if (!booking) return null;

  const activeAssignment =
    booking.assignments?.find((a) => !a.unassignedAt) || booking.assignments?.[0];

  const assignedVehicle = activeAssignment?.vehicle;
  const assignedDriverName =
    activeAssignment?.driverName ||
    activeAssignment?.driver?.name ||
    (booking.requiresDriver ? 'Awaiting Driver Allocation' : 'Self-Driven (No Driver Required)');

  const isWeekly =
    booking.requestType === 'WEEKLY' || (booking.bookingDays && booking.bookingDays.length > 1);

  const eligibleBookingDays = (booking.bookingDays || []).filter(
    (d) => d.status !== 'CANCELLED' && d.status !== 'COMPLETED'
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return; // Prevent accidental duplicate submissions

    setValidationError(null);

    // Validate reason
    if (!selectedReason) {
      setValidationError('Please select a cancellation reason.');
      return;
    }

    if (selectedReason === 'Other' && !customExplanation.trim()) {
      setValidationError('Please provide an explanation for "Other".');
      return;
    }

    // Validate single day selection if scope is SINGLE_DAY
    if (scope === 'SINGLE_DAY' && isWeekly) {
      if (!selectedBookingDayId) {
        setValidationError('Please select which scheduled day to cancel.');
        return;
      }
    }

    const finalReason =
      selectedReason === 'Other'
        ? `Other: ${customExplanation.trim()}`
        : selectedReason;

    try {
      setIsSubmitting(true);
      await onConfirmCancel(booking.id, {
        reason: finalReason,
        notes: adminNotes.trim() ? adminNotes.trim() : undefined,
        bookingDayId: scope === 'SINGLE_DAY' && isWeekly ? selectedBookingDayId : undefined,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={`Cancel Booking #${booking.bookingReference}`}
      description="Review booking details and provide a cancellation reason to release resources."
      maxWidth="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[44px] px-5 font-semibold text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Keep Booking
          </Button>

          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => handleSubmit()}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={<XCircle className="w-4 h-4" />}
            className="min-h-[44px] px-6 font-bold text-white shadow-md bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus:ring-4 focus:ring-rose-500/20"
          >
            {isSubmitting ? 'Cancelling Booking...' : 'Cancel Booking'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Callout */}
        {validationError && (
          <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{validationError}</p>
          </div>
        )}

        {/* Existing Booking Summary Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                {booking.bookingReference}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/70 px-2 py-0.5 rounded">
                {booking.requestType || 'DAILY'} TRIP
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                {booking.requester?.name || 'Staff Member'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {booking.requester?.department?.name || 'Capital Real Estate'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Destination
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {booking.destination}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Departure Schedule
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatEthiopianDateTime(booking.departureAt)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Car className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Assigned Vehicle
                </span>
                {assignedVehicle ? (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {assignedVehicle.name} ·{' '}
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {assignedVehicle.registrationNumber}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Unallocated</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <UserIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Assigned Driver
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {assignedDriverName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Program Scope Selector (if weekly request) */}
        {isWeekly && eligibleBookingDays.length > 0 && (
          <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2.5">
            <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Weekly Program Cancellation Scope:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  scope === 'ENTIRE'
                    ? 'border-indigo-500 bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="cancellationScope"
                  checked={scope === 'ENTIRE'}
                  onChange={() => setScope('ENTIRE')}
                  className="mt-0.5 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="font-bold block">Cancel Entire Weekly Booking</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Cancels all remaining scheduled trips ({eligibleBookingDays.length} active dates)
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  scope === 'SINGLE_DAY'
                    ? 'border-indigo-500 bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="cancellationScope"
                  checked={scope === 'SINGLE_DAY'}
                  onChange={() => setScope('SINGLE_DAY')}
                  className="mt-0.5 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="font-bold block">Cancel Only a Selected Date</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Keeps other days active and releases resources only for that specific date
                  </span>
                </div>
              </label>
            </div>

            {scope === 'SINGLE_DAY' && (
              <div className="pt-1.5">
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Select Scheduled Date to Cancel:
                </label>
                <select
                  value={selectedBookingDayId}
                  onChange={(e) => setSelectedBookingDayId(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  {eligibleBookingDays.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.dayOfWeek} — {formatEthiopianDateOnly(day.tripDate)} ({day.timeSlot})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Reason Dropdown (Required) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
            Cancellation Reason <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedReason}
            onChange={(e) => {
              setSelectedReason(e.target.value);
              setValidationError(null);
            }}
            className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 sm:p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            {CANCELLATION_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Custom explanation if "Other" is selected */}
        {selectedReason === 'Other' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              Explanation for Other <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Site construction halted due to municipal inspection..."
              value={customExplanation}
              onChange={(e) => {
                setCustomExplanation(e.target.value);
                setValidationError(null);
              }}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 sm:p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {/* Optional Administrative Note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Administrative Note <span className="text-slate-400 font-normal">(Optional context)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Add any internal details or instructions for audit history..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Release & Availability Warning Notice */}
        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-amber-950 dark:text-amber-100">Warning: </strong>
            This will cancel the booking and release the assigned vehicle and driver, subject to their
            actual availability and any other active assignments.
          </p>
        </div>
      </form>
    </Modal>
  );
};
