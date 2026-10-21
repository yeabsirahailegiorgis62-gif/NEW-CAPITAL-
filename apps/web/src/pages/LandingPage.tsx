import React, { useState } from 'react';
import {
  Calendar,
  Shield,
  ArrowRight,
  ClipboardList,
  Sun,
  Moon,
  Sparkles,
  Gauge,
  Fuel,
  Users,
  CheckCircle2,
  MapPin,
  ChevronRight,
  Radio,
  Zap,
  Activity,
  Car,
  Compass,
  Clock,
  ArrowDown,
  Layers,
  FileText,
  Wrench,
  BarChart3,
  CheckCircle,
  UserCheck,
  CheckCheck,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useTheme } from '@/context/ThemeContext';
import { DynamicFleetRouteSimulation } from '@/components/telematics/DynamicFleetRouteSimulation';
import { AutomotiveJourneySpine } from '@/components/automotive/AutomotiveJourneySpine';
import { HighwaySectionConnector } from '@/components/automotive/HighwaySectionConnector';

interface LandingPageProps {
  onSignInClick: () => void;
}

const FLEET_INVENTORY = [
  {
    id: 'prado',
    name: 'Land Cruiser Prado TX',
    category: 'SUV',
    image: '/vehicles/prado.png',
    capacity: '7 Executive Seats',
    fuel: '92% Fuel',
    transmission: 'Automatic 4WD',
    purpose: 'Executive Site Inspections & Highway Missions',
    status: 'ACTIVE',
    plate: 'ET-3-84912',
    accentColor: '#dc2626',
    odometer: '48,210 KM',
  },
  {
    id: 'hilux',
    name: 'Hilux Double Cab 4x4',
    category: 'PICKUP',
    image: '/vehicles/hilux.png',
    capacity: '5 Seats + Heavy Cargo',
    fuel: '78% Fuel',
    transmission: 'Manual 4x4',
    purpose: 'Heavy Construction & Site Survey Logistics',
    status: 'ACTIVE',
    plate: 'ET-4-29014',
    accentColor: '#16a34a',
    odometer: '62,840 KM',
  },
  {
    id: 'hiace',
    name: 'HiAce High Roof Commuter',
    category: 'MINIBUS',
    image: '/vehicles/hiace.png',
    capacity: '14 Passengers',
    fuel: '85% Fuel',
    transmission: 'Manual',
    purpose: 'Engineering Crew & Departmental Transport',
    status: 'ACTIVE',
    plate: 'ET-2-55109',
    accentColor: '#0284c7',
    odometer: '35,110 KM',
  },
  {
    id: 'corolla',
    name: 'Corolla Altis Executive',
    category: 'SEDAN',
    image: '/vehicles/corolla.png',
    capacity: '5 Executive Seats',
    fuel: '95% Fuel',
    transmission: 'CVT Automatic',
    purpose: 'Urban Corporate Client Relations & Legal Dispatch',
    status: 'ACTIVE',
    plate: 'ET-3-19402',
    accentColor: '#f59e0b',
    odometer: '29,850 KM',
  },
  {
    id: 'ranger',
    name: 'Ford Ranger XLT SuperCab',
    category: 'PICKUP',
    image: '/vehicles/ranger.png',
    capacity: '4 Seats + Tech Bed',
    fuel: '89% Fuel',
    transmission: 'Automatic 4x4',
    purpose: 'Rapid Response Engineering & Field Survey',
    status: 'ACTIVE',
    plate: 'ET-4-91823',
    accentColor: '#ea580c',
    odometer: '51,400 KM',
  },
  {
    id: 'dmax',
    name: 'Isuzu D-Max Utility 4x4',
    category: 'PICKUP',
    image: '/vehicles/dmax.png',
    capacity: '5 Seats + Tech Bed',
    fuel: '72% Fuel',
    transmission: 'Manual 4WD',
    purpose: 'Infrastructure Inspections & Equipment Transport',
    status: 'ACTIVE',
    plate: 'ET-4-40291',
    accentColor: '#10b981',
    odometer: '73,200 KM',
  },
];

// Reference site key features
const KEY_FEATURES = [
  {
    icon: Car,
    title: 'Fleet Management',
    text: 'Track vehicles, availability, maintenance and assignments.',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40',
  },
  {
    icon: Users,
    title: 'Driver Management',
    text: 'Manage driver profiles, assignments and availability.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
  },
  {
    icon: FileText,
    title: 'Transport Requests',
    text: 'Submit, review and approve transportation requests.',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
  },
  {
    icon: Navigation,
    title: 'Trip Management',
    text: 'Plan and monitor trips and assignments.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
  },
  {
    icon: Wrench,
    title: 'Maintenance',
    text: 'Track vehicle maintenance and service history.',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    text: 'Monitor transport operations and performance.',
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40',
  },
];

