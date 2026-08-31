import React from 'react';

interface InfinityPulseLogoProps {
  className?: string;
  isTesting?: boolean;
  color?: string;
}

export default function InfinityPulseLogo({
  className = "h-6 sm:h-7 md:h-7.5 w-auto",
  isTesting = false,
  color = "#2563EB"
}: InfinityPulseLogoProps) {
  return (
    <div className={`relative flex items-center justify-center transition-all duration-300 ${
      isTesting ? 'scale-105 filter drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]' : ''
    }`}>
      <svg
        viewBox="0 0 200 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} overflow-visible inline-block shrink-0`}
        aria-label="NetPulse Logo"
      >
        <defs>
          {/* Animated Sweeping Energy Gradient from Left to Right */}
          <linearGradient id="travelingPulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="35%" stopColor="#2563EB" />
            <stop offset="48%" stopColor="#60A5FA" />
            <stop offset="55%" stopColor="#FFFFFF" />
            <stop offset="62%" stopColor="#38BDF8" />
            <stop offset="75%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#2563EB" />
            {isTesting && (
              <>
                <animate 
                  attributeName="x1" 
                  from="-100%" 
                  to="100%" 
                  dur="1.1s" 
                  repeatCount="indefinite" 
                />
                <animate 
                  attributeName="x2" 
                  from="0%" 
                  to="200%" 
                  dur="1.1s" 
                  repeatCount="indefinite" 
                />
              </>
            )}
          </linearGradient>

          {/* Electric Glow Filter */}
          <filter id="pulseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Left Pulse Wing */}
        <path
          d="M 6,40 L 24,40 L 29,26 L 36,56 L 44,14 L 52,66 L 58,40"
          stroke={isTesting ? "url(#travelingPulseGradient)" : color}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Outer Infinity Loop */}
        <path
          d="M 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 C 136,12 106,12 100,40 C 94,68 64,68 58,40 Z"
          stroke={isTesting ? "url(#travelingPulseGradient)" : color}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Infinity Loop */}
        <path
          d="M 68,40 C 72,22 93,22 100,40 C 107,58 128,58 132,40 C 128,22 107,22 100,40 C 93,58 72,58 68,40 Z"
          stroke={isTesting ? "url(#travelingPulseGradient)" : color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Right Pulse Wing */}
        <path
          d="M 142,40 L 148,14 L 156,66 L 164,26 L 171,56 L 176,40 L 194,40"
          stroke={isTesting ? "url(#travelingPulseGradient)" : color}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dynamic Electric Laser Particle that travels across the path from Left to Right */}
        {isTesting && (
          <circle r="4.5" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="1.5" filter="url(#pulseGlow)">
            <animateMotion 
              path="M 6,40 L 24,40 L 29,26 L 36,56 L 44,14 L 52,66 L 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 C 136,12 106,12 100,40 C 94,68 64,68 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 L 148,14 L 156,66 L 164,26 L 171,56 L 176,40 L 194,40" 
              dur="1.1s" 
              repeatCount="indefinite" 
            />
          </circle>
        )}
      </svg>
    </div>
  );
}
