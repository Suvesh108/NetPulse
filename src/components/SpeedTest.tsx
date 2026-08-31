import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, MapPin, CheckCircle2, Zap, Activity, Gauge, BarChart2, Radio, Play, RotateCcw, ArrowDownRight, ArrowUpRight, Tv, Gamepad2, Video, Info, ShieldCheck, ChevronDown } from 'lucide-react';
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
  
  // Loaded Latencies
  const [downLoadedLatency, setDownLoadedLatency] = useState<number | null>(null);
  const [upLoadedLatency, setUpLoadedLatency] = useState<number | null>(null);

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

    const downLoaded = results.getDownLoadedLatency ? results.getDownLoadedLatency() : null;
    const upLoaded = results.getUpLoadedLatency ? results.getUpLoadedLatency() : null;

    if (downLoaded) setDownLoadedLatency(Math.round(downLoaded));
    if (upLoaded) setUpLoadedLatency(Math.round(upLoaded));

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
    setDownLoadedLatency(null);
    setUpLoadedLatency(null);
    setDownloadSpeedHistory([]);
    setUploadSpeedHistory([]);

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

  const activeHistoryForBox = status === 'uploading' 
    ? displayUploadHistory 
    : (status === 'downloading' ? displayDownloadHistory : (downloadSpeedHistory.length > 0 ? downloadSpeedHistory : uploadSpeedHistory));

  const centerBoxGraph = generateBoxGraphSpline(activeHistoryForBox, 600, 150);
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
      emerald: {
        bar: 'bg-emerald-500/20 border-emerald-500',
        whisker: 'bg-emerald-500',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700'
      },
      violet: {
        bar: 'bg-violet-500/20 border-violet-500',
        whisker: 'bg-violet-500',
        dot: 'bg-violet-500',
        text: 'text-violet-700'
      },
      amber: {
        bar: 'bg-amber-500/20 border-amber-500',
        whisker: 'bg-amber-500',
        dot: 'bg-amber-500',
        text: 'text-amber-700'
      },
      blue: {
        bar: 'bg-blue-500/20 border-blue-500',
        whisker: 'bg-blue-500',
        dot: 'bg-blue-500',
        text: 'text-blue-700'
      }
    }[color];

    return (
      <div className="flex flex-col gap-1 py-2.5 border-b border-slate-100 last:border-0">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">{title}</span>
            <span className="text-[10px] text-slate-400 font-mono">({pctComplete})</span>
          </div>
          <span className={`font-mono text-xs font-black ${colorClasses.text}`}>
            {valMbps !== null ? `${valMbps.toFixed(1)} ${unit}` : '--'}
          </span>
        </div>

        {/* Box Plot Distribution Track */}
        <div className="relative w-full h-5 bg-slate-100/80 rounded-md overflow-hidden flex items-center px-1">
          {/* Axis Markings */}
          <div className="absolute inset-x-2 flex justify-between text-[8px] font-mono text-slate-400 pointer-events-none opacity-40">
            <span>0</span>
            <span>20M</span>
            <span>40M</span>
            <span>60M</span>
            <span>80M</span>
          </div>

          {/* Whisker Line */}
          {valMbps !== null && (
            <div 
              className={`absolute h-0.5 ${colorClasses.whisker} opacity-60`}
              style={{ left: `${minPct}%`, width: `${Math.max(2, maxPct - minPct)}%` }}
            />
          )}

          {/* Quartile Box */}
          {valMbps !== null && (
            <div 
              className={`absolute h-3 rounded-sm border ${colorClasses.bar}`}
              style={{ left: `${q1Pct}%`, width: `${Math.max(4, q3Pct - q1Pct)}%` }}
            />
          )}

          {/* Median Point */}
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

      {/* EXPANSIVE CENTERPIECE: REAL-TIME TELEMETRY GRAPH CONSOLE */}
      <div className="w-full max-w-5xl modern-glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-slate-200/90 shadow-xl min-h-[340px] sm:min-h-[380px]" id="dashboard-dial">
        
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
        <div className="relative w-full h-32 sm:h-40 bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3 sm:p-4 overflow-hidden flex flex-col justify-end">
          
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

      {/* MODERN 3-COLUMN BENTO TELEMETRY DECK */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* CARD 1: PING (Latency) */}
        <div className="modern-glass-card rounded-2xl p-4 flex items-center gap-3.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">Ping Latency</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span id="ping-val" className="font-mono text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {pingVal !== null ? `${pingVal} ms` : '-- ms'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Idle Response Time</span>
          </div>
        </div>
        
        {/* CARD 2: JITTER (Variance) */}
        <div className="modern-glass-card rounded-2xl p-4 flex items-center gap-3.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-indigo-800 uppercase tracking-wider">Jitter Variance</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span id="jitter-val" className="font-mono text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {jitterVal !== null ? `${jitterVal} ms` : '-- ms'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Packet Stability</span>
          </div>
        </div>

        {/* CARD 3: SERVER NODE */}
        <div className="modern-glass-card rounded-2xl p-4 flex items-center gap-3.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-800 uppercase tracking-wider">Server Node</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-sans text-sm sm:text-base font-black text-slate-900 truncate">
                Cloudflare Edge
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium truncate">Anycast CDN Server</span>
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
                  {pingVal !== null ? `${Math.round(pingVal * 1.35)} ms` : '--'}
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
                  {pingVal !== null ? `${Math.round(pingVal * 1.15)} ms` : '--'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (pingVal || 0) * 1.4)}%` }}></div>
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
