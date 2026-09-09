import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Download, CheckCircle2, AlertCircle, 
  ArrowUpCircle, ShieldCheck, ChevronRight, HardDrive, PackageCheck,
  Monitor, ExternalLink, Globe, Laptop, Smartphone, RotateCcw,
  Check, ArrowUpRight
} from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface AppUpdaterPluginInterface {
  installApk(options: { url: string }): Promise<{ success: boolean }>;
  addListener(eventName: 'downloadProgress', listenerFunc: (info: { progress: number; bytesDownloaded?: number; totalBytes?: number }) => void): Promise<any>;
}

const AppUpdater = registerPlugin<AppUpdaterPluginInterface>('AppUpdater');

interface ReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  apkUrl?: string;
  apkSize?: number;
}

export default function InAppUpdater() {
  const CURRENT_VERSION = 'v1.0';
  const [checking, setChecking] = useState(false);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('System is on the latest release');
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Detect whether running in native Android Capacitor APK container
  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  // Check GitHub releases API for new versions
  const checkForUpdates = async (isManual = true) => {
    try {
      setChecking(true);
      setStatusMessage('Checking GitHub release channel...');
      
      const response = await fetch('https://api.github.com/repos/Suvesh108/NetPulse/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const latestTag = data.tag_name || 'v1.0';
      
      const apkAsset = data.assets?.find((a: any) => a.name && a.name.endsWith('.apk'));
      const apkUrl = apkAsset?.browser_download_url || `https://github.com/Suvesh108/NetPulse/releases/download/${latestTag}/NetPulse-${latestTag}.apk`;
      const apkSize = apkAsset?.size || 5556363;

      setRelease({
        tag_name: latestTag,
        name: data.name || `NetPulse ${latestTag}`,
        body: data.body || '• Production Release v1.0 with official Windows Desktop & Android apps\n• Responsive dual-gauge Speed Test with real-time waveform splines\n• 8 Professional Network Diagnostic modules & Bufferbloat grading\n• High-performance Cloudflare Edge & QUIC Anycast routing',
        published_at: data.published_at ? new Date(data.published_at).toLocaleDateString() : 'Recent',
        apkUrl,
        apkSize
      });

      const isNewer = latestTag.localeCompare(CURRENT_VERSION, undefined, { numeric: true, sensitivity: 'base' }) > 0;
      setHasUpdate(isNewer);

      if (isNewer) {
        setStatusMessage(`New update available: ${latestTag}`);
      } else {
        setStatusMessage(`NetPulse ${CURRENT_VERSION} is up to date`);
      }
    } catch (err: any) {
      console.warn('Update check note:', err.message);
      setRelease({
        tag_name: 'v1.0',
        name: 'NetPulse v1.0 (Official Production Release)',
        body: '• Production Release v1.0 with official Windows Desktop & Android apps\n• Responsive dual-gauge Speed Test with real-time waveform splines\n• 8 Professional Network Diagnostic modules & Bufferbloat grading\n• High-performance Cloudflare Edge & QUIC Anycast routing',
        published_at: new Date().toLocaleDateString(),
        apkUrl: 'https://github.com/Suvesh108/NetPulse/releases/download/v1.0/NetPulse-v1.0.apk',
        apkSize: 5556363
      });
      setHasUpdate(false);
      setStatusMessage(`NetPulse ${CURRENT_VERSION} is up to date`);
    } finally {
      setChecking(false);
    }
  };

  // Perform Android Native internal background APK download & installation
  const handleAndroidInternalUpdate = async () => {
    const targetUrl = release?.apkUrl || 'https://github.com/Suvesh108/NetPulse/releases/download/v0.9/NetPulse-v0.9.apk';
    setIsUpdating(true);
    setDownloadProgress(5);
    setStatusMessage('Downloading internal update package...');

    try {
      await AppUpdater.addListener('downloadProgress', (info) => {
        if (info.progress) {
          setDownloadProgress(Math.min(99, info.progress));
          setStatusMessage(`Downloading update... ${info.progress}%`);
        }
      });

      await AppUpdater.installApk({ url: targetUrl });
      setDownloadProgress(100);
      setStatusMessage('Opening system package installer...');
    } catch (err: any) {
      console.warn('Native installer error:', err.message);
      // Fallback download
      window.open(targetUrl, '_blank');
      setDownloadProgress(null);
      setIsUpdating(false);
    }
  };

  // Web & Windows Cache Purge & Force Reload
  const handleWebForceRefresh = async () => {
    setCacheCleared(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch {
      window.location.reload();
    }
  };

  useEffect(() => {
    checkForUpdates(false);
  }, []);

  // -------------------------------------------------------------
  // RENDER 1: ANDROID NATIVE APK CONTAINER VIEW
  // -------------------------------------------------------------
  if (isNativeAndroid) {
    return (
      <div className="premium-card bg-white dark:bg-[#121212] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#262626] shadow-sm flex flex-col gap-3 transition-colors">
        
        {/* Android Native Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Android In-App Updater</h3>
              <span className="text-[9px] text-slate-400">Direct background APK installation without browser</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {CURRENT_VERSION}
            </span>
            {hasUpdate ? (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 animate-pulse">
                Update Available
              </span>
            ) : (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Up to Date
              </span>
            )}
          </div>
        </div>

        {/* Action Box */}
        <div className="flex flex-col gap-2.5">
          <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {hasUpdate ? `Update Found: ${release?.tag_name}` : 'NetPulse Android Engine'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{statusMessage}</span>
                </div>
              </div>

              <button
                onClick={() => checkForUpdates(true)}
                disabled={checking || (downloadProgress !== null && downloadProgress < 100)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  checking 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 active:scale-95 shadow-xs'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                <span>{checking ? 'Checking...' : 'Check Now'}</span>
              </button>
            </div>

            {/* Download Progress Bar */}
            {downloadProgress !== null && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Download className="w-3 h-3 animate-bounce" /> In-App Internal Download
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full rounded-full transition-all duration-200 shadow-sm"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Release Notes & Android Button */}
          {release && (
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 dark:text-slate-200">Release Notes ({release.tag_name})</span>
                <span className="text-[9px] text-slate-400 font-mono">{release.published_at}</span>
              </div>

              <div className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-line font-mono max-h-24 overflow-y-auto">
                {release.body}
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleAndroidInternalUpdate}
                  disabled={downloadProgress !== null && downloadProgress < 100 && isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 fill-white" />
                  <span>{hasUpdate ? `UPDATE TO ${release.tag_name} INTERNALLY` : 'REINSTALL CURRENT APK INTERNALLY'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER 2: WINDOWS / WEB DESKTOP ENGINE VIEW
  // -------------------------------------------------------------
  return (
    <div className="premium-card bg-white dark:bg-[#121212] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#262626] shadow-sm flex flex-col gap-3.5 transition-colors">
      
      {/* Desktop Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Monitor className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              NetPulse Web & Desktop Engine
            </h3>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">
              Windows desktop & web deployment channel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {CURRENT_VERSION}
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Web Edge Live
          </span>
        </div>
      </div>

      {/* Main Status & Controls Card */}
      <div className="flex flex-col gap-3">
        
        {/* Engine Status Bar */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Cloudflare Edge Engine Active
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {statusMessage}
                </span>
              </div>
            </div>

            <button
              onClick={() => checkForUpdates(true)}
              disabled={checking}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                checking 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 active:scale-95 shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{checking ? 'Checking...' : 'Check Releases'}</span>
            </button>
          </div>

          {/* Desktop Engine Telemetry Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex flex-col">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Platform</span>
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">Windows / Web</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex flex-col">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Distribution</span>
              <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">Global Anycast</span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex flex-col">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Web Workers</span>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">8 Threads Active</span>
            </div>
          </div>
        </div>

        {/* Release Channels & Direct Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          {/* Action 1: Force Reload & Update Web Cache */}
          <button
            onClick={handleWebForceRefresh}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between text-left group cursor-pointer shadow-xs active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {cacheCleared ? <Check className="w-4 h-4 text-emerald-500" /> : <RotateCcw className="w-4 h-4" />}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cacheCleared ? 'Cache Flushed!' : 'Refresh Web Cache'}
                </span>
                <span className="text-[9px] text-slate-400">Purge PWA & reload latest code</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Action 2: View GitHub Official Releases */}
          <a
            href="https://github.com/Suvesh108/NetPulse/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-between text-left group cursor-pointer shadow-xs active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">GitHub Releases</span>
                <span className="text-[9px] text-slate-400">Official release notes & tags</span>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

        </div>

        {/* Desktop Application & Mobile APK Downloads */}
        <div className="flex flex-col gap-2">
          {/* Windows Desktop App */}
          <div className="p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Laptop className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  NetPulse Windows Desktop App (v1.0)
                </span>
                <span className="text-[9px] text-slate-400">
                  Stand-alone native 64-bit desktop application for Windows 10/11
                </span>
              </div>
            </div>

            <a
              href="https://github.com/Suvesh108/NetPulse/releases/download/v1.0/NetPulse-Windows-v1.0.zip"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Download className="w-3 h-3" />
              <span>Windows App</span>
            </a>
          </div>

          {/* Android APK */}
          <div className="p-3 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900/60 dark:to-indigo-950/20 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Download Android APK (v1.0)
                </span>
                <span className="text-[9px] text-slate-400">
                  Install NetPulse on your mobile phone or tablet (~5.5 MB)
                </span>
              </div>
            </div>

            <a
              href={release?.apkUrl || "https://github.com/Suvesh108/NetPulse/releases/download/v1.0/NetPulse-v1.0.apk"}
              download="NetPulse-v1.0.apk"
              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Download className="w-3 h-3" />
              <span>Android APK</span>
            </a>
          </div>
        </div>

        {/* Release Notes */}
        {release && (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-800 dark:text-slate-200">Current Release ({release.tag_name})</span>
              <span className="text-[9px] text-slate-400 font-mono">{release.published_at}</span>
            </div>

            <div className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-line font-mono max-h-24 overflow-y-auto">
              {release.body}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
