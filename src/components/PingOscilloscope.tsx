import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Play, Square, Activity, AlertTriangle, 
  CheckCircle2, Flame, ShieldAlert, Sparkles
} from 'lucide-react';

export default function PingOscilloscope() {
  const [isRunning, setIsRunning] = useState(false);
  const [pingHistory, setPingHistory] = useState<number[]>([]);
  const [currentPing, setCurrentPing] = useState<number | null>(null);
  const [currentJitter, setCurrentJitter] = useState<number | null>(null);
  const [maxPing, setMaxPing] = useState<number>(0);
  const [minPing, setMinPing] = useState<number>(999);
  const [packetDrops, setPacketDrops] = useState<number>(0);
  const [totalSamples, setTotalSamples] = useState<number>(0);

  const timerRef = useRef<number | null>(null);

  const startMonitoring = () => {
    setIsRunning(true);
    setPingHistory([]);
    setPacketDrops(0);
    setTotalSamples(0);
    setMaxPing(0);
    setMinPing(999);
  };

  const stopMonitoring = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(async () => {
        const start = performance.now();
        try {
          // Micro probe
          await fetch('https://speed.cloudflare.com/__down?bytes=0', { cache: 'no-store' });
          const latency = Math.round(performance.now() - start);
          
          setCurrentPing(latency);
          setMinPing(prev => Math.min(prev, latency));
          setMaxPing(prev => Math.max(prev, latency));
          setTotalSamples(prev => prev + 1);

          setPingHistory(prev => {
            const next = [...prev, latency];
            if (next.length > 25) next.shift();
            
            // Calc jitter
            if (next.length > 1) {
              const diffs = [];
              for (let i = 1; i < next.length; i++) {
                diffs.push(Math.abs(next[i] - next[i - 1]));
              }
              const avgJitter = +(diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1);
              setCurrentJitter(avgJitter);
            }
            return next;
          });

        } catch {
          setPacketDrops(prev => prev + 1);
          setTotalSamples(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Calculate Stability Grade
  const stabilityPct = totalSamples > 0 
    ? Math.max(0, 100 - (packetDrops / totalSamples) * 100 - ((currentJitter || 0) * 1.5)).toFixed(1)
    : '100.0';

  // SVG Waveform generator for oscilloscope
  const width = 500;
  const height = 100;
  const padding = 10;
  const maxScale = Math.max(80, maxPing + 10);

  const points = pingHistory.map((val, idx) => {
    const x = padding + (idx / Math.max(1, pingHistory.length - 1)) * (width - padding * 2);
    const y = height - padding - (val / maxScale) * (height - padding * 2);
    return { x, y, val };
  });

  const pathD = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` 
    : `M ${padding},${height / 2} L ${width - padding},${height / 2}`;

  return (
    <div className="bg-white dark:bg-[#0B1120] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Gamepad2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Live Gaming Latency Oscilloscope</h3>
            <span className="text-[9px] text-slate-400">Continuous ping stability & jitter spike monitor</span>
          </div>
        </div>

        <button
          onClick={isRunning ? stopMonitoring : startMonitoring}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
            isRunning 
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800 active:scale-95'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white active:scale-95'
          }`}
        >
          {isRunning ? <Square className="w-3 h-3 fill-rose-600" /> : <Play className="w-3 h-3 fill-white" />}
          <span>{isRunning ? 'Stop Monitor' : 'Start Monitor'}</span>
        </button>
      </div>

      {/* Main Oscilloscope Display */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2 relative overflow-hidden font-mono">
        
        {/* Top Indicators */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/80 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isRunning ? 'animate-ping' : ''}`}></span>
              {isRunning ? 'STREAMING ACTIVE' : 'STANDBY'}
            </span>
            <span>• Samples: {totalSamples}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Min: <b className="text-white">{minPing < 999 ? `${minPing}ms` : '--'}</b></span>
            <span>Max: <b className="text-amber-400">{maxPing > 0 ? `${maxPing}ms` : '--'}</b></span>
            <span>Jitter: <b className="text-purple-400">{currentJitter !== null ? `±${currentJitter}ms` : '--'}</b></span>
          </div>
        </div>

        {/* Live SVG Graph */}
        <div className="w-full h-24 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-rows-3 grid-cols-6 pointer-events-none opacity-20 border border-emerald-500/20">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="border-b border-r border-emerald-500/20"></div>
            ))}
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full relative z-10">
            <defs>
              <linearGradient id="oscGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {points.length > 1 && (
              <path 
                d={`${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`} 
                fill="url(#oscGrad)" 
              />
            )}

            <path 
              d={pathD} 
              fill="none" 
              stroke="#10B981" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />

            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#34D399" />
            ))}
          </svg>
        </div>

        {/* Bottom Stability Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
          <span className="text-slate-400">Competitive Gaming Stability:</span>
          <span className="font-bold text-emerald-400">{stabilityPct}% (Ultra-Low Jitter)</span>
        </div>
      </div>

    </div>
  );
}
