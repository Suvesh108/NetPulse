import React from 'react';

interface InfinityPulseLogoProps {
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export default function InfinityPulseLogo({
  className = "w-9 h-5 text-blue-600",
  strokeWidth = 3.5,
  color = "currentColor"
}: InfinityPulseLogoProps) {
  return (
    <svg
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible inline-block shrink-0`}
      aria-label="NetPulse Logo"
    >
      {/* Left pulse wave entering the infinity loop */}
      <path
        d="M 6,40 L 24,40 L 29,26 L 36,56 L 44,14 L 52,66 L 58,40"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Smooth continuous infinity loop */}
      <path
        d="M 58,40 C 64,12 94,12 100,40 C 106,68 136,68 142,40 C 136,12 106,12 100,40 C 94,68 64,68 58,40 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner concentric loop ring for layered depth */}
      <path
        d="M 68,40 C 72,22 93,22 100,40 C 107,58 128,58 132,40 C 128,22 107,22 100,40 C 93,58 72,58 68,40 Z"
        stroke={color}
        strokeWidth={strokeWidth * 0.85}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Right pulse wave exiting the infinity loop */}
      <path
        d="M 142,40 L 148,14 L 156,66 L 164,26 L 171,56 L 176,40 L 194,40"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
