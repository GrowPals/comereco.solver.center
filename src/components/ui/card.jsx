import React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ className, interactive = false, accentColor = 'primary', variant = 'default', ...props }, ref) => {
  // Sistema de variantes de sombras
  const shadowClasses = {
    default: 'shadow-soft-sm dark:border dark:border-slate-700',
    elevated: 'shadow-soft-md dark:shadow-dark-sm',
    interactive: 'shadow-soft-sm hover:shadow-soft-md dark:border dark:border-slate-700 transition-shadow duration-200 cursor-pointer',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card',
        // Sistema de sombras mejorado
        shadowClasses[variant] || shadowClasses.default,
        // Transiciones suaves
        'transition-all duration-300',
        // Accent bar top - mantener como indicador visual elegante
        'before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:scale-x-0 before:rounded-t-2xl before:transition-transform before:duration-300',
        accentColor === 'primary' && 'before:bg-gradient-primary',
        accentColor === 'accent' && 'before:bg-gradient-accent',
        accentColor === 'success' && 'before:bg-gradient-success',
        // Dark mode: limpio sin overlays innecesarios, con bordes visibles
        'dark:bg-card',
        // Interactive: shadow transitions sin translate (evita layout shift)
        interactive && 'cursor-pointer hover:border-neutral-300 hover:before:scale-x-100 hover:shadow-soft-md dark:hover:border-slate-600',
        className
      )}
      {...props}
    />
  );
});
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
    className={cn('font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  />
));
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
  <div ref={ref} className={cn('p-6 pt-0 text-foreground', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0 text-foreground', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
