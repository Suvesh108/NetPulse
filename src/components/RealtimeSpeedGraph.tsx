import React, { useEffect, useRef, useState, useMemo } from 'react';

export interface RealtimeSpeedGraphProps {
  /** Label displayed in the header (e.g. "Download", "Upload") */
  title?: string;
  /** Subtitle / stream mode (e.g. "HTTP/3 Stream", "Multi-Socket Pipe") */
  streamTag?: string;
  /** Color theme: 'download' (Cloudflare neon orange) or 'upload' (neon violet/purple) or custom hex */
  theme?: 'download' | 'upload' | string;
  /** External live speed in Mbps. If omitted or in simulate mode, internal mock stream is used. */
  currentSpeed?: number;
  /** Unit label (defaults to "Mbps") */
  unit?: string;
  /** Whether to run simulated network speed fluctuations */
  simulate?: boolean;
  /** Target base speed for simulation in Mbps */
  simulatedBaseMbps?: number;
  /** Update interval in ms (defaults to 250ms) */
  updateIntervalMs?: number;
  /** Maximum number of data points in sliding window (defaults to 30) */
  maxPoints?: number;
  /** Height of the graph canvas in px (defaults to 120) */
  height?: number;
  /** Optional callback when speed updates */
  onSpeedUpdate?: (speed: number) => void;
  /** Custom CSS classes for outer container */
  className?: string;
}

/**
 * RealtimeSpeedGraph
 * 
 * Production-ready, 60/120 FPS horizontally sliding real-time speed graph
 * styled with the Cloudflare Speed Test dark telemetry aesthetic.
 * 
 * Features:
 * - High-performance HTML5 Canvas with sub-pixel glide (zero layout thrashing)
 * - Cubic Bezier monotone spline interpolation (zero jagged spikes)
 * - Leading-edge pulsating glowing beacon at the live telemetry head
 * - Sliding window buffer (fixed capacity FIFO queue)
 * - Translucent vertical gradient area fill + subtle dashed horizontal gridlines
 * - Smooth lerped readout counter with peak tracking
 * - Embedded organic network fluctuation generator
 */
