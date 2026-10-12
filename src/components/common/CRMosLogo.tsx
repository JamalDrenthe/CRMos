import React from 'react';
import { cn } from '@/lib/utils';

export interface CRMosLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showText?: boolean;
  showTagline?: boolean;
  variant?: 'vector' | 'badge' | 'monochrome';
  animated?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  xs: { icon: 20, text: 'text-sm', tagline: 'text-[8px]' },
  sm: { icon: 28, text: 'text-base', tagline: 'text-[9px]' },
  md: { icon: 36, text: 'text-lg', tagline: 'text-[10px]' },
  lg: { icon: 44, text: 'text-xl', tagline: 'text-[11px]' },
  xl: { icon: 56, text: 'text-2xl', tagline: 'text-xs' },
  '2xl': { icon: 80, text: 'text-4xl', tagline: 'text-sm' },
};

export const CRMosLogo: React.FC<CRMosLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  variant = 'vector',
  animated = true,
  className,
  textClassName,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size]?.icon || 36;
  const sizeConfig = typeof size === 'string' ? sizeMap[size] : sizeMap.md;

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none group cursor-pointer', className)}>
      {variant === 'badge' ? (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className={cn(
            'relative rounded-2xl overflow-hidden shadow-lg shadow-black/10 dark:shadow-white/5 border border-white/20 dark:border-white/10 transition-all duration-500 group-hover:scale-105 shrink-0',
            animated && 'crmos-anim-badge'
          )}
        >
          <img
            src="/crmos-logo.jpg"
            alt="CRMos Logo"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          style={{ width: pixelSize, height: pixelSize }}
          className="relative flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-105"
        >
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md overflow-visible"
          >
            <defs>
              {/* Outer Ring Dynamic Gradient */}
              <linearGradient id="crmos-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="45%" stopColor="#6366f1" />
                <stop offset="75%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>

              {/* Core Luminous Pulse Gradient */}
              <radialGradient id="crmos-core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="35%" stopColor="#60a5fa" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
              </radialGradient>

              {/* Orbital Arch Gradient */}
              <linearGradient id="crmos-arc-grad" x1="15%" y1="15%" x2="85%" y2="85%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>

              {/* Titanium Highlight */}
              <linearGradient id="crmos-chrome-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0.3" />
              </linearGradient>

              {/* Outer Halo Filter */}
              <filter id="crmos-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Layer 1: Ambient Luminous Breathing Aura */}
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="url(#crmos-core-glow)"
              className={cn(animated && 'crmos-anim-glow')}
            />

            {/* Layer 2: Outer Precision Orbit Ring with Orbiting Satellite Node */}
            <g className={cn(animated && 'crmos-anim-orbit')}>
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="url(#crmos-ring-grad)"
                strokeWidth="2.5"
                strokeDasharray="4 2 12 3 24 4"
                opacity="0.85"
              />
              {/* Primary Orbiting Satellite Spark */}
              <circle
                cx="50"
                cy="6"
                r="2.5"
                fill="#ffffff"
                filter="url(#crmos-glow-filter)"
                className="transition-transform"
              />
            </g>

            {/* Layer 3: Counter-Orbiting Outer Hairline with Secondary Satellite */}
            <g className={cn(animated && 'crmos-anim-orbit-reverse')}>
              <circle
                cx="50"
                cy="50"
                r="47"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2 18 1 24"
                strokeOpacity="0.2"
              />
              {/* Secondary Counter-Orbiting Spark */}
              <circle
                cx="97"
                cy="50"
                r="1.8"
                fill="#a855f7"
                opacity="0.9"
              />
            </g>

            {/* Layer 4: Left Dynamic Interlocking Arch ("C" of CRM) */}
            <path
              d="M 45 22 C 28 24 16 38 16 52 C 16 67 28 80 46 80 C 58 80 68 73 73 63"
              stroke="url(#crmos-ring-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              className="transition-all duration-300 group-hover:opacity-100"
            />

            {/* Layer 5: Right Dynamic Infinity Nexus ("OS" Loop) */}
            <path
              d="M 55 78 C 72 76 84 62 84 48 C 84 33 72 20 54 20 C 42 20 32 27 27 37"
              stroke="url(#crmos-arc-grad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="95 15"
              className="transition-all duration-300 group-hover:opacity-100"
            />

            {/* Layer 6: Inner Precision Diamond Nexus */}
            <g className={cn(animated && 'crmos-anim-diamond')}>
              <polygon
                points="50,33 67,50 50,67 33,50"
                fill="currentColor"
                fillOpacity="0.08"
                stroke="url(#crmos-chrome-grad)"
                strokeWidth="1.5"
                className="transition-all duration-300 group-hover:fill-opacity-15"
              />
            </g>

            {/* Layer 7: Radiant Center Core Nexus Node */}
            <g className={cn(animated && 'crmos-anim-core')}>
              <circle cx="50" cy="50" r="7.5" fill="url(#crmos-core-glow)" />
              <circle cx="50" cy="50" r="3.2" fill="#ffffff" />
            </g>
          </svg>
        </div>
      )}

      {showText && (
        <div className={cn('flex flex-col justify-center leading-none', textClassName)}>
          <div className="flex items-baseline gap-0.5 tracking-tight">
            <span
              className={cn(
                'font-extrabold tracking-[-0.03em] text-foreground transition-all duration-300 group-hover:text-primary',
                sizeConfig.text
              )}
            >
              CRM
            </span>
            <span
              className={cn(
                'font-semibold tracking-[-0.01em] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent transition-all duration-300 group-hover:brightness-125',
                sizeConfig.text
              )}
            >
              os
            </span>
            <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
          </div>

          {showTagline && (
            <span
              className={cn(
                'mt-0.5 font-medium tracking-[0.22em] uppercase text-muted-foreground/80 transition-colors group-hover:text-foreground/80',
                sizeConfig.tagline
              )}
            >
              Operating System
            </span>
          )}
        </div>
      )}
    </div>
  );
};
