import React from 'react';

interface InfinityPulseLogoProps {
  className?: string;
  strokeWidth?: number;
  color?: string;
  isTesting?: boolean;
}

export default function InfinityPulseLogo({
  className = "h-6 sm:h-7 md:h-7.5 w-auto text-[#2563EB]",
  strokeWidth = 3.8,
  color = "#2563EB",
  isTesting = false
}: InfinityPulseLogoProps) {
  return (
    <svg
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible inline-block shrink-0 transition-transform duration-300`}
      aria-label="NetPulse Logo"
    >
      <defs>
        {isTesting && (
          <>
            {/* Dynamic Traveling Electric Pulse Gradient from Left to Right */}
            <linearGradient id="travelingPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
              <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="65%" stopColor="#38BDF8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
              <animate
                attributeName="x1"
                from="-100%"
                to="100%"
                dur="1.15s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                from="0%"
                to="200%"
                dur="1.15s"
                repeatCount="indefinite"
              />
            </linearGradient>

            <filter id="logoPulseGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </>
        )}
      </defs>

      {/* 1. Base Left Pulse Wave */}
      <path
        d="M 6,40 L 24,40 L 29,26 L 36,56 L 44,14 L 52,66 L 58,40"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Base Smooth Continuous Infinity Loop */}
      <path
        d="M 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 C 136,12 106,12 100,40 C 94,68 64,68 58,40 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Base Inner Concentric Loop Ring */}
      <path
        d="M 68,40 C 72,22 93,22 100,40 C 107,58 128,58 132,40 C 128,22 107,22 100,40 C 93,58 72,58 68,40 Z"
        stroke={color}
        strokeWidth={strokeWidth * 0.85}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* 4. Base Right Pulse Wave */}
      <path
        d="M 142,40 L 148,14 L 156,66 L 164,26 L 171,56 L 176,40 L 194,40"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dynamic Pulse Traveling Light Beam (Active when speed test starts until it stops) */}
      {isTesting && (
        <g filter="url(#logoPulseGlow)">
          <path
            d="M 6,40 L 24,40 L 29,26 L 36,56 L 44,14 L 52,66 L 58,40"
            stroke="url(#travelingPulseGrad)"
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 C 136,12 106,12 100,40 C 94,68 64,68 58,40 Z"
            stroke="url(#travelingPulseGrad)"
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 68,40 C 72,22 93,22 100,40 C 107,58 128,58 132,40 C 128,22 107,22 100,40 C 93,58 72,58 68,40 Z"
            stroke="url(#travelingPulseGrad)"
            strokeWidth={strokeWidth * 0.95}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 142,40 L 148,14 L 156,66 L 164,26 L 171,56 L 176,40 L 194,40"
            stroke="url(#travelingPulseGrad)"
            strokeWidth={strokeWidth * 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}
