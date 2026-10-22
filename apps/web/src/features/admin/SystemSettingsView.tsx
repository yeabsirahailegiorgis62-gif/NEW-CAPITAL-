import React, { useState, useEffect, useRef } from 'react';
import { SystemSettings, User } from '@/types';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { fileToOptimizedDataUrl } from '@/lib/imageUtils';
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
  Camera,
  Upload,
  Trash2,
  UserCheck,
  Fuel,
  FileCheck,
  FileBadge,
  User as UserIcon,
  BadgeCheck,
  Image as ImageIcon,
} from 'lucide-react';

interface SystemSettingsViewProps {
  currentUser?: User;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
];

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
  onlyShowAvailableVehicles: true,
  autoSuggestSuitableVehicle: true,
  requireVehicleInspectionCheck: true,
  minFuelLevelPercent: 25,
  preventDoubleDriverAssignment: true,
  onlyShowActiveDrivers: true,
  requireDriverConfirmation: true,
  requireValidDriverLicense: true,
  maxDailyDriverHours: 10,
  driverConfirmationTimeoutHours: 4,
};

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ currentUser }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<
    'assign-vehicle' | 'assign-driver' | 'profile' | 'security' | 'requests' | 'lifecycle' | 'danger'
  >('assign-vehicle');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Picture & Identity State
  const [userAvatar, setUserAvatar] = useState(currentUser?.avatarUrl || AVATAR_PRESETS[0]);
  const [userName, setUserName] = useState(currentUser?.name || 'Administrator');
  const [userJobTitle, setUserJobTitle] = useState(currentUser?.jobTitle || 'Fleet Operations Administrator');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (currentUser?.avatarUrl) setUserAvatar(currentUser.avatarUrl);
    if (currentUser?.name) setUserName(currentUser.name);
    if (currentUser?.jobTitle) setUserJobTitle(currentUser.jobTitle);
  }, [currentUser]);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const optimized = await fileToOptimizedDataUrl(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
      });
      setUserAvatar(optimized);
      // Auto-save avatar to profile
      const updated = await api.updateOwnProfile({ avatarUrl: optimized });
      setAvatarUploadSuccess('Profile picture updated successfully from your device!');
      toast.success('Avatar Updated', 'Your corporate profile picture has been saved.');
      setTimeout(() => setAvatarUploadSuccess(null), 4000);
    } catch (err: any) {
      toast.error('Upload Failed', err.message || 'Could not process image file');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfileIdentity = async () => {
    try {
      setIsSavingProfile(true);
      await api.updateOwnProfile({
        name: userName.trim() || undefined,
        jobTitle: userJobTitle.trim() || undefined,
        avatarUrl: userAvatar,
      });
      toast.success('Profile Saved', 'Administrator profile details updated successfully.');
    } catch (err: any) {
      toast.error('Failed to save profile', err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

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

  {/* Reusable Profile Picture Upload Widget - rendered under each setting */}
  const renderProfilePictureUploaderCard = (contextTitle: string) => (
    <Card className="rounded-3xl border border-purple-200/80 dark:border-purple-900/60 bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-slate-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-slate-900/40 shadow-xs overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group shrink-0 cursor-pointer"
              title="Click to upload profile photo from your device"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500 shadow-xs group-hover:opacity-85 transition-opacity"
              />
              <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[8px] shadow-xs">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Administrator Profile Picture
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {contextTitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Upload your picture from your device. Synchronized automatically across all system audit logs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploadingAvatar}
              leftIcon={<Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
              className="text-xs h-8 px-3 font-bold border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 w-full sm:w-auto"
            >
              Upload Photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('profile')}
              className="text-xs h-8 px-2.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Identity Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hidden File Input for Device Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileUpload}
      />

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
            Configure backend-enforced vehicle allocation guards, chauffeur assignment policies, account security, and request rules.
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

          {activeTab !== 'danger' && activeTab !== 'profile' && (
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

      {/* ── PROFILE PICTURE QUICK-UPLOAD BAR (Prepared under each setting) ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-slate-50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-slate-900/60 border border-purple-200/80 dark:border-purple-900/60 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group shrink-0 cursor-pointer"
            title="Click to upload profile picture from device"
          >
            <img
              src={userAvatar}
              alt={userName}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-purple-500 shadow-xs group-hover:opacity-85 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Camera className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[8px]">
              <CheckCircle2 className="w-2.5 h-2.5" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {userName}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                {currentUser?.role || 'SYSTEM_ADMIN'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {userJobTitle} · Ready to upload or customize profile picture under any setting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploadingAvatar}
            leftIcon={<Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
            className="text-xs h-9 font-semibold border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 w-full sm:w-auto"
          >
            Upload Photo From Device
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('profile')}
            className={`text-xs h-9 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 ${
              activeTab === 'profile' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200' : ''
            }`}
          >
            Manage Identity
          </Button>
        </div>
      </div>

      {avatarUploadSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{avatarUploadSuccess}</span>
        </div>
      )}

      {/* Tabs Navigation Strip */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('assign-vehicle')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'assign-vehicle'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-blue-500" />
          <span>Assign Vehicle Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assign-driver')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'assign-driver'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Assign Driver Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-purple-500" />
          <span>Profile Picture & Identity</span>
        </button>

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
          <span>Security & Auth</span>
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
          <span>Lifecycle</span>
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

          {/* Quick Profile Picture Upload Section Under Security Setting */}
          {renderProfilePictureUploaderCard('Security & Auth Setting')}
        </div>
      )}

      {/* ── TAB 2: REQUEST RULES ── */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
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

        {/* Quick Profile Picture Upload Section Under Request Rules Setting */}
        {renderProfilePictureUploaderCard('Request Rules Setting')}
      </div>
    )}

      {/* ── TAB 3: REQUEST LIFECYCLE ── */}
      {activeTab === 'lifecycle' && (
        <div className="space-y-6">
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

        {/* Quick Profile Picture Upload Section Under Lifecycle Setting */}
        {renderProfilePictureUploaderCard('Lifecycle & Approval Setting')}
      </div>
    )}

      {/* ── TAB: ASSIGN VEHICLE SETTINGS (REFORMATTED) ── */}
      {activeTab === 'assign-vehicle' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base text-slate-900 dark:text-white font-bold">
                        Fleet Vehicle Allocation & Dispatch Engine
                      </CardTitle>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        Vehicle Allocation Rules
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Server-enforced availability constraints, calendar collision guards, and minimum roadworthiness standards.
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prevent Double Vehicle Assignment */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Prevent Double Vehicle Assignment
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                      Strict collision guard: blocks dispatching a vehicle to overlapping departure windows or simultaneous multi-day booking dates.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.preventDoubleVehicleAssignment}
                    onChange={(e) => setSettings({ ...settings, preventDoubleVehicleAssignment: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                {/* Only Show Available Vehicles in Dispatch */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Only Show Available Vehicles in Dispatch
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                      Excludes vehicles that are currently in maintenance, undergoing repairs, marked inactive, or on an active trip mission.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.onlyShowAvailableVehicles}
                    onChange={(e) => setSettings({ ...settings, onlyShowAvailableVehicles: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                {/* Auto-Suggest Suitable Vehicle */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Auto-Suggest Best-Fit Vehicle
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                      Intelligently score and pre-select the highest efficiency fleet asset matching requested passenger headcount and vehicle category.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSuggestSuitableVehicle}
                    onChange={(e) => setSettings({ ...settings, autoSuggestSuitableVehicle: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                {/* Require Pre-Trip Vehicle Inspection Check */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Mandatory Pre-Trip Vehicle Inspection
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                      Enforce verification that tires, brakes, fluid levels, and safety equipment are confirmed before trip departure clearance.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireVehicleInspectionCheck}
                    onChange={(e) => setSettings({ ...settings, requireVehicleInspectionCheck: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                {/* Minimum Fuel Level Requirement */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 md:col-span-2 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          Minimum Fuel Level Threshold (% Tank Reserve)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed max-w-xl">
                        Vehicles with fuel gauge readings below this reserve threshold trigger a refuel voucher or maintenance warning prior to dispatch.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={100}
                        step={5}
                        value={settings.minFuelLevelPercent || 25}
                        onChange={(e) =>
                          setSettings({ ...settings, minFuelLevelPercent: parseInt(e.target.value) || 25 })
                        }
                        className="w-24 text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center font-bold"
                      />
                      <span className="text-xs font-bold text-slate-500">% Fuel</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Profile Picture Upload Section Under Assign Vehicle Setting */}
          {renderProfilePictureUploaderCard('Vehicle Allocation Setting')}
        </div>
      )}

      {/* ── TAB: ASSIGN DRIVER SETTINGS (FIXED & PERFECTED) ── */}
      {activeTab === 'assign-driver' && (
        <div className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base text-slate-900 dark:text-white font-bold">
                        Chauffeur Allocation, Safety & Compliance Policies
                      </CardTitle>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Driver Rules (Verified)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Commercial license verification, driver duty shift limits, collision prevention, and digital acceptance timeouts.
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prevent Double Driver Assignment */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Prevent Double Driver Assignment
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                      Guarantees no chauffeur can be allocated to concurrent or overlapping departure schedules or simultaneous weekly trip days.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.preventDoubleDriverAssignment}
                    onChange={(e) => setSettings({ ...settings, preventDoubleDriverAssignment: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                {/* Only Show Active & Verified Drivers */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Only Show Active & Verified Drivers
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                      Filters dispatch selector strictly to active staff members with approved driver roles (excludes on-leave or inactive personnel).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.onlyShowActiveDrivers}
                    onChange={(e) => setSettings({ ...settings, onlyShowActiveDrivers: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                {/* Require Valid Commercial Driver's License */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <FileBadge className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Require Valid Commercial Driver License
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                      Blocks dispatching any chauffeur who does not have an active, verified commercial driver's license number on record.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireValidDriverLicense}
                    onChange={(e) => setSettings({ ...settings, requireValidDriverLicense: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                {/* Require Driver Acceptance / Confirmation */}
                <div className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Require Driver Digital Confirmation
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                      Chauffeurs must formally acknowledge and accept mission assignments via their driver portal prior to departure.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireDriverConfirmation}
                    onChange={(e) => setSettings({ ...settings, requireDriverConfirmation: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
                  />
                </div>

                {/* Maximum Daily Driving Hours (Fatigue Cap) */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Max Daily Driving / Shift Hours Limit
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                        Driver fatigue limit cap per 24h rolling duty cycle (default: 10h).
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={4}
                        max={16}
                        value={settings.maxDailyDriverHours || 10}
                        onChange={(e) =>
                          setSettings({ ...settings, maxDailyDriverHours: parseInt(e.target.value) || 10 })
                        }
                        className="w-20 text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center font-bold"
                      />
                      <span className="text-xs text-slate-500 font-semibold">hrs/day</span>
                    </div>
                  </div>
                </div>

                {/* Driver Confirmation Timeout */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Driver Acceptance Expiration (Hours)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                        Unconfirmed assignments trigger dispatch alert for re-allocation after this window (default: 4h).
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={48}
                        value={settings.driverConfirmationTimeoutHours || 4}
                        onChange={(e) =>
                          setSettings({ ...settings, driverConfirmationTimeoutHours: parseInt(e.target.value) || 4 })
                        }
                        className="w-20 text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center font-bold"
                      />
                      <span className="text-xs text-slate-500 font-semibold">hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Profile Picture Upload Section Under Assign Driver Setting */}
          {renderProfilePictureUploaderCard('Chauffeur Dispatch Setting')}
        </div>
      )}

      {/* ── TAB: PROFILE PICTURE & IDENTITY SETTINGS ── */}
      {activeTab === 'profile' && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4 bg-gradient-to-r from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-slate-900 dark:text-white font-bold">
                      Administrator Profile Picture & Identity Settings
                    </CardTitle>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                      Identity
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload your profile picture directly from your device, select corporate avatars, or update your account name.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveProfileIdentity}
                isLoading={isSavingProfile}
                leftIcon={<Save className="w-3.5 h-3.5" />}
                className="font-bold bg-purple-600 hover:bg-purple-700 shadow-sm"
              >
                Save Identity
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Device File Upload Drag & Drop Area */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-purple-200 dark:border-purple-800/80 flex flex-col sm:flex-row items-center gap-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer shrink-0"
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-purple-500/20 shadow-md group-hover:scale-105 transition-all"
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                  <Camera className="w-4 h-4" />
                  <span>Browse</span>
                </div>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  Upload Profile Picture from Device
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Click below to browse files on your computer. Supports PNG, JPG, and WebP formats. Files are optimized automatically.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isUploadingAvatar}
                    leftIcon={<Camera className="w-3.5 h-3.5" />}
                    className="font-bold bg-purple-600 hover:bg-purple-700 shadow-sm"
                  >
                    Select Photo from Device
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUserAvatar(AVATAR_PRESETS[0])}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-slate-400" />}
                  >
                    Reset to Default
                  </Button>
                </div>
              </div>
            </div>

            {/* Presets Row */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wider">
                Or Select from Curated Executive Avatars
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setUserAvatar(preset);
                      api.updateOwnProfile({ avatarUrl: preset });
                      toast.success('Avatar Selected', 'Preset avatar applied to your profile.');
                    }}
                    className={`relative rounded-xl overflow-hidden ring-2 transition-all cursor-pointer ${
                      userAvatar === preset
                        ? 'ring-purple-600 ring-offset-2 dark:ring-offset-slate-900 scale-105'
                        : 'ring-transparent hover:ring-slate-300 dark:hover:ring-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-12 h-12 object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Identity Details Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Input
                id="adminName"
                label="Full Name"
                placeholder="e.g. Administrator Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Input
                id="adminJobTitle"
                label="Job Designation / Role Title"
                placeholder="e.g. Lead Logistics Dispatcher"
                value={userJobTitle}
                onChange={(e) => setUserJobTitle(e.target.value)}
              />
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
