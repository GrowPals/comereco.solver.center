import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Sistema unificado de iconos - Simple, consistente y funcional
 *
 * Variantes:
 * - default: Icono simple sin fondo
 * - soft: Fondo suave con bordes redondeados
 * - solid: Fondo sólido con texto blanco
 *
 * Tamaños:
 * - sm: 32px (icono 16px)
 * - md: 40px (icono 20px)
 * - lg: 48px (icono 24px)
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
};

const VARIANTS = {
  default: {
    wrapper: '',
    icon: 'text-muted-foreground',
  },
  soft: {
    wrapper: 'bg-muted border border-border',
    icon: 'text-foreground',
  },
  solid: {
    wrapper: 'bg-primary border border-primary',
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
        className={cn(sizeConfig.icon, variantConfig.icon, iconClassName, className)}
        aria-hidden="true"
        {...props}
      />
    );
  }

  // Para soft y solid, renderizar con wrapper
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-xl shrink-0',
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
