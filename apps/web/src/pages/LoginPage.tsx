// COMPONENT: Public login screen. Collects identifier + password and calls onLoginSubmit (App.handleLogin).
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Sun,
  Moon,
  Key,
  Car,
  Fuel,
  Users,
  Radio,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lock,
  Mail,
  QrCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useTheme } from '@/context/ThemeContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ForgotPasswordModal } from '@/features/auth/ForgotPasswordModal';

// PROPS: Parent-provided callbacks. LoginPage does not call the API itself for sign-in.
interface LoginPageProps {
  onLoginSubmit: (emailOrEmployeeId: string, password: string) => Promise<boolean>;
  onOpenVerification?: () => void;
  onBackToLanding?: () => void;
  isLoading?: boolean;
}

interface FleetShowcaseItem {
  id: string;
  name: string;
  category: string;
  image: string;
  plate: string;
  capacity: string;
  fuel: number;
  transmission: string;
  assignedTo: string;
  accentColor: string;
}

const SHOWCASE_VEHICLES: FleetShowcaseItem[] = [
  {
    id: 'prado',
    name: 'Land Cruiser Prado TX',
    category: 'SUV 4WD',
    image: '/vehicles/prado.png',
    plate: 'ET-3-A12490',
    capacity: '7 Executive Seats',
    fuel: 92,
    transmission: 'Automatic 4WD',
    assignedTo: 'Regional Site Audits & Executive Transport',
    accentColor: '#dc2626',
  },
  {
    id: 'hilux',
    name: 'Hilux Double Cab 4x4',
    category: 'Heavy Pickup',
    image: '/vehicles/hilux.png',
    plate: 'ET-3-B48201',
    capacity: '5 Seats + Cargo Bed',
    fuel: 78,
    transmission: 'Manual 4x4',
    assignedTo: 'Heavy Construction & Structural Support',
    accentColor: '#16a34a',
  },
  {
    id: 'hiace',
    name: 'HiAce Commuter Minibus',
    category: 'Minibus',
    image: '/vehicles/hiace.png',
    plate: 'ET-3-C99120',
    capacity: '14 Crew Seats',
    fuel: 85,
    transmission: 'Manual',
    assignedTo: 'Engineering Crew & Surveyor Shuttle',
    accentColor: '#0284c7',
  },
  {
    id: 'corolla',
    name: 'Corolla Altis Sedan',
    category: 'Urban Sedan',
    image: '/vehicles/corolla.png',
    plate: 'ET-3-A77610',
    capacity: '5 Seats',
    fuel: 65,
    transmission: 'CVT Automatic',
    assignedTo: 'Urban Client Relations & Legal Dispatch',
    accentColor: '#f59e0b',
  },
  {
    id: 'ranger',
    name: 'Ford Ranger XLT 4x4',
    category: 'Off-Road Pickup',
    image: '/vehicles/ranger.png',
    plate: 'ET-3-B33190',
    capacity: '5 Seats',
    fuel: 90,
    transmission: 'Automatic 4x4',
    assignedTo: 'Field Inspection & Site Quality Progress',
    accentColor: '#dc2626',
  },
  {
    id: 'dmax',
    name: 'Isuzu D-Max Utility 4x4',
    category: 'Workhorse Pickup',
    image: '/vehicles/dmax.png',
    plate: 'ET-3-C55210',
    capacity: '5 Seats + Heavy Tray',
    fuel: 88,
    transmission: 'Manual 4x4',
    assignedTo: 'Civil Engineering & Equipment Haulage',
    accentColor: '#0284c7',
  },
];

interface QuickFillPersona {
  roleName: string;
  roleCode: 'EMPLOYEE' | 'DRIVER' | 'LOGISTICS_ADMIN' | 'SYSTEM_ADMIN';
  category: 'driver' | 'admin' | 'department';
  personName: string;
  badgeId: string;
  email: string;
  department: string;
  themeColor: 'emerald' | 'red' | 'slate' | 'amber' | 'blue';
}

