import React, { useState } from 'react';
import { Booking, User } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime } from '@/lib/utils';
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
  onCancelBooking?: (id: string, reason?: string) => void;
  onOpenReceipt?: (booking: Booking) => void;
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
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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

  const handleConfirmCancel = () => {
    if (onCancelBooking) onCancelBooking(booking.id, cancelReason.trim());
    setCancelling(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Booking Details #${booking.bookingReference}`}
      description="Official vehicle booking request and assignment record"
      maxWidth="3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          {/* Cancellation options */}
          <div>
            {!cancelling && !rejecting && (
              <>
                {/* Employee can cancel if PENDING_APPROVAL */}
                {isOwner && booking.status === 'PENDING_APPROVAL' && (
                  <Button variant="outline" size="sm" onClick={() => setCancelling(true)}>
                    Cancel Request
                  </Button>
                )}
                {/* Logistics Admin can cancel if not finished */}
                {isLogisticsOrAdmin &&
                  booking.status !== 'COMPLETED' &&
                  booking.status !== 'CANCELLED' &&
                  booking.status !== 'REJECTED' && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setCancelling(true)}>
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
                <Button variant="danger" size="sm" onClick={() => setRejecting(true)}>
                  Reject
                </Button>
                <Button variant="success" size="sm" onClick={() => onApprove && onApprove(booking.id)}>
                  Approve Request
                </Button>
              </>
            )}

            {isLogisticsOrAdmin && booking.status === 'APPROVED' && onAssign && (
              <Button variant="primary" size="sm" onClick={() => onAssign(booking)}>
                Assign Vehicle
              </Button>
            )}

            {isLogisticsOrAdmin && booking.status === 'ASSIGNED' && (
              <>
                {onAssign && (
                  <Button variant="outline" size="sm" onClick={() => onAssign(booking)}>
                    Change Assignment
                  </Button>
                )}
                {onStartTrip && (
                  <Button variant="success" size="sm" onClick={() => onStartTrip(booking)}>
                    Record Departure (Start Trip)
                  </Button>
                )}
              </>
            )}

            {isLogisticsOrAdmin && booking.status === 'IN_PROGRESS' && onCompleteTrip && (
              <Button variant="primary" size="sm" onClick={() => onCompleteTrip(booking)}>
                Record Return (Complete Trip)
              </Button>
            )}

            {/* Digital Receipt action button in footer */}
            {(booking.status === 'APPROVED' ||
              booking.status === 'ASSIGNED' ||
              booking.status === 'IN_PROGRESS' ||
              booking.status === 'COMPLETED') &&
              onOpenReceipt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenReceipt(booking)}
                  leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600" />}
                  className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  View Receipt
                </Button>
              )}

            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        {/* Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img
                src="/assets/capital-emblem.png"
                alt="Capital Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                  {booking.bookingReference}
                </span>
                <Badge status={booking.status} size="sm" />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                Official Requisition & Dispatch Record
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(booking.status === 'APPROVED' ||
              booking.status === 'ASSIGNED' ||
              booking.status === 'IN_PROGRESS' ||
              booking.status === 'COMPLETED') &&
              onOpenReceipt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenReceipt(booking)}
                  leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600" />}
                  className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold"
                >
                  Digital Receipt & QR
                </Button>
              )}

            <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold tracking-wider">
                Requested By
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                {booking.requester?.name || 'Staff Member'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {booking.requester?.department?.name || 'Capital Real Estate'}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Review Guidance Banner */}
        {booking.status === 'PENDING_APPROVAL' && (
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-0.5">
              <strong className="block font-semibold text-sm text-amber-900 dark:text-amber-100">
                Request Awaiting Logistics Review
              </strong>
              <p className="text-amber-800 dark:text-amber-300">
                This vehicle request is currently pending in the Logistics Queue. Review the trip schedule, passenger capacity, and vehicle requirements below before approving or assigning fleet.
              </p>
            </div>
          </div>
        )}

        {/* Rejection Alert if rejected */}
        {booking.status === 'REJECTED' && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              Rejection Reason:
            </div>
            <p className="mt-1 text-xs text-red-800 dark:text-red-300 leading-relaxed">{booking.rejectionReason || 'No reason specified'}</p>
          </div>
        )}

        {/* Trip Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Destination & Purpose
            </div>
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Destination:</span>
              <div className="font-bold text-base text-slate-900 dark:text-white leading-snug">{booking.destination}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Trip Purpose:</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                {booking.purpose}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Requested Schedule (EAT)
            </div>
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Departure Schedule:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-xs">{formatEthiopianDateTime(booking.departureAt)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Expected Return:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-xs">{formatEthiopianDateTime(booking.expectedReturnAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle & Passenger Requirements */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-[11px]">Passengers</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{booking.passengerCount} Persons</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-[11px]">Driver Requirement</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {booking.requiresDriver ? 'Company Driver Required' : 'Self-Driven / None'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
              <Car className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-[11px]">Vehicle Preference</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {booking.preferredVehicle?.name || 'No Preference'}
            </span>
          </div>
        </div>

        {/* Active Vehicle Assignment Section if assigned */}
        {assignment && (
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-200">
                <Car className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                Allocated Vehicle: {assignment.vehicle?.name}
              </div>
              <span className="text-xs font-mono font-bold text-brand-800 dark:text-brand-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {assignment.vehicle?.registrationNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Driver Assigned:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {assignment.driverName || 'Self-driven by staff'}
                </span>
                {assignment.driverPhone && (
                  <span className="text-slate-500 dark:text-slate-400 block">{assignment.driverPhone}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Assigned By:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {assignment.assignedBy?.name || 'Logistics Operations'}
                </span>
                <span className="text-slate-400 dark:text-slate-500 block">
                  {formatEthiopianDateTime(assignment.assignedAt)}
                </span>
              </div>
            </div>

            {assignment.assignmentNotes && (
              <p className="text-xs text-slate-600 dark:text-slate-300 border-t border-blue-100 dark:border-blue-800/60 pt-2">
                <strong className="text-slate-700 dark:text-slate-200">Notes: </strong>
                {assignment.assignmentNotes}
              </p>
            )}
          </div>
        )}

        {/* Trip Execution Telemetry if started/completed */}
        {(booking.actualDepartureAt || booking.actualReturnAt) && (
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/30 text-xs space-y-2">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block">Trip Execution Record:</span>
            <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Actual Departure:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatEthiopianDateTime(booking.actualDepartureAt)}</span>
                {booking.startOdometer && (
                  <span className="text-slate-500 dark:text-slate-400 block font-mono">Start Odo: {booking.startOdometer} km</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block">Actual Return:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatEthiopianDateTime(booking.actualReturnAt)}</span>
                {booking.endOdometer && (
                  <span className="text-slate-500 dark:text-slate-400 block font-mono">End Odo: {booking.endOdometer} km</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {booking.additionalNotes && (
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-700 dark:text-slate-200 block mb-1">Additional Notes:</strong>
            <p className="whitespace-pre-wrap leading-relaxed">{booking.additionalNotes}</p>
          </div>
        )}

        {/* Inline Reject Form */}
        {rejecting && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 space-y-3">
            <label className="block text-xs font-semibold text-red-900 dark:text-red-200">
              Reason for rejecting request:
            </label>
            <textarea
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-red-300 dark:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Provide a clear operational reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setRejecting(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleConfirmReject}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Inline Cancel Form */}
        {cancelling && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3">
            <label className="block text-xs font-semibold text-slate-900 dark:text-white">
              Reason for cancelling booking:
            </label>
            <textarea
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="e.g. Meeting postponed, alternative transport arranged"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setCancelling(false)}>
                Back
              </Button>
              <Button size="sm" variant="danger" onClick={handleConfirmCancel}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
