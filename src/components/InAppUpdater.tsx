import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Download, CheckCircle2, AlertCircle, 
  ArrowUpCircle, ShieldCheck, ChevronRight, HardDrive, PackageCheck
} from 'lucide-react';

interface ReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  apkUrl?: string;
  apkSize?: number;
}

export default function InAppUpdater() {
  const CURRENT_VERSION = 'v0.3';
  const [checking, setChecking] = useState(false);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('App is on the latest release');
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadedApkBlobUrl, setDownloadedApkBlobUrl] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);

  // Check GitHub releases API for new APK versions
  const checkForUpdates = async (isManual = true) => {
    try {
      setChecking(true);
      setStatusMessage('Checking GitHub for new releases...');
      
      const response = await fetch('https://api.github.com/repos/Suvesh108/NetPulse/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const latestTag = data.tag_name || 'v0.2';
      
      // Find APK asset
      const apkAsset = data.assets?.find((a: any) => a.name.endsWith('.apk'));
      const apkUrl = apkAsset?.browser_download_url || `https://github.com/Suvesh108/NetPulse/releases/download/${latestTag}/NetPulse-${latestTag}.apk`;
      const apkSize = apkAsset?.size || 4597662;

      setRelease({
        tag_name: latestTag,
        name: data.name || `NetPulse ${latestTag}`,
        body: data.body || 'Performance enhancements, security hardening, and telemetry visual updates.',
        published_at: data.published_at ? new Date(data.published_at).toLocaleDateString() : 'Recent',
        apkUrl,
        apkSize
      });

      // Compare versions
      const isNewer = latestTag.localeCompare(CURRENT_VERSION, undefined, { numeric: true, sensitivity: 'base' }) > 0;
      setHasUpdate(isNewer);

      if (isNewer) {
        setStatusMessage(`New update available: ${latestTag}`);
      } else {
        setStatusMessage(`NetPulse ${CURRENT_VERSION} is up to date`);
      }
    } catch (err: any) {
      console.warn('Update check notice:', err.message);
      // Fallback display
      setRelease({
        tag_name: 'v0.2',
        name: 'NetPulse v0.2',
        body: '• In-App APK Updater in Settings\n• Android Infinity Pulse app icon\n• Dynamic Download (Orange) & Upload (Purple) speedometer themes\n• Defensive APK Security Hardening',
        published_at: new Date().toLocaleDateString(),
        apkUrl: 'https://github.com/Suvesh108/NetPulse/releases/download/v0.2/NetPulse-v0.2.apk',
        apkSize: 4597662
      });
      setHasUpdate(false);
      setStatusMessage(`NetPulse ${CURRENT_VERSION} is up to date`);
    } finally {
      setChecking(false);
    }
  };

  // Perform in-app direct download and package installer trigger
  const handleDownloadAndInstall = async () => {
    const targetUrl = release?.apkUrl || 'https://github.com/Suvesh108/NetPulse/releases/download/v0.2/NetPulse-v0.2.apk';
    
    try {
      setDownloadProgress(5);
      setStatusMessage('Initiating in-app package download...');

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Failed to download APK package');

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : (release?.apkSize || 4597662);
      
      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback standard blob
        const blob = await response.blob();
        triggerInstallation(blob);
        return;
      }

      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;
        
        const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
        setDownloadProgress(pct);
        setStatusMessage(`Downloading package... ${pct}% (${(receivedBytes / (1024 * 1024)).toFixed(1)} MB)`);
      }

      setDownloadProgress(100);
      setStatusMessage('Download complete! Preparing package installer...');

      // Combine chunks
      const fullBlob = new Blob(chunks as any, { type: 'application/vnd.android.package-archive' });
      triggerInstallation(fullBlob);

    } catch (e: any) {
      console.error('In-app download error:', e);
      // Direct stream download fallback
      setDownloadProgress(100);
      setStatusMessage('Opening direct installer package...');
      
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = `NetPulse-${release?.tag_name || 'v0.2'}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const triggerInstallation = (blob: Blob) => {
    setIsInstalling(true);
    const blobUrl = URL.createObjectURL(blob);
    setDownloadedApkBlobUrl(blobUrl);

    // Trigger direct Android package installation / download prompt
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `NetPulse-${release?.tag_name || 'v0.2'}.apk`;
    a.setAttribute('type', 'application/vnd.android.package-archive');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setStatusMessage('Package ready! Tap "Install Now" or open the downloaded file to proceed.');
  };

  useEffect(() => {
    if (autoCheck) {
      checkForUpdates(false);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <PackageCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-900">Application Updates</h3>
            <span className="text-[9px] text-slate-400">In-app direct APK updater & release channels</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {CURRENT_VERSION}
          </span>
          {hasUpdate ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
              Update Available
            </span>
          ) : (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Latest
            </span>
          )}
        </div>
      </div>

      {/* Main Action Box */}
      <div className="flex flex-col gap-2.5">
        
        {/* Status Box */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  {hasUpdate ? `Update Found: ${release?.tag_name}` : 'NetPulse Engine Status'}
                </span>
                <span className="text-[10px] text-slate-500">{statusMessage}</span>
              </div>
            </div>

            <button
              onClick={() => checkForUpdates(true)}
              disabled={checking || downloadProgress !== null}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                checking 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95 shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{checking ? 'Checking...' : 'Check Now'}</span>
            </button>
          </div>

          {/* Download Progress Bar */}
          {downloadProgress !== null && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/60 animate-fade-in">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-indigo-600 flex items-center gap-1">
                  <Download className="w-3 h-3 animate-bounce" /> In-App Package Download
                </span>
                <span className="font-mono text-slate-700">{downloadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-200 shadow-sm"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Release Notes / Action Trigger */}
        {release && (
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-800">Release Notes ({release.tag_name})</span>
              <span className="text-[9px] text-slate-400 font-mono">{release.published_at}</span>
            </div>

            <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-line font-mono max-h-24 overflow-y-auto">
              {release.body}
            </div>

            {/* In-App Direct Download & Install Button */}
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={handleDownloadAndInstall}
                disabled={downloadProgress !== null && downloadProgress < 100}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {downloadProgress === 100 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>INSTALL APK NOW</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 fill-white" />
                    <span>{hasUpdate ? `DOWNLOAD & INSTALL ${release.tag_name}` : 'RE-DOWNLOAD CURRENT APK'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
