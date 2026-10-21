import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { VehicleIssue, Vehicle, User, VehicleMaintenance, MaintenanceCategory, MaintenanceStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatEthiopianDateTime, formatEthiopianDateOnly } from '@/lib/utils';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Clock,
  Car,
  ShieldAlert,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  Gauge,
  Building,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

interface MaintenanceViewProps {
  currentUser: User;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'records' | 'issues'>('records');
  const [maintenanceRecords, setMaintenanceRecords] = useState<VehicleMaintenance[]>([]);
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [issues, setIssues] = useState<VehicleIssue[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Maintenance Modal
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [mVehicleId, setMVehicleId] = useState('');
  const [mCategory, setMCategory] = useState<MaintenanceCategory>('ROUTINE_SERVICE');
  const [mProblem, setMProblem] = useState('');
  const [mDescription, setMDescription] = useState('');
  const [mDate, setMDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mOdometer, setMOdometer] = useState<string>('');
  const [mProvider, setMProvider] = useState('');
  const [mEstimatedCost, setMEstimatedCost] = useState<string>('');
  const [mActualCost, setMActualCost] = useState<string>('');
  const [mNextDate, setMNextDate] = useState('');
  const [mNextOdometer, setMNextOdometer] = useState<string>('');
  const [mStatus, setMStatus] = useState<MaintenanceStatus>('SCHEDULED');
  const [mNotes, setMNotes] = useState('');
  const [isSubmittingMaintenance, setIsSubmittingMaintenance] = useState(false);

  // Issue Reporting Modal state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [setMaintenanceStatus, setSetMaintenanceStatus] = useState(false);
  const [affectedBookingsWarning, setAffectedBookingsWarning] = useState<any[]>([]);

  // Resolve Modal state
  const [resolvingIssue, setResolvingIssue] = useState<VehicleIssue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [maintenanceData, overviewData, issuesData, vehiclesData] = await Promise.all([
        api.getMaintenance().catch(() => [] as VehicleMaintenance[]),
        api.getMaintenanceOverview().catch(() => null),
        api.getIssues().catch(() => [] as VehicleIssue[]),
        api.getVehicles().catch(() => [] as Vehicle[]),
      ]);
      setMaintenanceRecords(maintenanceData);
      setOverviewStats(overviewData);
      setIssues(issuesData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Failed to load maintenance records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mVehicleId || !mDescription.trim()) {
      alert('Please select a vehicle and provide a service description.');
      return;
    }

    try {
      setIsSubmittingMaintenance(true);
      await api.createMaintenance({
        vehicleId: mVehicleId,
        category: mCategory,
        problemDescription: mProblem.trim() || undefined,
        serviceDescription: mDescription.trim(),
        serviceDate: new Date(mDate).toISOString(),
        odometerReading: mOdometer ? Number(mOdometer) : undefined,
        serviceProvider: mProvider.trim() || undefined,
        estimatedCost: mEstimatedCost ? Number(mEstimatedCost) : undefined,
        actualCost: mActualCost ? Number(mActualCost) : undefined,
        nextServiceDate: mNextDate ? new Date(mNextDate).toISOString() : undefined,
        nextServiceOdometer: mNextOdometer ? Number(mNextOdometer) : undefined,
        status: mStatus,
        notes: mNotes.trim() || undefined,
      });

      setIsNewMaintenanceOpen(false);
      resetMaintenanceForm();
      await loadData();
    } catch (err: any) {
      alert(`Failed to save maintenance record: ${err.message || err}`);
    } finally {
      setIsSubmittingMaintenance(false);
    }
  };

  const resetMaintenanceForm = () => {
    setMVehicleId('');
    setMCategory('ROUTINE_SERVICE');
    setMProblem('');
    setMDescription('');
    setMDate(new Date().toISOString().slice(0, 10));
    setMOdometer('');
    setMProvider('');
    setMEstimatedCost('');
    setMActualCost('');
    setMNextDate('');
    setMNextOdometer('');
    setMStatus('SCHEDULED');
    setMNotes('');
  };

