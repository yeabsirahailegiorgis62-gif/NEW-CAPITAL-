import React, { useState, useEffect } from 'react';
import { Department, TransportSystemRules, User } from '@/types';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  Settings,
  Building,
  Clock,
  ShieldAlert,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Mail,
  Phone,
  MapPin,
  Lock,
} from 'lucide-react';

const INITIAL_DEPARTMENTS = [
  { id: 'dept-1', name: 'Executive Operations', code: 'EXEC-01', description: 'C-Suite leadership & corporate governance', userCount: 4 },
  { id: 'dept-2', name: 'Sales & Real Estate Marketing', code: 'MKT-02', description: 'Property client tours and sales operations', userCount: 12 },
  { id: 'dept-3', name: 'Engineering & Construction', code: 'ENG-03', description: 'Architectural supervision and site logistics', userCount: 18 },
  { id: 'dept-4', name: 'Finance & Procurement', code: 'FIN-04', description: 'Auditing, treasury, and supply acquisitions', userCount: 7 },
  { id: 'dept-5', name: 'Human Resources & Administration', code: 'HRA-05', description: 'Personnel management and internal affairs', userCount: 5 },
  { id: 'dept-6', name: 'Logistics & Fleet Operations', code: 'LOG-06', description: 'Fleet maintenance, chauffeur dispatch, and assets', userCount: 6 },
];

const DEFAULT_RULES: TransportSystemRules = {
  dailyNoticeHours: 24,
  weeklyNoticeHours: 72,
  maxAdvanceBookingDays: 30,
  requireWeekendApproval: true,
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
  organizationName: 'Capital Real Estate & Apartment',
  dispatchEmail: 'logistics@capitalre.com',
  dispatchPhone: '+251 91 123 4567',
  dispatchLocation: 'HQ Gate 1 Fleet Dispatch Office',
};

