import React, { useState, useRef, useEffect } from 'react';
import { 
  ToggleLeft, ToggleRight, Globe, Download, Upload, Server, ShieldCheck, 
  Cpu, RefreshCw, Network, Radio, Zap, Check, ChevronDown, ChevronUp, Layers, Sparkles 
} from 'lucide-react';
import { SimulationSettings, EngineBackend, RoutingProtocol } from '../types';

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
      description: 'Autonomous System (AS) routes packets to the topologically closest edge node automatically.',
      speedTag: 'Optimal Latency',
      icon: '🌐'
    },
    {
      id: 'http3-quic',
      name: 'HTTP/3 over QUIC (UDP 0-RTT)',
      description: 'Next-generation UDP transport with zero head-of-line blocking and instant encrypted connections.',
      speedTag: 'Fastest Handshake',
      icon: '⚡'
    },
    {
      id: 'http2-tcp',
      name: 'HTTP/2 Multiplexed (TCP TLS 1.3)',
      description: 'Parallel multiplexed streaming over persistent TCP connection with TLS 1.3 crypto.',
      speedTag: 'Broad Compatibility',
      icon: '🔒'
    },
    {
      id: 'geodns-unicast',
      name: 'GeoDNS Direct Unicast Routing',
      description: 'Resolves IP directly to regional server clusters without Anycast routing hops.',
      speedTag: 'Predictable Path',
      icon: '📍'
    },
    {
      id: 'multipath-adaptive',
      name: 'Multi-Path Adaptive Fallback',
      description: 'Dynamically shifts between UDP QUIC and TCP streams based on corporate firewall conditions.',
      speedTag: 'Resilient',
      icon: '🛡️'
    }
  ];

  const selectedBackend = engineBackends.find(e => e.id === settings.engineBackend) || engineBackends[0];
  const selectedProtocol = routingProtocols.find(p => p.id === settings.routingProtocol) || routingProtocols[0];

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto flex flex-col gap-3.5 pb-6 flex-1 min-h-0 overflow-y-auto h-full pr-1 animate-fade-in select-none" id="settings-section">
      
      {/* SECTION 1: SERVER ENGINE BACKEND (Dropdown System) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-3 relative z-30" ref={backendRef}>
        
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Server Engine Backend
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Choose the target CDN infrastructure and global edge points of presence.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60 font-bold uppercase tracking-wider hidden sm:inline-flex">
            {engineBackends.length} Available
          </span>
        </div>

        {/* Custom Interactive Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBackendDropdownOpen(!backendDropdownOpen);
              setProtocolDropdownOpen(false);
            }}
            className={`w-full p-3.5 rounded-xl border bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between transition-all duration-200 cursor-pointer focus:outline-none ${
              backendDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm bg-white' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`px-2 py-1 rounded-md text-[11px] font-bold font-mono border ${selectedBackend.color}`}>
                {selectedBackend.badge}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-sans font-bold text-xs sm:text-sm text-slate-900">
                  {selectedBackend.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedBackend.pops} • {selectedBackend.protocolSupport}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs font-mono font-medium hidden md:inline">Change Server</span>
              {backendDropdownOpen ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </button>

          {/* Expanded Dropdown Menu */}
          {backendDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1.5 gap-1 animate-fade-in max-h-80 overflow-y-auto">
              {engineBackends.map((engine) => {
                const isSelected = settings.engineBackend === engine.id;

                return (
                  <div
                    key={engine.id}
                    onClick={() => {
                      handleUpdateField('engineBackend', engine.id);
                      setBackendDropdownOpen(false);
                    }}
                    className={`p-2.5 rounded-lg flex items-center justify-between transition-all duration-150 cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/80 border border-blue-200/80 text-blue-900' 
                        : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border shrink-0 ${engine.color}`}>
                        {engine.badge}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-xs">{engine.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({engine.pops})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight">{engine.description}</span>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">{engine.protocolSupport}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Server Endpoint Input (Shows when Custom is selected) */}
        {settings.engineBackend === 'custom' && (
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl flex flex-col gap-1.5 mt-0.5">
            <label className="text-xs font-bold text-purple-900">Custom Backend Speedtest Endpoint URL</label>
            <input
              type="text"
              value={settings.customServerUrl || ''}
              onChange={(e) => handleUpdateField('customServerUrl', e.target.value)}
              placeholder="https://speed.yourdomain.com/__down"
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-purple-200 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-purple-600">Ensure the custom server accepts payload download and upload POST requests with CORS enabled.</span>
          </div>
        )}

      </div>

      {/* SECTION 2: ROUTING PROTOCOL & TRANSPORT (Dropdown System) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-3 relative z-20" ref={protocolRef}>
        
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20 shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Routing Protocol & Transport
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Configure network packet topology, cryptographic handshake, and transport protocols.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60 font-bold uppercase tracking-wider hidden sm:inline-flex">
            {routingProtocols.length} Protocols
          </span>
        </div>

        {/* Custom Interactive Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProtocolDropdownOpen(!protocolDropdownOpen);
              setBackendDropdownOpen(false);
            }}
            className={`w-full p-3.5 rounded-xl border bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between transition-all duration-200 cursor-pointer focus:outline-none ${
              protocolDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm bg-white' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0">{selectedProtocol.icon}</span>
              <div className="flex flex-col text-left">
                <span className="font-sans font-bold text-xs sm:text-sm text-slate-900">
                  {selectedProtocol.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedProtocol.speedTag} • <span className="font-mono text-[10px] text-indigo-600 font-bold">{selectedProtocol.id}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-xs font-mono font-medium hidden md:inline">Change Protocol</span>
              {protocolDropdownOpen ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </button>

          {/* Expanded Dropdown Menu */}
          {protocolDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1.5 gap-1 animate-fade-in max-h-80 overflow-y-auto">
              {routingProtocols.map((proto) => {
                const isSelected = settings.routingProtocol === proto.id;

                return (
                  <div
                    key={proto.id}
                    onClick={() => {
                      handleUpdateField('routingProtocol', proto.id);
                      setProtocolDropdownOpen(false);
                    }}
                    className={`p-2.5 rounded-lg flex items-center justify-between transition-all duration-150 cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50/80 border border-indigo-200/80 text-indigo-900' 
                        : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg shrink-0">{proto.icon}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-xs">{proto.name}</span>
                          <span className="text-[10px] font-bold text-indigo-600 font-mono bg-indigo-50 px-1 rounded">{proto.speedTag}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 leading-tight">{proto.description}</span>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">{proto.id}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* SECTION 3: LOADED LATENCY & BUFFERBLOAT TELEMETRY */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-3 relative z-10">
        
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              Bufferbloat & Loaded Latency Probing
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Sample response latency concurrently during peak bandwidth saturation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Download Loaded Latency */}
          <div className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-emerald-300 transition-all duration-200">
            <div className="flex items-start gap-2.5 pr-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-xs text-slate-900">Download Loaded Latency</span>
                <span className="font-sans text-[11px] text-slate-500 leading-snug">
                  Measure latency under heavy inbound saturation.
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleUpdateField('measureDownloadLoadedLatency', !settings.measureDownloadLoadedLatency)}
              className="flex items-center hover:opacity-90 focus:outline-none shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              {settings.measureDownloadLoadedLatency ? (
                <ToggleRight className="w-9 h-9 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-slate-300" />
              )}
            </button>
          </div>

          {/* Upload Loaded Latency */}
          <div className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-violet-300 transition-all duration-200">
            <div className="flex items-start gap-2.5 pr-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-xs text-slate-900">Upload Loaded Latency</span>
                <span className="font-sans text-[11px] text-slate-500 leading-snug">
                  Measure latency under heavy outbound saturation.
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleUpdateField('measureUploadLoadedLatency', !settings.measureUploadLoadedLatency)}
              className="flex items-center hover:opacity-90 focus:outline-none shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              {settings.measureUploadLoadedLatency ? (
                <ToggleRight className="w-9 h-9 text-violet-600" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-slate-300" />
              )}
            </button>
          </div>

        </div>

      </div>

      {/* SECTION 4: ENGINE DIAGNOSTIC OUTPUT */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-2.5 relative z-0">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Engine Diagnostics</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">NetPulse v2.5.0-edge</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs text-slate-600 bg-slate-50/90 p-3 rounded-xl border border-slate-200/60">
          <div className="flex flex-col p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-[10px] text-slate-400">Engine Backend</span>
            <span className="font-bold text-slate-900 text-xs truncate">
              {selectedBackend.name}
            </span>
          </div>
          <div className="flex flex-col p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-[10px] text-slate-400">Routing Protocol</span>
            <span className="font-bold text-indigo-600 text-xs truncate">
              {selectedProtocol.name}
            </span>
          </div>
          <div className="flex flex-col p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-[10px] text-slate-400">Bufferbloat Sampling</span>
            <span className={`text-[10px] font-bold mt-0.5 ${
              settings.measureDownloadLoadedLatency || settings.measureUploadLoadedLatency ? 'text-emerald-700 font-black' : 'text-slate-500'
            }`}>
              {settings.measureDownloadLoadedLatency || settings.measureUploadLoadedLatency ? 'Active Multi-Stage' : 'Standard'}
            </span>
          </div>
          <div className="flex flex-col p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-[10px] text-slate-400">Routing Mode</span>
            <span className="font-bold text-slate-800 text-xs">
              {settings.routingProtocol === 'anycast-bgp' ? 'Anycast Edge' : 'Direct Multiplex'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
