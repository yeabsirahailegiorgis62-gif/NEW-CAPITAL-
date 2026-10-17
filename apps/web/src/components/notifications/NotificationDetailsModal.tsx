import React from 'react';
import { InAppNotification, Booking } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime } from '@/lib/utils';
import {
  Bell,
  Clock,
  Calendar,
  MapPin,
  Users,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  CheckCheck,
  ExternalLink,
  Phone,
  User as UserIcon,
  ShieldCheck,
  FileText,
  QrCode,
} from 'lucide-react';

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: InAppNotification | null;
  onInspectBooking?: (booking: Booking | { id: string }) => void;
  onOpenReceipt?: (booking: Booking | { id: string; bookingReference?: string }) => void;
  onMarkAsRead?: (id: string) => void;
}

function getNotificationVisuals(type: string) {
  switch (type) {
    case 'BOOKING_APPROVED':
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        badgeText: 'Booking Approved',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        cardBorder: 'border-emerald-200 dark:border-emerald-900/60',
        bgGradient: 'from-emerald-500/10 via-transparent to-transparent',
      };
    case 'VEHICLE_ASSIGNED':
      return {
        icon: <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        badgeText: 'Vehicle Allocated',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        cardBorder: 'border-blue-200 dark:border-blue-900/60',
        bgGradient: 'from-blue-500/10 via-transparent to-transparent',
      };
    case 'BOOKING_REJECTED':
      return {
        icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
        badgeText: 'Booking Declined',
        badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800',
        cardBorder: 'border-red-200 dark:border-red-900/60',
        bgGradient: 'from-red-500/10 via-transparent to-transparent',
      };
    case 'NEW_BOOKING_REQUEST':
      return {
        icon: <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />,
        badgeText: 'New Trip Request',
        badgeClass: 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300 border-brand-300 dark:border-brand-800',
        cardBorder: 'border-brand-200 dark:border-brand-900/60',
        bgGradient: 'from-brand-500/10 via-transparent to-transparent',
      };
    case 'BOOKING_CANCELLED':
      return {
        icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        badgeText: 'Trip Cancelled',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        cardBorder: 'border-amber-200 dark:border-amber-900/60',
        bgGradient: 'from-amber-500/10 via-transparent to-transparent',
      };
    default:
      return {
        icon: <Info className="w-5 h-5 text-slate-600 dark:text-slate-400" />,
        badgeText: 'System Notice',
        badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        cardBorder: 'border-slate-200 dark:border-slate-800',
        bgGradient: 'from-slate-500/10 via-transparent to-transparent',
      };
  }
}

export const NotificationDetailsModal: React.FC<NotificationDetailsModalProps> = ({
  isOpen,
  onClose,
  notification,
  onInspectBooking,
  onOpenReceipt,
  onMarkAsRead,
}) => {
  if (!notification) return null;

  const visuals = getNotificationVisuals(notification.type);
  const booking = notification.booking;
  const isUnread = !notification.readAt;

  // Retrieve assigned vehicle details if available
  const assignment = booking?.assignments?.[0] || booking?.currentAssignment;
  const assignedVehicle = assignment?.vehicle;

  const handleOpenBooking = () => {
    if (booking && onInspectBooking) {
      onClose();
      onInspectBooking(booking);
    } else if (notification.bookingId && onInspectBooking) {
      onClose();
      onInspectBooking({ id: notification.bookingId });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Details"
      description="Official corporate fleet communication and alert record"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Banner with Icon & Category */}
        <div className={`p-4 rounded-2xl border ${visuals.cardBorder} bg-gradient-to-r ${visuals.bgGradient} flex items-start justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0">
              {visuals.icon}
            </div>
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${visuals.badgeClass}`}>
                {visuals.badgeText}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatEthiopianDateTime(notification.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isUnread ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                New / Unread
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                Read
              </span>
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
            {notification.title}
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {notification.message}
          </p>
        </div>

        {/* Associated Booking Card if available */}
        {booking && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Associated Booking Record
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-800">
                  #{booking.bookingReference}
                </span>
                <Badge status={booking.status} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 dark:text-slate-500">Destination</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span>{booking.destination}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 dark:text-slate-500">Trip Purpose</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                  {booking.purpose}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 dark:text-slate-500">Departure Schedule</span>
                <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatEthiopianDateTime(booking.departureAt)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 dark:text-slate-500">Expected Return</span>
                <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatEthiopianDateTime(booking.expectedReturnAt)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 dark:text-slate-500">Passengers</span>
                <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{booking.passengerCount} passenger{booking.passengerCount > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 dark:text-slate-500">Driver Assignment</span>
                <div className="font-medium text-slate-700 dark:text-slate-300">
                  {booking.requiresDriver ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      Company Driver Requested
                    </span>
                  ) : (
                    <span>Authorized Self-Drive</span>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Justification banner if rejected */}
            {booking.status === 'REJECTED' && booking.rejectionReason && (
              <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Logistics Rejection Reason:
                </span>
                <p className="pl-5 leading-relaxed">{booking.rejectionReason}</p>
              </div>
            )}

            {/* Assigned Vehicle Preview if available */}
            {assignedVehicle && (
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/60 dark:bg-blue-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {assignedVehicle.make} {assignedVehicle.model} ({assignedVehicle.name})
                    </span>
                    <span className="font-mono text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
                      Plate: {assignedVehicle.registrationNumber}
                    </span>
                  </div>
                </div>

                {assignment?.driverName && (
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Assigned Driver:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {assignment.driverName}
                    </span>
                    {assignment.driverPhone && (
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 justify-start sm:justify-end">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {assignment.driverPhone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Digital Receipt Callout Banner for Approved Bookings */}
            {(notification.type === 'BOOKING_APPROVED' ||
              notification.type === 'VEHICLE_ASSIGNED' ||
              booking.status === 'APPROVED' ||
              booking.status === 'ASSIGNED' ||
              booking.status === 'IN_PROGRESS' ||
              booking.status === 'COMPLETED') && (
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                      Official Digital Receipt & QR Pass Available
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Present this verified corporate reservation pass at security checkpoints and vehicle dispatch depot.
                    </p>
                  </div>
                </div>

                {onOpenReceipt && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenReceipt(booking || { id: notification.bookingId! });
                    }}
                    className="shrink-0 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                  >
                    View Digital Receipt
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            {isUnread && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                <CheckCheck className="w-4 h-4 mr-1.5" />
                Mark as Read
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(notification.type === 'BOOKING_APPROVED' ||
              notification.type === 'VEHICLE_ASSIGNED' ||
              booking?.status === 'APPROVED' ||
              booking?.status === 'ASSIGNED') &&
              onOpenReceipt && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenReceipt(booking || { id: notification.bookingId! });
                  }}
                  leftIcon={<QrCode className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Digital Receipt
                </Button>
              )}

            {(booking || notification.bookingId) && onInspectBooking && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenBooking}
                className="flex items-center gap-1.5"
              >
                <span>Inspect Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
