import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Booking, Vehicle } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatEthiopianDateTime } from '@/lib/utils';
import { Car, CheckCircle2, AlertCircle, Shield, User, Phone, FileText } from 'lucide-react';

interface AssignVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onAssigned: () => void;
}

export const AssignVehicleModal: React.FC<AssignVehicleModalProps> = ({
  isOpen,
  onClose,
  booking,
  onAssigned,
}) => {
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (booking && isOpen) {
      setSelectedVehicleId('');
      setDriverName(booking.requiresDriver ? 'Abebe Molla' : '');
      setDriverPhone(booking.requiresDriver ? '+251 91 123 4567' : '');
      setAssignmentNotes('');
      setError(null);

      // Fetch availability specifically for this booking's time window!
      setIsLoading(true);
      api
        .getFleetAvailability(booking.departureAt, booking.expectedReturnAt, booking.passengerCount)
        .then((data) => {
          setAvailableVehicles(data);
          // Preselect first available vehicle or preferred if available
          const preferred = data.find(
            (item) => item.vehicle.id === booking.preferredVehicleId && item.isAvailable
          );
          if (preferred) {
            setSelectedVehicleId(preferred.vehicle.id);
          } else {
            const firstAvail = data.find((item) => item.isAvailable);
            if (firstAvail) setSelectedVehicleId(firstAvail.vehicle.id);
          }
        })
        .catch((err) => {
          setError('Failed to compute fleet availability.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [booking, isOpen]);

  if (!booking) return null;

  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedVehicleId) {
      setError('Please select an available vehicle from the fleet.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.assignVehicle(booking.id, {
        vehicleId: selectedVehicleId,
        driverName: driverName.trim() || undefined,
        driverPhone: driverPhone.trim() || undefined,
        assignmentNotes: assignmentNotes.trim() || undefined,
      });

      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Assignment failed due to scheduling conflict or invalid state.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Vehicle to #${booking.bookingReference}`}
      description={`Trip to ${booking.destination} · ${formatEthiopianDateTime(booking.departureAt)} - ${formatEthiopianDateTime(booking.expectedReturnAt)}`}
      maxWidth="xl"
    >
      <form onSubmit={handleConfirmAssignment} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Assignment Failed:</strong>
              {error}
            </div>
          </div>
        )}

        {/* Booking trip summary reminder */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-slate-400 block">Requested By:</span>
            <span className="font-semibold text-slate-800">{booking.requester?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Passengers:</span>
            <span className="font-semibold text-slate-800">{booking.passengerCount} Persons</span>
          </div>
          <div>
            <span className="text-slate-400 block">Driver Policy:</span>
            <span className="font-semibold text-slate-800">
              {booking.requiresDriver ? 'Company Driver Requested' : 'Self-Driven'}
            </span>
          </div>
        </div>

        {/* Fleet Availability Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Select Compatible Fleet Vehicle (Verified for this interval):
          </label>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Computing schedule availability...
            </div>
          ) : availableVehicles.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
              No vehicles found matching the capacity of {booking.passengerCount} passengers.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {availableVehicles.map((item) => {
                const v = item.vehicle;
                const isAvail = item.isAvailable;
                const isSelected = selectedVehicleId === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => isAvail && setSelectedVehicleId(v.id)}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      !isAvail
                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : isSelected
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 cursor-pointer'
                        : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="vehicleChoice"
                        checked={isSelected}
                        disabled={!isAvail}
                        onChange={() => setSelectedVehicleId(v.id)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div className="w-12 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 p-0.5">
                        <img
                          src={
                            v.imageUrl || (
                              v.category === 'SUV' ? '/vehicles/prado.png' :
                              v.category === 'PICKUP' ? '/vehicles/hilux.png' :
                              v.category === 'MINIBUS' ? '/vehicles/hiace.png' :
                              '/vehicles/corolla.png'
                            )
                          }
                          alt={v.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{v.name}</span>
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {v.registrationNumber}
                          </span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 block">
                          {v.category} · {v.passengerCapacity} seats · {v.make} {v.model}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge status={item.availabilityStatus} size="sm" />
                      {!isAvail && (
                        <span className="text-[10px] text-red-600 block mt-1 max-w-[150px] truncate">
                          {item.reason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Driver Coordination */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <span className="block text-xs font-semibold text-slate-700">Driver Coordination:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="driverName"
              label="Assigned Driver Name"
              placeholder="e.g. Abebe Molla or Self-driven"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              id="driverPhone"
              label="Driver Phone Number"
              placeholder="e.g. +251 91 123 4567"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Assignment Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Logistics Assignment Instructions:
          </label>
          <textarea
            rows={2}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Pick up vehicle keys and fuel card at Gate 1 office before 08:00 AM."
            value={assignmentNotes}
            onChange={(e) => setAssignmentNotes(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={!selectedVehicleId}
          >
            Confirm Vehicle Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
