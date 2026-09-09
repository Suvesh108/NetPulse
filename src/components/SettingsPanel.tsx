import React, { useState, useRef, useEffect } from 'react';
import { 
  ToggleLeft, ToggleRight, Globe, Download, Upload, Server, ShieldCheck, 
  Cpu, Network, Radio, Zap, Check, ChevronDown, ChevronUp, Sliders, Activity, Sparkles
} from 'lucide-react';
import { SimulationSettings, EngineBackend, RoutingProtocol } from '../types';
import InAppUpdater from './InAppUpdater';
import ScheduledTests from './ScheduledTests';

interface SettingsPanelProps {
  settings: SimulationSettings;
  onUpdateSettings: (settings: SimulationSettings) => void;
}

export default function SettingsPanel({ settings, onUpdateSettings }: SettingsPanelProps) {
  const [backendDropdownOpen, setBackendDropdownOpen] = useState(false);
  const [protocolDropdownOpen, setProtocolDropdownOpen] = useState(false);

  const backendRef = useRef<HTMLDivElement>(null);
  const protocolRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (backendRef.current && !backendRef.current.contains(event.target as Node)) {
        setBackendDropdownOpen(false);
      }
      if (protocolRef.current && !protocolRef.current.contains(event.target as Node)) {
        setProtocolDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleUpdateField = <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  const engineBackends: {
    id: EngineBackend;
    name: string;
    description: string;
    pops: string;
    badge: string;
    color: string;
    protocolSupport: string;
  }[] = [
    {
      id: 'cloudflare',
      name: 'Cloudflare Global Edge CDN',
      description: 'Ultra-low latency Anycast mesh with HTTP/3 & 0-RTT handshakes.',
      pops: '330+ Global PoPs',
      badge: 'Recommended',
      color: 'text-[#F6821F] bg-orange-50 border-orange-200',
      protocolSupport: 'HTTP/3, HTTP/2, Anycast'
    },
    {
      id: 'fastly',
      name: 'Fastly High-Capacity Edge',
      description: 'Lucid dynamic cache with high-throughput multi-gigabit conduits.',
      pops: '180+ Core PoPs',
      badge: 'High Throughput',
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      protocolSupport: 'HTTP/3, HTTP/2'
    },
    {
      id: 'cloudfront',
      name: 'AWS CloudFront Global Backbone',
      description: 'Dedicated Amazon global fiber network with multi-region edge caching.',
      pops: '600+ Points of Presence',
      badge: 'Enterprise',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      protocolSupport: 'HTTP/2, TLS 1.3'
    },
    {
      id: 'gcp',
      name: 'Google Cloud CDN (Premium Tier)',
      description: 'Direct access to Google private global fiber optic network.',
      pops: '200+ Edge Locations',
      badge: 'Low Jitter',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      protocolSupport: 'QUIC / HTTP/3, BBR'
    },
    {
      id: 'akamai',
      name: 'Akamai Connected Edge Network',
      description: 'Massive globally distributed hyper-dense edge presence.',
      pops: '4000+ Distributed Locations',
      badge: 'Maximum Reach',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      protocolSupport: 'HTTP/2, Anycast'
    },
    {
      id: 'custom',
      name: 'Custom / Self-Hosted Speed Node',
      description: 'Target a custom dedicated measurement backend or enterprise mirror.',
      pops: 'User Defined',
      badge: 'Developer',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      protocolSupport: 'Custom REST / WebSocket'
    }
  ];

  const routingProtocols: {
    id: RoutingProtocol;
    name: string;
    description: string;
    speedTag: string;
    icon: string;
  }[] = [
    {
      id: 'anycast-bgp',
      name: 'Anycast BGP Smart Routing',
      description: 'Autonomous System (AS) routes packets to closest edge node automatically.',
      speedTag: 'Optimal Latency',
      icon: '🌐'
    },
    {
      id: 'http3-quic',
      name: 'HTTP/3 over QUIC (UDP 0-RTT)',
      description: 'UDP transport with zero head-of-line blocking and instant encryption.',
      speedTag: 'Fastest Handshake',
      icon: '⚡'
    },
    {
      id: 'http2-tcp',
      name: 'HTTP/2 Multiplexed (TCP TLS 1.3)',
      description: 'Parallel streaming over persistent TCP connection with TLS 1.3 crypto.',
      speedTag: 'Broad Support',
      icon: '🔒'
    },
    {
      id: 'geodns-unicast',
      name: 'GeoDNS Direct Unicast Routing',
      description: 'Direct IP resolution to regional server clusters without Anycast hops.',
      speedTag: 'Predictable Path',
      icon: '📍'
    },
    {
      id: 'multipath-adaptive',
      name: 'Multi-Path Adaptive Fallback',
      description: 'Dynamically shifts between UDP QUIC and TCP streams on firewalls.',
      speedTag: 'Resilient',
      icon: '🛡️'
    }
  ];

  const selectedBackend = engineBackends.find(e => e.id === settings.engineBackend) || engineBackends[0];
  const selectedProtocol = routingProtocols.find(p => p.id === settings.routingProtocol) || routingProtocols[0];

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto flex flex-col gap-4 pb-28 md:pb-16 flex-1 min-h-0 select-none animate-fade-in" id="settings-section">
      
      {/* 2-COLUMN BALANCED BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-start">
        
        {/* LEFT COLUMN: TOPOLOGY, BUFFERBLOAT & CONFIG MATRIX */}
        <div className="flex flex-col gap-3.5 sm:gap-4">
          
          {/* Card 1: Network & Engine Topology */}
          <div className="premium-card bg-white dark:bg-[#121212] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4 transition-colors">
            
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80 mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-slate-100">Network & Engine Topology</h3>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Target server backbone and transport mechanism</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 font-bold uppercase tracking-wider">
                  Active Edge
                </span>
              </div>

              {/* 1. Backend Selector Dropdown */}
              <div className="flex flex-col gap-1.5 mb-3 relative z-30" ref={backendRef}>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Server Engine Backend</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{engineBackends.length} nodes</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setBackendDropdownOpen(!backendDropdownOpen);
                      setProtocolDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 sm:p-3 rounded-xl border bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all duration-150 cursor-pointer focus:outline-none ${
                      backendDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${selectedBackend.color} dark:bg-opacity-20`}>
                        {selectedBackend.badge}
                      </span>
                      <div className="flex flex-col text-left">
                        <span className="font-sans font-bold text-xs text-slate-900 dark:text-slate-100">{selectedBackend.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{selectedBackend.pops}</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${backendDropdownOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
                  </button>

                  {backendDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1 gap-1 animate-fade-in max-h-56 overflow-y-auto">
                      {engineBackends.map((engine) => {
                        const isSelected = settings.engineBackend === engine.id;
                        return (
                          <div
                            key={engine.id}
                            onClick={() => {
                              handleUpdateField('engineBackend', engine.id);
                              setBackendDropdownOpen(false);
                            }}
                            className={`p-2 rounded-lg flex items-center justify-between transition-all duration-150 cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs">{engine.name}</span>
                                <span className={`px-1 py-0.2 rounded text-[8px] font-bold font-mono border ${engine.color} dark:bg-opacity-20`}>
                                  {engine.badge}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{engine.description}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {settings.engineBackend === 'custom' && (
                  <div className="mt-1 p-2 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-purple-900 dark:text-purple-300">Custom Speedtest Endpoint URL</label>
                    <input
                      type="text"
                      value={settings.customServerUrl || ''}
                      onChange={(e) => handleUpdateField('customServerUrl', e.target.value)}
                      placeholder="https://speed.yourdomain.com/__down"
                      className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 rounded border border-purple-200 dark:border-purple-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* 2. Routing Protocol Selector Dropdown */}
              <div className="flex flex-col gap-1.5 relative z-20" ref={protocolRef}>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Routing Protocol & Transport</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{routingProtocols.length} protocols</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setProtocolDropdownOpen(!protocolDropdownOpen);
                      setBackendDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 sm:p-3 rounded-xl border bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-all duration-150 cursor-pointer focus:outline-none ${
                      protocolDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{selectedProtocol.icon}</span>
                      <div className="flex flex-col text-left">
                        <span className="font-sans font-bold text-xs text-slate-900 dark:text-slate-100">{selectedProtocol.name}</span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">{selectedProtocol.speedTag}</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${protocolDropdownOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`} />
                  </button>

                  {protocolDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1 gap-1 animate-fade-in max-h-56 overflow-y-auto">
                      {routingProtocols.map((proto) => {
                        const isSelected = settings.routingProtocol === proto.id;
                        return (
                          <div
                            key={proto.id}
                            onClick={() => {
                              handleUpdateField('routingProtocol', proto.id);
                              setProtocolDropdownOpen(false);
                            }}
                            className={`p-2 rounded-lg flex items-center justify-between transition-all duration-150 cursor-pointer ${
                              isSelected 
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base shrink-0">{proto.icon}</span>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs">{proto.name}</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500">{proto.description}</span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span>TLS 1.3 / QUIC 0-RTT Support</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Auto-Negotiated</span>
            </div>

          </div>

          {/* Card 2: Bufferbloat / Loaded Latency Toggles */}
          <div className="premium-card bg-white dark:bg-[#121212] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2.5 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Bufferbloat Probing</h3>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">Sample latency under heavy bandwidth load</span>
                </div>
              </div>
            </div>

            {/* Download Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Download Loaded Latency</span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateField('measureDownloadLoadedLatency', !settings.measureDownloadLoadedLatency)}
                className="cursor-pointer focus:outline-none"
              >
                {settings.measureDownloadLoadedLatency ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                )}
              </button>
            </div>

            {/* Upload Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload Loaded Latency</span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateField('measureUploadLoadedLatency', !settings.measureUploadLoadedLatency)}
                className="cursor-pointer focus:outline-none"
              >
                {settings.measureUploadLoadedLatency ? (
                  <ToggleRight className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Engine Diagnostic Output Matrix */}
          <div className="premium-card bg-white dark:bg-[#121212] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 transition-colors">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active Configuration</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">v1.0.0</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800 flex flex-col">
                <span className="text-slate-400 dark:text-slate-500 text-[9px]">Target Backend</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{selectedBackend.name}</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800 flex flex-col">
                <span className="text-slate-400 dark:text-slate-500 text-[9px]">Routing Mode</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate">{selectedProtocol.speedTag}</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800 flex flex-col">
                <span className="text-slate-400 dark:text-slate-500 text-[9px]">Bufferbloat</span>
                <span className={`font-bold ${settings.measureDownloadLoadedLatency || settings.measureUploadLoadedLatency ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                  {settings.measureDownloadLoadedLatency || settings.measureUploadLoadedLatency ? 'Active' : 'Standard'}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800 flex flex-col">
                <span className="text-slate-400 dark:text-slate-500 text-[9px]">Encryption</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">TLS 1.3 / AES</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: UPDATER & SCHEDULED TESTS */}
        <div className="flex flex-col gap-3.5 sm:gap-4">
          
          {/* Card 1: In-App Software Updater */}
          <InAppUpdater />

          {/* Card 2: Automated Scheduled Tests & Alerts */}
          <ScheduledTests />

        </div>

      </div>

    </div>
  );
}