const QUICK_FILL_PERSONAS: QuickFillPersona[] = [
  // Drivers
  {
    roleName: 'Fleet Driver',
    roleCode: 'DRIVER',
    category: 'driver',
    personName: 'Abebe Molla',
    badgeId: 'DRV-301',
    email: 'driver.abebe@capitalre.com',
    department: 'Senior Fleet Chauffeur',
    themeColor: 'amber',
  },
  {
    roleName: 'Heavy Driver',
    roleCode: 'DRIVER',
    category: 'driver',
    personName: 'Mulugeta Tadesse',
    badgeId: 'DRV-302',
    email: 'driver.mulugeta@capitalre.com',
    department: 'Heavy Transit Chauffeur',
    themeColor: 'amber',
  },
  // Operations & Admins
  {
    roleName: 'Logistics Officer',
    roleCode: 'LOGISTICS_ADMIN',
    category: 'admin',
    personName: 'Selamawit Tadesse',
    badgeId: 'LOG-201',
    email: 'logistics@capitalre.com',
    department: 'Logistics & Fleet Operations',
    themeColor: 'red',
  },
  {
    roleName: 'System Admin',
    roleCode: 'SYSTEM_ADMIN',
    category: 'admin',
    personName: 'Ermias Haile',
    badgeId: 'SYS-001',
    email: 'admin@capitalre.com',
    department: 'Executive IT & Corporate Strategy',
    themeColor: 'slate',
  },
  // Departmental Staff Requisitioners
  {
    roleName: 'Finance Staff',
    roleCode: 'EMPLOYEE',
    category: 'department',
    personName: 'Almaz Ayana',
    badgeId: 'EMP-102',
    email: 'employee.finance@capitalre.com',
    department: 'Finance & Procurement',
    themeColor: 'blue',
  },
  {
    roleName: 'HR Director',
    roleCode: 'EMPLOYEE',
    category: 'department',
    personName: 'Kassahun Desta',
    badgeId: 'EMP-103',
    email: 'employee.hr@capitalre.com',
    department: 'Human Resources & Talent Management',
    themeColor: 'emerald',
  },
  {
    roleName: 'IT Architect',
    roleCode: 'EMPLOYEE',
    category: 'department',
    personName: 'Yared Negash',
    badgeId: 'EMP-104',
    email: 'employee.it@capitalre.com',
    department: 'Information Technology & Systems',
    themeColor: 'blue',
  },
  {
    roleName: 'Admin Officer',
    roleCode: 'EMPLOYEE',
    category: 'department',
    personName: 'Tigist Belay',
    badgeId: 'EMP-105',
    email: 'employee.admin@capitalre.com',
    department: 'General Administration & Facilities',
    themeColor: 'slate',
  },
  {
    roleName: 'Project Engineer',
    roleCode: 'EMPLOYEE',
    category: 'department',
    personName: 'Dawit Kebede',
    badgeId: 'EMP-101',
    email: 'employee@capitalre.com',
    department: 'Project Engineering & Construction',
    themeColor: 'emerald',
  },
  {
    roleName: 'Sales Lead',
    roleCode: 'EMPLOYEE',
    category: 'department',
    personName: 'Bethlehem Alemu',
    badgeId: 'EMP-106',
    email: 'bethlehem@capitalre.com',
    department: 'Sales & Real Estate Marketing',
    themeColor: 'amber',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSubmit,
  onOpenVerification,
  onBackToLanding,
  isLoading = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordInitialTab, setForgotPasswordInitialTab] = useState<'request' | 'reset'>('request');
  const [forgotPasswordIdentifier, setForgotPasswordIdentifier] = useState<string>('');
  const [forgotPasswordPassphrase, setForgotPasswordPassphrase] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [personaCategory, setPersonaCategory] = useState<'all' | 'driver' | 'admin' | 'department'>('all');

  // Detect password reset / recovery action from URL params (e.g. from approved email links)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const emailParam = params.get('email') || params.get('identifier');
      const passphraseParam = params.get('passphrase') || params.get('token');

      if (action === 'reset-password' || action === 'reset') {
        setForgotPasswordInitialTab('reset');
        if (emailParam) setForgotPasswordIdentifier(emailParam);
        if (passphraseParam) setForgotPasswordPassphrase(passphraseParam);
        setIsForgotPasswordOpen(true);
      } else if (action === 'forgot-password' || action === 'forgot') {
        setForgotPasswordInitialTab('request');
        if (emailParam) setForgotPasswordIdentifier(emailParam);
        setIsForgotPasswordOpen(true);
      }
    } catch {
      // In case window or URLSearchParams is unavailable in test environments
    }
  }, []);

  // Dynamic Fleet Showcase State
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Live Addis Ababa Clock
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in Addis Ababa Time (UTC+3)
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Africa/Addis_Ababa',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateStr = now.toLocaleDateString('en-GB', {
        timeZone: 'Africa/Addis_Ababa',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle fleet showcase
  useEffect(() => {
    if (isCarouselPaused) return;

    const timer = setInterval(() => {
      setActiveVehicleIndex((prev) => (prev + 1) % SHOWCASE_VEHICLES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isCarouselPaused]);

  const activeVehicle = SHOWCASE_VEHICLES[activeVehicleIndex];

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

  const handleQuickFill = (persona: QuickFillPersona) => {
    setIdentifier(persona.email);
    setPassword('CapitalFleet2026!');
    setSelectedPersona(persona.email);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-brand-500 selection:text-white transition-colors">
      {/* Dynamic Ambient Background Illumination */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-red-600/10 dark:bg-red-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-emerald-600/10 dark:bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[140px]" />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Global Command Bar */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-md flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" variant="emblem" />
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
              Fleet Grid Active
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {currentDate} {currentTime} EAT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Back to Landing Page Button */}
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-brand-500/50 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span className="hidden sm:inline">Back to Portal</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}

          {/* Public QR Code Ticket Verification Button */}
          {onOpenVerification && (
            <button
              type="button"
              onClick={onOpenVerification}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Verify a physical or digital gate pass without signing in"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Verify Ticket / Gate Pass</span>
              <span className="sm:hidden">Verify Pass</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors shadow-xs"
            title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Split Command Center Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* ========================================================= */}
        {/* LEFT COLUMN: DYNAMIC FLEET INTELLIGENCE & TELEMATICS SHOWCASE */}
        {/* ========================================================= */}
        <div
          className="w-full lg:w-7/12 flex flex-col justify-between"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
        >
          {/* Header & Badges */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
              <Zap className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>Capital Real Estate • Fleet Command</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Enterprise Fleet & Transport Logistics
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl">
              Internal vehicle booking, conflict-free scheduling, automated odometer telemetry, and verifiable digital QR gate passes for Capital Real Estate.
            </p>
          </div>

          {/* Dynamic Vehicle Telematics Showcase Card */}
          <div className="mt-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-xl shadow-xl dark:shadow-2xl relative overflow-hidden group transition-all">
            {/* Top Showcase Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                  <Car className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                    {activeVehicle.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeVehicle.plate}</span>
                    <span>•</span>
                    <span>{activeVehicle.category}</span>
                  </div>
                </div>
              </div>

              {/* Prev / Next Chevrons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setActiveVehicleIndex(
                      (prev) => (prev - 1 + SHOWCASE_VEHICLES.length) % SHOWCASE_VEHICLES.length
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors"
                  aria-label="Previous vehicle"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveVehicleIndex((prev) => (prev + 1) % SHOWCASE_VEHICLES.length)
                  }
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors"
                  aria-label="Next vehicle"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vehicle Hero Graphic with Smooth Transition */}
            <div className="relative py-4 sm:py-6 flex items-center justify-center min-h-[180px] sm:min-h-[220px]">
              {/* Radial backdrop glow tailored to vehicle */}
              <div
                className="absolute inset-0 opacity-15 dark:opacity-20 blur-2xl rounded-full"
                style={{ backgroundColor: activeVehicle.accentColor }}
              />
              <img
                key={activeVehicle.id}
                src={activeVehicle.image}
                alt={activeVehicle.name}
                className="relative z-10 max-h-40 sm:max-h-52 w-auto object-contain filter drop-shadow-[0_15px_20px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_20px_25px_rgba(0,0,0,0.6)] transition-all duration-500 animate-fadeIn"
              />
            </div>

            {/* Live Telemetry Data Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">
                  <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Capacity</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">{activeVehicle.capacity}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">
                  <Fuel className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span>Fuel Tank</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 dark:bg-amber-400 h-full rounded-full"
                      style={{ width: `${activeVehicle.fuel}%` }}
                    />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{activeVehicle.fuel}%</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-mono">
                  <Radio className="w-3 h-3 text-red-600 dark:text-red-400" />
                  <span>Drivetrain</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{activeVehicle.transmission}</div>
              </div>
            </div>

            {/* Thumbnail Navigator Row */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                Fleet Selector:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {SHOWCASE_VEHICLES.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVehicleIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all whitespace-nowrap ${
                      idx === activeVehicleIndex
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-red-400'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {v.name.split(' ')[0]} {v.name.split(' ')[1] || ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* System Guarantees Footer Ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/40 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-[11px] leading-snug">
                <div className="font-bold text-slate-800 dark:text-slate-200">Conflict-Free Engine</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Zero double-bookings</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/40 shadow-xs">
              <QrCode className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <div className="text-[11px] leading-snug">
                <div className="font-bold text-slate-800 dark:text-slate-200">Verifiable QR Passes</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Gate security validation</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/90 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/40 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <div className="text-[11px] leading-snug">
                <div className="font-bold text-slate-800 dark:text-slate-200">Real Telemetry</div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Odometer & defect tracking</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: EXECUTIVE AUTHENTICATION & ACCESS TERMINAL   */}
        {/* ========================================================= */}
        <div className="w-full lg:w-5/12 max-w-md">
          <div className="bg-white dark:bg-slate-950/90 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl backdrop-blur-xl relative transition-all">
            {/* Corner security badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>TLS 256-BIT</span>
            </div>

            {/* Brand Logo & Header */}
            <div className="flex flex-col items-start mb-6">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-3 shadow-xs">
                <img
                  src="/assets/capital-emblem.png"
                  alt="Capital Real Estate Emblem"
                  className="w-10 h-10 object-contain"
                />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Staff & Dispatch Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your company email or employee ID to open the fleet console.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <Alert type="error" className="mb-5 text-xs" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  id="identifier"
                  label="Company Email or Employee ID"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="e.g. employee@capitalre.com or EMP-101"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setSelectedPersona(null);
                  }}
                  leftIcon={<Mail className="w-4 h-4" />}
                  disabled={isLoading}
                  className="bg-slate-50/80 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedPersona(null);
                  }}
                  leftIcon={<Lock className="w-4 h-4" />}
                  disabled={isLoading}
                  className="bg-slate-50/80 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Stateless 7-Day JWT</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordInitialTab('request');
                    setForgotPasswordIdentifier(identifier);
                    setForgotPasswordPassphrase('');
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/30 text-white py-3 rounded-xl transition-all"
                isLoading={isLoading}
              >
                <span>Sign In to Fleet OS</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Quick-Fill Demonstration Personas */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Key className="w-3.5 h-3.5 text-red-500" />
                  <span>Corporate Demo Credentials</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">1-Click Fast Fill</span>
              </div>

              {/* Persona Category Filter Pills */}
              <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPersonaCategory('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors whitespace-nowrap ${
                    personaCategory === 'all'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({QUICK_FILL_PERSONAS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPersonaCategory('driver')}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors whitespace-nowrap flex items-center gap-1 ${
                    personaCategory === 'driver'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Drivers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPersonaCategory('admin')}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors whitespace-nowrap ${
                    personaCategory === 'admin'
                      ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Logistics & Admin
                </button>
                <button
                  type="button"
                  onClick={() => setPersonaCategory('department')}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors whitespace-nowrap ${
                    personaCategory === 'department'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Departments
                </button>
              </div>

              {/* Persona List Container */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {QUICK_FILL_PERSONAS.filter(
                  (p) => personaCategory === 'all' || p.category === personaCategory
                ).map((p) => {
                  const isSelected = selectedPersona === p.email;
                  const borderGlow =
                    p.themeColor === 'emerald'
                      ? 'border-emerald-300 dark:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                      : p.themeColor === 'red'
                      ? 'border-red-300 dark:border-red-500/50 hover:bg-red-50/50 dark:hover:bg-red-950/20'
                      : p.themeColor === 'amber'
                      ? 'border-amber-300 dark:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                      : p.themeColor === 'blue'
                      ? 'border-blue-300 dark:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                      : 'border-slate-300 dark:border-slate-600/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/40';

                  const badgeClass =
                    p.themeColor === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : p.themeColor === 'red'
                      ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                      : p.themeColor === 'amber'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                      : p.themeColor === 'blue'
                      ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

                  return (
                    <button
                      key={p.badgeId}
                      type="button"
                      onClick={() => handleQuickFill(p)}
                      className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? `bg-slate-50 dark:bg-slate-900 ring-2 ${
                              p.themeColor === 'emerald'
                                ? 'ring-emerald-500 border-emerald-500'
                                : p.themeColor === 'red'
                                ? 'ring-red-500 border-red-500'
                                : p.themeColor === 'amber'
                                ? 'ring-amber-500 border-amber-500'
                                : p.themeColor === 'blue'
                                ? 'ring-blue-500 border-blue-500'
                                : 'ring-slate-400 border-slate-400'
                            }`
                          : `bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 ${borderGlow}`
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                            {p.personName}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}
                          >
                            {p.roleName}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {p.email} • {p.department}
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 group-hover:bg-red-600 group-hover:text-white text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors shrink-0">
                        Select
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Shared credentials password: </span>
                <span className="text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono select-all">
                  CapitalFleet2026!
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Corporate Platform Footer */}
      <footer className="relative z-10 w-full py-4 px-4 sm:px-8 border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-300">Capital Real Estate & Apartment</span>
          <span>•</span>
          <span>Operational Fleet Management System</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>Addis Ababa, Ethiopia</span>
          <span>•</span>
          <a
            href="http://localhost:4100/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-red-600 dark:hover:text-red-400 transition-colors underline"
          >
            Swagger API Docs
          </a>
        </div>
      </footer>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        initialTab={forgotPasswordInitialTab}
        initialIdentifier={forgotPasswordIdentifier}
        initialPassphrase={forgotPasswordPassphrase}
        onClose={() => {
          setIsForgotPasswordOpen(false);
          try {
            if (window.location.search.includes('action=')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch {}
        }}
        onSuccess={() => {
          setIsForgotPasswordOpen(false);
          setError(null);
          try {
            if (window.location.search.includes('action=')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          } catch {}
        }}
      />
    </div>
  );
};
