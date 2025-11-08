import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card Component - NEW DESIGN SYSTEM
 *
 * Cards con estilo minimalista:
 * - Gradiente de fondo sutil
 * - SIN sombras, SIN bordes duros
 * - Padding consistente (p-4, gap-4)
 * - Borde con color pastel para separación
 * - Hover sutil con lift effect
 */

const Card = React.forwardRef(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base - Sin sombras, con gradiente sutil
          'rounded-xl bg-card border border-border p-4',
          // Transición fluida
          'transition-all duration-200',
          // Interactive variant
          interactive && [
            'cursor-pointer',
            'hover:border-primary-300',
            'hover:-translate-y-0.5',
            'active:translate-y-0',
            'dark:hover:border-primary-500',
          ].join(' '),
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 mb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'text-xl font-semibold leading-tight tracking-tight text-foreground',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-4', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-4 mt-4', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
