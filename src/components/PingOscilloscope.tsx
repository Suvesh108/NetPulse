import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
          await fetch('https://speed.cloudflare.com/__down?bytes=0', { cache: 'no-store' });
          const latency = Math.round(performance.now() - start);
          
          setCurrentPing(latency);
          setMinPing(prev => Math.min(prev, latency));
          setMaxPing(prev => Math.max(prev, latency));
          setTotalSamples(prev => prev + 1);

          setPingHistory(prev => {
            const next = [...prev, latency];
            if (next.length > 25) next.shift();
            
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

  const stabilityPct = totalSamples > 0 
    ? Math.max(0, 100 - (packetDrops / totalSamples) * 100 - ((currentJitter || 0) * 1.5)).toFixed(1)
    : '100.0';

  const width = 500;
  const height = 90;
  const padding = 6;
  const maxScale = Math.max(60, maxPing + 10);

  const points = pingHistory.map((val, idx) => {
    const x = padding + (idx / Math.max(1, pingHistory.length - 1)) * (width - padding * 2);
    const y = height - padding - (val / maxScale) * (height - padding * 2);
    return { x, y, val };
  });

  const pathD = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` 
    : `M ${padding},${height / 2} L ${width - padding},${height / 2}`;

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06] gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            Continuous Ping Oscilloscope
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            Live Stream
          </span>
        </div>

        <button
          type="button"
          onClick={isRunning ? stopMonitoring : startMonitoring}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            isRunning 
              ? 'bg-rose-500 hover:bg-rose-600 text-white' 
              : 'hud-subpanel hover:bg-slate-100 dark:hover:bg-white/[0.08]'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP STREAM</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current text-emerald-500" />
              <span>START MONITOR</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono min-w-0">
        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">LIVE RTT</span>
          <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {currentPing !== null ? `${currentPing} ms` : '--'}
          </span>
        </div>
        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">JITTER DRIFT</span>
          <span className="text-lg font-bold text-amber-500 tabular-nums">
            {currentJitter !== null ? `±${currentJitter} ms` : '--'}
          </span>
        </div>
        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">PEAK SPIKE</span>
          <span className="text-lg font-bold text-rose-500 tabular-nums">
            {maxPing > 0 ? `${maxPing} ms` : '--'}
          </span>
        </div>
        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">STABILITY</span>
          <span className="text-lg font-bold text-emerald-500 tabular-nums">
            {totalSamples > 0 ? `${stabilityPct}%` : '100%'}
          </span>
        </div>
      </div>

      {/* Oscilloscope Canvas Viewport (Zero Overflow) */}
      <div className="w-full h-24 rounded-xl hud-subpanel p-2 flex flex-col justify-between relative overflow-hidden">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
          <div className="border-b border-dashed border-slate-400 dark:border-white w-full"></div>
          <div className="border-b border-dashed border-slate-400 dark:border-white w-full"></div>
          <div className="border-b border-dashed border-slate-400 dark:border-white w-full"></div>
        </div>

        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          preserveAspectRatio="none" 
          className="w-full h-full relative z-10"
        >
          <path
            d={pathD}
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx === points.length - 1 ? 3.5 : 2}
              fill="#10B981"
              stroke="#FFFFFF"
              strokeWidth={idx === points.length - 1 ? 1.5 : 0}
            />
          ))}
        </svg>

        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-zinc-500 relative z-10 pt-1">
          <span>{totalSamples} Samples logged</span>
          <span>{packetDrops} Dropped</span>
        </div>
      </div>

    </div>
  );
}
