import {
  Truck,
  Calendar,
  Shield,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface LandingPageProps {
  onSignInClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignInClick }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-white shadow-sm">
              <Truck className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-navy-900">CAPITAL FLEET</span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 ml-2 uppercase">
                Capital Real Estate
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#overview" className="hover:text-slate-900 transition-colors">Overview</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onSignInClick}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="overview" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-brand-700 uppercase tracking-wider mb-6">
              CAPITAL REAL ESTATE · LOGISTICS
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy-900 leading-[1.15]">
              Company travel, coordinated.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Request company vehicles, check availability, and coordinate official trips through one centralized platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={onSignInClick} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Sign In to Platform
              </Button>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center font-medium rounded-lg px-5 py-2.5 min-h-[48px] text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors text-base"
              >
                Explore How It Works
              </a>
            </div>
          </div>

          {/* Product Preview Card */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-floating overflow-hidden">
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">portal.capitalfleet.internal / fleet-schedule</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Addis Ababa Operations HQ</span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
              {/* Card 1: Sample Request */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-400">#CR-2026-0412</span>
                  <Badge status="ASSIGNED" size="sm" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Site Visit: Bole Boulevard Project</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Civil Engineering & Survey Team</p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Departure:</span>
                    <span className="font-medium text-slate-800">14 Oct, 08:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle:</span>
                    <span className="font-medium text-brand-700">Toyota Land Cruiser (3-A12490)</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Availability Schedule */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Fleet Availability Today</span>
                  <span className="text-xs text-emerald-600 font-medium">9 of 12 Ready</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">Toyota HiAce (14 seats)</span>
                    <Badge status="AVAILABLE" size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">Ford Ranger Pickup</span>
                    <Badge status="IN_PROGRESS" size="sm" />
                  </div>
                </div>
              </div>

              {/* Card 3: Logistics Coordination */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Logistics Oversight</span>
                  <span className="text-xs text-brand-600 font-medium">Addis HQ</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time schedule conflict prevention with atomic database assignment locks.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Overlaps Prevented</span>
                  <span className="font-semibold text-emerald-600">100% Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Streamlined Operations</h2>
            <h3 className="mt-2 text-3xl font-bold text-navy-900 tracking-tight sm:text-4xl">
              How Capital Fleet Coordinates Trips
            </h3>
            <p className="mt-4 text-base text-slate-600">
              From the initial booking request to vehicle return, every step is organized and transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                1
              </div>
              <h4 className="text-base font-semibold text-slate-900">Request a Vehicle</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Employees specify destination, purpose, departure/return dates, and passenger requirements.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-navy-900 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                2
              </div>
              <h4 className="text-base font-semibold text-slate-900">Logistics Review</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                The Logistics Department evaluates priorities, operational needs, and schedules before approval.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                3
              </div>
              <h4 className="text-base font-semibold text-slate-900">Vehicle Assignment</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Logistics allocates an operational, available vehicle. System guarantees no double-booking.
              </p>
            </div>

            <div className="relative p-6 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                4
              </div>
              <h4 className="text-base font-semibold text-slate-900">Trip Recorded</h4>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Departure and return are logged with actual timestamps and mileage records for auditability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Enterprise Capabilities</h2>
            <h3 className="mt-2 text-3xl font-bold text-navy-900 tracking-tight sm:text-4xl">
              Built for Practical Company Needs
            </h3>
            <p className="mt-4 text-base text-slate-600">
              Eliminating phone tag, double-bookings, and scheduling ambiguity across all departments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900">Availability Calendar</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Visual fleet timeline showing active bookings, maintenance windows, and free time slots in Addis Ababa time.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900">Controlled Allocation</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Approvals and assignments remain strictly in the hands of the Logistics Department with role-based governance.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-slate-900">Complete Audit Trail</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Immutable record of who requested, approved, assigned, and signed off on every trip and vehicle issue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-navy-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Ready to coordinate your next trip?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-base">
            Sign in with your company credentials to request vehicles or coordinate logistics schedules.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={onSignInClick}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold"
            >
              Sign In to Capital Fleet
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-400" />
            <span className="font-bold text-white tracking-wide">CAPITAL FLEET</span>
            <span className="text-xs text-slate-500">| Capital Real Estate Logistics System</span>
          </div>
          <div className="text-xs text-slate-500">
            Internal Operations Platform · Addis Ababa, Ethiopia
          </div>
        </div>
      </footer>
    </div>
  );
};
