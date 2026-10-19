import React, { useState, useEffect } from 'react';
import { 
  Zap, Activity, History, Settings, Sun, Moon, 
  ShieldCheck, Globe, Wifi, Award
} from 'lucide-react';
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
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SpeedTestResult, SimulationSettings } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'speed' | 'diagnostics' | 'history' | 'settings'>('speed');
  const [unit, setUnit] = useState<'Mbps' | 'MB/s'>('Mbps');
  const [isTesting, setIsTesting] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<SpeedTestResult | null>(null);

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
          <div 
            onClick={() => setActiveTab('speed')}
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
          </div>

          {/* Desktop Navigation Segmented Pill */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  id={`nav-desktop-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                    isActive 
                      ? 'bg-white dark:bg-[#151824] text-slate-950 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/[0.1]' 
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
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
                </button>
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

            {/* Throughput Unit Toggle (Mbps / MB/s) */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] shrink-0">
              <button
                type="button"
                onClick={() => setUnit('Mbps')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  unit === 'Mbps'
                    ? 'bg-white dark:bg-[#151824] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Megabits per second (standard broadband telecom unit)"
              >
                Mbps
              </button>
              <button
                type="button"
                onClick={() => setUnit('MB/s')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  unit === 'MB/s'
                    ? 'bg-white dark:bg-[#151824] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Megabytes per second (actual file download transfer rate)"
              >
                MB/s
              </button>
            </div>

            {/* Verified Certificate Quick Launch (When Available) */}
            {latestResult && (
              <button
                onClick={() => setCertificateModalOpen(true)}
                title="View Verified Speed Certificate"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificate</span>
              </button>
            )}

            {/* Dark / Light Mode Switch */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-100/90 dark:bg-white/[0.04] text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              aria-label="Toggle visual theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Main Responsive Content Arena */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col min-w-0">
        <div key={activeTab} className="animate-hud-in w-full min-w-0">
          {activeTab === 'speed' && (
            <SpeedTest 
              settings={settings} 
              onUpdateSettings={setSettings} 
              onTestComplete={handleTestComplete}
              onTestingStateChange={setIsTesting}
              unit={unit}
            />
          )}

          {activeTab === 'diagnostics' && (
            <div className="w-full flex flex-col gap-4 pb-20 md:pb-6 min-w-0">
              {/* Full Width Hop-by-Hop Edge Route Trace */}
              <div className="w-full min-w-0">
                <RouteTracer />
              </div>

              {/* 2-Column Balanced Diagnostics Bento */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start min-w-0">
                <div className="flex flex-col gap-4 min-w-0">
                  <DnsBenchmark />
                  <MtuAnalyzer />
                  <CdnBenchmark />
                </div>
                <div className="flex flex-col gap-4 min-w-0">
                  <DualStackBenchmark />
                  <WifiAnalyzer />
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
        </div>
      </main>

      {/* Mobile Ergonomic Bottom Command Dock */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-2 inset-x-2 z-50 pointer-events-none"
      >
        <div className="mx-auto max-w-sm bg-white/95 dark:bg-[#11131C]/95 border border-slate-200 dark:border-white/[0.1] backdrop-blur-xl rounded-2xl p-1 flex items-center justify-around shadow-lg shadow-black/20 pointer-events-auto">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer relative select-none ${
                  isActive 
                    ? 'text-slate-900 dark:text-white font-bold' 
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive 
                    ? (item.id === 'speed' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : item.id === 'diagnostics' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : item.id === 'history' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200/60 dark:bg-white/[0.08] text-slate-800 dark:text-zinc-200')
                    : 'bg-transparent'
                }`}>
                  <IconComp className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-[9px] font-semibold tracking-tight">
                  {item.label.split(' ')[0]}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[8px] font-bold text-white flex items-center justify-center font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
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