// Reference site 5-step workflow
const WORKFLOW_STEPS = [
  {
    label: 'Request',
    icon: FileText,
    desc: 'Submit daily or weekly trip request with passenger and route details.',
    badge: 'Step 01',
  },
  {
    label: 'Review',
    icon: CheckCircle,
    desc: 'Logistics evaluates schedule, justification, and departmental priority.',
    badge: 'Step 02',
  },
  {
    label: 'Assign',
    icon: UserCheck,
    desc: 'Allocate matching vehicle and verified chauffeur with zero double-booking.',
    badge: 'Step 03',
  },
  {
    label: 'Trip',
    icon: Navigation,
    desc: 'Departure dispatch with initial odometer recording and live trip tracking.',
    badge: 'Step 04',
  },
  {
    label: 'Complete',
    icon: CheckCheck,
    desc: 'Return check-in, odometer audit, defect ticketing, and digital receipts.',
    badge: 'Step 05',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onSignInClick }) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedCarId, setSelectedCarId] = useState<string>('prado');

  const activeCar = FLEET_INVENTORY.find((c) => c.id === selectedCarId) || FLEET_INVENTORY[0];

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors selection:bg-brand-500 selection:text-white">
      {/* ── Accessible Skip to Content ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-4 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white shadow-lg"
      >
        Skip to content
      </a>

      {/* ── Continuous Automotive Journey Highway Spine & HUD ── */}
      <AutomotiveJourneySpine />

      {/* ── Top Atmospheric Status Ticker ── */}
      <div className="bg-gradient-to-r from-slate-100 via-brand-50 to-slate-100 dark:from-slate-950 dark:via-brand-950/80 dark:to-slate-950 text-slate-700 dark:text-white text-xs py-2 px-4 text-center font-medium border-b border-slate-200 dark:border-brand-900/30 flex items-center justify-center gap-2 relative z-30">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
        <span className="truncate max-w-xl">
          Capital Fleet Transport Management System • Central Logistics Grid (Addis Ababa, UTC+3)
        </span>
      </div>

      {/* ── Main Navigation Header (Exact Reference Style + Accessible Nav) ── */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-950/70 transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <BrandLogo size="md" />

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Key Features
            </a>
            <a
              href="#workflow"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Workflow
            </a>
            <a
              href="#why-portal"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('why-portal')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Why Capital Fleet
            </a>
            <a
              href="#fleet-terminal"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('fleet-terminal')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Fleet Gallery
            </a>
            <a
              href="#telematics-corridor"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('telematics-corridor')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telematics
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={onSignInClick}
              className="rounded-full px-5 sm:px-6 font-medium h-9 sm:h-10 text-sm shadow-md shadow-brand-500/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main id="main-content" className="flex-1">
        {/* ========================================================= */}
        {/* SECTION 1: HERO (EXACT REFERENCE LAYOUT & CONTENT)         */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-28 border-b border-slate-200 dark:border-slate-850 bg-gradient-to-b from-slate-100/70 via-white to-slate-50 dark:from-[#050914] dark:via-[#091024] dark:to-[#040712]">
          {/* Skewed Background Blob (Reference Element) */}
          <div className="absolute inset-y-0 right-0 w-1/2 bg-brand-500/5 dark:bg-brand-500/10 rounded-l-[100px] -z-10 transform translate-x-20 -skew-x-12" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              {/* Left Column: Heading, Subtitle, CTAs, Pillars */}
              <div className="flex flex-col justify-center order-1 lg:order-1 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-5 w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>INTERNAL FLEET & TRANSPORT MANAGEMENT PORTAL</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  Simplify{' '}
                  <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-brand-600 via-rose-500 to-amber-500 dark:from-brand-500 dark:via-rose-400 dark:to-amber-400 bg-clip-text text-transparent">
                    transport operations.
                  </span>
                </h1>

                <p className="mt-5 sm:mt-6 max-w-lg text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Manage vehicles, drivers, transport requests, schedules, and assignments from one secure, centralized workspace.
                </p>

                {/* CTAs */}
                <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={onSignInClick}
                    className="group relative overflow-hidden rounded-full px-6 sm:px-8 h-12 sm:h-14 bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-600/25 hover:shadow-brand-600/40 transition-all hover:-translate-y-0.5 border border-brand-500/50 flex items-center justify-center font-semibold text-sm sm:text-base gap-2 cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Sign in to Portal
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    {/* Reference Shimmer Light Reflection Effect */}
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  </button>

                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="rounded-full px-5 sm:px-7 text-sm sm:text-base h-12 sm:h-14 font-medium hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors border border-slate-200 dark:border-slate-800"
                  >
                    Explore features
                  </Button>
                </div>

                {/* Reference 3 Status Feature Indicators */}
                <div className="hidden sm:flex mt-8 sm:mt-10 items-center gap-4 sm:gap-6 border-t border-slate-200 dark:border-slate-800/80 pt-5 sm:pt-6">
                  <div>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Real-time</p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Visibility
                    </p>
                  </div>
                  <div className="h-6 sm:h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Digital</p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Workflows
                    </p>
                  </div>
                  <div className="h-6 sm:h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Centralized</p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Control
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual with Animated Floating Status Badges (Exact Reference) */}
              <div className="relative order-2 lg:order-2">
                <div className="relative overflow-hidden rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 bg-black">
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />
                  <div className="absolute inset-0 bg-brand-600/10 mix-blend-multiply z-10 pointer-events-none" />
                  <img
                    src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
                    alt="Fleet of transport vehicles lined up for dispatch, representing organized logistics operations"
                    width={800}
                    height={600}
                    loading="eager"
                    className="h-full w-full object-cover aspect-[4/3] transform hover:scale-105 transition-transform duration-700 opacity-85 brightness-95"
                  />
                </div>

                {/* Floating Badge 1 (Top-Left): "Request Approved • Vehicle assigned" */}
                <div className="absolute -left-3 sm:-left-8 top-8 sm:top-12 z-20 flex items-center gap-2 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 sm:p-4 shadow-xl border border-slate-200/80 dark:border-slate-800 transition-transform hover:scale-105">
                  <div className="flex size-9 sm:size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="size-4 sm:size-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Request Approved</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Vehicle assigned</p>
                  </div>
                </div>

                {/* Floating Badge 2 (Bottom-Right): "Trip Scheduled • Tomorrow, 08:00 AM" */}
                <div className="absolute -right-3 sm:-right-6 bottom-8 sm:bottom-14 z-20 flex items-center gap-2 sm:gap-4 rounded-xl sm:rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 sm:p-4 shadow-xl border border-slate-200/80 dark:border-slate-800 transition-transform hover:scale-105">
                  <div className="flex size-9 sm:size-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400">
                    <Calendar className="size-4 sm:size-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Trip Scheduled</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Tomorrow, 08:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: KEY FEATURES (EXACT 6 CARDS FROM REFERENCE)    */}
        {/* ========================================================= */}
        <section id="features" className="py-16 sm:py-24 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-850">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 sm:mb-16 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                Key Features
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
                Everything you need to manage the fleet.
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {KEY_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm transition-all hover:shadow-xl hover:border-brand-500/50 hover:-translate-y-1"
                  >
                    <span
                      className={`mb-6 flex size-12 items-center justify-center rounded-xl transition-colors ${feature.bg} ${feature.color}`}
                    >
                      <Icon className="size-6" />
                    </span>
                    <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {feature.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: WORKFLOW PIPELINE (EXACT 5 STAGES FROM REF)    */}
        {/* ========================================================= */}
        <section id="workflow" className="py-16 sm:py-24 bg-slate-900 dark:bg-[#02050c] text-white relative overflow-hidden border-b border-slate-800">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-12 sm:mb-16 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                <span>DIGITAL TRANSPORT LIFECYCLE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Transport Request Workflow
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-300">
                A seamless 5-stage pipeline from requisition to trip return.
              </p>
            </div>

            {/* 5 Process Cards with Connectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-4 relative">
              {WORKFLOW_STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all hover:bg-white/10 hover:border-brand-500/50 hover:-translate-y-1 group"
                  >
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 mb-3">
                      {step.badge}
                    </span>

                    <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="size-8" />
                    </div>

                    <h4 className="text-lg font-bold text-white mb-2">{step.label}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>

                    {/* Connecting Chevron on Desktop */}
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-500">
                        <ChevronRight className="w-5 h-5 text-brand-500/60" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: WHY TRANSPORT PORTAL (EXACT 4 PILLARS)         */}
        {/* ========================================================= */}
        <section id="why-portal" className="py-16 sm:py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 sm:mb-16 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                Why Transport Portal
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
                Engineered for maximum corporate operational integrity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="size-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <Navigation className="size-7" />
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Centralized</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Manage all transport requests and fleet logistics in one unified platform.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Radio className="size-7" />
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Real-time Visibility</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Track vehicle availability, trip progress, and schedules in real-time.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ShieldCheck className="size-7" />
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Conflict Prevention</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Automated safeguards against double-booking vehicles and drivers.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="size-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileText className="size-7" />
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Accountability & Auditing</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Full digital trail from request submission to trip completion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: EXECUTIVE FLEET INVENTORY SHOWCASE             */}
        {/* ========================================================= */}
        <section id="fleet-terminal" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-850">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">
                <span>CORPORATE FLEET MASTER CATALOG</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Equipped for Every Corporate Mission
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Select any corporate vehicle to inspect seating capacity, transmission, telemetry stats, and assignment readiness.
              </p>
            </div>

            {/* Featured Car Interactive Display Banner */}
            <div className="mb-8 rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="w-full md:w-1/2 flex items-center justify-center p-4">
                <div className="relative aspect-[16/10] max-h-[240px] w-full flex items-center justify-center">
                  <div
                    className="absolute bottom-2 inset-x-8 h-8 rounded-full blur-md opacity-35"
                    style={{ backgroundColor: activeCar.accentColor }}
                  />
                  <img
                    src={activeCar.image}
                    alt={activeCar.name}
                    className="w-full h-full object-contain filter drop-shadow-xl transform transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>

              <div className="w-full md:w-1/2 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                    style={{
                      backgroundColor: `${activeCar.accentColor}20`,
                      color: activeCar.accentColor,
                      border: `1px solid ${activeCar.accentColor}40`,
                    }}
                  >
                    {activeCar.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{activeCar.plate}</span>
                  <Badge status={activeCar.status} size="sm" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{activeCar.name}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {activeCar.purpose}
                </p>

                {/* Specs Pills */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">CAPACITY</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">{activeCar.capacity}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">TRANSMISSION</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeCar.transmission}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">ODOMETER</div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">{activeCar.odometer}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={onSignInClick}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Request {activeCar.name}
                  </Button>
                </div>
              </div>
            </div>

            {/* All 6 Vehicles Grid Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {FLEET_INVENTORY.map((car) => {
                const isSelected = selectedCarId === car.id;
                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setSelectedCarId(car.id)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-brand-500 ring-2 ring-brand-500/20 shadow-xl scale-[1.02]'
                        : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full flex items-center justify-center p-1">
                      <img src={car.image} alt={car.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{car.name}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        <span>{car.category}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{car.fuel}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 6: DYNAMIC FLEET HIGHWAY TELEMATICS               */}
        {/* ========================================================= */}
        <section
          id="telematics-corridor"
          className="relative py-14 sm:py-20 overflow-hidden border-b border-slate-200 dark:border-slate-850 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-[#03060e] dark:via-[#070d1d] dark:to-[#040813]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>REAL-TIME ADDIS ABABA HIGHWAY GRID</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Live Vehicles in Continuous Motion
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Watch real corporate units navigate Addis Ababa logistics corridors. Headlights illuminate the road, taillights trail velocity, and live telematics track odometer progression.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-6xl">
              <DynamicFleetRouteSimulation />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 7: CALL TO ACTION BANNER (EXACT REFERENCE CTA)    */}
        {/* ========================================================= */}
        <section
          id="booking-portal"
          className="relative py-16 sm:py-24 overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-900 via-[#18090f] to-slate-950 text-white"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ready for Capital Real Estate Staff & Chauffeurs</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Ready to modernize transport operations?
            </h2>

            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Sign in with your corporate credentials to submit daily or weekly trip requests, review schedules, or inspect fleet availability in real time.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onSignInClick}
                className="group relative overflow-hidden rounded-full px-8 h-14 bg-brand-600 hover:bg-brand-700 text-white shadow-xl shadow-brand-600/30 transition-all hover:-translate-y-0.5 border border-brand-500/50 flex items-center justify-center font-bold text-base gap-2 cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Sign in to Portal
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* FOOTER (EXACT REFERENCE FOOTER WITH CONFIDENTIAL BADGE)   */}
      {/* ========================================================= */}
      <footer className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-10 border-t border-slate-200 dark:border-slate-850 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandLogo size="md" />

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                © {new Date().getFullYear()} Capital Fleet Transport Portal.
              </p>
              <p className="mt-1 font-semibold tracking-wide text-brand-600 dark:text-brand-400">
                Internal Use Only • Confidential
              </p>
            </div>
            <div className="hidden sm:block h-8 w-[1px] bg-slate-300 dark:bg-slate-800" />
            <div className="text-[11px] text-slate-500 font-mono">
              Operational Headquarters • Addis Ababa, Ethiopia (UTC+3)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
