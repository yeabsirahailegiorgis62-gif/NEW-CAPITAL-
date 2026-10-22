import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Booking } from '@/types';
import { formatEthiopianDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Car,
  User as UserIcon,
  Calendar,
  MapPin,
  QrCode,
  Copy,
  Check,
  X,
  Phone,
} from 'lucide-react';

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onVerifyBooking?: (reference: string) => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  isOpen,
  onClose,
  booking,
  onVerifyBooking,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (booking) {
      const token = booking.verificationToken;
      const verificationUrl = token
        ? `${window.location.origin}/?token=${encodeURIComponent(token)}`
        : `${window.location.origin}/?verify=${encodeURIComponent(booking.bookingReference)}`;

      QRCode.toDataURL(verificationUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [booking?.bookingReference, booking?.verificationToken]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const assignment = booking.assignments?.[0] || booking.currentAssignment;
  const vehicle = assignment?.vehicle || booking.preferredVehicle;
  const approver = assignment?.assignedBy;
  const bookingDate = new Date(booking.departureAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const approvalDate = assignment?.assignedAt
    ? formatEthiopianDateTime(assignment.assignedAt)
    : formatEthiopianDateTime(booking.updatedAt);

  const verificationUrl = booking.verificationToken
    ? `${window.location.origin}/?token=${encodeURIComponent(booking.verificationToken)}`
    : `${window.location.origin}/?verify=${encodeURIComponent(booking.bookingReference)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  const handleDownloadPdf = () => {
    window.print();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const handleVerify = () => {
    if (onVerifyBooking) {
      onVerifyBooking(booking.bookingReference);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex min-h-[100dvh] items-center justify-center p-2 sm:p-3 md:p-4 overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-dialog-title"
    >
      {/* Print Stylesheet injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #capital-receipt-document, #capital-receipt-document * {
            visibility: visible !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
            background-color: transparent !important;
          }
          #capital-receipt-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0 !important;
          }
          #capital-receipt-document [class*="dark:bg-slate-"],
          #capital-receipt-document [class*="bg-slate-"] {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog Shell with m-auto to guarantee no negative flexbox clipping */}
      <div className="relative w-full m-auto max-w-4xl lg:max-w-5xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden transform transition-all text-slate-900 dark:text-slate-100">
        
        {/* Stationary Top Bar (Screen only - Pinned shrink-0) */}
        <div className="no-print flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img
                src="/assets/capital-emblem.png"
                alt="Capital Logo"
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="receipt-dialog-title" className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  Digital Dispatch Receipt
                </h3>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-800 shrink-0">
                  #{booking.bookingReference}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block truncate">
                Capital Real Estate Fleet Dispatch Credential
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shadow-2xs"
              title="Print official receipt"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-2xs"
              title="Download as PDF"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close receipt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert for Print/PDF */}
        {(printSuccess || downloadSuccess) && (
          <div className="no-print mx-4 sm:mx-6 mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {printSuccess
                  ? 'Print preview generated. Follow browser prompts to complete printing.'
                  : 'PDF export ready. In your print dialog, select "Save as PDF" to save.'}
              </span>
            </div>
          </div>
        )}

        {/* ── Official Printable Receipt Body (Responsive Viewport-Aware Scroll Container) ── */}
        <div className="overflow-y-auto min-h-0 flex-1 p-2 sm:p-4 md:p-5 overscroll-contain">
          <div
            id="capital-receipt-document"
            ref={receiptRef}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs space-y-3 sm:space-y-4"
          >
            {/* Header: Letterhead & Reference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-900 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-2xs shrink-0">
                  <img
                    src="/assets/capital-emblem.png"
                    alt="Capital Real Estate & Apartment"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-slate-950 dark:text-white uppercase leading-tight">
                    Capital Real Estate & Apartment
                  </h1>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Logistics & Fleet Operations Department · Addis Ababa
                  </p>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest text-brand-700 dark:text-brand-400 uppercase bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded">
                    Official Pass
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      booking.status === 'APPROVED' || booking.status === 'ASSIGNED'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : booking.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                        : booking.status === 'COMPLETED'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  Date: <strong className="text-slate-700 dark:text-slate-300">{bookingDate}</strong>
                </div>
              </div>
            </div>

            {/* Main Content: 2-Column Responsive Boarding-Pass Layout (Fits 100% on Laptop) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch">
              
              {/* Left Column (60% on desktop/laptop): Requisition, Vehicle, and Itinerary */}
              <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between space-y-3">
                
                {/* Requester & Passenger Box */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                    <UserIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Requisition & Personnel</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Requester</span>
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {booking.requester?.name || 'Staff Member'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Employee ID</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {booking.requester?.employeeId ? `#${booking.requester.employeeId}` : 'CRE-STAFF'}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Department</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                        {booking.requester?.department?.name || 'Capital Real Estate Corp'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Passengers</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {booking.passengerCount} Person{booking.passengerCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Service Type</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                        {booking.requiresDriver ? 'Designated Corporate Chauffeur' : 'Authorized Self-Driven Staff'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Vehicle & Driver Box */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                    <Car className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Assigned Fleet Vehicle & Chauffeur</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="col-span-2">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Vehicle</span>
                      <span className="font-bold text-slate-900 dark:text-white block text-xs sm:text-sm truncate">
                        {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.name})` : 'Allocation Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">License Plate</span>
                      <span className="font-mono font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-1.5 py-0.5 rounded text-[11px] inline-block">
                        {vehicle?.registrationNumber || 'PENDING'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Chauffeur</span>
                      <span className="font-semibold text-slate-900 dark:text-white block truncate">
                        {assignment?.driverName || (booking.requiresDriver ? 'Assigned Fleet Chauffeur' : 'Authorized Self-Drive')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Contact</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 block text-[11px] truncate">
                        {assignment?.driverPhone || 'Dispatch Gate 1'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schedule & Route Box */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-1.5 mb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                    <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Mission Schedule & Destination</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Departure (EAT)</span>
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {formatEthiopianDateTime(booking.departureAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Expected Return (EAT)</span>
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {formatEthiopianDateTime(booking.expectedReturnAt)}
                      </span>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Destination</span>
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span className="truncate">{booking.destination}</span>
                      </span>
                    </div>
                    {booking.purpose && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Purpose</span>
                        <p className="text-slate-700 dark:text-slate-300 italic text-[11px] line-clamp-2 mt-0.5">
                          "{booking.purpose}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (40% on desktop/laptop): QR Verification Pass & Sign-off */}
              <div className="md:col-span-5 lg:col-span-4 flex flex-col justify-between space-y-3">
                
                {/* Security QR Pass Box */}
                <div className="p-3 sm:p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center justify-center text-center relative flex-1">
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Security QR Pass
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Scan Verified
                    </span>
                  </div>

                  {/* QR Image with Corporate Emblem */}
                  <div className="relative p-2 bg-white rounded-xl border border-slate-200 dark:border-slate-600 shadow-2xs group">
                    <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-brand-600 rounded-tl-xs pointer-events-none" />
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-brand-600 rounded-tr-xs pointer-events-none" />
                    <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-brand-600 rounded-bl-xs pointer-events-none" />
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-brand-600 rounded-br-xs pointer-events-none" />

                    {qrDataUrl ? (
                      <div className="relative">
                        <img
                          src={qrDataUrl}
                          alt={`QR code for ${booking.bookingReference}`}
                          className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-6 h-6 rounded-full bg-white p-0.5 shadow-sm border border-slate-300 flex items-center justify-center">
                            <img
                              src="/assets/capital-emblem.png"
                              alt="Capital"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-slate-300">
                        <QrCode className="w-8 h-8 animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 w-full">
                    <div className="text-[11px] sm:text-xs font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      REF: {booking.bookingReference}
                    </div>

                    <div className="no-print pt-1 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <span className="text-slate-300 dark:text-slate-600">•</span>

                      <button
                        type="button"
                        onClick={handleVerify}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Verify Record</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Approval Sign-off Box */}
                <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/70 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                    <span>Authorized Sign-Off</span>
                    <span>Verified EAT</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                      {approver?.name || 'Logistics Operations'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                      {approvalDate.split(' ')[0]}
                    </span>
                  </div>
                </div>

                {/* Security Seal & Disclaimer */}
                <div className="text-center pt-1 space-y-0.5">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                    Certified reservation credential. Present at security gate.
                  </p>
                  <div className="text-[8px] text-slate-400 font-mono">
                    ID: CRE-SEC-{booking.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stationary Bottom Action Bar (Screen only - Pinned shrink-0) */}
        <div className="no-print px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Verification URL</span>
                </>
              )}
            </button>

            {onVerifyBooking && (
              <button
                onClick={handleVerify}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Live Status</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
