import React, { useState, useEffect, useMemo } from 'react';
import { User, Vehicle, Booking } from '@/types';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
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
  RotateCw,
  Mail,
  Award,
  CreditCard,
  MapPin,
  Calendar,
} from 'lucide-react';

interface DriversManagementViewProps {
  currentUser?: User;
}

export const DriversManagementView: React.FC<DriversManagementViewProps> = ({ currentUser }) => {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'ON_MISSION' | 'INACTIVE'>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<User | null>(null);
  const [viewingDriver, setViewingDriver] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+251 9');
  const [employeeId, setEmployeeId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('Fleet Chauffeur');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersData, vehiclesData, bookingsData] = await Promise.all([
        api.getUsers(),
        api.getVehicles(),
        api.getBookings(),
      ]);
      setUsers(usersData);
      setVehicles(vehiclesData);
      setBookings(bookingsData);
    } catch (err: any) {
      console.error('Failed to load drivers data', err);
      toast.error('Failed to load drivers', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter to drivers only
  const allDrivers = useMemo(() => {
    return users.filter(
      (u) =>
        u.role === 'DRIVER' ||
        u.jobTitle?.toLowerCase().includes('driver') ||
        u.jobTitle?.toLowerCase().includes('chauffeur')
    );
  }, [users]);

  // Active trips by driver ID
  const activeMissionMap = useMemo(() => {
    const map = new Map<string, { booking: Booking; vehicle?: Vehicle }>();
    bookings
      .filter((b) => b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED')
      .forEach((b) => {
        b.assignments?.forEach((a) => {
          if (a.driverId) {
            map.set(a.driverId, {
              booking: b,
              vehicle: vehicles.find((v) => v.id === a.vehicleId),
            });
          }
        });
      });
    return map;
  }, [bookings, vehicles]);

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    return allDrivers.filter((d) => {
      const isMission = activeMissionMap.has(d.id);
      const isActive = d.isActive;

      if (statusFilter === 'ON_MISSION' && !isMission) return false;
      if (statusFilter === 'AVAILABLE' && (isMission || !isActive)) return false;
      if (statusFilter === 'INACTIVE' && isActive) return false;

      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const matchName = d.name.toLowerCase().includes(s);
        const matchPhone = (d.phone || '').toLowerCase().includes(s);
        const matchEmail = d.email.toLowerCase().includes(s);
        const matchLic = (d.licenseNumber || '').toLowerCase().includes(s);
        const matchId = (d.employeeId || '').toLowerCase().includes(s);
        if (!matchName && !matchPhone && !matchEmail && !matchLic && !matchId) return false;
      }
      return true;
    });
  }, [allDrivers, activeMissionMap, statusFilter, searchTerm]);

  const onMissionCount = allDrivers.filter((d) => activeMissionMap.has(d.id)).length;
  const availableCount = allDrivers.filter((d) => d.isActive && !activeMissionMap.has(d.id)).length;
  const inactiveCount = allDrivers.filter((d) => !d.isActive).length;

  const openAddModal = () => {
    setEditingDriver(null);
    setName('');
    setEmail(`driver.${Date.now().toString().slice(-4)}@capitalre.com`);
    setPhone('+251 9');
    setEmployeeId(`DRV-${Date.now().toString().slice(-3)}`);
    setLicenseNumber('ET-COMMERCIAL-CLASS4');
    setJobTitle('Fleet Chauffeur');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (d: User) => {
    setEditingDriver(d);
    setName(d.name);
    setEmail(d.email);
    setPhone(d.phone || '');
    setEmployeeId(d.employeeId || '');
    setLicenseNumber(d.licenseNumber || '');
    setJobTitle(d.jobTitle || 'Fleet Chauffeur');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Driver name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingDriver) {
        await api.updateUser(editingDriver.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          employeeId: employeeId.trim() || undefined,
          licenseNumber: licenseNumber.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
        });
        toast.success('Driver Updated', `Profile details for ${name} have been updated.`);
      } else {
        await api.createUser({
          name: name.trim(),
          email: email.trim(),
          password: 'CapitalDriver2026!',
          role: 'DRIVER',
          phone: phone.trim() || undefined,
          employeeId: employeeId.trim() || undefined,
          licenseNumber: licenseNumber.trim() || undefined,
          jobTitle: jobTitle.trim() || 'Fleet Chauffeur',
        });
        toast.success('Driver Registered', `${name} has been enrolled in the chauffeur directory.`);
      }
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save driver.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (driver: User) => {
    try {
      const updated = await api.updateUser(driver.id, { isActive: !driver.isActive });
      toast.info(
        `Driver ${updated.isActive ? 'Activated' : 'Deactivated'}`,
        `${driver.name} is now ${updated.isActive ? 'active' : 'inactive'}.`
      );
      await loadData();
    } catch (err: any) {
      toast.error('Update Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              Fleet Personnel
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Chauffeur Dispatch Registry
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Corporate Driver & Chauffeur Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Audit licensed enterprise chauffeurs, monitor active transit assignments, and verify driver credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm shadow-brand-500/20 font-bold"
          >
            Enroll Fleet Chauffeur
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Drivers</span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{allDrivers.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">Registered</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available on Standby</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{availableCount}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Ready</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Currently on Trip</span>
            <Car className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{onMissionCount}</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">Dispatched</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inactive / Off Duty</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{inactiveCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">Off Roster</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chauffeurs by name, phone, license, or staff ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Chauffeurs ({allDrivers.length})</option>
            <option value="AVAILABLE">Available for Dispatch ({availableCount})</option>
            <option value="ON_MISSION">On Mission / Dispatched ({onMissionCount})</option>
            <option value="INACTIVE">Inactive Accounts ({inactiveCount})</option>
          </select>
        </div>
      </div>

      {/* Drivers Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No chauffeurs found matching your criteria.</p>
          </div>
        ) : (
          filteredDrivers.map((driver) => {
            const activeMission = activeMissionMap.get(driver.id);
            const isMission = !!activeMission;

            return (
              <Card
                key={driver.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {driver.avatarUrl ? (
                          <img
                            src={driver.avatarUrl}
                            alt={driver.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            {driver.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {driver.name}
                          </h3>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {driver.employeeId ? `ID: #${driver.employeeId}` : driver.email}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isMission ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          On Mission
                        </span>
                      ) : driver.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Inactive
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 text-xs">
                    {/* Active Mission Banner if dispatched */}
                    {activeMission && (
                      <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-1">
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
                          Current Assignment:
                        </span>
                        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{activeMission.booking.destination}</span>
                        </div>
                        {activeMission.vehicle && (
                          <div className="text-[11px] text-blue-800 dark:text-blue-300 font-mono">
                            {activeMission.vehicle.registrationNumber} · {activeMission.vehicle.model}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Commercial License:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">
                          {driver.licenseNumber || 'ET-COMMERCIAL-CLASS4'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Contact Phone:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {driver.phone || '+251 91 123 4567'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Department:</span>
                        <span>{driver.department?.name || 'Capital Fleet Operations'}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingDriver(driver)}
                    className="text-xs h-7 text-slate-600 dark:text-slate-300 hover:text-brand-600"
                  >
                    View Details
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(driver)}
                      className="text-xs h-7 px-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={driver.isActive ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleActive(driver)}
                      className="text-xs h-7 px-2 font-semibold"
                    >
                      {driver.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Add / Edit Driver Modal ── */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingDriver ? `Edit Driver: ${editingDriver.name}` : 'Enroll New Fleet Chauffeur'}
          maxWidth="md"
        >
          <form onSubmit={handleSaveDriver} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold">
                {formError}
              </div>
            )}

            <Input
              id="driverName"
              label="Full Legal Name"
              required
              placeholder="e.g. Abebe Molla"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />

            {!editingDriver && (
              <Input
                id="driverEmail"
                label="System Account Email"
                required
                type="email"
                placeholder="e.g. abebe.driver@capitalre.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="driverPhone"
                label="Phone Number"
                required
                placeholder="+251 91 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                id="driverEmployeeId"
                label="Staff Driver ID"
                placeholder="e.g. DRV-084"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                id="driverLicense"
                label="Commercial License Number"
                required
                placeholder="e.g. ETH-DL-8849"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                id="driverTitle"
                label="Role Designation"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {editingDriver ? 'Save Profile' : 'Enroll Driver'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── View Driver Details Modal ── */}
      {viewingDriver && (
        <Modal
          isOpen={!!viewingDriver}
          onClose={() => setViewingDriver(null)}
          title={`Chauffeur Dossier: ${viewingDriver.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="w-14 h-14 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl">
                {viewingDriver.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {viewingDriver.name}
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  {viewingDriver.email} · {viewingDriver.phone}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={viewingDriver.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  {viewingDriver.employeeId && (
                    <span className="font-mono text-slate-500 font-semibold">
                      #{viewingDriver.employeeId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">License Certification:</span>
                <strong className="font-mono">{viewingDriver.licenseNumber || 'ET-COMMERCIAL-VALID'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operational Category:</span>
                <span>Executive & Standard Fleet Chauffeur</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Enrolled In System:</span>
                <span>{formatEthiopianDateOnly(viewingDriver.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setViewingDriver(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
