import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './icon';

/**
 * IconWrapper - Wrapper de retrocompatibilidad que usa el nuevo sistema Icon
 *
 * @deprecated Usar <Icon> directamente
 */
export function IconWrapper({ icon, variant = 'default', size = 'md', className, iconClassName, ...props }) {
  // Mapear variantes antiguas al nuevo sistema
  const variantMap = {
    soft: 'soft',
    solid: 'solid',
    simple: 'default',
    ghost: 'default',
    outline: 'soft',
    glass: 'soft',
    neutral: 'default',
  };

  const newVariant = variantMap[variant] || 'default';

  return (
    <Icon
      icon={icon}
      size={size}
      variant={newVariant}
      className={className}
      iconClassName={iconClassName}
      {...props}
    />
  );
}

const STAT_ICON_SIZES = {
  sm: {
    wrapper: 'h-10 w-10 rounded-2xl',
    icon: 'h-5 w-5',
  },
  md: {
    wrapper: 'h-12 w-12 rounded-3xl',
    icon: 'h-6 w-6',
  },
  lg: {
    wrapper: 'h-14 w-14 rounded-[1.85rem]',
    icon: 'h-7 w-7',
  },
};

const STAT_ICON_TONES = {
  primary: {
    gradient: 'from-emerald-200/80 via-emerald-400/40 to-emerald-600/20',
    border: 'border-emerald-100/80 dark:border-emerald-500/40',
    icon: 'text-emerald-600 dark:text-emerald-100',
  },
  sky: {
    gradient: 'from-sky-200/80 via-sky-400/40 to-sky-600/20',
    border: 'border-sky-100/80 dark:border-sky-500/40',
    icon: 'text-sky-600 dark:text-sky-100',
  },
  violet: {
    gradient: 'from-violet-200/80 via-violet-400/40 to-violet-600/20',
    border: 'border-violet-100/80 dark:border-violet-500/40',
    icon: 'text-violet-600 dark:text-violet-100',
  },
  amber: {
    gradient: 'from-amber-200/80 via-amber-400/40 to-amber-600/20',
    border: 'border-amber-100/80 dark:border-amber-500/40',
    icon: 'text-amber-600 dark:text-amber-100',
  },
  rose: {
    gradient: 'from-rose-200/80 via-rose-400/40 to-rose-600/20',
    border: 'border-rose-100/80 dark:border-rose-400/40',
    icon: 'text-rose-600 dark:text-rose-100',
  },
  slate: {
    gradient: 'from-slate-200/80 via-slate-400/40 to-slate-600/20',
    border: 'border-slate-200/80 dark:border-slate-500/40',
    icon: 'text-slate-600 dark:text-slate-100',
  },
};

export function StatIcon({
  icon: IconComponent,
  size = 'lg',
  tone = 'primary',
  glow = true,
  className,
  iconClassName,
  ...props
}) {
  if (!IconComponent) return null;

  const sizeConfig = STAT_ICON_SIZES[size] || STAT_ICON_SIZES.md;
  const toneConfig = STAT_ICON_TONES[tone] || STAT_ICON_TONES.primary;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-2xl border bg-white/90 text-base',
        'shadow-[0_10px_30px_rgba(15,23,42,0.12)] transition-all duration-300 dark:bg-slate-950/70 dark:shadow-[0_18px_38px_rgba(0,0,0,0.65)]',
        'backdrop-blur-lg ring-1 ring-white/70 dark:ring-white/10',
        sizeConfig.wrapper,
        toneConfig.border,
        className
      )}
      {...props}
    >
      {glow && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-gradient-to-br opacity-80 blur-md',
            toneConfig.gradient
          )}
        />
      )}
      <IconComponent
        className={cn(
          'drop-shadow-sm transition-transform duration-300 group-hover:scale-105',
          sizeConfig.icon,
          toneConfig.icon,
          iconClassName
        )}
        aria-hidden="true"
      />
    </span>
  );
}

