import React from 'react';
import { 
  ToggleLeft, ToggleRight, Globe, Download, Upload, Server, ShieldCheck, 
  Cpu, RefreshCw, Network, Radio, Zap, Check, Sliders, Layers, Sparkles 
} from 'lucide-react';
import { SimulationSettings, EngineBackend, RoutingProtocol } from '../types';

interface SettingsPanelProps {
  settings: SimulationSettings;
  onUpdateSettings: (settings: SimulationSettings) => void;
}

export default function SettingsPanel({ settings, onUpdateSettings }: SettingsPanelProps) {
  
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
      color: 'border-orange-500 bg-orange-500/5 text-[#F6821F]',
      protocolSupport: 'HTTP/3, HTTP/2, Anycast'
    },
    {
      id: 'fastly',
      name: 'Fastly High-Capacity Edge',
      description: 'Lucid dynamic cache with high-throughput multi-gigabit conduits.',
      pops: '180+ Core PoPs',
      badge: 'High Throughput',
      color: 'border-rose-500 bg-rose-500/5 text-rose-600',
      protocolSupport: 'HTTP/3, HTTP/2'
    },
    {
      id: 'cloudfront',
      name: 'AWS CloudFront Global Backbone',
      description: 'Dedicated Amazon global fiber network with multi-region edge caching.',
      pops: '600+ Points of Presence',
      badge: 'Enterprise',
      color: 'border-amber-500 bg-amber-500/5 text-amber-600',
      protocolSupport: 'HTTP/2, TLS 1.3'
    },
    {
      id: 'gcp',
      name: 'Google Cloud CDN (Premium Tier)',
      description: 'Direct access to Google private global fiber optic network.',
      pops: '200+ Edge Locations',
      badge: 'Low Jitter',
      color: 'border-blue-500 bg-blue-500/5 text-blue-600',
      protocolSupport: 'QUIC / HTTP/3, BBR'
    },
    {
      id: 'akamai',
      name: 'Akamai Connected Edge Network',
      description: 'Massive globally distributed hyper-dense edge presence.',
      pops: '4000+ Distributed Locations',
      badge: 'Maximum Reach',
      color: 'border-cyan-500 bg-cyan-500/5 text-cyan-600',
      protocolSupport: 'HTTP/2, Anycast'
    },
    {
      id: 'custom',
      name: 'Custom / Self-Hosted Speed Node',
      description: 'Target a custom dedicated measurement backend or enterprise mirror.',
      pops: 'User Defined',
      badge: 'Developer',
      color: 'border-purple-500 bg-purple-500/5 text-purple-600',
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

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1500px] mx-auto flex flex-col gap-4 pb-6 flex-1 min-h-0 overflow-y-auto h-full pr-1 animate-fade-in select-none" id="settings-section">
      
      {/* SECTION 1: SERVER ENGINE BACKEND SELECTOR */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Server Engine Backend
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Select the CDN network backbone and edge computing infrastructure used for speed testing.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60 font-bold uppercase tracking-wider">
            6 Backends Available
          </span>
        </div>

        {/* Engine Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {engineBackends.map((engine) => {
            const isSelected = settings.engineBackend === engine.id;

            return (
              <div
                key={engine.id}
                onClick={() => handleUpdateField('engineBackend', engine.id)}
                className={`relative rounded-xl p-3.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? `${engine.color} shadow-sm ring-2 ring-blue-500/20`
                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-sans font-bold text-xs text-slate-900 truncate">
                      {engine.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-white text-slate-900 border border-slate-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {engine.badge}
                      </span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {engine.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[10px] text-slate-400 font-mono">
                  <span className="text-slate-600 font-medium">{engine.pops}</span>
                  <span>{engine.protocolSupport}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Server Endpoint Input (Shows when Custom is selected) */}
        {settings.engineBackend === 'custom' && (
          <div className="p-3 bg-purple-50/50 border border-purple-200/80 rounded-xl flex flex-col gap-2 mt-1">
            <label className="text-xs font-bold text-purple-900">Custom Backend Speedtest Endpoint URL</label>
            <input
              type="text"
              value={settings.customServerUrl || ''}
              onChange={(e) => handleUpdateField('customServerUrl', e.target.value)}
              placeholder="https://speed.yourdomain.com/__down"
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-purple-200 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-purple-600">Supports standard byte payload endpoints with CORS enabled.</span>
          </div>
        )}

      </div>

      {/* SECTION 2: ROUTING PROTOCOL SELECTOR */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Routing Protocol & Transport
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Choose packet routing topology, transport layer protocol, and handshake mechanism.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60 font-bold uppercase tracking-wider">
            5 Protocols Supported
          </span>
        </div>

        {/* Protocol List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {routingProtocols.map((proto) => {
            const isSelected = settings.routingProtocol === proto.id;

            return (
              <div
                key={proto.id}
                onClick={() => handleUpdateField('routingProtocol', proto.id)}
                className={`rounded-xl p-3.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/5 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{proto.icon}</span>
                    <span className="font-sans font-bold text-xs text-slate-900">
                      {proto.name}
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {proto.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[10px]">
                  <span className="font-bold text-indigo-600 font-mono">{proto.speedTag}</span>
                  <span className="text-slate-400 font-mono">{proto.id}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SECTION 3: LOADED LATENCY & TELEMETRY ENGINE */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
        
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm sm:text-base text-slate-900 tracking-tight">
              Telemetry & Bufferbloat Probing
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Configure loaded latency measurement and probe density during active transfers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Download Loaded Latency */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-emerald-300 transition-all duration-200">
            <div className="flex items-start gap-3 pr-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-xs text-slate-900">Download Loaded Latency</span>
                <span className="font-sans text-[11px] text-slate-500 leading-snug">
                  Sample latency continuously during saturated download bandwidth tests.
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleUpdateField('measureDownloadLoadedLatency', !settings.measureDownloadLoadedLatency)}
              className="flex items-center hover:opacity-90 focus:outline-none shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              {settings.measureDownloadLoadedLatency ? (
                <ToggleRight className="w-10 h-10 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300" />
              )}
            </button>
          </div>

          {/* Upload Loaded Latency */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl hover:border-violet-300 transition-all duration-200">
            <div className="flex items-start gap-3 pr-3">
              <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-xs text-slate-900">Upload Loaded Latency</span>
                <span className="font-sans text-[11px] text-slate-500 leading-snug">
                  Sample latency continuously during saturated upload bandwidth tests.
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleUpdateField('measureUploadLoadedLatency', !settings.measureUploadLoadedLatency)}
              className="flex items-center hover:opacity-90 focus:outline-none shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              {settings.measureUploadLoadedLatency ? (
                <ToggleRight className="w-10 h-10 text-violet-600" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-300" />
              )}
            </button>
          </div>

        </div>

      </div>

      {/* SECTION 4: ENGINE DIAGNOSTIC OUTPUT */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Configuration Output</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">NetPulse v2.5.0-edge</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs text-slate-600 bg-slate-50/90 p-3 rounded-xl border border-slate-200/60">
          <div className="flex flex-col p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-[10px] text-slate-400">Target Backend</span>
            <span className="font-bold text-slate-900 text-xs truncate">
              {engineBackends.find(e => e.id === settings.engineBackend)?.name || settings.engineBackend}
            </span>
          </div>
          <div className="flex flex-col p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-[10px] text-slate-400">Transport Protocol</span>
            <span className="font-bold text-indigo-600 text-xs truncate">
              {routingProtocols.find(r => r.id === settings.routingProtocol)?.name || settings.routingProtocol}
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
