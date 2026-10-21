import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import { BookingVerificationResult } from '@/types';
import { formatEthiopianDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Car,
  User as UserIcon,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Building,
  Phone,
  ExternalLink,
  ShieldAlert,
  Lock,
} from 'lucide-react';

interface PublicVerificationPageProps {
  reference: string;
  onNavigateToPortal: () => void;
  onSearchOtherReference?: (ref: string) => void;
}

export const PublicVerificationPage: React.FC<PublicVerificationPageProps> = ({
  reference,
  onNavigateToPortal,
  onSearchOtherReference,
}) => {
  const [currentRef, setCurrentRef] = useState(reference);
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<BookingVerificationResult | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  const fetchVerification = async (refToVerify: string) => {
    const trimmed = refToVerify.trim();
    if (!trimmed) return;

    try {
      setIsLoading(true);
      setError(null);
      const isToken = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
      const res = isToken ? await api.verifyTripToken(trimmed) : await api.verifyBooking(trimmed);
      setResult(res);

      // Generate bespoke QR code delegating directly to this booking's verification URL
      const verificationUrl = isToken
        ? `${window.location.origin}/?token=${encodeURIComponent(trimmed)}`
        : `${window.location.origin}/?verify=${encodeURIComponent(res.bookingReference || trimmed)}`;
      const qrUrl = await QRCode.toDataURL(verificationUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(qrUrl);
    } catch (err: any) {
      setError(err?.message || 'Verification service unreachable.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentRef) {
      fetchVerification(currentRef);
    }
  }, [currentRef]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const formatted = searchInput.trim().toUpperCase();
      setCurrentRef(formatted);
      if (onSearchOtherReference) onSearchOtherReference(formatted);
      setSearchInput('');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?verify=${encodeURIComponent(
      result?.bookingReference || currentRef
    )}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  const getStatusBadge = (status: BookingVerificationResult['verificationStatus']) => {
    switch (status) {
      case 'VALID':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          title: 'VERIFIED & AUTHORIZED DISPATCH',
          subtitle: 'Valid Corporate Reservation • Approved for Gate Clearance & Transit',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200',
          badgeClass: 'bg-emerald-600 text-white',
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          title: 'TRIP COMPLETED & RETURNED',
          subtitle: 'Official corporate journey concluded and returned to depot',
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200',
          badgeClass: 'bg-blue-600 text-white',
        };
      case 'EXPIRED':
        return {
          icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          title: 'EXPIRED RESERVATION PASS',
          subtitle: 'The scheduled window for this reservation has elapsed',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200',
          badgeClass: 'bg-amber-600 text-white',
        };
      case 'CANCELLED':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          title: 'RESERVATION CANCELLED / REVOKED',
          subtitle: 'This booking has been cancelled and is no longer authorized for dispatch',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200',
          badgeClass: 'bg-rose-600 text-white',
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          title: 'REQUEST DECLINED BY LOGISTICS',
          subtitle: 'This booking request was not approved by fleet management',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200',
          badgeClass: 'bg-rose-600 text-white',
        };
      case 'PENDING':
        return {
          icon: <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
          title: 'REQUISITION PENDING APPROVAL',
          subtitle: 'Request lodged in fleet queue • Awaiting vehicle allocation and sign-off',
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200',
          badgeClass: 'bg-indigo-600 text-white',
        };
      default:
        return {
          icon: <ShieldAlert className="w-5 h-5 text-slate-600 dark:text-slate-400" />,
          title: 'INVALID / UNRECOGNIZED PASS',
          subtitle: 'No corporate vehicle record matches this reference number',
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-950 dark:text-slate-200',
          badgeClass: 'bg-slate-600 text-white',
        };
    }
  };

  const statusVisual = result ? getStatusBadge(result.verificationStatus) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Print Stylesheet injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #public-pass-card, #public-pass-card * {
            visibility: visible !important;
            color: #0f172a !important;
            background-color: transparent !important;
            border-color: #cbd5e1 !important;
            box-shadow: none !important;
          }
          #public-pass-card {
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
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Public Navigation Header */}
      <header className="no-print border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/assets/capital-emblem.png"
                alt="Capital Real Estate & Apartment"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Capital Real Estate & Apartment
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  <ShieldCheck className="w-3 h-3 text-brand-400" />
                  Dispatch Verification
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Corporate Fleet Security & Gate Clearance Subsystem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePrint}
              disabled={isLoading || !result}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Pass</span>
            </button>

            <button
              onClick={onNavigateToPortal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-sm"
            >
              <span>Employee Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Verification Reference Search Bar */}
        <div className="no-print bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan or enter another reference number (e.g. CR-2026-VAL1)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-white font-mono text-xs sm:text-sm placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!searchInput.trim() || isLoading}
              className="shrink-0 font-bold bg-brand-600 hover:bg-brand-500 text-white"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Verify Pass
            </Button>
          </form>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center animate-spin text-brand-400">
              <RefreshCw className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Validating Corporate Booking Credential...
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Querying reference: {currentRef}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-800 text-rose-200 space-y-3">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-rose-400" />
              <h3 className="text-base font-bold text-white">Verification Service Notice</h3>
            </div>
            <p className="text-sm text-rose-300 leading-relaxed">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchVerification(currentRef)}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="mt-2 text-white border-rose-700 hover:bg-rose-900/50"
            >
              Retry Verification
            </Button>
          </div>
        )}

        {/* ── Official Pass Verification Document ── */}
        {result && !isLoading && (
          <div
            id="public-pass-card"
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden space-y-6 p-6 sm:p-8 transition-all"
          >
            {/* Status Clearance Ribbon */}
            {statusVisual && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border ${statusVisual.bg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                    {statusVisual.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block text-slate-500 dark:text-slate-400">
                      Security Clearance Status
                    </span>
                    <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                      {statusVisual.title}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                      {statusVisual.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${statusVisual.badgeClass}`}
                  >
                    {result.verificationStatus}
                  </span>
                </div>
              </div>
            )}

            {/* Corporate Letterhead & Document Meta */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900 dark:border-slate-700">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
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
                      Fleet Logistics & Security Clearance Pass
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                  Verified against Corporate Database · Addis Ababa, Ethiopia
                </p>
              </div>

              <div className="text-left sm:text-right flex flex-col sm:items-end">
                <span className="text-[10px] font-bold tracking-widest text-brand-700 dark:text-brand-300 uppercase bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2.5 py-0.5 rounded">
                  Official Verification Record
                </span>
                <div className="text-sm font-mono font-black text-slate-900 dark:text-white mt-1">
                  REF: {result.bookingReference}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified At: {formatEthiopianDateTime(result.verifiedAt)}
                </div>
              </div>
            </div>

            {/* Main Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personnel Block */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60 pb-2">
                  <UserIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Authorized Personnel</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Requester Name</span>
                    <span className="font-bold text-slate-900 dark:text-white block break-words">
                      {result.requester?.name || 'Staff Member'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Employee ID</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                      {result.requester?.employeeId || 'CRE-STAFF'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Department / Unit</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {result.requester?.department || 'Capital Real Estate Corp'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Passenger Count</span>
                    <span className="font-medium text-slate-800 block">
                      {result.trip?.passengerCount || 1} Passenger(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Driver Service</span>
                    <span className="font-medium text-slate-800 block">
                      {result.trip?.requiresDriver ? 'Company Driver' : 'Authorized Self-Drive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Vehicle Block */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60 pb-2">
                  <Car className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Assigned Vehicle & Driver</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Make & Model</span>
                    <span className="font-bold text-slate-900 dark:text-white block text-sm">
                      {result.assignment
                        ? `${result.assignment.make} ${result.assignment.model} (${result.assignment.vehicleName})`
                        : 'Vehicle Allocation Pending by Logistics'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">License Plate</span>
                    <span className="font-mono font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded text-xs inline-block mt-0.5">
                      {result.assignment?.registrationNumber || 'PENDING'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Category</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block">
                      {result.assignment?.category || 'Standard Fleet'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Designated Driver</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {result.assignment?.driverName || (result.trip?.requiresDriver ? 'Pending Assignment' : 'Authorized Self-Drive')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule & Destination Block */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60 pb-2">
                  <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Schedule & Destination</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Departure (EAT)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {result.trip?.departureAt
                        ? formatEthiopianDateTime(result.trip.departureAt)
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Expected Return (EAT)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {result.trip?.expectedReturnAt
                        ? formatEthiopianDateTime(result.trip.expectedReturnAt)
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Destination</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span>{result.trip?.destination}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Mission Purpose</span>
                    <p className="text-slate-700 dark:text-slate-300 italic text-[11px] mt-0.5 whitespace-pre-wrap break-words">
                      "{result.trip?.purpose}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Dedicated QR Code Block */}
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 flex flex-col items-center justify-between text-center relative overflow-hidden">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  Unique Dispatch Pass QR Code
                </div>

                {/* Bespoke Styled QR Container with Security Reticles */}
                <div className="relative p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm group">
                  {/* Four Corner Reticles */}
                  <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-brand-600 rounded-tl-sm pointer-events-none" />
                  <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-brand-600 rounded-tr-sm pointer-events-none" />
                  <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-brand-600 rounded-bl-sm pointer-events-none" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-brand-600 rounded-br-sm pointer-events-none" />

                  {qrDataUrl ? (
                    <div className="relative">
                      <img
                        src={qrDataUrl}
                        alt={`QR code for ${result.bookingReference}`}
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

                <div className="mt-2 space-y-1">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {result.bookingReference}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="no-print inline-flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Link Copied</span>
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

            {/* Approval & Security Signoff Bar */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">
                    Authorized Approval Sign-Off
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {result.assignment?.assignedBy || 'Logistics Operations Administrator'}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">
                  Approval Timestamp
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                  {result.approvalDate ? formatEthiopianDateTime(result.approvalDate) : 'Logistics Verified'}
                </span>
              </div>
            </div>

            {/* Verification Footer Note */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Tamper-Evident Corporate Dispatch Record • Cryptographically validated
                </span>
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                CAPITAL-FLEET-ET // SEC-VERIFIED
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
