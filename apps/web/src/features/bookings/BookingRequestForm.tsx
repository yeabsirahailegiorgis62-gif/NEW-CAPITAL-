import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import { Vehicle, Booking } from '@/types';
import { formatEthiopianDateTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import {
  MapPin,
  Calendar,
  Users,
  Car,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle,
  ClipboardList,
  Shield,
  Fuel,
  Info,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
  PhoneCall,
  QrCode,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface BookingRequestFormProps {
  onSuccess: (booking: Booking) => void;
  onCancel: () => void;
  onOpenReceipt?: (booking: Booking) => void;
  onPrintForm?: (booking: Booking) => void;
}

const WEEKDAYS = [
  { key: 'MONDAY', label: 'Monday', dayOffset: 0 },
  { key: 'TUESDAY', label: 'Tuesday', dayOffset: 1 },
  { key: 'WEDNESDAY', label: 'Wednesday', dayOffset: 2 },
  { key: 'THURSDAY', label: 'Thursday', dayOffset: 3 },
  { key: 'FRIDAY', label: 'Friday', dayOffset: 4 },
  { key: 'SATURDAY', label: 'Saturday', dayOffset: 5 },
  { key: 'SUNDAY', label: 'Sunday', dayOffset: 6 },
] as const;

function getUpcomingMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + ((8 - day) % 7 || 7);
  const nextMon = new Date(d.setDate(diff));
  return nextMon.toISOString().split('T')[0];
}

function getDayDateStr(startDateStr: string, offset: number): string {
  try {
    const d = new Date(`${startDateStr}T00:00:00`);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export const BookingRequestForm: React.FC<BookingRequestFormProps> = ({
  onSuccess,
  onCancel,
  onOpenReceipt,
  onPrintForm,
}) => {
  const toast = useToast();
  const [requestType, setRequestType] = useState<'daily' | 'weekly'>('daily');
  const [pickupLocation, setPickupLocation] = useState('Capital Real Estate HQ, Bole Tower');
  const [contactPhone, setContactPhone] = useState('+251 91 123 4567');
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('08:30');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('17:00');
  const [dailyTimeSlot, setDailyTimeSlot] = useState<'MORNING' | 'AFTERNOON' | 'CUSTOM'>('MORNING');
  const [passengerCount, setPassengerCount] = useState(1);
  const [preferredVehicleId, setPreferredVehicleId] = useState('');
  const [requiresDriver, setRequiresDriver] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Weekly Scheduling State
  const [weekStartDate, setWeekStartDate] = useState(getUpcomingMonday);
  const [weeklyDaysSchedule, setWeeklyDaysSchedule] = useState<
    Record<string, { selected: boolean; timeSlot: 'MORNING' | 'AFTERNOON'; notes?: string }>
  >({
    MONDAY: { selected: true, timeSlot: 'MORNING' },
    TUESDAY: { selected: true, timeSlot: 'AFTERNOON' },
    WEDNESDAY: { selected: false, timeSlot: 'MORNING' },
    THURSDAY: { selected: true, timeSlot: 'MORNING' },
    FRIDAY: { selected: false, timeSlot: 'MORNING' },
    SATURDAY: { selected: false, timeSlot: 'MORNING' },
    SUNDAY: { selected: false, timeSlot: 'MORNING' },
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'VIP'>('NORMAL');
  const [passengerDetails, setPassengerDetails] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);

  const noticeHours = (() => {
    if (!departureDate || !departureTime) return 0;
    try {
      const dep = new Date(`${departureDate}T${departureTime}:00`).getTime();
      const now = Date.now();
      return Math.max(0, (dep - now) / (1000 * 60 * 60));
    } catch {
      return 0;
    }
  })();

  const requiredNotice = requestType === 'weekly' ? 72 : 24;
  const isNoticeCompliant = noticeHours >= requiredNotice;

  // Initialize dates to tomorrow by default
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setDepartureDate(dateStr);
    setReturnDate(dateStr);

    // Fetch operational vehicles for optional preference
    api.getVehicles({ status: 'ACTIVE' }).then(setVehicles).catch(console.error);
  }, []);

  const DRAFT_KEY = 'capital_transport_request_draft';

  // Restore draft on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.destination) setDestination(d.destination);
        if (d.purpose) setPurpose(d.purpose);
        if (d.requestType) setRequestType(d.requestType);
        if (d.passengerCount) setPassengerCount(d.passengerCount);
        if (d.preferredVehicleId) setPreferredVehicleId(d.preferredVehicleId);
        if (typeof d.requiresDriver === 'boolean') setRequiresDriver(d.requiresDriver);
        if (d.additionalNotes) setAdditionalNotes(d.additionalNotes);
        if (d.departureTime) setDepartureTime(d.departureTime);
        if (d.returnTime) setReturnTime(d.returnTime);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save draft on changes
  useEffect(() => {
    if (destination || purpose || additionalNotes) {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            destination,
            purpose,
            requestType,
            passengerCount,
            preferredVehicleId,
            requiresDriver,
            additionalNotes,
            departureTime,
            returnTime,
          })
        );
      } catch {
        // ignore
      }
    }
  }, [
    destination,
    purpose,
    requestType,
    passengerCount,
    preferredVehicleId,
    requiresDriver,
    additionalNotes,
    departureTime,
    returnTime,
  ]);

  // Duplicate request detection advisory
  useEffect(() => {
    if (departureDate && destination.trim().length >= 3) {
      const timer = setTimeout(() => {
        setIsCheckingDuplicate(true);
        api.checkDuplicate({
          tripDate: departureDate,
          destination: destination.trim(),
          departureTime: departureTime || undefined,
        })
          .then((res) => {
            setDuplicateMatches(res.matches || []);
          })
          .catch(() => setDuplicateMatches([]))
          .finally(() => setIsCheckingDuplicate(false));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDuplicateMatches([]);
    }
  }, [departureDate, destination, departureTime]);

  // Compute trip duration summary
  const getScheduleSummary = () => {
    if (!departureDate || !returnDate) return null;
    const dep = new Date(`${departureDate}T${departureTime}:00`);
    const ret = new Date(`${returnDate}T${returnTime}:00`);
    const diffHours = (ret.getTime() - dep.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 0) return 'Invalid return time';
    if (departureDate === returnDate) {
      return `Same Day · ${diffHours.toFixed(1)} Hours`;
    }
    const days = Math.ceil(diffHours / 24);
    return `${days} Days · ${diffHours.toFixed(0)} Hours`;
  };

  const selectedVehicle = vehicles.find((v) => v.id === preferredVehicleId);
  const isFormValid = destination.trim().length > 0 && purpose.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!destination.trim()) {
      setError('Destination is required.');
      return;
    }
    if (!purpose.trim()) {
      setError('Trip purpose is required.');
      return;
    }
    if (passengerCount < 1) {
      setError('At least 1 passenger is required.');
      return;
    }

    let departureIso: string;
    let returnIso: string;
    let weeklyDaysPayload:
      | Array<{ dayOfWeek: string; tripDate: string; timeSlot: 'MORNING' | 'AFTERNOON'; notes?: string }>
      | undefined = undefined;

    if (requestType === 'weekly') {
      const selectedEntries = WEEKDAYS.filter((w) => weeklyDaysSchedule[w.key]?.selected);
      if (selectedEntries.length === 0) {
        setError('Please select at least one day of the week for your weekly schedule.');
        return;
      }

      weeklyDaysPayload = selectedEntries.map((w) => {
        const d = new Date(`${weekStartDate}T00:00:00`);
        d.setDate(d.getDate() + w.dayOffset);
        return {
          dayOfWeek: w.key,
          tripDate: d.toISOString(),
          timeSlot: weeklyDaysSchedule[w.key].timeSlot,
          notes: weeklyDaysSchedule[w.key].notes || undefined,
        };
      });

      const firstEntry = weeklyDaysPayload[0];
      const lastEntry = weeklyDaysPayload[weeklyDaysPayload.length - 1];

      const firstDate = new Date(firstEntry.tripDate);
      firstDate.setHours(firstEntry.timeSlot === 'MORNING' ? 8 : 13, 30, 0, 0);
      departureIso = firstDate.toISOString();

      const lastDate = new Date(lastEntry.tripDate);
      lastDate.setHours(lastEntry.timeSlot === 'MORNING' ? 12 : 17, 30, 0, 0);
      returnIso = lastDate.toISOString();
    } else {
      departureIso = new Date(`${departureDate}T${departureTime}:00`).toISOString();
      returnIso = new Date(`${returnDate}T${returnTime}:00`).toISOString();

      const depTime = new Date(departureIso).getTime();
      const retTime = new Date(returnIso).getTime();
      const now = new Date().getTime();

      if (depTime < now) {
        setError('Departure time cannot be in the past.');
        return;
      }

      if (depTime >= retTime) {
        setError('Departure time must be earlier than the expected return time.');
        return;
      }
    }

    try {
      setIsLoading(true);
      const booking = await api.createBooking({
        destination: destination.trim(),
        purpose: purpose.trim(),
        departureAt: departureIso,
        expectedReturnAt: returnIso,
        passengerCount,
        requestType: requestType === 'weekly' ? 'WEEKLY' : 'DAILY',
        pickupLocation: pickupLocation.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        weeklyDays: weeklyDaysPayload,
        preferredVehicleId: preferredVehicleId || undefined,
        requiresDriver,
        additionalNotes: additionalNotes.trim() || undefined,
        priority,
        passengerDetails: passengerDetails.trim() || undefined,
        documentUrl: documentUrl.trim() || undefined,
      });

      setSubmittedBooking(booking);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      toast.success(
        'Request submitted!',
        `Booking ${booking.bookingReference} is now pending Logistics review.`
      );
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit booking request. Please check inputs.';
      setError(msg);
      toast.error('Booking Submission Failed', msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  // State for post-submission QR code
  const [ticketQrData, setTicketQrData] = useState<string>('');
  const [ticketCopied, setTicketCopied] = useState(false);

  useEffect(() => {
    if (submittedBooking?.bookingReference) {
      const url = `${window.location.origin}/?verify=${encodeURIComponent(
        submittedBooking.bookingReference
      )}`;
      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then(setTicketQrData)
        .catch(console.error);
    }
  }, [submittedBooking?.bookingReference]);

  // Show executive reservation ticket after submission
  if (submittedBooking) {
    const preferredVeh = vehicles.find((v) => v.id === submittedBooking.preferredVehicleId);

    return (
      <div className="max-w-4xl mx-auto py-4 space-y-6 animate-scaleIn">
        {/* Top Status Notification Bar */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                Trip Reservation Requisition Confirmed
              </h2>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                Your booking request is logged in the Logistics Queue. Review your official reservation pass below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black bg-emerald-600 text-white px-3 py-1 rounded-full shadow-xs">
              #{submittedBooking.bookingReference}
            </span>
          </div>
        </div>

        {/* ── Corporate Reservation Ticket Pass ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          {/* Ticket Header Letterhead */}
          <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-xs shrink-0">
                <img
                  src="/assets/capital-emblem.png"
                  alt="Capital Real Estate & Apartment"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white uppercase leading-none">
                  Capital Real Estate & Apartment
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Logistics & Fleet Operations • Requisition Ticket
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Pending Logistics Review
              </span>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Issued: {formatEthiopianDateTime(submittedBooking.createdAt || new Date().toISOString())}
              </div>
            </div>
          </div>

          {/* Ticket Body: 2-Column Split (Voucher details & QR Pass Stub) */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Left 2 Cols: Requisition Details */}
            <div className="p-6 sm:p-7 md:col-span-2 space-y-5">
              {/* Route Display */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Transit Route & Destination
                </span>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <span className="text-slate-500 dark:text-slate-400">Capital HQ (Addis Ababa)</span>
                  <ArrowRight className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="text-brand-700 dark:text-brand-400 flex items-center gap-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {submittedBooking.destination}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                  "{submittedBooking.purpose}"
                </p>
              </div>

              {/* Itinerary Schedule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Departure Schedule (EAT)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    {formatEthiopianDateTime(submittedBooking.departureAt)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Expected Return (EAT)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    {formatEthiopianDateTime(submittedBooking.expectedReturnAt)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Party Size & Passengers
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {submittedBooking.passengerCount} Passenger{submittedBooking.passengerCount > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Driver Assignment
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                    {submittedBooking.requiresDriver ? 'Company Driver Requested' : 'Authorized Self-Drive'}
                  </span>
                </div>
              </div>

              {/* Requested Vehicle Preview if selected */}
              {preferredVeh && (
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Car className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        Preferred Vehicle: {preferredVeh.make} {preferredVeh.model} ({preferredVeh.name})
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Category: {preferredVeh.category} • Capacity: {preferredVeh.passengerCapacity} Seats
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded">
                    {preferredVeh.registrationNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Right 1 Col: Scannable Security Pass Stub */}
            <div className="p-6 sm:p-7 bg-slate-50/80 dark:bg-slate-950/50 flex flex-col items-center justify-between text-center space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Security Pass Stub
                </span>
                <span className="text-xs font-mono font-black text-slate-900 dark:text-white block mt-0.5">
                  #{submittedBooking.bookingReference}
                </span>
              </div>

              {/* Styled QR Code Card with Viewfinder Reticles */}
              <div className="relative p-3 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-brand-600 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-brand-600 rounded-tr-sm pointer-events-none" />
                <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-brand-600 rounded-bl-sm pointer-events-none" />
                <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-brand-600 rounded-br-sm pointer-events-none" />

                {ticketQrData ? (
                  <div className="relative">
                    <img
                      src={ticketQrData}
                      alt={`QR code for ${submittedBooking.bookingReference}`}
                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-white p-1 shadow-md border border-slate-300 flex items-center justify-center">
                        <img
                          src="/assets/capital-emblem.png"
                          alt="Capital"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-slate-300">
                    <QrCode className="w-12 h-12 animate-pulse" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px] leading-tight">
                  Anyone can scan this QR code with a phone camera to verify this pass.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/?verify=${encodeURIComponent(
                      submittedBooking.bookingReference
                    )}`;
                    navigator.clipboard.writeText(url);
                    setTicketCopied(true);
                    setTimeout(() => setTicketCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-1"
                >
                  {ticketCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied Verification URL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Verification Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Ticket Footer Actions */}
          <div className="p-5 bg-slate-100/70 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onOpenReceipt && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onOpenReceipt(submittedBooking)}
                  leftIcon={<QrCode className="w-4 h-4" />}
                  className="font-bold bg-brand-600 hover:bg-brand-700 text-white w-full sm:w-auto shadow-sm"
                >
                  View Digital Receipt & QR Pass
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={() => (onPrintForm ? onPrintForm(submittedBooking) : window.print())}
                leftIcon={<Printer className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                className="hidden sm:inline-flex font-semibold border-slate-300 dark:border-slate-700"
              >
                Print Official Requisition Form
              </Button>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSubmittedBooking(null);
                  setDestination('');
                  setPurpose('');
                  setAdditionalNotes('');
                  setPreferredVehicleId('');
                  setRequiresDriver(false);
                  setPassengerCount(1);
                }}
                className="w-full sm:w-auto"
              >
                Submit Another Request
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => onSuccess(submittedBooking)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Go to My Trips
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
              Logistics Requisition
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Corporate Fleet Reservation
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Request a Company Vehicle
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Fill in the 3 sections below. Once submitted, the Logistics Department will allocate an active vehicle and issue your digital QR receipt.
          </p>
        </div>

        {/* Visual Step Progress Strip */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
            A. Itinerary
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            B. Vehicle
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            C. Policy & Notes
          </span>
        </div>
      </div>

      {error && (
        <Alert type="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Transport Request Protocol Selector & Notice Engine ── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2">
            Requisition Protocol:
          </span>
          <button
            type="button"
            onClick={() => {
              setRequestType('daily');
              if (departureDate) setReturnDate(departureDate);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              requestType === 'daily'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Request (Single-Day / Urgent)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRequestType('weekly');
              if (departureDate) {
                const d = new Date(departureDate);
                d.setDate(d.getDate() + 4);
                setReturnDate(d.toISOString().split('T')[0]);
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              requestType === 'weekly'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Weekly Request (Multi-Day Itinerary)</span>
          </button>
        </div>

        {/* Notice Period Rule Status */}
        <div className="flex items-center gap-2.5 text-xs">
          {isNoticeCompliant ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Notice Satisfied ({Math.round(noticeHours)}h advance vs {requiredNotice}h standard)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Notice Alert: {Math.round(noticeHours)}h advance (Standard: {requiredNotice}h) · Expedited Review
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main 3-Column Layout on Desktop */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION A: Trip & Schedule Details                        */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="flex flex-col h-full">
            <Card className="flex-1 flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
                        Section A · Step 1
                      </span>
                      <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Trip Details & Schedule
                      </CardTitle>
                    </div>
                  </div>
                  {getScheduleSummary() && (
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {getScheduleSummary()}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      id="pickupLocation"
                      label="Pickup Location / Site"
                      placeholder="e.g. Head Office Main Gate, Bole"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      id="contactPhone"
                      label="Contact Phone Number"
                      placeholder="e.g. +251 911 234567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Input
                      id="destination"
                      label="Destination & Project Site"
                      required
                      placeholder="e.g. Bole Bulbula Project Site No. 4, Addis Ababa"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      disabled={isLoading}
                    />

                    {/* Duplicate Detection Warning Banner */}
                    {duplicateMatches.length > 0 && (
                      <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Potential Duplicate Trip Alert</span>
                        </div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                          You already have {duplicateMatches.length} existing booking on {departureDate} ({duplicateMatches.map((m: any) => `#${m.bookingReference}`).join(', ')}). Multiple trips are permitted, but please confirm this is an intentional separate mission.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Priority Level */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      Request Priority Level:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['NORMAL', 'HIGH', 'VIP'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                            priority === p
                              ? p === 'VIP'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : p === 'HIGH'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-brand-600 text-white border-brand-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {p === 'VIP' ? 'Executive / VIP' : p === 'HIGH' ? 'High Priority' : 'Standard'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="purpose"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Trip Purpose & Scope <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="purpose"
                      required
                      rows={2}
                      className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                      placeholder="e.g. Structural inspection, client site walkthrough, and project milestone review"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Conditional Schedule: Daily Request vs. Weekly Request */}
                  {requestType === 'daily' ? (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-brand-600" />
                          <span>Daily Time Window</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => {
                              setDailyTimeSlot('MORNING');
                              setDepartureTime('08:30');
                              setReturnTime('12:30');
                            }}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                              dailyTimeSlot === 'MORNING'
                                ? 'bg-brand-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            Morning (08:30)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDailyTimeSlot('AFTERNOON');
                              setDepartureTime('13:30');
                              setReturnTime('17:30');
                            }}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                              dailyTimeSlot === 'AFTERNOON'
                                ? 'bg-brand-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            Afternoon (13:30)
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          id="departureDate"
                          label="Trip Date"
                          type="date"
                          required
                          value={departureDate}
                          onChange={(e) => {
                            setDepartureDate(e.target.value);
                            setReturnDate(e.target.value);
                          }}
                          disabled={isLoading}
                        />
                        <Input
                          id="departureTime"
                          label="Departure Time"
                          type="time"
                          required
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Input
                          id="returnDate"
                          label="Return Date"
                          type="date"
                          required
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          disabled={isLoading}
                        />
                        <Input
                          id="returnTime"
                          label="Return Time"
                          type="time"
                          required
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Weekly Request dedicated scheduling section */
                    <div className="p-3.5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/80 dark:border-brand-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 dark:text-brand-200">
                          <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                          <span>Weekly Schedule (Monday – Sunday)</span>
                        </div>
                        <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300">
                          {WEEKDAYS.filter((w) => weeklyDaysSchedule[w.key]?.selected).length} Days Selected
                        </span>
                      </div>

                      <div>
                        <Input
                          id="weekStartDate"
                          label="Week Start Date (Monday)"
                          type="date"
                          required
                          value={weekStartDate}
                          onChange={(e) => setWeekStartDate(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Select Operating Days & Time Slot:
                        </label>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {WEEKDAYS.map((day) => {
                            const isChecked = weeklyDaysSchedule[day.key]?.selected || false;
                            const slot = weeklyDaysSchedule[day.key]?.timeSlot || 'MORNING';

                            // calculate specific date for this day
                            const targetDate = new Date(`${weekStartDate}T00:00:00`);
                            targetDate.setDate(targetDate.getDate() + day.dayOffset);
                            const formattedDate = targetDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            });

                            return (
                              <div
                                key={day.key}
                                className={`flex items-center justify-between p-2 rounded-xl border transition-all text-xs ${
                                  isChecked
                                    ? 'bg-white dark:bg-slate-800 border-brand-300 dark:border-brand-700 shadow-xs'
                                    : 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                                }`}
                              >
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setWeeklyDaysSchedule((prev) => ({
                                        ...prev,
                                        [day.key]: {
                                          ...prev[day.key],
                                          selected: checked,
                                        },
                                      }));
                                    }}
                                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                                  />
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {day.label}
                                    </span>
                                    <span className="ml-1.5 text-[10px] text-slate-400">
                                      ({formattedDate})
                                    </span>
                                  </div>
                                </label>

                                <div className="flex items-center gap-1">
                                  <select
                                    disabled={!isChecked || isLoading}
                                    value={slot}
                                    onChange={(e) => {
                                      const val = e.target.value as 'MORNING' | 'AFTERNOON';
                                      setWeeklyDaysSchedule((prev) => ({
                                        ...prev,
                                        [day.key]: {
                                          ...prev[day.key],
                                          timeSlot: val,
                                        },
                                      }));
                                    }}
                                    className={`text-[11px] font-semibold py-1 px-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors ${
                                      isChecked
                                        ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                                        : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <option value="MORNING">Morning (08:30 – 12:30)</option>
                                    <option value="AFTERNOON">Afternoon (13:30 – 17:30)</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {requestType === 'weekly'
                      ? 'Logistics will assign vehicles and drivers for each approved weekday individually.'
                      : 'Departure must be scheduled strictly in the future.'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION B: Vehicle Requirements & Preference              */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="flex flex-col h-full">
            <Card className="flex-1 flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                        Section B · Step 2
                      </span>
                      <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Vehicle Selection & Capacity
                      </CardTitle>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {passengerCount} Seat{passengerCount > 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Passenger Counter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                      Number of Passengers <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassengerCount((prev) => Math.max(1, prev - 1))}
                        disabled={passengerCount <= 1 || isLoading}
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors disabled:opacity-40"
                        aria-label="Decrease passenger count"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 relative">
                        <input
                          id="passengers"
                          type="number"
                          min={1}
                          max={30}
                          required
                          value={passengerCount}
                          onChange={(e) => setPassengerCount(parseInt(e.target.value, 10) || 1)}
                          className="w-full text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          disabled={isLoading}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setPassengerCount((prev) => Math.min(30, prev + 1))}
                        disabled={passengerCount >= 30 || isLoading}
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors disabled:opacity-40"
                        aria-label="Increase passenger count"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Choice Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Model Preference (Optional)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {vehicles.length} Active in fleet
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {/* Option: Auto-Allocate (Optimal) */}
                      <div
                        onClick={() => setPreferredVehicleId('')}
                        className={`cursor-pointer rounded-2xl border p-3 transition-all flex items-center justify-between ${
                          !preferredVehicleId
                            ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/60 dark:bg-brand-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                Auto-Allocate (Optimal)
                              </span>
                              <span className="text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                                Recommended
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                              Logistics assigns the best available vehicle for route & passenger size.
                            </p>
                          </div>
                        </div>

                        {!preferredVehicleId && (
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-brand-600/20 shrink-0 ml-2" />
                        )}
                      </div>

                      {/* Specific Fleet Vehicle Items */}
                      {vehicles.map((v) => {
                        const isSelected = preferredVehicleId === v.id;
                        const carImg =
                          v.imageUrl ||
                          (v.category === 'SUV'
                            ? '/vehicles/prado.png'
                            : v.category === 'PICKUP'
                            ? ((v.name + ' ' + (v.model || '')).toLowerCase().includes('ranger')
                              ? '/vehicles/ranger.png'
                              : (v.name + ' ' + (v.model || '')).toLowerCase().includes('d-max') || (v.name + ' ' + (v.model || '')).toLowerCase().includes('dmax')
                              ? '/vehicles/dmax.png'
                              : '/vehicles/hilux.png')
                            : v.category === 'MINIBUS'
                            ? '/vehicles/hiace.png'
                            : '/vehicles/corolla.png');

                        return (
                          <div
                            key={v.id}
                            onClick={() => setPreferredVehicleId(v.id)}
                            className={`cursor-pointer rounded-2xl border p-2.5 transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/40 dark:bg-brand-950/40 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-14 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img
                                  src={carImg}
                                  alt={v.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {v.name}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span className="font-mono">{v.registrationNumber}</span>
                                  <span>•</span>
                                  <span>{v.passengerCapacity} Seats</span>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-semibold">
                                    {v.fuelLevel ? `${v.fuelLevel}% Fuel` : 'Ready'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-brand-600/20 shrink-0 ml-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Company Driver Toggle Card */}
                  <div
                    onClick={() => setRequiresDriver(!requiresDriver)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex items-start gap-3 ${
                      requiresDriver
                        ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={requiresDriver}
                      onChange={(e) => setRequiresDriver(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-brand-600 border-slate-300 dark:border-slate-700 focus:ring-brand-500 cursor-pointer"
                      disabled={isLoading}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Assign Designated Company Driver
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Recommended for long-distance project trips outside Addis Ababa or heavy payload transit.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                  <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>All fleet vehicles undergo daily safety & maintenance inspections.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECTION C: Route Notes & Fleet Travel Policy               */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="flex flex-col h-full">
            <Card className="flex-1 flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                        Section C · Step 3
                      </span>
                      <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Route Notes & Policy
                      </CardTitle>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                    Dispatch Guide
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Passenger Manifest Details */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="passengerDetails"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Passenger Manifest & Team Details (Optional)
                    </label>
                    <textarea
                      id="passengerDetails"
                      rows={2}
                      className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                      placeholder="e.g. Eng. Yohannes (Site Lead), W/ro Sara (Project QA), Ato Dawit (Surveyor)"
                      value={passengerDetails}
                      onChange={(e) => setPassengerDetails(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Supporting Document / Memo Link */}
                  <div>
                    <Input
                      id="documentUrl"
                      label="Supporting Memo / Document Link (Optional)"
                      placeholder="e.g. Internal DMS link, approved work order memo #REQ-2026-99"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="notes"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Special Instructions or Site Gate Requirements
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                      placeholder="e.g. Unpaved access road at Site 4; security pass required at Gate 2; hauling surveying equipment."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Corporate Fleet Travel Guidelines */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[10px]">
                      Capital Fleet Operating Guidelines
                    </span>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-slate-900 dark:text-white font-semibold">
                            QR Digital Receipt Clearance
                          </strong>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Once approved, present your digital receipt and QR code at security checkpoints and vehicle dispatch depot.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5">
                        <Fuel className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-slate-900 dark:text-white font-semibold">
                            Full-to-Full Fuel Policy
                          </strong>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Vehicles must be returned at or above the dispatch fuel level. Fuel vouchers available at logistics desk.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatch Hotline Help Box */}
                <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-brand-600" />
                    <span>Logistics Dispatch Desk:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    +251 11 662 4500
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Error Notice if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 hover:underline px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* SECTION 2: Refined, Modern Bottom Action Bar               */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Live Summary Chips on Left */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
            {/* Validity indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold border ${
                isFormValid
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isFormValid ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>
                {isFormValid ? 'All required fields completed' : 'Destination & purpose required'}
              </span>
            </div>

            {/* Selected Vehicle Chip */}
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Car className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedVehicle ? selectedVehicle.name : 'Auto-Allocate (Optimal)'}</span>
            </span>

            {/* Passenger Count Chip */}
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{passengerCount} Passenger{passengerCount > 1 ? 's' : ''}</span>
            </span>

            {/* Driver Chip */}
            {requiresDriver && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <span>Driver Requested</span>
              </span>
            )}
          </div>

          {/* Action Buttons on Right */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              size="md"
              className="rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="md"
              isLoading={isLoading}
              disabled={!isFormValid || isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="rounded-xl px-6 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Submit Booking Request
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
