import React, { useState, useEffect, useRef } from 'react';
import { Activity, Play, Square, RotateCcw, AlertTriangle, CheckCircle2, Globe, Server, ShieldCheck, Zap } from 'lucide-react';

interface MtrTarget {
  id: string;
  name: string;
  ip: string;
  url: string;
  color: string;
  history: number[];
  sent: number;
  lost: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  jitter: number | null;
  current: number | null;
}

const INITIAL_TARGETS: MtrTarget[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare Anycast Fabric',
    ip: '1.1.1.1',
    url: 'https://1.1.1.1/cdn-cgi/trace',
    color: '#00D2FF',
    history: [],
    sent: 0,
    lost: 0,
    min: null,
    max: null,
    avg: null,
    jitter: null,
    current: null,
  },
  {
    id: 'google',
    name: 'Google Edge Backbone',
    ip: '8.8.8.8',
    url: 'https://dns.google/resolve?name=google.com&type=A',
    color: '#10B981',
    history: [],
    sent: 0,
    lost: 0,
    min: null,
    max: null,
    avg: null,
    jitter: null,
    current: null,
  },
  {
    id: 'quad9',
    name: 'Quad9 Security Edge',
    ip: '9.9.9.9',
    url: 'https://dns.quad9.net/dns-query?name=quad9.net&type=A',
    color: '#A855F7',
    history: [],
    sent: 0,
    lost: 0,
    min: null,
    max: null,
    avg: null,
    jitter: null,
    current: null,
  },
  {
    id: 'aws',
    name: 'AWS CloudFront PoP',
    ip: 'Global Edge',
    url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    color: '#F59E0B',
    history: [],
    sent: 0,
    lost: 0,
    min: null,
    max: null,
    avg: null,
    jitter: null,
    current: null,
  },
];

export default function MtrPingMatrix() {
  const [isRunning, setIsRunning] = useState(false);
  const [targets, setTargets] = useState<MtrTarget[]>(INITIAL_TARGETS);
  const isRunningRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const probeTarget = async (target: MtrTarget): Promise<{ rtt: number | null }> => {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const res = await fetch(`${target.url}?_r=${Date.now()}_${Math.random()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const rtt = Math.max(2, Math.round(performance.now() - start));
      return { rtt };
    } catch {
      // Retry via GET fallback if HEAD was not accepted
      try {
        const start2 = performance.now();
        const res2 = await fetch(`${target.url}?_r=${Date.now()}_${Math.random()}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(1800),
        });
        const rtt2 = Math.max(2, Math.round(performance.now() - start2));
        return { rtt: rtt2 };
      } catch {
        return { rtt: null };
      }
    }
  };

  const executeRound = async () => {
    if (!isRunningRef.current) return;

    setTargets((prevTargets) => {
      // Trigger probe promises for each target concurrently
      Promise.all(prevTargets.map((t) => probeTarget(t))).then((results) => {
        if (!isRunningRef.current) return;

        setTargets((current) =>
          current.map((t, idx) => {
            const res = results[idx];
            const isLoss = res.rtt === null;
            const newSent = t.sent + 1;
            const newLost = isLoss ? t.lost + 1 : t.lost;
            
            const newHistory = res.rtt !== null 
              ? [...t.history.slice(-19), res.rtt] 
              : [...t.history.slice(-19), 0];

            const validHistory = newHistory.filter((v) => v > 0);
            const min = validHistory.length > 0 ? Math.min(...validHistory) : t.min;
            const max = validHistory.length > 0 ? Math.max(...validHistory) : t.max;
            const avg = validHistory.length > 0 
              ? Math.round(validHistory.reduce((a, b) => a + b, 0) / validHistory.length) 
              : t.avg;

            const jitter = validHistory.length > 1
              ? parseFloat(
                  (
                    validHistory
                      .slice(1)
                      .map((v, i) => Math.abs(v - validHistory[i]))
                      .reduce((a, b) => a + b, 0) /
                    (validHistory.length - 1)
                  ).toFixed(1)
                )
              : t.jitter;

            return {
              ...t,
              sent: newSent,
              lost: newLost,
              current: res.rtt,
              history: newHistory,
              min,
              max,
              avg,
              jitter,
            };
          })
        );
      });

      return prevTargets;
    });

    if (isRunningRef.current) {
      timerRef.current = window.setTimeout(executeRound, 1200);
    }
  };

  const toggleRun = () => {
    if (isRunning) {
      isRunningRef.current = false;
      setIsRunning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      isRunningRef.current = true;
      setIsRunning(true);
      executeRound();
    }
  };

  const resetMatrix = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTargets(INITIAL_TARGETS);
  };

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06] gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            Multi-Target MTR Live Matrix
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            PingPlotter RTT
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleRun}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>START MTR</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetMatrix}
            disabled={isRunning}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            title="Reset matrix counters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0 font-mono">
        {targets.map((t) => {
          const lossPct = t.sent > 0 ? ((t.lost / t.sent) * 100).toFixed(1) : '0.0';
          const maxVal = Math.max(...(t.history.filter((v) => v > 0).length ? t.history : [100]), 60);

          return (
            <div
              key={t.id}
              className="hud-subpanel rounded-xl p-3.5 flex flex-col justify-between gap-3 min-w-0"
            >
              {/* Top Row: Destination & Current Ping */}
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {t.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 pl-3.5">
                    {t.ip}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                      {t.current !== null ? t.current : '--'}
                    </span>
                    <span className="text-[10px] text-slate-400">ms</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold ${
                      Number(lossPct) > 0 ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    Loss: {lossPct}% ({t.lost}/{t.sent})
                  </span>
                </div>
              </div>

              {/* Sparkline Histogram Strip */}
              <div className="w-full h-9 bg-slate-100 dark:bg-black/20 rounded-lg p-1 flex items-end gap-0.5 overflow-hidden">
                {t.history.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 dark:text-zinc-600">
                    Awaiting MTR probes...
                  </div>
                ) : (
                  t.history.map((val, idx) => {
                    const isDrop = val === 0;
                    const heightPct = isDrop ? 100 : Math.max(10, Math.min(100, (val / maxVal) * 100));
                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-xs transition-all duration-200 ${
                          isDrop
                            ? 'bg-rose-500'
                            : val < 40
                            ? 'bg-emerald-500'
                            : val < 90
                            ? 'bg-cyan-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ height: `${heightPct}%` }}
                        title={isDrop ? 'Packet Dropped' : `${val}ms`}
                      />
                    );
                  })
                )}
              </div>

              {/* Bottom Telemetry Metrics Strip */}
              <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">MIN</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {t.min !== null ? `${t.min}ms` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">AVG</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {t.avg !== null ? `${t.avg}ms` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">MAX</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {t.max !== null ? `${t.max}ms` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block">JITTER</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {t.jitter !== null ? `±${t.jitter}` : '--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
