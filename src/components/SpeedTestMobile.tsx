import React from 'react';
import { 
  Download, Upload, Activity, Play, RotateCcw, ShieldCheck, 
  Tv, Gamepad2, Video, Copy, Check, Share2, Zap, ArrowDown, ArrowUp, Radio
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

  return (
    <div className="w-full flex flex-col gap-3 pb-24 select-none animate-fade-in md:hidden">
      
      {/* 1. MOBILE HERO SPEED DISPLAY */}
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

          {/* Mini Live Spline Waveform */}
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

      {/* 2. 2x2 MOBILE DIAGNOSTIC METRIC GRID */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* Metric 1: Download */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-[#F6821F] uppercase tracking-wider">Download</span>
            <div className="w-6 h-6 rounded-md bg-orange-50 text-[#F6821F] flex items-center justify-center">
              <Download className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`font-sans font-black text-2xl ${downloadVal !== null ? 'text-slate-900' : 'text-slate-300'}`}>
              {downloadVal !== null ? (downloadVal / factor).toFixed(1) : '--'}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{unit}</span>
          </div>
        </div>

        {/* Metric 2: Upload */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">Upload</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Upload className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`font-sans font-black text-2xl ${uploadVal !== null ? 'text-slate-900' : 'text-slate-300'}`}>
              {uploadVal !== null ? (uploadVal / factor).toFixed(1) : '--'}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{unit}</span>
          </div>
        </div>

        {/* Metric 3: Ping & Jitter */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider font-sans">Ping & Jitter</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-0.5">
              <span className={`font-sans font-black text-2xl ${pingVal !== null ? 'text-slate-900' : 'text-slate-300'}`}>
                {pingVal !== null ? pingVal : '--'}
              </span>
              <span className="text-[10px] text-amber-600 font-bold">ms</span>
            </div>
            <span className="text-[10px] text-indigo-600 font-bold">
              {jitterVal !== null ? `±${jitterVal}ms` : '--'}
            </span>
          </div>
        </div>

        {/* Metric 4: Packet Health */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider font-sans">Packet Loss</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-0.5">
              <span className={`font-sans font-black text-2xl ${packetLossVal !== null ? 'text-slate-900' : 'text-slate-300'}`}>
                {packetLossVal !== null ? packetLossVal.toFixed(1) : '--'}
              </span>
              <span className="text-[10px] text-blue-600 font-bold">%</span>
            </div>
            <span className="text-[9px] text-slate-400 font-sans">
              {packetsTotal > 0 ? `${packetsReceived}/${packetsTotal}` : '25 probes'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. MOBILE NETWORK QUALITY EXPERIENCE SCORE (Shows when completed) */}
      {isCompleted && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-sans font-black text-xs text-slate-900">Network Quality Score</span>
            </div>
            <button
              onClick={onCopyResults}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200/60 active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {/* Video Streaming */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#F6821F] flex items-center justify-center shrink-0">
                  <Tv className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Video Streaming</span>
                  <span className="text-[9px] text-slate-400">{videoGrade.detail}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${videoGrade.color}`}>
                {videoGrade.label}
              </span>
            </div>

            {/* Online Gaming */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Online Gaming</span>
                  <span className="text-[9px] text-slate-400">{gamingGrade.detail}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${gamingGrade.color}`}>
                {gamingGrade.label}
              </span>
            </div>

            {/* Video Chatting */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-900">Video Chatting</span>
                  <span className="text-[9px] text-slate-400">{chatGrade.detail}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${chatGrade.color}`}>
                {chatGrade.label}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
