import React, { useState, useEffect } from 'react';
import { Gauge, Radio, Shield, Zap, Sparkles, Navigation } from 'lucide-react';

interface AutomotiveLoadingScreenProps {
  onFinish?: () => void;
  minDuration?: number; // In ms
}

export const AutomotiveLoadingScreen: React.FC<AutomotiveLoadingScreenProps> = ({
  onFinish,
  minDuration = 1800,
}) => {
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [gear, setGear] = useState('P');
  const [statusMessage, setStatusMessage] = useState('IGNITING CAPITAL FLEET CORE...');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    let animId: number;

    const updateProgress = (time: number) => {
      const elapsed = time - startTime;
      const rawProgress = Math.min(elapsed / minDuration, 1);

      // Smooth easeOutQuad progress
      const easedProgress = Math.min(100, Math.round((1 - Math.pow(1 - rawProgress, 2)) * 100));
      setProgress(easedProgress);

      // Calculate simulated speed (0 to 142 km/h)
      const currentSpeed = Math.round(rawProgress * 142);
      setSpeed(currentSpeed);

      // Dynamic gear simulation
      if (rawProgress < 0.15) {
        setGear('1');
        setStatusMessage('INITIALIZING ADDIS ABABA GPS GRID...');
      } else if (rawProgress < 0.4) {
        setGear('2');
        setStatusMessage('SYNCHRONIZING FLEET TELEMETRY & SENSORS...');
      } else if (rawProgress < 0.7) {
        setGear('3');
        setStatusMessage('CALIBRATING 0-CONFLICT ALLOCATION ENGINE...');
      } else if (rawProgress < 0.95) {
        setGear('4');
        setStatusMessage('HIGHWAY DISPATCH SYSTEMS READY...');
      } else {
        setGear('D');
        setStatusMessage('WELCOME TO CAPITAL FLEET');
      }

      if (rawProgress < 1) {
        animId = requestAnimationFrame(updateProgress);
      } else {
        // Complete loading
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onFinish?.();
          }, 450); // Fade transition duration
        }, 200);
      }
    };

    animId = requestAnimationFrame(updateProgress);

    // Hard fail-safe timeout so users never get trapped
    const safetyTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onFinish?.(), 450);
    }, minDuration + 1200);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(safetyTimer);
    };
  }, [minDuration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 text-white overflow-hidden select-none transition-opacity duration-500 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ── Background Cyber Ambient Glow & Stars ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(220,38,38,0.18),rgba(3,7,18,0.98))]" />

      {/* Top Header Branding */}
      <div className="w-full max-w-5xl px-6 pt-8 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-black text-white text-base shadow-lg shadow-brand-500/30">
            CF
          </div>
          <div>
            <div className="text-sm font-black tracking-wider text-white">CAPITAL FLEET</div>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM BOOT SEQUENCE
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
            GEAR <strong className="text-brand-400 font-bold ml-1">{gear}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
            UTC+3 ADDIS ABABA
          </span>
        </div>
      </div>

      {/* ── Central Cinematic Highway & Accelerating Vehicle ── */}
      <div className="relative w-full max-w-4xl flex-1 flex flex-col items-center justify-center px-4 my-2">
        {/* Perspective Highway Canvas (SVG) */}
        <div className="relative w-full aspect-[16/8] max-h-[380px] overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#050b17] via-[#091122] to-[#02050b] shadow-2xl">
          <svg
            viewBox="0 0 800 400"
            className="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Headlight Volumetric Beam */}
              <linearGradient id="loadHeadlight" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>

              {/* Road Horizon Fog */}
              <linearGradient id="horizonFog" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#050b17" stopOpacity="1" />
                <stop offset="40%" stopColor="#091122" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#02050b" stopOpacity="0" />
              </linearGradient>

              {/* Red Taillight Velocity Glow */}
              <radialGradient id="taillightGlow">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                <stop offset="50%" stopColor="#dc2626" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Distant Horizon Mountains & Sky */}
            <rect x="0" y="0" width="800" height="160" fill="url(#horizonFog)" />

            {/* Distant City Lights Skyline (Addis Ababa Towers Silhouette) */}
            <g fill="rgba(255, 255, 255, 0.15)">
              <rect x="220" y="110" width="18" height="40" rx="1" />
              <rect x="245" y="90" width="28" height="60" rx="1" />
              <rect x="280" y="125" width="22" height="25" rx="1" />
              <rect x="510" y="105" width="25" height="45" rx="1" />
              <rect x="540" y="85" width="35" height="65" rx="1" />
              <rect x="580" y="120" width="20" height="30" rx="1" />
            </g>

            {/* 3D Perspective Highway Asphalt */}
            {/* Perspective trapezoid representing road receding to horizon (vanishing point at 400, 150) */}
            <polygon
              points="380,150 420,150 720,400 80,400"
              fill="#0b1220"
              stroke="#1e293b"
              strokeWidth="2"
            />

            {/* Left & Right Highway Guardrails with Motion Reflectors */}
            <line x1="380" y1="150" x2="80" y2="400" stroke="#334155" strokeWidth="4" />
            <line x1="420" y1="150" x2="720" y2="400" stroke="#334155" strokeWidth="4" />
            {/* Guardrail Safety Glow Lines */}
            <line x1="380" y1="150" x2="80" y2="400" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="8 12" className="anim-road-dash-fast" />
            <line x1="420" y1="150" x2="720" y2="400" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="8 12" className="anim-road-dash-fast" />

            {/* Road Lane Center Dashes with Rapid Perspective Rushing Motion */}
            <g>
              <line
                x1="400"
                y1="150"
                x2="400"
                y2="400"
                stroke="#ffffff"
                strokeWidth="5"
                strokeDasharray="24 28"
                className="anim-road-dash-fast"
              />
              <line
                x1="400"
                y1="150"
                x2="400"
                y2="400"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="24 28"
                className="anim-road-dash-fast"
                opacity="0.7"
              />
            </g>

            {/* ── High-Speed Vehicle Driving Forward on Highway ── */}
            <g transform="translate(400, 290)" className="anim-car-shake">
              {/* Ground Shadow & Asphalt Contact */}
              <ellipse cx="0" cy="46" rx="95" ry="14" fill="rgba(0, 0, 0, 0.85)" />

              {/* Dual Forward Headlight Beams illuminating the road ahead */}
              <polygon
                points="-55,20 -180,-140 -20,-140 -35,20"
                fill="url(#loadHeadlight)"
              />
              <polygon
                points="35,20 20,-140 180,-140 55,20"
                fill="url(#loadHeadlight)"
              />

              {/* Rear Red Taillight Velocity Glow Pools */}
              <circle cx="-52" cy="22" r="28" fill="url(#taillightGlow)" />
              <circle cx="52" cy="22" r="28" fill="url(#taillightGlow)" />

              {/* 4 Wide Tires with tread */}
              {/* Rear Left Wheel */}
              <rect x="-82" y="16" width="22" height="34" rx="6" fill="#090d16" stroke="#334155" strokeWidth="1.5" />
              {/* Rear Right Wheel */}
              <rect x="60" y="16" width="22" height="34" rx="6" fill="#090d16" stroke="#334155" strokeWidth="1.5" />

              {/* Aerodynamic Vehicle Rear Body Chassis */}
              <rect
                x="-70"
                y="-15"
                width="140"
                height="48"
                rx="14"
                fill="#ffffff"
                stroke="#e2e8f0"
                strokeWidth="1.5"
              />

              {/* Cabin Roof / Windshield / Glass Hatch */}
              <path
                d="M -50 -15 L -36 -42 L 36 -42 L 50 -15 Z"
                fill="#0a0f1d"
                stroke="#38bdf8"
                strokeWidth="1.2"
              />

              {/* Rear High-Intensity LED Light Bar (Flagship Corporate Red) */}
              <rect x="-62" y="12" width="124" height="6" rx="3" fill="#dc2626" className="anim-taillight-streak" />
              <circle cx="-56" cy="15" r="4" fill="#ffffff" />
              <circle cx="56" cy="15" r="4" fill="#ffffff" />

              {/* License Plate */}
              <rect x="-24" y="18" width="48" height="14" rx="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
              <text x="0" y="28" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="monospace">
                ET-3-84912
              </text>

              {/* Dual Exhaust Pipes with Hot Glow */}
              <circle cx="-38" cy="34" r="3.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
              <circle cx="38" cy="34" r="3.5" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
            </g>

            {/* Speed Motion Lines on Sides */}
            <g stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" strokeDasharray="15 30" className="anim-road-dash-fast">
              <line x1="100" y1="360" x2="20" y2="400" />
              <line x1="160" y1="300" x2="60" y2="350" />
              <line x1="700" y1="360" x2="780" y2="400" />
              <line x1="640" y1="300" x2="740" y2="350" />
            </g>
          </svg>
        </div>

        {/* ── Real-Time Cockpit Telemetry HUD ── */}
        <div className="w-full max-w-2xl mt-6 px-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
                VELOCITY ACCELERATION
              </span>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                {speed}
              </span>
              <span className="text-xs font-mono text-brand-400 ml-1">KM/H</span>
            </div>
          </div>

          {/* High-Precision Automotive Progress Bar */}
          <div className="relative w-full h-3 bg-slate-900 rounded-full border border-slate-800 p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 via-emerald-500 to-brand-500 transition-all duration-100 ease-out shadow-sm shadow-brand-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Diagnostics Status Ticker */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-3">
            <div className="flex items-center gap-2 truncate max-w-[80%]">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span className="text-emerald-400 font-semibold">{statusMessage}</span>
            </div>
            <span className="font-bold text-white shrink-0">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Telemetry Strip */}
      <div className="w-full max-w-5xl px-6 pb-6 text-center text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-3 border-t border-slate-900 pt-4 z-20">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>CAPITAL REAL ESTATE FLEET ENCLAVE</span>
        </div>
        <div className="flex items-center gap-4">
          <span>LAT 9.01 N • LON 38.47 E</span>
          <span>ENTERPRISE LEVEL L2</span>
        </div>
      </div>
    </div>
  );
};
