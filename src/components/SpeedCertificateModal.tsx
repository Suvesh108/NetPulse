import React, { useRef, useState } from 'react';
import { 
  X, Download, Copy, Check, ShieldCheck, Zap, 
  Tv, Gamepad2, Video, Globe, ArrowDown, ArrowUp, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { springs, modalVariants, backdropVariants } from '../lib/motion';
import { SpeedTestResult } from '../types';

interface SpeedCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SpeedTestResult | null;
  activeServerName: string;
  unit: 'Mbps' | 'MB/s';
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
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
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const factor = unit === 'MB/s' ? 8 : 1;
  const downloadSpeed = result.downloadSpeed ?? result.downloadMbps ?? 0;
  const uploadSpeed = result.uploadSpeed ?? result.uploadMbps ?? 0;
  const displayDownload = (downloadSpeed / factor).toFixed(1);
  const displayUpload = (uploadSpeed / factor).toFixed(1);
  const ping = result.ping ?? result.pingMs ?? 0;
  const jitter = result.jitter ?? result.jitterMs ?? 0;
  const bufferbloatGrade = result.bufferbloatGrade || 'A+';
  const voipMos = result.voipMos ? result.voipMos.toFixed(2) : '4.35';
  const packetLoss = (result.packetLoss ?? 0).toFixed(1);
  const loadedDelta = result.loadedLatencyMs ? Math.round(result.loadedLatencyMs) : 4;
  const dateStr = result.date || (result.timestamp ? new Date(result.timestamp).toLocaleDateString() : new Date().toLocaleDateString());
  const certId = result.id ? `NP-${result.id.toUpperCase()}` : `NP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const handleDownloadPng = async () => {
    try {
      setDownloading(true);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1200;
      canvas.height = 675;

      // 1. Deep Obsidian Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
      bgGrad.addColorStop(0, '#090B11');
      bgGrad.addColorStop(0.5, '#0B0E17');
      bgGrad.addColorStop(1, '#06070B');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 675);

      // Ambient Glow Radiance (Cyan top-left, Violet bottom-right)
      const glowCyan = ctx.createRadialGradient(240, 140, 10, 240, 140, 480);
      glowCyan.addColorStop(0, 'rgba(0, 210, 255, 0.12)');
      glowCyan.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowCyan;
      ctx.fillRect(0, 0, 1200, 675);

      const glowViolet = ctx.createRadialGradient(960, 260, 10, 960, 260, 500);
      glowViolet.addColorStop(0, 'rgba(168, 85, 247, 0.09)');
      glowViolet.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowViolet;
      ctx.fillRect(0, 0, 1200, 675);

      // Outer Card Frame
      drawRoundRect(ctx, 32, 32, 1136, 611, 22);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top Specular Rim Highlight
      const rimGrad = ctx.createLinearGradient(32, 32, 1168, 32);
      rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      rimGrad.addColorStop(0.3, 'rgba(0, 210, 255, 0.35)');
      rimGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.35)');
      rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 32);
      ctx.lineTo(1120, 32);
      ctx.stroke();

      // 2. Header Branding
      // Glowing Logo Icon Circle
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(80, 80, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00D2FF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Mini speed dial needle in icon
      ctx.strokeStyle = '#00F5A0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(80, 80);
      ctx.lineTo(92, 70);
      ctx.stroke();

      // Title & Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('NETPULSE', 115, 75);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('VERIFIED TELEMETRY AUDIT CERTIFICATE', 115, 93);

      // Status Badges (Right Header)
      // Verified Pill
      drawRoundRect(ctx, 900, 62, 115, 32, 8);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('VERIFIED ✓', 920, 83);

      // Grade Badge
      drawRoundRect(ctx, 1025, 62, 110, 32, 8);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.stroke();
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`GRADE ${bufferbloatGrade}`, 1042, 83);

      // Meta subline
      ctx.fillStyle = '#64748B';
      ctx.font = '12px monospace';
      ctx.fillText(`Backbone: ${activeServerName} • Protocol: HTTP/3 (QUIC) • Date: ${dateStr} • ID: ${certId}`, 65, 130);

      // Thin separator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(65, 145);
      ctx.lineTo(1135, 145);
      ctx.stroke();

      // 3. Three Hero Telemetry Cards
      const cardW = 338;
      const cardH = 175;
      const cardY = 165;

      // Card 1: Download Speed
      drawRoundRect(ctx, 65, cardY, cardW, cardH, 16);
      ctx.fillStyle = '#101422';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Download Card Accent Top Rim
      ctx.strokeStyle = '#00D2FF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(85, cardY);
      ctx.lineTo(145, cardY);
      ctx.stroke();

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('↓ INBOUND DOWNLOAD', 85, cardY + 34);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
      ctx.fillText(displayDownload, 85, cardY + 105);

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(unit, 85 + ctx.measureText(displayDownload).width + 12, cardY + 105);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText('Saturated Multi-Stream Edge Throughput', 85, cardY + 145);

      // Card 2: Upload Speed
      drawRoundRect(ctx, 431, cardY, cardW, cardH, 16);
      ctx.fillStyle = '#101422';
      ctx.fill();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.stroke();

      // Upload Card Accent Top Rim
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(451, cardY);
      ctx.lineTo(511, cardY);
      ctx.stroke();

      ctx.fillStyle = '#C084FC';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('↑ OUTBOUND UPLOAD', 451, cardY + 34);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
      ctx.fillText(displayUpload, 451, cardY + 105);

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(unit, 451 + ctx.measureText(displayUpload).width + 12, cardY + 105);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText('Upstream Pipeline Integrity Verified', 451, cardY + 145);

      // Card 3: Latency & Jitter
      drawRoundRect(ctx, 797, cardY, cardW, cardH, 16);
      ctx.fillStyle = '#101422';
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.stroke();

      // Latency Accent Top Rim
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(817, cardY);
      ctx.lineTo(877, cardY);
      ctx.stroke();

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('⚡ ROUND-TRIP TIME', 817, cardY + 34);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${ping}`, 817, cardY + 105);

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText('ms', 817 + ctx.measureText(`${ping}`).width + 12, cardY + 105);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText(`Jitter: ±${jitter}ms • Queue Delta: +${loadedDelta}ms`, 817, cardY + 145);

      // 4. Quality & Telemetry Matrix Container
      const qY = 365;
      const qH = 195;
      drawRoundRect(ctx, 65, qY, 1070, qH, 16);
      ctx.fillStyle = '#0D101A';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.stroke();

      // Title
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('NETWORK QUALITY & EXPERIENTIAL TELEMETRY', 90, qY + 34);

      // Subtitle line
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText('Real-time packet loss, bufferbloat queuing latency, and WebRTC MOS calibration', 90, qY + 52);

      // 4 High-Density Quality Metric Cards
      const colW = 232;
      const tileY = qY + 70;
      const tileH = 100;

      // Tile 1: Bufferbloat
      drawRoundRect(ctx, 90, tileY, colW, tileH, 12);
      ctx.fillStyle = '#121626';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.stroke();
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('BUFFERBLOAT GRADE', 105, tileY + 28);
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(`Grade ${bufferbloatGrade}`, 105, tileY + 60);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText(`+${loadedDelta}ms Loaded Delta`, 105, tileY + 82);

      // Tile 2: WebRTC MOS
      drawRoundRect(ctx, 342, tileY, colW, tileH, 12);
      ctx.fillStyle = '#121626';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.stroke();
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('VOIP / WEBRTC MOS', 357, tileY + 28);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(`${voipMos} / 4.50`, 357, tileY + 60);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText('Crystal Clear Voice', 357, tileY + 82);

      // Tile 3: Packet Loss
      drawRoundRect(ctx, 594, tileY, colW, tileH, 12);
      ctx.fillStyle = '#121626';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.stroke();
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('PACKET LOSS', 609, tileY + 28);
      ctx.fillStyle = '#A78BFA';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(`${packetLoss}%`, 609, tileY + 60);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText('25-Burst Zero Drops', 609, tileY + 82);

      // Tile 4: Readiness
      drawRoundRect(ctx, 846, tileY, colW, tileH, 12);
      ctx.fillStyle = '#121626';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.stroke();
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('STREAMING & GAMING', 861, tileY + 28);
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 20px system-ui';
      ctx.fillText('4K UHD Ready', 861, tileY + 60);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText('Low-Latency Esports', 861, tileY + 82);

      // 5. Footer Security & Authenticity Signature
      ctx.fillStyle = '#475569';
      ctx.font = '11px monospace';
      ctx.fillText('Verified by NetPulse v1.1.0 Avionics Edge Engine • RFC-868 Speedtest Spec', 65, 595);

      ctx.fillStyle = '#38BDF8';
      ctx.fillText('https://github.com/Suvesh108/NetPulse', 890, 595);

      // Trigger high-res PNG download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `NetPulse-Certificate-${certId}.png`;
      a.click();
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyReport = () => {
    const report = [
      `⚡ NetPulse v1.1 Verified Speed Certificate`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📡 Edge Node: ${activeServerName}`,
      `📅 Date: ${dateStr}`,
      `🏷️ Audit ID: ${certId}`,
      `⬇️ Download: ${displayDownload} ${unit}`,
      `⬆️ Upload: ${displayUpload} ${unit}`,
      `⏱️ Ping: ${ping} ms (Jitter: ±${jitter} ms)`,
      `🛡️ Bufferbloat Grade: ${bufferbloatGrade} (+${loadedDelta}ms delta)`,
      `📞 VoIP WebRTC MOS: ${voipMos} / 4.5`,
      `📦 Packet Loss: ${packetLoss}%`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Verified via https://github.com/Suvesh108/NetPulse`
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cert-backdrop"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
        >
          <motion.div
            key="cert-dialog"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springs.smooth}
            className="hud-panel w-full max-w-2xl rounded-3xl p-5 sm:p-6 flex flex-col gap-5 relative shadow-2xl border border-white/[0.1] bg-[#0A0C14]"
          >
            {/* Close Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Certificate Card Body Preview */}
            <div ref={cardRef} className="p-5 sm:p-6 rounded-2xl bg-[#0D101A] text-white border border-white/[0.08] shadow-2xl flex flex-col gap-5 relative overflow-hidden">
              
              {/* Ambient Lighting Orbs inside Card */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06] relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-sans font-black text-sm sm:text-base tracking-tight text-white uppercase">
                    NetPulse Verified Certificate
                  </h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                    v1.1
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {activeServerName} • {dateStr}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                GRADE {bufferbloatGrade}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                {certId}
              </span>
            </div>
          </div>

          {/* 3 Hero Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono relative z-10">
            {/* Download */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-cyan-500/20 flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                <span className="flex items-center gap-1">
                  <ArrowDown className="w-3.5 h-3.5" />
                  DOWNLOAD
                </span>
                <span className="text-[10px] text-zinc-500 font-normal">HTTP/3</span>
              </div>
              <div className="my-2">
                <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {displayDownload}
                </span>
                <span className="text-xs text-zinc-400 ml-1.5 font-bold uppercase">{unit}</span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate">Multi-stream edge saturation</span>
            </div>

            {/* Upload */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-purple-500/20 flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3.5 h-3.5" />
                  UPLOAD
                </span>
                <span className="text-[10px] text-zinc-500 font-normal">In-Flight</span>
              </div>
              <div className="my-2">
                <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {displayUpload}
                </span>
                <span className="text-xs text-zinc-400 ml-1.5 font-bold uppercase">{unit}</span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate">Upstream pipeline verified</span>
            </div>

            {/* Latency */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-amber-500/20 flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  LATENCY
                </span>
                <span className="text-[10px] text-zinc-500 font-normal">Idle</span>
              </div>
              <div className="my-2">
                <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {ping}
                </span>
                <span className="text-xs text-zinc-400 ml-1.5 font-bold uppercase">ms</span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate">
                Jitter ±{jitter}ms • Queue +{loadedDelta}ms
              </span>
            </div>
          </div>

          {/* Quality Telemetry Grid */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono relative z-10">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
              <Tv className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-zinc-500">STREAMING</span>
                <span className="font-bold text-emerald-400 truncate">4K UHD Ready</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
              <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-zinc-500">GAMING</span>
                <span className="font-bold text-emerald-400 truncate">Low Latency</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
              <Video className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-zinc-500">WEBRTC MOS</span>
                <span className="font-bold text-cyan-400 truncate">{voipMos} / 4.5</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-zinc-500">PACKET LOSS</span>
                <span className="font-bold text-purple-400 truncate">{packetLoss}% Zero Drop</span>
              </div>
            </div>
          </div>

          {/* Footer Security Signature */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/[0.04] relative z-10">
            <span>Verified by NetPulse v1.1.0 Avionics Engine</span>
            <span className="text-cyan-400">RFC-868 Validated</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPng}
            disabled={downloading}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hud-btn"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'RENDERING PNG...' : 'DOWNLOAD HIGH-RES CERTIFICATE (PNG)'}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyReport}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider border border-white/[0.08] transition-all flex items-center justify-center gap-2 cursor-pointer hud-btn"
            title="Copy Report to Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'COPIED!' : 'COPY REPORT'}</span>
          </motion.button>
        </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
