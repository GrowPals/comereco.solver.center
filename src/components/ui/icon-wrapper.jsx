import React from 'react';
import { cn } from '@/lib/utils';
import { buildIconStyles } from './icon-presets';
import { IconToken } from './icon-token';

export function IconWrapper({
  icon: Icon,
  variant = 'soft',
  tone,
  size = 'md',
  glow = false,
  interactive = false,
  decorative = true,
  className,
  iconClassName,
  ...props
}) {
  if (!Icon) return null;

  const { ['aria-hidden']: ariaHiddenProp, ...rest } = props;
  const { wrapper, icon, tone: resolvedTone, variant: resolvedVariant } = buildIconStyles({
    size,
    tone,
    variant,
    glow,
  });

  const ariaHidden = decorative ? true : ariaHiddenProp;

  if (!wrapper) {
    return (
      <Icon
        className={cn(icon, iconClassName, className)}
        aria-hidden={ariaHidden}
        {...rest}
      />
    );
  }

  return (
    <span
      className={cn(
        wrapper,
        interactive && 'hover:-translate-y-0.5 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60 focus-visible:ring-offset-2',
        className,
      )}
      data-tone={resolvedTone}
      data-variant={resolvedVariant}
      {...rest}
    >
      <Icon className={cn(icon, iconClassName)} aria-hidden={ariaHidden} />
    </span>
  );
}

export function StatIcon({ icon: Icon, tone = 'brand', variant = 'glass', size = 'lg', className, ...props }) {
  return (
    <IconToken
      icon={Icon}
      tone={tone}
      variant={variant}
      size={size}
      glow
      className={cn('stat-icon shrink-0', className)}
      {...props}
    />
  );
}

export function SectionIcon({ icon: Icon, tone = 'brand', variant = 'soft', size = 'md', className, ...props }) {
  return (
    <IconToken
      icon={Icon}
      tone={tone}
      variant={variant}
      size={size}
      glow={variant !== 'outline'}
      className={cn('section-icon', className)}
      {...props}
    />
  );
}
