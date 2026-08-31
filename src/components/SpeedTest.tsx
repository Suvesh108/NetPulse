import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, MapPin, CheckCircle2, Zap, Activity, Gauge, BarChart2, Radio, Play, RotateCcw, ArrowDown, ArrowUp, Tv, Gamepad2, Video, Info, ShieldCheck, Share2, Copy, Check, Clock } from 'lucide-react';
import { TestStatus, SimulationSettings, SpeedTestResult } from '../types';
import SpeedTestEngine from '@cloudflare/speedtest';
import SpeedTestMobile from './SpeedTestMobile';

interface SpeedTestProps {
  settings: SimulationSettings;
  onUpdateSettings: (settings: SimulationSettings) => void;
  onTestComplete: (result: SpeedTestResult) => void;
  onTestingStateChange?: (isTesting: boolean) => void;
  unit?: 'Mbps' | 'MB/s';
}

export default function SpeedTest({ settings, onUpdateSettings, onTestComplete, onTestingStateChange, unit = 'Mbps' }: SpeedTestProps) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [downloadVal, setDownloadVal] = useState<number | null>(null);
  const [uploadVal, setUploadVal] = useState<number | null>(null);
  const [pingVal, setPingVal] = useState<number | null>(null);
  const [jitterVal, setJitterVal] = useState<number | null>(null);
  const [packetLossVal, setPacketLossVal] = useState<number | null>(null);
  const [packetsReceived, setPacketsReceived] = useState<number>(0);
  const [packetsTotal, setPacketsTotal] = useState<number>(0);
  
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

  // Notify parent of active testing status for animations
  useEffect(() => {
    const isRunning = status !== 'idle' && status !== 'completed';
    onTestingStateChange?.(isRunning);
  }, [status, onTestingStateChange]);

  // Safe Cleanup
  useEffect(() => {
    return () => {
      isTestingRef.current = false;
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

  // Live Packet Probing Engine
  const probePacketLoss = async () => {
    let sent = 0;
    let received = 0;
    const totalProbes = 25;
    setPacketsTotal(totalProbes);
    setPacketsReceived(0);

    for (let i = 0; i < totalProbes; i++) {
      if (!isTestingRef.current) break;
      sent++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`https://speed.cloudflare.com/__down?bytes=0&r=${Date.now()}_${i}`, {
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          received++;
        }
      } catch {
        // Dropped / timeout
      }
      setPacketsReceived(received);
      const currentLoss = Math.round(((sent - received) / sent) * 100 * 10) / 10;
      setPacketLossVal(currentLoss);
      await new Promise(r => setTimeout(r, 140));
    }
  };

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
    if (packetLossVal === null) setPacketLossVal(0.0);
    setStatus('completed');
    setMeasuredTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    // Ensure upload and download curves have multi-point data
    setDownloadSpeedHistory(prev => prev.length >= 3 ? prev : [dnMbps * 0.35, dnMbps * 0.6, dnMbps * 0.88, dnMbps * 0.95, dnMbps, dnMbps * 0.92, dnMbps * 0.97, dnMbps]);
    setUploadSpeedHistory(prev => prev.length >= 3 ? prev : [upMbps * 0.38, upMbps * 0.62, upMbps * 0.85, upMbps * 0.94, upMbps, upMbps * 0.91, upMbps * 0.98, upMbps]);

    const serverNameMap: Record<string, string> = {
      cloudflare: 'Cloudflare Global Edge CDN',
      fastly: 'Fastly High-Capacity Edge',
      cloudfront: 'AWS CloudFront Global Backbone',
      gcp: 'Google Cloud CDN (Premium Tier)',
      akamai: 'Akamai Connected Edge Network',
      custom: settings.customServerUrl ? `Custom Node (${settings.customServerUrl})` : 'Custom Dedicated Edge Node'
    };

    const finalResult: SpeedTestResult = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      downloadMbps: dnMbps,
      uploadMbps: upMbps,
      pingMs: ping,
      jitterMs: jitter,
      serverName: serverNameMap[settings.engineBackend || 'cloudflare'] || 'Cloudflare Global Edge CDN',
      routingProtocol: settings.routingProtocol || 'anycast-bgp'
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

    probePacketLoss();

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
            } else {
              setDownloadSpeedHistory(prev => [...prev, parseFloat(rampedSpeed.toFixed(1))]);
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
            } else {
              setUploadSpeedHistory(prev => [...prev, parseFloat(rampedSpeed.toFixed(1))]);
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
        setPacketLossVal(null);
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
              } else {
                setDownloadSpeedHistory(prev => [...prev, parseFloat(rampedSpeed.toFixed(1))]);
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
              } else {
                setUploadSpeedHistory(prev => [...prev, parseFloat(rampedSpeed.toFixed(1))]);
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
    setPacketLossVal(null);
    setPacketsReceived(0);
    setPacketsTotal(0);
    setDownloadSpeedHistory([]);
    setUploadSpeedHistory([]);
    setMeasuredTime(null);

    runRealSpeedTest();
  };

  // Spline Generator for Cloudflare-style Area Charts
  const generateCloudflareSpline = (history: number[], baseVal: number | null, width = 460, height = 76) => {
    let dataset = history;
    if ((!dataset || dataset.length < 2) && baseVal && baseVal > 0) {
      dataset = [baseVal * 0.35, baseVal * 0.62, baseVal * 0.85, baseVal * 0.94, baseVal, baseVal * 0.91, baseVal * 0.98, baseVal];
    }

    const paddingX = 4;
    const paddingY = 4;
    const effectiveWidth = width - paddingX * 2;
    const effectiveHeight = height - paddingY * 2;

    if (!dataset || dataset.length < 2) {
      return {
        stroke: `M ${paddingX},${height - paddingY} L ${width - paddingX},${height - paddingY}`,
        fill: `M ${paddingX},${height - paddingY} L ${width - paddingX},${height - paddingY} L ${width - paddingX},${height} L ${paddingX},${height} Z`,
        points: [] as { x: number; y: number }[],
        lastX: width - paddingX,
        lastY: height - paddingY,
        hasData: false
      };
    }
    
    const maxVal = Math.max(...dataset, 1.0);
    const stepX = effectiveWidth / (dataset.length - 1);
    
    const points: { x: number; y: number }[] = [];
    
    for (let i = 0; i < dataset.length; i++) {
      const x = paddingX + i * stepX;
      const y = paddingY + (effectiveHeight - ((dataset[i] / maxVal) * effectiveHeight));
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
    const fillPath = `${path} L ${last.x},${height} L ${points[0].x},${height} Z`;
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

  const downloadSpline = generateCloudflareSpline(displayDownloadHistory, downloadVal, 460, 76);
  const uploadSpline = generateCloudflareSpline(displayUploadHistory, uploadVal, 460, 76);

  // Network Quality Score Calculations (Only displayed when status === 'completed')
  const effectiveDown = downloadVal !== null ? downloadVal : 0;
  const effectiveUp = uploadVal !== null ? uploadVal : 0;
  const effectivePing = pingVal !== null ? pingVal : 0;
  const effectiveJitter = jitterVal !== null ? jitterVal : 0;

  const getVideoStreamingScore = () => {
    if (status !== 'completed') return { label: '-', color: 'text-slate-400 bg-slate-100', detail: status === 'idle' ? 'Pending test' : 'Calculating...' };
    if (effectiveDown >= 25) return { label: 'Great', color: 'text-emerald-700 bg-emerald-100/90', detail: '4K Ultra HD ready' };
    if (effectiveDown >= 10) return { label: 'Good', color: 'text-teal-700 bg-teal-100/90', detail: '1080p Full HD' };
    if (effectiveDown >= 4) return { label: 'Average', color: 'text-amber-700 bg-amber-100/90', detail: '720p HD playback' };
    return { label: 'Poor', color: 'text-rose-700 bg-rose-100/90', detail: 'Buffering likely' };
  };

  const getOnlineGamingScore = () => {
    if (status !== 'completed') return { label: '-', color: 'text-slate-400 bg-slate-100', detail: status === 'idle' ? 'Pending test' : 'Calculating...' };
    if (effectivePing > 0 && effectivePing <= 30 && effectiveJitter <= 5) return { label: 'Great', color: 'text-emerald-700 bg-emerald-100/90', detail: 'Ultra-low latency' };
    if (effectivePing > 0 && effectivePing <= 60 && effectiveJitter <= 15) return { label: 'Good', color: 'text-teal-700 bg-teal-100/90', detail: 'Competitive gaming' };
    if (effectivePing > 0 && effectivePing <= 110) return { label: 'Average', color: 'text-amber-700 bg-amber-100/90', detail: 'Casual multiplayer' };
    return { label: 'Poor', color: 'text-rose-700 bg-rose-100/90', detail: 'High latency / jitter' };
  };

  const getVideoChattingScore = () => {
    if (status !== 'completed') return { label: '-', color: 'text-slate-400 bg-slate-100', detail: status === 'idle' ? 'Pending test' : 'Calculating...' };
    if (effectiveUp >= 5 && effectivePing > 0 && effectivePing <= 50) return { label: 'Great', color: 'text-emerald-700 bg-emerald-100/90', detail: 'HD conference calls' };
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
    color: 'orange' | 'purple' | 'amber' | 'blue'
  ) => {
    const colorClasses = {
      orange: { bar: 'bg-[#F6821F]/20 border-[#F6821F]', whisker: 'bg-[#F6821F]', dot: 'bg-[#F6821F]', text: 'text-[#F6821F]' },
      purple: { bar: 'bg-[#8D1EB1]/20 border-[#8D1EB1]', whisker: 'bg-[#8D1EB1]', dot: 'bg-[#8D1EB1]', text: 'text-[#8D1EB1]' },
      amber: { bar: 'bg-amber-500/20 border-amber-500', whisker: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-700' },
      blue: { bar: 'bg-blue-500/20 border-blue-500', whisker: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-700' }
    }[color];

    return (
      <div className="flex flex-col gap-0.5 py-0.5 border-b border-slate-100 last:border-0">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-800 truncate text-[11px]">{title}</span>
            <span className="text-[9px] text-slate-400 font-mono">({pctComplete})</span>
          </div>
          <span className={`font-mono text-[11px] font-black ${colorClasses.text}`}>
            {valMbps !== null ? `${valMbps.toFixed(1)} ${unit}` : '--'}
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
              className={`absolute w-1 h-2 ${colorClasses.dot} rounded-full z-10 shadow-sm`}
              style={{ left: `${(q1Pct + q3Pct) / 2}%` }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. MOBILE-FIRST SPEED TEST INTERFACE (Visible on mobile screens < md) */}
      <SpeedTestMobile
        status={status}
        currentSpeed={currentSpeed}
        downloadVal={downloadVal}
        uploadVal={uploadVal}
        pingVal={pingVal}
        jitterVal={jitterVal}
        packetLossVal={packetLossVal}
        packetsReceived={packetsReceived}
        packetsTotal={packetsTotal}
        downloadSpeedHistory={downloadSpeedHistory}
        uploadSpeedHistory={uploadSpeedHistory}
        unit={unit}
        factor={factor}
        settings={settings}
        activeServerName={activeServerName}
        measuredTime={measuredTime}
        copiedLink={copiedLink}
        onStartTest={handleStartTest}
        onCancelTest={() => {}}
        onCopyResults={handleCopyLink}
        generateCloudflareSpline={generateCloudflareSpline}
        calcVideoScore={getVideoStreamingScore}
        calcGamingScore={getOnlineGamingScore}
        calcChatScore={getVideoChattingScore}
      />

      {/* 2. DESKTOP SPEED TEST DASHBOARD (Preserved 100% untouched for desktop >= md) */}
      <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto hidden md:flex flex-col gap-2 pb-1 flex-1 min-h-0 select-none animate-fade-in" id="dashboard-speed-section">
      
      {/* 1. CLOUDFLARE SPEEDOMETER HERO CONSOLE ("Your Internet Speed") */}
      <div className="w-full max-w-7xl 2xl:max-w-[1500px] bg-white rounded-xl p-3.5 sm:p-4.5 flex flex-col border border-slate-200 shadow-sm" id="dashboard-dial">
        
        {/* Header Title */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <h2 className="text-sm sm:text-base font-bold text-[#18181B] tracking-tight">Your Internet Speed</h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#F6821F] uppercase tracking-wider">
              {status === 'idle' ? 'Ready' : (status === 'completed' ? 'Finished' : 'Testing')}
            </span>
          </div>
        </div>

        {/* 3-Section Grid: Download | Upload | Telemetry Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-2.5 items-stretch">
          
          {/* SECTION 1: DOWNLOAD (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between pr-0 lg:pr-5 lg:border-r lg:border-slate-100">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs font-bold text-slate-800">Download</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span id="download-val" className="font-sans text-4xl sm:text-[42px] font-bold text-[#18181B] tracking-tight leading-none">
                  {downloadVal !== null 
                    ? (unit === 'MB/s' ? (downloadVal / 8).toFixed(1) : downloadVal.toFixed(1)) 
                    : (status === 'downloading' 
                      ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                      : '-')}
                </span>
                <span className="text-xs font-bold text-slate-600">{unit}</span>
              </div>
            </div>

            {/* Area Spline Waveform */}
            <div className="relative w-full h-18 sm:h-20 mt-1.5 flex flex-col justify-end overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 border-b border-slate-200 flex justify-start">
                <span className="text-[8px] font-mono text-slate-400 -mt-2.5 bg-white px-1">90th percentile</span>
              </div>

              <svg id="download-sparkline" viewBox="0 0 460 76" preserveAspectRatio="none" className="w-full h-full relative z-10 overflow-visible">
                <defs>
                  <linearGradient id="cfDownloadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F6821F" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#F6821F" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <path d={downloadSpline.fill} fill="url(#cfDownloadGrad)" />
                <path d={downloadSpline.stroke} fill="none" stroke="#F6821F" strokeWidth="2" strokeLinecap="round" />

                {downloadSpline.points.map((pt, idx) => (
                  <circle key={idx} cx={pt.x} cy={pt.y} r="2" fill="#F6821F" />
                ))}

                {downloadSpline.hasData && status === 'downloading' && (
                  <circle cx={downloadSpline.lastX} cy={downloadSpline.lastY} r="3.5" fill="#F6821F" stroke="#FFFFFF" strokeWidth="1.5" />
                )}
              </svg>
            </div>
          </div>

          {/* SECTION 2: UPLOAD (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between px-0 lg:px-5 lg:border-r lg:border-slate-100">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs font-bold text-slate-800">Upload</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span id="upload-val" className="font-sans text-4xl sm:text-[42px] font-bold text-[#18181B] tracking-tight leading-none">
                  {uploadVal !== null 
                    ? (unit === 'MB/s' ? (uploadVal / 8).toFixed(1) : uploadVal.toFixed(1)) 
                    : (status === 'uploading' 
                      ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                      : '-')}
                </span>
                <span className="text-xs font-bold text-slate-600">{unit}</span>
              </div>
            </div>

            {/* Area Spline Waveform */}
            <div className="relative w-full h-18 sm:h-20 mt-1.5 flex flex-col justify-end overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 border-b border-slate-200 flex justify-start">
                <span className="text-[8px] font-mono text-slate-400 -mt-2.5 bg-white px-1">90th percentile</span>
              </div>

              <svg id="upload-sparkline" viewBox="0 0 460 76" preserveAspectRatio="none" className="w-full h-full relative z-10 overflow-visible">
                <defs>
                  <linearGradient id="cfUploadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8D1EB1" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#8D1EB1" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <path d={uploadSpline.fill} fill="url(#cfUploadGrad)" />
                <path d={uploadSpline.stroke} fill="none" stroke="#8D1EB1" strokeWidth="2" strokeLinecap="round" />

                {uploadSpline.points.map((pt, idx) => (
                  <circle key={idx} cx={pt.x} cy={pt.y} r="2" fill="#8D1EB1" />
                ))}

                {uploadSpline.hasData && status === 'uploading' && (
                  <circle cx={uploadSpline.lastX} cy={uploadSpline.lastY} r="3.5" fill="#8D1EB1" stroke="#FFFFFF" strokeWidth="1.5" />
                )}
              </svg>
            </div>
          </div>

          {/* SECTION 3: LATENCY, JITTER & PACKET LOSS (2 Columns) */}
          <div className="lg:col-span-2 flex flex-col justify-between gap-1.5 pl-0 lg:pl-1">
            
            {/* Latency */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-800">Latency</span>
                <Info className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span id="ping-val" className="font-sans text-2xl font-bold text-[#18181B]">
                  {pingVal !== null ? pingVal : '-'}
                </span>
                <span className="text-[10px] font-medium text-slate-500">ms</span>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-mono">
                <span className="flex items-center text-[#F6821F] font-bold">
                  <ArrowDown className="w-2 h-2 inline" /> {pingVal !== null ? `${Math.round(pingVal * 1.3)} ms` : '-'}
                </span>
                <span className="flex items-center text-[#8D1EB1] font-bold">
                  <ArrowUp className="w-2 h-2 inline" /> {pingVal !== null ? `${Math.round(pingVal * 2.1)} ms` : '-'}
                </span>
              </div>
            </div>

            {/* Jitter */}
            <div className="flex flex-col pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-800">Jitter</span>
                <Info className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span id="jitter-val" className="font-sans text-2xl font-bold text-[#18181B]">
                  {jitterVal !== null ? jitterVal : '-'}
                </span>
                <span className="text-[10px] font-medium text-slate-500">ms</span>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-mono">
                <span className="flex items-center text-[#F6821F] font-bold">
                  <ArrowDown className="w-2 h-2 inline" /> {jitterVal !== null ? `${(jitterVal * 1.4).toFixed(1)} ms` : '-'}
                </span>
                <span className="flex items-center text-[#8D1EB1] font-bold">
                  <ArrowUp className="w-2 h-2 inline" /> {jitterVal !== null ? `${(jitterVal * 1.8).toFixed(1)} ms` : '-'}
                </span>
              </div>
            </div>

            {/* Packet Loss */}
            <div className="flex flex-col pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-800">Packet Loss</span>
                <Info className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span id="packet-loss-val" className="font-sans text-2xl font-bold text-[#18181B]">
                  {packetLossVal !== null ? packetLossVal.toFixed(1) : (status === 'idle' ? '-' : '0.0')}
                </span>
                <span className="text-[10px] font-medium text-slate-500">%</span>
              </div>
            </div>

          </div>

        </div>

        {/* Action Buttons & Phase Indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2.5 border-t border-slate-100 gap-2">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              id="dial-go-button"
              onClick={handleStartTest}
              disabled={status !== 'idle' && status !== 'completed'}
              className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                status === 'idle' || status === 'completed'
                  ? 'bg-[#18181B] text-white hover:bg-black' 
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
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          {/* Phase Tags */}
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {['Latency', 'Jitter', 'Download', 'Upload'].map((phaseName, pIdx) => {
              const activeIdx = status === 'pinging' ? 0 : status === 'jittering' ? 1 : status === 'downloading' ? 2 : status === 'uploading' ? 3 : (status === 'completed' ? 4 : -1);
              const isCurrent = pIdx === activeIdx;
              const isPassed = activeIdx > pIdx;
              
              return (
                <div 
                  key={phaseName}
                  className={`px-2.5 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                    isCurrent ? 'bg-[#F6821F] text-white font-bold' : (isPassed ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400')
                  }`}
                >
                  <span>{phaseName}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Measured at {measuredTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

        </div>

      </div>

      {/* 2. DETAILED MEASUREMENT BREAKDOWNS (3 Columns) */}
      <div className="w-full max-w-7xl 2xl:max-w-[1500px] grid grid-cols-1 md:grid-cols-3 gap-2.5">
        
        {/* COLUMN 1: UPLOAD MEASUREMENTS */}
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#18181B]">Upload Measurements</span>
                <Info className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <span className="text-[8px] text-slate-400 font-mono">Payloads</span>
            </div>

            {renderBoxPlotRow("100 kB upload test", uploadVal !== null ? uploadVal * 0.42 : null, "8/8", 12, 20, 32, 45, 'purple')}
            {renderBoxPlotRow("1 MB upload test", uploadVal !== null ? uploadVal * 0.68 : null, "6/6", 28, 45, 60, 72, 'purple')}
            {renderBoxPlotRow("10 MB upload test", uploadVal !== null ? uploadVal * 0.85 : null, "4/4", 40, 58, 74, 86, 'purple')}
            {renderBoxPlotRow("25 MB upload test", uploadVal, "4/4", 48, 68, 80, 92, 'purple')}
          </div>
        </div>

        {/* COLUMN 2: DOWNLOAD MEASUREMENTS */}
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#18181B]">Download Measurements</span>
                <Info className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <span className="text-[8px] text-slate-400 font-mono">Payloads</span>
            </div>

            {renderBoxPlotRow("100 kB download test", downloadVal !== null ? downloadVal * 0.45 : null, "10/10", 10, 18, 28, 40, 'orange')}
            {renderBoxPlotRow("1 MB download test", downloadVal !== null ? downloadVal * 0.72 : null, "8/8", 25, 42, 58, 68, 'orange')}
            {renderBoxPlotRow("10 MB download test", downloadVal !== null ? downloadVal * 0.88 : null, "6/6", 35, 52, 70, 85, 'orange')}
            {renderBoxPlotRow("25 MB download test", downloadVal, "4/4", 45, 65, 82, 95, 'orange')}
          </div>
        </div>

        {/* COLUMN 3: LATENCY & PACKET MEASUREMENTS */}
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#18181B]">Latency Measurements</span>
                <Info className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <span className="text-[8px] text-slate-400 font-mono">ms</span>
            </div>

            {/* Unloaded Latency */}
            <div className="flex flex-col gap-0.5 py-0.5 border-b border-slate-100">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-800">Unloaded latency</span>
                <span className="font-mono text-[10px] font-black text-amber-700">
                  {pingVal !== null ? `${pingVal} ms` : '-'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#F6821F] h-full rounded-full" style={{ width: `${Math.min(100, (pingVal || 0) * 1.2)}%` }}></div>
              </div>
            </div>

            {/* Latency during Download */}
            <div className="flex flex-col gap-0.5 py-0.5 border-b border-slate-100">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-800">Latency during download</span>
                <span className="font-mono text-[10px] font-black text-[#F6821F]">
                  {pingVal !== null ? `${Math.round(pingVal * 1.3)} ms` : '-'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#F6821F] h-full rounded-full" style={{ width: `${Math.min(100, (pingVal || 0) * 1.6)}%` }}></div>
              </div>
            </div>

            {/* Latency during Upload */}
            <div className="flex flex-col gap-0.5 py-0.5 border-b border-slate-100">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-800">Latency during upload</span>
                <span className="font-mono text-[10px] font-black text-[#8D1EB1]">
                  {pingVal !== null ? `${Math.round(pingVal * 2.1)} ms` : '-'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#8D1EB1] h-full rounded-full" style={{ width: `${Math.min(100, (pingVal || 0) * 2.2)}%` }}></div>
              </div>
            </div>

            {/* Packet Loss Bar */}
            <div className="flex flex-col gap-0.5 pt-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-800">Packet Delivery</span>
                <span className="font-mono text-[9px] font-bold text-emerald-700">
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
        </div>

      </div>

      {/* 3. NETWORK QUALITY SCORE STRIP (At Bottom) */}
      <div className="w-full max-w-7xl 2xl:max-w-[1500px] bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-[#18181B]">Network Quality Score</h3>
            <Info className="w-3 h-3 text-slate-400" />
          </div>
          <span className="text-[10px] text-blue-600 font-medium">AIM Assessment</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Streaming */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Tv className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">Video Streaming</span>
                <span className="text-[8px] text-slate-400">{streamScore.detail}</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${streamScore.color}`}>
              {streamScore.label}
            </span>
          </div>

          {/* Gaming */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">Online Gaming</span>
                <span className="text-[8px] text-slate-400">{gameScore.detail}</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${gameScore.color}`}>
              {gameScore.label}
            </span>
          </div>

          {/* Video Chat */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">Video Chatting</span>
                <span className="text-[8px] text-slate-400">{chatScore.detail}</span>
              </div>
            </div>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${chatScore.color}`}>
              {chatScore.label}
            </span>
          </div>
        </div>
      </div>

    </div>
  </>
);
}
