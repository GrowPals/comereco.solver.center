/**
 * @deprecated This file is deprecated. Use Icon component from './icon.jsx' instead.
 *
 * This file contains the old complex icon system with gradients, glows, and multiple tones.
 * The new unified icon system is simpler and uses semantic Tailwind classes that adapt to dark mode.
 *
 * Migration guide:
 * - Use <Icon icon={YourIcon} variant="default" /> instead of IconToken with simple variant
 * - Use <Icon icon={YourIcon} variant="soft" /> instead of IconToken with soft/neutral variants
 * - Use <Icon icon={YourIcon} variant="solid" /> instead of IconToken with solid variant
 */

import { cn } from '@/lib/utils';

export const ICON_SIZE_MAP = {
  xs: {
    wrapper: 'h-8 w-8 p-1.5 rounded-[1.35rem]',
    icon: 'h-4 w-4',
  },
  sm: {
    wrapper: 'h-10 w-10 p-2 rounded-[1.6rem]',
    icon: 'h-5 w-5',
  },
  md: {
    wrapper: 'h-12 w-12 p-2.5 rounded-[1.75rem]',
    icon: 'h-6 w-6',
  },
  lg: {
    wrapper: 'h-14 w-14 p-3 rounded-[2rem]',
    icon: 'h-7 w-7',
  },
  xl: {
    wrapper: 'h-16 w-16 p-4 rounded-[2.25rem]',
    icon: 'h-8 w-8',
  },
  '2xl': {
    wrapper: 'h-20 w-20 p-5 rounded-[2.75rem]',
    icon: 'h-10 w-10',
  },
};

const VARIANT_ALIASES = {
  subtle: 'soft',
  neutral: 'soft',
  soft: 'soft',
  default: 'soft',
  frosted: 'glass',
  translucent: 'glass',
  glassy: 'glass',
  glass: 'glass',
  solid: 'solid',
  prominent: 'solid',
  outline: 'outline',
  badge: 'outline',
  ghost: 'ghost',
  minimal: 'ghost',
  simple: 'simple',
};

const LEGACY_VARIANT_TONE = {
  neutral: 'neutral',
  warning: 'warning',
  danger: 'danger',
  success: 'success',
  info: 'info',
};

const TONE_TOKENS = {
  brand: {
    text: 'text-primary-600 dark:text-primary-100',
    softBg: 'bg-gradient-to-br from-primary-50 via-white to-emerald-50 dark:from-primary-500/20 dark:via-primary-500/10 dark:to-emerald-500/20',
    solidBg: 'bg-gradient-to-br from-primary-500 via-primary-500 to-emerald-500 dark:from-primary-400 dark:via-primary-400 dark:to-emerald-400',
    solidText: 'text-white',
    ring: 'ring-primary-100 dark:ring-primary-500/35',
    glassBorder: 'border border-primary-100/80 dark:border-primary-400/35',
    glow: 'shadow-[0_22px_45px_rgba(59,130,246,0.22)] dark:shadow-[0_32px_60px_rgba(6,20,46,0.65)]',
  },
  neutral: {
    text: 'text-slate-600 dark:text-slate-200',
    softBg: 'bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900/65 dark:via-slate-900/50 dark:to-slate-800/60',
    solidBg: 'bg-slate-900 dark:bg-slate-100/10',
    solidText: 'text-white dark:text-slate-100',
    ring: 'ring-slate-200/80 dark:ring-slate-700/70',
    glassBorder: 'border border-white/70 dark:border-white/10',
    glow: 'shadow-[0_18px_38px_rgba(15,23,42,0.16)] dark:shadow-[0_28px_55px_rgba(2,6,23,0.6)]',
  },
  info: {
    text: 'text-sky-600 dark:text-sky-200',
    softBg: 'bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-sky-500/15 dark:via-blue-500/5 dark:to-blue-500/15',
    solidBg: 'bg-gradient-to-br from-sky-500 via-blue-500 to-blue-600',
    solidText: 'text-white',
    ring: 'ring-sky-100 dark:ring-sky-500/40',
    glassBorder: 'border border-sky-100/70 dark:border-sky-400/30',
    glow: 'shadow-[0_22px_50px_rgba(14,165,233,0.28)] dark:shadow-[0_32px_60px_rgba(2,24,53,0.65)]',
  },
  success: {
    text: 'text-emerald-600 dark:text-emerald-200',
    softBg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-500/15 dark:via-emerald-500/5 dark:to-teal-500/15',
    solidBg: 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-green-500',
    solidText: 'text-white',
    ring: 'ring-emerald-100 dark:ring-emerald-500/40',
    glassBorder: 'border border-emerald-100/70 dark:border-emerald-400/30',
    glow: 'shadow-[0_22px_50px_rgba(16,185,129,0.25)] dark:shadow-[0_30px_60px_rgba(2,33,28,0.6)]',
  },
  warning: {
    text: 'text-amber-600 dark:text-amber-200',
    softBg: 'bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-500/15 dark:via-amber-500/5 dark:to-orange-500/15',
    solidBg: 'bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500',
    solidText: 'text-white',
    ring: 'ring-amber-100 dark:ring-amber-500/45',
    glassBorder: 'border border-amber-100/70 dark:border-amber-400/30',
    glow: 'shadow-[0_22px_50px_rgba(245,158,11,0.28)] dark:shadow-[0_30px_60px_rgba(63,29,5,0.65)]',
  },
  danger: {
    text: 'text-rose-600 dark:text-rose-200',
    softBg: 'bg-gradient-to-br from-rose-50 via-white to-red-50 dark:from-rose-500/15 dark:via-rose-500/5 dark:to-red-500/18',
    solidBg: 'bg-gradient-to-br from-rose-500 via-rose-500 to-red-500',
    solidText: 'text-white',
    ring: 'ring-rose-100 dark:ring-rose-500/45',
    glassBorder: 'border border-rose-100/70 dark:border-rose-400/30',
    glow: 'shadow-[0_22px_50px_rgba(244,63,94,0.25)] dark:shadow-[0_32px_60px_rgba(60,8,20,0.65)]',
  },
};

