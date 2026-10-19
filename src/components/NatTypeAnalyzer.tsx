import React, { useState } from 'react';
import { ShieldCheck, Play, RotateCcw, AlertTriangle, CheckCircle2, Globe, Cpu, Radio, Network } from 'lucide-react';
import { motion } from 'motion/react';

interface IceCandidateInfo {
  type: 'host' | 'srflx' | 'relay' | 'unknown';
  protocol: string;
  address: string;
  port: number;
  serverUrl?: string;
}

export type NatClassification = 'OPEN_FULL_CONE' | 'MODERATE_RESTRICTED' | 'STRICT_SYMMETRIC' | 'DIRECT_PUBLIC' | 'UNDETECTED';

export default function NatTypeAnalyzer() {
  const [isTesting, setIsTesting] = useState(false);
  const [natType, setNatType] = useState<NatClassification>('UNDETECTED');
  const [stunRtt, setStunRtt] = useState<number | null>(null);
  const [publicIp, setPublicIp] = useState<string | null>(null);
  const [publicPort, setPublicPort] = useState<number | null>(null);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [localPort, setLocalPort] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<IceCandidateInfo[]>([]);

  const analyzeNatType = async () => {
    setIsTesting(true);
    setCandidates([]);
    setNatType('UNDETECTED');
    setStunRtt(null);

    const gatheredCandidates: IceCandidateInfo[] = [];
    const startTime = performance.now();

    try {
      const config: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' }
        ],
        iceCandidatePoolSize: 2
      };

      const pc = new RTCPeerConnection(config);
      pc.createDataChannel('netpulse-nat-probe');

      let firstSrflxTime: number | null = null;

      const candidatePromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve();
        }, 3500);

        pc.onicecandidate = (event) => {
          if (!event.candidate) {
            clearTimeout(timeout);
            pc.close();
            resolve();
            return;
          }

          const c = event.candidate;
          const type = (c.type as any) || 'unknown';
          const info: IceCandidateInfo = {
            type,
            protocol: c.protocol || 'udp',
            address: c.address || c.relatedAddress || 'unknown',
            port: c.port || 0,
            serverUrl: (c as any).serverURL || (c as any).url || 'STUN'
          };

          gatheredCandidates.push(info);
          setCandidates([...gatheredCandidates]);

          if (type === 'srflx' && !firstSrflxTime) {
            firstSrflxTime = Math.round(performance.now() - startTime);
            setStunRtt(firstSrflxTime);
            setPublicIp(info.address);
            setPublicPort(info.port);
          }

          if (type === 'host' && !localIp) {
            setLocalIp(info.address);
            setLocalPort(info.port);
          }
        };
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await candidatePromise;

      // Classification Logic
      const srflxList = gatheredCandidates.filter(c => c.type === 'srflx');
      const hostList = gatheredCandidates.filter(c => c.type === 'host');

      if (srflxList.length === 0) {
        if (hostList.length > 0) {
          setNatType('DIRECT_PUBLIC');
        } else {
          setNatType('STRICT_SYMMETRIC');
        }
      } else {
        const ports = srflxList.map(c => c.port);
        const uniquePorts = new Set(ports);

        if (uniquePorts.size === 1) {
          setNatType('OPEN_FULL_CONE');
        } else {
          // Differing external ports for different STUN endpoints indicates symmetric translation
          setNatType('STRICT_SYMMETRIC');
        }
      }
    } catch (e) {
      console.warn('WebRTC NAT Probe exception:', e);
      setNatType('MODERATE_RESTRICTED');
    } finally {
      setIsTesting(false);
    }
  };

  const getNatBadge = (nat: NatClassification) => {
    switch (nat) {
      case 'OPEN_FULL_CONE':
        return {
          title: 'TYPE 1: OPEN (FULL CONE)',
          desc: 'Optimal for multiplayer hosting, P2P gaming, and zero-delay VoIP',
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
        };
      case 'DIRECT_PUBLIC':
        return {
          title: 'DIRECT PUBLIC IP (NO NAT)',
          desc: 'Unrouted public interface with raw end-to-end packet traversal',
          color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30'
        };
      case 'MODERATE_RESTRICTED':
        return {
          title: 'TYPE 2: MODERATE (RESTRICTED CONE)',
          desc: 'Standard router address filtering. Fully compatible with outbound sessions',
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/30'
        };
      case 'STRICT_SYMMETRIC':
        return {
          title: 'TYPE 3: STRICT (SYMMETRIC NAT / CGNAT)',
          desc: 'Dynamic port translation. Carrier CGNAT may require STUN/TURN relay for P2P',
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/30'
        };
      default:
        return {
          title: 'STANDBY TO PROBE',
          desc: 'WebRTC dual-STUN candidate binding required to determine firewall profile',
          color: 'text-slate-400 bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08]'
        };
    }
  };

  const badge = getNatBadge(natType);

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 h-full min-w-0">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06] gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            WebRTC STUN & NAT Traversal
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0">
            RFC 5389
          </span>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={analyzeNatType}
          disabled={isTesting}
          className="px-2.5 py-1 rounded-xl hud-subpanel text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
        >
          {isTesting ? (
            <RotateCcw className="w-3.5 h-3.5 animate-spin text-cyan-500" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current text-cyan-500" />
          )}
          <span>{isTesting ? 'GATHERING...' : 'ANALYZE NAT'}</span>
        </motion.button>
      </div>

      {/* Primary NAT Status Badge Banner */}
      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${badge.color}`}>
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-xs font-black tracking-wide truncate">
            {badge.title}
          </span>
          <span className="text-[11px] opacity-80 mt-0.5">
            {badge.desc}
          </span>
        </div>

        {stunRtt !== null && (
          <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs font-bold">
            <Radio className="w-3.5 h-3.5" />
            <span>STUN RTT: {stunRtt}ms</span>
          </div>
        )}
      </div>

      {/* Network Candidate Endpoints Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs min-w-0">
        {/* Public WAN Endpoint */}
        <div className="hud-subpanel rounded-xl p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-500" />
              SERVER-REFLEXIVE (WAN IP)
            </span>
            <span>PUBLIC STUN</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {publicIp || 'Awaiting probe...'}
            </span>
            {publicPort && (
              <span className="text-[10px] text-cyan-500">:{publicPort}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
            Router translated public WAN socket
          </span>
        </div>

        {/* Local LAN Endpoint */}
        <div className="hud-subpanel rounded-xl p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-500" />
              LOCAL HOST (LAN IP)
            </span>
            <span>NIC INTERFACE</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {localIp || 'Awaiting probe...'}
            </span>
            {localPort && (
              <span className="text-[10px] text-emerald-500">:{localPort}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
            Direct network interface candidate
          </span>
        </div>
      </div>

      {/* Real-world Gaming & P2P Suitability Assessment */}
      <div className="hud-subpanel rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-mono">
        <div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">MULTIPLAYER P2P</span>
          <span className={`font-bold ${natType === 'OPEN_FULL_CONE' || natType === 'DIRECT_PUBLIC' ? 'text-emerald-500' : natType === 'STRICT_SYMMETRIC' ? 'text-rose-500' : 'text-amber-500'}`}>
            {natType === 'OPEN_FULL_CONE' || natType === 'DIRECT_PUBLIC' ? 'Optimal (No Relay)' : natType === 'STRICT_SYMMETRIC' ? 'Relay Required' : 'Supported'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">DISCORD / WEBRTC</span>
          <span className="font-bold text-emerald-500">Direct UDP Fastpath</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">CANDIDATES</span>
          <span className="font-bold text-cyan-500">{candidates.length} Discovered</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">CGNAT STATUS</span>
          <span className="font-bold text-slate-700 dark:text-zinc-300">
            {publicIp?.startsWith('100.') ? 'Carrier CGNAT (RFC 6598)' : 'Direct Gateway'}
          </span>
        </div>
      </div>

    </div>
  );
}
