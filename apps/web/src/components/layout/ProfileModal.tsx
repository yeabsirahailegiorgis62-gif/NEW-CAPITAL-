import React, { useState } from 'react';
import { User } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Camera, Check, Phone, ShieldCheck, User as UserIcon, Briefcase, FileBadge } from 'lucide-react';

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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
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
      setStatusMessage(err.message || 'Failed to update profile');
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
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="relative group shrink-0">
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
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera className="w-6 h-6 text-white" />
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

            {/* Avatar presets */}
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5">
                Choose Executive Avatar Preset:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                {AVATAR_PRESETS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative w-7 h-7 rounded-full overflow-hidden border transition-all ${
                      avatarUrl === url
                        ? 'ring-2 ring-brand-500 border-white scale-110 shadow-sm'
                        : 'border-slate-300 dark:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
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
        </div>

        {/* Custom Avatar URL */}
        <Input
          label="Custom Photo URL (optional)"
          placeholder="https://example.com/photo.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          leftIcon={<Camera className="w-4 h-4" />}
          helperText="Paste direct image link, or pick a preset above"
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
