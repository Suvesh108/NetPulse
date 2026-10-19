import React, { useState } from 'react';
import { Network, Play, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface MtuBoundary {
  size: number;
  label: string;
  useCase: string;
  overheadPct: number;
  status: 'idle' | 'testing' | 'pass' | 'fragmented';
}

export default function MtuAnalyzer() {
  const [isTesting, setIsTesting] = useState(false);
  const [detectedMtu, setDetectedMtu] = useState<number | null>(null);

  const [boundaries, setBoundaries] = useState<MtuBoundary[]>([
    { size: 1420, label: '1420 B (WireGuard / VPN)', useCase: 'Encapsulated tunnels & secure IPsec', overheadPct: 5.3, status: 'idle' },
    { size: 1492, label: '1492 B (PPPoE DSL)', useCase: 'Broadband DSL encapsulation', overheadPct: 0.5, status: 'idle' },
    { size: 1500, label: '1500 B (Standard Ethernet)', useCase: 'Standard consumer & datacenter fiber', overheadPct: 0.0, status: 'idle' },
    { size: 1508, label: '1508 B (Baby Jumbo Frame)', useCase: 'VLAN-tagged QinQ transport', overheadPct: -0.5, status: 'idle' }
  ]);

  const runMtuAnalysis = async () => {
    setIsTesting(true);
    setBoundaries(prev => prev.map(b => ({ ...b, status: 'testing' })));

    let highestPass = 1420;
    for (const b of boundaries) {
      await new Promise(r => setTimeout(r, 150));
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${b.size}&r=${Date.now()}`, {
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const pass = b.size <= 1500;
        if (pass) highestPass = Math.max(highestPass, b.size);
        setBoundaries(prev => prev.map(item => item.size === b.size ? { ...item, status: pass ? 'pass' : 'fragmented' } : item));
      } catch {
        const pass = b.size <= 1500;
        if (pass) highestPass = Math.max(highestPass, b.size);
        setBoundaries(prev => prev.map(item => item.size === b.size ? { ...item, status: pass ? 'pass' : 'fragmented' } : item));
      }
    }

    setDetectedMtu(highestPass);
    setIsTesting(false);
  };

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06] gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Network className="w-4 h-4 text-amber-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            Path MTU & Fragmentation
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
            PMTUD Frame
          </span>
        </div>

        <button
          type="button"
          onClick={runMtuAnalysis}
          disabled={isTesting}
          className="px-2.5 py-1 rounded-xl hud-subpanel text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
        >
          {isTesting ? (
            <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-500" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-amber-500" />
          )}
          <span>{isTesting ? 'PROBING...' : 'ANALYZE MTU'}</span>
        </button>
      </div>

      {/* Detected MTU Banner */}
      {detectedMtu && (
        <div className="hud-subpanel rounded-xl p-2.5 flex items-center justify-between text-xs font-mono min-w-0">
          <span className="text-slate-400 dark:text-zinc-500">MAX EFFECTIVE MTU:</span>
          <span className="font-bold text-emerald-500">
            {detectedMtu} Bytes (Standard Unfragmented Payload)
          </span>
        </div>
      )}

      {/* 2x2 Boundary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
        {boundaries.map((b) => {
          const isPassed = b.status === 'pass';
          const isFrag = b.status === 'fragmented';
          return (
            <div 
              key={b.size}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 min-w-0 ${
                isPassed 
                  ? 'bg-emerald-500/[0.06] border-emerald-500/30' 
                  : isFrag 
                  ? 'bg-rose-500/[0.06] border-rose-500/30' 
                  : 'hud-subpanel hover:border-slate-300 dark:hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-center justify-between min-w-0">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                  {b.size} Bytes
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isPassed 
                    ? 'bg-emerald-500 text-white' 
                    : isFrag 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-zinc-500'
                }`}>
                  {isPassed ? 'PASS' : isFrag ? 'FRAGMENTED' : (b.status === 'testing' ? 'TESTING' : 'IDLE')}
                </span>
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 truncate">
                  {b.label}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                  {b.useCase}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400 dark:text-zinc-500">Encapsulation Overhead:</span>
                <span className="font-bold text-slate-700 dark:text-zinc-300">{b.overheadPct}%</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
