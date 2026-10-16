import React from 'react';
import { ArrowDown, Radio, ShieldCheck, Zap } from 'lucide-react';

interface HighwaySectionConnectorProps {
  stationNumber: string;
  stationName: string;
  targetId: string;
  distanceKm: string;
  statusText?: string;
}

export const HighwaySectionConnector: React.FC<HighwaySectionConnectorProps> = ({
  stationNumber,
  stationName,
  targetId,
  distanceKm,
  statusText = 'HIGHWAY LANE OPTIMAL',
}) => {
  return (
    <div className="relative w-full py-8 sm:py-12 flex flex-col items-center justify-center overflow-hidden pointer-events-auto">
      {/* Central Roadway Ribbon Running Downward */}
      <div className="relative w-full max-w-4xl h-24 sm:h-28 flex items-center justify-center">
        {/* Highway Asphalt Surface */}
        <div className="relative w-48 sm:w-64 h-full bg-gradient-to-b from-[#0b1220] via-[#080d17] to-[#040810] border-x-2 border-slate-700/80 rounded-lg shadow-2xl flex flex-col items-center justify-between py-2 overflow-hidden">
          {/* Animated Road Center Dashes */}
          <div className="absolute inset-y-0 w-1 border-r-2 border-dashed border-amber-400/80 anim-road-dash" />

          {/* Road Markings: Directional Flow Chevrons */}
          <div className="flex flex-col items-center gap-3 text-amber-400/30 text-xs font-mono font-bold">
            <span>▼</span>
            <span>▼</span>
            <span>▼</span>
          </div>

          {/* Passing Car Light Streak (Dynamic highway motion) */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none opacity-80">
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-transparent via-sky-400 to-white shadow-sm shadow-sky-400" />
            <div className="w-12 h-1 rounded-full bg-gradient-to-r from-red-500 to-transparent shadow-sm shadow-red-500" />
          </div>
        </div>

        {/* Overhead Digital Highway Gantry Sign */}
        <div className="absolute z-20 top-1/2 -translate-y-1/2 px-4 sm:px-6 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl flex items-center gap-3 text-xs">
          <div className="w-7 h-7 rounded-xl bg-brand-600 text-white font-black font-mono flex items-center justify-center text-xs shadow-md shadow-brand-500/30">
            {stationNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 font-bold">{distanceKm}</span>
              <span className="text-slate-500">•</span>
              <span className="font-bold text-white tracking-wide">{stationName}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{statusText}</span>
            </div>
          </div>

          <a
            href={`#${targetId}`}
            className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={`Continue down to ${stationName}`}
            aria-label={`Continue down to ${stationName}`}
          >
            <ArrowDown className="w-4 h-4 text-brand-400 animate-bounce" />
          </a>
        </div>
      </div>
    </div>
  );
};
