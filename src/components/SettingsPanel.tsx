import React from 'react';
import { ToggleLeft, ToggleRight, Globe } from 'lucide-react';
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-6 flex-1 min-h-0 overflow-y-auto h-full pr-2 animate-fade-in" id="settings-section">
      
      {/* LATENCY MEASUREMENTS SECTION */}
      <div className="bg-[#080d19]/80 backdrop-blur-md p-4 sm:p-8 rounded-2xl border border-[#1e293b] shadow-2xl">
        <h3 className="font-sans font-extrabold text-md tracking-[0.12em] text-white uppercase mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <span>Real Speed Test Latency Settings</span>
        </h3>
        <p className="font-sans text-xs text-[#94A3B8] max-w-lg mb-8 leading-relaxed">
          Configure how the speed test engine measures connection response times under load. Measuring loaded latency adds extra verification stages to your speed tests.
        </p>

        <div className="flex flex-col gap-6">
          {/* Download Loaded Latency */}
          <div className="flex items-center justify-between p-4 bg-[#030508]/40 border border-[#1e293b] rounded-xl hover:border-primary/20 transition-all duration-300">
            <div className="flex flex-col gap-1 pr-4">
              <span className="font-sans font-bold text-sm text-white">Measure Download Loaded Latency</span>
              <span className="font-sans text-xs text-[#94A3B8] leading-relaxed">
                Test ping latency while download data is actively transferring.
              </span>
            </div>
            <button
              onClick={() => handleUpdateField('measureDownloadLoadedLatency', !settings.measureDownloadLoadedLatency)}
              className="flex items-center text-primary hover:opacity-90 focus:outline-none shrink-0 cursor-pointer"
            >
              {settings.measureDownloadLoadedLatency ? (
                <ToggleRight className="w-12 h-12 text-[#00F0FF]" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-zinc-600" />
              )}
            </button>
          </div>

          {/* Upload Loaded Latency */}
          <div className="flex items-center justify-between p-4 bg-[#030508]/40 border border-[#1e293b] rounded-xl hover:border-primary/20 transition-all duration-300">
            <div className="flex flex-col gap-1 pr-4">
              <span className="font-sans font-bold text-sm text-white">Measure Upload Loaded Latency</span>
              <span className="font-sans text-xs text-[#94A3B8] leading-relaxed">
                Test ping latency while upload data is actively transferring.
              </span>
            </div>
            <button
              onClick={() => handleUpdateField('measureUploadLoadedLatency', !settings.measureUploadLoadedLatency)}
              className="flex items-center text-primary hover:opacity-90 focus:outline-none shrink-0 cursor-pointer"
            >
              {settings.measureUploadLoadedLatency ? (
                <ToggleRight className="w-12 h-12 text-[#00F0FF]" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-zinc-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DETAILED MONO DIAGNOSTIC CARD */}
      <div className="bg-[#030508]/90 p-5 rounded-xl border border-[#1e293b] font-mono text-xs shadow-2xl">
        <span className="text-[10px] text-[#00F0FF] uppercase font-bold tracking-widest block mb-3">Diagnostic Telemetry Output</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-[#94A3B8]">
          <div className="flex gap-2">
            <span className="text-white font-bold">Active Engine:</span>
            <span>Cloudflare SpeedTest Engine</span>
          </div>
          <div className="flex gap-2">
            <span className="text-white font-bold">Node Connection:</span>
            <span>Closest Edge CDN Server (Auto)</span>
          </div>
          <div className="flex gap-2">
            <span className="text-white font-bold">Download Latency Load:</span>
            <span>{settings.measureDownloadLoadedLatency ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-white font-bold">Upload Latency Load:</span>
            <span>{settings.measureUploadLoadedLatency ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
