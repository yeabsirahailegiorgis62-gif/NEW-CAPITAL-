import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Booking, User } from '@/types';
import { formatEthiopianDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Car,
  User as UserIcon,
  Building,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Copy,
  Check,
  FileText,
  X,
  ExternalLink,
  Shield,
  Phone,
  CheckCheck,
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
    if (booking?.bookingReference) {
      const verificationUrl = `${window.location.origin}/?verify=${encodeURIComponent(
        booking.bookingReference
      )}`;
      QRCode.toDataURL(verificationUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a', // Deep corporate slate
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [booking?.bookingReference]);

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

  const verificationUrl = `${window.location.origin}/?verify=${encodeURIComponent(
    booking.bookingReference
  )}`;

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
    // Invoke browser print dialog targeting PDF, and download receipt summary metadata
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
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
            padding: 24px !important;
            background: white !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0 !important;
          }
          #capital-receipt-document .bg-slate-50,
          #capital-receipt-document .bg-slate-50\\/50,
          #capital-receipt-document .bg-slate-50\\/60,
          #capital-receipt-document .bg-slate-50\\/80,
          #capital-receipt-document [class*="dark:bg-slate-"] {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full my-auto max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Screen only) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img
                src="/assets/capital-emblem.png"
                alt="Capital Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Digital Booking Receipt
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official Capital Real Estate & Apartment Dispatch Credential
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shadow-xs"
              title="Print official receipt"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-xs"
              title="Download as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
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

        {/* Confirmation banner when printed or downloaded */}
        {(printSuccess || downloadSuccess) && (
          <div className="no-print mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn shrink-0">
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

        {/* ── Official Printable Receipt Body ── */}
        <div className="overflow-y-auto min-h-0 flex-1 p-4 sm:p-6 md:p-8 space-y-6 overscroll-contain">
          <div
            id="capital-receipt-document"
            ref={receiptRef}
            className="bg-white dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 md:p-8 shadow-sm space-y-6"
          >
            {/* Letterhead Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900 dark:border-slate-700">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-xs shrink-0">
                    <img
                      src="/assets/capital-emblem.png"
                      alt="Capital Real Estate & Apartment"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white uppercase leading-none">
                      Capital Real Estate & Apartment
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                      Logistics & Fleet Operations Department
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                  Bole District, Addis Ababa, Ethiopia · operations@capitalrealestate.et
                </p>
              </div>

              <div className="text-left sm:text-right flex flex-col sm:items-end">
                <span className="text-[10px] font-bold tracking-widest text-brand-700 dark:text-brand-400 uppercase bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2.5 py-0.5 rounded">
                  Official Reservation Pass
                </span>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                  REF: {booking.bookingReference}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Issue Date: {bookingDate}
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 rounded-xl p-4">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  Vehicle Booking Confirmation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Authorized dispatch credential for corporate transit and gate clearance
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    booking.status === 'APPROVED' || booking.status === 'ASSIGNED'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : booking.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      : booking.status === 'COMPLETED'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* 4-Corner Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Group 1: Employee & Department */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/80 pb-2">
                  <UserIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Requester Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Employee Name</span>
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {booking.requester?.name || 'Staff Member'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Employee ID</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 block">
                      {booking.requester?.employeeId || 'CRE-STAFF'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Department / Unit</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {booking.requester?.department?.name || 'Capital Real Estate Corp'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Passenger Count</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {booking.passengerCount} Person{booking.passengerCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Driver Service</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {booking.requiresDriver ? 'Company Driver' : 'Authorized Self-Drive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group 2: Assigned Vehicle & Equipment */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/80 pb-2">
                  <Car className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Assigned Vehicle</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Make & Model</span>
                    <span className="font-bold text-slate-900 dark:text-white block text-sm">
                      {vehicle
                        ? `${vehicle.make} ${vehicle.model} (${vehicle.name})`
                        : 'Vehicle Allocation Pending by Logistics'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">License Plate</span>
                    <span className="font-mono font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded text-xs inline-block mt-0.5">
                      {vehicle?.registrationNumber || 'PENDING'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Category</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {vehicle?.category || 'Standard'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Designated Driver</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {assignment?.driverName
                        ? `${assignment.driverName} ${
                            assignment.driverPhone ? `(${assignment.driverPhone})` : ''
                          }`
                        : 'Self-Driven by authorized staff'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group 3: Schedule & Route Details */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/80 pb-2">
                  <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Schedule & Itinerary</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Departure Schedule (EAT)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatEthiopianDateTime(booking.departureAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Expected Return Schedule (EAT)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatEthiopianDateTime(booking.expectedReturnAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Destination & Route</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span>{booking.destination}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Trip Purpose</span>
                    <p className="text-slate-700 dark:text-slate-300 italic text-xs mt-1 whitespace-pre-wrap leading-relaxed">
                      "{booking.purpose}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Group 4: Official QR Code & Verification */}
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 flex flex-col items-center justify-between text-center relative overflow-hidden">
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Security Dispatch QR Pass
                  </span>
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    Scan Authorized
                  </span>
                </div>

                {/* Bespoke Styled QR Container with Security Reticles */}
                <div className="relative p-2.5 bg-white rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm animate-scaleIn group">
                  {/* Four Corner Reticles */}
                  <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-brand-600 rounded-tl-sm pointer-events-none" />
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-brand-600 rounded-tr-sm pointer-events-none" />
                  <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-brand-600 rounded-bl-sm pointer-events-none" />
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-brand-600 rounded-br-sm pointer-events-none" />

                  {qrDataUrl ? (
                    <div className="relative">
                      <img
                        src={qrDataUrl}
                        alt={`QR code for ${booking.bookingReference}`}
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

                <div className="mt-2 space-y-1 w-full">
                  <div className="text-xs font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {booking.bookingReference}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                    Dedicated verification QR pass for this specific reservation
                  </p>

                  <div className="no-print pt-1 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Scan Link</span>
                        </>
                      )}
                    </button>

                    <span className="text-slate-300 dark:text-slate-600">•</span>

                    <button
                      type="button"
                      onClick={handleVerify}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verify Record</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Metadata Signoff Bar */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">
                    Authorized Approval Sign-Off
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {approver?.name || 'Logistics Operations Administrator'}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">
                  Approval Timestamp
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {approvalDate}
                </span>
              </div>
            </div>

            {/* Official Disclaimer & Security Seal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80 text-center space-y-1">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
                This document is a certified reservation confirmation generated by the Capital Real Estate Enterprise Fleet System. Authorized personnel may inspect this receipt and scan the QR code to verify validity. Any unauthorized alteration voids this credential.
              </p>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                Security ID: CRE-SEC-{booking.id.slice(0, 8).toUpperCase()} · Addis Ababa, Ethiopia
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar (Screen only) */}
        <div className="no-print p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800"
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
