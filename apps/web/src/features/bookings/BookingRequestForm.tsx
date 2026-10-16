import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Vehicle, Booking } from '@/types';
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
} from 'lucide-react';

interface BookingRequestFormProps {
  onSuccess: (booking: Booking) => void;
  onCancel: () => void;
}

export const BookingRequestForm: React.FC<BookingRequestFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const toast = useToast();
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
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);

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

      setSubmittedBooking(booking);
      // Immediate toast — fires before success screen renders
      toast.success(
        'Request submitted!',
        `Booking ${booking.bookingReference} is now pending Logistics review.`
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to submit booking request. Please check inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success state after submission
  if (submittedBooking) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Request Submitted Successfully</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Your booking request has been sent to the Logistics Department queue for review. You will receive an in-app notification once it is approved and a vehicle is assigned.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-mono font-bold text-brand-700 dark:text-brand-400 mb-6">
            <ClipboardList className="w-4 h-4" />
            Ref: {submittedBooking.bookingReference}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => onSuccess(submittedBooking)}
            >
              View My Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSubmittedBooking(null);
                setDestination('');
                setPurpose('');
                setAdditionalNotes('');
                setPreferredVehicleId('');
                setRequiresDriver(false);
                setPassengerCount(1);
              }}
            >
              Submit Another Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request a Company Vehicle</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
            <label htmlFor="purpose" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Trip Purpose <span className="text-red-500">*</span>
            </label>
            <textarea
              id="purpose"
              required
              rows={2}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              <label htmlFor="passengers" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
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
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Vehicle Selection & Model Preference
            </label>

            {/* Visual Car Photo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Option: No Preference */}
              <div
                onClick={() => setPreferredVehicleId('')}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                  !preferredVehicleId
                    ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/50 dark:bg-brand-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Auto-Allocate (Optimal)
                    </span>
                    {!preferredVehicleId && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 ring-4 ring-brand-500/20" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Logistics Department selects the best available vehicle suited for passenger capacity and route.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                  Recommended for standard city trips
                </div>
              </div>

              {/* Vehicle Cards with Photos */}
              {vehicles.map((v) => {
                const isSelected = preferredVehicleId === v.id;
                const carImg = v.imageUrl || (
                  v.category === 'SUV' ? '/vehicles/prado.png' :
                  v.category === 'PICKUP' ? '/vehicles/hilux.png' :
                  v.category === 'MINIBUS' ? '/vehicles/hiace.png' :
                  '/vehicles/corolla.png'
                );

                return (
                  <div
                    key={v.id}
                    onClick={() => setPreferredVehicleId(v.id)}
                    className={`cursor-pointer rounded-xl border transition-all overflow-hidden flex flex-col justify-between group ${
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/30 dark:bg-brand-950/30 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Car Photo Container */}
                    <div className="relative aspect-[16/10] bg-gradient-to-b from-slate-100 to-slate-200/40 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-2.5 overflow-hidden">
                      <img
                        src={carImg}
                        alt={v.name}
                        className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
                        {v.category}
                      </span>
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-brand-500/20" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-3">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {v.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        Plate: {v.registrationNumber}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span>{v.passengerCapacity} Seats</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {v.fuelLevel ? `${v.fuelLevel}% Fuel` : 'Ready'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresDriver}
                onChange={(e) => setRequiresDriver(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-brand-600 border-slate-300 dark:border-slate-700 focus:ring-brand-500"
                disabled={isLoading}
              />
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Assign a Company Driver
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Special Instructions or Route Notes
            </label>
            <textarea
              id="notes"
              rows={2}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
