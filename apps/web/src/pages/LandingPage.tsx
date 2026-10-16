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
    name: 'Corolla Altis Sedan',
    category: 'SEDAN',
    image: '/vehicles/corolla.png',
    capacity: '5 Seats',
    fuel: '65% Fuel',
    transmission: 'CVT Automatic',
    purpose: 'Urban Client Relations & Document Delivery',
    status: 'ACTIVE',
    plate: 'ET-1-77230',
    accentColor: '#f59e0b',
    odometer: '28,950 KM',
  },
  {
    id: 'ranger',
    name: 'Ranger Wildtrak 3.2 4WD',
    category: 'PICKUP',
    image: '/vehicles/ranger.png',
    capacity: '5 Seats + Offroad Bed',
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

export const LandingPage: React.FC<LandingPageProps> = ({ onSignInClick }) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedCarId, setSelectedCarId] = useState<string>('prado');

  const activeCar = FLEET_INVENTORY.find((c) => c.id === selectedCarId) || FLEET_INVENTORY[0];

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors selection:bg-brand-500 selection:text-white">
      {/* ── Continuous Automotive Journey Highway Spine & HUD ── */}
      <AutomotiveJourneySpine />

      {/* ── Top Atmospheric Status Ticker ── */}
      <div className="bg-gradient-to-r from-slate-100 via-brand-50 to-slate-100 dark:from-slate-950 dark:via-brand-950/80 dark:to-slate-950 text-slate-700 dark:text-white text-xs py-2 px-4 text-center font-medium border-b border-slate-200 dark:border-brand-900/30 flex items-center justify-center gap-2 relative z-30">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
        <span className="truncate max-w-xl">
          Capital Fleet 2026 Logistics Engine • Real-Time Addis Ababa Highway Grid (UTC+3)
        </span>
      </div>

      {/* ── Main Navigation Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <BrandLogo size="md" />

          {/* Station Milestone Jump Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#command-hub" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
              <span className="font-mono text-brand-600 dark:text-brand-400">01</span> Command
            </a>
            <a href="#telematics-corridor" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
              <span className="font-mono text-emerald-600 dark:text-emerald-400">02</span> Telematics
            </a>
            <a href="#fleet-terminal" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
              <span className="font-mono text-sky-600 dark:text-sky-400">03</span> Fleet
            </a>
            <a href="#allocation-engine" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
              <span className="font-mono text-amber-600 dark:text-amber-400">04</span> Allocation
            </a>
            <a href="#operations-depot" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
              <span className="font-mono text-indigo-600 dark:text-indigo-400">05</span> Operations
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
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* STATION 01: GRAND COMMAND ENCLAVE (HERO)                  */}
      {/* ========================================================= */}
      <section
        id="command-hub"
        className="relative pt-8 pb-12 sm:pt-14 sm:pb-16 overflow-hidden border-b border-slate-200 dark:border-slate-900 bg-gradient-to-b from-slate-100 via-white to-slate-50 dark:from-[#050914] dark:via-[#091024] dark:to-[#040712]"
      >
        {/* Subtle Highway Perspective Mesh Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(220,38,38,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(220,38,38,0.12),transparent)] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Station Milepost Beacon Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-brand-500/30 dark:border-brand-500/40 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-5 shadow-lg shadow-brand-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>STATION 01 • KM 00.0 • CENTRAL DISPATCH ENCLAVE</span>
            </div>

            {/* Hero Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Corporate travel,{' '}
              <span className="bg-gradient-to-r from-brand-600 via-emerald-600 to-brand-500 dark:from-brand-500 dark:via-emerald-400 dark:to-brand-400 bg-clip-text text-transparent">
                orchestrated along the road.
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              Welcome to Capital Fleet. An immersive, continuous journey coordinating corporate vehicles across Addis Ababa. 0-conflict scheduling, verifiable odometer logs, and real-time highway telematics.
            </p>

            {/* Quick Action Navigation CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                variant="primary"
                onClick={onSignInClick}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Launch Capital Fleet Portal
              </Button>
              <a
                href="#telematics-corridor"
                className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 min-h-[44px] text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-500/40 transition-all text-xs sm:text-sm shadow-sm gap-2"
              >
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Drive to Telematics Simulation
              </a>
            </div>

            {/* Cockpit Status Bar Indicators */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono">6 Units</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Corporate Fleet Active</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">0 Overlaps</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Collision Prevention</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">3 Steps</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Guided Request Route</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono">UTC+3</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Addis Ababa Highway</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Highway Transition Connector 01 -> 02 ── */}
      <HighwaySectionConnector
        stationNumber="02"
        stationName="Telematics Highway Corridor"
        targetId="telematics-corridor"
        distanceKm="KM 04.2"
        statusText="ADAPTIVE HEADLIGHT BEAMS ACTIVE"
      />

      {/* ========================================================= */}
      {/* STATION 02: DIGITAL TWIN TELEMATICS CORRIDOR              */}
      {/* ========================================================= */}
      <section
        id="telematics-corridor"
        className="relative py-10 sm:py-16 overflow-hidden border-y border-slate-200 dark:border-slate-900 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-[#03060e] dark:via-[#070d1d] dark:to-[#040813]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>STATION 02 • KM 04.2 • DYNAMIC TELEMATICS NETWORK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Live Vehicles in Continuous Motion
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Watch real fleet units navigate Addis Ababa logistics hubs. Projector headlights illuminate the road, red taillights trail velocity, and live telematics track odometer progression.
            </p>
          </div>

          {/* Open Integrated Highway Route Simulation (No Restrictive Central Box) */}
          <div className="relative mx-auto w-full max-w-6xl">
            <DynamicFleetRouteSimulation />
          </div>
        </div>
      </section>

      {/* ── Highway Transition Connector 02 -> 03 ── */}
      <HighwaySectionConnector
        stationNumber="03"
        stationName="Executive Fleet Terminal"
        targetId="fleet-terminal"
        distanceKm="KM 08.5"
        statusText="6 UNITS INSPECTED & VERIFIED"
      />

      {/* ========================================================= */}
      {/* STATION 03: EXECUTIVE FLEET TERMINAL (VEHICLE SHOWCASE)    */}
      {/* ========================================================= */}
      <section
        id="fleet-terminal"
        className="relative py-10 sm:py-16 overflow-hidden border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">
              <span>STATION 03 • KM 08.5 • FLEET INVENTORY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Equipped for Every Corporate Mission
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              High-resolution vehicle gallery. Select any vehicle to inspect seating capacity, transmission, telemetry stats, and assignment readiness.
            </p>
          </div>

          {/* Featured Car Interactive Display Banner */}
          <div className="mb-8 rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-[#0c1427] dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-1/2 flex items-center justify-center p-4">
              <div className="relative aspect-[16/10] max-h-[220px] w-full flex items-center justify-center">
                {/* Under-chassis light pool */}
                <div
                  className="absolute bottom-2 inset-x-8 h-8 rounded-full blur-md opacity-40"
                  style={{ backgroundColor: activeCar.accentColor }}
                />
                <img
                  src={activeCar.image}
                  alt={activeCar.name}
                  className="w-full h-full object-contain filter drop-shadow-xl transform transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>

            <div className="w-full md:w-1/2 space-y-3">
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

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{activeCar.name}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{activeCar.purpose}</p>

              {/* Specs Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">CAPACITY</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{activeCar.capacity}</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">TRANSMISSION</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeCar.transmission}</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm">
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
                  Book {activeCar.name}
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
                  className={`p-3 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-brand-500 ring-2 ring-brand-500/20 shadow-xl scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900'
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

      {/* ── Highway Transition Connector 03 -> 04 ── */}
      <HighwaySectionConnector
        stationNumber="04"
        stationName="Intelligent Allocation Highway"
        targetId="allocation-engine"
        distanceKm="KM 12.8"
        statusText="TIMELINE VALIDATION MATRIX READY"
      />

      {/* ========================================================= */}
      {/* STATION 04: INTELLIGENT ALLOCATION HIGHWAY                */}
      {/* ========================================================= */}
      <section
        id="allocation-engine"
        className="relative py-10 sm:py-16 overflow-hidden border-b border-slate-200 dark:border-slate-900 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-[#070b17] dark:to-slate-950"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-3">
              <span>STATION 04 • KM 12.8 • DISPATCH PROTOCOL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Four-Phase Trip Lifecycle
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Each vehicle movement passes through verifiable governance checkpoints to eliminate double-booking and audit every kilometer traveled.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm relative">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-mono font-bold text-xs mb-3 shadow-md shadow-brand-500/30">
                01
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">3-Step Guided Booking</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Structured departure and return window, passenger counts, and project mission tags across Capital sites.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-xs mb-3 shadow-md shadow-emerald-500/30">
                02
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Logistics Verification</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Logistics directors review department priorities. Rejections require mandatory auditable reasoning.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm relative">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-mono font-bold text-xs mb-3 shadow-md shadow-brand-500/30">
                03
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Conflict-Free Assignment</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Atomic database transaction validates overlapping time ranges to mathematically guarantee zero double-bookings.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-xs mb-3 shadow-md shadow-emerald-500/30">
                04
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Trip Dispatch & Return</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Departure odometer verification, return fuel audit, and automated maintenance tickets for defects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Highway Transition Connector 04 -> 05 ── */}
      <HighwaySectionConnector
        stationNumber="05"
        stationName="Operations & Maintenance Yard"
        targetId="operations-depot"
        distanceKm="KM 16.4"
        statusText="SARBET DEPOT INSPECTION BAYS CLEAR"
      />

      {/* ========================================================= */}
      {/* STATION 05: OPERATIONS & MAINTENANCE YARD                 */}
      {/* ========================================================= */}
      <section
        id="operations-depot"
        className="relative py-10 sm:py-16 overflow-hidden border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
              <span>STATION 05 • KM 16.4 • FLEET SERVICE CORRIDOR</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Telemetry & Maintenance Governance
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Verifiable vehicle telemetry tracked on every journey. Never miss a scheduled service interval or preventative inspection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
                <Gauge className="w-4 h-4" />
                <span>ODOMETER RECONCILIATION</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Trip Distance Validation</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Logistics requires departure and return odometer logging. The system automatically calculates trip distance, detects irregular spikes, and updates vehicle lifetime mileage.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs font-bold">
                <Zap className="w-4 h-4" />
                <span>DEFECT TICKETING</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Automated Maintenance Tickets</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When employees report issues during check-in (brake pads, tire pressure, engine warnings), an automated maintenance record is immediately queued for Sarbet Depot mechanics.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-mono text-xs font-bold">
                <Radio className="w-4 h-4" />
                <span>REAL-TIME AUDIT LOGS</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Immutable Event History</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every booking submission, administrative approval, car reassignment, and status transition is recorded in the permanent audit trail with user ID and exact timestamp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Highway Transition Connector 05 -> 06 ── */}
      <HighwaySectionConnector
        stationNumber="06"
        stationName="Dispatch Express Station"
        targetId="booking-portal"
        distanceKm="KM 20.0"
        statusText="READY FOR RESERVATION SUBMISSION"
      />

      {/* ========================================================= */}
      {/* STATION 06: DISPATCH EXPRESS WAYPOINT (CALL TO ACTION)    */}
      {/* ========================================================= */}
      <section
        id="booking-portal"
        className="relative py-12 sm:py-20 overflow-hidden border-t border-b border-brand-900/40 bg-gradient-to-br from-slate-900 via-[#13070b] to-slate-900 text-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Operational & Ready for Capital Real Estate Teams</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Ready to book your vehicle?
          </h2>

          <p className="text-slate-300 max-w-xl mx-auto text-xs sm:text-base leading-relaxed">
            Sign in with your company email or employee ID to submit trip requests, review schedules, or inspect fleet availability in real time.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              variant="primary"
              onClick={onSignInClick}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Capital Fleet Portal
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER                                                    */}
      {/* ========================================================= */}
      <footer className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-8 border-t border-slate-200 dark:border-slate-900 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" showSubtitle={false} />
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-600 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
            <span>•</span>
            <span>Addis Ababa (UTC+3)</span>
            <span>•</span>
            <span>Capital Real Estate Corporate Fleet Enclave</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
