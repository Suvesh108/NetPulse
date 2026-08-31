import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, MapPin, CheckCircle2, Zap, Activity, Gauge, BarChart2, Radio, Play, RotateCcw, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { TestStatus, SimulationSettings, SpeedTestResult } from '../types';
import SpeedTestEngine from '@cloudflare/speedtest';

interface SpeedTestProps {
  settings: SimulationSettings;
  onUpdateSettings: (settings: SimulationSettings) => void;
  onTestComplete: (result: SpeedTestResult) => void;
  unit?: 'Mbps' | 'MB/s';
}

export default function SpeedTest({ settings, onUpdateSettings, onTestComplete, unit = 'Mbps' }: SpeedTestProps) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [downloadVal, setDownloadVal] = useState<number | null>(null);
  const [uploadVal, setUploadVal] = useState<number | null>(null);
  const [pingVal, setPingVal] = useState<number | null>(null);
  const [jitterVal, setJitterVal] = useState<number | null>(null);
  
  // Real-time speed curve data points for drawing SVG spline graphs
  const [downloadSpeedHistory, setDownloadSpeedHistory] = useState<number[]>([]);
  const [uploadSpeedHistory, setUploadSpeedHistory] = useState<number[]>([]);
  
  const timerIntervalRef = useRef<number | null>(null);
  const engineRef = useRef<any>(null);

  const isTestingRef = useRef(false);
  const elapsedRef = useRef(0);
  const timerFinishedRef = useRef(false);
  const finalResultsRef = useRef<any>(null);

  // Safe Cleanup
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (engineRef.current) {
        try {
          engineRef.current.pause();
        } catch {
          // Ignored
        }
      }
    };
  }, []);

  const completeSpeedTest = (results: any) => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const summary = results.getSummary();
    const dnMbps = summary.download ? parseFloat((summary.download / 1_000_000).toFixed(1)) : 0;
    const upMbps = summary.upload ? parseFloat((summary.upload / 1_000_000).toFixed(1)) : 0;
    const ping = summary.latency ? Math.round(summary.latency) : 0;
    const jitter = summary.jitter ? parseFloat(summary.jitter.toFixed(1)) : 0;

    setDownloadVal(dnMbps);
    setUploadVal(upMbps);
    setPingVal(ping);
    setJitterVal(jitter);
    setStatus('completed');

    const finalResult: SpeedTestResult = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      downloadMbps: dnMbps,
      uploadMbps: upMbps,
      pingMs: ping,
      jitterMs: jitter,
      serverName: 'Cloudflare Global Edge CDN'
    };

    onTestComplete(finalResult);
    engineRef.current = null;
    isTestingRef.current = false;
  };

  const runRealSpeedTest = () => {
    setStatus('pinging');
    elapsedRef.current = 0;
    timerFinishedRef.current = false;
    finalResultsRef.current = null;

    try {
      const engine = new SpeedTestEngine({
        autoStart: false,
        measureDownloadLoadedLatency: false,
        measureUploadLoadedLatency: false,
        measurements: [
          { type: 'latency', numPackets: 1 },
          { type: 'download', bytes: 1e5, count: 1, bypassMinDuration: true },
          { type: 'latency', numPackets: 20 },
          { type: 'download', bytes: 1e5, count: 9 },
          { type: 'download', bytes: 1e6, count: 8 },
          { type: 'upload', bytes: 1e5, count: 8 },
          { type: 'upload', bytes: 1e6, count: 6 },
          { type: 'download', bytes: 1e7, count: 6 },
          { type: 'upload', bytes: 1e7, count: 4 },
          { type: 'download', bytes: 2.5e7, count: 4 },
          { type: 'upload', bytes: 2.5e7, count: 4 },
          { type: 'download', bytes: 1e8, count: 3 },
          { type: 'upload', bytes: 5e7, count: 3 },
          { type: 'download', bytes: 2.5e8, count: 2 }
        ]
      });
      engineRef.current = engine;

      engine.onResultsChange = ({ type }) => {
        const results = engine.results;
        const elapsed = elapsedRef.current;
        
        if (type === 'latency' && elapsed < 6) {
          const lat = results.getUnloadedLatency();
          if (lat !== undefined && lat !== null) setPingVal(Math.round(lat));
        } else if (type === 'latency' && elapsed >= 6 && elapsed < 12) {
          const jit = results.getUnloadedJitter();
          if (jit !== undefined && jit !== null) setJitterVal(parseFloat(jit.toFixed(1)));
        } else if (type === 'download' && elapsed >= 12 && elapsed < 18) {
          const dn = results.getDownloadBandwidth();
          if (dn !== undefined && dn !== null) {
            const dnMbps = parseFloat((dn / 1_000_000).toFixed(1));
            const progressRatio = (elapsed - 12 + 1) / 6;
            const rampedSpeed = dnMbps * progressRatio;
            setCurrentSpeed(parseFloat(rampedSpeed.toFixed(1)));
            setDownloadVal(parseFloat(rampedSpeed.toFixed(1)));
            
            const points = results.getDownloadBandwidthPoints();
            if (points && points.length > 0) {
              const historyMbps = points.map(p => parseFloat((p.bps / 1_000_000).toFixed(1)));
              setDownloadSpeedHistory(historyMbps);
            }
          }
        } else if (type === 'upload' && elapsed >= 18 && elapsed < 24) {
          const up = results.getUploadBandwidth();
          if (up !== undefined && up !== null) {
            const upMbps = parseFloat((up / 1_000_000).toFixed(1));
            const progressRatio = (elapsed - 18 + 1) / 6;
            const rampedSpeed = upMbps * progressRatio;
            setCurrentSpeed(parseFloat(rampedSpeed.toFixed(1)));
            setUploadVal(parseFloat(rampedSpeed.toFixed(1)));
            
            const points = results.getUploadBandwidthPoints();
            if (points && points.length > 0) {
              const historyMbps = points.map(p => parseFloat((p.bps / 1_000_000).toFixed(1)));
              setUploadSpeedHistory(historyMbps);
            }
          }
        }
      };

      engine.onFinish = (results) => {
        finalResultsRef.current = results;
        if (timerFinishedRef.current) {
          completeSpeedTest(results);
        }
      };

      engine.onError = (err) => {
        console.error('SpeedTest error:', err);
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setStatus('idle');
        setCurrentSpeed(0);
        setDownloadVal(null);
        setUploadVal(null);
        setPingVal(null);
        setJitterVal(null);
        setDownloadSpeedHistory([]);
        setUploadSpeedHistory([]);
        engineRef.current = null;
        isTestingRef.current = false;
      };

      // Sequential timer
      timerIntervalRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        const elapsed = elapsedRef.current;

        if (elapsed < 6) {
          setStatus('pinging');
          if (engineRef.current) {
            const results = engineRef.current.results;
            const lat = results.getUnloadedLatency();
            if (lat !== undefined && lat !== null) setPingVal(Math.round(lat));
          }
        } else if (elapsed >= 6 && elapsed < 12) {
          setStatus('jittering');
          if (engineRef.current) {
            const results = engineRef.current.results;
            const jit = results.getUnloadedJitter();
            if (jit !== undefined && jit !== null) setJitterVal(parseFloat(jit.toFixed(1)));
          }
        } else if (elapsed >= 12 && elapsed < 18) {
          setStatus('downloading');
          if (engineRef.current) {
            const results = engineRef.current.results;
            const dn = results.getDownloadBandwidth();
            if (dn !== undefined && dn !== null) {
              const dnMbps = parseFloat((dn / 1_000_000).toFixed(1));
              const progressRatio = (elapsed - 12 + 1) / 6;
              const rampedSpeed = dnMbps * progressRatio;
              setCurrentSpeed(parseFloat(rampedSpeed.toFixed(1)));
              setDownloadVal(parseFloat(rampedSpeed.toFixed(1)));
              
              const points = results.getDownloadBandwidthPoints();
              if (points && points.length > 0) {
                const historyMbps = points.map(p => parseFloat((p.bps / 1_000_000).toFixed(1)));
                setDownloadSpeedHistory(historyMbps);
              }
            }
          }
        } else if (elapsed >= 18 && elapsed < 24) {
          setStatus('uploading');
          if (engineRef.current) {
            const results = engineRef.current.results;
            const up = results.getUploadBandwidth();
            if (up !== undefined && up !== null) {
              const upMbps = parseFloat((up / 1_000_000).toFixed(1));
              const progressRatio = (elapsed - 18 + 1) / 6;
              const rampedSpeed = upMbps * progressRatio;
              setCurrentSpeed(parseFloat(rampedSpeed.toFixed(1)));
              setUploadVal(parseFloat(rampedSpeed.toFixed(1)));
              
              const points = results.getUploadBandwidthPoints();
              if (points && points.length > 0) {
                const historyMbps = points.map(p => parseFloat((p.bps / 1_000_000).toFixed(1)));
                setUploadSpeedHistory(historyMbps);
              }
            }
          }
        } else if (elapsed >= 24) {
          timerFinishedRef.current = true;
          if (finalResultsRef.current) {
            completeSpeedTest(finalResultsRef.current);
          } else {
            setStatus('uploading');
          }
        }
      }, 1000);

      engine.play();
    } catch (e) {
      console.error('Failed to initialize speed test:', e);
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setStatus('idle');
      isTestingRef.current = false;
    }
  };

  const handleStartTest = () => {
    if (isTestingRef.current) return;
    if (status !== 'idle' && status !== 'completed') return;

    isTestingRef.current = true;

    // Reset stats
    setCurrentSpeed(0);
    setDownloadVal(null);
    setUploadVal(null);
    setPingVal(null);
    setJitterVal(null);
    setDownloadSpeedHistory([]);
    setUploadSpeedHistory([]);

    runRealSpeedTest();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return { label: 'Ready to Test', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'pinging':
        return { label: 'Testing Latency (0-6s)', color: 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-400/20 animate-pulse' };
      case 'jittering':
        return { label: 'Testing Jitter (6-12s)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-400/20 animate-pulse' };
      case 'downloading':
        return { label: 'Testing Download (12-18s)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-400/20 animate-pulse' };
      case 'uploading':
        return { label: 'Testing Upload (18-24s)', color: 'bg-violet-50 text-violet-700 border-violet-200 ring-2 ring-violet-400/20 animate-pulse' };
      case 'completed':
        return { label: 'Speed Test Complete', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' };
      default:
        return { label: 'Ready', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Modern Box Graph Spline Generator for the Full-Width Centerpiece Box
  const generateBoxGraphSpline = (history: number[], width = 600, height = 150) => {
    if (!history || history.length < 2) {
      return {
        stroke: `M 0,${height - 12} L ${width},${height - 12}`,
        fill: `M 0,${height - 12} L ${width},${height - 12} L ${width},${height} L 0,${height} Z`,
        lastX: width,
        lastY: height - 12,
        hasData: false
      };
    }
    const padding = 15;
    const maxVal = Math.max(...history, 1.0);
    const stepX = width / (history.length - 1);
    
    let path = `M 0,${height - ((history[0] / maxVal) * (height - padding * 2)) - padding}`;
    let lastX = 0;
    let lastY = height - padding;
    
    for (let i = 1; i < history.length; i++) {
      const prevX = (i - 1) * stepX;
      const prevY = height - ((history[i - 1] / maxVal) * (height - padding * 2)) - padding;
      const currX = i * stepX;
      const currY = height - ((history[i] / maxVal) * (height - padding * 2)) - padding;
      
      const cpX1 = prevX + (currX - prevX) / 2;
      const cpY1 = prevY;
      const cpX2 = prevX + (currX - prevX) / 2;
      const cpY2 = currY;
      
      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${currX},${currY}`;
      lastX = currX;
      lastY = currY;
    }
    
    const fillPath = `${path} L ${lastX},${height} L 0,${height} Z`;
    return { stroke: path, fill: fillPath, lastX, lastY, hasData: true };
  };

  const getDisplayHistory = (history: number[], isCurrentPhase: boolean, phaseElapsed: number) => {
    if (!isCurrentPhase) return history;
    const progressRatio = Math.min(1.0, (phaseElapsed + 1) / 6);
    const len = Math.max(2, Math.floor(history.length * progressRatio));
    return history.slice(0, len);
  };

  const displayDownloadHistory = getDisplayHistory(downloadSpeedHistory, status === 'downloading', elapsedRef.current - 12);
  const displayUploadHistory = getDisplayHistory(uploadSpeedHistory, status === 'uploading', elapsedRef.current - 18);

  // Active History for Center Box Graph
  const activeHistoryForBox = status === 'uploading' 
    ? displayUploadHistory 
    : (status === 'downloading' ? displayDownloadHistory : (downloadSpeedHistory.length > 0 ? downloadSpeedHistory : uploadSpeedHistory));

  const centerBoxGraph = generateBoxGraphSpline(activeHistoryForBox, 600, 150);
  const badge = getStatusBadge();

  return (
    <div className="w-full max-w-4xl flex flex-col items-center justify-between flex-1 py-2 md:py-4 animate-fade-in h-full min-h-0 select-none mx-auto" id="speed-test-section">
      
      {/* Top Status Pill */}
      <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full mb-3 transition-all duration-300 border text-xs font-bold ${badge.color}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${
          status === 'idle' ? 'bg-slate-400' :
          status === 'pinging' ? 'bg-amber-500 animate-ping' :
          status === 'jittering' ? 'bg-indigo-500 animate-ping' :
          status === 'downloading' ? 'bg-emerald-500 animate-ping' :
          status === 'uploading' ? 'bg-violet-500 animate-ping' :
          'bg-emerald-600'
        }`} />
        <span className="tracking-wide uppercase text-xs font-black">{badge.label}</span>
      </div>

      {/* EXPANSIVE CENTERPIECE: REAL-TIME TELEMETRY GRAPH CONSOLE */}
      <div className="w-full modern-glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-slate-200/90 shadow-xl my-auto min-h-[360px] sm:min-h-[420px]" id="dashboard-dial">
        
        {/* Top Header & Dual Telemetry Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0 transition-colors ${
              status === 'downloading' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
              status === 'uploading' ? 'bg-violet-500 text-white shadow-violet-500/20' :
              'bg-blue-600 text-white shadow-blue-500/20'
            }`}>
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900">Real-Time Bandwidth Matrix</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-widest hidden xs:inline">
                  Live
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Continuous Edge Inbound / Outbound Stream</span>
            </div>
          </div>

          {/* Integrated Download & Upload Telemetry Summary Pills */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Download Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              status === 'downloading' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-1 ring-emerald-400/30' 
                : 'bg-slate-50 border-slate-200/80 text-slate-700'
            }`}>
              <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold uppercase text-slate-400">Download</span>
                <div className="flex items-baseline gap-0.5">
                  <span id="download-val" className="font-sans text-xs font-black text-slate-900">
                    {downloadVal !== null 
                      ? (unit === 'MB/s' ? (downloadVal / 8).toFixed(1) : downloadVal.toFixed(1)) 
                      : (status === 'downloading' 
                        ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                        : '--')}
                  </span>
                  <span className="text-[8px] font-bold text-slate-500">{unit}</span>
                </div>
              </div>
            </div>

            {/* Upload Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              status === 'uploading' 
                ? 'bg-violet-50 border-violet-300 text-violet-800 ring-1 ring-violet-400/30' 
                : 'bg-slate-50 border-slate-200/80 text-slate-700'
            }`}>
              <Upload className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold uppercase text-slate-400">Upload</span>
                <div className="flex items-baseline gap-0.5">
                  <span id="upload-val" className="font-sans text-xs font-black text-slate-900">
                    {uploadVal !== null 
                      ? (unit === 'MB/s' ? (uploadVal / 8).toFixed(1) : uploadVal.toFixed(1)) 
                      : (status === 'uploading' 
                        ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                        : '--')}
                  </span>
                  <span className="text-[8px] font-bold text-slate-500">{unit}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Big Digital Speed Cluster & Primary Action */}
        <div className="flex items-center justify-between my-4 sm:my-6">
          
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Bandwidth Transfer</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span id="speed-val" className="text-5xl sm:text-6xl md:text-7xl font-sans font-black text-slate-900 tracking-tight">
                {(status === 'downloading' || status === 'uploading') 
                  ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                  : (status === 'completed' 
                    ? (unit === 'MB/s' ? ((downloadVal || 0) / 8).toFixed(1) : (downloadVal || 0).toFixed(1)) 
                    : '0.0')}
              </span>
              <span className={`text-sm sm:text-base font-extrabold uppercase tracking-widest ${
                status === 'downloading' ? 'text-emerald-600' :
                status === 'uploading' ? 'text-violet-600' :
                'text-slate-400'
              }`}>
                {unit}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button 
            id="dial-go-button"
            onClick={handleStartTest}
            disabled={status !== 'idle' && status !== 'completed'}
            className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all duration-200 cursor-pointer ${
              status === 'idle' || status === 'completed'
                ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 shadow-slate-900/20' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {status === 'completed' ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Run Test Again</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{status === 'idle' ? 'Start Speed Test' : 'Testing Network...'}</span>
              </>
            )}
          </button>
        </div>

        {/* EXPANSIVE GRAPH WAVEFORM CANVAS */}
        <div className="relative w-full h-32 sm:h-44 bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3 sm:p-4 overflow-hidden flex flex-col justify-end">
          
          {/* Background Grid Lines with threshold markings */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
              <span className="text-[9px] font-mono text-slate-400 -mt-2">Peak Capacity</span>
            </div>
            <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
              <span className="text-[9px] font-mono text-slate-400 -mt-2">50% Threshold</span>
            </div>
            <div className="border-b border-slate-300 w-full flex justify-end">
              <span className="text-[9px] font-mono text-slate-400 -mt-2">Baseline 0</span>
            </div>
          </div>

          {/* SVG Wave Spline */}
          <svg id="download-sparkline" viewBox="0 0 600 150" className="w-full h-full relative z-10 overflow-visible">
            <defs>
              <linearGradient id="mainEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="mainVioletGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Gradient Fill */}
            <path 
              d={centerBoxGraph.fill} 
              fill={status === 'uploading' ? "url(#mainVioletGrad)" : "url(#mainEmeraldGrad)"} 
            />
            
            {/* Curve Line Stroke */}
            <path 
              d={centerBoxGraph.stroke} 
              fill="none" 
              stroke={status === 'uploading' ? "#8B5CF6" : (status === 'downloading' ? "#10B981" : "#94A3B8")} 
              strokeWidth="3" 
              strokeLinecap="round" 
            />

            {/* Glowing Leading Head Dot */}
            {centerBoxGraph.hasData && (status === 'downloading' || status === 'uploading') && (
              <>
                <circle 
                  cx={centerBoxGraph.lastX} 
                  cy={centerBoxGraph.lastY} 
                  r="5" 
                  fill="#FFFFFF" 
                  stroke={status === 'uploading' ? "#8B5CF6" : "#10B981"} 
                  strokeWidth="3" 
                />
                <circle 
                  cx={centerBoxGraph.lastX} 
                  cy={centerBoxGraph.lastY} 
                  r="9" 
                  fill="none" 
                  stroke={status === 'uploading' ? "#8B5CF6" : "#10B981"} 
                  strokeWidth="1.5" 
                  className="animate-ping" 
                />
              </>
            )}
          </svg>
        </div>

      </div>

      {/* MODERN TELEMETRY SUMMARY DOCK */}
      <div className="w-full max-w-4xl modern-glass-card rounded-2xl p-3 sm:py-3.5 sm:px-6 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-0 items-center justify-items-stretch shadow-sm mt-3">
        
        {/* PING (Latency) */}
        <div className="flex items-center gap-3 col-span-1 px-3 py-1 sm:py-0 border-r border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Ping Latency</span>
            <span id="ping-val" className="font-mono text-base sm:text-lg font-extrabold text-slate-900">
              {pingVal !== null ? `${pingVal} ms` : '-- ms'}
            </span>
          </div>
        </div>
        
        {/* JITTER (Variance) */}
        <div className="flex items-center gap-3 col-span-1 px-3 py-1 sm:py-0 md:border-r md:border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Jitter Variance</span>
            <span id="jitter-val" className="font-mono text-base sm:text-lg font-extrabold text-slate-900">
              {jitterVal !== null ? `${jitterVal} ms` : '-- ms'}
            </span>
          </div>
        </div>

        {/* SERVER (Edge Node) */}
        <div className="flex items-center gap-3 col-span-2 md:col-span-1 px-3 border-t border-slate-200/80 md:border-t-0 pt-2.5 md:pt-0 justify-center md:justify-end">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left md:text-right">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Server Node</span>
            <span className="font-sans text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px]">
              Cloudflare Edge CDN
            </span>
          </div>
        </div>

      </div>

      {/* COMPLETED SUCCESS CHIP */}
      {status === 'completed' && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-800 animate-fade-in bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-sans font-bold">Speed test finalized. Results cataloged to history.</span>
        </div>
      )}
    </div>
  );
}