const VARIANT_BUILDERS = {
  simple: (tone) => ({
    wrapper: '',
    icon: tone.text,
  }),
  soft: (tone) => ({
    wrapper: cn('ring-1 shadow-soft-sm', tone.softBg, tone.ring),
    icon: tone.text,
  }),
  solid: (tone) => ({
    wrapper: cn('shadow-[0_22px_45px_rgba(15,23,42,0.22)] text-white', tone.solidBg, tone.solidRing ?? ''),
    icon: tone.solidText ?? 'text-white',
  }),
  outline: (tone) => ({
    wrapper: cn('bg-transparent ring-1 shadow-none', tone.ring),
    icon: tone.text,
  }),
  glass: (tone) => ({
    wrapper: cn('bg-white/85 dark:bg-white/10 backdrop-blur-xl shadow-[0_24px_55px_rgba(15,23,42,0.18)]', tone.glassBorder ?? ''),
    icon: tone.text,
  }),
  ghost: (tone) => ({
    wrapper: 'bg-transparent shadow-none',
    icon: cn(tone.text, 'opacity-90'),
  }),
};

export const ICON_TONES = Object.keys(TONE_TOKENS);

export function resolveVariant(variant) {
  return VARIANT_ALIASES[variant] ?? variant ?? 'soft';
}

export function resolveTone(tone, requestedVariant) {
  if (tone && TONE_TOKENS[tone]) {
    return tone;
  }
  if (requestedVariant && LEGACY_VARIANT_TONE[requestedVariant]) {
    return LEGACY_VARIANT_TONE[requestedVariant];
  }
  return 'brand';
}

export function buildIconStyles({
  size = 'md',
  tone,
  variant = 'soft',
  glow = false,
  forceWrapper = false,
}) {
  const rawVariant = variant;
  const resolvedVariant = resolveVariant(variant);
  const resolvedToneKey = resolveTone(tone, rawVariant);
  const toneTokens = TONE_TOKENS[resolvedToneKey] ?? TONE_TOKENS.brand;
  const sizeConfig = ICON_SIZE_MAP[size] ?? ICON_SIZE_MAP.md;
  const variantBuilder = VARIANT_BUILDERS[resolvedVariant] ?? VARIANT_BUILDERS.soft;
  const variantClasses = variantBuilder(toneTokens);

  const shouldWrap = forceWrapper || resolvedVariant !== 'simple';

  const wrapperClasses = shouldWrap
    ? cn(
        'icon-shell inline-flex items-center justify-center ring-offset-2 ring-offset-background dark:ring-offset-slate-950 transition-all duration-300',
        sizeConfig.wrapper,
        variantClasses.wrapper,
        glow && toneTokens.glow,
      )
    : '';

  const iconClasses = cn(
    'icon-glyph transition-transform duration-200',
    sizeConfig.icon,
    variantClasses.icon,
  );

  return {
    tone: resolvedToneKey,
    variant: resolvedVariant,
    wrapper: wrapperClasses,
    icon: iconClasses,
  };
}

export function availableIconVariants() {
  return Object.keys(VARIANT_BUILDERS);
}

