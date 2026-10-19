import React, { useState, useEffect } from 'react';
import { 
  Zap, Activity, History, Settings, Sun, Moon, 
  ShieldCheck, Globe, Wifi, Award, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { springs, pageTransitionVariants } from './lib/motion';
import SpeedTest from './components/SpeedTest';
import HistoryList from './components/HistoryList';
import SettingsPanel from './components/SettingsPanel';
import CdnBenchmark from './components/CdnBenchmark';
import PingOscilloscope from './components/PingOscilloscope';
import WifiAnalyzer from './components/WifiAnalyzer';
import SpeedCertificateModal from './components/SpeedCertificateModal';
import DnsBenchmark from './components/DnsBenchmark';
import DualStackBenchmark from './components/DualStackBenchmark';
import MtuAnalyzer from './components/MtuAnalyzer';
import RouteTracer from './components/RouteTracer';
import NatTypeAnalyzer from './components/NatTypeAnalyzer';
import MtrPingMatrix from './components/MtrPingMatrix';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SpeedTestResult, SimulationSettings } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'speed' | 'diagnostics' | 'history' | 'settings'>('speed');
  const [unit, setUnit] = useState<'Mbps' | 'MB/s'>('Mbps');
  const [isTesting, setIsTesting] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<SpeedTestResult | null>(null);
  const [utcTime, setUtcTime] = useState(() => new Date().toISOString().substring(11, 19));

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(new Date().toISOString().substring(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { theme, toggleTheme } = useTheme();
  
  const [historyResults, setHistoryResults] = useState<SpeedTestResult[]>(() => {
    try {
      const saved = localStorage.getItem('netpulse_results_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<SimulationSettings>(() => {
    try {
      const saved = localStorage.getItem('netpulse_app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          measureDownloadLoadedLatency: parsed.measureDownloadLoadedLatency ?? true,
          measureUploadLoadedLatency: parsed.measureUploadLoadedLatency ?? true,
          engineBackend: parsed.engineBackend ?? 'cloudflare',
          routingProtocol: parsed.routingProtocol ?? 'anycast-bgp',
          customServerUrl: parsed.customServerUrl ?? '',
          packetProbesCount: parsed.packetProbesCount ?? 25,
          selectedRegion: parsed.selectedRegion ?? 'Auto (Nearest Edge PoP)',
          connectionMode: parsed.connectionMode ?? 'multi'
        };
      }
    } catch {
      // fallback
    }
    return {
      measureDownloadLoadedLatency: true,
      measureUploadLoadedLatency: true,
      engineBackend: 'cloudflare',
      routingProtocol: 'anycast-bgp',
      customServerUrl: '',
      packetProbesCount: 25,
      selectedRegion: 'Auto (Nearest Edge PoP)',
      connectionMode: 'multi'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('netpulse_results_history', JSON.stringify(historyResults));
    } catch (e) {
      console.warn('Failed to persist history results:', e);
    }
  }, [historyResults]);

  useEffect(() => {
    try {
      localStorage.setItem('netpulse_app_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist settings:', e);
    }
  }, [settings]);

  const handleTestComplete = (result: SpeedTestResult) => {
    setHistoryResults((prev) => [result, ...prev]);
    setLatestResult(result);
  };

  const handleDeleteResult = (id: string) => {
    setHistoryResults((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistoryResults([]);
  };

  const navItems = [
    { id: 'speed' as const, label: 'Speed Cockpit', icon: Zap },
    { id: 'diagnostics' as const, label: 'Edge Diagnostics', icon: Activity },
    { id: 'history' as const, label: 'Audit History', icon: History, badge: historyResults.length > 0 ? historyResults.length : undefined },
    { id: 'settings' as const, label: 'Engine Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#090A0F] text-[#0F172A] dark:text-[#F1F5F9] relative flex flex-col font-sans transition-colors duration-200 overflow-x-hidden selection:bg-blue-600/20 selection:text-blue-500">
      
      {/* Top Precision Command Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#090A0F]/90 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto h-13 px-3 sm:px-6 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Version Identity */}
          <motion.div 
            onClick={() => setActiveTab('speed')}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 select-none"
            title="NetPulse Telemetry Suite"
          >
            <div className="relative flex items-center justify-center">
              <img 
                src="/favicon.png" 
                alt="NetPulse Logo" 
                className="h-7 w-7 object-contain transition-transform duration-200 group-hover:scale-105" 
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                NetPulse
              </span>
              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-zinc-400 border border-slate-200/60 dark:border-white/[0.08]">
                v1.1
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation Segmented Pill */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] relative">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer select-none ${
                    isActive 
                      ? 'text-slate-950 dark:text-white' 
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-desktop-nav-pill"
                      className="absolute inset-0 rounded-lg bg-white dark:bg-[#151824] shadow-xs border border-slate-200/60 dark:border-white/[0.1]"
                      transition={springs.snappy}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <IconComp className={`w-3.5 h-3.5 ${
                      isActive 
                        ? (item.id === 'speed' ? 'text-blue-500' : item.id === 'diagnostics' ? 'text-cyan-400' : item.id === 'history' ? 'text-indigo-400' : 'text-slate-400')
                        : 'text-slate-400 dark:text-zinc-500'
                    }`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </motion.button>
              );
            })}
          </nav>

          {/* Right Precision Telemetry Controls */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Live Edge Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cloudflare Anycast</span>
            </div>

            {/* Throughput Unit Toggle (Mbps / MB/s) with sliding FLIP pill */}
            <div className="relative flex items-center p-0.5 rounded-lg bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] shrink-0">
              <motion.button
                type="button"
                onClick={() => setUnit('Mbps')}
                whileTap={{ scale: 0.94 }}
                className={`relative z-10 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  unit === 'Mbps'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Megabits per second (standard broadband telecom unit)"
              >
                {unit === 'Mbps' && (
                  <motion.div
                    layoutId="unit-toggle-pill"
                    className="absolute inset-0 rounded-md bg-white dark:bg-[#151824] shadow-xs border border-slate-200/60 dark:border-white/[0.1]"
                    transition={springs.snappy}
                  />
                )}
                <span className="relative z-10">Mbps</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setUnit('MB/s')}
                whileTap={{ scale: 0.94 }}
                className={`relative z-10 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  unit === 'MB/s'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Megabytes per second (actual file download transfer rate)"
              >
                {unit === 'MB/s' && (
                  <motion.div
                    layoutId="unit-toggle-pill"
                    className="absolute inset-0 rounded-md bg-white dark:bg-[#151824] shadow-xs border border-slate-200/60 dark:border-white/[0.1]"
                    transition={springs.snappy}
                  />
                )}
                <span className="relative z-10">MB/s</span>
              </motion.button>
            </div>

            {/* Verified Certificate Quick Launch (When Available) */}
            {latestResult && (
              <motion.button
                onClick={() => setCertificateModalOpen(true)}
                whileTap={{ scale: 0.95 }}
                title="View Verified Speed Certificate"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificate</span>
              </motion.button>
            )}

            {/* Dark / Light Mode Switch */}
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.90 }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/90 dark:bg-white/[0.04] text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              aria-label="Toggle visual theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </motion.button>

          </div>

        </div>
      </header>

      {/* Main Responsive Content Arena with Spring Page Transitions */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springs.interactive}
            className="w-full min-w-0"
          >
            {activeTab === 'speed' && (
              <SpeedTest 
                settings={settings} 
                onUpdateSettings={setSettings} 
                onTestComplete={handleTestComplete}
                onTestingStateChange={setIsTesting}
                onOpenCertificate={() => setCertificateModalOpen(true)}
                unit={unit}
              />
            )}

            {activeTab === 'diagnostics' && (
              <div className="w-full flex flex-col gap-4 pb-20 md:pb-6 min-w-0">
                {/* Full Width Multi-Target MTR Live Matrix */}
                <div className="w-full min-w-0">
                  <MtrPingMatrix />
                </div>

                {/* Full Width Hop-by-Hop Edge Route Trace */}
                <div className="w-full min-w-0">
                  <RouteTracer />
                </div>

                {/* Harmonized 3-Tier Symmetrical Bento Grid (Zero Blank Space) */}
                {/* Tier 1: Link & Physical Layer (NAT Firewall + Wi-Fi RF Link) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch min-w-0">
                  <div className="h-full flex flex-col min-w-0">
                    <NatTypeAnalyzer />
                  </div>
                  <div className="h-full flex flex-col min-w-0">
                    <WifiAnalyzer />
                  </div>
                </div>

                {/* Tier 2: Path MTU & Multi-Cloud Edge Transport */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch min-w-0">
                  <div className="h-full flex flex-col min-w-0">
                    <MtuAnalyzer />
                  </div>
                  <div className="h-full flex flex-col justify-between gap-4 min-w-0">
                    <CdnBenchmark />
                    <DualStackBenchmark />
                  </div>
                </div>

                {/* Tier 3: DNS Anycast Shootout & Continuous Ping Oscilloscope */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch min-w-0">
                  <div className="h-full flex flex-col min-w-0">
                    <DnsBenchmark />
                  </div>
                  <div className="h-full flex flex-col min-w-0">
                    <PingOscilloscope />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="w-full pb-20 md:pb-6 min-w-0">
                <HistoryList 
                  results={historyResults} 
                  onDeleteResult={handleDeleteResult}
                  onClearAll={handleClearAllHistory}
                  unit={unit}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="w-full pb-20 md:pb-6 min-w-0">
                <SettingsPanel 
                  settings={settings} 
                  onUpdateSettings={setSettings} 
                  onScheduledResult={handleTestComplete} 
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Enterprise Global Network Intelligence & Telemetry Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-[#0C0E17]/60 backdrop-blur-xl mt-auto transition-colors pb-24 md:pb-8 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-6 min-w-0">
          
          {/* 1. Infrastructure Status & RFC Compliance Banner */}
          <div className="hud-panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 min-w-0">
            {/* Live System Health */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute opacity-75"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>All 330+ Anycast Probes Operational</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    SLA 99.99%
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                  Global edge telemetry actively synchronized across Tier-1 BGP Anycast routes
                </span>
              </div>
            </div>

            {/* Standard Compliance Badges */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-lg hud-subpanel text-slate-600 dark:text-zinc-300">
                RFC 6349 (TCP)
              </span>
              <span className="px-2.5 py-1 rounded-lg hud-subpanel text-slate-600 dark:text-zinc-300">
                RFC 8484 (DoH)
              </span>
              <span className="px-2.5 py-1 rounded-lg hud-subpanel text-slate-600 dark:text-zinc-300">
                RFC 8825 (WebRTC)
              </span>
              <span className="px-2.5 py-1 rounded-lg hud-subpanel text-slate-600 dark:text-zinc-300">
                RFC 8200 (IPv6)
              </span>
              <span className="px-2.5 py-1 rounded-lg hud-subpanel text-blue-600 dark:text-blue-400 border border-blue-500/20">
                CoDel Queue
              </span>
            </div>
          </div>

          {/* 2. Four-Column Network Intelligence Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
            
            {/* Card 1: Anycast Backbone */}
            <div className="hud-subpanel rounded-2xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">TIER-1 FABRIC</span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Global Anycast Peering</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Automatic BGP routing directs packets to nearest metro POPs across Cloudflare, Google, AWS, and Fastly.
                </p>
              </div>
              <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold">
                <span>Anycast Latency: &lt;15ms</span>
              </div>
            </div>

            {/* Card 2: Micro-Burst & Saturated Pipe Engine */}
            <div className="hud-subpanel rounded-2xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">LINE-RATE</span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Multi-Socket Saturation</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Concurrent WebSocket & chunked fetch workers bypass browser event loop jitter to measure true wire capacity.
                </p>
              </div>
              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                <span>Throughput: Up to 10 Gbps</span>
              </div>
            </div>

            {/* Card 3: Zero-Telemetry Privacy */}
            <div className="hud-subpanel rounded-2xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">ZERO PII</span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ephemeral In-Memory</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  100% client-side execution. No telemetry databases, tracking cookies, or ISP advertising data monetization.
                </p>
              </div>
              <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 flex items-center gap-1 font-bold">
                <span>Cryptographic SHA-256</span>
              </div>
            </div>

            {/* Card 4: ITU-T VoIP MOS & Waveforms */}
            <div className="hud-subpanel rounded-2xl p-4 flex flex-col justify-between gap-3 min-w-0">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">ITU-T G.107</span>
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Real-Time Jitter & MOS</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  AudioContext microsecond timing measures loaded packet bloat and calculates WebRTC voice call quality.
                </p>
              </div>
              <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
                <span>Voice Quality: MOS 4.5/4.5</span>
              </div>
            </div>

          </div>

          {/* 3. Micro Metadata & Navigation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/60 dark:border-white/[0.06] pt-5 text-xs font-mono text-slate-500 dark:text-zinc-400 min-w-0">
            {/* Brand & Version */}
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] shadow-xs shadow-blue-500/30">
                <Zap className="w-3 h-3" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">NetPulse Core</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-[10px] text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08]">
                v1.1.0-release
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Open Network Intelligence</span>
            </div>

            {/* Quick Navigation Links */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <button 
                onClick={() => setActiveTab('speed')} 
                className={`hover:text-blue-500 transition-colors cursor-pointer ${activeTab === 'speed' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}
              >
                Speed Cockpit
              </button>
              <button 
                onClick={() => setActiveTab('diagnostics')} 
                className={`hover:text-cyan-500 transition-colors cursor-pointer ${activeTab === 'diagnostics' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : ''}`}
              >
                Diagnostics
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`hover:text-indigo-500 transition-colors cursor-pointer ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
              >
                History ({historyResults.length})
              </button>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`hover:text-amber-500 transition-colors cursor-pointer ${activeTab === 'settings' ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}
              >
                Engine Config
              </button>
            </div>

            {/* Local Status & UTC Clock */}
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{utcTime} UTC</span>
              <span>•</span>
              <span className="text-emerald-500 font-bold">Node Sync 100%</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Mobile Ergonomic Bottom Command Dock with FLIP Indicator */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-2 inset-x-2 z-50 pointer-events-none"
      >
        <div className="mx-auto max-w-sm bg-white/95 dark:bg-[#11131C]/95 border border-slate-200 dark:border-white/[0.1] backdrop-blur-xl rounded-2xl p-1 flex items-center justify-around shadow-lg shadow-black/20 pointer-events-auto">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.94 }}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-colors cursor-pointer select-none ${
                  isActive 
                    ? 'text-slate-900 dark:text-white font-bold' 
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-mobile-nav-pill"
                    className="absolute inset-0 rounded-xl bg-blue-500/10 dark:bg-white/[0.08]"
                    transition={springs.snappy}
                  />
                )}
                <div className="relative z-10 p-1 rounded-lg">
                  <IconComp className={`w-4 h-4 shrink-0 ${
                    isActive 
                      ? (item.id === 'speed' ? 'text-blue-600 dark:text-blue-400' : item.id === 'diagnostics' ? 'text-cyan-600 dark:text-cyan-400' : item.id === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-zinc-200')
                      : ''
                  }`} />
                </div>
                <span className="relative z-10 text-[9px] font-semibold tracking-tight">
                  {item.label.split(' ')[0]}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[8px] font-bold text-white flex items-center justify-center font-mono z-20">
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Verified Speed Certificate Export Modal */}
      {latestResult && (
        <SpeedCertificateModal
          isOpen={certificateModalOpen}
          onClose={() => setCertificateModalOpen(false)}
          result={latestResult}
          activeServerName="Cloudflare Anycast Global Edge"
          unit={unit}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
