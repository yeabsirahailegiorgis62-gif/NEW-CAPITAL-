import React, { useState, useEffect } from 'react';
import { SystemSettings, User } from '@/types';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  Shield,
  KeyRound,
  Clock,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Lock,
  Calendar,
  Car,
  AlertOctagon,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface SystemSettingsViewProps {
  currentUser?: User;
}

const DEFAULT_SETTINGS: SystemSettings = {
  maxFailedLoginAttempts: 5,
  accountLockoutDuration: 15,
  sessionTimeout: 30,
  requireStrongPassword: true,
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  forcePasswordChangeAfterReset: true,
  passwordResetExpiresMinutes: 60,
  minimumNoticeHours: 24,
  maxPassengerCapacity: 14,
  allowSameDayRequests: false,
  allowWeekendRequests: false,
  allowHolidayRequests: false,
  requireRequestApproval: true,
  pendingRequestExpirationHours: 48,
  allowCancelPending: true,
  allowEditPending: true,
  allowCancelAfterApproval: false,
  preventDoubleVehicleAssignment: true,
  preventDoubleDriverAssignment: true,
  onlyShowAvailableVehicles: true,
  onlyShowActiveDrivers: true,
  requireDriverConfirmation: true,
  autoSuggestSuitableVehicle: true,
};

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ currentUser }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'security' | 'requests' | 'lifecycle' | 'assignments' | 'danger'>('security');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Danger Zone Modal State
  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  const REQUIRED_PHRASE = 'PERMANENTLY-DELETE-OPERATIONS-DATA';

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to load system settings', err);
      toast.error('Failed to load settings', err.message || 'Using local defaults');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      toast.success('Settings Saved', 'System security and dispatch policies have been updated.');
    } catch (err: any) {
      console.error('Failed to save settings', err);
      toast.error('Failed to save settings', err.message || 'Please verify form inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeOperations = async () => {
    setPurgeError(null);
    if (!adminPassword.trim()) {
      setPurgeError('Administrator password is required for security re-authentication.');
      return;
    }
    if (confirmPhrase.trim() !== REQUIRED_PHRASE) {
      setPurgeError(`Please type exactly "${REQUIRED_PHRASE}" to confirm.`);
      return;
    }

    try {
      setIsPurging(true);
      const res = await api.purgeOperationsData(adminPassword, confirmPhrase);
      toast.success('Operations Data Purged', res.message);
      setIsDangerModalOpen(false);
      setAdminPassword('');
      setConfirmPhrase('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setPurgeError(err.message || 'Purge failed. Verify administrator credentials.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              System Configuration
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Enterprise Policy Controls
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            System Governance & Operational Policies
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure backend-enforced account security, transport notice constraints, request lifecycle rules, and fleet assignment guards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </Button>

          {activeTab !== 'danger' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSettings}
              disabled={isLoading || isSaving}
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="shadow-sm shadow-brand-500/20 font-bold"
            >
              Save Policy Changes
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Strip */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-indigo-500" />
          <span>Security & Authentication</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'requests'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-brand-500" />
          <span>Request Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lifecycle')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'lifecycle'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Request Lifecycle</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'assignments'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-blue-500" />
          <span>Assignment Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'danger'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* ── TAB 1: SECURITY & AUTHENTICATION ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Card A: Login Security */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Login Security & Account Lockout
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Defend user accounts against brute-force attacks and configure automatic session timeout.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Failed Login Attempts
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Number of consecutive failed attempts before account is temporarily locked.
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={settings.maxFailedLoginAttempts}
                    onChange={(e) =>
                      setSettings({ ...settings, maxFailedLoginAttempts: parseInt(e.target.value) || 5 })
                    }
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Lockout Duration (Minutes)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Minutes before a locked account is eligible to sign in again.
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={settings.accountLockoutDuration}
                    onChange={(e) =>
                      setSettings({ ...settings, accountLockoutDuration: parseInt(e.target.value) || 15 })
                    }
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Session Timeout (Minutes)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Duration of user inactivity before an active session automatically expires.
                  </p>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })
                    }
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card B: Password Policy */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Password Complexity Policy
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Enforce cryptographic strength rules during credential creation, updates, and resets.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Enforce Strong Passwords
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Reject common dictionary terms and simple sequences.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireStrongPassword}
                    onChange={(e) => setSettings({ ...settings, requireStrongPassword: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Minimum Password Length
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Recommended: 8+ characters.
                    </span>
                  </div>
                  <input
                    type="number"
                    min={6}
                    max={64}
                    value={settings.minPasswordLength}
                    onChange={(e) =>
                      setSettings({ ...settings, minPasswordLength: parseInt(e.target.value) || 8 })
                    }
                    className="w-20 text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Require Uppercase Letter [A-Z]
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Must contain at least one uppercase character.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireUppercase}
                    onChange={(e) => setSettings({ ...settings, requireUppercase: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Require Numeric Digit [0-9]
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Must contain at least one numeric character.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireNumber}
                    onChange={(e) => setSettings({ ...settings, requireNumber: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 md:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Require Special Symbol [!@#$%^&*]
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Must contain at least one non-alphanumeric punctuation or symbol.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireSpecialChar}
                    onChange={(e) => setSettings({ ...settings, requireSpecialChar: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card C: Password Reset Policy */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Password Reset & Token Expiry
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure single-use token life and administrative reset security protocols.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Force Password Change After Administrative Reset
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Require users to establish their own password upon first sign in after a reset.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.forcePasswordChangeAfterReset}
                    onChange={(e) => setSettings({ ...settings, forcePasswordChangeAfterReset: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Password Reset Expires After (Minutes)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Single-use token validity window (default: 60 minutes).
                    </span>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={settings.passwordResetExpiresMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, passwordResetExpiresMinutes: parseInt(e.target.value) || 60 })
                    }
                    className="w-20 text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 2: REQUEST RULES ── */}
      {activeTab === 'requests' && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Transport Requisition Scheduling Rules
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Parameters enforced automatically by the server whenever staff submit trip requisitions.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Minimum Advance Notice Period (Hours)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Standard minimum advance notice required before departure (default: 24h).
                </p>
                <input
                  type="number"
                  min={0}
                  max={168}
                  value={settings.minimumNoticeHours}
                  onChange={(e) =>
                    setSettings({ ...settings, minimumNoticeHours: parseInt(e.target.value) || 24 })
                  }
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Default Maximum Passenger Capacity
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  System safety cap per single booking request (default: 14 seats).
                </p>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.maxPassengerCapacity}
                  onChange={(e) =>
                    setSettings({ ...settings, maxPassengerCapacity: parseInt(e.target.value) || 14 })
                  }
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Allow Same-Day Requests
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Permit requisitions where departure is scheduled for today.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowSameDayRequests}
                  onChange={(e) => setSettings({ ...settings, allowSameDayRequests: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Allow Weekend Requests (Saturday & Sunday)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Enable booking travel across weekend days.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowWeekendRequests}
                  onChange={(e) => setSettings({ ...settings, allowWeekendRequests: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 md:col-span-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Allow Public Holiday Requests
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Permit bookings scheduled on officially gazetted holidays.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowHolidayRequests}
                  onChange={(e) => setSettings({ ...settings, allowHolidayRequests: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: REQUEST LIFECYCLE ── */}
      {activeTab === 'lifecycle' && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Request Lifecycle, Expiration & Modification Rules
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Control how bookings progress through approval, editing, cancellation, and expiration.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Require Logistics Officer Approval
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Requests must be explicitly approved before vehicles can be dispatched.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireRequestApproval}
                  onChange={(e) => setSettings({ ...settings, requireRequestApproval: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Pending Request Expiration (Hours)
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Unreviewed pending requests auto-expire after this duration (default: 48h).
                </p>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={settings.pendingRequestExpirationHours}
                  onChange={(e) =>
                    setSettings({ ...settings, pendingRequestExpirationHours: parseInt(e.target.value) || 48 })
                  }
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Allow Requester to Cancel Pending
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Permit employees to withdraw their requests before Logistics review.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowCancelPending}
                  onChange={(e) => setSettings({ ...settings, allowCancelPending: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Allow Requester to Edit Pending
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Allow updates to destination or itinerary before review.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowEditPending}
                  onChange={(e) => setSettings({ ...settings, allowEditPending: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 md:col-span-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Allow Cancellation After Approval
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Permit staff cancellation once trip is already approved or vehicle is assigned.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowCancelAfterApproval}
                  onChange={(e) => setSettings({ ...settings, allowCancelAfterApproval: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 4: ASSIGNMENT RULES ── */}
      {activeTab === 'assignments' && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Fleet & Chauffeur Assignment Guards
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Prevent scheduling conflicts, double bookings, and inactive asset allocation.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Prevent Double Vehicle Assignment
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    A vehicle cannot be allocated to overlapping trip periods or simultaneous days.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.preventDoubleVehicleAssignment}
                  onChange={(e) => setSettings({ ...settings, preventDoubleVehicleAssignment: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Prevent Double Driver Assignment
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    A chauffeur cannot be scheduled to conflicting departure windows.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.preventDoubleDriverAssignment}
                  onChange={(e) => setSettings({ ...settings, preventDoubleDriverAssignment: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Only Show Available Vehicles in Dispatch
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Exclude vehicles under maintenance or currently on active mission.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.onlyShowAvailableVehicles}
                  onChange={(e) => setSettings({ ...settings, onlyShowAvailableVehicles: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Only Show Active Drivers
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Filter dispatch choices to active, verified drivers only.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.onlyShowActiveDrivers}
                  onChange={(e) => setSettings({ ...settings, onlyShowActiveDrivers: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Require Driver Acceptance / Confirmation
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Chauffeurs must formally accept assignments before trip commencement.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireDriverConfirmation}
                  onChange={(e) => setSettings({ ...settings, requireDriverConfirmation: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Auto-Suggest Suitable Vehicle
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Recommend best-fit vehicle matching passenger count and category automatically.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSuggestSuitableVehicle}
                  onChange={(e) => setSettings({ ...settings, autoSuggestSuitableVehicle: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 5: DANGER ZONE ── */}
      {activeTab === 'danger' && (
        <Card className="rounded-3xl border-2 border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-rose-200 dark:border-rose-900/60 pb-4 bg-rose-50/80 dark:bg-rose-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-rose-950 dark:text-rose-100 font-black">
                  Danger Zone: Destructive Operations
                </CardTitle>
                <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                  Irreversible administrative operations requiring elevated password re-authentication.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Permanently Delete Transport Operations Data</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded">
                    Irreversible
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Permanently deletes all bookings, weekly schedules, vehicle assignments, approvals, and notifications.
                  <strong> Retains all drivers, vehicles, user accounts, departments, and system configuration.</strong>
                   A permanent security audit log entry of this action will be preserved.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setIsDangerModalOpen(true);
                  setPurgeError(null);
                  setAdminPassword('');
                  setConfirmPhrase('');
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 shadow-sm shadow-rose-600/20"
              >
                Initiate Data Purge...
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Elevated Re-Authentication & Data Purge Modal ── */}
      {isDangerModalOpen && (
        <Modal
          isOpen={isDangerModalOpen}
          onClose={() => setIsDangerModalOpen(false)}
          title="Elevated Security Authorization: Purge Operations Data"
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
                <p className="font-extrabold text-sm">CRITICAL WARNING: THIS ACTION CANNOT BE UNDONE</p>
                <p>
                  You are about to permanently purge all operational transport records. The following data categories will be permanently destroyed:
                </p>
                <ul className="list-disc list-inside space-y-0.5 pt-1 font-medium">
                  <li>All Transport Booking Requisitions (Daily & Weekly)</li>
                  <li>All Multi-Day Scheduled Itineraries (Booking Days)</li>
                  <li>All Vehicle & Driver Assignments</li>
                  <li>All Requisition Notifications & Operational Messages</li>
                </ul>
                <p className="pt-1 text-slate-600 dark:text-slate-400">
                  Protected System Records (Retained): Vehicles, Drivers, Users, Departments, System Settings, and Permanent Security Audit Records.
                </p>
              </div>
            </div>

            {purgeError && (
              <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold">
                {purgeError}
              </div>
            )}

            {/* Re-Authentication Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                1. Administrator Password (Identity Verification) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  placeholder="Enter your administrator password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  disabled={isPurging}
                  className="w-full text-xs py-2.5 pl-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmation Phrase Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                2. Confirmation Phrase Verification <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Type <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-rose-600 select-all">{REQUIRED_PHRASE}</code> below:
              </p>
              <input
                type="text"
                placeholder={REQUIRED_PHRASE}
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                disabled={isPurging}
                className="w-full font-mono text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDangerModalOpen(false)}
                disabled={isPurging}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePurgeOperations}
                isLoading={isPurging}
                disabled={isPurging || confirmPhrase.trim() !== REQUIRED_PHRASE || !adminPassword}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Permanently Purge Operations Data
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
