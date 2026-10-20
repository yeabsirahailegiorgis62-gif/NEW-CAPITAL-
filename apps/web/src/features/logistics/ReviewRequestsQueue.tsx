import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Booking, User } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime } from '@/lib/utils';
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Car,
  Clock,
  ArrowRight,
  User as UserIcon,
  MapPin,
  AlertCircle,
  RotateCw,
  QrCode,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Users,
  Mail,
  KeyRound,
  ShieldCheck,
  Printer,
} from 'lucide-react';

interface ReviewRequestsQueueProps {
  currentUser: User;
  bookings?: Booking[];
  initialTab?: 'pending' | 'approved' | 'assigned';
  onRefreshQueue?: () => Promise<void>;
  onSelectBooking: (booking: Booking) => void;
  onAssignVehicle: (booking: Booking) => void;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string, reason: string) => Promise<void> | void;
  onOpenReceipt?: (booking: Booking) => void;
  onPrintForm?: (booking: Booking) => void;
}

export const ReviewRequestsQueue: React.FC<ReviewRequestsQueueProps> = ({
  currentUser,
  bookings: propBookings,
  initialTab = 'pending',
  onRefreshQueue,
  onSelectBooking,
  onAssignVehicle,
  onApprove,
  onReject,
  onOpenReceipt,
  onPrintForm,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'assigned'>(initialTab);
  const [bookings, setBookings] = useState<Booking[]>(propBookings || []);
  const [isLoading, setIsLoading] = useState(!propBookings);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propBookings) {
      setBookings(propBookings);
      setIsLoading(false);
    } else {
      fetchQueue();
    }
  }, [propBookings]);

  const pendingRequests = bookings.filter((b) => b.status === 'PENDING_APPROVAL');
  const approvedAwaiting = bookings.filter((b) => b.status === 'APPROVED');
  const assignedAndActive = bookings.filter((b) => b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS');

  const displayedList =
    activeTab === 'pending'
      ? pendingRequests
      : activeTab === 'approved'
      ? approvedAwaiting
      : assignedAndActive;

  const handleApprove = async (id: string) => {
    try {
      setIsProcessingId(id);
      // 1. Immediately update local state optimistically
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'APPROVED' } : b))
      );
      // 2. Automatically switch to approved tab so admin sees it in assign queue right away
      setActiveTab('approved');
      // 3. Trigger approval in backend
      await onApprove(id);
      // 4. Fully sync data
      if (onRefreshQueue) {
        await onRefreshQueue();
      } else {
        await fetchQueue();
      }
    } catch (err) {
      console.error('Failed to approve booking', err);
      if (onRefreshQueue) await onRefreshQueue();
      else await fetchQueue();
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingBooking || !rejectReason.trim()) return;
    const targetId = rejectingBooking.id;
    const reason = rejectReason.trim();

    try {
      setIsProcessingId(targetId);
      // Optimistic update
      setBookings((prev) =>
        prev.map((b) =>
          b.id === targetId ? { ...b, status: 'REJECTED', rejectionReason: reason } : b
        )
      );
      setRejectingBooking(null);
      setRejectReason('');
      await onReject(targetId, reason);
      if (onRefreshQueue) {
        await onRefreshQueue();
      } else {
        await fetchQueue();
      }
    } catch (err) {
      console.error('Failed to reject booking', err);
      if (onRefreshQueue) await onRefreshQueue();
      else await fetchQueue();
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
            <img
              src="/assets/capital-emblem.png"
              alt="Capital Logo"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Review & Allocate Fleet Vehicles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review incoming staff booking requests, inspect mission requirements, and allocate fleet vehicles.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => (onRefreshQueue ? onRefreshQueue() : fetchQueue())}
          className="flex items-center gap-1.5"
          disabled={isLoading}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap min-w-0 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span>Pending Approval</span>
          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
            {pendingRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'approved'
              ? 'border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Assign Vehicle (Awaiting Allocation)</span>
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-bold">
            {approvedAwaiting.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'assigned'
              ? 'border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Assigned & Active Trips</span>
          <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold">
            {assignedAndActive.length}
          </span>
        </button>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {displayedList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 text-sm shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              No Booking Requests in this Queue
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {activeTab === 'pending'
                ? 'All incoming employee booking requests have been reviewed.'
                : activeTab === 'approved'
                ? 'All approved requests have already been allocated fleet vehicles.'
                : 'There are currently no active assigned trips in this queue.'}
            </p>
          </div>
        ) : (
          displayedList.map((b) => {
            const isExpanded = expandedIds.has(b.id);
            const calculateDuration = (start: string | Date | null | undefined, end: string | Date | null | undefined) => {
              if (!start || !end) return 'Flexible';
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
                return 'Flexible';
              }
            };
            const durationText = calculateDuration(b.departureAt, b.expectedReturnAt);

            return (
              <Card
                key={b.id}
                className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all dark:bg-slate-900 dark:border-slate-800 shadow-xs"
              >
                {/* 1. Card Header Strip */}
                <div className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-800 shadow-2xs">
                        {b.bookingReference}
                      </span>
                      <Badge status={b.status} size="sm" />
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Requested by</span>
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {b.requester?.name || 'Staff Member'}
                        </strong>
                        <span className="text-slate-400 dark:text-slate-500">
                          ({b.requester?.department?.name || 'Staff'})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {b.requiresDriver ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <UserIcon className="w-3 h-3 text-indigo-500" /> Driver Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Self-Driven
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <Users className="w-3 h-3 text-slate-400" /> {b.passengerCount} Passenger{b.passengerCount !== 1 ? 's' : ''}
                      </span>

                      {b.preferredVehicle && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Car className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Preferred: {b.preferredVehicle.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Main Card Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Destination */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center border border-brand-200 dark:border-brand-800/80 shrink-0 mt-0.5 shadow-2xs">
                      <MapPin className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        Trip Destination
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                        {b.destination}
                      </h3>
                    </div>
                  </div>

                  {/* Trip Purpose */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Trip Purpose & Operational Justification:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                      {b.purpose}
                    </p>
                  </div>

                  {/* Allocated Vehicle Card if already assigned */}
                  {(() => {
                    const assignment = b.currentAssignment || b.assignments?.[0];
                    const vehicle = assignment?.vehicle;
                    if (!vehicle) return null;
                    return (
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-lg bg-white dark:bg-slate-800 overflow-hidden border border-emerald-200 dark:border-emerald-700/60 shrink-0">
                            <img
                              src={
                                vehicle.imageUrl ||
                                (vehicle.category === 'SUV'
                                  ? '/vehicles/prado.png'
                                  : vehicle.category === 'PICKUP'
                                  ? '/vehicles/hilux.png'
                                  : vehicle.category === 'MINIBUS'
                                  ? '/vehicles/hiace.png'
                                  : '/vehicles/corolla.png')
                              }
                              alt={vehicle.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                              Allocated Fleet Vehicle:
                            </span>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {vehicle.name}
                            </span>
                            <span className="ml-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {vehicle.registrationNumber}
                            </span>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Assigned Driver</span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {assignment?.driverName || 'Self-Driven (Staff)'}
                          </strong>
                          {assignment?.driverPhone && (
                            <span className="text-[11px] font-mono text-slate-500 block">{assignment.driverPhone}</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Logistics Specifications Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                        Departure Schedule
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span className="truncate">{formatEthiopianDateTime(b.departureAt)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                        Expected Return Schedule
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{formatEthiopianDateTime(b.expectedReturnAt)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                        Trip Duration
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{durationText}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                        Requester Contact
                      </span>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1 truncate" title={b.requester?.email || 'N/A'}>
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{b.requester?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Expandable Drawer */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                            Submission Timestamp:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formatEthiopianDateTime(b.createdAt)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                            Department:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {b.requester?.department?.name || 'Capital Real Estate Staff'}
                          </span>
                        </div>
                      </div>
                      {b.additionalNotes && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                          <span className="text-slate-400 dark:text-slate-500 font-medium block text-[11px]">
                            Additional Operational Notes:
                          </span>
                          <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                            {b.additionalNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Action Footer Bar */}
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Left: Detail Inspection & Quick View Toggle */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectBooking(b)}
                      leftIcon={<Eye className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                      className="border-slate-300 dark:border-slate-700 hover:border-brand-500 font-semibold px-3.5 py-2 shadow-2xs text-slate-800 dark:text-slate-100"
                    >
                      View in Detail
                    </Button>

                    {onPrintForm && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintForm(b)}
                        leftIcon={<Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                        className="border-slate-300 dark:border-slate-700 hover:border-brand-500 font-semibold px-3 py-2 shadow-2xs text-slate-700 dark:text-slate-300"
                      >
                        Print Form
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(b.id)}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 mr-1" /> Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 mr-1" /> Show Details
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Right: Operational Actions (Receipt, Assign Vehicle, Approve, Reject) */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {activeTab === 'pending' && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectingBooking(b)}
                          leftIcon={<XCircle className="w-4 h-4" />}
                          className="px-3.5 py-2 font-medium"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          disabled={isProcessingId === b.id}
                          onClick={() => handleApprove(b.id)}
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                          className="px-4 py-2 font-semibold shadow-xs"
                        >
                          {isProcessingId === b.id ? 'Approving...' : 'Approve Request'}
                        </Button>
                      </>
                    )}

                    {activeTab === 'approved' && (
                      <>
                        {onOpenReceipt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenReceipt(b)}
                            leftIcon={<QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                            className="border-emerald-300 dark:border-emerald-700/80 text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-semibold px-3.5 py-2 shadow-2xs"
                          >
                            Digital Receipt & QR
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onAssignVehicle(b)}
                          leftIcon={<Car className="w-4 h-4" />}
                          rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                          className="font-bold px-4 py-2 shadow-sm"
                        >
                          Assign Fleet Vehicle
                        </Button>
                      </>
                    )}

                    {activeTab === 'assigned' && (
                      <>
                        {onOpenReceipt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenReceipt(b)}
                            leftIcon={<QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                            className="border-emerald-300 dark:border-emerald-700/80 text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-semibold px-3.5 py-2 shadow-2xs"
                          >
                            Digital Receipt & QR
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAssignVehicle(b)}
                          leftIcon={<Car className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                          className="border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 font-semibold px-3.5 py-2 shadow-2xs"
                        >
                          Change Vehicle Assignment
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Reject Request #{rejectingBooking.bookingReference}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please state why this request cannot be approved so the employee understands.
            </p>
            <textarea
              rows={3}
              required
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Insufficient fleet capacity during this window; please reschedule or request alternative time."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectingBooking(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmReject}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
