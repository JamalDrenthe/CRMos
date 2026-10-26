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

/**
 * Razor-sharp Vector SVG Emblem for CRMos
 * Seamlessly scales from 16px favicon up to 4K billboard with zero quality loss.
 */
export function CRMosEmblem({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="crmos-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="75%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <radialGradient id="crmos-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#60a5fa" />
          <stop offset="80%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <linearGradient id="crmos-arc-grad" x1="15%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="crmos-chrome-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="43" fill="url(#crmos-core-glow)" opacity="0.35" />
      <circle cx="50" cy="50" r="44" stroke="url(#crmos-ring-grad)" strokeWidth="2.5" strokeDasharray="4 2 12 3 24 4" opacity="0.85" />
      <circle cx="50" cy="6" r="2.5" fill="#ffffff" />
      <circle cx="50" cy="50" r="47" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 18 1 24" strokeOpacity="0.2" />
      <path d="M 45 22 C 28 24 16 38 16 52 C 16 67 28 80 46 80 C 58 80 68 73 73 63" stroke="url(#crmos-ring-grad)" strokeWidth="6" strokeLinecap="round" />
      <path d="M 55 78 C 72 76 84 62 84 48 C 84 33 72 20 54 20 C 42 20 32 27 27 37" stroke="url(#crmos-arc-grad)" strokeWidth="5" strokeLinecap="round" strokeDasharray="95 15" />
      <polygon points="50,33 67,50 50,67 33,50" fill="#ffffff" fillOpacity="0.1" stroke="url(#crmos-chrome-grad)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="7.5" fill="url(#crmos-core-glow)" />
      <circle cx="50" cy="50" r="3.2" fill="#ffffff" />
    </svg>
  );
}

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
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className={cn(
          'relative shrink-0 transition-all duration-300 group-hover:scale-105',
          variant === 'badge' &&
            'rounded-2xl p-1 bg-[#09090b] shadow-lg shadow-black/20 border border-white/15',
          variant === 'badge' && animated && 'crmos-anim-badge',
          variant === 'monochrome' && 'grayscale'
        )}
      >
        <CRMosEmblem className="w-full h-full drop-shadow-md" />
      </div>

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
