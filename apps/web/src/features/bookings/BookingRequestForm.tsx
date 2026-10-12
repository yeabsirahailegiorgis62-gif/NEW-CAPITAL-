import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Vehicle, Booking } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
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
} from 'lucide-react';

interface BookingRequestFormProps {
  onSuccess: (booking: Booking) => void;
  onCancel: () => void;
}

export const BookingRequestForm: React.FC<BookingRequestFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('08:30');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('17:00');
  const [passengerCount, setPassengerCount] = useState(1);
  const [preferredVehicleId, setPreferredVehicleId] = useState('');
  const [requiresDriver, setRequiresDriver] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const departureIso = new Date(`${departureDate}T${departureTime}:00`).toISOString();
    const returnIso = new Date(`${returnDate}T${returnTime}:00`).toISOString();

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

    if (passengerCount < 1) {
      setError('At least 1 passenger is required.');
      return;
    }

    try {
      setIsLoading(true);
      const booking = await api.createBooking({
        destination: destination.trim(),
        purpose: purpose.trim(),
        departureAt: departureIso,
        expectedReturnAt: returnIso,
        passengerCount,
        preferredVehicleId: preferredVehicleId || undefined,
        requiresDriver,
        additionalNotes: additionalNotes.trim() || undefined,
      });

      onSuccess(booking);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit booking request. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Request a Company Vehicle</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete the trip details below. The Logistics Department will review and allocate a vehicle.
          </p>
        </div>
      </div>

      {error && (
        <Alert type="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Section A: Trip Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <CardTitle className="text-sm">Section A: Trip Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            id="destination"
            label="Destination & Location"
            required
            placeholder="e.g. Bole Bulbula Project Site No. 4, Addis Ababa"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={isLoading}
          />

          <div className="space-y-1.5">
            <label htmlFor="purpose" className="block text-sm font-medium text-slate-700">
              Trip Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              id="purpose"
              required
              rows={2}
              className="block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Concrete compressive strength inspection and client handover review"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Input
                id="departureDate"
                label="Departure Date"
                type="date"
                required
                value={departureDate}
                onChange={(e) => {
                  setDepartureDate(e.target.value);
                  if (returnDate < e.target.value) setReturnDate(e.target.value);
                }}
                disabled={isLoading}
              />
              <div className="mt-2">
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
            </div>

            <div>
              <Input
                id="returnDate"
                label="Expected Return Date"
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={isLoading}
              />
              <div className="mt-2">
                <Input
                  id="returnTime"
                  label="Expected Return Time"
                  type="time"
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Vehicle Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-brand-600" />
            <CardTitle className="text-sm">Section B: Vehicle Requirements</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="passengers" className="block text-sm font-medium text-slate-700 mb-1.5">
                Number of Passengers <span className="text-red-500">*</span>
              </label>
              <input
                id="passengers"
                type="number"
                min={1}
                max={30}
                required
                value={passengerCount}
                onChange={(e) => setPassengerCount(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="prefVehicle" className="block text-sm font-medium text-slate-700 mb-1.5">
                Vehicle Preference (Optional)
              </label>
              <select
                id="prefVehicle"
                value={preferredVehicleId}
                onChange={(e) => setPreferredVehicleId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                disabled={isLoading}
              >
                <option value="">No preference (Logistics allocates)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category} · {v.passengerCapacity} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresDriver}
                onChange={(e) => setRequiresDriver(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                disabled={isLoading}
              />
              <div>
                <span className="text-sm font-medium text-slate-900">
                  Assign a Company Driver
                </span>
                <p className="text-xs text-slate-500">
                  Check if traveling outside normal city routes or if specialized commercial licensing is needed.
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Section C: Additional Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <CardTitle className="text-sm">Section C: Additional Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              Special Instructions or Route Notes
            </label>
            <textarea
              id="notes"
              rows={2}
              className="block w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Unpaved access road; security pass required at Gate 2."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Submit Booking Request
        </Button>
      </div>
    </form>
  );
};
