
import React from 'react';
import { cn } from '@/lib/utils';

/**
 * IconBadge - Componente para iconos circulares con fondo neutral
 *
 * Diseñado para reducir el ruido visual usando fondos grises neutrales
 * en lugar de fondos azules saturados.
 *
 * @example
 * <IconBadge icon={UserIcon} />
 * <IconBadge icon={CalendarIcon} className="w-12 h-12" />
 * <IconBadge icon={DollarIcon} size="lg" />
 */
const IconBadge = React.forwardRef(({
  icon: Icon,
  className,
  size = 'md',
  ...props
}, ref) => {
  // Tamaños predefinidos
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  if (!Icon) {
    if (import.meta.env.DEV) {
      console.warn('IconBadge: No icon provided');
    }
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        // Fondo neutral gris en lugar de azul
        'bg-slate-100 dark:bg-slate-700/50',
        // Icono azul mantiene el color corporativo
        'text-blue-600 dark:text-blue-400',
        // Forma circular
        'rounded-full',
        // Centrado
        'flex items-center justify-center',
        // Evitar deformación
        'shrink-0',
        // Borde sutil
        'border border-slate-200 dark:border-slate-600/50',
        // Sombra suave
        'shadow-sm',
        // Tamaño por defecto o personalizado
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
    </div>
  );
});

IconBadge.displayName = 'IconBadge';

export { IconBadge };
