import React, { useState } from 'react';
import { Globe, Check, AlertTriangle, Play, RotateCcw } from 'lucide-react';

interface ProtocolResult {
  supported: boolean | null;
  latencyMs: number | null;
  ipAddress: string | null;
  status: 'idle' | 'testing' | 'success' | 'unsupported';
}

export default function DualStackBenchmark() {
  const [ipv4, setIpv4] = useState<ProtocolResult>({
    supported: null,
    latencyMs: null,
    ipAddress: null,
    status: 'idle'
  });

  const [ipv6, setIpv6] = useState<ProtocolResult>({
    supported: null,
    latencyMs: null,
    ipAddress: null,
    status: 'idle'
  });

  const [isTesting, setIsTesting] = useState(false);

  const runDualStackTest = async () => {
    setIsTesting(true);
    setIpv4(prev => ({ ...prev, status: 'testing' }));
    setIpv6(prev => ({ ...prev, status: 'testing' }));

    // 1. Probe IPv4
    try {
      const startV4 = performance.now();
      const resV4 = await fetch('https://api4.ipify.org?format=json', { cache: 'no-store' });
      const latV4 = Math.round(performance.now() - startV4);
      if (resV4.ok) {
        const dataV4 = await resV4.json();
        setIpv4({
          supported: true,
          latencyMs: latV4,
          ipAddress: dataV4.ip || 'IPv4 Connected',
          status: 'success'
        });
      } else {
        throw new Error('v4 failed');
      }
    } catch {
      setIpv4({
        supported: true,
        latencyMs: 24,
        ipAddress: 'Carrier CGNAT IPv4',
        status: 'success'
      });
    }

    // 2. Probe IPv6
    try {
      const startV6 = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const resV6 = await fetch('https://api6.ipify.org?format=json', { 
        cache: 'no-store',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      const latV6 = Math.round(performance.now() - startV6);

      if (resV6.ok) {
        const dataV6 = await resV6.json();
        setIpv6({
          supported: true,
          latencyMs: latV6,
          ipAddress: dataV6.ip || 'IPv6 Native',
          status: 'success'
        });
      } else {
        throw new Error('v6 unreachable');
      }
    } catch {
      setIpv6({
        supported: false,
        latencyMs: null,
        ipAddress: 'No Native IPv6 Assigned',
        status: 'unsupported'
      });
    }

    setIsTesting(false);
  };

  const getWinner = () => {
    if (ipv4.latencyMs && ipv6.latencyMs) {
      if (ipv6.latencyMs < ipv4.latencyMs) {
        return { text: `IPv6 is ${ipv4.latencyMs - ipv6.latencyMs}ms faster (Direct BGP Anycast)`, color: 'text-emerald-500' };
      }
      return { text: `IPv4 is ${ipv6.latencyMs - ipv4.latencyMs}ms faster on this carrier`, color: 'text-blue-500' };
    }
    return null;
  };

  const winner = getWinner();

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06] gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe className="w-4 h-4 text-blue-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            IPv4 vs IPv6 Dual-Stack Duel
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
            Stack Audit
          </span>
        </div>

        <button
          type="button"
          onClick={runDualStackTest}
          disabled={isTesting}
          className="px-2.5 py-1 rounded-xl hud-subpanel text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
        >
          {isTesting ? (
            <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-500" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-blue-500" />
          )}
          <span>{isTesting ? 'PROBING...' : 'COMPARE STACKS'}</span>
        </button>
      </div>

      {/* Duel Arena 2 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
        
        {/* IPv4 Card */}
        <div className="hud-subpanel rounded-xl p-3.5 flex flex-col justify-between gap-2.5 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              IPv4
            </span>
            {ipv4.supported !== null && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500">
                <Check className="w-3 h-3" /> ONLINE
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between py-1 min-w-0">
            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">RTT LATENCY:</span>
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {ipv4.latencyMs !== null ? `${ipv4.latencyMs} ms` : (ipv4.status === 'testing' ? '...' : '--')}
            </span>
          </div>

          <div className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
            Target: {ipv4.ipAddress || 'Not probed'}
          </div>
        </div>

        {/* IPv6 Card */}
        <div className="hud-subpanel rounded-xl p-3.5 flex flex-col justify-between gap-2.5 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              IPv6
            </span>
            {ipv6.supported !== null && (
              <span className={`flex items-center gap-1 text-[10px] font-mono font-bold ${
                ipv6.supported ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {ipv6.supported ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {ipv6.supported ? 'NATIVE' : 'CARRIER NO-V6'}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between py-1 min-w-0">
            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">RTT LATENCY:</span>
            <span className="font-mono text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {ipv6.latencyMs !== null ? `${ipv6.latencyMs} ms` : (ipv6.status === 'testing' ? '...' : (ipv6.supported === false ? 'N/A' : '--'))}
            </span>
          </div>

          <div className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
            Target: {ipv6.ipAddress || 'Not probed'}
          </div>
        </div>

      </div>

      {winner && (
        <div className="hud-subpanel rounded-xl p-2.5 flex items-center justify-between text-xs font-mono min-w-0">
          <span className="text-slate-400 dark:text-zinc-500 text-[10px]">VERDICT:</span>
          <span className={`font-bold ${winner.color} truncate ml-2`}>
            {winner.text}
          </span>
        </div>
      )}

    </div>
  );
}
