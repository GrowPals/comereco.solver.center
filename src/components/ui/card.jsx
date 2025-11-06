import React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ className, interactive = false, accentColor = 'primary', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300',
      'before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:scale-x-0 before:rounded-t-2xl before:transition-transform before:duration-300',
      accentColor === 'primary' && 'before:bg-gradient-primary',
      accentColor === 'accent' && 'before:bg-gradient-accent',
      accentColor === 'success' && 'before:bg-gradient-success',
      'after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/0 after:via-white/0 after:to-white/30 after:opacity-0 after:transition-opacity after:duration-300',
      'dark:border-[rgba(120,190,255,0.18)] dark:bg-[linear-gradient(165deg,rgba(14,31,58,0.96)_0%,rgba(9,21,44,0.96)_100%)] dark:shadow-[0_32px_70px_rgba(5,12,28,0.58)] dark:after:bg-[radial-gradient(circle_at_22%_18%,rgba(88,158,255,0.16),transparent_65%)] dark:after:opacity-20 dark:hover:after:opacity-35',
      interactive && 'cursor-pointer hover:-translate-y-1 hover:border-neutral-300 hover:before:scale-x-100 hover:after:opacity-100 hover:shadow-lg dark:hover:border-[rgba(150,210,255,0.35)] dark:hover:shadow-[0_36px_90px_rgba(7,16,36,0.72)]',
      className
    )}
    {...props}
  />
));
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