export const RealtimeSpeedGraph: React.FC<RealtimeSpeedGraphProps> = ({
  title = 'Download',
  streamTag = 'HTTP/3 Stream',
  theme = 'download',
  currentSpeed,
  unit = 'Mbps',
  simulate = true,
  simulatedBaseMbps = 145.0,
  updateIntervalMs = 250,
  maxPoints = 28,
  height = 110,
  onSpeedUpdate,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Resolved colors
  const strokeColor = useMemo(() => {
    if (theme === 'download') return '#F38020'; // Cloudflare Neon Orange
    if (theme === 'upload') return '#7952FF';   // Cloudflare Neon Violet/Purple
    return theme;
  }, [theme]);

  // Telemetry buffer & smooth values
  const bufferRef = useRef<number[]>(new Array(maxPoints).fill(0));
  const peakRef = useRef<number>(0);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [peakValue, setPeakValue] = useState<number>(0);

  // Animation & interpolation tracking
  const targetValueRef = useRef<number>(0);
  const currentValueRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(performance.now());
  const tickProgressRef = useRef<number>(1); // 0 to 1 for sub-tick smooth sliding

  // 1. Data Stream Ingestion (Simulated or External Live Feed)
  useEffect(() => {
    if (!simulate && currentSpeed !== undefined) {
      targetValueRef.current = Math.max(0, currentSpeed);
      return;
    }

    // Realistic network fluctuation simulation (Brownian drift with micro-bursts)
    let currentSim = simulatedBaseMbps;
    const interval = setInterval(() => {
      // 80% small drift, 20% burst
      const isBurst = Math.random() < 0.2;
      const drift = (Math.random() - 0.48) * (isBurst ? 35 : 12);
      currentSim = Math.max(4.0, currentSim + drift);
      
      // Push new sample
      targetValueRef.current = currentSim;
      onSpeedUpdate?.(currentSim);

      // Slide buffer
      bufferRef.current.push(currentSim);
      if (bufferRef.current.length > maxPoints) {
        bufferRef.current.shift();
      }

      // Update peak
      if (currentSim > peakRef.current) {
        peakRef.current = currentSim;
        setPeakValue(currentSim);
      }

      // Reset tick progress for smooth sub-pixel scroll
      lastTickTimeRef.current = performance.now();
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [simulate, currentSpeed, simulatedBaseMbps, updateIntervalMs, maxPoints, onSpeedUpdate]);

  // Handle external live speed feed updates into sliding window
  useEffect(() => {
    if (simulate || currentSpeed === undefined) return;
    
    targetValueRef.current = currentSpeed;
    bufferRef.current.push(currentSpeed);
    if (bufferRef.current.length > maxPoints) {
      bufferRef.current.shift();
    }
    if (currentSpeed > peakRef.current) {
      peakRef.current = currentSpeed;
      setPeakValue(currentSpeed);
    }
    lastTickTimeRef.current = performance.now();
  }, [simulate, currentSpeed, maxPoints]);

  // 2. High-Performance Canvas Rendering Loop (60/120 FPS requestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (time: number) => {
      // Display value smooth spring/lerp (avoids digit flicker)
      currentValueRef.current += (targetValueRef.current - currentValueRef.current) * 0.15;
      setDisplayValue(currentValueRef.current);

      // Compute sub-pixel horizontal glide progress [0..1]
      const elapsed = time - lastTickTimeRef.current;
      tickProgressRef.current = Math.min(1.0, elapsed / updateIntervalMs);

      // Device Pixel Ratio scaling for Retina displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const data = bufferRef.current;
      const n = data.length;
      if (n < 2) {
        ctx.restore();
        animId = requestAnimationFrame(render);
        return;
      }

      // Dynamic Auto-scaling with Headroom
      const rawMax = Math.max(...data, peakRef.current * 0.8, 10.0);
      const maxVal = rawMax * 1.15; // 15% ceiling headroom
      const minVal = 0;

      // Coordinate mapping helpers
      const paddingBottom = 6;
      const paddingTop = 8;
      const graphH = h - paddingTop - paddingBottom;
      const stepX = w / (n - 1);

      // Sub-pixel shift offset for smooth horizontal glide
      const slideOffset = (1 - tickProgressRef.current) * (stepX * 0.5);

      const getY = (val: number) => {
        const normalized = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
        return h - paddingBottom - normalized * graphH;
      };

      const getX = (i: number) => {
        return i * stepX - slideOffset;
      };

      // A. Draw Subtle Horizontal Dashed Gridlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const gridLevels = [0.25, 0.5, 0.75, 1.0];
      gridLevels.forEach((pct) => {
        const gridY = h - paddingBottom - pct * graphH;
        ctx.beginPath();
        ctx.moveTo(0, gridY);
        ctx.lineTo(w, gridY);
        ctx.stroke();
      });
      ctx.setLineDash([]); // Reset dash

      // B. Build Smooth Monotone Cubic Bezier Spline Path
      const points = data.map((val, idx) => ({
        x: getX(idx),
        y: getY(val)
      }));

      // Monotone Bezier control points computation
      const splinePath = new Path2D();
      splinePath.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + (curr.x - prev.x) * 0.45;
        const cpY1 = prev.y;
        const cpX2 = curr.x - (curr.x - prev.x) * 0.45;
        const cpY2 = curr.y;
        splinePath.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, curr.x, curr.y);
      }

      // C. Render Translucent Vertical Gradient Area Fill
      const areaPath = new Path2D(splinePath);
      const lastPoint = points[points.length - 1];
      const firstPoint = points[0];
      areaPath.lineTo(lastPoint.x, h);
      areaPath.lineTo(firstPoint.x, h);
      areaPath.closePath();

      const areaGradient = ctx.createLinearGradient(0, paddingTop, 0, h);
      areaGradient.addColorStop(0, strokeColor + '55'); // 33% opacity at peak
      areaGradient.addColorStop(0.6, strokeColor + '18'); // 10% mid
      areaGradient.addColorStop(1, strokeColor + '00'); // 0% at bottom

      ctx.fillStyle = areaGradient;
      ctx.fill(areaPath);

      // D. Render Crisp Glowing Stroke
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 8;
      ctx.stroke(splinePath);
      ctx.restore();

      // E. Pulsating Glowing Leading Tip (Head of the active telemetry)
      if (lastPoint) {
        const pulse = (Math.sin(time * 0.006) + 1) / 2; // 0..1 smooth breath
        const haloRadius = 7 + pulse * 5;

        // Outer Glow Halo
        const haloGrad = ctx.createRadialGradient(
          lastPoint.x, lastPoint.y, 1,
          lastPoint.x, lastPoint.y, haloRadius
        );
        haloGrad.addColorStop(0, strokeColor + '88');
        haloGrad.addColorStop(0.5, strokeColor + '33');
        haloGrad.addColorStop(1, strokeColor + '00');

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing Shockwave Ring
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.8 - pulse * 0.5;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 4 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Solid Bright White Core Dot
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [strokeColor, updateIntervalMs]);

  return (
    <div 
      ref={containerRef}
      className={`rounded-2xl border border-white/[0.08] bg-[#111217] p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 text-zinc-100 shadow-xl shadow-black/40 min-w-0 select-none ${className}`}
    >
      {/* 1. Header & Live Metric Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span 
            className="w-2 h-2 rounded-full animate-pulse shrink-0" 
            style={{ backgroundColor: strokeColor }}
          />
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
            {title}
          </h3>
        </div>
        <span 
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0"
          style={{ 
            color: strokeColor, 
            borderColor: strokeColor + '33',
            backgroundColor: strokeColor + '10'
          }}
        >
          {streamTag}
        </span>
      </div>

      {/* 2. Primary Telemetry Readout */}
      <div className="flex items-baseline justify-between py-0.5">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
            {title === 'Download' ? 'Inbound Rate' : 'Outbound Rate'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">
              {displayValue.toFixed(2)}
            </span>
            <span className="text-xs font-mono font-semibold text-zinc-400">
              {unit}
            </span>
          </div>
        </div>

        {/* Peak Speed Readout */}
        <div className="text-right font-mono text-[10px] text-zinc-500">
          <span className="block uppercase tracking-wider">Peak Wire Rate</span>
          <span className="text-xs font-bold text-zinc-300 tabular-nums">
            {peakValue > 0 ? `${peakValue.toFixed(1)} ${unit}` : `-- ${unit}`}
          </span>
        </div>
      </div>

      {/* 3. Real-Time Horizontally Scrolling Canvas Graph */}
      <div 
        className="w-full rounded-xl bg-[#090A0E] border border-white/[0.04] overflow-hidden relative p-1 flex flex-col justify-end"
        style={{ height }}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block" 
        />
      </div>

      {/* 4. Sub-Metric Mini Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-white/[0.04] pt-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Sliding Window: {maxPoints} Samples</span>
        </div>
        <span>Interpolation: Monotone Cubic</span>
      </div>
    </div>
  );
};

export default RealtimeSpeedGraph;
