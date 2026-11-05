import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Clock,
  Eye,
  EyeOff,
  Send,
  FileText,
  Key,
  UserCheck,
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialIdentifier?: string;
  initialPassphrase?: string;
  initialTab?: 'request' | 'reset';
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialIdentifier,
  initialPassphrase,
  initialTab = 'request',
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'reset'>(initialTab);
  const [step, setStep] = useState<'form' | 'requested' | 'completed'>('form');

  // Request form state
  const [identifier, setIdentifier] = useState(initialIdentifier || '');
  const [reason, setReason] = useState('');

  // Two-Stage Reset form state
  const [recoveryStage, setRecoveryStage] = useState<'verify' | 'new_password'>('verify');
  const [resetIdentifier, setResetIdentifier] = useState(initialIdentifier || '');
  const [passphrase, setPassphrase] = useState(initialPassphrase || '');
  const [resetAuthToken, setResetAuthToken] = useState<string | null>(null);
  const [verifiedEmployee, setVerifiedEmployee] = useState<{
    name: string;
    email: string;
    employeeId?: string;
  } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      if (initialIdentifier) {
        setIdentifier(initialIdentifier);
        setResetIdentifier(initialIdentifier);
      }
      if (initialPassphrase) {
        setPassphrase(initialPassphrase);
      }
      setError(null);
    }
  }, [isOpen, initialIdentifier, initialPassphrase, initialTab]);

  // Policy validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial && isMatch;

  if (!isOpen) return null;

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const res = await api.forgotPassword(identifier.trim(), reason.trim() || undefined);
      setInfoMessage(res.message);
      setResetIdentifier(identifier.trim());
      setStep('requested');
    } catch (err: any) {
      setError(err.message || 'Unable to submit password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 1: Verify Recovery Phrase with backend
  const handleVerifyPassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = resetIdentifier.trim();
    const phrase = passphrase.trim();

    if (!id) {
      setError('Please provide your Employee ID or Corporate Email.');
      return;
    }
    if (!phrase) {
      setError('Please enter the recovery phrase issued by your Administrator.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.verifyPassphrase(id, phrase);
      setResetAuthToken(res.resetAuthToken);
      setVerifiedEmployee(res.employee);
      setRecoveryStage('new_password');
    } catch (err: any) {
      setError(err.message || 'Invalid recovery phrase or employee identifier.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 2: Regenerate Password with verified single-use reset authorization token
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetAuthToken && !passphrase.trim()) {
      setError('Authorization expired or missing. Please verify your recovery phrase again.');
      setRecoveryStage('verify');
      return;
    }
    if (!isPasswordValid) {
      setError('New password must satisfy all policy requirements.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.resetPassword(
        passphrase.trim(),
        newPassword,
        resetIdentifier.trim() || undefined,
        resetAuthToken || undefined,
      );
      setStep('completed');
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate password. Authorization may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  const handleSwitchToReset = () => {
    setActiveTab('reset');
    setStep('form');
    setRecoveryStage('verify');
    setResetAuthToken(null);
    setVerifiedEmployee(null);
    setError(null);
  };

  const handleResetModalState = () => {
    setStep('form');
    setRecoveryStage('verify');
    setResetAuthToken(null);
    setVerifiedEmployee(null);
    setError(null);
    setInfoMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto overscroll-contain bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg m-auto max-h-[calc(100dvh-2rem)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 overflow-y-auto overscroll-contain">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {step === 'completed'
                ? 'Password Regenerated'
                : step === 'requested'
                ? 'Reset Request Submitted'
                : activeTab === 'request'
                ? 'Request Password Reset'
                : recoveryStage === 'verify'
                ? 'Verify Recovery Phrase'
                : 'Set New Password'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Capital Real Estate Enterprise Security Portal
            </p>
          </div>
        </div>

        {/* Tab Selector (only when in form state) */}
        {step === 'form' && (
          <div className="flex p-1 mb-5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('request');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'request'
                  ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1. Request from Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reset');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'reset'
                  ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>2. Recover Account</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: Request Passphrase from Administrator */}
        {step === 'form' && activeTab === 'request' && (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Administrator Verification Workflow</p>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                  Password resets must be authorized by a System Administrator. When you submit this request, the administrator will verify your credentials and issue a secure single-use recovery phrase.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Corporate Email or Employee ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. employee@capitalre.com or EMP-101"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Reason or Note for Administrator (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Locked out, forgot corporate credentials"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-md shadow-red-900/30 disabled:opacity-50"
              >
                <span>{isLoading ? 'Submitting Request...' : 'Send Request to Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleSwitchToReset}
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Already received your recovery phrase? Enter it here →
              </button>
            </div>
          </form>
        )}

        {/* STEP: Request Received Confirmation */}
        {step === 'requested' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-bold text-sm">Request Submitted to System Administrator</p>
                <p className="mt-1 leading-relaxed text-emerald-800 dark:text-emerald-300">
                  {infoMessage ||
                    'Your password reset request has been received. The administrator has been notified and will issue a secure recovery phrase.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">What happens next?</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400">
                <li>The administrator reviews your pending reset request in User Management.</li>
                <li>The administrator generates and conveys an official single-use phrase to you.</li>
                <li>You return here, enter the phrase to verify your account, and set a new password.</li>
              </ol>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleSwitchToReset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-md shadow-red-900/30"
              >
                <span>Enter Recovery Phrase Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close & Wait for Phrase
              </button>
            </div>
          </div>
        )}

        {/* TAB 2 - STAGE 1: Verify Recovery Phrase */}
        {step === 'form' && activeTab === 'reset' && recoveryStage === 'verify' && (
          <form onSubmit={handleVerifyPassphrase} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Stage 1 of 2: Phrase Verification</p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Enter your Employee ID or corporate email and the recovery phrase received from your Administrator. Once authenticated, you will be authorized to set a new password.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Corporate Email or Employee ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. employee@capitalre.com or EMP-101"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Administrator-Issued Recovery Phrase <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="CPTL-XXXX-XXXX"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Hyphens and spaces are handled automatically. Passphrases expire after 15 minutes.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('request');
                  handleResetModalState();
                }}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !resetIdentifier.trim() || !passphrase.trim()}
                className="w-2/3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-md shadow-red-900/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Verify Recovery Phrase</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2 - STAGE 2: Set New Password (Authorized only after Stage 1) */}
        {step === 'form' && activeTab === 'reset' && recoveryStage === 'new_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Verified Identity Badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-bold text-sm">Identity Authenticated</p>
                <p className="mt-0.5 text-emerald-800 dark:text-emerald-300">
                  Verified for <strong>{verifiedEmployee?.name}</strong>{' '}
                  {verifiedEmployee?.employeeId ? `(${verifiedEmployee.employeeId})` : `(${verifiedEmployee?.email})`}. Please establish your new corporate password.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
            </div>

            {/* Password Policy Checklist */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] grid grid-cols-2 gap-1.5">
              <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                ✓ 8+ Characters
              </span>
              <span className={hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                ✓ 1+ Uppercase
              </span>
              <span className={hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                ✓ 1+ Number
              </span>
              <span className={hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                ✓ 1+ Special Char
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setRecoveryStage('verify')}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-2/3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-md shadow-red-900/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? 'Regenerating...' : 'Regenerate Password'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Completed State */}
        {step === 'completed' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/80">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Password Successfully Regenerated
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Your account password has been updated and your credentials are active. You may now sign in using your new password.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-md shadow-red-900/30"
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
