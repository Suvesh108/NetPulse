import React, { useState } from 'react';
import { Server, Play, RotateCcw, Award } from 'lucide-react';

interface DnsResolver {
  id: string;
  name: string;
  primaryIp: string;
  dohEndpoint: string;
  provider: string;
  description: string;
  latencyMs: number | null;
  status: 'idle' | 'testing' | 'success' | 'failed';
  ipResolved?: string;
  dnssec?: boolean;
}

export default function DnsBenchmark() {
  const [resolvers, setResolvers] = useState<DnsResolver[]>([
    {
      id: 'cloudflare',
      name: 'Cloudflare 1.1.1.1',
      primaryIp: '1.1.1.1',
      dohEndpoint: 'https://cloudflare-dns.com/dns-query',
      provider: 'Cloudflare Anycast',
      description: 'Privacy-first, zero-logging recursive resolver',
      latencyMs: null,
      status: 'idle'
    },
    {
      id: 'google',
      name: 'Google Public DNS',
      primaryIp: '8.8.8.8',
      dohEndpoint: 'https://dns.google/resolve',
      provider: 'Google Edge Infrastructure',
      description: 'High-availability global anycast routing',
      latencyMs: null,
      status: 'idle'
    },
    {
      id: 'adguard',
      name: 'AdGuard Privacy DNS',
      primaryIp: '94.140.14.14',
      dohEndpoint: 'https://dns.adguard-dns.com/resolve',
      provider: 'AdGuard Security Fabric',
      description: 'Encrypted DoH with ad-tracker and threat blocking',
      latencyMs: null,
      status: 'idle'
    },
    {
      id: 'quad9',
      name: 'Quad9 DNS Alliance',
      primaryIp: '9.9.9.9',
      dohEndpoint: 'https://dns.quad9.net/dns-query',
      provider: 'Quad9 Security Alliance',
      description: 'Global non-profit threat protection resolver',
      latencyMs: null,
      status: 'idle'
    }
  ]);

  const [isTesting, setIsTesting] = useState(false);
  const [fastestId, setFastestId] = useState<string | null>(null);

  const runBenchmark = async () => {
    setIsTesting(true);
    setFastestId(null);
    setResolvers(prev => prev.map(r => ({ ...r, latencyMs: null, status: 'testing', dnssec: false })));

    const testDomain = 'wikipedia.org';
    const updatedResolvers: DnsResolver[] = [];

    for (const resolver of resolvers) {
      try {
        const start = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const url = `${resolver.dohEndpoint}?name=${testDomain}&type=A`;
        const res = await fetch(url, {
          headers: { 'Accept': 'application/dns-json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const duration = Math.round(performance.now() - start);

        if (res.ok) {
          const data = await res.json();
          const ipResolved = data.Answer?.[0]?.data || '103.102.166.224';
          const isDnssec = !!(data.AD || (data.Answer && data.Answer.some((a: any) => a.type === 46)));
          const updated = {
            ...resolver,
            latencyMs: duration,
            status: 'success' as const,
            ipResolved,
            dnssec: isDnssec
          };
          updatedResolvers.push(updated);
          setResolvers(prev => prev.map(r => r.id === resolver.id ? updated : r));
        } else {
          throw new Error('Non-200');
        }
      } catch {
        const failed = {
          ...resolver,
          latencyMs: null,
          status: 'failed' as const
        };
        updatedResolvers.push(failed);
        setResolvers(prev => prev.map(r => r.id === resolver.id ? failed : r));
      }

      await new Promise(r => setTimeout(r, 60));
    }

    const successful = updatedResolvers.filter(r => r.latencyMs !== null);
    if (successful.length > 0) {
      successful.sort((a, b) => (a.latencyMs || 999) - (b.latencyMs || 999));
      setFastestId(successful[0].id);
    }

    setIsTesting(false);
  };

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-white/[0.06] min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Server className="w-4 h-4 text-blue-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            DNS Resolver Shootout
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
            DoH Query
          </span>
        </div>

        <button
          type="button"
          onClick={runBenchmark}
          disabled={isTesting}
          className="px-2.5 py-1 rounded-xl hud-subpanel text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
        >
          {isTesting ? (
            <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-500" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-blue-500" />
          )}
          <span>{isTesting ? 'QUERYING...' : 'RUN SHOOTOUT'}</span>
        </button>
      </div>

      {/* Resolvers Grid (2x2 Balanced for Subcolumn) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 min-w-0">
        {resolvers.map((r) => {
          const isWinner = fastestId === r.id;
          return (
            <div 
              key={r.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 min-w-0 ${
                isWinner 
                  ? 'bg-emerald-500/[0.08] border-emerald-500/40 shadow-xs' 
                  : 'hud-subpanel hover:border-slate-300 dark:hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-center justify-between min-w-0">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                  {r.primaryIp}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {r.dnssec && (
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                      DNSSEC
                    </span>
                  )}
                  {isWinner && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white flex items-center gap-0.5 shadow-xs">
                      <Award className="w-2.5 h-2.5" />
                      <span>FASTEST</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 truncate">
                  {r.name}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                  {r.provider}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 dark:text-zinc-500 text-[10px]">Lookup RTT:</span>
                <span className={`font-black ${
                  r.latencyMs !== null 
                    ? (isWinner ? 'text-emerald-500 font-bold' : 'text-slate-900 dark:text-white')
                    : 'text-slate-400 dark:text-zinc-500'
                }`}>
                  {r.latencyMs !== null ? `${r.latencyMs} ms` : (r.status === 'testing' ? '...' : '--')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
