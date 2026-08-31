import React from 'react';
import { ToggleLeft, ToggleRight, Globe, Download, Upload, Server, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';
import { SimulationSettings } from '../types';

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

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 pb-6 flex-1 min-h-0 overflow-y-auto h-full pr-1 animate-fade-in select-none" id="settings-section">
      
      {/* SECTION 1: SPEED TEST PROTOCOL & LATENCY SETTINGS */}
      <div className="modern-glass-card rounded-3xl p-5 sm:p-8 flex flex-col gap-6">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Loaded Latency Engine
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Configure advanced bufferbloat and loaded latency telemetry during active transfers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          
          {/* Download Loaded Latency */}
          <div className="flex items-center justify-between p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl hover:border-emerald-300/80 transition-all duration-200">
            <div className="flex items-start gap-3.5 pr-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold text-sm text-slate-900">Measure Download Loaded Latency</span>
                <span className="font-sans text-xs text-slate-500 leading-relaxed">
                  Continuously sample ICMP / HTTP latency during inbound saturated bandwidth testing.
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleUpdateField('measureDownloadLoadedLatency', !settings.measureDownloadLoadedLatency)}
              className="flex items-center hover:opacity-90 focus:outline-none shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              {settings.measureDownloadLoadedLatency ? (
                <ToggleRight className="w-12 h-12 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-slate-300" />
              )}
            </button>
          </div>

          {/* Upload Loaded Latency */}
          <div className="flex items-center justify-between p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl hover:border-violet-300/80 transition-all duration-200">
            <div className="flex items-start gap-3.5 pr-4">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 border border-violet-200/60 flex items-center justify-center shrink-0 mt-0.5">
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold text-sm text-slate-900">Measure Upload Loaded Latency</span>
                <span className="font-sans text-xs text-slate-500 leading-relaxed">
                  Continuously sample ICMP / HTTP latency during outbound saturated bandwidth testing.
                </span>
              </div>
            </div>
            
            <button
              onClick={() => handleUpdateField('measureUploadLoadedLatency', !settings.measureUploadLoadedLatency)}
              className="flex items-center hover:opacity-90 focus:outline-none shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              {settings.measureUploadLoadedLatency ? (
                <ToggleRight className="w-12 h-12 text-violet-500" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-slate-300" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* SECTION 2: TELEMETRY & ENGINE DIAGNOSTICS */}
      <div className="modern-glass-card rounded-3xl p-5 sm:p-7 flex flex-col gap-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Engine Diagnostic Output</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v2.4.0-edge</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-slate-600 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-slate-400">Engine Backend</span>
            <span className="font-bold text-slate-900">Cloudflare Edge</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-slate-400">Routing Protocol</span>
            <span className="font-bold text-blue-600">Anycast BGP</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-slate-400">Download Stage</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              settings.measureDownloadLoadedLatency ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {settings.measureDownloadLoadedLatency ? 'Loaded Latency Active' : 'Pure Bandwidth'}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60">
            <span className="text-slate-400">Upload Stage</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              settings.measureUploadLoadedLatency ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {settings.measureUploadLoadedLatency ? 'Loaded Latency Active' : 'Pure Bandwidth'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
