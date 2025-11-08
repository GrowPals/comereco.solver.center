import React from 'react';
import { cn } from '@/lib/utils';
import { Icon as BaseIcon } from './icon';

const VARIANT_TONE = {
  default: 'primary',
  soft: 'primary',
  solid: 'primary',
  simple: 'muted',
  ghost: 'muted',
  neutral: 'muted',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
};

export function IconWrapper({ icon, variant = 'default', tone, size = 'md', className, iconClassName, ...props }) {
  const resolvedTone = tone || VARIANT_TONE[variant] || 'primary';
  return (
    <BaseIcon
      icon={icon}
      size={size}
      tone={resolvedTone}
      className={className}
      iconClassName={iconClassName}
      {...props}
    />
  );
}

const STAT_ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const STAT_ICON_TONES = {
  primary: 'text-primary-500',
  sky: 'text-sky-500',
  mint: 'text-mint-500',
  amber: 'text-sunrise-500',
  rose: 'text-coral-500',
  slate: 'text-muted-foreground',
};

const STAT_ICON_GLOWS = {
  primary: 'shadow-glow-primary',
  sky: 'shadow-glow-primary',
  mint: 'shadow-glow-success',
  amber: 'shadow-glow-warning',
  rose: 'shadow-glow-error',
  slate: '',
};

export function StatIcon({ icon: IconComponent, size = 'lg', tone = 'primary', className, glow = true, ...props }) {
  if (!IconComponent) return null;
  return (
    <IconComponent
      className={cn(
        STAT_ICON_SIZES[size] || STAT_ICON_SIZES.md,
        STAT_ICON_TONES[tone] || STAT_ICON_TONES.primary,
        glow ? STAT_ICON_GLOWS[tone] : null,
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

const SECTION_ICON_SIZES = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const SECTION_TONES = {
  primary: 'text-primary-500',
  sky: 'text-sky-500',
  mint: 'text-mint-500',
  amber: 'text-sunrise-500',
  violet: 'text-primary-400',
  slate: 'text-muted-foreground',
};

export function SectionIcon({ icon: IconComponent, size = 'md', tone = 'primary', className, ...props }) {
  if (!IconComponent) return null;
  return (
    <IconComponent
      className={cn(SECTION_ICON_SIZES[size] || SECTION_ICON_SIZES.md, SECTION_TONES[tone] || SECTION_TONES.primary, className)}
      aria-hidden="true"
      {...props}
    />
  );
}
