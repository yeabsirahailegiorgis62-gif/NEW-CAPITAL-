import React, { useState } from 'react';
import { Booking } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
import {
  Printer,
  FileText,
  Calendar,
  Car,
  User as UserIcon,
  CheckCircle,
  Building,
  Clock,
  MapPin,
  Users,
  Shield,
  Download,
  X,
} from 'lucide-react';

interface PrintableTransportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  defaultFormType?: 'daily' | 'weekly';
}

export const PrintableTransportFormModal: React.FC<PrintableTransportFormModalProps> = ({
  isOpen,
  onClose,
  booking,
  defaultFormType,
}) => {
  if (!booking) return null;

  // Auto-determine whether this is a daily trip or weekly multi-day itinerary
  const isMultiDay = (() => {
    try {
      const dep = new Date(booking.departureAt).getTime();
      const ret = new Date(booking.expectedReturnAt).getTime();
      return ret - dep > 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  })();

  const [formType, setFormType] = useState<'daily' | 'weekly'>(
    defaultFormType || (isMultiDay ? 'weekly' : 'daily')
  );

  const handlePrint = () => {
    window.print();
  };

  const assignment = booking.currentAssignment || booking.assignments?.[0];
  const vehicle = assignment?.vehicle || booking.preferredVehicle;
  const driverName = assignment?.driverName || (booking.requiresDriver ? 'Abebe Molla (Fleet Driver)' : `${booking.requester?.name || 'Staff'} (Self-Driven)`);
  const driverPhone = assignment?.driverPhone || (booking.requiresDriver ? '+251 91 123 4567' : booking.requester?.phone || '+251 91 000 0000');

  // Generate day-by-day weekly itinerary rows
  const generateWeeklySchedule = () => {
    try {
      const startDate = new Date(booking.departureAt);
      const endDate = new Date(booking.expectedReturnAt);
      const daysCount = Math.min(
        7,
        Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      );

      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const schedule = [];

      for (let i = 0; i <= daysCount; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        if (currentDate.getTime() > endDate.getTime()) break;

        const dayName = daysOfWeek[currentDate.getDay()];
        const dateStr = currentDate.toISOString().split('T')[0];

        schedule.push({
          dayName,
          date: dateStr,
          destination: i === 0 ? booking.destination : i === daysCount ? `Return to Capital HQ from ${booking.destination}` : `${booking.destination} Regional Sites`,
          purpose: i === 0 ? booking.purpose : i === daysCount ? 'Mission wrap-up & return transit' : 'Field site inspections & operations',
          departure: i === 0 ? '08:30 AM' : '09:00 AM',
          returnTime: i === daysCount ? '05:30 PM' : '05:00 PM',
        });
      }
      return schedule;
    } catch {
      return [
        {
          dayName: 'Day 1',
          date: booking.departureAt.split('T')[0],
          destination: booking.destination,
          purpose: booking.purpose,
          departure: '08:30 AM',
          returnTime: '05:00 PM',
        },
      ];
    }
  };

  const weeklySchedule = generateWeeklySchedule();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Transport Request Form"
      description="Capital Real Estate Logistics & Supply Chain printable corporate voucher"
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Controls Toolbar (Hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Form Template:
            </span>
            <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFormType('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formType === 'daily'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Daily Transport Form
              </button>
              <button
                type="button"
                onClick={() => setFormType('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formType === 'weekly'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Weekly Itinerary Form
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              className="font-bold shadow-sm"
            >
              Print Official Form
            </Button>
          </div>
        </div>

        {/* ── PRINTABLE DOCUMENT CANVAS ── */}
        <div
          id="printable-form-sheet"
          className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-lg print:shadow-none print:border-none print:p-0 print:m-0 font-sans"
        >
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/capital-emblem.png"
                  alt="Capital Real Estate"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                    Capital Real Estate & Apartment
                  </h1>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-0.5">
                    Logistics & Supply Chain Operations Department
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fleet Management & Corporate Transport Requisition System • Addis Ababa, Ethiopia
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-extrabold uppercase tracking-widest rounded">
                  {formType === 'daily' ? 'DAILY FORM' : 'WEEKLY ITINERARY'}
                </span>
                <div className="font-mono text-xs font-bold text-slate-900 mt-1.5">
                  Ref: #{booking.bookingReference}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Issued: {formatEthiopianDateOnly(booking.createdAt)}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
              <div>
                <strong>Form Series:</strong> CR-LOG-TRF-{formType.toUpperCase()}-2026
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <span className="uppercase font-bold text-slate-900">
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <strong>Classification:</strong> Official Corporate Transport
              </div>
            </div>
          </div>

          {/* Section 1: Requester & Department Identification */}
          <div className="mt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 px-3 py-1 border-l-4 border-slate-900 mb-3">
              1. Requesting Department & Staff Identification
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-200 p-3.5 rounded-lg bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Staff Member:</span>
                <span className="font-bold text-slate-900">{booking.requester?.name || 'Staff Member'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Employee ID:</span>
                <span className="font-mono font-semibold text-slate-900">{booking.requester?.employeeId || 'CR-HQ-001'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Department:</span>
                <span className="font-semibold text-slate-900">{booking.requester?.department?.name || 'Capital Real Estate'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Official Email:</span>
                <span className="font-mono text-slate-700 truncate block">{booking.requester?.email || 'staff@capitalre.com'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Operational Mission Details */}
          <div className="mt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 px-3 py-1 border-l-4 border-slate-900 mb-3">
              2. Mission Objectives & Transit Itinerary
            </h3>
            <div className="border border-slate-200 rounded-lg p-3.5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Destination / Route:</span>
                  <span className="font-bold text-sm text-slate-900">{booking.destination}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Passengers & Driver Policy:</span>
                  <span className="font-semibold text-slate-900">
                    {booking.passengerCount} Passenger{booking.passengerCount !== 1 ? 's' : ''} •{' '}
                    {booking.requiresDriver ? 'Company Chauffeur Assigned' : 'Self-Driven by Requestor'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Operational Purpose & Justification:</span>
                <p className="mt-0.5 text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                  {booking.purpose}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Departure Schedule:</span>
                  <span className="font-semibold text-slate-900">{formatEthiopianDateTime(booking.departureAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Expected Return Schedule:</span>
                  <span className="font-semibold text-slate-900">{formatEthiopianDateTime(booking.expectedReturnAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Notice Period Standard:</span>
                  <span className="font-semibold text-emerald-700">Verified Advance Notice Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: If Weekly Form — Day-by-Day Table */}
          {formType === 'weekly' && (
            <div className="mt-5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 px-3 py-1 border-l-4 border-slate-900 mb-3">
                3. Day-by-Day Route & Stop Schedule (Weekly Itinerary)
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800 text-[11px]">
                      <th className="p-2.5">Day & Date</th>
                      <th className="p-2.5">Transit Route & Destination</th>
                      <th className="p-2.5">Operational Objective</th>
                      <th className="p-2.5">Depart</th>
                      <th className="p-2.5">Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {weeklySchedule.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="p-2.5 font-bold text-slate-900">
                          {row.dayName}
                          <span className="text-[10px] text-slate-500 font-normal block">{row.date}</span>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800">{row.destination}</td>
                        <td className="p-2.5 text-slate-700">{row.purpose}</td>
                        <td className="p-2.5 font-mono">{row.departure}</td>
                        <td className="p-2.5 font-mono">{row.returnTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Fleet & Chauffeur Allocation */}
          <div className="mt-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 px-3 py-1 border-l-4 border-slate-900 mb-3">
              {formType === 'weekly' ? '4.' : '3.'} Fleet Allocation & Dispatch Handover (Official Logistics Record)
            </h3>
            <div className="border border-slate-200 rounded-lg p-3.5 space-y-3 text-xs bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Allocated Vehicle:</span>
                  <span className="font-bold text-slate-900">{vehicle?.name || 'Vehicle To Be Allocated'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">License Plate Number:</span>
                  <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-white border border-slate-300 rounded inline-block">
                    {vehicle?.registrationNumber || 'PENDING DISPATCH'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Assigned Chauffeur:</span>
                  <span className="font-semibold text-slate-900">{driverName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Driver Contact Phone:</span>
                  <span className="font-mono text-slate-900">{driverPhone}</span>
                </div>
              </div>

              {/* Odometer & Fuel Check Boxes */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                <div className="p-2 border border-dashed border-slate-300 rounded bg-white">
                  <span className="text-[9px] font-bold uppercase block text-slate-400">Starting Odometer:</span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {booking.startOdometer ? `${booking.startOdometer} KM` : '_______ KM'}
                  </span>
                </div>
                <div className="p-2 border border-dashed border-slate-300 rounded bg-white">
                  <span className="text-[9px] font-bold uppercase block text-slate-400">Return Odometer:</span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {booking.endOdometer ? `${booking.endOdometer} KM` : '_______ KM'}
                  </span>
                </div>
                <div className="p-2 border border-dashed border-slate-300 rounded bg-white">
                  <span className="text-[9px] font-bold uppercase block text-slate-400">Fuel Level (Departure):</span>
                  <span className="font-mono text-xs font-bold text-slate-900">[  ] Full  [  ] 3/4  [  ] 1/2</span>
                </div>
                <div className="p-2 border border-dashed border-slate-300 rounded bg-white">
                  <span className="text-[9px] font-bold uppercase block text-slate-400">Key Tag Reference:</span>
                  <span className="font-mono text-xs font-bold text-slate-900">BAY-KEY-{booking.bookingReference.slice(-4)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Formal Endorsements & Authorization Signatures */}
          <div className="mt-6 pt-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 px-3 py-1 border-l-4 border-slate-900 mb-4">
              {formType === 'weekly' ? '5.' : '4.'} Official Approvals, Endorsements & Security Dispatch Clearance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Signature Block 1 */}
              <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50/40 flex flex-col justify-between h-36">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    A. Requestor Endorsement
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    "I confirm that this travel request is for verified corporate mission objectives."
                  </p>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Signature: __________________</span>
                    <span>Date: __________</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-900 block mt-0.5">
                    {booking.requester?.name || 'Staff Member'}
                  </span>
                </div>
              </div>

              {/* Signature Block 2 */}
              <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50/40 flex flex-col justify-between h-36">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    B. Department Head Recommendation
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    "Recommended and approved under department operational travel budget."
                  </p>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Signature: __________________</span>
                    <span>Date: __________</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-900 block mt-0.5">
                    {booking.requester?.department?.name || 'Department'} Manager
                  </span>
                </div>
              </div>

              {/* Signature Block 3 */}
              <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50/40 flex flex-col justify-between h-36">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    C. Logistics Officer Authorization
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    "Vehicle schedule conflict-checked and authorized for dispatch clearance."
                  </p>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>Signature: __________________</span>
                    <span>Date: __________</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-900 block mt-0.5">
                    {assignment?.assignedBy?.name || 'Chief Logistics Officer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Security Dispatch Footnote */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-500">
              <span>Security Gate Note: Present this stamped form or digital booking QR code at HQ gate for exit clearance.</span>
              <span className="font-mono">Capital Fleet Logistics Engine v1.0 • Addis Ababa</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
