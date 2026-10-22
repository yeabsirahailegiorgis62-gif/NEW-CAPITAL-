import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Booking, User, Vehicle } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PrintableTransportFormModal } from '@/features/bookings/PrintableTransportFormModal';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
import {
  PlusCircle,
  Clock,
  Car,
  CheckCircle2,
  Calendar,
  MapPin,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Compass,
  RotateCcw,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Users,
  QrCode,
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: User;
  onNewBookingClick: () => void;
  onOpenBooking: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onNavigateTab: (tab: string) => void;
}

const ITEMS_PER_PAGE = 5;

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  onNewBookingClick,
  onOpenBooking,
  onOpenReceipt,
  onNavigateTab,
}) => {
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Repeat last request modal state
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isSubmittingRepeat, setIsSubmittingRepeat] = useState(false);
  const [repeatSuccessMessage, setRepeatSuccessMessage] = useState<string | null>(null);

  // Printable Form Modal state
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState<Booking | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, vehiclesData] = await Promise.all([
        api.getBookings(),
        api.getVehicles(),
      ]);
      setMyBookings(bookingsData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Failed to load employee dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingBookings = myBookings.filter((b) => b.status === 'PENDING_APPROVAL');
  const approvedBookings = myBookings.filter((b) => b.status === 'APPROVED');
  const activeBookings = myBookings.filter((b) => b.status === 'IN_PROGRESS');
  const assignedBookings = myBookings.filter(
    (b) => b.status === 'ASSIGNED' || (b.status === 'APPROVED' && b.assignments && b.assignments.length > 0)
  );
  const completedBookings = myBookings.filter((b) => b.status === 'COMPLETED');

  // Most recent request for repeating
  const lastRequest = myBookings.length > 0 ? myBookings[0] : null;

  // Calculate requests created this week vs previous
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const requestsThisWeek = myBookings.filter(
    (b) => new Date(b.createdAt) >= oneWeekAgo
  ).length;

  // Pagination for Recent Requests
  const totalPages = Math.max(1, Math.ceil(myBookings.length / ITEMS_PER_PAGE));
  const paginatedRequests = myBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Compute repeated request timestamps (+7 days)
  const getRepeatedTimes = (orig: Booking) => {
    const origDep = new Date(orig.departureAt);
    const origRet = new Date(orig.expectedReturnAt);
    const newDep = new Date(origDep.getTime() + 7 * 24 * 60 * 60 * 1000);
    const newRet = new Date(origRet.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      newDepISO: newDep.toISOString(),
      newRetISO: newRet.toISOString(),
      newDepFormatted: formatEthiopianDateTime(newDep),
      newRetFormatted: formatEthiopianDateTime(newRet),
    };
  };

  const handleConfirmRepeat = async () => {
    if (!lastRequest) return;
    try {
      setIsSubmittingRepeat(true);
      const { newDepISO, newRetISO } = getRepeatedTimes(lastRequest);

      await api.createBooking({
        destination: lastRequest.destination,
        purpose: lastRequest.purpose,
        departureAt: newDepISO,
        expectedReturnAt: newRetISO,
        passengerCount: lastRequest.passengerCount,
        requiresDriver: lastRequest.requiresDriver,
        preferredVehicleId: lastRequest.preferredVehicleId || undefined,
        additionalNotes: `[Repeated Request] Based on ${lastRequest.bookingReference}`,
      });

      setRepeatSuccessMessage('Repeated last request successfully scheduled for next week!');
      setIsRepeatModalOpen(false);
      await loadData();
      setTimeout(() => setRepeatSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Failed to repeat request: ${err.message || err}`);
    } finally {
      setIsSubmittingRepeat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {repeatSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between text-sm shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{repeatSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setRepeatSuccessMessage(null)}
            className="text-xs font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Welcome Banner / Department Overview ── */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/5 dark:bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Department Portal
            </span>
            <span className="text-xs font-mono text-slate-400">
              {(currentUser.department as any)?.code || 'CORP'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Welcome back, {currentUser.name?.split(' ')[0] || 'User'}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your department (
            <strong className="text-slate-900 dark:text-white font-semibold">
              {currentUser.department?.name || 'Capital Real Estate'}
            </strong>
            ) has{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-bold">
              {pendingBookings.length} pending
            </strong>{' '}
            transport requests.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto z-10">
          {lastRequest && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRepeatModalOpen(true)}
              leftIcon={<RotateCcw className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Repeat last request
            </Button>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={onNewBookingClick}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="shadow-md shadow-brand-500/20"
          >
            New Request
          </Button>
        </div>
      </div>

      {/* ── Repeat Last Request Modal ── */}
      {lastRequest && (
        <Modal
          isOpen={isRepeatModalOpen}
          onClose={() => setIsRepeatModalOpen(false)}
          title="Repeat this request?"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A new transport requisition will be created automatically based on your previous trip:
            </p>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 text-xs space-y-2 font-medium">
              <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{lastRequest.destination}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Purpose:</span>
                <span className="text-slate-900 dark:text-white text-right max-w-xs">{lastRequest.purpose}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">Passengers:</span>
                <span className="font-bold text-slate-900 dark:text-white">{lastRequest.passengerCount} passengers</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">New Departure:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {getRepeatedTimes(lastRequest).newDepFormatted}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500">New Return:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {getRepeatedTimes(lastRequest).newRetFormatted}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                <span>New Dates:</span>
                <span>Exactly 7 days later than original</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              The new request will be submitted immediately and queued for logistics dispatch review.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRepeatModalOpen(false)}
                disabled={isSubmittingRepeat}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRepeat}
                isLoading={isSubmittingRepeat}
              >
                Confirm repeat
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── KPI Stat Metrics: "Your Activity" ── */}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Your Activity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Requests */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Requests
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {myBookings.length}
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {requestsThisWeek > 0 ? `+${requestsThisWeek} this week` : '0 this week'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Pending Review */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-800 transition-all flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Pending Review
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {pendingBookings.length}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Under review by logistics
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/80 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Approved */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Approved
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {approvedBookings.length}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Approved requisitions
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/80 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Vehicle Assigned */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                Vehicle Assigned
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                {assignedBookings.length}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Chauffeur & car ready
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800/80 shrink-0">
              <Car className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Trip Banner (if currently dispatched) ── */}
      {activeBookings.length > 0 && (
        <Card className="border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/80 dark:from-emerald-950/30 to-white dark:to-slate-900 shadow-md">
          <CardHeader className="border-emerald-200/60 dark:border-emerald-800/60 pb-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Active Dispatch In Progress
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => onOpenBooking(b)}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      {b.bookingReference}
                    </span>
                    <Badge status="IN_PROGRESS" size="sm" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mt-1 text-base">{b.destination}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Vehicle: <strong className="text-slate-900 dark:text-slate-100">{b.assignments?.[0]?.vehicle?.name}</strong> ({b.assignments?.[0]?.vehicle?.registrationNumber}) · Driver: {b.assignments?.[0]?.driverName || 'Authorized Staff'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVoucherBooking(b);
                    }}
                    leftIcon={<Printer className="w-3.5 h-3.5 text-slate-600" />}
                  >
                    Print Voucher
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => onOpenBooking(b)}>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Section: Recent Requests (with Pagination & Table) ── */}
      <section className="pt-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Recent Requests
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your official transport requisitions, status progress, and vouchers
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab('my-bookings')}
            className="text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
            rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
          >
            View all history
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading your transport requisitions...
            </div>
          ) : myBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-900 dark:text-white text-base">No requests yet</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Submit your first daily or weekly transport request to get started.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={onNewBookingClick}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Create Request
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Table View */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4">Request #</th>
                      <th className="py-3.5 px-4">Requisition Type</th>
                      <th className="py-3.5 px-4">Destination & Purpose</th>
                      <th className="py-3.5 px-4">Departure & Passengers</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {paginatedRequests.map((b) => {
                      const isWeekly = (() => {
                        try {
                          const dep = new Date(b.departureAt).getTime();
                          const ret = new Date(b.expectedReturnAt).getTime();
                          return ret - dep > 24 * 60 * 60 * 1000;
                        } catch {
                          return false;
                        }
                      })();

                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                              {b.bookingReference}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                              {formatEthiopianDateOnly(b.createdAt)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {isWeekly ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Weekly Program
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Daily Requisition
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{b.destination}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] block mt-0.5">
                              {b.purpose}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                            <div>{formatEthiopianDateTime(b.departureAt)}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              {b.passengerCount} {b.passengerCount === 1 ? 'passenger' : 'passengers'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <Badge status={b.status} size="sm" />
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {onOpenReceipt &&
                              (b.status === 'APPROVED' ||
                                b.status === 'ASSIGNED' ||
                                b.status === 'IN_PROGRESS' ||
                                b.status === 'COMPLETED') && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenReceipt(b);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-2xs mr-1.5"
                                  title="View official digital receipt & QR pass"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Receipt</span>
                                </button>
                              )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedVoucherBooking(b)}
                              title="Print A4 Transport Voucher"
                              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 mr-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenBooking(b)}
                            >
                              Open
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, myBookings.length)} of {myBookings.length} requests
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    >
                      Previous
                    </Button>

                    <span className="px-3 py-1 font-bold font-mono text-slate-900 dark:text-white">
                      {currentPage} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Printable Transport Form Modal ── */}
      <PrintableTransportFormModal
        isOpen={!!selectedVoucherBooking}
        onClose={() => setSelectedVoucherBooking(null)}
        booking={selectedVoucherBooking}
      />
    </div>
  );
};