interface SystemSettingsViewProps {
  currentUser?: User;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ currentUser }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'departments' | 'rules' | 'hours' | 'danger'>('departments');

  // Departments State
  const [departments, setDepartments] = useState<any[]>(() => {
    const saved = localStorage.getItem('capital_fleet_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  // Transport Rules State
  const [rules, setRules] = useState<TransportSystemRules>(() => {
    const saved = localStorage.getItem('capital_fleet_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES;
  });

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptError, setDeptError] = useState<string | null>(null);

  // Danger Zone Modal State
  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [dangerError, setDangerError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('capital_fleet_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('capital_fleet_rules', JSON.stringify(rules));
  }, [rules]);

  // Sync real database departments
  useEffect(() => {
    api.getDepartments().then((dbDepts) => {
      if (dbDepts && dbDepts.length > 0) {
        setDepartments((prev) => {
          const merged = [...prev];
          dbDepts.forEach((d: any) => {
            if (!merged.some((m) => m.name.toLowerCase() === d.name.toLowerCase())) {
              merged.push({
                id: d.id,
                name: d.name,
                code: `DEP-0${merged.length + 1}`,
                description: d.description || 'Corporate operations unit',
                userCount: d._count?.users || 2,
              });
            }
          });
          return merged;
        });
      }
    }).catch(console.error);
  }, []);

  const openAddDeptModal = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode(`DEP-0${departments.length + 1}`);
    setDeptDesc('');
    setDeptError(null);
    setIsDeptModalOpen(true);
  };

  const openEditDeptModal = (dept: any) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code || '');
    setDeptDesc(dept.description || '');
    setDeptError(null);
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError(null);

    if (!deptName.trim() || !deptCode.trim()) {
      setDeptError('Department name and code are required.');
      return;
    }

    // Code uniqueness validation
    const codeConflict = departments.find(
      (d) => d.code?.toUpperCase() === deptCode.trim().toUpperCase() && d.id !== editingDept?.id
    );
    if (codeConflict) {
      setDeptError(`Department code "${deptCode}" is already in use by ${codeConflict.name}.`);
      return;
    }

    if (editingDept) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id
            ? { ...d, name: deptName.trim(), code: deptCode.trim().toUpperCase(), description: deptDesc.trim() }
            : d
        )
      );
      toast.success('Department updated', `${deptName} settings saved.`);
    } else {
      const newDept = {
        id: `dept-${Date.now()}`,
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        description: deptDesc.trim(),
        userCount: 0,
      };
      setDepartments((prev) => [...prev, newDept]);
      toast.success('Department created', `${deptName} (${deptCode}) added to company directory.`);
    }

    setIsDeptModalOpen(false);
  };

  const handleDeleteDept = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      toast.info('Department removed', `${name} was deleted.`);
    }
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('capital_fleet_rules', JSON.stringify(rules));
    toast.success('Settings saved', 'Transport advance notice rules and working hours updated successfully.');
  };

  const handleResetData = () => {
    if (confirmPhrase.trim() !== 'RESET-FLEET') {
      setDangerError('Please enter the exact confirmation phrase: RESET-FLEET');
      return;
    }

    // Reset local test overrides
    localStorage.removeItem('capital_fleet_rules');
    localStorage.removeItem('capital_fleet_departments');
    localStorage.removeItem('capital_fleet_drivers');
    setRules(DEFAULT_RULES);
    setDepartments(INITIAL_DEPARTMENTS);
    setIsDangerModalOpen(false);
    setConfirmPhrase('');
    setDangerError(null);
    toast.success('System reset', 'Transport settings and local telemetry cache restored to clean factory defaults.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            System Administration & Transport Policies
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure departments, advance notice rules, working hours, corporate dispatch settings, and system safeguards.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap min-w-0 pb-px">
        {[
          { id: 'departments', label: 'Departments Directory', icon: Building },
          { id: 'rules', label: 'Notice Periods & Rules', icon: Sliders },
          { id: 'hours', label: 'Working Hours & Dispatch', icon: Clock },
          { id: 'danger', label: 'Danger Zone & Maintenance', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                isSelected
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: DEPARTMENTS MANAGEMENT ── */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company Departments</h3>
              <p className="text-xs text-slate-500">Manage corporate units, codes, and requisition quota scopes</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={openAddDeptModal}
              leftIcon={<Plus className="w-4 h-4" />}
              className="font-bold"
            >
              Add Department
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Department Name</th>
                  <th className="p-3.5">Operational Description</th>
                  <th className="p-3.5">Active Staff</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-xs text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                        {d.code}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">{d.name}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-sm truncate">{d.description || 'N/A'}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">{d.userCount || 0} Members</td>
                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDeptModal(d)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDept(d.id, d.name)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSPORT RULES & NOTICE PERIODS ── */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveRules} className="space-y-6 max-w-3xl">
          <Card className="p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Transport Notice Period Policies</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure mandatory advance booking windows to allow Logistics Officers adequate vehicle preparation time.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Daily Trip Advance Notice (Hours):
                </label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={rules.dailyNoticeHours}
                  onChange={(e) => setRules({ ...rules, dailyNoticeHours: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 24 Hours advance notice</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Weekly Multi-Day Itinerary Notice (Hours):
                </label>
                <input
                  type="number"
                  min={12}
                  max={168}
                  value={rules.weeklyNoticeHours}
                  onChange={(e) => setRules({ ...rules, weeklyNoticeHours: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: 72 Hours (3 days notice)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Maximum Booking Window in Advance (Days):
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={rules.maxAdvanceBookingDays}
                  onChange={(e) => setRules({ ...rules, maxAdvanceBookingDays: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Standard enterprise limit: 30 days</span>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer pt-3">
                  <input
                    type="checkbox"
                    checked={rules.requireWeekendApproval}
                    onChange={(e) => setRules({ ...rules, requireWeekendApproval: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Require Special Approval for Weekend Trips
                  </span>
                </label>
                <span className="text-[10px] text-slate-400 pl-6 mt-0.5">Enforces executive approval for Saturday & Sunday trips</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Notice Rules
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ── TAB 3: WORKING HOURS & OPERATIONS ── */}
      {activeTab === 'hours' && (
        <form onSubmit={handleSaveRules} className="space-y-6 max-w-3xl">
          <Card className="p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Operating Hours & Fleet Dispatch Hub</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set dispatch desk working hours and operational coordination contact details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Dispatch Operations Start Time:
                </label>
                <input
                  type="time"
                  value={rules.workingHoursStart}
                  onChange={(e) => setRules({ ...rules, workingHoursStart: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Dispatch Operations End Time:
                </label>
                <input
                  type="time"
                  value={rules.workingHoursEnd}
                  onChange={(e) => setRules({ ...rules, workingHoursEnd: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Logistics Dispatch Hotline:
                </label>
                <input
                  type="text"
                  value={rules.dispatchPhone}
                  onChange={(e) => setRules({ ...rules, dispatchPhone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Logistics Official Email:
                </label>
                <input
                  type="email"
                  value={rules.dispatchEmail}
                  onChange={(e) => setRules({ ...rules, dispatchEmail: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Fleet Dispatch Office Physical Location:
                </label>
                <input
                  type="text"
                  value={rules.dispatchLocation}
                  onChange={(e) => setRules({ ...rules, dispatchLocation: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Operational Hours
              </Button>
            </div>
          </Card>
        </form>
      )}

      {/* ── TAB 4: DANGER ZONE & SAFEGUARDS ── */}
      {activeTab === 'danger' && (
        <div className="space-y-6 max-w-3xl">
          <Card className="p-6 border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-700 dark:text-red-400">System Danger Zone</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Actions in this area are destructive and affect historical test records, locally configured notice intervals, and telemetry data. Proceed with caution.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-red-200/60 dark:border-red-900/40 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">Reset System Settings to Factory Defaults</span>
                <span className="text-[11px] text-slate-500">Restores default 24h/72h notice periods and standard operating hours.</span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDangerModalOpen(true)}
                className="font-bold shrink-0"
              >
                Reset System Data
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create Company Department'}
        description="Define operational unit, code prefix, and requisition quota scopes"
        maxWidth="md"
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          {deptError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
              {deptError}
            </div>
          )}

          <Input
            id="deptCode"
            label="Department Code"
            placeholder="e.g. ENG-03"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
            required
          />

          <Input
            id="deptName"
            label="Department Name"
            placeholder="e.g. Engineering & Architecture"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Department Description & Mission Scope:
            </label>
            <textarea
              rows={2}
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              placeholder="e.g. Oversight of construction sites and civil engineering travel."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingDept ? 'Save Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Danger Zone Confirmation Modal */}
      <Modal
        isOpen={isDangerModalOpen}
        onClose={() => setIsDangerModalOpen(false)}
        title="Confirm System Data Reset"
        description="This action will reset transport policies and custom parameters to factory defaults"
        maxWidth="md"
      >
        <div className="space-y-4">
          {dangerError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
              {dangerError}
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            To prevent accidental resets, please type <strong className="font-mono text-red-600">RESET-FLEET</strong> into the confirmation box below:
          </p>

          <Input
            id="confirmPhrase"
            label="Confirmation Phrase"
            placeholder="Type RESET-FLEET"
            value={confirmPhrase}
            onChange={(e) => setConfirmPhrase(e.target.value)}
            className="font-mono font-bold"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={() => setIsDangerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="button" onClick={handleResetData}>
              Execute Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
