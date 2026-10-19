import React from 'react';

interface RollingCounterProps {
  value: number;
  decimals?: number;
  className?: string;
  digitClassName?: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface SingleDigitProps {
  digit: number;
  className?: string;
}

const SingleDigit: React.FC<SingleDigitProps> = ({ digit, className }) => {
  return (
    <div className={`relative inline-block h-[1.1em] overflow-hidden leading-[1.1em] select-none ${className || ''}`}>
      {/* Invisible placeholder to establish accurate natural width and line-height */}
      <span className="invisible">0</span>
      <div
        className="absolute top-0 left-0 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: `translateY(-${digit * 10}%)`,
        }}
      >
        {DIGITS.map((n) => (
          <span key={n} className="h-[1.1em] flex items-center justify-center font-mono">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RollingCounter({
  value,
  decimals = 1,
  className = '',
  digitClassName = '',
}: RollingCounterProps) {
  const safeVal = Math.max(0, isNaN(value) ? 0 : value);
  const formatted = safeVal.toFixed(decimals);

  return (
    <div className={`inline-flex items-baseline font-mono font-black tabular-nums ${className}`}>
      {formatted.split('').map((char, index) => {
        if (char === '.' || char === ',') {
          return (
            <span key={`sep-${index}`} className="opacity-70 px-[0.05em]">
              {char}
            </span>
          );
        }
        const digit = parseInt(char, 10);
        return (
          <SingleDigit
            key={`dig-${index}-${formatted.length}`}
            digit={isNaN(digit) ? 0 : digit}
            className={digitClassName}
          />
        );
      })}
    </div>
  );
}
