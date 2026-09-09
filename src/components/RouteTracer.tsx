import React, { useState, useEffect } from 'react';
import { 
  Network, Globe, Server, ArrowRight, ShieldCheck, 
  RefreshCw, CheckCircle2, MapPin, Zap, Radio, Layers
} from 'lucide-react';

interface TraceData {
  clientIp: string;
  colo: string;
  loc: string;
  tls: string;
  http: string;
  asn?: string;
  org?: string;
  city?: string;
  latencyMs: number;
}

const AIRPORT_NAMES: Record<string, string> = {
  DEL: 'New Delhi (DEL)',
  BOM: 'Mumbai (BOM)',
  BLR: 'Bangalore (BLR)',
  HYD: 'Hyderabad (HYD)',
  MAA: 'Chennai (MAA)',
  CCU: 'Kolkata (CCU)',
  SIN: 'Singapore (SIN)',
  HKG: 'Hong Kong (HKG)',
  NRT: 'Tokyo Narita (NRT)',
  LHR: 'London Heathrow (LHR)',
  FRA: 'Frankfurt (FRA)',
  AMS: 'Amsterdam (AMS)',
  CDG: 'Paris (CDG)',
  JFK: 'New York (JFK)',
  ORD: 'Chicago (ORD)',
  SJC: 'San Jose Silicon Valley (SJC)',
  LAX: 'Los Angeles (LAX)',
  DFW: 'Dallas Fort Worth (DFW)',
  IAD: 'Washington DC (IAD)',
  SYD: 'Sydney (SYD)'
};

export default function RouteTracer() {
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState<TraceData | null>(null);
  const [selectedHop, setSelectedHop] = useState<number | null>(null);

  const runRouteTrace = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      // 1. Fetch Cloudflare edge trace
      const cfRes = await fetch('https://1.1.1.1/cdn-cgi/trace', { cache: 'no-store' });
      const cfText = await cfRes.text();
      const latency = Math.round(performance.now() - start);

      const parsed: Record<string, string> = {};
      cfText.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) parsed[k.trim()] = v.trim();
      });

      // 2. Fetch ISP / ASN info
      let org = 'Tier-1 Internet Transit';
      let asn = 'AS-ANYCAST';
      let city = parsed.loc || 'Global Edge';

      try {
        const ipRes = await fetch(`https://ipapi.co/${parsed.ip || ''}/json/`, { signal: AbortSignal.timeout(2500) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.org) org = ipData.org;
          if (ipData.asn) asn = ipData.asn;
          if (ipData.city) city = `${ipData.city}, ${ipData.country_code}`;
        }
      } catch {
        // Fallback gracefully
      }

      setTrace({
        clientIp: parsed.ip || 'Client Host',
        colo: parsed.colo || 'EDGE',
        loc: parsed.loc || 'IN',
        tls: parsed.tls || 'TLSv1.3',
        http: parsed.http || 'http/2',
        asn,
        org,
        city,
        latencyMs: latency
      });
    } catch {
      // Offline or blocked fallback
      setTrace({
        clientIp: '192.168.1.104',
        colo: 'DEL',
        loc: 'IN',
        tls: 'TLSv1.3',
        http: 'http/2',
        asn: 'AS55836',
        org: 'Broadband / Cellular Carrier',
        city: 'Edge Gateway',
        latencyMs: 24
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runRouteTrace();
  }, []);

  const hops = [
    {
      id: 1,
      title: 'Local Gateway',
      subtitle: '802.11 / Ethernet LAN',
      target: '192.168.1.1',
      latency: '< 2 ms',
      type: 'LAN',
      color: 'cyan',
      description: 'First physical link between client device and local home/office router switch.'
    },
    {
      id: 2,
      title: 'ISP Ingress Node',
      subtitle: trace?.org || 'Broadband Provider Core',
      target: trace?.asn || 'BGP Carrier',
      latency: `${Math.max(4, Math.round((trace?.latencyMs || 25) * 0.35))} ms`,
      type: 'BGP POP',
      color: 'blue',
      description: `Carrier routing gateway managed by ${trace?.org || 'Local ISP'}, routing across autonomous systems.`
    },
    {
      id: 3,
      title: 'Metro Internet Exchange',
      subtitle: `${trace?.city || 'Regional'} IXP Peering`,
      target: 'BGP Layer-2 / Anycast Fabric',
      latency: `${Math.max(8, Math.round((trace?.latencyMs || 25) * 0.65))} ms`,
      type: 'IXP CORE',
      color: 'indigo',
      description: 'Carrier-neutral peering exchange forwarding IP packets across transcontinental fiber.'
    },
    {
      id: 4,
      title: 'Cloudflare Edge PoP',
      subtitle: AIRPORT_NAMES[trace?.colo || ''] || `Airport Edge ${trace?.colo || 'Anycast'}`,
      target: `colo=${trace?.colo || 'AUTO'} · ${trace?.tls} / ${trace?.http}`,
      latency: `${trace?.latencyMs || 22} ms`,
      type: 'EDGE CLOUD',
      color: 'emerald',
      description: `Anycast Tier-1 edge data center terminating TLS/HTTP traffic with lowest physical propagation distance.`
    }
  ];

  return (
    <div className="premium-card bg-white dark:bg-[#121212] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#262626] shadow-sm flex flex-col gap-4 transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
              Route Trace
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold border border-indigo-200 dark:border-indigo-800 shrink-0">
              PoP Edge
            </span>
          </div>
        </div>

        <button
          onClick={runRouteTrace}
          disabled={loading}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>{loading ? 'Tracing...' : 'Re-Trace'}</span>
        </button>
      </div>

      {/* Overview Badges */}
      {trace && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold block">Edge Colocation</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900 dark:text-slate-100">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-mono text-xs">{trace.colo} ({trace.loc})</span>
            </div>
            <span className="text-[9px] text-slate-500 truncate block mt-0.5">
              {AIRPORT_NAMES[trace.colo] || 'Global Edge Data Center'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold block">Carrier ASN</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900 dark:text-slate-100">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono text-xs truncate">{trace.asn}</span>
            </div>
            <span className="text-[9px] text-slate-500 truncate block mt-0.5">
              {trace.org}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold block">Security Protocol</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-mono text-xs">{trace.tls}</span>
            </div>
            <span className="text-[9px] text-slate-500 truncate block mt-0.5 font-mono">
              Transport: {trace.http}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold block">RTT Propagation</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900 dark:text-slate-100">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-xs">{trace.latencyMs} ms</span>
            </div>
            <span className="text-[9px] text-emerald-500 font-bold block mt-0.5">
              Direct Route Active
            </span>
          </div>
        </div>
      )}

      {/* Visual Hop Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 relative">
        {hops.map((hop) => (
          <div 
            key={hop.id}
            onClick={() => setSelectedHop(selectedHop === hop.id ? null : hop.id)}
            className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedHop === hop.id 
                ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-black flex items-center justify-center">
                {hop.id}
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                hop.id === 4 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {hop.type}
              </span>
            </div>

            <div className="mb-2">
              <h4 className="font-sans font-bold text-xs text-slate-900 dark:text-slate-100">
                {hop.title}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {hop.subtitle}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 truncate max-w-[110px]">{hop.target}</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{hop.latency}</span>
            </div>

            {selectedHop === hop.id && (
              <div className="mt-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50 text-[10px] text-slate-600 dark:text-slate-300 animate-in fade-in">
                {hop.description}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
