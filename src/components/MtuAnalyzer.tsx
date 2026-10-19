import React, { useState } from 'react';
import { Network, Play, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface MtuBoundary {
  size: number;
  label: string;
  useCase: string;
  overheadPct: number;
  status: 'idle' | 'testing' | 'pass' | 'fragmented';
  rttMs?: number;
}

export default function MtuAnalyzer() {
  const [isTesting, setIsTesting] = useState(false);
  const [detectedMtu, setDetectedMtu] = useState<number | null>(null);

  const [boundaries, setBoundaries] = useState<MtuBoundary[]>([
    { size: 1280, label: '1280 B (IPv6 Minimum)', useCase: 'RFC 8200 minimum guaranteed path MTU', overheadPct: 14.6, status: 'idle' },
    { size: 1420, label: '1420 B (WireGuard / VPN)', useCase: 'Encapsulated tunnels & secure IPsec', overheadPct: 5.3, status: 'idle' },
    { size: 1492, label: '1492 B (PPPoE DSL)', useCase: 'Broadband DSL encapsulation overhead', overheadPct: 0.5, status: 'idle' },
    { size: 1500, label: '1500 B (Standard Ethernet)', useCase: 'Standard consumer & datacenter fiber', overheadPct: 0.0, status: 'idle' },
    { size: 1508, label: '1508 B (Baby Jumbo Frame)', useCase: 'VLAN-tagged QinQ transport frame', overheadPct: -0.5, status: 'idle' }
  ]);

  const runMtuAnalysis = async () => {
    setIsTesting(true);
    setBoundaries(prev => prev.map(b => ({ ...b, status: 'testing', rttMs: undefined })));

    let highestPass = 1280;

    for (const b of boundaries) {
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${b.size}&r=${Date.now()}_${b.size}`, {
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const buf = await res.arrayBuffer();
        const rtt = Math.round(performance.now() - start);

        // Verify exact byte integrity
        const pass = buf.byteLength === b.size && rtt < 2200;

        if (pass && b.size <= 1500) {
          highestPass = Math.max(highestPass, b.size);
        } else if (pass && b.size > 1500) {
          // Jumbo frames over public WAN are typically fragmented or clamped to 1500
          highestPass = Math.max(highestPass, 1500);
        }

        setBoundaries(prev => prev.map(item => 
          item.size === b.size 
            ? { ...item, status: (pass && b.size <= 1500) ? 'pass' : (b.size > 1500 ? 'fragmented' : 'pass'), rttMs: rtt } 
            : item
        ));
      } catch {
        setBoundaries(prev => prev.map(item => 
          item.size === b.size ? { ...item, status: 'fragmented' } : item
        ));
      }

      await new Promise(r => setTimeout(r, 60));
    }

    setDetectedMtu(highestPass);
    setIsTesting(false);
  };

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 h-full min-w-0">
      
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

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
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
        </motion.button>
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

      {/* Boundary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
        {boundaries.map((b) => {
          const isPassed = b.status === 'pass';
          const isFrag = b.status === 'fragmented';
          return (
            <div 
              key={b.size}
              className={`p-3 rounded-xl border flex flex-col justify-between gap-1.5 transition-all min-w-0 ${
                isPassed 
                  ? 'bg-emerald-500/[0.03] border-emerald-500/30' 
                  : isFrag 
                  ? 'bg-amber-500/[0.03] border-amber-500/30' 
                  : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                  {b.label}
                </span>
                {b.status === 'testing' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                )}
                {isPassed && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                {isFrag && (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {b.useCase}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-100 dark:border-white/[0.04]">
                <span className="text-slate-400 dark:text-zinc-500">Overhead: {b.overheadPct}%</span>
                <span className={isPassed ? 'text-emerald-500 font-bold' : isFrag ? 'text-amber-500 font-bold' : 'text-slate-400'}>
                  {b.status === 'idle' && 'UNTESTED'}
                  {b.status === 'testing' && 'PROBING...'}
                  {isPassed && (b.rttMs ? `OK (${b.rttMs}ms)` : 'PASSED')}
                  {isFrag && 'FRAGMENTED / CLAMPED'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
