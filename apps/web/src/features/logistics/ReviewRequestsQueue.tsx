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
} from 'lucide-react';

interface ReviewRequestsQueueProps {
  currentUser: User;
  bookings?: Booking[];
  onRefreshQueue?: () => Promise<void>;
  onSelectBooking: (booking: Booking) => void;
  onAssignVehicle: (booking: Booking) => void;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string, reason: string) => Promise<void> | void;
  onOpenReceipt?: (booking: Booking) => void;
}

export const ReviewRequestsQueue: React.FC<ReviewRequestsQueueProps> = ({
  currentUser,
  bookings: propBookings,
  onRefreshQueue,
  onSelectBooking,
  onAssignVehicle,
  onApprove,
  onReject,
  onOpenReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [bookings, setBookings] = useState<Booking[]>(propBookings || []);
  const [isLoading, setIsLoading] = useState(!propBookings);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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
  const displayedList = activeTab === 'pending' ? pendingRequests : approvedAwaiting;

  const handleApprove = async (id: string) => {
    try {
      setIsProcessingId(id);
      // 1. Immediately update local state optimistically
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'APPROVED' } : b))
      );
      // 2. Automatically switch to approved tab so admin sees it right away
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Logistics Review & Allocation Queue</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review incoming employee requests, inspect operational requirements, and allocate fleet vehicles.
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
      <div className="flex border-b border-slate-200 dark:border-slate-800">
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
          <span>Approved (Awaiting Assignment)</span>
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-bold">
            {approvedAwaiting.length}
          </span>
        </button>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {displayedList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 text-sm">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            No booking requests in this queue right now.
          </div>
        ) : (
          displayedList.map((b) => {
            const isExpanded = expandedIds.has(b.id);

            return (
              <Card
                key={b.id}
                className="overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all dark:bg-slate-900 dark:border-slate-800 shadow-xs"
              >
                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 rounded border border-brand-200 dark:border-brand-800">
                        {b.bookingReference}
                      </span>
                      <Badge status={b.status} size="sm" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Requested by <strong className="text-slate-800 dark:text-slate-200">{b.requester?.name}</strong> (
                        {b.requester?.department?.name || 'Staff'})
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{b.destination}</h3>
                      </div>
                      <p
                        className={`text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed ${
                          isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
                        }`}
                      >
                        {b.purpose}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Dep: <strong>{formatEthiopianDateTime(b.departureAt)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Ret: <strong>{formatEthiopianDateTime(b.expectedReturnAt)}</strong>
                      </span>
                      <span>Passengers: <strong>{b.passengerCount}</strong></span>
                      {b.requiresDriver && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          Driver Required
                        </span>
                      )}
                      {b.preferredVehicle && (
                        <span className="text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          Pref: {b.preferredVehicle.name}
                        </span>
                      )}
                    </div>

                    {/* Inline Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 font-medium block">Requester Contact:</span>
                            <span className="font-medium">{b.requester?.email || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 font-medium block">Submission Date:</span>
                            <span>{formatEthiopianDateTime(b.createdAt)}</span>
                          </div>
                        </div>
                        {b.additionalNotes && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                            <span className="text-slate-400 dark:text-slate-500 font-medium block">Additional Notes:</span>
                            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200 mt-0.5">
                              {b.additionalNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Queue Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(b.id)}
                      className="text-xs text-slate-600 dark:text-slate-300"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 mr-1" /> Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 mr-1" /> Quick View
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectBooking(b)}
                      leftIcon={<Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                      className="border-slate-300 dark:border-slate-700 hover:border-brand-500 font-semibold"
                    >
                      View in Detail
                    </Button>

                    {activeTab === 'pending' && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectingBooking(b)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          disabled={isProcessingId === b.id}
                          onClick={() => handleApprove(b.id)}
                        >
                          {isProcessingId === b.id ? 'Approving...' : 'Approve'}
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
                            leftIcon={<QrCode className="w-3.5 h-3.5 text-emerald-600" />}
                            className="border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            Receipt
                          </Button>
                        )}
                        <Button variant="primary" size="sm" onClick={() => onAssignVehicle(b)}>
                          Assign Vehicle
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
