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
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className={cn(
          'relative shrink-0 transition-all duration-500 group-hover:scale-105',
          variant === 'badge' &&
            'rounded-2xl overflow-hidden shadow-lg shadow-black/10 dark:shadow-white/5 border border-white/20 dark:border-white/10',
          variant === 'badge' && animated && 'crmos-anim-badge',
          variant === 'monochrome' && 'grayscale'
        )}
      >
        <img
          src="/crmos-logo.png"
          alt="CRMos Logo"
          className={cn(
            'w-full h-full object-cover drop-shadow-md',
            variant === 'vector' && 'rounded-full'
          )}
        />
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
