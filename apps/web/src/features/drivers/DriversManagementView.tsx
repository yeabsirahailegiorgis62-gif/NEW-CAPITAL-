import React, { useState, useEffect } from 'react';
import { Driver, Vehicle, User } from '@/types';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Phone,
  FileBadge,
  Car,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Edit2,
  Trash2,
  Award,
} from 'lucide-react';

const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd-1',
    name: 'Abebe Molla',
    phone: '+251 91 123 4567',
    licenseNumber: 'ETH-DL-8849',
    licenseClass: 'Class 3 (Light Commercial & SUV)',
    status: 'ON_MISSION',
    totalTrips: 24,
    completedTrips: 23,
    notes: 'Primary executive driver for VIP corporate delegations.',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'd-2',
    name: 'Mulugeta Tadesse',
    phone: '+251 92 345 6789',
    licenseNumber: 'ETH-DL-9102',
    licenseClass: 'Class 4 (Heavy Commercial & Minibus)',
    status: 'AVAILABLE',
    totalTrips: 31,
    completedTrips: 30,
    notes: 'Certified for interstate long-distance transit.',
    createdAt: '2026-02-15T09:00:00Z',
  },
  {
    id: 'd-3',
    name: 'Kebede Worku',
    phone: '+251 93 456 7890',
    licenseNumber: 'ETH-DL-7421',
    licenseClass: 'Class 3 (Light Commercial & SUV)',
    status: 'AVAILABLE',
    totalTrips: 19,
    completedTrips: 19,
    notes: 'Assigned to site inspection & procurement logistics.',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'd-4',
    name: 'Tewodros Kassahun',
    phone: '+251 91 555 7891',
    licenseNumber: 'ETH-DL-6310',
    licenseClass: 'Class 4 (Minibus & Staff Commuter)',
    status: 'OFF_DUTY',
    totalTrips: 42,
    completedTrips: 41,
    notes: 'Designated commuter transit operator.',
    createdAt: '2025-11-20T08:00:00Z',
  },
];

interface DriversManagementViewProps {
  currentUser?: User;
}

export const DriversManagementView: React.FC<DriversManagementViewProps> = ({ currentUser }) => {
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('capital_fleet_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseClass, setLicenseClass] = useState('Class 3 (Light Commercial & SUV)');
  const [status, setStatus] = useState<'AVAILABLE' | 'ON_MISSION' | 'OFF_DUTY'>('AVAILABLE');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('capital_fleet_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    api.getVehicles().then(setVehicles).catch(console.error);
  }, []);

  const openAddModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('+251 9');
    setLicenseNumber('');
    setLicenseClass('Class 3 (Light Commercial & SUV)');
    setStatus('AVAILABLE');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (d: Driver) => {
    setEditingDriver(d);
    setName(d.name);
    setPhone(d.phone);
    setLicenseNumber(d.licenseNumber);
    setLicenseClass(d.licenseClass || 'Class 3 (Light Commercial & SUV)');
    setStatus(d.status);
    setNotes(d.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !licenseNumber.trim()) {
      setError('Name, phone, and license number are required.');
      return;
    }

    if (editingDriver) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === editingDriver.id
            ? { ...d, name, phone, licenseNumber, licenseClass, status, notes }
            : d
        )
      );
    } else {
      const newDriver: Driver = {
        id: `d-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim().toUpperCase(),
        licenseClass,
        status,
        totalTrips: 0,
        completedTrips: 0,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };
      setDrivers((prev) => [newDriver, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this chauffeur from the registry?')) {
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const matchName = d.name.toLowerCase().includes(s);
      const matchPhone = d.phone.toLowerCase().includes(s);
      const matchLic = d.licenseNumber.toLowerCase().includes(s);
      if (!matchName && !matchPhone && !matchLic) return false;
    }
    return true;
  });

  const availableCount = drivers.filter((d) => d.status === 'AVAILABLE').length;
  const onMissionCount = drivers.filter((d) => d.status === 'ON_MISSION').length;
  const offDutyCount = drivers.filter((d) => d.status === 'OFF_DUTY').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Corporate Driver & Chauffeur Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full directory of authorized company drivers, license certifications, mission stats, and live availability.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-bold shadow-sm"
        >
          Add Fleet Chauffeur
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Drivers</span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {drivers.length}
          </div>
          <span className="text-[11px] text-slate-400">Certified staff operators</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Available for Dispatch</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {availableCount}
          </div>
          <span className="text-[11px] text-emerald-600">Ready for assignment</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">On Active Mission</span>
            <Car className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {onMissionCount}
          </div>
          <span className="text-[11px] text-blue-600">Currently in transit</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Off Duty / Leave</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1">
            {offDutyCount}
          </div>
          <span className="text-[11px] text-slate-400">Scheduled rest interval</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'AVAILABLE', 'ON_MISSION', 'OFF_DUTY'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'All Drivers' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search driver name, phone, license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map((d) => (
          <Card key={d.id} className="overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="p-5 space-y-4">
              {/* Header with Avatar & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center font-bold text-base text-brand-700 dark:text-brand-300 shrink-0">
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {d.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {d.phone}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    d.status === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : d.status === 'ON_MISSION'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {d.status.replace('_', ' ')}
                </span>
              </div>

              {/* License & Certification Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Driving License</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {d.licenseNumber}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  {d.licenseClass || 'Commercial Class 3'}
                </div>
              </div>

              {/* Mission Statistics Strip */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Total Trips</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {d.totalTrips}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 block font-medium">Completed</span>
                  <span className="text-base font-extrabold text-emerald-600 font-mono">
                    {d.completedTrips}
                  </span>
                </div>
              </div>

              {d.notes && (
                <p className="text-[11px] text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-2">
                  "{d.notes}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(d)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Edit Driver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(d.id)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                  className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Driver Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriver ? 'Edit Fleet Chauffeur' : 'Register New Fleet Chauffeur'}
        description="Manage driver license details, emergency contact, and operational status"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          <Input
            id="driverName"
            label="Chauffeur Full Name"
            placeholder="e.g. Abebe Molla"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="driverPhone"
              label="Contact Phone Number"
              placeholder="+251 91 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              id="driverLicense"
              label="Driver License Number"
              placeholder="e.g. ETH-DL-8849"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              License Category & Classification:
            </label>
            <select
              value={licenseClass}
              onChange={(e) => setLicenseClass(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Class 3 (Light Commercial & SUV)">Class 3 (Light Commercial & SUV)</option>
              <option value="Class 4 (Heavy Commercial & Minibus)">Class 4 (Heavy Commercial & Minibus)</option>
              <option value="Class 2 (Automobile & Sedans)">Class 2 (Automobile & Sedans)</option>
              <option value="Executive Chauffeur Grade A">Executive Chauffeur Grade A</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Operational Duty Status:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'AVAILABLE', label: 'Available' },
                { id: 'ON_MISSION', label: 'On Mission' },
                { id: 'OFF_DUTY', label: 'Off Duty' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as any)}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    status === s.id
                      ? 'border-brand-600 bg-brand-500 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Operational Notes & Assignment Details:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Primary chauffeur for executive regional delegations."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingDriver ? 'Save Changes' : 'Register Chauffeur'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
