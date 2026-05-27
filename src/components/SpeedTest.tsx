import React, { useState, useEffect, useRef } from 'react';
import { Play, Download, Upload, Cpu, Activity, MapPin, CheckCircle, RotateCcw, Globe } from 'lucide-react';
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
  const [gaugeValue, setGaugeValue] = useState<number>(0); // 0 to 180 (for path representation)
  const [downloadVal, setDownloadVal] = useState<number | null>(null);
  const [uploadVal, setUploadVal] = useState<number | null>(null);
  const [pingVal, setPingVal] = useState<number | null>(null);
  const [jitterVal, setJitterVal] = useState<number | null>(null);
  
  // Real-time speed curve data points for drawing the custom SVG line graph
  const [downloadSpeedHistory, setDownloadSpeedHistory] = useState<number[]>([]);
  const [uploadSpeedHistory, setUploadSpeedHistory] = useState<number[]>([]);
  
  const simulationTimerRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const engineRef = useRef<any>(null);

  const isTestingRef = useRef(false);
  const elapsedRef = useRef(0);
  const timerFinishedRef = useRef(false);
  const finalResultsRef = useRef<any>(null);

  // Initialize Web Audio Synth for premium hum effect
  const startAudioSynth = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create oscillator and gain node
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, ctx.currentTime); // Low baseline hum
      gain.gain.setValueAtTime(0.01, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
    } catch (e) {
      console.warn('Audio synthesis failed to initialize:', e);
    }
  };

  const updateAudioFreqAndVolume = (speed: number, maxSpeed: number) => {
    try {
      const ctx = audioContextRef.current;
      const osc = oscillatorRef.current;
      const gain = gainNodeRef.current;
      if (ctx && osc && gain) {
        // Frequency increases up from 60Hz to 380Hz proportional to speed
        const speedRatio = maxSpeed > 0 ? Math.min(speed / maxSpeed, 1) : 0;
        const targetFreq = 60 + speedRatio * 320;
        osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
        
        // Volume grows slightly based on speed
        const targetVolume = 0.005 + speedRatio * 0.055;
        gain.gain.setTargetAtTime(targetVolume, ctx.currentTime, 0.08);
      }
    } catch (e) {
      // Ignored
    }
  };

  const stopAudioSynth = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    } catch (e) {
      // Ignored
    }
  };

  // Safe Cleanup
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        window.clearInterval(simulationTimerRef.current);
      }
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (engineRef.current) {
        try {
          engineRef.current.pause();
        } catch (e) {
          // Ignored
        }
      }
      stopAudioSynth();
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
    stopAudioSynth();

    const finalResult: SpeedTestResult = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      downloadMbps: dnMbps,
      uploadMbps: upMbps,
      pingMs: ping,
      jitterMs: jitter,
      serverName: 'Cloudflare Edge CDN Server'
    };

    onTestComplete(finalResult);
    engineRef.current = null;
    isTestingRef.current = false;
  };

  const runRealSpeedTest = () => {
    startAudioSynth();
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
            updateAudioFreqAndVolume(rampedSpeed, dynamicMax);
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
            updateAudioFreqAndVolume(rampedSpeed, dynamicMax);
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
        console.error('SpeedTest error callback:', err);
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setStatus('idle');
        stopAudioSynth();
        
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

      // Start the sequential timer
      timerIntervalRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        const elapsed = elapsedRef.current;

        if (elapsed < 6) {
          // Phase 1: Ping
          setStatus('pinging');
          if (engineRef.current) {
            const results = engineRef.current.results;
            const lat = results.getUnloadedLatency();
            if (lat !== undefined && lat !== null) setPingVal(Math.round(lat));
          }
        } else if (elapsed >= 6 && elapsed < 12) {
          // Phase 2: Jitter
          setStatus('jittering');
          if (engineRef.current) {
            const results = engineRef.current.results;
            const jit = results.getUnloadedJitter();
            if (jit !== undefined && jit !== null) setJitterVal(parseFloat(jit.toFixed(1)));
          }
        } else if (elapsed >= 12 && elapsed < 18) {
          // Phase 3: Download
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
              updateAudioFreqAndVolume(rampedSpeed, dynamicMax);
            }
          }
        } else if (elapsed >= 18 && elapsed < 24) {
          // Phase 4: Upload
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
              updateAudioFreqAndVolume(rampedSpeed, dynamicMax);
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
      console.error('Failed to run speed test engine:', e);
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setStatus('idle');
      stopAudioSynth();
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

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to Connect';
      case 'pinging':
        return 'Measuring Ping Latency...';
      case 'jittering':
        return 'Measuring Jitter...';
      case 'downloading':
        return 'Measuring Download Speed...';
      case 'uploading':
        return 'Measuring Upload Speed...';
      case 'completed':
        return 'Test Finished Successfully';
      default:
        return 'Ready';
    }
  };

  // Generate SVG path for Speed curve history
  const generateGraphPath = (history: number[]) => {
    if (history.length < 2) return null;
    const width = 280;
    const height = 40;
    const padding = 2;
    const maxVal = Math.max(...history, 1.0);
    const stepX = width / (history.length - 1);
    
    let path = `M 0,${height}`;
    history.forEach((val, i) => {
      const x = i * stepX;
      // Inverted Y coordinates
      const y = height - ((val / maxVal) * (height - padding * 2)) - padding;
      path += ` L ${x},${y}`;
    });
    
    // Auto-close path for fill
    const fillPath = `${path} L ${width},${height} Z`;
    return { stroke: path, fill: fillPath };
  };

  // Get active display history (progressive slicing during active test phase)
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

  // Draw Arc representing Speedometer Dial progress
  // Radius: 180 (center 200, 200)
  // Complete track goes from roughly angle 135 deg to 405 deg (270 deg span)
  const drawGaugeArcPath = (filledVal: number) => {
    const center = 200;
    const radius = 170;
    const startAngle = 135;
    const endAngle = 135 + (270 * (filledVal / 180));
    
    const degToRad = (deg: number) => (deg * Math.PI) / 180;
    
    const startX = center + radius * Math.cos(degToRad(startAngle));
    const startY = center + radius * Math.sin(degToRad(startAngle));
    const endX = center + radius * Math.cos(degToRad(endAngle));
    const endY = center + radius * Math.sin(degToRad(endAngle));
    
    // Large arc flag is 0 if arc span < 180, else 1
    const largeArcFlag = (270 * (filledVal / 180)) > 180 ? 1 : 0;
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  const gaugeActivePath = drawGaugeArcPath(Math.max(2, gaugeValue));

  return (
    <div className="w-full flex flex-col items-center justify-between flex-1 py-1 md:py-3 animate-fade-in h-full min-h-0" id="speed-test-section">
      
      {/* Connectivity Status Chip */}
      <div className="flex items-center gap-3 bg-[#070c17]/60 border border-[#00f0ff]/25 backdrop-blur-md px-5 py-2 rounded-full mb-2 md:mb-4 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.05)]">
        <div className={`w-3 h-3 rounded-full shadow-[0_0_12px_rgba(0,240,255,0.8)] ${
          status === 'idle' ? 'bg-primary animate-pulse' :
          status === 'pinging' ? 'bg-amber-400 animate-ping' :
          status === 'jittering' ? 'bg-blue-400 animate-ping' :
          status === 'completed' ? 'bg-emerald-500' : 'bg-primary animate-pulse'
        }`}></div>
        <span className="font-sans font-bold text-xs tracking-[0.3em] text-[#94A3B8] uppercase text-center">
          {getStatusText()}
        </span>
      </div>


      <div className="grid grid-cols-2 xl:grid-cols-3 items-center justify-items-center gap-3 sm:gap-4 md:gap-6 w-full max-w-5xl mb-3 sm:mb-4">
        
        {/* DOWNLOAD CARD */}
        <div className={`col-span-1 order-2 xl:order-1 bg-[#080d1a]/85 backdrop-blur-xl border border-[#1e293b] rounded-2xl p-4 sm:p-6 flex flex-col relative overflow-hidden w-full max-w-xs h-32 sm:h-40 xl:h-44 shadow-2xl transition-all duration-500 hover:border-[#00F0FF]/40 ${
          status === 'downloading' ? 'ring-2 ring-primary/40 border-[#00F0FF]/50' : ''
        }`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-80"></div>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div className={`p-1.5 sm:p-2 rounded-full transition-colors ${status === 'downloading' ? 'bg-primary/20 text-primary' : 'bg-[#00F0FF]/10 text-[#94A3B8]'}`}>
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-sans font-extrabold text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] text-[#94A3B8] uppercase">Download</span>
            {status === 'downloading' && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            )}
          </div>
 
          <div className="flex items-baseline gap-1 sm:gap-2 mt-auto z-10">
            <span id="download-val" className="font-sans text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black text-white tracking-tighter">
              {downloadVal !== null 
                ? (unit === 'MB/s' ? (downloadVal / 8).toFixed(1) : downloadVal.toFixed(1)) 
                : (status === 'downloading' 
                  ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                  : '--')}
            </span>
            <span className="font-sans text-xs sm:text-sm font-bold text-[#94A3B8]">{unit}</span>
          </div>
 
          {/* Sparkline for download speed progression */}
          {(status === 'downloading' || status === 'uploading' || status === 'completed') && downloadGraphPaths && (
            <div className="absolute bottom-1 sm:bottom-2 left-4 sm:left-6 right-4 sm:right-6 h-8 sm:h-10 opacity-60">
              <svg id="download-sparkline" viewBox="0 0 280 40" className="w-full h-full overflow-visible">
                <path d={downloadGraphPaths.fill} fill="url(#dnGrad)" opacity="0.15" />
                <path d={downloadGraphPaths.stroke} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                <defs>
                  <linearGradient id="dnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
 
        {/* CENTRAL SPEED GAUGE */}
        <div className="col-span-2 xl:col-span-1 order-1 xl:order-2 relative w-[240px] xs:w-[280px] sm:w-[340px] xl:w-96 h-[240px] xs:h-[280px] sm:h-[340px] xl:h-96 flex items-center justify-center select-none" id="dashboard-dial">
          {/* SVG Gauge Background & Sweeper Needle */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
            {/* Background Track */}
            <path 
              d="M 79.8 320.2 A 170 170 0 1 1 320.2 320.2" 
              fill="none" 
              stroke="#111827" 
              strokeLinecap="round" 
              strokeWidth="4"
            />
            {/* Active Needle Trail */}
            {(status === 'downloading' || status === 'uploading') && (
              <path 
                className="drop-shadow-[0_0_12px_rgba(0,240,255,0.7)] transition-all duration-100"
                d={gaugeActivePath}
                fill="none" 
                stroke={status === 'downloading' ? "var(--color-primary)" : "var(--color-secondary)"} 
                strokeLinecap="round" 
                strokeWidth="5"
              />
            )}
            
            {/* Tick Marks around gauge */}
            <g opacity="0.25" stroke="#94A3B8" strokeWidth="1">
              <line x1="200" x2="200" y1="30" y2="40" />
              <line x1="30" x2="40" y1="200" y2="200" />
              <line x1="370" x2="360" y1="200" y2="200" />
              <line x1="80" x2="87" y1="80" y2="87" />
              <line x1="320" x2="313" y1="80" y2="87" />
              
              <line x1="110" x2="116" y1="290" y2="284" />
              <line x1="290" x2="284" y1="290" y2="284" />
            </g>
          </svg>
 
          {/* Digital Readout Center & GO Button */}
          <div className="flex flex-col items-center justify-center relative z-10 text-center w-full h-full pt-4 sm:pt-6">
            <span id="speed-val" className={`text-4xl xs:text-5xl sm:text-6xl xl:text-7xl font-sans font-black text-white tracking-tighter transition-all duration-300 ${
              status !== 'idle' ? 'animate-subtle-glow' : ''
            }`}>
              {(status === 'downloading' || status === 'uploading') 
                ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                : (status === 'completed' 
                  ? (unit === 'MB/s' ? ((downloadVal || 0) / 8).toFixed(1) : (downloadVal || 0).toFixed(1)) 
                  : '0.0')}
            </span>
            <span className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#00f0ff] font-extrabold mt-1">{unit}</span>
            
            {/* GO Trigger Button inside layout or below */}
            <div className="mt-4 sm:mt-8">
              <button 
                id="dial-go-button"
                onClick={handleStartTest}
                disabled={status !== 'idle' && status !== 'completed'}
                className={`relative w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all duration-300 group ${
                  status === 'idle' || status === 'completed'
                    ? 'bg-[#05070D]/90 border border-[#00f0ff]/30 cursor-pointer hover:border-[#00f0ff]/60 hover:scale-105 hover:shadow-[#00f0ff]/15' 
                    : 'bg-[#111827] border border-[#1e293b] cursor-not-allowed opacity-40'
                }`}
              >
                {/* Rippling effects around button */}
                {(status === 'idle' || status === 'completed') && (
                  <div className="absolute inset-0 rounded-full animate-ripple-wave opacity-30"></div>
                )}
                
                <span className="font-sans text-sm sm:text-base xl:text-lg font-extrabold tracking-widest text-primary group-hover:text-white transition-all duration-300">
                  {status === 'idle' ? 'GO' : (status === 'completed' ? 'RETRY' : 'RUNNING')}
                </span>
                
                {status === 'pinging' && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-white/70 mt-0.5 sm:mt-1 uppercase tracking-widest z-10 animate-pulse font-sans">PING</span>
                )}
                {status === 'jittering' && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-white/70 mt-0.5 sm:mt-1 uppercase tracking-widest z-10 animate-pulse font-sans">JITTER</span>
                )}
                {status === 'downloading' && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-white/70 mt-0.5 sm:mt-1 uppercase tracking-widest z-10 animate-pulse font-sans">DOWN</span>
                )}
                {status === 'uploading' && (
                  <span className="text-[9px] sm:text-[10px] font-bold text-white/70 mt-0.5 sm:mt-1 uppercase tracking-widest z-10 animate-pulse font-sans">UP</span>
                )}
              </button>
            </div>
          </div>
        </div>
 
        {/* UPLOAD CARD */}
        <div className={`col-span-1 order-3 xl:order-3 bg-[#080d1a]/85 backdrop-blur-xl border border-[#1e293b] rounded-2xl p-4 sm:p-6 flex flex-col relative overflow-hidden w-full max-w-xs h-32 sm:h-40 xl:h-44 shadow-2xl transition-all duration-500 hover:border-secondary/50 ${
          status === 'uploading' ? 'ring-2 ring-secondary/40 border-secondary/50' : ''
        }`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent opacity-80"></div>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div className={`p-1.5 sm:p-2 rounded-full transition-colors ${status === 'uploading' ? 'bg-secondary/20 text-secondary' : 'bg-secondary/10 text-[#94A3B8]'}`}>
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-sans font-extrabold text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.15em] text-[#94A3B8] uppercase">Upload</span>
            {status === 'uploading' && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
            )}
          </div>
 
          <div className="flex items-baseline gap-1 sm:gap-2 mt-auto z-10">
            <span id="upload-val" className="font-sans text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black text-white tracking-tighter">
              {uploadVal !== null 
                ? (unit === 'MB/s' ? (uploadVal / 8).toFixed(1) : uploadVal.toFixed(1)) 
                : (status === 'uploading' 
                  ? (unit === 'MB/s' ? (currentSpeed / 8).toFixed(1) : currentSpeed.toFixed(1)) 
                  : '--')}
            </span>
            <span className="font-sans text-xs sm:text-sm font-bold text-[#94A3B8]">{unit}</span>
          </div>
 
          {/* Sparkline for upload speed progression */}
          {(status === 'uploading' || status === 'completed') && uploadGraphPaths && (
            <div className="absolute bottom-1 sm:bottom-2 left-4 sm:left-6 right-4 sm:right-6 h-8 sm:h-10 opacity-60">
              <svg id="upload-sparkline" viewBox="0 0 280 40" className="w-full h-full overflow-visible">
                <path d={uploadGraphPaths.fill} fill="url(#upGrad)" opacity="0.15" />
                <path d={uploadGraphPaths.stroke} fill="none" stroke="var(--color-secondary)" strokeWidth="1.5" />
                <defs>
                  <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
 
      </div>

      {/* METRICS & TELEMETRY SUMMARY BAR */}
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#080d19]/80 to-[#04060b]/90 backdrop-blur-xl border border-[#1e293b] rounded-2xl p-3 sm:py-3 sm:px-6 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-0 items-center justify-items-stretch shadow-2xl mt-auto md:mt-2">
        
        {/* PING */}
        <div className="flex flex-col items-center md:items-start col-span-1 px-3 py-1 sm:py-0 border-r border-[#1e293b]/40">
          <span className="font-sans font-bold text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] text-[#94A3B8] uppercase">Ping</span>
          <span id="ping-val" className="font-mono text-base sm:text-lg md:text-xl font-bold text-white mt-1">
            {pingVal !== null ? `${pingVal} ms` : '-- ms'}
          </span>
        </div>
        
        {/* JITTER */}
        <div className="flex flex-col items-center md:items-start col-span-1 px-3 py-1 sm:py-0 md:border-r md:border-[#1e293b]/40">
          <span className="font-sans font-bold text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] text-[#94A3B8] uppercase">Jitter</span>
          <span id="jitter-val" className="font-mono text-base sm:text-lg md:text-xl font-bold text-white mt-1">
            {jitterVal !== null ? `${jitterVal} ms` : '-- ms'}
          </span>
        </div>

        {/* SERVER */}
        <div className="flex flex-col items-center md:items-end col-span-2 md:col-span-1 px-3 border-t border-[#1e293b]/50 md:border-t-0 pt-3.5 md:pt-0">
          <span className="font-sans font-bold text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] text-[#94A3B8] uppercase text-center md:text-right">Test Host Server</span>
          <div className="flex items-center gap-1.5 mt-1.5 max-w-full justify-center md:justify-end">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-sans text-xs sm:text-sm font-bold text-white truncate max-w-[200px] xs:max-w-xs md:max-w-[180px] lg:max-w-[240px]">
              Cloudflare CDN
            </span>
          </div>
        </div>

      </div>

      {/* FOOTER TIPS CHIP */}
      {status === 'completed' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[#00F0FF] animate-fade-in bg-[#00F0FF]/10 px-4 py-1 rounded-full border border-[#00F0FF]/25 shadow-[0_0_10px_rgba(0,240,255,0.05)]">
          <CheckCircle className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="font-sans font-semibold">Test finished. Telemetry results safely tracked.</span>
        </div>
      )}
    </div>
  );
}
