import React, { useState, useEffect, useRef } from 'react';
import {
  Car,
  Fuel,
  Gauge,
  Navigation,
  Radio,
  ShieldCheck,
  Zap,
  Users,
  Compass,
  MapPin,
  Play,
  Pause,
  Sliders,
  ChevronRight,
  Maximize2,
  Activity,
  Layers,
  Sparkles,
  Eye,
  Crosshair,
  Clock,
  CheckCircle2,
  RotateCcw,
  SunMedium,
  Moon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface VehicleSim {
  id: string;
  name: string;
  category: 'SUV' | 'PICKUP' | 'MINIBUS' | 'SEDAN';
  plate: string;
  color: string;
  roofColor: string;
  accentColor: string;
  speed: number;
  fuel: number;
  driver: string;
  driverAvatar: string;
  mission: string;
  from: string;
  to: string;
  pathId: string;
  speedMultiplier: number;
  length: number;
  width: number;
  image: string;
  etaMinutes: number;
  status: 'In Transit' | 'En Route' | 'Cruising' | 'Express';
}

const VEHICLES: VehicleSim[] = [
  {
    id: 'prado',
    name: 'Land Cruiser Prado TX',
    category: 'SUV',
    plate: 'ET-3-84912',
    color: '#ffffff',
    roofColor: '#0f172a',
    accentColor: '#dc2626', // Flagship Corporate Red
    speed: 58,
    fuel: 92,
    driver: 'Dawit K. (Executive Chauffeur)',
    driverAvatar: 'DK',
    mission: 'Bole Executive Terminal → Kazanchis HQ',
    from: 'Bole Airport Hub',
    to: 'Kazanchis Towers',
    pathId: 'route-bole-kazanchis',
    speedMultiplier: 0.00045,
    length: 36,
    width: 20,
    image: '/vehicles/prado.png',
    etaMinutes: 14,
    status: 'Cruising',
  },
  {
    id: 'hilux',
    name: 'Hilux Double Cab 4x4',
    category: 'PICKUP',
    plate: 'ET-4-29014',
    color: '#e2e8f0',
    roofColor: '#1e293b',
    accentColor: '#16a34a', // Corporate Emerald Green
    speed: 64,
    fuel: 78,
    driver: 'Abebe G. (Logistics Specialist)',
    driverAvatar: 'AG',
    mission: 'Sarbet Depot → CMC Site 4 Foundation',
    from: 'Sarbet Engineering Depot',
    to: 'CMC Residential Towers',
    pathId: 'route-sarbet-cmc',
    speedMultiplier: 0.00038,
    length: 38,
    width: 19,
    image: '/vehicles/hilux.png',
    etaMinutes: 22,
    status: 'In Transit',
  },
  {
    id: 'hiace',
    name: 'HiAce High Roof Commuter',
    category: 'MINIBUS',
    plate: 'ET-2-55109',
    color: '#f8fafc',
    roofColor: '#0f172a',
    accentColor: '#0284c7', // Sky Blue
    speed: 48,
    fuel: 85,
    driver: 'Mulugeta T. (Staff Fleet Driver)',
    driverAvatar: 'MT',
    mission: 'CMC Complex → Ring Road → Bole Cargo',
    from: 'CMC Residential Towers',
    to: 'Bole Airport Hub',
    pathId: 'route-cmc-bole',
    speedMultiplier: 0.00032,
    length: 44,
    width: 21,
    image: '/vehicles/hiace.png',
    etaMinutes: 18,
    status: 'Cruising',
  },
  {
    id: 'corolla',
    name: 'Corolla Altis Sedan',
    category: 'SEDAN',
    plate: 'ET-1-77230',
    color: '#f1f5f9',
    roofColor: '#0f172a',
    accentColor: '#f59e0b', // Amber/Gold
    speed: 52,
    fuel: 65,
    driver: 'Almaz B. (Diplomatic Courier)',
    driverAvatar: 'AB',
    mission: 'Kazanchis Towers → Sarbet Depot',
    from: 'Kazanchis Towers',
    to: 'Sarbet Engineering Depot',
    pathId: 'route-kazanchis-sarbet',
    speedMultiplier: 0.00042,
    length: 32,
    width: 17,
    image: '/vehicles/corolla.png',
    etaMinutes: 11,
    status: 'En Route',
  },
  {
    id: 'ranger',
    name: 'Ranger Wildtrak 3.2 4WD',
    category: 'PICKUP',
    plate: 'ET-4-91823',
    color: '#ea580c', // Wildtrak Orange
    roofColor: '#0f172a',
    accentColor: '#ea580c',
    speed: 68,
    fuel: 89,
    driver: 'Yohannes M. (Rapid Field Engineer)',
    driverAvatar: 'YM',
    mission: 'Gotera Flyover → Bole Cargo Express',
    from: 'Gotera Flyover Interchange',
    to: 'Bole Airport Hub',
    pathId: 'route-gotera-bole',
    speedMultiplier: 0.00048,
    length: 39,
    width: 20,
    image: '/vehicles/ranger.png',
    etaMinutes: 9,
    status: 'Express',
  },
  {
    id: 'dmax',
    name: 'Isuzu D-Max Utility 4x4',
    category: 'PICKUP',
    plate: 'ET-4-40291',
    color: '#cbd5e1',
    roofColor: '#1e293b',
    accentColor: '#10b981', // Emerald
    speed: 56,
    fuel: 72,
    driver: 'Biruk A. (Infrastructure Inspector)',
    driverAvatar: 'BA',
    mission: 'Sarbet Depot → Kazanchis Financial District',
    from: 'Sarbet Engineering Depot',
    to: 'Kazanchis Towers',
    pathId: 'route-sarbet-kazanchis',
    speedMultiplier: 0.00036,
    length: 37,
    width: 19,
    image: '/vehicles/dmax.png',
    etaMinutes: 16,
    status: 'In Transit',
  },
];

const HUBS = [
  {
    id: 'hub-bole',
    name: 'Bole Airport Logistics Hub',
    subtext: 'Cargo Terminal & VIP VIP Gateway',
    code: 'ADD-BOLE',
    x: 180,
    y: 440,
    color: '#16a34a', // Emerald Green
    status: 'Optimal Flow',
  },
  {
    id: 'hub-kazanchis',
    name: 'Kazanchis Executive Towers',
    subtext: 'Corporate HQ & Financial Center',
    code: 'KAZ-HQ',
    x: 520,
    y: 140,
    color: '#dc2626', // Flagship Red
    status: 'High Density',
  },
  {
    id: 'hub-sarbet',
    name: 'Sarbet Engineering Depot',
    subtext: 'Fleet Maintenance & Inspection Bay',
    code: 'SRB-DEPOT',
    x: 210,
    y: 190,
    color: '#f59e0b', // Amber
    status: 'Fluid Ops',
  },
  {
    id: 'hub-cmc',
    name: 'CMC Megasite Construction 4',
    subtext: 'Eastern Industrial Project Hub',
    code: 'CMC-SITE4',
    x: 870,
    y: 330,
    color: '#0284c7', // Sky Blue
    status: 'Active Logistics',
  },
  {
    id: 'hub-gotera',
    name: 'Gotera Flyover Interchange',
    subtext: 'Central Arterial Traffic Ring',
    code: 'GTR-JUNCT',
    x: 500,
    y: 340,
    color: '#8b5cf6', // Violet
    status: 'Clear Corridor',
  },
];

export const DynamicFleetRouteSimulation: React.FC = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('prado');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [headlightMode, setHeadlightMode] = useState<'high' | 'normal' | 'off'>('high');
  const [themeAtmosphere, setThemeAtmosphere] = useState<'midnight' | 'dusk'>('midnight');
  const [showHubTags, setShowHubTags] = useState<boolean>(true);

  // Animation state progression references (0 to 1 loop along path)
  const progressRef = useRef<{ [key: string]: number }>({
    prado: 0.12,
    hilux: 0.44,
    hiace: 0.76,
    corolla: 0.91,
    ranger: 0.28,
    dmax: 0.62,
  });

  const [carPositions, setCarPositions] = useState<{
    [key: string]: { x: number; y: number; angle: number; currentSpeed: number };
  }>({});

  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Real-time animation loop using requestAnimationFrame
  useEffect(() => {
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const delta = Math.min(timestamp - lastTimestamp, 50); // clamp delta
      lastTimestamp = timestamp;

      if (isSimRunning && svgRef.current) {
        const newPositions: {
          [key: string]: { x: number; y: number; angle: number; currentSpeed: number };
        } = {};

        VEHICLES.forEach((v) => {
          const pathEl = svgRef.current?.getElementById(v.pathId) as SVGPathElement | null;
          if (pathEl) {
            const totalLen = pathEl.getTotalLength();
            if (totalLen > 0) {
              // Increment progress along path
              const speedFactor = v.speedMultiplier * simSpeed * (delta / 16.67);
              let prog = (progressRef.current[v.id] || 0) + speedFactor;
              if (prog >= 1) prog -= 1;
              progressRef.current[v.id] = prog;

              const dist = prog * totalLen;
              const pt = pathEl.getPointAtLength(dist);

              // Calculate angle facing forward along the curve
              const nextDist = (dist + 3) % totalLen;
              const nextPt = pathEl.getPointAtLength(nextDist);
              const angle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * (180 / Math.PI);

              // Realistically fluctuate speed during sharp curves
              const angleRad = (angle * Math.PI) / 180;
              const curveDrag = Math.abs(Math.sin(angleRad * 2)) * 7;
              const curSpeed = Math.round(v.speed - curveDrag);

              newPositions[v.id] = {
                x: pt.x,
                y: pt.y,
                angle,
                currentSpeed: curSpeed,
              };
            }
          }
        });

        setCarPositions(newPositions);
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isSimRunning, simSpeed]);

  const selectedVehicle = VEHICLES.find((v) => v.id === selectedVehicleId) || VEHICLES[0];
  const selectedPos = carPositions[selectedVehicle.id];

  const filteredVehicles =
    activeCategoryFilter === 'ALL'
      ? VEHICLES
      : VEHICLES.filter((v) => v.category === activeCategoryFilter);

  // Render automotive top-down chassis based on vehicle category
  const renderCarChassis = (v: VehicleSim, isSelected: boolean) => {
    const halfL = v.length / 2;
    const halfW = v.width / 2;

    return (
      <g>
        {/* Four Corner Tires/Wheels extending from under chassis */}
        {/* Front Left */}
        <rect x={halfL - 9} y={-halfW - 2.5} width="8" height="3" rx="1.5" fill="#090d16" stroke="#334155" strokeWidth="0.5" />
        {/* Front Right */}
        <rect x={halfL - 9} y={halfW - 0.5} width="8" height="3" rx="1.5" fill="#090d16" stroke="#334155" strokeWidth="0.5" />
        {/* Rear Left */}
        <rect x={-halfL + 3} y={-halfW - 2.5} width="8" height="3" rx="1.5" fill="#090d16" stroke="#334155" strokeWidth="0.5" />
        {/* Rear Right */}
        <rect x={-halfL + 3} y={halfW - 0.5} width="8" height="3" rx="1.5" fill="#090d16" stroke="#334155" strokeWidth="0.5" />

        {/* Chassis Drop Shadow */}
        <rect
          x={-halfL + 1.5}
          y={-halfW + 1.5}
          width={v.length}
          height={v.width}
          rx="5"
          fill="rgba(0, 0, 0, 0.75)"
        />

        {/* Outer Painted Hull Body */}
        <rect
          x={-halfL}
          y={-halfW}
          width={v.length}
          height={v.width}
          rx={v.category === 'SEDAN' ? '6' : '4.5'}
          fill={v.color}
          stroke={isSelected ? v.accentColor : '#475569'}
          strokeWidth={isSelected ? '2' : '1'}
        />

        {/* Front Hood Contours / Creases */}
        <path
          d={`M ${halfL - 2} ${-halfW + 4} L ${halfL - 10} ${-halfW + 5} M ${halfL - 2} ${halfW - 4} L ${halfL - 10} ${halfW - 5}`}
          stroke="rgba(0, 0, 0, 0.25)"
          strokeWidth="1"
        />

        {/* Distinctive Silhouette Features by Vehicle Category */}
        {v.category === 'SUV' && (
          // SUV: Roof rails, Sunroof, Rear wiper/spoiler
          <>
            {/* Front Windshield Glass */}
            <path
              d={`M ${halfL - 9} ${-halfW + 3} L ${halfL - 13} ${-halfW + 4} L ${halfL - 13} ${halfW - 4} L ${halfL - 9} ${halfW - 3} Z`}
              fill="#090f1d"
              stroke="#38bdf8"
              strokeWidth="0.6"
            />
            {/* Dark Tinted Cabin Roof */}
            <rect x={-halfL + 7} y={-halfW + 3.5} width={v.length - 17} height={v.width - 7} rx="2.5" fill="#0f172a" />
            {/* Roof Sunroof Glass */}
            <rect x={halfL - 21} y={-halfW + 5.5} width="7" height={v.width - 11} rx="1.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.5" />
            {/* Dual Roof Rack Rails */}
            <line x1={-halfL + 9} y1={-halfW + 3} x2={halfL - 13} y2={-halfW + 3} stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            <line x1={-halfL + 9} y1={halfW - 3} x2={halfL - 13} y2={halfW - 3} stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            {/* Rear Spare Tire Outline or Rear Spoiler */}
            <rect x={-halfL} y={-halfW + 4} width="2.5" height={v.width - 8} rx="1" fill="#334155" />
          </>
        )}

        {v.category === 'PICKUP' && (
          // PICKUP: Front Cab + Open Truck Bed with Cargo Ribs
          <>
            {/* Front Windshield */}
            <path
              d={`M ${halfL - 8} ${-halfW + 3} L ${halfL - 12} ${-halfW + 3.5} L ${halfL - 12} ${halfW - 3.5} L ${halfL - 8} ${halfW - 3} Z`}
              fill="#090f1d"
              stroke="#38bdf8"
              strokeWidth="0.6"
            />
            {/* Cab Roof */}
            <rect x={-halfL + 16} y={-halfW + 3.5} width="12" height={v.width - 7} rx="2" fill="#0f172a" />
            {/* Rear Cab Window */}
            <line x1={-halfL + 16} y1={-halfW + 4} x2={-halfL + 16} y2={halfW - 4} stroke="#38bdf8" strokeWidth="0.8" />
            {/* Sports Bar / Roll Bar */}
            <line x1={-halfL + 15} y1={-halfW + 3} x2={-halfL + 15} y2={halfW - 3} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            {/* Open Truck Bed Liner (dark textured) */}
            <rect x={-halfL + 2} y={-halfW + 3} width="12" height={v.width - 6} rx="1" fill="#111827" stroke="#374151" strokeWidth="0.6" />
            {/* Truck Bed Longitudinal Ribs */}
            <line x1={-halfL + 4} y1={-halfW + 5.5} x2={-halfL + 12} y2={-halfW + 5.5} stroke="#374151" strokeWidth="0.8" />
            <line x1={-halfL + 4} y1={0} x2={-halfL + 12} y2={0} stroke="#374151" strokeWidth="0.8" />
            <line x1={-halfL + 4} y1={halfW - 5.5} x2={-halfL + 12} y2={halfW - 5.5} stroke="#374151" strokeWidth="0.8" />
          </>
        )}

        {v.category === 'MINIBUS' && (
          // MINIBUS: Long Passenger Van with Skylight Panels
          <>
            {/* Extended Front Panoramic Windshield */}
            <path
              d={`M ${halfL - 4} ${-halfW + 3} L ${halfL - 9} ${-halfW + 3.5} L ${halfL - 9} ${halfW - 3.5} L ${halfL - 4} ${halfW - 3} Z`}
              fill="#090f1d"
              stroke="#38bdf8"
              strokeWidth="0.7"
            />
            {/* Long Passenger Cabin */}
            <rect x={-halfL + 5} y={-halfW + 3} width={v.length - 15} height={v.width - 6} rx="2" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />
            {/* Passenger Skylight Panels */}
            <rect x={halfL - 18} y={-halfW + 5.5} width="6" height={v.width - 11} rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.5" />
            <rect x={halfL - 27} y={-halfW + 5.5} width="6" height={v.width - 11} rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.5" />
            <rect x={halfL - 36} y={-halfW + 5.5} width="6" height={v.width - 11} rx="1" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.5" />
            {/* Side Mirrors */}
            <rect x={halfL - 8} y={-halfW - 2} width="3" height="1.8" rx="0.5" fill="#334155" />
            <rect x={halfL - 8} y={halfW + 0.2} width="3" height="1.8" rx="0.5" fill="#334155" />
          </>
        )}

        {v.category === 'SEDAN' && (
          // SEDAN: Sleek fastback profile, hood creases, trunk deck lid
          <>
            {/* Sloped Windshield */}
            <path
              d={`M ${halfL - 8} ${-halfW + 3} L ${halfL - 13} ${-halfW + 3.5} L ${halfL - 13} ${halfW - 3.5} L ${halfL - 8} ${halfW - 3} Z`}
              fill="#090f1d"
              stroke="#38bdf8"
              strokeWidth="0.7"
            />
            {/* Cabin Roof */}
            <rect x={-halfL + 9} y={-halfW + 3.5} width={v.length - 18} height={v.width - 7} rx="2" fill="#0f172a" />
            {/* Sloped Rear Windshield */}
            <path
              d={`M ${-halfL + 9} ${-halfW + 3.5} L ${-halfL + 6} ${-halfW + 3.5} L ${-halfL + 6} ${halfW - 3.5} L ${-halfL + 9} ${halfW - 3.5} Z`}
              fill="#090f1d"
              stroke="#38bdf8"
              strokeWidth="0.6"
            />
            {/* Trunk Deck Lid */}
            <rect x={-halfL + 1} y={-halfW + 3.5} width="4" height={v.width - 7} rx="1" fill={v.color} />
          </>
        )}

        {/* Dual Aerodynamic Side-View Mirrors */}
        <rect x={halfL - 11} y={-halfW - 2.5} width="3.5" height="2" rx="0.8" fill={v.color} stroke="#475569" strokeWidth="0.5" />
        <rect x={halfL - 11} y={halfW + 0.5} width="3.5" height="2" rx="0.8" fill={v.color} stroke="#475569" strokeWidth="0.5" />

        {/* Dual Projector Headlight Lenses (White/Cyan Crystal Optics) */}
        <circle cx={halfL - 1} cy={-halfW + 3.5} r="2" fill="#ffffff" stroke="#38bdf8" strokeWidth="0.5" />
        <circle cx={halfL - 1} cy={halfW - 3.5} r="2" fill="#ffffff" stroke="#38bdf8" strokeWidth="0.5" />

        {/* Dual Red Rear Taillights */}
        <rect x={-halfL} y={-halfW + 2.5} width="1.5" height="3" rx="0.5" fill="#ef4444" />
        <rect x={-halfL} y={halfW - 5.5} width="1.5" height="3" rx="0.5" fill="#ef4444" />

        {/* Roof Flashing GPS Telemetry Beacon */}
        <circle cx={0} cy={0} r="2.5" fill={v.accentColor} className="animate-pulse" />
        <circle cx={0} cy={0} r="5" fill="none" stroke={v.accentColor} strokeWidth="0.8" opacity="0.6" />
      </g>
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 text-white shadow-2xl select-none font-sans">
      {/* ========================================================= */}
      {/* TOP COMMAND HUD CONTROL BAR                              */}
      {/* ========================================================= */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-30 relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            <span className="text-xs font-black tracking-wider uppercase text-emerald-400 font-mono">
              GPS TELEMATICS SIMULATION
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-xs text-slate-300 font-mono hidden md:inline flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-400" />
            Addis Ababa Corporate Corridor (UTC+3)
          </span>
        </div>

        {/* Interactive Controls & Filters */}
        <div className="flex items-center gap-2">
          {/* Category Filter Pills */}
          <div className="hidden lg:flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-[11px]">
            {['ALL', 'SUV', 'PICKUP', 'MINIBUS', 'SEDAN'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  activeCategoryFilter === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Simulation Speed Control */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => setIsSimRunning(!isSimRunning)}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isSimRunning ? 'Pause Simulation' : 'Resume Simulation'}
            >
              {isSimRunning ? (
                <Pause className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSimSpeed(simSpeed === 1 ? 2 : 1)}
              className={`px-2 py-1 rounded-md font-mono font-bold transition-colors ${
                simSpeed === 2 ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Simulation Speed Toggle"
            >
              {simSpeed}x
            </button>
          </div>

          {/* Headlight Beam Toggle */}
          <button
            type="button"
            onClick={() => {
              if (headlightMode === 'high') setHeadlightMode('normal');
              else if (headlightMode === 'normal') setHeadlightMode('off');
              else setHeadlightMode('high');
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
              headlightMode !== 'off'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Adaptive Path Lighting"
          >
            <Zap className={`w-3.5 h-3.5 ${headlightMode === 'high' ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">
              {headlightMode === 'high' ? 'High Beams' : headlightMode === 'normal' ? 'Low Beams' : 'Lights Off'}
            </span>
          </button>

          {/* Atmosphere Lighting Toggle */}
          <button
            type="button"
            onClick={() => setThemeAtmosphere(themeAtmosphere === 'midnight' ? 'dusk' : 'midnight')}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-all"
            title="Toggle Night / Dusk Ambience"
          >
            {themeAtmosphere === 'midnight' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <SunMedium className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN INTERACTIVE MAP CANVAS WITH DYNAMIC VEHICLES        */}
      {/* ========================================================= */}
      <div
        className={`relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden transition-colors duration-1000 ${
          themeAtmosphere === 'midnight'
            ? 'bg-gradient-to-b from-[#040812] via-[#070e1c] to-[#03060d]'
            : 'bg-gradient-to-b from-[#0b1329] via-[#0e1933] to-[#080d1d]'
        }`}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 1000 560"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Topographic Map Grid Pattern */}
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              <circle cx="40" cy="40" r="1" fill="rgba(255, 255, 255, 0.08)" />
            </pattern>

            {/* Neon Route Glow Filter */}
            <filter id="routeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Headlight Beam Glow (Volumetric Beam Cones) */}
            <linearGradient id="headlightBeamGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={headlightMode === 'high' ? 0.95 : 0.7} />
              <stop offset="20%" stopColor="#38bdf8" stopOpacity={headlightMode === 'high' ? 0.6 : 0.4} />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity={headlightMode === 'high' ? 0.22 : 0.12} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>

            {/* Ground Asphalt Illuminated Pool */}
            <radialGradient id="asphaltGroundLightGrad">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>

            {/* Red Taillight Velocity Trail Glow */}
            <linearGradient id="taillightTrailGrad" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </linearGradient>

            {/* Green Pulse Gradient for Bole Hub */}
            <radialGradient id="hubBeaconGreen">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#16a34a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
            </radialGradient>

            {/* Red Pulse Gradient for Kazanchis HQ */}
            <radialGradient id="hubBeaconRed">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#dc2626" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Cartographic Grid */}
          <rect width="1000" height="560" fill="url(#gridPattern)" />

          {/* Radar Sector Circles & Azimuth Lines */}
          <circle cx="500" cy="280" r="280" fill="none" stroke="rgba(255,255,255,0.02)" strokeDasharray="4 8" />
          <circle cx="500" cy="280" r="180" fill="none" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 6" />
          <circle cx="500" cy="280" r="80" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />
          <line x1="500" y1="10" x2="500" y2="550" stroke="rgba(255,255,255,0.02)" strokeDasharray="4 8" />
          <line x1="10" y1="280" x2="990" y2="280" stroke="rgba(255,255,255,0.02)" strokeDasharray="4 8" />

          {/* Sub-City Zone Typography & Coordinates */}
          <g fill="rgba(255,255,255,0.18)" fontSize="11" fontWeight="900" letterSpacing="3">
            <text x="520" y="85">KAZANCHIS FINANCIAL CORRIDOR</text>
            <text x="140" y="500">BOLE AIRPORT & CARGO CORRIDOR</text>
            <text x="130" y="130">SARBET ENGINEERING DEPOT</text>
            <text x="730" y="385">CMC RESIDENTIAL & INDUSTRIAL COMPLEX</text>
            <text x="510" y="380" fontSize="10" letterSpacing="2">GOTERA FLYOVER INTERCHANGE</text>
          </g>

          {/* ========================================================= */}
          {/* HIGHWAY ASPHALT & ARTERIAL ROADS (CURVED BEZIER NETWORKS) */}
          {/* ========================================================= */}

          {/* Route 1: Bole -> Gotera -> Kazanchis HQ (Red Corporate Route) */}
          <path
            id="route-bole-kazanchis"
            d="M 180 440 C 260 410, 360 375, 500 340 C 560 330, 560 240, 520 140"
            fill="none"
            stroke="#1e293b"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 180 440 C 260 410, 360 375, 500 340 C 560 330, 560 240, 520 140"
            fill="none"
            stroke="#0a101d"
            strokeWidth="17"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 180 440 C 260 410, 360 375, 500 340 C 560 330, 560 240, 520 140"
            fill="none"
            stroke="rgba(220, 38, 38, 0.55)"
            strokeWidth="3"
            strokeDasharray="6 8"
            filter="url(#routeGlow)"
          />

          {/* Route 2: Sarbet -> Gotera -> CMC Site 4 (Green Logistics Highway) */}
          <path
            id="route-sarbet-cmc"
            d="M 210 190 C 310 240, 400 310, 500 340 C 640 340, 750 310, 870 330"
            fill="none"
            stroke="#1e293b"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 210 190 C 310 240, 400 310, 500 340 C 640 340, 750 310, 870 330"
            fill="none"
            stroke="#0a101d"
            strokeWidth="17"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 210 190 C 310 240, 400 310, 500 340 C 640 340, 750 310, 870 330"
            fill="none"
            stroke="rgba(22, 163, 74, 0.55)"
            strokeWidth="3"
            strokeDasharray="6 8"
            filter="url(#routeGlow)"
          />

          {/* Route 3: CMC -> Southern Ring Road -> Bole Hub (Cyan Commuter Express) */}
          <path
            id="route-cmc-bole"
            d="M 870 330 C 810 440, 650 490, 490 490 C 330 490, 240 480, 180 440"
            fill="none"
            stroke="#1e293b"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 870 330 C 810 440, 650 490, 490 490 C 330 490, 240 480, 180 440"
            fill="none"
            stroke="#0a101d"
            strokeWidth="17"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 870 330 C 810 440, 650 490, 490 490 C 330 490, 240 480, 180 440"
            fill="none"
            stroke="rgba(2, 132, 199, 0.55)"
            strokeWidth="3"
            strokeDasharray="6 8"
            filter="url(#routeGlow)"
          />

          {/* Route 4: Kazanchis -> Central Loop -> Sarbet (Amber Courier Route) */}
          <path
            id="route-kazanchis-sarbet"
            d="M 520 140 C 440 120, 310 130, 210 190"
            fill="none"
            stroke="#1e293b"
            strokeWidth="22"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 520 140 C 440 120, 310 130, 210 190"
            fill="none"
            stroke="#0a101d"
            strokeWidth="17"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 520 140 C 440 120, 310 130, 210 190"
            fill="none"
            stroke="rgba(245, 158, 11, 0.55)"
            strokeWidth="3"
            strokeDasharray="6 8"
            filter="url(#routeGlow)"
          />

          {/* Route 5: Gotera Flyover -> Bole Cargo Bypass (Orange Ranger Route) */}
          <path
            id="route-gotera-bole"
            d="M 500 340 C 420 380, 300 420, 180 440"
            fill="none"
            stroke="#1e293b"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 500 340 C 420 380, 300 420, 180 440"
            fill="none"
            stroke="#0a101d"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 500 340 C 420 380, 300 420, 180 440"
            fill="none"
            stroke="rgba(234, 88, 12, 0.55)"
            strokeWidth="3"
            strokeDasharray="6 8"
            filter="url(#routeGlow)"
          />

          {/* Route 6: Sarbet -> North Kazanchis Spur (Emerald D-Max Route) */}
          <path
            id="route-sarbet-kazanchis"
            d="M 210 190 C 280 150, 420 170, 520 140"
            fill="none"
            stroke="#1e293b"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 210 190 C 280 150, 420 170, 520 140"
            fill="none"
            stroke="#0a101d"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 210 190 C 280 150, 420 170, 520 140"
            fill="none"
            stroke="rgba(16, 185, 129, 0.55)"
            strokeWidth="2.5"
            strokeDasharray="5 7"
            filter="url(#routeGlow)"
          />

          {/* ========================================================= */}
          {/* LOGISTICS HUBS & STATIONS (PULSING RADAR BEACONS)         */}
          {/* ========================================================= */}
          {HUBS.map((hub) => (
            <g key={hub.id} transform={`translate(${hub.x}, ${hub.y})`}>
              {/* Radar wave pulse expansion */}
              <circle r="22" fill="none" stroke={hub.color} strokeWidth="1.5" strokeOpacity="0.4">
                <animate attributeName="r" values="10;32;42" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.8;0.2;0" dur="3s" repeatCount="indefinite" />
              </circle>
              {/* Outer glowing halo ring */}
              <circle r="13" fill={hub.color} fillOpacity="0.25" stroke={hub.color} strokeWidth="1.5" />
              {/* Core jewel */}
              <circle r="6" fill="#ffffff" stroke={hub.color} strokeWidth="2.5" />

              {/* Hub Identification Callout */}
              {showHubTags && (
                <g>
                  <rect
                    x="-42"
                    y="-30"
                    width="84"
                    height="18"
                    rx="5"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke={hub.color}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="-18"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="900"
                    letterSpacing="0.8"
                    fontFamily="monospace"
                  >
                    {hub.code}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* ========================================================= */}
          {/* MOVING VEHICLES & DYNAMIC PATH LIGHT CONES & TRAILS       */}
          {/* ========================================================= */}
          {filteredVehicles.map((v) => {
            const pos = carPositions[v.id];
            if (!pos) return null;
            const isSelected = selectedVehicleId === v.id;
            const beamDist = headlightMode === 'high' ? 120 : 75;

            return (
              <g
                key={v.id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.angle})`}
                onClick={() => setSelectedVehicleId(v.id)}
                className="cursor-pointer transition-transform duration-75 group"
              >
                {/* 1. DYNAMIC FORWARD PATH LIGHT BEAMS (HEADLIGHT ILLUMINATION) */}
                {headlightMode !== 'off' && (
                  <g pointerEvents="none">
                    {/* Road Surface Illuminated Ground Light Pool (Where beam strikes asphalt) */}
                    <ellipse
                      cx={v.length / 2 + beamDist * 0.65}
                      cy="0"
                      rx={beamDist * 0.45}
                      ry={28}
                      fill="url(#asphaltGroundLightGrad)"
                    />

                    {/* Wide Volumetric Headlight Cones projecting forward */}
                    <polygon
                      points={`${v.length / 2 - 2}, -5  ${v.length / 2 + beamDist}, -36  ${v.length / 2 + beamDist}, 36  ${v.length / 2 - 2}, 5`}
                      fill="url(#headlightBeamGrad)"
                    />

                    {/* High-Intensity Inner Focus Beam */}
                    <polygon
                      points={`${v.length / 2}, -2  ${v.length / 2 + beamDist * 1.15}, -14  ${v.length / 2 + beamDist * 1.15}, 14  ${v.length / 2}, 2`}
                      fill="url(#headlightBeamGrad)"
                      opacity={headlightMode === 'high' ? '0.8' : '0.4'}
                    />

                    {/* High-Intensity Dual LED Bulbs on front bumper */}
                    <circle cx={v.length / 2} cy="-4" r="2.5" fill="#ffffff" filter="url(#routeGlow)" />
                    <circle cx={v.length / 2} cy="4" r="2.5" fill="#ffffff" filter="url(#routeGlow)" />
                  </g>
                )}

                {/* 2. DYNAMIC RED TAILLIGHT AFTERGLOW (Velocity streak) */}
                <g pointerEvents="none">
                  <polygon
                    points={`${-v.length / 2}, -6  ${-v.length / 2 - 40}, -15  ${-v.length / 2 - 40}, 15  ${-v.length / 2}, 6`}
                    fill="url(#taillightTrailGrad)"
                    opacity="0.8"
                  />
                  {/* Glowing Red Tail Bulbs */}
                  <circle cx={-v.length / 2} cy="-4.5" r="2.2" fill="#ef4444" filter="url(#routeGlow)" />
                  <circle cx={-v.length / 2} cy="4.5" r="2.2" fill="#ef4444" filter="url(#routeGlow)" />
                </g>

                {/* 3. TARGETING RETICLE FOR SELECTED VEHICLE */}
                {isSelected && (
                  <g pointerEvents="none">
                    <circle
                      r={v.length * 0.95}
                      fill="none"
                      stroke={v.accentColor}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to="360"
                        dur="6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle r={v.length * 1.2} fill="none" stroke={v.accentColor} strokeWidth="0.8" opacity="0.4" />
                    {/* Crosshair marks */}
                    <line x1={-v.length * 1.3} y1="0" x2={-v.length * 1.1} y2="0" stroke={v.accentColor} strokeWidth="1.5" />
                    <line x1={v.length * 1.1} y1="0" x2={v.length * 1.3} y2="0" stroke={v.accentColor} strokeWidth="1.5" />
                    <line x1="0" y1={-v.length * 1.3} x2="0" y2={-v.length * 1.1} stroke={v.accentColor} strokeWidth="1.5" />
                    <line x1="0" y1={v.length * 1.1} x2="0" y2={v.length * 1.3} stroke={v.accentColor} strokeWidth="1.5" />
                  </g>
                )}

                {/* 4. HIGH-FIDELITY AUTOMOTIVE CHASSIS */}
                {renderCarChassis(v, isSelected)}

                {/* 5. CALLOUT HUD CHIP (FLOATING ABOVE CAR) */}
                <g transform="translate(0, -25) rotate(-90)">
                  <rect
                    x="-26"
                    y="-9"
                    width="52"
                    height="18"
                    rx="4"
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke={v.accentColor}
                    strokeWidth={isSelected ? '1.5' : '1'}
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {v.category}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* ========================================================= */}
        {/* INTERACTIVE TELEMATICS HUD CARDS (FLOATING OVERLAYS)     */}
        {/* ========================================================= */}

        {/* Selected Vehicle Telematics Inspector Card (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 max-w-[calc(100%-24px)] sm:max-w-sm w-full bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl z-20">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 rounded-xl bg-slate-800/90 border border-slate-700 overflow-hidden flex items-center justify-center p-1 shrink-0">
                <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-white">{selectedVehicle.name}</h4>
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold"
                    style={{
                      backgroundColor: `${selectedVehicle.accentColor}25`,
                      color: selectedVehicle.accentColor,
                      border: `1px solid ${selectedVehicle.accentColor}50`,
                    }}
                  >
                    {selectedVehicle.category}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedVehicle.plate}</div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {selectedVehicle.status}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">ETA: {selectedVehicle.etaMinutes}m</span>
            </div>
          </div>

          {/* Real-time Telemetry Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Gauge className="w-3 h-3 text-brand-400" />
                Live Speed
              </div>
              <div className="text-sm font-black text-white font-mono mt-0.5">
                {selectedPos?.currentSpeed || selectedVehicle.speed}{' '}
                <span className="text-[9px] font-normal text-slate-400">km/h</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <Fuel className="w-3 h-3 text-emerald-400" />
                Fuel Level
              </div>
              <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                {selectedVehicle.fuel}%
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                L2 Radar
              </div>
              <div className="text-xs font-bold text-sky-400 font-mono mt-1">LOCKED</div>
            </div>
          </div>

          {/* Mission & Route Ticker */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Driver:</span>
              <span className="font-semibold text-slate-200 truncate max-w-[190px]">{selectedVehicle.driver}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Route Corridor:</span>
              <span className="font-semibold text-emerald-400 truncate max-w-[190px]">{selectedVehicle.mission}</span>
            </div>
          </div>

          {/* Quick Vehicle Selector Chips */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mt-3 pt-2 border-t border-slate-800/80">
            {VEHICLES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVehicleId(v.id)}
                className={`py-1 px-1 rounded-md text-[9px] font-mono font-bold truncate transition-all text-center ${
                  selectedVehicleId === v.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={`${v.name} (${v.plate})`}
              >
                {v.category.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Top-Right Mission Radar & Telemetry Stats Card */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 shadow-xl hidden sm:block max-w-xs z-20">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-brand-400 animate-spin-slow" />
              <span>Real-Time Fleet Grid</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">0 Overlaps</span>
          </div>

          <div className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Active Vehicles in Motion:</span>
              <span className="font-bold text-white font-mono">6 / 6 Dispatched</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Path Light Illumination:</span>
              <span className="font-bold text-emerald-400 font-mono">Dual Projector LED</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Addis Ababa Telemetry:</span>
              <span className="font-bold text-white font-mono">9°01'N 38°47'E</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM QUICK METRIC PILLS                                */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-800 bg-slate-900/90 text-white border-t border-slate-800">
        <div className="p-4 text-center">
          <div className="text-2xl font-black text-brand-400 font-mono">6</div>
          <div className="text-xs text-slate-400 mt-0.5">Corporate Vehicles in Motion</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
          <div className="text-xs text-slate-400 mt-0.5">Conflict Prevention Engine</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-black text-amber-400 font-mono">3-Step</div>
          <div className="text-xs text-slate-400 mt-0.5">Guided Request Workflow</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-2xl font-black text-indigo-400 font-mono">UTC+3</div>
          <div className="text-xs text-slate-400 mt-0.5">Addis Ababa Operational Clock</div>
        </div>
      </div>
    </div>
  );
};
