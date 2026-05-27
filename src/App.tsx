import React, { useState, useEffect } from 'react';
import { Bolt, History, Settings } from 'lucide-react';
import { SpeedTestResult, SimulationSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import SpeedTest from './components/SpeedTest';
import HistoryList from './components/HistoryList';
import SettingsPanel from './components/SettingsPanel';

// Populate initial beautiful telemetry history results so the app isn't blank on launch
const INITIAL_MOCK_RESULTS: SpeedTestResult[] = [
  {
    id: 'mock-1',
    timestamp: '2026-05-26T18:40:00.000Z',
    downloadMbps: 915.4,
    uploadMbps: 840.1,
    pingMs: 4,
    jitterMs: 0.9,
    serverName: 'New York, NY (USA) - NetPulse Edge-1'
  },
  {
    id: 'mock-2',
    timestamp: '2026-05-26T21:15:30.000Z',
    downloadMbps: 298.6,
    uploadMbps: 41.5,
    pingMs: 19,
    jitterMs: 2.8,
    serverName: 'New York, NY (USA) - NetPulse Edge-1'
  },
  {
    id: 'mock-3',
    timestamp: '2026-05-27T02:05:10.000Z',
    downloadMbps: 98.2,
    uploadMbps: 16.4,
    pingMs: 45,
    jitterMs: 7.1,
    serverName: 'London, UK - NetPulse Edge-3'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'speed' | 'history' | 'settings'>('speed');
  const [unit, setUnit] = useState<'Mbps' | 'MB/s'>('Mbps');
  
  // Load settings and results from localStorage or defaults
  const [settings, setSettings] = useState<SimulationSettings>(() => {
    const saved = localStorage.getItem('netpulse_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [results, setResults] = useState<SpeedTestResult[]>(() => {
    const saved = localStorage.getItem('netpulse_results');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_RESULTS;
  });

  // Sync to database triggers (local persistence fallback)
  useEffect(() => {
    localStorage.setItem('netpulse_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('netpulse_results', JSON.stringify(results));
  }, [results]);

  const handleTestComplete = (newResult: SpeedTestResult) => {
    setResults(prev => [newResult, ...prev]);
  };

  const handleDeleteResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const handleClearAllResults = () => {
    setResults([]);
  };

  interface NavItem {
    id: 'speed' | 'history' | 'settings';
    label: string;
    icon: React.ComponentType<any>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'speed', label: 'Speed', icon: Bolt },
    { id: 'history', label: 'History', icon: History, badge: results.length > 0 ? results.length : undefined },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Render correct nested viewport based on activeTab selection
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
            results={results} 
            onDeleteResult={handleDeleteResult} 
            onClearAll={handleClearAllResults} 
            unit={unit}
          />
        );
      case 'settings':
        return <SettingsPanel settings={settings} onUpdateSettings={setSettings} />;
    }
  };

  return (
    <div className="h-dvh max-h-dvh w-screen bg-background text-on-background ambient-bg relative overflow-hidden flex flex-col font-sans">
      
      {/* Main Desktop Header */}
      <header className="w-full shrink-0 flex items-center justify-between px-6 sm:px-12 h-20 bg-[#030508]/80 backdrop-blur-md border-b border-[#1e293b] z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00F0FF]/10 rounded-xl relative group border border-[#00F0FF]/25">
            <Bolt className="w-6 h-6 text-primary fill-primary/10 transition-transform group-hover:rotate-12 duration-300" />
          </div>
          <h1 className="font-sans text-xl sm:text-2xl font-black tracking-[0.25em] text-white">
            NETPULSE
          </h1>
        </div>
 
        {/* Center Unit Converter Toggle */}
        <div className="flex items-center bg-[#070c17]/65 border border-[#1e293b] p-0.5 rounded-xl shadow-2xl relative">
          <button
            onClick={() => setUnit('Mbps')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              unit === 'Mbps'
                ? 'bg-primary text-[#030508] shadow-[0_0_8px_rgba(0,240,255,0.25)] font-bold'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Mbps
          </button>
          <button
            onClick={() => setUnit('MB/s')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              unit === 'MB/s'
                ? 'bg-primary text-[#030508] shadow-[0_0_8px_rgba(0,240,255,0.25)] font-bold'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            MB/s
          </button>
        </div>

        {/* Desktop Navigation Header */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-3">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-300 relative border cursor-pointer ${
                  isActive 
                    ? 'text-[#030508] bg-primary font-bold border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]' 
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span className="font-sans text-xs font-bold uppercase tracking-wider hidden sm:inline">
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    isActive ? 'bg-[#030508] text-primary' : 'bg-primary text-[#030508]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Responsive Content Window */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 pb-28 md:p-6 md:px-12 relative z-10 w-full max-w-7xl mx-auto overflow-hidden">
        {renderTabContent()}
      </main>

      {/* Sticky Floating Bottom Navigation Bar for Mobile & Tablet Viewports */}
      <div className="md:hidden fixed bottom-6 inset-x-4 z-50 animate-fade-in">
        <nav className="mx-auto max-w-md bg-[#04060c]/90 border border-[#1e293b]/80 backdrop-blur-xl rounded-2xl py-2 px-4 flex items-center justify-around shadow-[0_15px_35px_rgba(0,0,0,0.65)] border-[#00f0ff]/20">
          {navItems.map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-mobile-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1.5 relative py-1 px-3 rounded-xl transition-all duration-300 relative cursor-pointer ${
                  isActive ? 'text-primary' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-[#00f0ff]/15 text-primary shadow-[0_0_12px_rgba(0,240,255,0.25)]' : 'bg-transparent'
                }`}>
                  <IconComp className="w-5 h-5 shrink-0" />
                </div>
                <span className="font-sans text-[10px] font-black uppercase tracking-widest scale-95">
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-2.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-bold font-mono bg-primary text-[#030508] shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

    </div>
  );
}
