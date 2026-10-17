import React, { useState, useEffect } from 'react';
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
  X,
  QrCode,
  ShieldAlert,
  Camera,
  Info,
} from 'lucide-react';

interface BookingVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReference?: string | null;
}

export const BookingVerificationModal: React.FC<BookingVerificationModalProps> = ({
  isOpen,
  onClose,
  initialReference,
}) => {
  const [referenceInput, setReferenceInput] = useState(initialReference || '');
  const [result, setResult] = useState<BookingVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyReference = async (ref: string) => {
    const trimmed = ref.trim();
    if (!trimmed) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await api.verifyBooking(trimmed);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Verification service unreachable.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialReference) {
      setReferenceInput(initialReference);
      verifyReference(initialReference);
    } else {
      setResult(null);
      setError(null);
    }
  }, [initialReference, isOpen]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (referenceInput.trim()) {
      verifyReference(referenceInput.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Booking Credential Verification
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official backend verification for gate security & fleet dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close verification modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Reference Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter booking reference (e.g. CR-2026-0001)..."
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              disabled={!referenceInput.trim()}
            >
              Verify Record
            </Button>
          </form>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center animate-spin text-brand-600">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Verifying with Capital Real Estate Fleet Records...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Validating cryptographic reference against backend database
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 rounded-2xl border border-red-200 dark:border-red-800/80 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 text-xs flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold">Verification Error</strong>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Verification Results Panel */}
          {result && !isLoading && (
            <div className="space-y-4 animate-fadeIn">
              {/* Status Header Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  result.verificationStatus === 'VALID' || result.verificationStatus === 'COMPLETED'
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200'
                    : result.verificationStatus === 'EXPIRED'
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200'
                    : 'border-red-300 dark:border-red-800/80 bg-red-50/80 dark:bg-red-950/40 text-red-950 dark:text-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      result.verificationStatus === 'VALID' || result.verificationStatus === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : result.verificationStatus === 'EXPIRED'
                        ? 'bg-amber-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {result.verificationStatus === 'VALID' || result.verificationStatus === 'COMPLETED' ? (
                      <CheckCircle2 className="w-7 h-7" />
                    ) : result.verificationStatus === 'EXPIRED' ? (
                      <Clock className="w-7 h-7" />
                    ) : (
                      <ShieldAlert className="w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80 block">
                      Verification Result
                    </span>
                    <h4 className="text-base font-black tracking-tight">
                      {result.verificationStatus === 'VALID'
                        ? 'AUTHENTIC & AUTHORIZED RESERVATION'
                        : result.verificationStatus === 'COMPLETED'
                        ? 'COMPLETED TRIP RECORD'
                        : result.verificationStatus === 'EXPIRED'
                        ? 'SCHEDULE EXPIRED / OVERDUE'
                        : result.verificationStatus === 'CANCELLED'
                        ? 'RESERVATION CANCELLED / REVOKED'
                        : result.verificationStatus === 'REJECTED'
                        ? 'REQUEST DECLINED BY LOGISTICS'
                        : 'INVALID OR UNRECOGNIZED CREDENTIAL'}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      Ref: <strong className="font-mono">{result.bookingReference}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-white/70 dark:bg-slate-900/70 border border-current">
                    {result.status || result.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Verified Details Breakdown if valid or record exists */}
              {result.requester && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Requester */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Authorized Employee
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-brand-600" />
                        <span>{result.requester.name}</span>
                        <span className="font-mono text-slate-400">({result.requester.employeeId})</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 block">
                        {result.requester.department}
                      </span>
                    </div>

                    {/* Allocated Vehicle */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Assigned Vehicle & Plate
                      </span>
                      {result.assignment ? (
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {result.assignment.make} {result.assignment.model} ({result.assignment.vehicleName})
                          </span>
                          <span className="font-mono font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded text-[11px] border border-brand-200 dark:border-brand-800 inline-block mt-0.5">
                            {result.assignment.registrationNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 italic">
                          Awaiting Vehicle Allocation
                        </span>
                      )}
                    </div>

                    {/* Destination & Purpose */}
                    {result.trip && (
                      <>
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Destination & Purpose
                          </span>
                          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <span>{result.trip.destination}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                            "{result.trip.purpose}"
                          </p>
                        </div>

                        {/* Schedule Window */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Departure Schedule
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {formatEthiopianDateTime(result.trip.departureAt)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Expected Return Schedule
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {formatEthiopianDateTime(result.trip.expectedReturnAt)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Driver & Approver */}
                    {result.assignment && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Designated Driver
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {result.assignment.driverName}
                        </span>
                      </div>
                    )}

                    {result.approvalDate && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Logistics Approval Timestamp
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {formatEthiopianDateTime(result.approvalDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warning for Invalid/Cancelled */}
              {!result.isValid && (
                <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>
                    {result.verificationStatus === 'CANCELLED'
                      ? 'Security Warning: This reservation has been cancelled. Vehicle dispatch and gate entry are not permitted.'
                      : result.verificationStatus === 'EXPIRED'
                      ? 'Security Warning: The authorized time window for this booking has expired.'
                      : 'Security Warning: Credential not recognized. Do not permit transit without supervisor approval.'}
                  </span>
                </div>
              )}

              {/* Verification Timestamp */}
              <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                Verified live at {formatEthiopianDateTime(result.verifiedAt)} against Capital Fleet Central Records
              </div>
            </div>
          )}

          {/* Guidance Note for Security Guards */}
          {!result && !isLoading && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
              <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 dark:text-white font-semibold">
                  How QR Code Scanning Works
                </strong>
                <p className="mt-0.5 leading-relaxed">
                  Security guards and fleet officers can scan the QR code on an employee's digital receipt using any mobile phone camera or handheld 2D scanner. The QR code links directly to this secured verification screen.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Capital Real Estate Security & Logistics
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
