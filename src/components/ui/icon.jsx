import React from 'react';
import { cn } from '@/lib/utils';

const SIZE_MAP = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
};

const TONE_CLASSES = {
  muted: 'text-muted-foreground',
  primary: 'text-primary-500',
  success: 'text-mint-500',
  warning: 'text-sunrise-500',
  danger: 'text-coral-500',
  info: 'text-sky-500',
  contrast: 'text-foreground',
};

const VARIANT_TONE_MAP = {
  default: 'primary',
  soft: 'primary',
  solid: 'primary',
  neutral: 'muted',
  ghost: 'muted',
  outline: 'contrast',
};

export const Icon = ({
  icon: IconComponent,
  size = 'md',
  variant = 'default',
  tone,
  className,
  iconClassName,
  ...props
}) => {
  if (!IconComponent) return null;

  const resolvedTone = tone || VARIANT_TONE_MAP[variant] || 'primary';
  const toneClasses = TONE_CLASSES[resolvedTone] || TONE_CLASSES.muted;
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <IconComponent
      className={cn('shrink-0', sizeClasses, toneClasses, className, iconClassName)}
      aria-hidden="true"
      {...props}
    />
  );
};

Icon.displayName = 'Icon';

export default Icon;
