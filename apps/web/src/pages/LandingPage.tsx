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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useTheme } from '@/context/ThemeContext';
import { DynamicFleetRouteSimulation } from '@/components/telematics/DynamicFleetRouteSimulation';

interface LandingPageProps {
  onSignInClick: () => void;
}

const FLEET_SHOWCASE = [
  {
    name: 'Land Cruiser Prado TX',
    category: 'SUV',
    image: '/vehicles/prado.png',
    capacity: '7 Seats',
    fuel: '92% Fuel',
    transmission: 'Automatic 4WD',
    purpose: 'Executive Site Inspections & Highway Missions',
    status: 'ACTIVE',
  },
  {
    name: 'Hilux Double Cab',
    category: 'PICKUP',
    image: '/vehicles/hilux.png',
    capacity: '5 Seats',
    fuel: '78% Fuel',
    transmission: 'Manual 4x4',
    purpose: 'Heavy Construction & Site Survey Logistics',
    status: 'ACTIVE',
  },
  {
    name: 'HiAce High Roof Commuter',
    category: 'MINIBUS',
    image: '/vehicles/hiace.png',
    capacity: '14 Seats',
    fuel: '85% Fuel',
    transmission: 'Manual',
    purpose: 'Engineering Crew & Departmental Transport',
    status: 'ACTIVE',
  },
  {
    name: 'Corolla Altis Sedan',
    category: 'SEDAN',
    image: '/vehicles/corolla.png',
    capacity: '5 Seats',
    fuel: '65% Fuel',
    transmission: 'CVT Automatic',
    purpose: 'Urban Client Relations & Document Delivery',
    status: 'ACTIVE',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onSignInClick }) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedCar, setSelectedCar] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors selection:bg-brand-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-brand-900 to-navy-900 text-white text-xs py-2 px-4 text-center font-medium border-b border-brand-800/40 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Capital Fleet 2026 Logistics Engine • Headquarters Addis Ababa, Ethiopia (UTC+3)</span>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <BrandLogo size="md" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#command-center" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              3D Command Center
            </a>
            <a href="#vehicles" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Fleet Inventory
            </a>
            <a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Workflow
            </a>
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Features
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-800"
              title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <Button variant="primary" size="sm" onClick={onSignInClick} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with 3D Holographic Visual */}
      <section id="command-center" className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/80 text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Next-Gen Corporate Fleet Coordination OS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Corporate travel,{' '}
              <span className="bg-gradient-to-r from-brand-600 via-emerald-600 to-brand-700 bg-clip-text text-transparent">
                orchestrated seamlessly.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Book corporate vehicles, monitor real-time availability in Addis Ababa, prevent scheduling conflicts, and track telemetry across Capital Real Estate projects.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="primary" onClick={onSignInClick} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Capital Fleet Portal
              </Button>
              <a
                href="#vehicles"
                className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 min-h-[44px] text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-800/80 transition-all text-sm shadow-sm"
              >
                Inspect Fleet & Telemetry
              </a>
            </div>
          </div>

          {/* Dynamic 3D Telematics Route Simulation Container */}
          <div className="relative mx-auto max-w-5xl rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-brand-500/20 via-slate-200/50 to-transparent dark:from-brand-500/10 dark:via-slate-800/30 shadow-2xl">
            <DynamicFleetRouteSimulation />
          </div>
        </div>
      </section>

      {/* Fleet Inventory & Car Photos Showcase */}
      <section id="vehicles" className="py-16 md:py-24 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Executive Fleet Showcase
            </h2>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-4xl">
              Equipped for Every Company Mission
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Select vehicles with verified operational status, full telemetry, and seating capacity tailored to your mission.
            </p>
          </div>

          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FLEET_SHOWCASE.map((car, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCar(idx)}
                className={`group cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900 ${
                  selectedCar === idx
                    ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-xl dark:shadow-brand-500/10 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Car Photo */}
                <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-200/50 to-slate-300/40 dark:from-slate-800 dark:to-slate-950 overflow-hidden flex items-center justify-center p-4">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-full object-contain transform transition-transform duration-500 group-hover:scale-108"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge status={car.status} size="sm" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900/80 text-white">
                      {car.category}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {car.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {car.purpose}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      <span>{car.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{car.fuel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Operational Protocol
            </h2>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-4xl">
              End-to-End Trip Lifecycle
            </h3>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              From reservation submission to return inspection, every step is captured with verifiable telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm shadow-brand-500/30">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Guided Booking</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                3-section structured request covering destination, travel window, passenger count, and preferred car.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm shadow-emerald-500/30">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Logistics Approval</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Logistics managers verify departmental priorities. Rejections require mandatory written justification.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm shadow-brand-500/30">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Conflict-Free Assignment</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Atomic database transaction validates [departure, return) timeline to eliminate double-booking.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm shadow-emerald-500/30">
                04
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Trip Dispatch & Check-in</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Departure odometer logging, return check-in, and auto-generated maintenance tickets for any reported defects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-950 via-brand-950 to-slate-950 text-white border-t border-b border-brand-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Operational & Ready for Capital Real Estate Teams</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Ready to reserve your vehicle?
          </h2>

          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Sign in with your company email or employee ID to submit trip requests, review schedules, or inspect fleet availability.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="primary" onClick={onSignInClick} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Sign In to Capital Fleet
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" showSubtitle={false} />
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <span>•</span>
            <span>Addis Ababa (UTC+3)</span>
            <span>•</span>
            <span>Capital Real Estate Corporate</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
