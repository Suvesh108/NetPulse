import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, MapPin, CheckCircle2, Zap, Activity, Gauge, BarChart2, Radio, Play, RotateCcw } from 'lucide-react';
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

  // Modern Box-like Graph Spline Generator for all 3 Bento Boxes
  const generateBoxGraphSpline = (history: number[], width = 360, height = 110) => {
    if (!history || history.length < 2) {
      return {
        stroke: `M 0,${height - 10} L ${width},${height - 10}`,
        fill: `M 0,${height - 10} L ${width},${height - 10} L ${width},${height} L 0,${height} Z`,
        lastX: width,
        lastY: height - 10,
        hasData: false
      };
    }
    const padding = 10;
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

  const downloadBoxGraph = generateBoxGraphSpline(displayDownloadHistory, 360, 100);
  const uploadBoxGraph = generateBoxGraphSpline(displayUploadHistory, 360, 100);

  // Active History for Center Box Graph
  const activeHistoryForBox = status === 'uploading' 
    ? displayUploadHistory 
    : (status === 'downloading' ? displayDownloadHistory : (downloadSpeedHistory.length > 0 ? downloadSpeedHistory : uploadSpeedHistory));

  const centerBoxGraph = generateBoxGraphSpline(activeHistoryForBox, 360, 100);
  const badge = getStatusBadge();

  return (
    <div className="w-full flex flex-col items-center justify-between flex-1 py-1 md:py-2 animate-fade-in h-full min-h-0 select-none" id="speed-test-section">
      
      {/* Modern Status Pill */}
      <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-2 transition-all duration-300 border text-xs font-bold ${badge.color}`}>
        <div className={`w-2 h-2 rounded-full ${
          status === 'idle' ? 'bg-slate-400' :
          status === 'pinging' ? 'bg-amber-500 animate-ping' :
          status === 'jittering' ? 'bg-indigo-500 animate-ping' :
          status === 'downloading' ? 'bg-emerald-500 animate-ping' :
          status === 'uploading' ? 'bg-violet-500 animate-ping' :
          'bg-emerald-600'
        }`} />
        <span className="tracking-wide uppercase text-[11px] font-extrabold">{badge.label}</span>
      </div>

      {/* Main Responsive Grid Arena (Download Box, Center Console Box, Upload Box) with Matching Heights & Balanced Alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch justify-items-center gap-4 sm:gap-6 w-full max-w-5xl mb-2 sm:mb-4">
        
        {/* DOWNLOAD TELEMETRY BENTO BOX (Emerald) */}
        <div className={`col-span-1 order-2 xl:order-1 w-full max-w-sm modern-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden border border-slate-200/90 shadow-md h-[270px] xs:h-[290px] sm:h-[310px] xl:h-[330px] transition-all duration-300 ${
          status === 'downloading' 
            ? 'ring-2 ring-emerald-500/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10' 
            : 'hover:border-emerald-300/80'
        }`}>
          {/* Top Gradient Edge */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent"></div>
          
          {/* Box Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-emerald-800 tracking-wider uppercase block">Download Stream</span>
                <span className="text-[10px] text-slate-400 font-medium">Inbound Bandwidth</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {status === 'downloading' ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                  {downloadVal !== null ? 'LOGGED' : 'IDLE'}
                </span>
              )}
            </div>
          </div>
 
          {/* Clean Metric Readout */}
          <div className="flex items-baseline justify-between my-auto pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inbound Transfer Rate</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span id="download-val" className="font-sans text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {downloadVal !== null 
                    ? (unit === 'MB/s' ? (downloadVal / 8).toFixed(1) : downloadVal.toFixed(1)) 
                    : (status === 'downloading' 
                      ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                      : '--')}
                </span>
                <span className="text-xs font-bold text-emerald-600 uppercase">{unit}</span>
              </div>
            </div>
          </div>
 
          {/* Dedicated Mini Graph Matrix Structure */}
          <div className="relative w-full h-24 sm:h-28 bg-slate-50/90 rounded-2xl border border-slate-200/80 p-2 overflow-hidden flex flex-col justify-end">
            <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">Max</span>
              </div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">50%</span>
              </div>
              <div className="border-b border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">0</span>
              </div>
            </div>

            <svg id="download-sparkline" viewBox="0 0 360 100" className="w-full h-full relative z-10 overflow-visible">
              <defs>
                <linearGradient id="boxDnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path 
                d={downloadBoxGraph.fill} 
                fill="url(#boxDnGrad)" 
              />
              
              <path 
                d={downloadBoxGraph.stroke} 
                fill="none" 
                stroke={downloadBoxGraph.hasData ? "#10B981" : "#CBD5E1"} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {downloadBoxGraph.hasData && (status === 'downloading' || status === 'uploading' || status === 'completed') && (
                <>
                  <circle 
                    cx={downloadBoxGraph.lastX} 
                    cy={downloadBoxGraph.lastY} 
                    r="4.5" 
                    fill="#FFFFFF" 
                    stroke="#10B981" 
                    strokeWidth="2.5" 
                  />
                  {status === 'downloading' && (
                    <circle 
                      cx={downloadBoxGraph.lastX} 
                      cy={downloadBoxGraph.lastY} 
                      r="8" 
                      fill="none" 
                      stroke="#10B981" 
                      strokeWidth="1.5" 
                      className="animate-ping" 
                    />
                  )}
                </>
              )}
            </svg>
          </div>
        </div>
 
        {/* CENTERPIECE: MASTER BANDWIDTH TELEMETRY CONSOLE */}
        <div className="col-span-1 md:col-span-2 xl:col-span-1 order-1 xl:order-2 w-full max-w-sm modern-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden border border-slate-200/90 shadow-lg h-[270px] xs:h-[290px] sm:h-[310px] xl:h-[330px]" id="dashboard-dial">
          
          {/* Top Header of the Box Graph */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                status === 'downloading' ? 'bg-emerald-50 text-emerald-600' :
                status === 'uploading' ? 'bg-violet-50 text-violet-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 block">Bandwidth Telemetry</span>
                <span className="text-[10px] text-slate-400 font-medium">Real-time Stream</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                status === 'downloading' ? 'bg-emerald-100 text-emerald-700 animate-pulse' :
                status === 'uploading' ? 'bg-violet-100 text-violet-700 animate-pulse' :
                status === 'pinging' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                status === 'jittering' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                'bg-slate-100 text-slate-600'
              }`}>
                {status === 'downloading' ? 'STREAM DOWN' :
                 status === 'uploading' ? 'STREAM UP' :
                 status === 'pinging' ? 'PING' :
                 status === 'jittering' ? 'JITTER' :
                 'READY'}
              </span>
            </div>
          </div>

          {/* Large Center Numerical Display */}
          <div className="flex items-baseline justify-between my-auto pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Speed</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span id="speed-val" className="font-sans text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {(status === 'downloading' || status === 'uploading') 
                    ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                    : (status === 'completed' 
                      ? (unit === 'MB/s' ? ((downloadVal || 0) / 8).toFixed(1) : (downloadVal || 0).toFixed(1)) 
                      : '0.0')}
                </span>
                <span className={`text-xs font-bold uppercase ${
                  status === 'downloading' ? 'text-emerald-600' :
                  status === 'uploading' ? 'text-violet-600' :
                  'text-slate-500'
                }`}>
                  {unit}
                </span>
              </div>
            </div>

            {/* Quick Action Button in Box */}
            <button 
              id="dial-go-button"
              onClick={handleStartTest}
              disabled={status !== 'idle' && status !== 'completed'}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all duration-200 cursor-pointer ${
                status === 'idle' || status === 'completed'
                  ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/20' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {status === 'completed' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retest</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{status === 'idle' ? 'Start Test' : 'Running...'}</span>
                </>
              )}
            </button>
          </div>

          {/* BOX GRAPH MATRIX & WAVEFORM AREA */}
          <div className="relative w-full h-24 sm:h-28 bg-slate-50/90 rounded-2xl border border-slate-200/80 p-2 overflow-hidden flex flex-col justify-end">
            
            {/* Background Grid Lines with threshold markings */}
            <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">100%</span>
              </div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">50%</span>
              </div>
              <div className="border-b border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">0</span>
              </div>
            </div>

            {/* SVG Wave Spline */}
            <svg viewBox="0 0 360 100" className="w-full h-full relative z-10 overflow-visible">
              <defs>
                <linearGradient id="boxEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="boxVioletGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Gradient Fill */}
              <path 
                d={centerBoxGraph.fill} 
                fill={status === 'uploading' ? "url(#boxVioletGrad)" : "url(#boxEmeraldGrad)"} 
              />
              
              {/* Curve Line Stroke */}
              <path 
                d={centerBoxGraph.stroke} 
                fill="none" 
                stroke={status === 'uploading' ? "#8B5CF6" : (status === 'downloading' ? "#10B981" : "#94A3B8")} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Glowing Leading Head Dot */}
              {centerBoxGraph.hasData && (status === 'downloading' || status === 'uploading') && (
                <>
                  <circle 
                    cx={centerBoxGraph.lastX} 
                    cy={centerBoxGraph.lastY} 
                    r="4.5" 
                    fill="#FFFFFF" 
                    stroke={status === 'uploading' ? "#8B5CF6" : "#10B981"} 
                    strokeWidth="2.5" 
                  />
                  <circle 
                    cx={centerBoxGraph.lastX} 
                    cy={centerBoxGraph.lastY} 
                    r="8" 
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
 
        {/* UPLOAD TELEMETRY BENTO BOX (Violet) */}
        <div className={`col-span-1 order-3 xl:order-3 w-full max-w-sm modern-glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden border border-slate-200/90 shadow-md h-[270px] xs:h-[290px] sm:h-[310px] xl:h-[330px] transition-all duration-300 ${
          status === 'uploading' 
            ? 'ring-2 ring-violet-500/40 border-violet-500/60 shadow-lg shadow-violet-500/10' 
            : 'hover:border-violet-300/80'
        }`}>
          {/* Top Gradient Edge */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-purple-400 to-transparent"></div>
          
          {/* Box Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-violet-800 tracking-wider uppercase block">Upload Stream</span>
                <span className="text-[10px] text-slate-400 font-medium">Outbound Bandwidth</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {status === 'uploading' ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span> ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                  {uploadVal !== null ? 'LOGGED' : 'IDLE'}
                </span>
              )}
            </div>
          </div>
 
          {/* Clean Metric Readout */}
          <div className="flex items-baseline justify-between my-auto pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outbound Transfer Rate</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span id="upload-val" className="font-sans text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {uploadVal !== null 
                    ? (unit === 'MB/s' ? (uploadVal / 8).toFixed(1) : uploadVal.toFixed(1)) 
                    : (status === 'uploading' 
                      ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                      : '--')}
                </span>
                <span className="text-xs font-bold text-violet-600 uppercase">{unit}</span>
              </div>
            </div>
          </div>
 
          {/* Dedicated Mini Graph Matrix Structure */}
          <div className="relative w-full h-24 sm:h-28 bg-slate-50/90 rounded-2xl border border-slate-200/80 p-2 overflow-hidden flex flex-col justify-end">
            <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">Max</span>
              </div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">50%</span>
              </div>
              <div className="border-b border-slate-300 w-full flex justify-end">
                <span className="text-[8px] font-mono text-slate-400 -mt-2">0</span>
              </div>
            </div>

            <svg id="upload-sparkline" viewBox="0 0 360 100" className="w-full h-full relative z-10 overflow-visible">
              <defs>
                <linearGradient id="boxUpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path 
                d={uploadBoxGraph.fill} 
                fill="url(#boxUpGrad)" 
              />
              
              <path 
                d={uploadBoxGraph.stroke} 
                fill="none" 
                stroke={uploadBoxGraph.hasData ? "#8B5CF6" : "#CBD5E1"} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {uploadBoxGraph.hasData && (status === 'uploading' || status === 'completed') && (
                <>
                  <circle 
                    cx={uploadBoxGraph.lastX} 
                    cy={uploadBoxGraph.lastY} 
                    r="4.5" 
                    fill="#FFFFFF" 
                    stroke="#8B5CF6" 
                    strokeWidth="2.5" 
                  />
                  {status === 'uploading' && (
                    <circle 
                      cx={uploadBoxGraph.lastX} 
                      cy={uploadBoxGraph.lastY} 
                      r="8" 
                      fill="none" 
                      stroke="#8B5CF6" 
                      strokeWidth="1.5" 
                      className="animate-ping" 
                    />
                  )}
                </>
              )}
            </svg>
          </div>
        </div>
 
      </div>

      {/* MODERN TELEMETRY SUMMARY DOCK */}
      <div className="w-full max-w-5xl modern-glass-card rounded-2xl p-3 sm:py-3.5 sm:px-6 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-0 items-center justify-items-stretch shadow-sm mt-auto md:mt-2">
        
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
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-800 animate-fade-in bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-sans font-bold">Speed test finalized. Results cataloged to history.</span>
        </div>
      )}
    </div>
  );
}
