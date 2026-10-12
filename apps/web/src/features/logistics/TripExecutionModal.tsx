import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Booking } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatEthiopianDateTime } from '@/lib/utils';
import { TrendingUp, CheckCircle, Car, AlertTriangle } from 'lucide-react';

interface TripExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  mode: 'start' | 'complete';
  onSuccess: () => void;
}

export const TripExecutionModal: React.FC<TripExecutionModalProps> = ({
  isOpen,
  onClose,
  booking,
  mode,
  onSuccess,
}) => {
  const [odometer, setOdometer] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [reportedProblem, setReportedProblem] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  const isStart = mode === 'start';
  const assigned = booking.assignments?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const odoValue = odometer.trim() ? parseFloat(odometer.trim()) : undefined;

    try {
      setIsLoading(true);
      if (isStart) {
        await api.startTrip(booking.id, {
          actualDepartureAt: new Date().toISOString(),
          startOdometer: odoValue,
        });
      } else {
        await api.completeTrip(booking.id, {
          actualReturnAt: new Date().toISOString(),
          endOdometer: odoValue,
          notes: notes.trim() || undefined,
          reportedProblem: reportedProblem.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update trip telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isStart ? `Record Departure #${booking.bookingReference}` : `Record Vehicle Return #${booking.bookingReference}`}
      description={`Destination: ${booking.destination} · Vehicle: ${assigned?.vehicle?.name || 'Assigned vehicle'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

        <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Assigned Vehicle:</span>
            <span className="font-semibold text-slate-800">
              {assigned?.vehicle?.name} ({assigned?.vehicle?.registrationNumber})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Driver / Traveler:</span>
            <span className="font-semibold text-slate-800">
              {assigned?.driverName || booking.requester?.name}
            </span>
          </div>
        </div>

        <div>
          <Input
            id="odo"
            label={isStart ? 'Starting Odometer Reading (km)' : 'Ending Odometer Reading (km)'}
            type="number"
            placeholder="e.g. 45280"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {!isStart && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trip Completion Notes
              </label>
              <textarea
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Trip completed on time; site inspection report filed."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Reported Vehicle Defect / Issue (Optional)
              </label>
              <textarea
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Low tire pressure warning or brake squeaking..."
                value={reportedProblem}
                onChange={(e) => setReportedProblem(e.target.value)}
                disabled={isLoading}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Entering a defect will automatically generate a vehicle issue ticket for workshop tracking.
              </span>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {isStart ? 'Confirm Vehicle Departure' : 'Finalize Trip Return'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
