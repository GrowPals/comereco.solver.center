import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Sistema unificado de iconos - Simple, consistente y funcional
 *
 * Variantes:
 * - default: Icono simple sin fondo
 * - soft: Fondo suave y circular
 * - solid: Fondo sólido con alto contraste
 *
 * Tamaños:
 * - sm: 32px (icono 16px)
 * - md: 40px (icono 20px)
 * - lg: 48px (icono 24px)
 * - xl: 56px (icono 28px)
 */

const SIZES = {
  sm: {
    wrapper: 'h-8 w-8',
    icon: 'h-4 w-4',
  },
  md: {
    wrapper: 'h-10 w-10',
    icon: 'h-5 w-5',
  },
  lg: {
    wrapper: 'h-12 w-12',
    icon: 'h-6 w-6',
  },
  xl: {
    wrapper: 'h-14 w-14',
    icon: 'h-7 w-7',
  },
};

const VARIANTS = {
  default: {
    wrapper: '',
    icon: 'text-muted-foreground',
  },
  soft: {
    wrapper: 'bg-muted/80 border border-border/70 shadow-sm dark:bg-white/5 dark:border-white/10',
    icon: 'text-foreground',
  },
  solid: {
    wrapper: 'bg-primary/90 border border-primary/60 shadow-md dark:bg-primary/80',
    icon: 'text-primary-foreground',
  },
};

export const Icon = ({
  icon: IconComponent,
  size = 'md',
  variant = 'default',
  className,
  iconClassName,
  ...props
}) => {
  if (!IconComponent) return null;

  const sizeConfig = SIZES[size] || SIZES.md;
  const variantConfig = VARIANTS[variant] || VARIANTS.default;

  // Si es variant default, solo renderizar el icono
  if (variant === 'default') {
    return (
      <IconComponent
        className={cn('shrink-0', sizeConfig.icon, variantConfig.icon, iconClassName, className)}
        aria-hidden="true"
        {...props}
      />
    );
  }

  // Para soft y solid, renderizar con wrapper
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full shrink-0 transition-all duration-200',
        sizeConfig.wrapper,
        variantConfig.wrapper,
        className
      )}
      {...props}
    >
      <IconComponent
        className={cn(sizeConfig.icon, variantConfig.icon, iconClassName)}
        aria-hidden="true"
      />
    </div>
  );
};

Icon.displayName = 'Icon';

export default Icon;