const SECTION_ICON_SIZES = {
  sm: {
    outer: 'h-11 w-11 rounded-2xl',
    inner: 'h-9 w-9 rounded-xl',
    icon: 'h-5 w-5',
  },
  md: {
    outer: 'h-12 w-12 rounded-3xl',
    inner: 'h-10 w-10 rounded-2xl',
    icon: 'h-6 w-6',
  },
  lg: {
    outer: 'h-14 w-14 rounded-[1.75rem]',
    inner: 'h-12 w-12 rounded-2xl',
    icon: 'h-7 w-7',
  },
};

const SECTION_ICON_TONES = {
  primary: {
    gradient: 'from-emerald-400/30 via-emerald-500/10 to-emerald-600/5',
    ring: 'ring-emerald-500/30 dark:ring-emerald-400/30',
    glow: 'bg-emerald-400/30',
    inner: 'border-emerald-50/80 dark:border-emerald-300/15',
    icon: 'text-emerald-700 dark:text-emerald-100',
    badge: 'bg-emerald-400/80',
  },
  sky: {
    gradient: 'from-sky-400/30 via-sky-500/10 to-sky-600/5',
    ring: 'ring-sky-500/30 dark:ring-sky-400/30',
    glow: 'bg-sky-400/30',
    inner: 'border-sky-50/80 dark:border-sky-300/20',
    icon: 'text-sky-600 dark:text-sky-100',
    badge: 'bg-sky-400/80',
  },
  amber: {
    gradient: 'from-amber-400/30 via-amber-500/10 to-amber-600/5',
    ring: 'ring-amber-500/30 dark:ring-amber-400/30',
    glow: 'bg-amber-400/30',
    inner: 'border-amber-50/80 dark:border-amber-300/20',
    icon: 'text-amber-600 dark:text-amber-100',
    badge: 'bg-amber-400/80',
  },
  violet: {
    gradient: 'from-violet-400/30 via-violet-500/10 to-violet-600/5',
    ring: 'ring-violet-500/30 dark:ring-violet-400/30',
    glow: 'bg-violet-400/30',
    inner: 'border-violet-50/80 dark:border-violet-300/20',
    icon: 'text-violet-600 dark:text-violet-100',
    badge: 'bg-violet-400/80',
  },
  slate: {
    gradient: 'from-slate-500/20 via-slate-500/5 to-slate-700/10',
    ring: 'ring-slate-500/30 dark:ring-slate-400/40',
    glow: 'bg-slate-400/30',
    inner: 'border-slate-100/80 dark:border-slate-400/20',
    icon: 'text-slate-600 dark:text-slate-100',
    badge: 'bg-slate-400/80',
  },
};

export function SectionIcon({
  icon: IconComponent,
  size = 'md',
  tone = 'primary',
  showBadge = true,
  className,
  iconClassName,
  ...props
}) {
  if (!IconComponent) return null;

  const sizeConfig = SECTION_ICON_SIZES[size] || SECTION_ICON_SIZES.md;
  const toneConfig = SECTION_ICON_TONES[tone] || SECTION_ICON_TONES.primary;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br p-[2px]',
        'ring-1 ring-inset shadow-lg shadow-black/5 transition-all duration-300 dark:shadow-black/40',
        'before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:blur-xl before:transition-opacity before:duration-300 before:content-[""]',
        'hover:-translate-y-0.5 hover:shadow-xl hover:before:opacity-70 motion-reduce:transform-none dark:hover:shadow-2xl',
        sizeConfig.outer,
        toneConfig.gradient,
        toneConfig.ring,
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 scale-125 rounded-[inherit] opacity-60 blur-2xl transition-opacity duration-300',
          toneConfig.glow
        )}
      />
      {showBadge && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border border-white/70 shadow-sm backdrop-blur-sm dark:border-white/30',
            toneConfig.badge
          )}
        />
      )}
      <span
        className={cn(
          'relative z-10 inline-flex items-center justify-center rounded-2xl border bg-white/90 text-base',
          'backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60',
          sizeConfig.inner,
          toneConfig.inner
        )}
      >
        <IconComponent
          className={cn(
            'drop-shadow-sm transition-transform duration-300',
            sizeConfig.icon,
            toneConfig.icon,
            iconClassName
          )}
          aria-hidden="true"
        />
      </span>
    </span>
  );
}
