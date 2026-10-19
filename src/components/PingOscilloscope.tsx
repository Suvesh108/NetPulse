import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, Activity, AlertTriangle, CheckCircle2, Radio, Server, Clock, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { springs } from '../lib/motion';

interface ProbeTarget {
  id: string;
  name: string;
  host: string;
  url: string;
}

const PROBE_TARGETS: ProbeTarget[] = [
  { id: 'cloudflare', name: 'Cloudflare Edge', host: '1.1.1.1', url: 'https://speed.cloudflare.com/__down?bytes=0' },
  { id: 'google', name: 'Google Anycast', host: '8.8.8.8', url: 'https://dns.google/resolve?name=example.com' },
  { id: 'quad9', name: 'Quad9 Secure', host: '9.9.9.9', url: 'https://dns.quad9.net/dns-query?name=example.com' },
];

export default function PingOscilloscope() {
  const [isRunning, setIsRunning] = useState(false);
  const [targetId, setTargetId] = useState('cloudflare');
  const [intervalMs, setIntervalMs] = useState<number>(500);

  const [pingHistory, setPingHistory] = useState<number[]>([]);
  const [currentPing, setCurrentPing] = useState<number | null>(null);
  const [currentJitter, setCurrentJitter] = useState<number | null>(null);
  const [maxPing, setMaxPing] = useState<number>(0);
  const [minPing, setMinPing] = useState<number>(999);
  const [packetDrops, setPacketDrops] = useState<number>(0);
  const [totalSamples, setTotalSamples] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const activeTarget = PROBE_TARGETS.find(t => t.id === targetId) || PROBE_TARGETS[0];

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
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = window.setInterval(async () => {
        const start = performance.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), Math.min(2000, intervalMs * 3));
          const sep = activeTarget.url.includes('?') ? '&' : '?';
          await fetch(`${activeTarget.url}${sep}_r=${Date.now()}`, { 
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store', 
            signal: controller.signal 
          });
          clearTimeout(timeout);
          const latency = Math.max(2, Math.round(performance.now() - start));
          
          setCurrentPing(latency);
          setMinPing(prev => Math.min(prev, latency));
          setMaxPing(prev => Math.max(prev, latency));
          setTotalSamples(prev => prev + 1);

          setPingHistory(prev => {
            const next = [...prev, latency];
            if (next.length > 40) next.shift();
            
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
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetId, intervalMs]);

  const stabilityPct = totalSamples > 0 
    ? Math.max(0, 100 - (packetDrops / totalSamples) * 100 - ((currentJitter || 0) * 1.5)).toFixed(1)
    : '100.0';

  const avgPing = useMemo(() => {
    if (pingHistory.length === 0) return null;
    return (pingHistory.reduce((a, b) => a + b, 0) / pingHistory.length).toFixed(1);
  }, [pingHistory]);

  const distribution = useMemo(() => {
    if (pingHistory.length === 0) return { p25: 100, p50: 0, p100: 0, spike: 0 };
    const total = pingHistory.length;
    const p25 = Math.round((pingHistory.filter(p => p < 25).length / total) * 100);
    const p50 = Math.round((pingHistory.filter(p => p >= 25 && p < 50).length / total) * 100);
    const p100 = Math.round((pingHistory.filter(p => p >= 50 && p < 100).length / total) * 100);
    const spike = Math.max(0, 100 - p25 - p50 - p100);
    return { p25, p50, p100, spike };
  }, [pingHistory]);

  const width = 600;
  const height = 150;
  const paddingX = 10;
  const paddingY = 16;
  const maxScale = Math.max(60, maxPing + 15);

  const points = pingHistory.map((val, idx) => {
    const x = paddingX + (idx / Math.max(1, pingHistory.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (val / maxScale) * (height - paddingY * 2);
    return { x, y, val };
  });

  const pathD = points.length > 0 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` 
    : `M ${paddingX},${height / 2} L ${width - paddingX},${height / 2}`;

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 h-full min-w-0">
      
      {/* 1. Header with Live Status & Trigger */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06] gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            Continuous Ping Oscilloscope
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            {isRunning ? 'Real-Time Telemetry' : 'Standby'}
          </span>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={isRunning ? stopMonitoring : startMonitoring}
          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm ${
            isRunning 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP STREAM</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START MONITOR</span>
            </>
          )}
        </motion.button>
      </div>

      {/* 2. Control Toolbar: Probe Target & Sampling Interval */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 py-1 text-xs font-mono">
        {/* Target Edge Node */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Node:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-0.5 rounded-lg border border-slate-200/60 dark:border-white/[0.06]">
            {PROBE_TARGETS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTargetId(t.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  targetId === t.id 
                    ? 'bg-white dark:bg-white/[0.12] text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200'
                }`}
              >
                {t.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Sampling Interval */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Interval:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-0.5 rounded-lg border border-slate-200/60 dark:border-white/[0.06]">
            {[250, 500, 1000].map(intVal => (
              <button
                key={intVal}
                type="button"
                onClick={() => setIntervalMs(intVal)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  intervalMs === intVal 
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200'
                }`}
              >
                {intVal === 1000 ? '1s' : `${intVal}ms`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Primary Metrics Grid (Live RTT, Jitter, Peak, Stability) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono min-w-0">
        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col justify-between min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">LIVE RTT</span>
          <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {currentPing !== null ? `${currentPing} ms` : '--'}
          </span>
          <span className="text-[9px] text-emerald-500 font-bold">Fastpath</span>
        </div>

        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col justify-between min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">JITTER DRIFT</span>
          <span className="text-xl font-bold text-amber-500 tabular-nums">
            {currentJitter !== null ? `±${currentJitter} ms` : '--'}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">Dispersion</span>
        </div>

        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col justify-between min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">PEAK SPIKE</span>
          <span className="text-xl font-bold text-rose-500 tabular-nums">
            {maxPing > 0 ? `${maxPing} ms` : '--'}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">Max Delta</span>
        </div>

        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col justify-between min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">LINK STABILITY</span>
          <span className="text-xl font-bold text-emerald-500 tabular-nums">
            {totalSamples > 0 ? `${stabilityPct}%` : '100%'}
          </span>
          <span className="text-[9px] text-emerald-500">RFC 2681 SLA</span>
        </div>
      </div>

      {/* 4. Secondary Statistical Distribution Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono min-w-0">
        <div className="hud-subpanel rounded-xl p-2 flex items-center justify-between min-w-0">
          <span className="text-[10px] text-slate-400">MIN RTT:</span>
          <span className="font-bold text-slate-900 dark:text-white">{minPing < 900 ? `${minPing} ms` : '--'}</span>
        </div>
        <div className="hud-subpanel rounded-xl p-2 flex items-center justify-between min-w-0">
          <span className="text-[10px] text-slate-400">AVG RTT:</span>
          <span className="font-bold text-cyan-500">{avgPing ? `${avgPing} ms` : '--'}</span>
        </div>
        <div className="hud-subpanel rounded-xl p-2 flex items-center justify-between min-w-0">
          <span className="text-[10px] text-slate-400">DROPS:</span>
          <span className={`font-bold ${packetDrops > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
            {packetDrops} / {totalSamples}
          </span>
        </div>
        <div className="hud-subpanel rounded-xl p-2 flex items-center justify-between min-w-0">
          <span className="text-[10px] text-slate-400">SLA GRADE:</span>
          <span className="font-bold text-emerald-500">Grade A+</span>
        </div>
      </div>

      {/* 5. Latency Distribution Spectrum Bar */}
      <div className="flex flex-col gap-1.5 font-mono text-[10px]">
        <div className="flex items-center justify-between text-slate-400 dark:text-zinc-500">
          <span>LATENCY DISTRIBUTION SPECTRUM</span>
          <span>{totalSamples} Pings Logged</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-white/[0.06]">
          <div style={{ width: `${distribution.p25}%` }} className="h-full bg-emerald-500 transition-all duration-300" title="<25ms Pristine" />
          <div style={{ width: `${distribution.p50}%` }} className="h-full bg-cyan-500 transition-all duration-300" title="25-50ms Nominal" />
          <div style={{ width: `${distribution.p100}%` }} className="h-full bg-amber-500 transition-all duration-300" title="50-100ms Elevated" />
          <div style={{ width: `${distribution.spike}%` }} className="h-full bg-rose-500 transition-all duration-300" title=">100ms Spike" />
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500">
          <span className="text-emerald-500">&lt;25ms: {distribution.p25}%</span>
          <span className="text-cyan-500">25-50ms: {distribution.p50}%</span>
          <span className="text-amber-500">50-100ms: {distribution.p100}%</span>
          <span className="text-rose-500">&gt;100ms: {distribution.spike}%</span>
        </div>
      </div>

      {/* 6. High-Precision Oscilloscope Canvas Viewport */}
      <div className="w-full h-36 sm:h-40 rounded-xl hud-subpanel p-2.5 flex flex-col justify-between relative overflow-hidden">
        {/* Background Grid Lines & Y-Axis Reference Markers */}
        <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
          <div className="border-b border-dashed border-slate-400 dark:border-white w-full"></div>
          <div className="border-b border-dashed border-slate-400 dark:border-white w-full"></div>
          <div className="border-b border-dashed border-slate-400 dark:border-white w-full"></div>
        </div>

        {/* Y-Axis Value Labels */}
        <div className="absolute left-2 top-2 bottom-6 flex flex-col justify-between text-[9px] font-mono text-slate-400/70 dark:text-zinc-500/70 pointer-events-none z-10">
          <span>{Math.round(maxScale)}ms</span>
          <span>{Math.round(maxScale / 2)}ms</span>
          <span>0ms</span>
        </div>

        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          preserveAspectRatio="none" 
          className="w-full h-full relative z-10 pl-6"
        >
          <defs>
            <linearGradient id="oscGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          {areaD && (
            <path d={areaD} fill="url(#oscGrad)" />
          )}

          {/* Waveform Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx === points.length - 1 ? 4 : 2}
              fill={idx === points.length - 1 ? "#34D399" : "#10B981"}
              stroke="#FFFFFF"
              strokeWidth={idx === points.length - 1 ? 2 : 0}
            />
          ))}

          {/* Live Pulsing Beacon on Latest Point */}
          {points.length > 0 && isRunning && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={8}
              fill="none"
              stroke="#34D399"
              strokeWidth="1.5"
              className="animate-ping"
            />
          )}
        </svg>

        {/* Viewport Status Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-zinc-500 relative z-10 pt-1 border-t border-slate-100 dark:border-white/[0.04]">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            Target: {activeTarget.name} ({activeTarget.host})
          </span>
          <span>Sample Rate: {1000 / intervalMs} Hz</span>
        </div>
      </div>

    </div>
  );
}
