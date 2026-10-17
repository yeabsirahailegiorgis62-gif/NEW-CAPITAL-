import React, { useState } from 'react';
import { Truck, ArrowLeft, Shield, Sun, Moon, Key } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useTheme } from '@/context/ThemeContext';
import { BrandLogo } from '@/components/ui/BrandLogo';

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
  const { theme, toggleTheme } = useTheme();
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

  const handleQuickFill = (roleEmail: string) => {
    setIdentifier(roleEmail);
    setPassword('CapitalFleet2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-gradient-to-b dark:from-slate-950 dark:via-[#0a0f1d] dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors relative">
      {/* Top action bar */}
      <div className="w-full max-w-md mx-auto mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Back to Highway Overview</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
          title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <BrandLogo size="lg" className="justify-center" />

        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Sign In to Fleet Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Enter your company email or employee ID
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-8 px-5 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
          {error && (
            <Alert type="error" className="mb-6" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter your password"
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
              Sign In to Fleet OS
            </Button>
          </form>

          {/* Quick-Fill Demo Helpers */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
              <Key className="w-3.5 h-3.5 text-brand-500" />
              <span>Instant Quick-Fill Credentials</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickFill('employee@capitalre.com')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Abebe Girma (Employee)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    employee@capitalre.com • EMP-101
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('logistics@capitalre.com')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    Almaz Bekele (Logistics Admin)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    logistics@capitalre.com • LOG-201
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@capitalre.com')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    Dawit Tadesse (System Admin)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    admin@capitalre.com • SYS-001
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  Select
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
