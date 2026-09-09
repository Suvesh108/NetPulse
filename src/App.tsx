import React, { useState, useEffect } from 'react';
import { 
  Activity, History, Settings, Zap, ArrowUpDown, 
  BarChart2, Sun, Moon, Sparkles, Award, ShieldCheck, Gamepad2, Wifi
} from 'lucide-react';
import SpeedTest from './components/SpeedTest';
import HistoryList from './components/HistoryList';
import SettingsPanel from './components/SettingsPanel';
import CdnBenchmark from './components/CdnBenchmark';
import PingOscilloscope from './components/PingOscilloscope';
import WifiAnalyzer from './components/WifiAnalyzer';
import SpeedCertificateModal from './components/SpeedCertificateModal';
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
          measureDownloadLoadedLatency: parsed.measureDownloadLoadedLatency ?? false,
          measureUploadLoadedLatency: parsed.measureUploadLoadedLatency ?? false,
          engineBackend: parsed.engineBackend ?? 'cloudflare',
          routingProtocol: parsed.routingProtocol ?? 'anycast-bgp',
          customServerUrl: parsed.customServerUrl ?? '',
          packetProbesCount: parsed.packetProbesCount ?? 25,
          selectedRegion: parsed.selectedRegion ?? 'Auto (Nearest Edge PoP)'
        };
      }
    } catch {
      // fallback
    }
    return {
      measureDownloadLoadedLatency: false,
      measureUploadLoadedLatency: false,
      engineBackend: 'cloudflare',
      routingProtocol: 'anycast-bgp',
      customServerUrl: '',
      packetProbesCount: 25,
      selectedRegion: 'Auto (Nearest Edge PoP)'
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
    { id: 'speed' as const, label: 'Speed Test', icon: Zap },
    { id: 'diagnostics' as const, label: 'Diagnostics', icon: Activity },
    { id: 'history' as const, label: 'History', icon: History, badge: historyResults.length > 0 ? historyResults.length : undefined },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'speed':
        return (
          <SpeedTest 
            settings={settings} 
            onUpdateSettings={setSettings} 
            onTestComplete={handleTestComplete}
            onTestingStateChange={setIsTesting}
            unit={unit}
          />
        );
      case 'diagnostics':
        return (
          <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto flex flex-col gap-4 pb-24 md:pb-6 animate-fade-in">
            {/* Multi-Server Edge Benchmark */}
            <CdnBenchmark />

            {/* Live Continuous Gaming Latency Monitor */}
            <PingOscilloscope />

            {/* Wi-Fi & Connection Health Analyzer */}
            <WifiAnalyzer />
          </div>
        );
      case 'history':
        return (
          <HistoryList 
            results={historyResults} 
            onDeleteResult={handleDeleteResult}
            onClearAll={handleClearAllHistory}
            unit={unit}
          />
        );
      case 'settings':
        return <SettingsPanel settings={settings} onUpdateSettings={setSettings} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#030712] modern-grid-bg text-[#0F172A] dark:text-[#F8FAFC] relative flex flex-col font-sans selection:bg-blue-500/10 selection:text-blue-600 transition-colors duration-300">
      
      {/* Clean Header */}
      <header className="w-full shrink-0 bg-transparent z-50 pt-2.5 sm:pt-3 px-3 sm:px-8 md:px-16 transition-all">
        <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto h-11 sm:h-12 relative flex items-center justify-between px-1 sm:px-4 md:px-6">
          
          {/* Logo Mark + Text (Left) */}
          <div 
            onClick={() => setActiveTab('speed')} 
            className="flex items-center gap-2.5 group cursor-pointer shrink-0 z-10"
            title="NetPulse Speed Test"
          >
            <img 
              src="/favicon.png" 
              alt="NetPulse Logo" 
              className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 object-contain transition-transform duration-300 group-hover:scale-105 rounded-md" 
            />
            <div className="flex items-baseline gap-1">
              <span className="font-sans text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white select-none">
                NetPulse
              </span>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                PRO
              </span>
            </div>
          </div>

          {/* Unit Selector Pill (Right on Mobile, Perfectly Centered on Desktop) */}
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center bg-slate-100/90 dark:bg-slate-900/90 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-inner z-10 shrink-0">
            <button
              onClick={() => setUnit('Mbps')}
              className={`px-2.5 sm:px-3 py-0.5 rounded-md text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 outline-none focus:outline-none focus:ring-0 select-none ${
                unit === 'Mbps'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Mbps</span>
            </button>
            <button
              onClick={() => setUnit('MB/s')}
              className={`px-2.5 sm:px-3 py-0.5 rounded-md text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 outline-none focus:outline-none focus:ring-0 select-none ${
                unit === 'MB/s'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>MB/s</span>
            </button>
          </div>

          {/* Header Right Controls: Dark Mode Toggle & Desktop Navigation */}
          <div className="flex items-center gap-2 z-10">
            
            {/* Dark / Light Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Midnight OLED Dark' : 'Clean Light'} mode`}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-amber-400 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" /> : <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
            </button>

            {/* Desktop Navigation Switcher */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    id={`nav-desktop-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer relative outline-none focus:outline-none focus:ring-0 select-none ${
                      isActive 
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${
                      isActive 
                        ? (item.id === 'speed' ? 'text-blue-600 dark:text-blue-400' : item.id === 'diagnostics' ? 'text-cyan-600 dark:text-cyan-400' : item.id === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200')
                        : 'text-slate-400'
                    }`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

        </div>
      </header>

      {/* Main Responsive Content Arena */}
      <main className="flex-1 flex flex-col items-center justify-start p-2.5 sm:p-3.5 md:px-6 relative z-10 w-full max-w-7xl 2xl:max-w-[1500px] mx-auto pb-6 md:pb-4">
        {renderTabContent()}
      </main>

      {/* Floating Bottom Navigation Bar for Mobile & Tablet */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-50 animate-fade-in pointer-events-none">
        <nav className="mx-auto max-w-sm bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 backdrop-blur-2xl rounded-2xl p-1.5 flex items-center justify-around shadow-2xl shadow-slate-900/10 pointer-events-auto">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer relative outline-none focus:outline-none focus:ring-0 select-none ${
                  isActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${
                  isActive 
                    ? (item.id === 'speed' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shadow-xs' : item.id === 'diagnostics' ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 shadow-xs' : item.id === 'history' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs')
                    : 'bg-transparent text-slate-400'
                }`}>
                  <IconComp className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-[9px] uppercase font-extrabold tracking-tight">
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-1/4 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center font-mono shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Speed Certificate Export Modal */}
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
