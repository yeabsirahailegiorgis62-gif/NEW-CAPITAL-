// COMPONENT: Booking detail modal. Role-conditional actions (approve, assign, start, cancel).
import React, { useState, useEffect, useMemo } from 'react';
import { Booking, User } from '@/types';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
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
  History,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  KeyRound,
  FileCheck,
  RotateCcw,
  RotateCw,
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
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');
  const [detailedBooking, setDetailedBooking] = useState<Booking | null>(booking);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  const handleAutoAssign = async () => {
    const target = detailedBooking || booking;
    if (!target) return;
    try {
      setIsAutoAssigning(true);
      await api.autoAssignBooking(target.id);
      toast.success(
        '⚡ Vehicle Auto-Assigned!',
        `Successfully allocated optimal vehicle & driver for trip #${target.bookingReference}.`
      );
      const fresh = await api.getBooking(target.id);
      if (fresh) {
        setDetailedBooking(fresh);
      }
    } catch (err: any) {
      toast.info('Manual Selection Prompt', err?.message || 'Auto-assign requires manual review. Opening assignment console.');
      if (onAssign) {
        onAssign(target);
      }
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Sync detailed booking and fetch fresh full record including auditLogs
  useEffect(() => {
    if (booking && isOpen) {
      setDetailedBooking(booking);
      setRejecting(false);
      setRejectionReason('');
      setActiveTab('details');

      if (booking.id) {
        api.getBooking(booking.id).then((fresh) => {
          if (fresh) {
            setDetailedBooking(fresh);
          }
        }).catch((err) => {
          console.warn('Could not load detailed audit history for booking:', err);
        });
      }
    }
  }, [booking, isOpen]);

  const current = detailedBooking || booking;
  const isLogisticsOrAdmin =
    currentUser.role === 'LOGISTICS_ADMIN' || currentUser.role === 'SYSTEM_ADMIN';
  const isOwner = current ? currentUser.id === current.requesterId : false;
  const assignment = current?.assignments?.[0];

  // Extract Approval details from audit logs or direct properties
  const approvalLog = useMemo(() => {
    return current?.auditLogs?.find(
      (log: any) => log.action === 'APPROVED' || log.action === 'APPROVE_REQUEST'
    );
  }, [current?.auditLogs]);

  const rejectionLog = useMemo(() => {
    return current?.auditLogs?.find(
      (log: any) => log.action === 'REJECTED' || log.action === 'REJECT_REQUEST'
    );
  }, [current?.auditLogs]);

  const assignmentLog = useMemo(() => {
    return current?.auditLogs?.slice().reverse().find(
      (log: any) =>
        log.action === 'ASSIGNED' ||
        log.action === 'REASSIGNED' ||
        log.action === 'ASSIGN_VEHICLE' ||
        log.action === 'REASSIGN_VEHICLE'
    );
  }, [current?.auditLogs]);

  const cancellationLog = useMemo(() => {
    return current?.auditLogs?.find(
      (log: any) => log.action === 'CANCELLED' || log.action === 'CANCEL_BOOKING'
    );
  }, [current?.auditLogs]);

  // Approver information
  const approverName =
    approvalLog?.newValues?.approverName ||
    approvalLog?.actorName ||
    (current && (current.status === 'APPROVED' || current.status === 'ASSIGNED' || current.status === 'IN_PROGRESS' || current.status === 'COMPLETED')
      ? 'Logistics Officer'
      : null);
  const approverId = approvalLog?.newValues?.approverId || approvalLog?.actorId || null;
  const approvedAt = approvalLog?.newValues?.approvedAt || approvalLog?.createdAt || null;

  // Rejector information
  const rejectorName = rejectionLog?.newValues?.rejectedByName || rejectionLog?.actorName || (current?.status === 'REJECTED' ? 'Logistics Officer' : null);
  const rejectorId = rejectionLog?.newValues?.rejectedById || rejectionLog?.actorId || null;
  const rejectedAt = rejectionLog?.newValues?.rejectedAt || rejectionLog?.createdAt || null;
  const rejectionNotes = rejectionLog?.newValues?.reason || current?.rejectionReason || null;

  // Assigner information
  const assignerName =
    assignment?.assignedBy?.name ||
    assignmentLog?.newValues?.assignedByName ||
    assignmentLog?.actorName ||
    (assignment ? 'Logistics Officer' : null);
  const assignerId = assignment?.assignedBy?.employeeId || assignmentLog?.newValues?.assignedById || assignment?.assignedById || null;
  const assignedAtTime = assignment?.assignedAt || assignmentLog?.newValues?.assignedAt || assignmentLog?.createdAt || null;

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    if (onReject && current) onReject(current.id, rejectionReason.trim());
    setRejecting(false);
  };

  if (!booking || !current) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Booking Details #${current.bookingReference}`}
      description="Official vehicle booking request and assignment record"
      maxWidth="5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
          {/* Cancellation options */}
          <div>
            {!rejecting && onCancelBooking && (
              <>
                {/* Employee can cancel if PENDING_APPROVAL */}
                {isOwner && current.status === 'PENDING_APPROVAL' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancelBooking(current)}
                    leftIcon={<XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                    className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
                  >
                    Cancel Request
                  </Button>
                )}
                {/* Logistics Admin can cancel if not finished or in progress */}
                {isLogisticsOrAdmin &&
                  current.status !== 'COMPLETED' &&
                  current.status !== 'CANCELLED' &&
                  current.status !== 'REJECTED' &&
                  current.status !== 'IN_PROGRESS' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold"
                      onClick={() => onCancelBooking(current)}
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
            {/* Step 2: Review (Approve or Reject) */}
            {isLogisticsOrAdmin && current.status === 'PENDING_APPROVAL' && !rejecting && (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setRejecting(true)}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Reject Request
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => onApprove && onApprove(current.id)}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Approve Request
                </Button>
              </>
            )}

            {/* Step 3: Assign Vehicle for Approved */}
            {isLogisticsOrAdmin && current.status === 'APPROVED' && (
              <>
                {onAssign && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAssign(current)}
                    leftIcon={<Car className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md ring-2 ring-brand-500/20"
                  >
                    Assign Vehicle & Driver
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAutoAssign}
                  disabled={isAutoAssigning}
                  leftIcon={isAutoAssigning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md ring-2 ring-amber-400/20"
                >
                  {isAutoAssigning ? 'Auto-Assigning...' : '⚡ Auto-Assign'}
                </Button>
              </>
            )}

            {/* Step 4: Manage Assigned Trip */}
            {isLogisticsOrAdmin && current.status === 'ASSIGNED' && (
              <>
                {onAssign && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAssign(current)}
                    leftIcon={<Car className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                    className="border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 font-semibold"
                  >
                    Change Vehicle / Reassign
                  </Button>
                )}
                {onStartTrip && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => onStartTrip(current)}
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                  >
                    Record Departure
                  </Button>
                )}
              </>
            )}

            {isLogisticsOrAdmin && current.status === 'IN_PROGRESS' && onCompleteTrip && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onCompleteTrip(current)}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                Record Return
              </Button>
            )}

            {/* Digital Receipt action button in footer */}
            {onOpenReceipt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenReceipt(current)}
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
                onClick={() => onPrintForm(current)}
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
      <div className="space-y-4 pb-1">
        {/* Compact Status Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img
                src="/assets/capital-emblem.png"
                alt="Capital Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                {current.bookingReference}
              </span>
              <Badge status={current.status} size="sm" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                {current.requestType || 'DAILY'} Trip
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-slate-200 sm:dark:border-slate-700 sm:pl-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                Requested By
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {current.requester?.name || 'Staff Member'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                {current.requester?.employeeId ? `· ID: ${current.requester.employeeId}` : ''} · {current.requester?.department?.name || 'Capital Real Estate'}
              </span>
              {current.createdAt && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                  Submitted: {formatEthiopianDateTime(current.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation: Operational Details vs Lifecycle Audit Trail */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'details'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Logistics Center Record</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lifecycle History & Audit Trail</span>
            {current.auditLogs && current.auditLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                {current.auditLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Operational Details */}
        {activeTab === 'details' && (
          <div className="space-y-3.5">
            {/* Pending Review Guidance Banner */}
            {current.status === 'PENDING_APPROVAL' && (
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong className="font-semibold text-amber-900 dark:text-amber-100">Pending Review: </strong>
                    Request awaiting Logistics action. You can approve or directly allocate fleet resources now.
                  </p>
                </div>
                {isLogisticsOrAdmin && (
                  <div className="flex items-center gap-2">
                    {onApprove && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => onApprove(current.id)}
                        leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                        className="shrink-0 font-bold text-xs"
                      >
                        Approve Now
                      </Button>
                    )}
                    {onAssign && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onAssign(current)}
                        leftIcon={<Car className="w-3.5 h-3.5" />}
                        className="shrink-0 font-bold text-xs"
                      >
                        Assign Vehicle
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleAutoAssign}
                      disabled={isAutoAssigning}
                      leftIcon={isAutoAssigning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      className="shrink-0 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {isAutoAssigning ? 'Auto...' : '⚡ Auto-Assign'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Approved guidance banner */}
            {current.status === 'APPROVED' && (
              <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong className="font-semibold text-blue-900 dark:text-blue-100">Approved by Logistics: </strong>
                    Request approved and awaiting company vehicle and driver assignment.
                  </p>
                </div>
                {isLogisticsOrAdmin && (
                  <div className="flex items-center gap-2">
                    {onAssign && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onAssign(current)}
                        leftIcon={<Car className="w-3.5 h-3.5" />}
                        className="shrink-0 font-bold text-xs"
                      >
                        Assign Vehicle
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleAutoAssign}
                      disabled={isAutoAssigning}
                      leftIcon={isAutoAssigning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      className="shrink-0 font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {isAutoAssigning ? 'Auto...' : '⚡ Auto-Assign'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Rejection Alert if rejected */}
            {current.status === 'REJECTED' && (
              <div className="p-3 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-200">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>Request Rejected</span>
                  </div>
                  {rejectedAt && (
                    <span className="font-mono text-[11px] text-red-700/80 dark:text-red-300/80">
                      {formatEthiopianDateTime(rejectedAt)}
                    </span>
                  )}
                </div>
                {rejectorName && (
                  <p className="mt-1 text-[11px] text-red-700/80 dark:text-red-400">
                    Decided by: <strong>{rejectorName}</strong> {rejectorId ? `(${rejectorId})` : ''}
                  </p>
                )}
                <p className="mt-1.5 text-red-800 dark:text-red-300 leading-relaxed font-medium">
                  <strong>Rejection Reason: </strong>{rejectionNotes || 'No reason specified'}
                </p>
              </div>
            )}

            {/* Cancellation Alert if cancelled */}
            {current.status === 'CANCELLED' && (
              <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Trip Booking Cancelled</span>
                  </div>
                  {(current.cancelledAt || cancellationLog?.createdAt) && (
                    <span className="text-[11px] font-mono text-rose-700/80 dark:text-rose-300/80">
                      {formatEthiopianDateTime(current.cancelledAt || cancellationLog?.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                  <span className="font-bold">Cancellation Reason: </span>
                  {current.cancellationReason || cancellationLog?.newValues?.reason || 'Logistics Administrative Cancellation'}
                </p>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                  Assigned fleet vehicle and driver resources have been safely released for schedule availability.
                </p>
              </div>
            )}

            {/* Two-Column Responsive Layout for Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* Left Column: Request Information (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-3">
                {/* Route & Schedule Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      Trip Route & Destination
                    </div>
                    {current.contactPhone && (
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {current.contactPhone}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                        Destination:
                      </span>
                      <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {current.destination}
                      </div>
                    </div>

                    {current.pickupLocation && (
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                          Pickup Location:
                        </span>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {current.pickupLocation}
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
                        {formatEthiopianDateTime(current.departureAt)}
                      </span>
                    </div>
                    <div className="sm:border-l sm:border-slate-200 sm:dark:border-slate-700 sm:pl-2.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                        Expected Return (EAT):
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {formatEthiopianDateTime(current.expectedReturnAt)}
                      </span>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-1">
                      Trip Purpose & Operational Justification:
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      {current.purpose}
                    </p>
                  </div>

                  {/* Additional Notes if any */}
                  {current.additionalNotes && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block mb-0.5">
                        Additional Instructions / Cargo Notes:
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        {current.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Weekly Day Schedule Breakdown (if multi-day) */}
                {current.bookingDays && current.bookingDays.length > 0 && (
                  <div className="p-3 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/40 dark:bg-brand-950/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 dark:text-brand-200">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        <span>Weekly Breakdown ({current.bookingDays.length} Days)</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded">
                        Daily Schedule
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {current.bookingDays.map((day) => (
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

              {/* Right Column: Approval & Assignment Records (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-3">
                {/* Section B: Official Approval Record Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-brand-600" />
                      <span>Logistics Approval Record</span>
                    </div>
                    <Badge status={current.status} size="sm" />
                  </div>

                  {approverName ? (
                    <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Approved By:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {approverName} {approverId ? `(${approverId})` : ''}
                        </span>
                      </div>
                      {approvedAt && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Decision Date:</span>
                          <span className="font-mono">{formatEthiopianDateTime(approvedAt)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>Decision:</span>
                        <span>Approved for Resource Assignment</span>
                      </div>
                    </div>
                  ) : current.status === 'REJECTED' ? (
                    <div className="space-y-1 text-xs bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                      <div className="font-bold">Rejected by: {rejectorName || 'Logistics Officer'}</div>
                      {rejectedAt && <div className="text-[11px] font-mono">{formatEthiopianDateTime(rejectedAt)}</div>}
                      <div className="text-[11px]">Reason: {rejectionNotes || 'Operational Constraints'}</div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Awaiting review and approval by authorized Logistics Officer.</span>
                    </div>
                  )}

                  {/* Requirements Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
                      <span className="font-bold text-slate-900 dark:text-white">{current.passengerCount} Passengers</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Driver Mode</span>
                      <span className="font-bold text-slate-900 dark:text-white text-[11px] truncate block">
                        {current.requiresDriver ? 'Company Driver' : 'Self-Driven'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section C: Vehicle & Driver Assignment Information Card */}
                {assignment ? (
                  <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                        <Car className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span>Allocated Fleet Asset</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-brand-800 dark:text-brand-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {assignment.vehicle?.registrationNumber || 'No Plate'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/40">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{assignment.vehicle?.make ? `${assignment.vehicle.make} ${assignment.vehicle.model}` : (assignment.vehicle?.name || 'Assigned Vehicle')}</span>
                        {assignment.vehicle?.passengerCapacity && (
                          <span className="text-[10px] font-mono text-slate-400 font-normal">Cap: {assignment.vehicle.passengerCapacity}</span>
                        )}
                      </div>

                      <div className="text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1">
                        <span>Assigned Chauffeur:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {assignment.driverName || assignment.driver?.name || (current.requiresDriver ? 'Assigned Driver' : 'Self-Driven')}
                        </span>
                      </div>

                      {/* Driver contact only visible to authorized roles or owner */}
                      {(isLogisticsOrAdmin || isOwner || currentUser.role === 'DRIVER') && (assignment.driverPhone || assignment.driver?.phone) && (
                        <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between text-[11px]">
                          <span>Driver Contact:</span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                            {assignment.driverPhone || assignment.driver?.phone}
                          </span>
                        </div>
                      )}

                      {assignerName && (
                        <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <span>Assigned By:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {assignerName} {assignerId ? `(${assignerId})` : ''}
                          </span>
                        </div>
                      )}

                      {assignedAtTime && (
                        <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between text-[11px]">
                          <span>Assigned Date:</span>
                          <span className="font-mono">{formatEthiopianDateTime(assignedAtTime)}</span>
                        </div>
                      )}
                    </div>

                    {assignment.assignmentNotes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-white/60 dark:bg-slate-900/60 p-2 rounded border border-blue-100 dark:border-blue-900/30">
                        <strong>Dispatch Instructions:</strong> {assignment.assignmentNotes}
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
                      Logistics team assigns vehicle and driver after approving the request.
                    </span>
                  </div>
                )}

                {/* Trip Execution Telemetry if started/completed */}
                {(current.actualDepartureAt || current.actualReturnAt) && (
                  <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-1.5">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-[11px] uppercase tracking-wider">
                      Trip Execution Telemetry
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-emerald-100 dark:border-emerald-900/40">
                        <span className="text-[10px] text-slate-400 block">Departure:</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-[11px] block">
                          {formatEthiopianDateTime(current.actualDepartureAt)}
                        </span>
                        {current.startOdometer && (
                          <span className="text-slate-500 font-mono text-[10px] block">
                            {current.startOdometer} km
                          </span>
                        )}
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-emerald-100 dark:border-emerald-900/40">
                        <span className="text-[10px] text-slate-400 block">Return:</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-[11px] block">
                          {formatEthiopianDateTime(current.actualReturnAt)}
                        </span>
                        {current.endOdometer && (
                          <span className="text-slate-500 font-mono text-[10px] block">
                            {current.endOdometer} km
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
        )}

        {/* Tab 2: Lifecycle History & Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>
                  Complete audit history preserving requests, approvals, assignments, and subsequent changes.
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                Ref: {current.bookingReference}
              </span>
            </div>

            {current.auditLogs && current.auditLogs.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {current.auditLogs.map((log: any, idx: number) => {
                  const isSubmitted = log.action === 'SUBMITTED' || log.action === 'CREATED' || log.action === 'SUBMIT_REQUEST';
                  const isApproved = log.action === 'APPROVED' || log.action === 'APPROVE_REQUEST';
                  const isRejected = log.action === 'REJECTED' || log.action === 'REJECT_REQUEST';
                  const isAssigned = log.action === 'ASSIGNED' || log.action === 'REASSIGNED' || log.action === 'ASSIGN_VEHICLE' || log.action === 'REASSIGN_VEHICLE';
                  const isCancelled = log.action === 'CANCELLED' || log.action === 'CANCEL_BOOKING';
                  const isTrip = log.action === 'TRIP_STARTED' || log.action === 'TRIP_COMPLETED';

                  const badgeColor = isApproved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : isRejected
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                    : isAssigned
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                    : isCancelled
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

                  const dotColor = isApproved
                    ? 'bg-emerald-500'
                    : isRejected
                    ? 'bg-red-500'
                    : isAssigned
                    ? 'bg-blue-500'
                    : isCancelled
                    ? 'bg-rose-500'
                    : 'bg-brand-500';

                  return (
                    <div key={log.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${dotColor} shadow-xs`}
                      />

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeColor}`}>
                              {log.action}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {log.actorName || log.performedBy?.name || 'System Operator'}
                            </span>
                            {(log.actorId || log.performedBy?.employeeId) && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({log.actorId || log.performedBy?.employeeId})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {formatEthiopianDateTime(log.createdAt)}
                          </span>
                        </div>

                        {/* Details / description */}
                        {log.details && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {log.details}
                          </p>
                        )}

                        {/* Specific payload notes */}
                        {log.newValues?.reason && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded border border-slate-100 dark:border-slate-800">
                            <strong>Reason:</strong> {log.newValues.reason}
                          </div>
                        )}

                        {log.newValues?.plateNumber && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Car className="w-3.5 h-3.5 text-brand-600" />
                            <span>Assigned Plate: <strong>{log.newValues.plateNumber}</strong></span>
                            {log.newValues.driverName && (
                              <span>· Driver: <strong>{log.newValues.driverName}</strong></span>
                            )}
                          </div>
                        )}

                        {/* Previous vs New values if reassignment */}
                        {log.previousValues && log.action === 'REASSIGNED' && (
                          <div className="text-[11px] text-slate-500 grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="block font-bold">Previous:</span>
                              <span>{log.previousValues.plateNumber || 'N/A'} · {log.previousValues.driverName || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="block font-bold text-emerald-600">Updated:</span>
                              <span>{log.newValues?.plateNumber || 'N/A'} · {log.newValues?.driverName || 'N/A'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center text-xs text-slate-500">
                <History className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <span className="font-semibold block text-slate-700 dark:text-slate-300">
                  Initial Trip Request Submitted
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Full lifecycle timeline records subsequent approvals, vehicle allocations, reassignments, and operational milestones.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
