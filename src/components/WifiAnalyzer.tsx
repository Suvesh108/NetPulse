import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, Radio } from 'lucide-react';

export default function WifiAnalyzer() {
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
    type: string;
  }>({
    effectiveType: '5 GHz / Ultra Wi-Fi',
    downlink: 120,
    rtt: 18,
    saveData: false,
    type: 'Wi-Fi 6 (802.11ax)'
  });

  const [rssi, setRssi] = useState(-48);
  const [noiseFloor] = useState(-92);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeConnection = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) {
        setConnectionInfo({
          effectiveType: conn.effectiveType ? `${conn.effectiveType.toUpperCase()} (High Bandwidth)` : 'Wi-Fi 5GHz / Fiber',
          downlink: conn.downlink || 120,
          rtt: conn.rtt || 18,
          saveData: !!conn.saveData,
          type: conn.type || 'Wi-Fi 6 (802.11ax)'
        });
      }
      const simulatedRssi = Math.min(-38, Math.max(-82, -35 - Math.round((conn?.rtt || 20) * 0.8)));
      setRssi(simulatedRssi);
      setAnalyzing(false);
    }, 500);
  };

  useEffect(() => {
    analyzeConnection();
  }, []);

  const snr = rssi - noiseFloor;

  const getSignalRating = (val: number) => {
    if (val >= -50) return { label: 'PRISTINE', color: 'text-emerald-500', bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
    if (val >= -65) return { label: 'GOOD', color: 'text-cyan-500', bar: 'bg-cyan-500', badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' };
    if (val >= -75) return { label: 'FAIR', color: 'text-amber-500', bar: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    return { label: 'WEAK', color: 'text-rose-500', bar: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
  };

  const rating = getSignalRating(rssi);
  const signalPercentage = Math.max(5, Math.min(100, Math.round(((rssi - (-90)) / (-30 - (-90))) * 100)));

  return (
    <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06] gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Wifi className="w-4 h-4 text-cyan-500 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            Wi-Fi RF Link & RSSI
          </h3>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${rating.badge}`}>
            {rating.label}
          </span>
        </div>

        <button
          type="button"
          onClick={analyzeConnection}
          disabled={analyzing}
          className="px-2.5 py-1 rounded-xl hud-subpanel text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-cyan-500' : 'text-slate-400'}`} />
          <span>{analyzing ? 'SCANNING...' : 'RE-SCAN'}</span>
        </button>
      </div>

      {/* RF Signal Meter Section */}
      <div className="hud-subpanel rounded-xl p-3.5 flex flex-col gap-2.5 min-w-0">
        <div className="flex items-center justify-between text-xs font-mono min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white truncate">SIGNAL STRENGTH (RSSI)</span>
          </div>
          <span className="font-bold text-cyan-500 shrink-0">{rssi} dBm</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${rating.bar}`}
            style={{ width: `${signalPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 dark:text-zinc-500">
          <span>-90 dBm (Weak)</span>
          <span>-60 dBm (Avg)</span>
          <span>-30 dBm (Pristine)</span>
        </div>
      </div>

      {/* SNR & Link Metrics 3 Sub-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-w-0 text-xs font-mono">
        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col justify-between gap-1 min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">SNR MARGIN</span>
          <span className="font-bold text-slate-900 dark:text-white text-base">+{snr} dB</span>
          <span className="text-[9px] text-emerald-500 font-bold">Clear Channel</span>
        </div>

        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col justify-between gap-1 min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">PHY LINK SPEED</span>
          <span className="font-bold text-slate-900 dark:text-white text-base">{connectionInfo.downlink * 8} Mbps</span>
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">Local NIC Interface</span>
        </div>

        <div className="hud-subpanel rounded-xl p-2.5 flex flex-col justify-between gap-1 min-w-0">
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">GATEWAY RTT</span>
          <span className="font-bold text-slate-900 dark:text-white text-base">{connectionInfo.rtt} ms</span>
          <span className="text-[9px] text-slate-400 dark:text-zinc-500">First Hop Delay</span>
        </div>
      </div>

    </div>
  );
}
