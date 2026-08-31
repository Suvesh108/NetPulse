import React, { useState, useEffect } from 'react';
import { Activity, History, Settings, Zap, ArrowUpDown } from 'lucide-react';
import SpeedTest from './components/SpeedTest';
import HistoryList from './components/HistoryList';
import SettingsPanel from './components/SettingsPanel';
import { SpeedTestResult, SimulationSettings } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'speed' | 'history' | 'settings'>('speed');
  const [unit, setUnit] = useState<'Mbps' | 'MB/s'>('Mbps');
  
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
      return saved ? JSON.parse(saved) : {
        measureDownloadLoadedLatency: false,
        measureUploadLoadedLatency: false
      };
    } catch {
      return {
        measureDownloadLoadedLatency: false,
        measureUploadLoadedLatency: false
      };
    }
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
  };

  const handleDeleteResult = (id: string) => {
    setHistoryResults((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistoryResults([]);
  };

  const navItems = [
    { id: 'speed' as const, label: 'Speed Test', icon: Zap },
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
            unit={unit}
          />
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
    <div className="min-h-screen w-full bg-[#F8FAFC] modern-grid-bg text-[#0F172A] relative flex flex-col font-sans selection:bg-blue-500/10 selection:text-blue-600">
      
      {/* Sleek Header */}
      <header className="w-full shrink-0 flex items-center justify-between px-4 sm:px-8 md:px-12 h-14 sm:h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 z-50 sticky top-0 transition-all">
        
        {/* Brand Logo with Live Status Node */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <Zap className="w-4 h-4 fill-white/20 transition-transform group-hover:rotate-12 duration-300" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-base sm:text-lg font-black tracking-tight text-slate-900">
                NetPulse
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200/60 uppercase tracking-wider hidden sm:inline-flex">
                Pro
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium hidden xs:inline">Edge Speed Telemetry</span>
          </div>
        </div>

        {/* Center Unit Selector Pill */}
        <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 shadow-inner">
          <button
            onClick={() => setUnit('Mbps')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 ${
              unit === 'Mbps'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Mbps</span>
          </button>
          <button
            onClick={() => setUnit('MB/s')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 ${
              unit === 'MB/s'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>MB/s</span>
          </button>
        </div>

        {/* Desktop Navigation Switcher */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  isActive 
                    ? (item.id === 'speed' ? 'text-blue-600' : item.id === 'history' ? 'text-indigo-600' : 'text-slate-800')
                    : 'text-slate-400'
                }`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono bg-indigo-50 text-indigo-600 border border-indigo-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Responsive Full-Width Content Arena */}
      <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-5 md:px-8 relative z-10 w-full max-w-7xl 2xl:max-w-[1600px] mx-auto pb-20 md:pb-6">
        {renderTabContent()}
      </main>

      {/* Floating Bottom Navigation Bar for Mobile & Tablet */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-50 animate-fade-in">
        <nav className="mx-auto max-w-sm bg-white/90 border border-slate-200/90 backdrop-blur-2xl rounded-2xl p-1.5 flex items-center justify-around shadow-xl shadow-slate-900/5">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer relative ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${
                  isActive 
                    ? (item.id === 'speed' ? 'bg-blue-50 text-blue-600' : item.id === 'history' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-800')
                    : 'bg-transparent text-slate-400'
                }`}>
                  <IconComp className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-[9px] uppercase tracking-wider font-semibold">
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-indigo-500"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

    </div>
  );
}
