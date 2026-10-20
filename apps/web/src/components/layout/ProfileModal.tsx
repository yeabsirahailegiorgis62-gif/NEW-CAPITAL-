import React, { useState, useRef } from 'react';
import { User } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Camera,
  Check,
  Phone,
  ShieldCheck,
  User as UserIcon,
  Briefcase,
  FileBadge,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { fileToOptimizedDataUrl } from '@/lib/imageUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onProfileUpdated: (updatedUser: User) => void;
  onSave: (data: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    jobTitle?: string;
    licenseNumber?: string;
  }) => Promise<User>;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || '');
  const [licenseNumber, setLicenseNumber] = useState(currentUser.licenseNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);
      const optimized = await fileToOptimizedDataUrl(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
      });
      setAvatarUrl(optimized);
      setStatusMessage('Photo uploaded! Click "Save Changes" to apply.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const updated = await onSave({
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
        jobTitle: jobTitle.trim(),
        licenseNumber: licenseNumber.trim(),
      });
      onProfileUpdated(updated);
      setStatusMessage('Profile updated successfully!');
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile & Settings"
      description="Update your personal details, corporate photo, and driver credentials"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hidden File Input for Device Photo Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Avatar Section */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Clickable Avatar Photo */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group shrink-0 cursor-pointer"
              title="Click to select photo from device"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-md ring-4 ring-brand-500/10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-navy-900 dark:bg-slate-700 border-2 border-brand-400 flex items-center justify-center text-white text-2xl font-bold">
                  {name.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-5 h-5 text-white mb-0.5" />
                <span className="text-[9px] font-bold text-white tracking-wider uppercase">Upload</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2 text-center sm:text-left">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>{name || 'Staff Member'}</span>
                  <Badge status={currentUser.role} size="sm" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentUser.email} • ID: {currentUser.employeeId || 'N/A'}
                </p>
              </div>

              {/* Upload Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                  isLoading={isUploading}
                  className="font-semibold text-xs border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 shadow-2xs"
                >
                  Upload Device Photo
                </Button>

                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl('')}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                    className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2">
              Or Select Corporate Avatar Preset:
            </label>
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                    avatarUrl === url
                      ? 'ring-2 ring-brand-500 border-white scale-110 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  title={`Executive Preset ${idx + 1}`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  {avatarUrl === url && (
                    <span className="absolute inset-0 bg-brand-600/40 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Avatar URL input (Advanced) */}
        <Input
          label="Direct Photo Web Link (optional)"
          placeholder="https://example.com/photo.jpg"
          value={avatarUrl.startsWith('data:') ? '[Uploaded Device Photo]' : avatarUrl}
          onChange={(e) => {
            if (!avatarUrl.startsWith('data:')) {
              setAvatarUrl(e.target.value);
            }
          }}
          disabled={avatarUrl.startsWith('data:')}
          leftIcon={<ImageIcon className="w-4 h-4 text-slate-400" />}
          helperText={
            avatarUrl.startsWith('data:')
              ? 'Local photo loaded. Click "Upload Device Photo" or "Remove Photo" above to change.'
              : 'Paste direct image URL, pick a preset, or click "Upload Device Photo"'
          }
        />

        {/* Name and Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<UserIcon className="w-4 h-4" />}
          />
          <Input
            label="Phone Number"
            placeholder="+251 91 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            helperText="Direct contact for trip logistics & notifications"
          />
        </div>

        {/* Job Title and Driver License */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job Title / Designation"
            placeholder="e.g. Senior Project Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            leftIcon={<Briefcase className="w-4 h-4" />}
          />
          <Input
            label="Driver's License Number"
            placeholder="e.g. ET-DL-882941"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            leftIcon={<FileBadge className="w-4 h-4" />}
            helperText="Required if opting for authorized self-driving"
          />
        </div>

        {/* Read-Only Department & Account Info */}
        <div className="p-3.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Department: <strong>{currentUser.department?.name || 'Capital Real Estate Corp'}</strong></span>
          </div>
          <span>Active Account</span>
        </div>

        {statusMessage && (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 text-center animate-fade-in">
            {statusMessage}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
