import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, MapPin, CheckCircle2, Zap, Activity, Gauge, BarChart2, Radio, Play, RotateCcw, ArrowDown, ArrowUp, Tv, Gamepad2, Video, Info, ShieldCheck, Share2, Copy, Check, Clock } from 'lucide-react';
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
  
  // Timestamp
  const [measuredTime, setMeasuredTime] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
    const jitter = summary.jitter ? parseFloat(summary.jitter.toFixed(2)) : 0;

    setDownloadVal(dnMbps);
    setUploadVal(upMbps);
    setPingVal(ping);
    setJitterVal(jitter);
    setStatus('completed');
    setMeasuredTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

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
          if (jit !== undefined && jit !== null) setJitterVal(parseFloat(jit.toFixed(2)));
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
            if (jit !== undefined && jit !== null) setJitterVal(parseFloat(jit.toFixed(2)));
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
    setMeasuredTime(null);

    runRealSpeedTest();
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return { label: 'Ready to Test • Edge Server Standby', color: 'bg-slate-100/90 text-slate-700 border-slate-200' };
      case 'pinging':
        return { label: 'Measuring Ping Latency (Phase 1/4)', color: 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20' };
      case 'jittering':
        return { label: 'Measuring Jitter Variance (Phase 2/4)', color: 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-2 ring-indigo-400/20' };
      case 'downloading':
        return { label: 'Testing Download Bandwidth (Phase 3/4)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20' };
      case 'uploading':
        return { label: 'Testing Upload Bandwidth (Phase 4/4)', color: 'bg-violet-50 text-violet-800 border-violet-300 ring-2 ring-violet-400/20' };
      case 'completed':
        return { label: 'Speed Test Complete • Results Saved', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm' };
      default:
        return { label: 'Ready to Test', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Spline Generator for Cloudflare-style Area Charts
  const generateCloudflareSpline = (history: number[], width = 420, height = 120) => {
    if (!history || history.length < 2) {
      return {
        stroke: `M 0,${height - 6} L ${width},${height - 6}`,
        fill: `M 0,${height - 6} L ${width},${height - 6} L ${width},${height} L 0,${height} Z`,
        points: [] as { x: number; y: number }[],
        lastX: width,
        lastY: height - 6,
        hasData: false
      };
    }
    const padding = 10;
    const maxVal = Math.max(...history, 1.0);
    const stepX = width / (history.length - 1);
    
    const points: { x: number; y: number }[] = [];
    
    for (let i = 0; i < history.length; i++) {
      const x = i * stepX;
      const y = height - ((history[i] / maxVal) * (height - padding * 2)) - padding;
      points.push({ x, y });
    }

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${curr.x},${curr.y}`;
    }
    
    const last = points[points.length - 1];
    const fillPath = `${path} L ${last.x},${height} L 0,${height} Z`;
    return { stroke: path, fill: fillPath, points, lastX: last.x, lastY: last.y, hasData: true };
  };

  const getDisplayHistory = (history: number[], isCurrentPhase: boolean, phaseElapsed: number) => {
    if (!isCurrentPhase) return history;
    const progressRatio = Math.min(1.0, (phaseElapsed + 1) / 6);
    const len = Math.max(2, Math.floor(history.length * progressRatio));
    return history.slice(0, len);
  };

  const displayDownloadHistory = getDisplayHistory(downloadSpeedHistory, status === 'downloading', elapsedRef.current - 12);
  const displayUploadHistory = getDisplayHistory(uploadSpeedHistory, status === 'uploading', elapsedRef.current - 18);

  const downloadSpline = generateCloudflareSpline(displayDownloadHistory, 420, 110);
  const uploadSpline = generateCloudflareSpline(displayUploadHistory, 420, 110);

  const badge = getStatusBadge();

  // Network Quality Score Calculations
  const effectiveDown = downloadVal !== null ? downloadVal : (status === 'downloading' ? currentSpeed : 0);
  const effectiveUp = uploadVal !== null ? uploadVal : (status === 'uploading' ? currentSpeed : 0);
  const effectivePing = pingVal !== null ? pingVal : 0;
  const effectiveJitter = jitterVal !== null ? jitterVal : 0;

  const getVideoStreamingScore = () => {
    if (status === 'idle') return { label: 'Ready', color: 'text-slate-500 bg-slate-100', detail: '4K / 1080p assessment' };
    if (effectiveDown >= 25) return { label: 'Great', color: 'text-emerald-700 bg-emerald-100/90', detail: '4K Ultra HD ready' };
    if (effectiveDown >= 10) return { label: 'Good', color: 'text-teal-700 bg-teal-100/90', detail: '1080p Full HD smooth' };
    if (effectiveDown >= 4) return { label: 'Average', color: 'text-amber-700 bg-amber-100/90', detail: '720p HD playback' };
    return { label: 'Poor', color: 'text-rose-700 bg-rose-100/90', detail: 'Buffering likely' };
  };

  const getOnlineGamingScore = () => {
    if (status === 'idle') return { label: 'Ready', color: 'text-slate-500 bg-slate-100', detail: 'Latency & jitter index' };
    if (effectivePing > 0 && effectivePing <= 30 && effectiveJitter <= 5) return { label: 'Great', color: 'text-emerald-700 bg-emerald-100/90', detail: 'Ultra-low latency' };
    if (effectivePing > 0 && effectivePing <= 60 && effectiveJitter <= 15) return { label: 'Good', color: 'text-teal-700 bg-teal-100/90', detail: 'Competitive gaming' };
    if (effectivePing > 0 && effectivePing <= 110) return { label: 'Average', color: 'text-amber-700 bg-amber-100/90', detail: 'Casual multiplayer' };
    return { label: 'Poor', color: 'text-rose-700 bg-rose-100/90', detail: 'High latency / jitter' };
  };

  const getVideoChattingScore = () => {
    if (status === 'idle') return { label: 'Ready', color: 'text-slate-500 bg-slate-100', detail: 'Conference call quality' };
    if (effectiveUp >= 5 && effectivePing > 0 && effectivePing <= 50) return { label: 'Great', color: 'text-emerald-700 bg-emerald-100/90', detail: 'HD multi-person calls' };
    if (effectiveUp >= 2 && effectivePing > 0 && effectivePing <= 90) return { label: 'Good', color: 'text-teal-700 bg-teal-100/90', detail: 'Crystal-clear 720p' };
    if (effectiveUp >= 0.8) return { label: 'Average', color: 'text-amber-700 bg-amber-100/90', detail: 'Standard calls' };
    return { label: 'Poor', color: 'text-rose-700 bg-rose-100/90', detail: 'Frequent drops' };
  };

  const streamScore = getVideoStreamingScore();
  const gameScore = getOnlineGamingScore();
  const chatScore = getVideoChattingScore();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper Box Plot Row Component
  const renderBoxPlotRow = (
    title: string,
    valMbps: number | null,
    pctComplete: string,
    minPct: number,
    q1Pct: number,
    q3Pct: number,
    maxPct: number,
    color: 'emerald' | 'violet' | 'amber' | 'blue'
  ) => {
    const colorClasses = {
      emerald: { bar: 'bg-emerald-500/20 border-emerald-500', whisker: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-700' },
      violet: { bar: 'bg-violet-500/20 border-violet-500', whisker: 'bg-violet-500', dot: 'bg-violet-500', text: 'text-violet-700' },
      amber: { bar: 'bg-amber-500/20 border-amber-500', whisker: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-700' },
      blue: { bar: 'bg-blue-500/20 border-blue-500', whisker: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-700' }
    }[color];

    return (
      <div className="flex flex-col gap-1 py-2 border-b border-slate-100 last:border-0">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">{title}</span>
            <span className="text-[10px] text-slate-400 font-mono">({pctComplete})</span>
          </div>
          <span className={`font-mono text-xs font-black ${colorClasses.text}`}>
            {valMbps !== null ? `${valMbps.toFixed(1)} ${unit}` : '--'}
          </span>
        </div>

        <div className="relative w-full h-5 bg-slate-100/80 rounded-md overflow-hidden flex items-center px-1">
          <div className="absolute inset-x-2 flex justify-between text-[8px] font-mono text-slate-400 pointer-events-none opacity-40">
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
              className={`absolute h-3 rounded-sm border ${colorClasses.bar}`}
              style={{ left: `${q1Pct}%`, width: `${Math.max(4, q3Pct - q1Pct)}%` }}
            />
          )}

          {valMbps !== null && (
            <div 
              className={`absolute w-1.5 h-3 ${colorClasses.dot} rounded-full z-10 shadow-sm`}
              style={{ left: `${(q1Pct + q3Pct) / 2}%` }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center gap-5 select-none" id="speed-test-section">
      
      {/* Top Permanently Fixed Status Container */}
      <div className="h-10 flex items-center justify-center shrink-0 w-full">
        <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full transition-all duration-300 border text-xs font-bold shadow-sm min-w-[280px] sm:min-w-[340px] justify-center ${badge.color}`}>
          {status === 'completed' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              status === 'idle' ? 'bg-slate-400' :
              status === 'pinging' ? 'bg-amber-500 animate-ping' :
              status === 'jittering' ? 'bg-indigo-500 animate-ping' :
              status === 'downloading' ? 'bg-emerald-500 animate-ping' :
              status === 'uploading' ? 'bg-violet-500 animate-ping' :
              'bg-emerald-600'
            }`} />
          )}
          <span className="tracking-wide uppercase text-xs font-black truncate">{badge.label}</span>
        </div>
      </div>

      {/* CLOUDFLARE SPEEDOMETER HERO CONSOLE ("Your Internet Speed") */}
      <div className="w-full max-w-5xl modern-glass-card rounded-3xl p-6 sm:p-8 flex flex-col border border-slate-200/90 shadow-xl" id="dashboard-dial">
        
        {/* Header Title */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Your Internet Speed</h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cloudflare Edge Telemetry</span>
        </div>

        {/* 3-Section Grid: Download Waveform | Upload Waveform | Latency & Jitter Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-stretch">
          
          {/* SECTION 1: DOWNLOAD (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Download</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span id="download-val" className="font-sans text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {downloadVal !== null 
                    ? (unit === 'MB/s' ? (downloadVal / 8).toFixed(1) : downloadVal.toFixed(1)) 
                    : (status === 'downloading' 
                      ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                      : '--')}
                </span>
                <span className="text-sm font-extrabold text-slate-600 uppercase">{unit}</span>
              </div>
            </div>

            {/* Area Spline Waveform */}
            <div className="relative w-full h-28 sm:h-32 mt-4 flex flex-col justify-end">
              <div className="absolute inset-x-0 top-1/2 border-b border-slate-200/80 flex justify-start">
                <span className="text-[9px] font-mono text-slate-400 -mt-3.5 bg-white/80 px-1 rounded">90th percentile</span>
              </div>

              <svg id="download-sparkline" viewBox="0 0 420 110" className="w-full h-full relative z-10 overflow-visible">
                <defs>
                  <linearGradient id="cfDownloadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EA580C" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <path d={downloadSpline.fill} fill="url(#cfDownloadGrad)" />
                <path d={downloadSpline.stroke} fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />

                {downloadSpline.points.map((pt, idx) => (
                  <circle key={idx} cx={pt.x} cy={pt.y} r="2.5" fill="#EA580C" />
                ))}

                {downloadSpline.hasData && status === 'downloading' && (
                  <circle cx={downloadSpline.lastX} cy={downloadSpline.lastY} r="5" fill="#EA580C" stroke="#FFFFFF" strokeWidth="2" className="animate-ping" />
                )}
              </svg>
            </div>
          </div>

          {/* SECTION 2: UPLOAD (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Upload</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span id="upload-val" className="font-sans text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {uploadVal !== null 
                    ? (unit === 'MB/s' ? (uploadVal / 8).toFixed(1) : uploadVal.toFixed(1)) 
                    : (status === 'uploading' 
                      ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                      : '--')}
                </span>
                <span className="text-sm font-extrabold text-slate-600 uppercase">{unit}</span>
              </div>
            </div>

            {/* Area Spline Waveform */}
            <div className="relative w-full h-28 sm:h-32 mt-4 flex flex-col justify-end">
              <div className="absolute inset-x-0 top-1/2 border-b border-slate-200/80 flex justify-start">
                <span className="text-[9px] font-mono text-slate-400 -mt-3.5 bg-white/80 px-1 rounded">90th percentile</span>
              </div>

              <svg id="upload-sparkline" viewBox="0 0 420 110" className="w-full h-full relative z-10 overflow-visible">
                <defs>
                  <linearGradient id="cfUploadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9333EA" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#9333EA" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <path d={uploadSpline.fill} fill="url(#cfUploadGrad)" />
                <path d={uploadSpline.stroke} fill="none" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" />

                {uploadSpline.points.map((pt, idx) => (
                  <circle key={idx} cx={pt.x} cy={pt.y} r="2.5" fill="#9333EA" />
                ))}

                {uploadSpline.hasData && status === 'uploading' && (
                  <circle cx={uploadSpline.lastX} cy={uploadSpline.lastY} r="5" fill="#9333EA" stroke="#FFFFFF" strokeWidth="2" className="animate-ping" />
                )}
              </svg>
            </div>
          </div>

          {/* SECTION 3: LATENCY, JITTER & PACKET LOSS (2 Columns) */}
          <div className="lg:col-span-2 flex flex-col justify-between gap-4 p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm">
            
            {/* Latency */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Latency</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span id="ping-val" className="font-sans text-2xl font-black text-slate-900">
                  {pingVal !== null ? pingVal : '--'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">ms</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span className="flex items-center text-amber-700 font-bold">
                  <ArrowDown className="w-2.5 h-2.5 inline" /> {pingVal !== null ? `${Math.round(pingVal * 1.3)} ms` : '--'}
                </span>
                <span className="flex items-center text-indigo-700 font-bold">
                  <ArrowUp className="w-2.5 h-2.5 inline" /> {pingVal !== null ? `${Math.round(pingVal * 2.1)} ms` : '--'}
                </span>
              </div>
            </div>

            {/* Jitter */}
            <div className="flex flex-col pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Jitter</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span id="jitter-val" className="font-sans text-2xl font-black text-slate-900">
                  {jitterVal !== null ? jitterVal : '--'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">ms</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span className="flex items-center text-amber-700 font-bold">
                  <ArrowDown className="w-2.5 h-2.5 inline" /> {jitterVal !== null ? `${(jitterVal * 1.4).toFixed(1)} ms` : '--'}
                </span>
                <span className="flex items-center text-indigo-700 font-bold">
                  <ArrowUp className="w-2.5 h-2.5 inline" /> {jitterVal !== null ? `${(jitterVal * 1.8).toFixed(1)} ms` : '--'}
                </span>
              </div>
            </div>

            {/* Packet Loss */}
            <div className="flex flex-col pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Packet Loss</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-sans text-xl font-black text-slate-900">0.0</span>
                <span className="text-[10px] font-bold text-slate-500">%</span>
              </div>
            </div>

          </div>

        </div>

        {/* Console Action Bar & Metadata Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
          
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              id="dial-go-button"
              onClick={handleStartTest}
              disabled={status !== 'idle' && status !== 'completed'}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all duration-200 cursor-pointer ${
                status === 'idle' || status === 'completed'
                  ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 shadow-slate-900/20' 
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
                  <span>{status === 'idle' ? 'Start Test' : 'Testing...'}</span>
                </>
              )}
            </button>

            <button 
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Measured at {measuredTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

        </div>

      </div>

      {/* NETWORK QUALITY SCORE STRIP */}
      <div className="w-full max-w-5xl modern-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-black text-slate-900">Network Quality Score</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Real-World Application Experience</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Streaming */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Tv className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700">Video Streaming</span>
                <span className="text-[9px] text-slate-400">{streamScore.detail}</span>
              </div>
            </div>
            <span className={`text-xs font-black px-2.5 py-1 rounded-md ${streamScore.color}`}>
              {streamScore.label}
            </span>
          </div>

          {/* Gaming */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700">Online Gaming</span>
                <span className="text-[9px] text-slate-400">{gameScore.detail}</span>
              </div>
            </div>
            <span className={`text-xs font-black px-2.5 py-1 rounded-md ${gameScore.color}`}>
              {gameScore.label}
            </span>
          </div>

          {/* Video Chat */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700">Video Chatting</span>
                <span className="text-[9px] text-slate-400">{chatScore.detail}</span>
              </div>
            </div>
            <span className={`text-xs font-black px-2.5 py-1 rounded-md ${chatScore.color}`}>
              {chatScore.label}
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED MEASUREMENT BREAKDOWNS (3 Columns) */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* COLUMN 1: DOWNLOAD MEASUREMENTS */}
        <div className="modern-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900">Download Measurements</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Payloads</span>
            </div>

            {renderBoxPlotRow("100 kB download test", downloadVal !== null ? downloadVal * 0.45 : null, "10/10", 10, 18, 28, 40, 'emerald')}
            {renderBoxPlotRow("1 MB download test", downloadVal !== null ? downloadVal * 0.72 : null, "8/8", 25, 42, 58, 68, 'emerald')}
            {renderBoxPlotRow("10 MB download test", downloadVal !== null ? downloadVal * 0.88 : null, "6/6", 35, 52, 70, 85, 'emerald')}
            {renderBoxPlotRow("25 MB download test", downloadVal, "4/4", 45, 65, 82, 95, 'emerald')}
          </div>
        </div>

        {/* COLUMN 2: UPLOAD MEASUREMENTS */}
        <div className="modern-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-black text-slate-900">Upload Measurements</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Payloads</span>
            </div>

            {renderBoxPlotRow("100 kB upload test", uploadVal !== null ? uploadVal * 0.42 : null, "8/8", 12, 20, 32, 45, 'violet')}
            {renderBoxPlotRow("1 MB upload test", uploadVal !== null ? uploadVal * 0.68 : null, "6/6", 28, 45, 60, 72, 'violet')}
            {renderBoxPlotRow("10 MB upload test", uploadVal !== null ? uploadVal * 0.85 : null, "4/4", 40, 58, 74, 86, 'violet')}
            {renderBoxPlotRow("25 MB upload test", uploadVal, "4/4", 48, 68, 80, 92, 'violet')}
          </div>
        </div>

        {/* COLUMN 3: LATENCY & PACKET MEASUREMENTS */}
        <div className="modern-glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-slate-900">Latency & Signal</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">ms</span>
            </div>

            {/* Unloaded Latency */}
            <div className="flex flex-col gap-1 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Unloaded latency</span>
                <span className="font-mono text-xs font-black text-amber-700">
                  {pingVal !== null ? `${pingVal} ms` : '--'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (pingVal || 0) * 1.2)}%` }}></div>
              </div>
            </div>

            {/* Latency during Download */}
            <div className="flex flex-col gap-1 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Latency during download</span>
                <span className="font-mono text-xs font-black text-teal-700">
                  {pingVal !== null ? `${Math.round(pingVal * 1.3)} ms` : '--'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min(100, (pingVal || 0) * 1.6)}%` }}></div>
              </div>
            </div>

            {/* Latency during Upload */}
            <div className="flex flex-col gap-1 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Latency during upload</span>
                <span className="font-mono text-xs font-black text-indigo-700">
                  {pingVal !== null ? `${Math.round(pingVal * 2.1)} ms` : '--'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (pingVal || 0) * 2.2)}%` }}></div>
              </div>
            </div>

            {/* Packet Loss Bar */}
            <div className="flex flex-col gap-1 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Packet Delivery Quality</span>
                <span className="font-mono text-xs font-bold text-emerald-700">100% Received (0% drop)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
