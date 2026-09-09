import React, { useState, useEffect } from 'react';
import { 
  Clock, Bell, AlertTriangle, CheckCircle2, ShieldCheck, 
  ToggleLeft, ToggleRight, Sparkles, Sliders
} from 'lucide-react';

export default function ScheduledTests() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem('netpulse_scheduled_enabled') === 'true';
  });

  const [intervalHours, setIntervalHours] = useState<number>(() => {
    return Number(localStorage.getItem('netpulse_scheduled_interval')) || 6;
  });

  const [minSpeedThreshold, setMinSpeedThreshold] = useState<number>(() => {
    return Number(localStorage.getItem('netpulse_scheduled_threshold')) || 50;
  });

  const [notificationsGranted, setNotificationsGranted] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsGranted(Notification.permission === 'granted');
    }
  }, []);

  const toggleScheduled = async () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem('netpulse_scheduled_enabled', String(next));

    if (next && 'Notification' in window && Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      setNotificationsGranted(perm === 'granted');
    }
  };

  const handleIntervalChange = (val: number) => {
    setIntervalHours(val);
    localStorage.setItem('netpulse_scheduled_interval', String(val));
  };

  const handleThresholdChange = (val: number) => {
    setMinSpeedThreshold(val);
    localStorage.setItem('netpulse_scheduled_threshold', String(val));
  };

  return (
    <div className="premium-card bg-white dark:bg-[#121212] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#262626] shadow-sm flex flex-col gap-3 transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Scheduled Diagnostic Routine</h3>
            <span className="text-[9px] text-slate-400">Automated background speed monitoring & threshold alerts</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleScheduled}
          className="cursor-pointer focus:outline-none"
        >
          {enabled ? (
            <ToggleRight className="w-9 h-9 text-amber-500" />
          ) : (
            <ToggleLeft className="w-9 h-9 text-slate-300 dark:text-slate-700" />
          )}
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Interval Selector */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-700 dark:text-slate-300">Test Interval</span>
            <span className="font-mono text-amber-600">Every {intervalHours} hr{intervalHours > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[1, 6, 12, 24].map((hr) => (
              <button
                key={hr}
                onClick={() => handleIntervalChange(hr)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  intervalHours === hr
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {hr}h
              </button>
            ))}
          </div>
        </div>

        {/* Speed Threshold */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-700 dark:text-slate-300">Min Speed Alert</span>
            <span className="font-mono text-amber-600">&lt; {minSpeedThreshold} Mbps</span>
          </div>
          <input 
            type="range"
            min="10"
            max="250"
            step="10"
            value={minSpeedThreshold}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
          />
        </div>

      </div>

      {/* Notification status */}
      <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500">
        <div className="flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-amber-500" />
          <span>Alert notifications: {enabled ? (notificationsGranted ? 'Active (Push Enabled)' : 'Enabled') : 'Paused'}</span>
        </div>
        <span className="text-slate-400 font-mono text-[9px]">Low-power background daemon</span>
      </div>

    </div>
  );
}
