import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card Component - Modern Pastel Design System
 *
 * Tarjetas limpias sin sombras, con fondos sutiles
 * Usa color y contraste en lugar de efectos 3D
 */

const Card = React.forwardRef(
  ({ className, interactive = false, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'relative overflow-hidden rounded-xl',
          'bg-card/50 backdrop-blur-sm',
          'border border-border',
          // Transitions suaves
          'transition-all duration-200 ease-out',
          // Interactive variant
          interactive && [
            'cursor-pointer',
            'hover:border-blue-300 dark:hover:border-blue-500',
            'hover:bg-card/80',
            'hover:scale-[1.01]',
            'active:scale-[0.99]',
          ].join(' '),
          // Variant-specific background
          variant === 'elevated' && 'bg-card',
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
    className={cn('flex flex-col space-y-1.5 p-6 text-foreground', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, as: Component = 'h3', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-tight tracking-tight text-foreground',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6 pt-0 text-foreground', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-4 p-6 pt-0 text-foreground', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
