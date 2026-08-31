import React from 'react';
import { 
  Download, Upload, Activity, Play, RotateCcw, ShieldCheck, 
  Tv, Gamepad2, Video, Copy, Check, Info, ArrowDown, ArrowUp, Radio, Clock
} from 'lucide-react';
import { TestStatus, SimulationSettings } from '../types';

interface SpeedTestMobileProps {
  status: TestStatus;
  currentSpeed: number;
  downloadVal: number | null;
  uploadVal: number | null;
  pingVal: number | null;
  jitterVal: number | null;
  packetLossVal: number | null;
  packetsReceived: number;
  packetsTotal: number;
  downloadSpeedHistory: number[];
  uploadSpeedHistory: number[];
  unit: 'Mbps' | 'MB/s';
  factor: number;
  settings: SimulationSettings;
  activeServerName: string;
  measuredTime: string | null;
  copiedLink: boolean;
  onStartTest: () => void;
  onCancelTest: () => void;
  onCopyResults: () => void;
  generateCloudflareSpline: (history: number[], baseVal: number | null, width?: number, height?: number) => { stroke: string; fill: string; points: { x: number; y: number }[]; hasData: boolean };
  calcVideoScore: () => { label: string; detail: string; color: string };
  calcGamingScore: () => { label: string; detail: string; color: string };
  calcChatScore: () => { label: string; detail: string; color: string };
}

