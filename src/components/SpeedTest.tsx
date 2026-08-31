import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, MapPin, CheckCircle2, Zap, ArrowDownRight, ArrowUpRight, Gauge, Activity } from 'lucide-react';
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
  const [gaugeValue, setGaugeValue] = useState<number>(0); // 0 to 180 (progress normalized)
  const [downloadVal, setDownloadVal] = useState<number | null>(null);
  const [uploadVal, setUploadVal] = useState<number | null>(null);
  const [pingVal, setPingVal] = useState<number | null>(null);
  const [jitterVal, setJitterVal] = useState<number | null>(null);
  
  // Real-time speed curve data points for drawing SVG spline graph
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
            
            const dynamicMax = dnMbps > 950 ? 2500 : (dnMbps > 250 ? 1000 : (dnMbps > 90 ? 300 : 100));
            const rawDegree = (rampedSpeed / dynamicMax) * 140;
            setGaugeValue(Math.min(180, Math.round(rawDegree)));
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
            
            const dynamicMax = upMbps > 950 ? 2500 : (upMbps > 250 ? 1000 : (upMbps > 90 ? 300 : 100));
            const rawDegree = (rampedSpeed / dynamicMax) * 140;
            setGaugeValue(Math.min(180, Math.round(rawDegree)));
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
        setGaugeValue(0);
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
              
              const dynamicMax = dnMbps > 950 ? 2500 : (dnMbps > 250 ? 1000 : (dnMbps > 90 ? 300 : 100));
              const rawDegree = (rampedSpeed / dynamicMax) * 140;
              setGaugeValue(Math.min(180, Math.round(rawDegree)));
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
              
              const dynamicMax = upMbps > 950 ? 2500 : (upMbps > 250 ? 1000 : (upMbps > 90 ? 300 : 100));
              const rawDegree = (rampedSpeed / dynamicMax) * 140;
              setGaugeValue(Math.min(180, Math.round(rawDegree)));
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
    setGaugeValue(0);
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
        return { label: 'Measuring Idle Latency', color: 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-400/20 animate-pulse' };
      case 'jittering':
        return { label: 'Measuring Jitter Variance', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-400/20 animate-pulse' };
      case 'downloading':
        return { label: 'Testing Download Bandwidth', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-400/20 animate-pulse' };
      case 'uploading':
        return { label: 'Testing Upload Bandwidth', color: 'bg-violet-50 text-violet-700 border-violet-200 ring-2 ring-violet-400/20 animate-pulse' };
      case 'completed':
        return { label: 'Speed Test Complete', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' };
      default:
        return { label: 'Ready', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Generate smooth SVG Path
  const generateGraphPath = (history: number[]) => {
    if (history.length < 2) return null;
    const width = 260;
    const height = 48;
    const padding = 4;
    const maxVal = Math.max(...history, 1.0);
    const stepX = width / (history.length - 1);
    
    let path = `M 0,${height}`;
    history.forEach((val, i) => {
      const x = i * stepX;
      const y = height - ((val / maxVal) * (height - padding * 2)) - padding;
      path += ` L ${x},${y}`;
    });
    
    const fillPath = `${path} L ${width},${height} Z`;
    return { stroke: path, fill: fillPath };
  };

  const getDisplayHistory = (history: number[], isCurrentPhase: boolean, phaseElapsed: number) => {
    if (!isCurrentPhase) return history;
    const progressRatio = Math.min(1.0, (phaseElapsed + 1) / 6);
    const len = Math.max(2, Math.floor(history.length * progressRatio));
    return history.slice(0, len);
  };

  const displayDownloadHistory = getDisplayHistory(downloadSpeedHistory, status === 'downloading', elapsedRef.current - 12);
  const displayUploadHistory = getDisplayHistory(uploadSpeedHistory, status === 'uploading', elapsedRef.current - 18);

  const downloadGraphPaths = generateGraphPath(displayDownloadHistory);
  const uploadGraphPaths = generateGraphPath(displayUploadHistory);

  // SVG Gauge Calculations
  // Center 200, 200 | Radius 160
  // Span from 135 deg to 405 deg (270 deg total)
  const drawGaugeArcPath = (filledVal: number) => {
    const center = 200;
    const radius = 155;
    const startAngle = 135;
    const endAngle = 135 + (270 * (filledVal / 180));
    
    const degToRad = (deg: number) => (deg * Math.PI) / 180;
    
    const startX = center + radius * Math.cos(degToRad(startAngle));
    const startY = center + radius * Math.sin(degToRad(startAngle));
    const endX = center + radius * Math.cos(degToRad(endAngle));
    const endY = center + radius * Math.sin(degToRad(endAngle));
    
    const largeArcFlag = (270 * (filledVal / 180)) > 180 ? 1 : 0;
    
    return {
      d: `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      headX: endX,
      headY: endY
    };
  };

  const activeGauge = drawGaugeArcPath(Math.max(2, gaugeValue));
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

      {/* Main Responsive Grid Arena (Download Card, Speedometer, Upload Card) */}
      <div className="grid grid-cols-2 xl:grid-cols-3 items-center justify-items-center gap-4 sm:gap-6 w-full max-w-5xl mb-2 sm:mb-4">
        
        {/* DOWNLOAD BENTO CARD (Modern Emerald Glow) */}
        <div className={`col-span-1 order-2 xl:order-1 modern-glass-card rounded-3xl p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden w-full max-w-xs h-36 sm:h-44 transition-all duration-300 ${
          status === 'downloading' 
            ? 'ring-2 ring-emerald-500/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10' 
            : 'hover:border-emerald-300/80'
        }`}>
          {/* Top Gradient Edge */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-extrabold text-emerald-800 tracking-wider uppercase block">Download</span>
                <span className="text-[10px] text-slate-400 font-medium">Inbound stream</span>
              </div>
            </div>
            {status === 'downloading' && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
 
          <div className="flex items-baseline gap-1.5 mt-auto z-10">
            <span id="download-val" className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {downloadVal !== null 
                ? (unit === 'MB/s' ? (downloadVal / 8).toFixed(1) : downloadVal.toFixed(1)) 
                : (status === 'downloading' 
                  ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                  : '--')}
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 uppercase">{unit}</span>
          </div>
 
          {/* Smooth Dynamic Area Sparkline */}
          {(status === 'downloading' || status === 'uploading' || status === 'completed') && downloadGraphPaths && (
            <div className="absolute bottom-1 left-4 right-4 h-10 sm:h-12 opacity-85 pointer-events-none">
              <svg id="download-sparkline" viewBox="0 0 260 48" className="w-full h-full overflow-visible">
                <path d={downloadGraphPaths.fill} fill="url(#modernDnGrad)" opacity="0.2" />
                <path d={downloadGraphPaths.stroke} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="modernDnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
 
        {/* MODERN CENTRAL SPEEDOMETER GAUGE */}
        <div className="col-span-2 xl:col-span-1 order-1 xl:order-2 relative w-[260px] xs:w-[300px] sm:w-[360px] h-[260px] xs:h-[300px] sm:h-[360px] flex items-center justify-center" id="dashboard-dial">
          
          {/* SVG Circular Radial Gauge */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
            <defs>
              {/* Active Sweeper Gradient for Download */}
              <linearGradient id="gaugeEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              {/* Active Sweeper Gradient for Upload */}
              <linearGradient id="gaugeVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background Track Arc */}
            <path 
              d="M 90.4 309.6 A 155 155 0 1 1 309.6 309.6" 
              fill="none" 
              stroke="#E2E8F0" 
              strokeLinecap="round" 
              strokeWidth="10"
            />

            {/* Scale Gauge Indicator Ticks */}
            <g opacity="0.4" stroke="#94A3B8" strokeWidth="1.5">
              <line x1="200" x2="200" y1="35" y2="45" />
              <line x1="45" x2="55" y1="200" y2="200" />
              <line x1="355" x2="345" y1="200" y2="200" />
              <line x1="90" x2="98" y1="90" y2="98" />
              <line x1="310" x2="302" y1="90" y2="98" />
              <line x1="120" x2="126" y1="280" y2="274" />
              <line x1="280" x2="274" y1="280" y2="274" />
            </g>

            {/* Active Sweeper Trail */}
            {(status === 'downloading' || status === 'uploading') && (
              <>
                <path 
                  className="transition-all duration-100"
                  d={activeGauge.d}
                  fill="none" 
                  stroke={status === 'downloading' ? "url(#gaugeEmeraldGrad)" : "url(#gaugeVioletGrad)"} 
                  strokeLinecap="round" 
                  strokeWidth="12"
                  filter="url(#glowEffect)"
                />
                {/* Glowing Leading Head Circle */}
                <circle 
                  cx={activeGauge.headX} 
                  cy={activeGauge.headY} 
                  r="6" 
                  fill="#FFFFFF" 
                  stroke={status === 'downloading' ? "#10B981" : "#8B5CF6"} 
                  strokeWidth="3"
                  className="shadow-md"
                />
              </>
            )}
          </svg>
  
          {/* Center Digital Cluster & Floating Trigger Action */}
          <div className="flex flex-col items-center justify-center relative z-10 text-center w-full h-full pt-4">
            
            {/* Speed Readout */}
            <span id="speed-val" className="text-4xl xs:text-5xl sm:text-6xl font-sans font-black text-slate-900 tracking-tighter transition-all duration-200">
              {(status === 'downloading' || status === 'uploading') 
                ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                : (status === 'completed' 
                  ? (unit === 'MB/s' ? ((downloadVal || 0) / 8).toFixed(1) : (downloadVal || 0).toFixed(1)) 
                  : '0.0')}
            </span>
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[11px] font-extrabold uppercase tracking-widest ${
                status === 'downloading' ? 'text-emerald-600' :
                status === 'uploading' ? 'text-violet-600' :
                'text-slate-400'
              }`}>
                {unit}
              </span>
            </div>
            
            {/* Modern Floating Action Button */}
            <div className="mt-5 sm:mt-7">
              <button 
                id="dial-go-button"
                onClick={handleStartTest}
                disabled={status !== 'idle' && status !== 'completed'}
                className={`relative w-20 h-20 xs:w-24 xs:h-24 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all duration-300 group cursor-pointer ${
                  status === 'idle' || status === 'completed'
                    ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 shadow-slate-900/20' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {/* Pulse Glow when Idle/Finished */}
                {(status === 'idle' || status === 'completed') && (
                  <div className="absolute inset-0 rounded-full bg-slate-900 animate-pulse-ring -z-10"></div>
                )}
                
                <span className="font-sans text-sm sm:text-base font-black tracking-widest text-white group-hover:scale-105 transition-transform">
                  {status === 'idle' ? 'START' : (status === 'completed' ? 'AGAIN' : 'TESTING')}
                </span>
                
                {status === 'pinging' && (
                  <span className="text-[9px] font-extrabold text-amber-400 mt-0.5 uppercase tracking-wider animate-pulse">PING</span>
                )}
                {status === 'jittering' && (
                  <span className="text-[9px] font-extrabold text-indigo-400 mt-0.5 uppercase tracking-wider animate-pulse">JITTER</span>
                )}
                {status === 'downloading' && (
                  <span className="text-[9px] font-extrabold text-emerald-400 mt-0.5 uppercase tracking-wider animate-pulse">DOWN</span>
                )}
                {status === 'uploading' && (
                  <span className="text-[9px] font-extrabold text-violet-400 mt-0.5 uppercase tracking-wider animate-pulse">UP</span>
                )}
              </button>
            </div>
          </div>
        </div>
 
        {/* UPLOAD BENTO CARD (Modern Violet Glow) */}
        <div className={`col-span-1 order-3 xl:order-3 modern-glass-card rounded-3xl p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden w-full max-w-xs h-36 sm:h-44 transition-all duration-300 ${
          status === 'uploading' 
            ? 'ring-2 ring-violet-500/40 border-violet-500/60 shadow-lg shadow-violet-500/10' 
            : 'hover:border-violet-300/80'
        }`}>
          {/* Top Gradient Edge */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-purple-400 to-transparent"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-extrabold text-violet-800 tracking-wider uppercase block">Upload</span>
                <span className="text-[10px] text-slate-400 font-medium">Outbound stream</span>
              </div>
            </div>
            {status === 'uploading' && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
            )}
          </div>
 
          <div className="flex items-baseline gap-1.5 mt-auto z-10">
            <span id="upload-val" className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {uploadVal !== null 
                ? (unit === 'MB/s' ? (uploadVal / 8).toFixed(1) : uploadVal.toFixed(1)) 
                : (status === 'uploading' 
                  ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                  : '--')}
            </span>
            <span className="text-xs sm:text-sm font-bold text-violet-600 uppercase">{unit}</span>
          </div>
 
          {/* Smooth Dynamic Area Sparkline */}
          {(status === 'uploading' || status === 'completed') && uploadGraphPaths && (
            <div className="absolute bottom-1 left-4 right-4 h-10 sm:h-12 opacity-85 pointer-events-none">
              <svg id="upload-sparkline" viewBox="0 0 260 48" className="w-full h-full overflow-visible">
                <path d={uploadGraphPaths.fill} fill="url(#modernUpGrad)" opacity="0.2" />
                <path d={uploadGraphPaths.stroke} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="modernUpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
 
      </div>

      {/* MODERN TELEMETRY SUMMARY DOCK */}
      <div className="w-full max-w-4xl modern-glass-card rounded-2xl p-3 sm:py-3.5 sm:px-6 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-0 items-center justify-items-stretch shadow-sm mt-auto md:mt-2">
        
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
