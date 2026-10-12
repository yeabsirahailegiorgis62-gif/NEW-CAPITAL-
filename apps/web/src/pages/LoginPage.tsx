import { useState } from 'react';
import { Truck, ArrowLeft, Shield } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface LoginPageProps {
  onBackToLanding: () => void;
  onLoginSubmit: (emailOrEmployeeId: string, password: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onBackToLanding,
  onLoginSubmit,
  isLoading = false,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please provide your corporate email or employee ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const success = await onLoginSubmit(identifier.trim(), password);
      if (!success) {
        setError('Invalid credentials or account is inactive. Please check and try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to the authentication service.');
    }
  };

  // Quick fill demo helper for local testing
  const handleQuickFill = (roleEmail: string) => {
    setIdentifier(roleEmail);
    setPassword('CapitalFleet2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>

        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-sm">
            <Truck className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-navy-900">CAPITAL FLEET</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Capital Real Estate
            </p>
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Enter your company credentials to access vehicle bookings and logistics
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-card sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <Alert type="error" className="mb-6" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="identifier"
              label="Company Email or Employee ID"
              type="text"
              autoComplete="username"
              required
              placeholder="e.g. employee@capitalre.com or EMP-101"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Development Quick-Fill Accounts Helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              Quick-Fill Test Accounts:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('employee@capitalre.com')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-center transition-colors"
              >
                Employee
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('logistics@capitalre.com')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-center transition-colors"
              >
                Logistics Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@capitalre.com')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-center transition-colors"
              >
                System Admin
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Password for all seeded accounts: <code className="font-mono text-slate-600">CapitalFleet2026!</code>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Authorized internal personnel only · Capital Real Estate
        </div>
      </div>
    </div>
  );
};
