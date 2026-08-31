import React from 'react';
import { ToggleLeft, ToggleRight, Globe, Download, Upload } from 'lucide-react';
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
      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-[#E4E4E7] shadow-sm">
        <h3 className="font-sans font-extrabold text-md tracking-[0.12em] text-[#09090B] uppercase mb-1 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
            <Globe className="w-4 h-4" />
          </div>
          <span>Real Speed Test Latency Settings</span>
        </h3>
        <p className="font-sans text-xs text-zinc-500 max-w-lg mb-8 leading-relaxed">
          Configure how the speed test engine measures connection response times under load. Measuring loaded latency adds extra verification stages to your speed tests.
        </p>

        <div className="flex flex-col gap-5">
          {/* Download Loaded Latency (Emerald Accent) */}
          <div className="flex items-center justify-between p-4 bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl hover:border-emerald-300 transition-all duration-300">
            <div className="flex items-start gap-3 pr-4">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold text-sm text-[#09090B]">Measure Download Loaded Latency</span>
                <span className="font-sans text-xs text-zinc-500 leading-relaxed">
                  Test ping latency while download data is actively transferring.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleUpdateField('measureDownloadLoadedLatency', !settings.measureDownloadLoadedLatency)}
              className="flex items-center hover:opacity-90 focus:outline-none shrink-0 cursor-pointer"
            >
              {settings.measureDownloadLoadedLatency ? (
                <ToggleRight className="w-12 h-12 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-zinc-300" />
              )}
            </button>
          </div>

          {/* Upload Loaded Latency (Violet Accent) */}
          <div className="flex items-center justify-between p-4 bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl hover:border-violet-300 transition-all duration-300">
            <div className="flex items-start gap-3 pr-4">
              <div className="p-2 bg-violet-100 text-violet-700 rounded-xl border border-violet-200 shrink-0 mt-0.5">
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold text-sm text-[#09090B]">Measure Upload Loaded Latency</span>
                <span className="font-sans text-xs text-zinc-500 leading-relaxed">
                  Test ping latency while upload data is actively transferring.
                </span>
              </div>
            </div>
            <button
              onClick={() => handleUpdateField('measureUploadLoadedLatency', !settings.measureUploadLoadedLatency)}
              className="flex items-center hover:opacity-90 focus:outline-none shrink-0 cursor-pointer"
            >
              {settings.measureUploadLoadedLatency ? (
                <ToggleRight className="w-12 h-12 text-violet-500" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-zinc-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DETAILED MONO DIAGNOSTIC CARD */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E4E7] font-mono text-xs shadow-sm">
        <span className="text-[10px] text-blue-600 uppercase font-bold tracking-widest block mb-3">Diagnostic Telemetry Output</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="text-[#09090B] font-bold">Active Engine:</span>
            <span className="text-zinc-700">Cloudflare SpeedTest</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#09090B] font-bold">Node Connection:</span>
            <span className="text-zinc-700">Edge CDN (Auto)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#09090B] font-bold">Download Latency Load:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              settings.measureDownloadLoadedLatency ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {settings.measureDownloadLoadedLatency ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#09090B] font-bold">Upload Latency Load:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              settings.measureUploadLoadedLatency ? 'bg-violet-100 text-violet-700' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {settings.measureUploadLoadedLatency ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
