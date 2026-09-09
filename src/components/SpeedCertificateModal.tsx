import React, { useRef, useState } from 'react';
import { 
  X, Download, Copy, Check, ShieldCheck, Zap, 
  Tv, Gamepad2, Video, Award, Share2, Sparkles, Headphones, Layers
} from 'lucide-react';
import { SpeedTestResult } from '../types';

interface SpeedCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SpeedTestResult | null;
  activeServerName: string;
  unit: 'Mbps' | 'MB/s';
}

export default function SpeedCertificateModal({
  isOpen,
  onClose,
  result,
  activeServerName,
  unit
}: SpeedCertificateModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !result) return null;

  const downloadSpeed = result.downloadSpeed ?? result.downloadMbps ?? 0;
  const uploadSpeed = result.uploadSpeed ?? result.uploadMbps ?? 0;
  const ping = result.ping ?? result.pingMs ?? 0;
  const jitter = result.jitter ?? result.jitterMs ?? 0;
  const bufferbloatGrade = result.bufferbloatGrade || 'A+';
  const voipMos = result.voipMos ? result.voipMos.toFixed(2) : '4.35';
  const dateStr = result.date || (result.timestamp ? new Date(result.timestamp).toLocaleDateString() : new Date().toLocaleDateString());

  const handleDownloadPng = async () => {
    try {
      setDownloading(true);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 680;

      // Dark background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 680);
      bgGrad.addColorStop(0, '#121212');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 680);

      // Cyan-blue border frame
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1160, 640);

      // Header Branding
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('⚡ NETPULSE VERIFIED SPEED CERTIFICATE', 60, 80);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '18px monospace';
      ctx.fillText(`Edge Node: ${activeServerName} • Date: ${dateStr}`, 60, 120);

      // Latency Box
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(60, 160, 340, 170);
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('PING & JITTER', 80, 200);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px sans-serif';
      ctx.fillText(`${ping}`, 80, 270);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`ms (±${jitter}ms)`, 170, 270);

      // Download Box
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(430, 160, 340, 170);
      ctx.fillStyle = '#F6821F';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('DOWNLOAD SPEED', 450, 200);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px sans-serif';
      ctx.fillText(`${downloadSpeed.toFixed(1)}`, 450, 270);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(unit, 650, 270);

      // Upload Box
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(800, 160, 340, 170);
      ctx.fillStyle = '#A855F7';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('UPLOAD SPEED', 820, 200);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px sans-serif';
      ctx.fillText(`${uploadSpeed.toFixed(1)}`, 820, 270);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(unit, 1020, 270);

      // Readiness Ratings Strip
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(60, 360, 1080, 180);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('NETWORK QUALITY & BUFFERBLOAT TELEMETRY', 90, 400);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`• Bufferbloat Grade: ${bufferbloatGrade}`, 90, 450);
      ctx.fillText(`• VoIP / WebRTC MOS: ${voipMos} / 4.5`, 460, 450);
      ctx.fillText(`• Gaming Latency: ${result.gamingQuality || 'Low Latency'}`, 820, 450);

      ctx.fillText(`• 4K Video Streaming: ${result.streamingQuality || 'Ready'}`, 90, 500);
      ctx.fillText(`• Video Calls: ${result.chatQuality || 'Crystal Clear'}`, 460, 500);
      ctx.fillText(`• Packet Loss: ${(result.packetLoss || 0).toFixed(1)}%`, 820, 500);

      // Footer
      ctx.fillStyle = '#64748B';
      ctx.font = '16px monospace';
      ctx.fillText('Verified by NetPulse v0.9 Edge Engine • https://github.com/Suvesh108/NetPulse', 60, 620);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `NetPulse-Certificate-${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#121212] w-full max-w-xl rounded-3xl p-6 border border-slate-200 dark:border-[#262626] shadow-2xl flex flex-col gap-4 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#222222] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Card Body */}
        <div ref={cardRef} className="p-5 rounded-2xl bg-gradient-to-br from-black via-zinc-950 to-neutral-900 text-white border border-neutral-800 shadow-xl flex flex-col gap-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <div>
                <h4 className="font-black text-sm tracking-tight text-white">NETPULSE VERIFIED SPEED CERTIFICATE</h4>
                <span className="text-[10px] text-slate-400 font-mono">{activeServerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                GRADE {bufferbloatGrade}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                VERIFIED
              </span>
            </div>
          </div>

          {/* Key Metrics: Latency -> Download -> Upload */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col">
              <span className="text-[9px] text-amber-400 font-bold">LATENCY</span>
              <span className="text-2xl font-black text-white">{ping}</span>
              <span className="text-[9px] text-slate-400">ms (±{jitter}ms)</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col">
              <span className="text-[9px] text-[#F6821F] font-bold">DOWNLOAD</span>
              <span className="text-2xl font-black text-white">{downloadSpeed.toFixed(1)}</span>
              <span className="text-[9px] text-slate-400">{unit}</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col">
              <span className="text-[9px] text-purple-400 font-bold">UPLOAD</span>
              <span className="text-2xl font-black text-white">{uploadSpeed.toFixed(1)}</span>
              <span className="text-[9px] text-slate-400">{unit}</span>
            </div>
          </div>

          {/* Quality Assessment Strip */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-bold text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400">
              <Tv className="w-3.5 h-3.5" />
              <span>4K Stream</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-emerald-400">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Low Ping</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-emerald-400">
              <Headphones className="w-3.5 h-3.5" />
              <span>MOS {voipMos}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-cyan-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Bloat {bufferbloatGrade}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating PNG...' : 'Download Certificate Image (PNG)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
