import React, { useState } from 'react';
import { Booking, User } from '@/types';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
import {
  MapPin,
  Calendar,
  Users,
  Car,
  Clock,
  Shield,
  AlertCircle,
  FileText,
  User as UserIcon,
  Phone,
  CheckCircle,
  XCircle,
  QrCode,
  Printer,
} from 'lucide-react';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  currentUser: User;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onAssign?: (booking: Booking) => void;
  onStartTrip?: (booking: Booking) => void;
  onCompleteTrip?: (booking: Booking) => void;
  onCancelBooking?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onPrintForm?: (booking: Booking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  currentUser,
  onApprove,
  onReject,
  onAssign,
  onStartTrip,
  onCompleteTrip,
  onCancelBooking,
  onOpenReceipt,
  onPrintForm,
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!booking) return null;

  const isLogisticsOrAdmin =
    currentUser.role === 'LOGISTICS_ADMIN' || currentUser.role === 'SYSTEM_ADMIN';
  const isOwner = currentUser.id === booking.requesterId;
  const assignment = booking.assignments?.[0];

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    if (onReject) onReject(booking.id, rejectionReason.trim());
    setRejecting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Booking Details #${booking.bookingReference}`}
      description="Official vehicle booking request and assignment record"
      maxWidth="5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
          {/* Cancellation options */}
          <div>
            {!rejecting && onCancelBooking && (
              <>
                {/* Employee can cancel if PENDING_APPROVAL */}
                {isOwner && booking.status === 'PENDING_APPROVAL' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancelBooking(booking)}
                    leftIcon={<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                    className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
                  >
                    Cancel Request
                  </Button>
                )}
                {/* Logistics Admin can cancel if not finished or in progress */}
                {isLogisticsOrAdmin &&
                  booking.status !== 'COMPLETED' &&
                  booking.status !== 'CANCELLED' &&
                  booking.status !== 'REJECTED' &&
                  booking.status !== 'IN_PROGRESS' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
                      onClick={() => onCancelBooking(booking)}
                      leftIcon={<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                    >
                      Cancel Booking
                    </Button>
                  )}
              </>
            )}
          </div>

          {/* Operational Workflow Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {isLogisticsOrAdmin && booking.status === 'PENDING_APPROVAL' && !rejecting && (
              <>
                <Button variant="danger" size="sm" onClick={() => setRejecting(true)} leftIcon={<XCircle className="w-4 h-4" />}>
                  Reject
                </Button>
                <Button variant="success" size="sm" onClick={() => onApprove && onApprove(booking.id)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                  Approve Request
                </Button>
                {onAssign && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={async () => {
                      if (onApprove) await onApprove(booking.id);
                      onAssign({ ...booking, status: 'APPROVED' });
                    }}
                    leftIcon={<Car className="w-4 h-4" />}
                  >
                    Review & Assign
                  </Button>
                )}
              </>
            )}

            {isLogisticsOrAdmin && booking.status === 'APPROVED' && onAssign && (
              <Button variant="primary" size="sm" onClick={() => onAssign(booking)} leftIcon={<Car className="w-4 h-4" />}>
                Assign Vehicle
              </Button>
            )}

            {isLogisticsOrAdmin && booking.status === 'ASSIGNED' && (
              <>
                {onAssign && (
                  <Button variant="outline" size="sm" onClick={() => onAssign(booking)} leftIcon={<Car className="w-3.5 h-3.5" />}>
                    Change Vehicle
                  </Button>
                )}
                {onStartTrip && (
                  <Button variant="success" size="sm" onClick={() => onStartTrip(booking)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                    Record Departure
                  </Button>
                )}
              </>
            )}

            {isLogisticsOrAdmin && booking.status === 'IN_PROGRESS' && onCompleteTrip && (
              <Button variant="primary" size="sm" onClick={() => onCompleteTrip(booking)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                Record Return
              </Button>
            )}

            {/* Digital Receipt action button in footer */}
            {onOpenReceipt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenReceipt(booking)}
                leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-semibold shadow-2xs"
              >
                Digital Receipt & QR
              </Button>
            )}

            {onPrintForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPrintForm(booking)}
                leftIcon={<Printer className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold shadow-2xs"
              >
                Print Form
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5 pb-1">
        {/* Compact Status Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 p-0.5 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img
                src="/assets/capital-emblem.png"
                alt="Capital Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                {booking.bookingReference}
              </span>
              <Badge status={booking.status} size="sm" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                {booking.requestType || 'DAILY'} Trip
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-slate-200 sm:dark:border-slate-700 sm:pl-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                Requested By
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {booking.requester?.name || 'Staff Member'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                · {booking.requester?.department?.name || 'Capital Real Estate'}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Review Guidance Banner */}
        {booking.status === 'PENDING_APPROVAL' && (
          <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong className="font-semibold text-amber-900 dark:text-amber-100">Pending Review: </strong>
              Vehicle request is awaiting Logistics review. Confirm destination, schedule, and capacity before dispatch.
            </p>
          </div>
        )}

        {/* Rejection Alert if rejected */}
        {booking.status === 'REJECTED' && (
          <div className="p-3 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-200">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              Rejection Reason:
            </div>
            <p className="mt-1 text-red-800 dark:text-red-300 leading-relaxed">{booking.rejectionReason || 'No reason specified'}</p>
          </div>
        )}

        {/* Cancellation Alert if cancelled */}
        {booking.status === 'CANCELLED' && (
          <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200">
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Trip Booking Cancelled</span>
              </div>
              {booking.cancelledAt && (
                <span className="text-[11px] font-mono text-rose-700/80 dark:text-rose-300/80">
                  {formatEthiopianDateTime(booking.cancelledAt)}
                </span>
              )}
            </div>
            <p className="text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
              <span className="font-bold">Cancellation Reason: </span>
              {booking.cancellationReason || 'Logistics Administrative Cancellation'}
            </p>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
              Assigned fleet vehicle and driver resources have been safely released for schedule availability.
            </p>
          </div>
        )}

        {/* Two-Column Responsive Layout for Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Left Column: Trip Route, Schedule & Notes (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Route & Schedule Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  Trip Route & Destination
                </div>
                {booking.contactPhone && (
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {booking.contactPhone}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                    Destination:
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {booking.destination}
                  </div>
                </div>

                {booking.pickupLocation && (
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                      Pickup Location:
                    </span>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {booking.pickupLocation}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                    Departure (EAT):
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">
                    {formatEthiopianDateTime(booking.departureAt)}
                  </span>
                </div>
                <div className="sm:border-l sm:border-slate-200 sm:dark:border-slate-700 sm:pl-2.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                    Expected Return (EAT):
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">
                    {formatEthiopianDateTime(booking.expectedReturnAt)}
                  </span>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-1">
                  Trip Purpose & Operational Justification:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {booking.purpose}
                </p>
              </div>

              {/* Additional Notes if any */}
              {booking.additionalNotes && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-0.5">
                    Additional Instructions / Cargo Notes:
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    {booking.additionalNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Weekly Day Schedule Breakdown (if multi-day) */}
            {booking.bookingDays && booking.bookingDays.length > 0 && (
              <div className="p-3 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/40 dark:bg-brand-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 dark:text-brand-200">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>Weekly Breakdown ({booking.bookingDays.length} Days)</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded">
                    Daily Schedule
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {booking.bookingDays.map((day) => (
                    <div
                      key={day.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {day.dayOfWeek}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {formatEthiopianDateOnly(day.tripDate)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {day.timeSlot}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge status={day.status as any} size="sm" />
                        {isLogisticsOrAdmin && day.status === 'PENDING' && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              onClick={async () => {
                                await api.updateBookingDay(day.id, { status: 'APPROVED' });
                                day.status = 'APPROVED';
                              }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                              onClick={async () => {
                                await api.updateBookingDay(day.id, { status: 'REJECTED' });
                                day.status = 'REJECTED';
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Fleet Allocation & Requirements (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Requirements Strip */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                <Users className="w-3.5 h-3.5 text-brand-600" />
                Fleet & Capacity Requirements
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
                  <span className="font-bold text-slate-900 dark:text-white">{booking.passengerCount} Passengers</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Driver Mode</span>
                  <span className="font-bold text-slate-900 dark:text-white text-[11px] truncate block">
                    {booking.requiresDriver ? 'Company Driver' : 'Self-Driven'}
                  </span>
                </div>
              </div>

              {booking.preferredVehicle && (
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Preferred Vehicle</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{booking.preferredVehicle.name}</span>
                </div>
              )}
            </div>

            {/* Active Vehicle Assignment Card */}
            {assignment ? (
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <Car className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Allocated Fleet
                  </div>
                  <span className="text-[11px] font-mono font-bold text-brand-800 dark:text-brand-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {assignment.vehicle?.registrationNumber || 'No Plate'}
                  </span>
                </div>

                <div className="text-xs space-y-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/40">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {assignment.vehicle?.name || 'Assigned Vehicle'}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1">
                    <span>Driver:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {assignment.driverName || 'Self-driven'}
                    </span>
                  </div>
                  {assignment.driverPhone && (
                    <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between text-[11px]">
                      <span>Phone:</span>
                      <span className="font-mono">{assignment.driverPhone}</span>
                    </div>
                  )}
                  <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <span>Assigned At:</span>
                    <span>{formatEthiopianDateTime(assignment.assignedAt)}</span>
                  </div>
                </div>

                {assignment.assignmentNotes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                    Note: {assignment.assignmentNotes}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 text-center py-5">
                <Car className="w-6 h-6 mx-auto mb-1.5 text-slate-400 dark:text-slate-500 stroke-1" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  No Vehicle Assigned Yet
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Logistics team allocates vehicle and driver upon review.
                </span>
              </div>
            )}

            {/* Trip Execution Telemetry if started/completed */}
            {(booking.actualDepartureAt || booking.actualReturnAt) && (
              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-1.5">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-[11px] uppercase tracking-wider">
                  Trip Execution Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 block">Departure:</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-[11px] block">
                      {formatEthiopianDateTime(booking.actualDepartureAt)}
                    </span>
                    {booking.startOdometer && (
                      <span className="text-slate-500 font-mono text-[10px] block">
                        {booking.startOdometer} km
                      </span>
                    )}
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 block">Return:</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-[11px] block">
                      {formatEthiopianDateTime(booking.actualReturnAt)}
                    </span>
                    {booking.endOdometer && (
                      <span className="text-slate-500 font-mono text-[10px] block">
                        {booking.endOdometer} km
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Inline Reject Form */}
            {rejecting && (
              <div className="p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 space-y-2">
                <label className="block text-xs font-semibold text-red-900 dark:text-red-200">
                  Reason for rejecting request:
                </label>
                <textarea
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-red-300 dark:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Provide operational justification..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setRejecting(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="danger" onClick={handleConfirmReject}>
                    Confirm Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

