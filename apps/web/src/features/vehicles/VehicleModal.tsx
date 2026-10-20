import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, VehicleCategory, VehicleOperationalStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Upload, Trash2, Camera, Car, Check } from 'lucide-react';
import { fileToOptimizedDataUrl, VEHICLE_PRESET_ASSETS } from '@/lib/imageUtils';

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
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name);
      setMake(vehicle.make);
      setModel(vehicle.model);
      setRegistrationNumber(vehicle.registrationNumber);
      setCategory(vehicle.category);
      setPassengerCapacity(vehicle.passengerCapacity);
      setOperationalStatus(vehicle.operationalStatus);
      setImageUrl(vehicle.imageUrl || '');
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
      setImageUrl('/vehicles/prado.png');
      setDescription('');
      setNotes('');
    }
    setError(null);
  }, [vehicle, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const optimized = await fileToOptimizedDataUrl(file, {
        maxWidth: 900,
        maxHeight: 600,
        quality: 0.85,
      });
      setImageUrl(optimized);
    } catch (err: any) {
      setError(err.message || 'Failed to process vehicle photo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (preset: typeof VEHICLE_PRESET_ASSETS[0]) => {
    setImageUrl(preset.url);
    if (!vehicle && !name) {
      setName(preset.name);
      setCategory(preset.category as VehicleCategory);
    }
  };

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
        imageUrl: imageUrl.trim() || null,
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
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Hidden File Input for Device Photo Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Vehicle Photo Upload & Preview Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Vehicle Photograph
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                isLoading={isUploading}
                className="text-xs font-semibold border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 shadow-2xs"
              >
                Upload Car Photo
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageUrl('')}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                  className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Photo Preview Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative h-44 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 overflow-hidden flex items-center justify-center cursor-pointer group transition-all hover:border-brand-500 dark:hover:border-brand-400"
            title="Click to upload or replace car photo"
          >
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={name || 'Vehicle'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                  <Upload className="w-6 h-6 mb-1 text-white" />
                  <span className="text-xs font-semibold">Click to replace photo</span>
                  <span className="text-[10px] text-slate-200">JPG, PNG, WebP</span>
                </div>
              </>
            ) : (
              <div className="text-center p-4 space-y-1 text-slate-400 dark:text-slate-500">
                <Car className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Click to select vehicle photo from your device
                </p>
                <p className="text-[11px] text-slate-400">
                  Recommended: 16:9 ratio photo, up to 20MB
                </p>
              </div>
            )}
          </div>

          {/* Official Fleet Model Preset Quick-Picker */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Or choose from Capital Fleet models:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {VEHICLE_PRESET_ASSETS.map((preset) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-1 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/50 dark:bg-brand-950/50'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 mb-1">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VehicleCategory)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-xs min-h-[44px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="PICKUP">Pickup</option>
              <option value="MINIBUS">Minibus</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Capacity</label>
            <input
              type="number"
              min={1}
              max={60}
              required
              value={passengerCapacity}
              onChange={(e) => setPassengerCapacity(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-xs min-h-[44px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Operational Status</label>
            <select
              value={operationalStatus}
              onChange={(e) => setOperationalStatus(e.target.value as VehicleOperationalStatus)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-xs min-h-[44px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ACTIVE">ACTIVE (Operational)</option>
              <option value="MAINTENANCE">MAINTENANCE (Workshop)</option>
              <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Description</label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            placeholder="e.g. 4WD executive SUV for long-distance highway travel"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Internal Notes</label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            placeholder="e.g. Service schedule: every 5,000 km. Assigned fuel card: #8821"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
