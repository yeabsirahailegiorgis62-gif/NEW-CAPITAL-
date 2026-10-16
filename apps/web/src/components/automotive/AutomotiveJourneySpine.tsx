import React, { useState, useEffect } from 'react';
import { Compass, MapPin, Gauge, Shield, ArrowDown, ChevronRight, Zap } from 'lucide-react';

interface AutomotiveJourneySpineProps {
  currentWaypointIndex?: number;
  onNavigateToWaypoint?: (index: number) => void;
}

export const STATIONS = [
  { id: 'command-hub', km: '00.0', title: 'Grand Command Hub', sub: 'Addis Ababa HQ Enclave', icon: '01' },
  { id: 'telematics-corridor', km: '04.2', title: 'Telematics Corridor', sub: 'Live Digital Twin Grid', icon: '02' },
  { id: 'fleet-terminal', km: '08.5', title: 'Executive Fleet Terminal', sub: 'Vehicle Inventory & Specs', icon: '03' },
  { id: 'allocation-engine', km: '12.8', title: 'Allocation Highway', sub: 'Conflict-Free Timeline Engine', icon: '04' },
  { id: 'operations-depot', km: '16.4', title: 'Operations & Maintenance', sub: 'Odometer & Service Logs', icon: '05' },
  { id: 'booking-portal', km: '20.0', title: 'Dispatch Express Station', sub: 'Instant Trip Reservation', icon: '06' },
];

export const AutomotiveJourneySpine: React.FC<AutomotiveJourneySpineProps> = ({
  currentWaypointIndex = 0,
  onNavigateToWaypoint,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStation, setActiveStation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(Math.max(scrollY / docHeight, 0), 1);
        setScrollProgress(progress);

        // Determine active station based on scroll progress
        const stationIdx = Math.min(
          Math.floor(progress * STATIONS.length),
          STATIONS.length - 1
        );
        setActiveStation(stationIdx);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate current vehicle position along spine (percentage)
  const carTopPercent = Math.min(Math.max(scrollProgress * 92 + 4, 4), 96);
  const currentKm = (scrollProgress * 20.0).toFixed(1);

  return (
    <>
      {/* ── Background Highway Visual Spine (Visible on md+ screens) ── */}
      <div
        className="pointer-events-none fixed inset-y-0 left-3 lg:left-6 w-14 z-30 hidden md:flex flex-col items-center justify-between py-12 transition-opacity duration-300"
        aria-hidden="true"
      >
        {/* Continuous Highway Line / Asphalt Ribbon */}
        <div className="relative w-6 h-full rounded-full bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center">
          {/* Animated Road Center Dashes */}
          <div
            className="w-0.5 h-full border-r-2 border-dashed border-brand-500/60 anim-road-dash"
            style={{ strokeDasharray: '6 8' }}
          />

          {/* Road Glow Trails */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-600/40 via-emerald-500/30 to-brand-600/40" />
          <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-brand-600/40 via-emerald-500/30 to-brand-600/40" />

          {/* Active Lead Car Traveling Along Spine with Headlights */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-150 ease-out z-20"
            style={{ top: `${carTopPercent}%` }}
          >
            {/* Forward Headlight Beam Cone illuminating the spine */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-12 bg-gradient-to-b from-sky-400/80 via-sky-400/20 to-transparent blur-[2px] pointer-events-none" />

            {/* Car Top Silhouette */}
            <div className="relative w-4 h-7 rounded-md bg-white border border-brand-500 shadow-lg shadow-brand-500/40 flex flex-col items-center justify-between p-0.5">
              {/* Front Windshield */}
              <div className="w-2.5 h-1.5 rounded-sm bg-slate-900 border-b border-sky-400" />
              {/* Red Tail LEDs */}
              <div className="w-full flex justify-between px-0.5">
                <span className="w-1 h-1 rounded-full bg-red-500 shadow-sm shadow-red-500" />
                <span className="w-1 h-1 rounded-full bg-red-500 shadow-sm shadow-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Milepost Waypoint Nodes along the Ribbon */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col justify-between py-16 pointer-events-auto">
          {STATIONS.map((station, idx) => {
            const isActive = activeStation === idx;
            const isPassed = activeStation > idx;

            return (
              <button
                key={station.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(station.id);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                  onNavigateToWaypoint?.(idx);
                }}
                className={`group relative flex items-center justify-center transition-transform ${
                  isActive ? 'scale-125' : 'hover:scale-110'
                }`}
                title={`${station.title} (KM ${station.km})`}
              >
                {/* Node Ring */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black font-mono transition-all duration-300 shadow-lg ${
                    isActive
                      ? 'bg-brand-600 text-white ring-4 ring-brand-500/30 shadow-brand-500/50'
                      : isPassed
                      ? 'bg-emerald-600 text-white border border-emerald-400'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {station.icon}
                </div>

                {/* Hover Milestone Tooltip */}
                <div className="absolute left-8 px-2.5 py-1 rounded-lg bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white text-[11px] font-sans font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-30">
                  <span className="text-brand-400 font-mono mr-1">KM {station.km}</span>
                  {station.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mobile & Laptop Cockpit Waypoint Floating HUD ── */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm w-full mx-auto sm:mx-0 pointer-events-auto">
        <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 shadow-2xl text-white select-none transition-all">
          <div className="flex items-center justify-between gap-3">
            {/* Active Waypoint Info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    KM {currentKm}
                  </span>
                  <span className="text-xs font-black text-white truncate">
                    {STATIONS[activeStation].title}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {STATIONS[activeStation].sub}
                </div>
              </div>
            </div>

            {/* Next Milestone Jump Button */}
            <button
              type="button"
              onClick={() => {
                const nextIdx = (activeStation + 1) % STATIONS.length;
                const nextStation = STATIONS[nextIdx];
                const el = document.getElementById(nextStation.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1 transition-all shrink-0 shadow-md shadow-brand-600/30"
              title="Drive to next station"
            >
              <span className="hidden sm:inline">Drive Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mini Journey Highway Progress Ribbon */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-1 text-[9px] font-mono">
            {STATIONS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(s.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex-1 py-1 text-center rounded transition-all truncate ${
                  activeStation === idx
                    ? 'bg-brand-600 text-white font-bold'
                    : 'text-slate-500 hover:text-slate-300 bg-slate-800/40'
                }`}
              >
                {s.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