export default function SpeedTestMobile({
  status,
  currentSpeed,
  downloadVal,
  uploadVal,
  pingVal,
  jitterVal,
  packetLossVal,
  packetsReceived,
  packetsTotal,
  downloadSpeedHistory,
  uploadSpeedHistory,
  unit,
  factor,
  settings,
  activeServerName,
  measuredTime,
  copiedLink,
  onStartTest,
  onCancelTest,
  onCopyResults,
  generateCloudflareSpline,
  calcVideoScore,
  calcGamingScore,
  calcChatScore
}: SpeedTestMobileProps) {
  const isTesting = status !== 'idle' && status !== 'completed';
  const isCompleted = status === 'completed';

  // Real-time active spline graph path
  const activeHistory = (status === 'uploading' || (isCompleted && uploadVal !== null))
    ? uploadSpeedHistory 
    : downloadSpeedHistory;
  const activeVal = (status === 'uploading' || (isCompleted && uploadVal !== null))
    ? uploadVal 
    : (downloadVal ?? currentSpeed);
    
  const spline = generateCloudflareSpline(activeHistory, activeVal, 320, 60);

  const videoGrade = calcVideoScore();
  const gamingGrade = calcGamingScore();
  const chatGrade = calcChatScore();

  // Box plot row component for mobile
  const renderMobileBoxPlotRow = (
    title: string,
    valMbps: number | null,
    pctComplete: string,
    minPct: number,
    q1Pct: number,
    q3Pct: number,
    maxPct: number,
    color: 'orange' | 'purple' | 'amber' | 'blue'
  ) => {
    const colorClasses = {
      orange: { bar: 'bg-[#F6821F]/20 border-[#F6821F]', whisker: 'bg-[#F6821F]', dot: 'bg-[#F6821F]', text: 'text-[#F6821F]' },
      purple: { bar: 'bg-[#8D1EB1]/20 border-[#8D1EB1]', whisker: 'bg-[#8D1EB1]', dot: 'bg-[#8D1EB1]', text: 'text-[#8D1EB1]' },
      amber: { bar: 'bg-amber-500/20 border-amber-500', whisker: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-700' },
      blue: { bar: 'bg-blue-500/20 border-blue-500', whisker: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-700' }
    }[color];

    return (
      <div className="flex flex-col gap-0.5 py-1.5 border-b border-slate-100 last:border-0">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-800 truncate text-[11px]">{title}</span>
            <span className="text-[9px] text-slate-400 font-mono">({pctComplete})</span>
          </div>
          <span className={`font-mono text-[11px] font-black ${valMbps !== null ? colorClasses.text : 'text-slate-300'}`}>
            {valMbps !== null ? `${(valMbps / factor).toFixed(1)} ${unit}` : '--'}
          </span>
        </div>

        <div className="relative w-full h-3.5 bg-slate-100/80 rounded overflow-hidden flex items-center px-1">
          <div className="absolute inset-x-2 flex justify-between text-[7px] font-mono text-slate-400 pointer-events-none opacity-40">
            <span>0</span>
            <span>20M</span>
            <span>40M</span>
            <span>60M</span>
            <span>80M</span>
          </div>

          {valMbps !== null && (
            <div 
              className={`absolute h-0.5 ${colorClasses.whisker} opacity-60`}
              style={{ left: `${minPct}%`, width: `${Math.max(2, maxPct - minPct)}%` }}
            />
          )}

          {valMbps !== null && (
            <div 
              className={`absolute h-2 rounded-xs border ${colorClasses.bar}`}
              style={{ left: `${q1Pct}%`, width: `${Math.max(4, q3Pct - q1Pct)}%` }}
            />
          )}

          {valMbps !== null && (
            <div 
              className={`absolute w-1.5 h-2 ${colorClasses.dot} rounded-full z-10 shadow-sm`}
              style={{ left: `${(q1Pct + q3Pct) / 2}%` }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-3 pb-28 select-none animate-fade-in md:hidden">
      
      {/* 1. MOBILE HERO SPEEDOMETER CONSOLE */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3 relative overflow-hidden">
        
        {/* Top Edge Server Node Meta */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px]">
          <div className="flex items-center gap-1.5 truncate max-w-[210px]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-bold text-slate-800 truncate">{activeServerName}</span>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60 shrink-0">
            {settings.routingProtocol === 'http3-quic' ? 'QUIC' : 'Anycast'}
          </span>
        </div>

        {/* Big Speed Readout */}
        <div className="flex flex-col items-center justify-center py-1 text-center relative">
          
          {/* Status Pill */}
          <div className="mb-1">
            {status === 'idle' && (
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">READY TO TEST</span>
            )}
            {status === 'pinging' && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 animate-pulse">
                Probing Latency...
              </span>
            )}
            {status === 'jittering' && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 animate-pulse">
                Measuring Jitter...
              </span>
            )}
            {status === 'downloading' && (
              <span className="text-[10px] font-bold text-[#F6821F] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/80 animate-pulse">
                Testing Inbound Throughput...
              </span>
            )}
            {status === 'uploading' && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/80 animate-pulse">
                Testing Outbound Throughput...
              </span>
            )}
            {status === 'packet-probing' && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/80 animate-pulse">
                Analyzing Packet Stability...
              </span>
            )}
            {isCompleted && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1">
                <Check className="w-3 h-3" /> Test Completed
              </span>
            )}
          </div>

          {/* Large Numerals */}
          <div className="flex items-baseline justify-center gap-1.5 my-1">
            <span className="font-sans font-black text-5xl tracking-tight text-slate-900 leading-none">
              {currentSpeed > 0 ? (currentSpeed / factor).toFixed(1) : (isCompleted && downloadVal !== null ? (downloadVal / factor).toFixed(1) : '0.0')}
            </span>
            <span className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
              {unit}
            </span>
          </div>

          {/* Live Spline Waveform */}
          <div className="w-full h-14 mt-1 relative overflow-hidden">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 320 60" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="mobileSplineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d={spline.fill} 
                fill="url(#mobileSplineGrad)" 
              />
              <path 
                d={spline.stroke} 
                fill="none" 
                stroke="#3B82F6" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
        </div>

        {/* Big Action Button */}
        <div>
          {!isTesting ? (
            <button
              id="mobile-start-test-btn"
              onClick={onStartTest}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCompleted ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isCompleted ? 'TEST AGAIN' : 'START SPEED TEST'}</span>
            </button>
          ) : (
            <button
              id="mobile-cancel-test-btn"
              onClick={onCancelTest}
              className="w-full py-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
              <span>CANCEL TEST</span>
            </button>
          )}
        </div>

      </div>

      {/* 2. LATENCY, JITTER & PACKET LOSS SUMMARY CARD (Image 2) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col gap-2.5">
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
          
          {/* Latency */}
          <div className="flex flex-col items-center px-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
              <span>Latency</span>
              <Info className="w-2.5 h-2.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-0.5 my-0.5">
              <span className={`font-sans font-black text-xl ${pingVal !== null ? 'text-slate-900' : 'text-slate-300'}`}>
                {pingVal !== null ? pingVal : '-'}
              </span>
              <span className="text-[10px] font-bold text-amber-600">ms</span>
            </div>
            <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-mono">
              <span className="flex items-center text-[#F6821F] font-bold">
                <ArrowDown className="w-2 h-2 inline" /> {pingVal !== null ? `${Math.round(pingVal * 1.3)}` : '-'}
              </span>
              <span className="flex items-center text-[#8D1EB1] font-bold">
                <ArrowUp className="w-2 h-2 inline" /> {pingVal !== null ? `${Math.round(pingVal * 2.1)}` : '-'}
              </span>
            </div>
          </div>

          {/* Jitter */}
          <div className="flex flex-col items-center px-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
              <span>Jitter</span>
              <Info className="w-2.5 h-2.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-0.5 my-0.5">
              <span className={`font-sans font-black text-xl ${jitterVal !== null ? 'text-slate-900' : 'text-slate-300'}`}>
                {jitterVal !== null ? jitterVal : '-'}
              </span>
              <span className="text-[10px] font-bold text-indigo-600">ms</span>
            </div>
            <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-mono">
              <span className="flex items-center text-[#F6821F] font-bold">
                <ArrowDown className="w-2 h-2 inline" /> {jitterVal !== null ? `${(jitterVal * 1.4).toFixed(1)}` : '-'}
              </span>
              <span className="flex items-center text-[#8D1EB1] font-bold">
                <ArrowUp className="w-2 h-2 inline" /> {jitterVal !== null ? `${(jitterVal * 1.8).toFixed(1)}` : '-'}
              </span>
            </div>
          </div>

          {/* Packet Loss */}
          <div className="flex flex-col items-center px-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
              <span>Packet Loss</span>
              <Info className="w-2.5 h-2.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-0.5 my-0.5">
              <span className={`font-sans font-black text-xl ${packetLossVal !== null ? 'text-slate-900' : 'text-slate-300'}`}>
                {packetLossVal !== null ? packetLossVal.toFixed(1) : '-'}
              </span>
              <span className="text-[10px] font-bold text-blue-600">%</span>
            </div>
            <span className="text-[8px] text-slate-400 font-mono">
              {packetsTotal > 0 ? `${packetsReceived}/${packetsTotal}` : '25 probes'}
            </span>
          </div>

        </div>
      </div>

      {/* 3. DOWNLOAD MEASUREMENTS BREAKDOWN CARD (Image 1) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#18181B]">Download Measurements</span>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono">Payloads</span>
        </div>

        {renderMobileBoxPlotRow("100 kB download test", downloadVal !== null ? downloadVal * 0.45 : null, "10/10", 10, 18, 28, 40, 'orange')}
        {renderMobileBoxPlotRow("1 MB download test", downloadVal !== null ? downloadVal * 0.72 : null, "8/8", 25, 42, 58, 68, 'orange')}
        {renderMobileBoxPlotRow("10 MB download test", downloadVal !== null ? downloadVal * 0.88 : null, "6/6", 35, 52, 70, 85, 'orange')}
        {renderMobileBoxPlotRow("25 MB download test", downloadVal, "4/4", 45, 65, 82, 95, 'orange')}
      </div>

      {/* 4. UPLOAD MEASUREMENTS BREAKDOWN CARD (Image 1) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#18181B]">Upload Measurements</span>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono">Payloads</span>
        </div>

        {renderMobileBoxPlotRow("100 kB upload test", uploadVal !== null ? uploadVal * 0.42 : null, "8/8", 12, 20, 32, 45, 'purple')}
        {renderMobileBoxPlotRow("1 MB upload test", uploadVal !== null ? uploadVal * 0.68 : null, "6/6", 28, 45, 60, 72, 'purple')}
        {renderMobileBoxPlotRow("10 MB upload test", uploadVal !== null ? uploadVal * 0.85 : null, "4/4", 40, 58, 74, 86, 'purple')}
        {renderMobileBoxPlotRow("25 MB upload test", uploadVal, "4/4", 48, 68, 80, 92, 'purple')}
      </div>

      {/* 5. LATENCY MEASUREMENTS BREAKDOWN CARD (Image 1) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#18181B]">Latency Measurements</span>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-[9px] text-slate-400 font-mono">ms</span>
        </div>

        {/* Unloaded Latency */}
        <div className="flex flex-col gap-0.5 py-1 border-b border-slate-100">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-800">Unloaded latency</span>
            <span className="font-mono text-[11px] font-black text-amber-700">
              {pingVal !== null ? `${pingVal} ms` : '-'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#F6821F] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (pingVal || 0) * 1.2)}%` }}></div>
          </div>
        </div>

        {/* Latency during Download */}
        <div className="flex flex-col gap-0.5 py-1 border-b border-slate-100">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-800">Latency during download</span>
            <span className="font-mono text-[11px] font-black text-[#F6821F]">
              {pingVal !== null ? `${Math.round(pingVal * 1.3)} ms` : '-'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#F6821F] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (pingVal || 0) * 1.6)}%` }}></div>
          </div>
        </div>

        {/* Latency during Upload */}
        <div className="flex flex-col gap-0.5 py-1 border-b border-slate-100">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-800">Latency during upload</span>
            <span className="font-mono text-[11px] font-black text-[#8D1EB1]">
              {pingVal !== null ? `${Math.round(pingVal * 2.1)} ms` : '-'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#8D1EB1] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (pingVal || 0) * 2.2)}%` }}></div>
          </div>
        </div>

        {/* Packet Loss Bar */}
        <div className="flex flex-col gap-0.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-800">Packet Delivery</span>
            <span className="font-mono text-[10px] font-bold text-emerald-700">
              {packetLossVal !== null ? `${(100 - packetLossVal).toFixed(1)}% (${packetLossVal.toFixed(1)}% drop)` : 'Probing...'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                packetLossVal === null || packetLossVal === 0 ? 'bg-emerald-600' : (packetLossVal < 5 ? 'bg-amber-500' : 'bg-rose-500')
              }`} 
              style={{ width: `${packetLossVal !== null ? Math.max(5, 100 - packetLossVal) : 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 6. NETWORK QUALITY SCORE CARD (Image 1) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-[#18181B]">Network Quality Score</h3>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-blue-600 font-medium">AIM Assessment</span>
            {isCompleted && (
              <button
                onClick={onCopyResults}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60 active:scale-95 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Video Streaming */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#F6821F] flex items-center justify-center shrink-0">
                <Tv className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">Video Streaming</span>
                <span className="text-[8px] text-slate-400">{videoGrade.detail}</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${videoGrade.color}`}>
              {videoGrade.label}
            </span>
          </div>

          {/* Online Gaming */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">Online Gaming</span>
                <span className="text-[8px] text-slate-400">{gamingGrade.detail}</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${gamingGrade.color}`}>
              {gamingGrade.label}
            </span>
          </div>

          {/* Video Chatting */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">Video Chatting</span>
                <span className="text-[8px] text-slate-400">{chatGrade.detail}</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${chatGrade.color}`}>
              {chatGrade.label}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
