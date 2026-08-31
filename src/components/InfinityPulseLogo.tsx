import React from 'react';

interface InfinityPulseLogoProps {
  className?: string;
  strokeWidth?: number;
  color?: string;
  active?: boolean;
}

export default function InfinityPulseLogo({
  className = "w-auto h-7 text-blue-600",
  strokeWidth = 3.5,
  color = "#2563EB",
  active = false
}: InfinityPulseLogoProps) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        viewBox="0 0 200 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} overflow-visible inline-block shrink-0`}
        aria-label="NetPulse Logo"
      >
        <defs>
          {/* Luminous Active Glow Filter */}
          <filter id="pulseGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Active Gradient for Traveling Pulse */}
          <linearGradient id="travelingPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
            <stop offset="50%" stopColor="#93C5FD" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </linearGradient>

          <style>
            {`
              @keyframes pulseWaveLeftToRight {
                0% {
                  stroke-dashoffset: 450;
                  opacity: 0.2;
                }
                15% {
                  opacity: 1;
                }
                85% {
                  opacity: 1;
                }
                100% {
                  stroke-dashoffset: 0;
                  opacity: 0.2;
                }
              }

              .active-pulse-packet {
                stroke-dasharray: 45 405;
                animation: pulseWaveLeftToRight 1.25s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              }

              .active-pulse-trail {
                stroke-dasharray: 90 360;
                animation: pulseWaveLeftToRight 1.25s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                animation-delay: -0.1s;
              }
            `}
          </style>
        </defs>

        {/* --- BASE EXACT GEOMETRIC DESIGN (100% UNCHANGED) --- */}

        {/* 1. Left pulse wave entering the infinity loop */}
        <path
          d="M 6,40 L 24,40 L 29,26 L 36,56 L 44,14 L 52,66 L 58,40"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2. Smooth continuous infinity loop */}
        <path
          d="M 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 C 136,12 106,12 100,40 C 94,68 64,68 58,40 Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3. Inner concentric loop ring for layered depth */}
        <path
          d="M 68,40 C 72,22 93,22 100,40 C 107,58 128,58 132,40 C 128,22 107,22 100,40 C 93,58 72,58 68,40 Z"
          stroke={color}
          strokeWidth={strokeWidth * 0.85}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* 4. Right pulse wave exiting the infinity loop */}
        <path
          d="M 142,40 L 148,14 L 156,66 L 164,26 L 171,56 L 176,40 L 194,40"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* --- ACTIVE SPEED TEST LEFT-TO-RIGHT TRAVELING PULSE OVERLAY --- */}
        {active && (
          <g filter="url(#pulseGlow)">
            {/* Luminous Blue Pulse Trail */}
            <path
              d="M 6,40 L 24,40 L 29,26 L 36,56 L 44,14 L 52,66 L 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 C 136,12 106,12 100,40 C 94,68 64,68 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 L 148,14 L 156,66 L 164,26 L 171,56 L 176,40 L 194,40"
              stroke="#60A5FA"
              strokeWidth={strokeWidth * 1.15}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="active-pulse-trail"
              opacity="0.8"
            />
            {/* Bright Electric Core Packet */}
            <path
              d="M 6,40 L 24,40 L 29,26 L 36,56 L 44,14 L 52,66 L 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 C 136,12 106,12 100,40 C 94,68 64,68 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 L 148,14 L 156,66 L 164,26 L 171,56 L 176,40 L 194,40"
              stroke="url(#travelingPulseGrad)"
              strokeWidth={strokeWidth * 1.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="active-pulse-packet"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