  const handleUpdateStatus = async (recordId: string, newStatus: MaintenanceStatus) => {
    try {
      await api.updateMaintenance(recordId, { status: newStatus });
      await loadData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || err}`);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !issueDescription.trim()) return;

    try {
      const res = await api.reportIssue({
        vehicleId: selectedVehicleId,
        description: issueDescription.trim(),
        severity: issueSeverity,
        setMaintenanceStatus,
      });

      if (res.affectedBookings && res.affectedBookings.length > 0) {
        setAffectedBookingsWarning(res.affectedBookings);
      } else {
        setIsReportOpen(false);
        setIssueDescription('');
        setSelectedVehicleId('');
      }

      await loadData();
    } catch (err) {
      console.error('Failed to submit issue', err);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue) return;

    try {
      await api.updateIssue(resolvingIssue.id, {
        status: 'RESOLVED',
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      setResolvingIssue(null);
      setResolutionNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to resolve issue', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Fleet Maintenance & Health Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Preventive service scheduling, workshop costs, safety locks, and inspection alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportOpen(true)}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          >
            Report Issue
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewMaintenanceOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
          >
            Log Maintenance
          </Button>
        </div>
      </div>

      {/* ── KPI Operational Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Under Maintenance</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {overviewStats?.vehiclesInMaintenanceCount ?? vehicles.filter((v) => v.operationalStatus === 'MAINTENANCE').length}
              </span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Overdue Service</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">
                {overviewStats?.overdueMaintenanceCount ?? 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Due in 30 Days</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {overviewStats?.dueSoonCount ?? 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Open Vehicle Issues</span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {issues.filter((i) => i.status !== 'RESOLVED').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'records'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Maintenance & Service Log ({maintenanceRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'issues'
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Reported Safety Issues ({issues.length})
        </button>
      </div>

      {/* ── TAB 1: Maintenance Records Table ── */}
      {activeTab === 'records' && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Preventive & Corrective Maintenance History
            </CardTitle>
            <span className="text-xs text-slate-400">
              {maintenanceRecords.length} service records found
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading maintenance records...</div>
            ) : maintenanceRecords.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                <Wrench className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                No maintenance records logged yet. Click "Log Maintenance" to record scheduled services.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Service Description</th>
                      <th className="py-3 px-4">Service Date</th>
                      <th className="py-3 px-4">Odometer</th>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Cost (ETB)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {maintenanceRecords.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{m.vehicle?.name || 'Asset'}</div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {m.vehicle?.registrationNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                            {m.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {m.serviceDescription}
                          {m.problemDescription && (
                            <span className="block text-[11px] text-slate-400 truncate">
                              Prob: {m.problemDescription}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {formatEthiopianDateOnly(m.serviceDate)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {m.odometerReading ? `${m.odometerReading.toLocaleString()} km` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {m.serviceProvider || 'Internal Workshop'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                          {m.actualCost ? `${m.actualCost.toLocaleString()} ETB` : m.estimatedCost ? `~${m.estimatedCost.toLocaleString()} ETB` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : m.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : m.status === 'SCHEDULED'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {m.status !== 'COMPLETED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(m.id, 'COMPLETED')}
                                title="Mark as Completed"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 p-1 h-7"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {m.status === 'SCHEDULED' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStatus(m.id, 'IN_PROGRESS')}
                                title="Mark as In Progress"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 p-1 h-7 text-[10px]"
                              >
                                Start
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: Reported Issues ── */}
      {activeTab === 'issues' && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Driver & Staff Vehicle Issue Reports
            </CardTitle>
            <span className="text-xs text-slate-400">
              {issues.length} reported issues
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {issues.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                No outstanding vehicle defects or safety concerns reported.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Problem Description</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Reported By</th>
                      <th className="py-3 px-4">Reported Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {issues.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{i.vehicle?.name}</div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {i.vehicle?.registrationNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-sm">
                          {i.description}
                          {i.resolutionNotes && (
                            <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                              Resolution: {i.resolutionNotes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            i.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : i.severity === 'HIGH'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                              : i.severity === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {i.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {i.reportedBy?.name || 'Staff Member'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {formatEthiopianDateTime(i.reportedAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            i.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {i.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {i.status !== 'RESOLVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setResolvingIssue(i)}
                              className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              Resolve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Log Maintenance Modal ── */}
      {isNewMaintenanceOpen && (
        <Modal
          isOpen={isNewMaintenanceOpen}
          onClose={() => setIsNewMaintenanceOpen(false)}
          title="Log Vehicle Maintenance & Workshop Service"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateMaintenanceSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fleet Vehicle: *
                </label>
                <select
                  required
                  value={mVehicleId}
                  onChange={(e) => setMVehicleId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Select Vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber}) · {v.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maintenance Category:
                </label>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value as MaintenanceCategory)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="ROUTINE_SERVICE">Routine Periodic Service</option>
                  <option value="OIL_CHANGE">Engine Oil & Filter Change</option>
                  <option value="TIRE_ROTATION_REPLACEMENT">Tire Replacement & Wheel Alignment</option>
                  <option value="BRAKE_SERVICE">Brake Pads & Hydraulics</option>
                  <option value="ENGINE_REPAIR">Engine Mechanical Overhaul</option>
                  <option value="TRANSMISSION_REPAIR">Transmission / Gearbox</option>
                  <option value="ELECTRICAL_BATTERY">Battery & Electrical System</option>
                  <option value="BODYWORK_PAINT">Body Repair & Paint</option>
                  <option value="ANNUAL_INSPECTION">Annual Transport Authority Inspection</option>
                  <option value="EMERGENCY_REPAIR">Emergency Roadside Repair</option>
                  <option value="OTHER">Other Workshop Service</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Description: *
                </label>
                <Input
                  required
                  placeholder="e.g. 5,000 km routine inspection, engine oil 15W-40, oil filter & air filter change"
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reported Problem (if repair work):
                </label>
                <Input
                  placeholder="e.g. Squeaking noise during hard braking on steep descent"
                  value={mProblem}
                  onChange={(e) => setMProblem(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Date:
                </label>
                <Input
                  type="date"
                  value={mDate}
                  onChange={(e) => setMDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Odometer at Service (km):
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 15400"
                  value={mOdometer}
                  onChange={(e) => setMOdometer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Provider / Workshop:
                </label>
                <Input
                  placeholder="e.g. MOENCO Workshop / TotalEnergies Service Center"
                  value={mProvider}
                  onChange={(e) => setMProvider(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Cost (ETB):
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 8500"
                  value={mActualCost}
                  onChange={(e) => setMActualCost(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Next Scheduled Service Date:
                </label>
                <Input
                  type="date"
                  value={mNextDate}
                  onChange={(e) => setMNextDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Next Service Odometer (km):
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 20000"
                  value={mNextOdometer}
                  onChange={(e) => setMNextOdometer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Status:
                </label>
                <select
                  value={mStatus}
                  onChange={(e) => setMStatus(e.target.value as MaintenanceStatus)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Workshop Notes / Parts Replaced:
                </label>
                <textarea
                  rows={2}
                  placeholder="Record part serial numbers, mechanic notes, warranty terms..."
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsNewMaintenanceOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="submit"
                isLoading={isSubmittingMaintenance}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
              >
                Save Maintenance Record
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Report Issue Modal ── */}
      {isReportOpen && (
        <Modal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          title="Report Vehicle Issue or Defect"
          maxWidth="md"
        >
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle:
              </label>
              <select
                required
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Severity:
              </label>
              <select
                value={issueSeverity}
                onChange={(e) => setIssueSeverity(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description:
              </label>
              <textarea
                required
                rows={3}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={setMaintenanceStatus}
                  onChange={(e) => setSetMaintenanceStatus(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">
                    Lock Vehicle into Maintenance
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Immediately marks vehicle status as MAINTENANCE to prevent double-booking and assignment.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsReportOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold">
                Submit Issue
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Resolve Issue Modal ── */}
      {resolvingIssue && (
        <Modal
          isOpen={!!resolvingIssue}
          onClose={() => setResolvingIssue(null)}
          title={`Resolve Issue · ${resolvingIssue.vehicle?.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Record how the issue was fixed and by whom.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Resolution Notes:
              </label>
              <textarea
                required
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Replaced worn brake pads with OEM parts, verified stopping distance..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setResolvingIssue(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="success" type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Confirm Resolved
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
