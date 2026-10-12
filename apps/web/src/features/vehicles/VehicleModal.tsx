import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleCategory, VehicleOperationalStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onSave: (data: Partial<Vehicle>) => Promise<void>;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('SUV');
  const [passengerCapacity, setPassengerCapacity] = useState(5);
  const [operationalStatus, setOperationalStatus] = useState<VehicleOperationalStatus>('ACTIVE');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name);
      setMake(vehicle.make);
      setModel(vehicle.model);
      setRegistrationNumber(vehicle.registrationNumber);
      setCategory(vehicle.category);
      setPassengerCapacity(vehicle.passengerCapacity);
      setOperationalStatus(vehicle.operationalStatus);
      setDescription(vehicle.description || '');
      setNotes(vehicle.notes || '');
    } else {
      setName('');
      setMake('Toyota');
      setModel('');
      setRegistrationNumber('');
      setCategory('SUV');
      setPassengerCapacity(5);
      setOperationalStatus('ACTIVE');
      setDescription('');
      setNotes('');
    }
    setError(null);
  }, [vehicle, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !make.trim() || !model.trim() || !registrationNumber.trim()) {
      setError('Name, make, model, and registration number are required.');
      return;
    }

    try {
      setIsLoading(true);
      await onSave({
        name: name.trim(),
        make: make.trim(),
        model: model.trim(),
        registrationNumber: registrationNumber.trim().toUpperCase(),
        category,
        passengerCapacity,
        operationalStatus,
        description: description.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save vehicle.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? `Edit Vehicle: ${vehicle.name}` : 'Add New Company Vehicle'}
      description="Manage fleet inventory and operational assignment readiness"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="vName"
            label="Vehicle Display Name"
            required
            placeholder="e.g. Land Cruiser Prado TX"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />

          <Input
            id="vReg"
            label="Registration / Plate #"
            required
            placeholder="e.g. 3-A12490"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="vMake"
            label="Manufacturer / Make"
            required
            placeholder="e.g. Toyota"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            disabled={isLoading}
          />

          <Input
            id="vModel"
            label="Model & Year"
            required
            placeholder="e.g. Prado 2022"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VehicleCategory)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm min-h-[44px] bg-white"
            >
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="PICKUP">Pickup</option>
              <option value="MINIBUS">Minibus</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacity</label>
            <input
              type="number"
              min={1}
              max={60}
              required
              value={passengerCapacity}
              onChange={(e) => setPassengerCapacity(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Operational Status</label>
            <select
              value={operationalStatus}
              onChange={(e) => setOperationalStatus(e.target.value as VehicleOperationalStatus)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm min-h-[44px] bg-white font-medium"
            >
              <option value="ACTIVE">ACTIVE (Operational)</option>
              <option value="MAINTENANCE">MAINTENANCE (Workshop)</option>
              <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            placeholder="e.g. 4WD executive SUV for long-distance highway travel"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Internal Notes</label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
            placeholder="e.g. Service schedule: every 5,000 km. Assigned fuel card: #8821"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {vehicle ? 'Save Changes' : 'Create Vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
