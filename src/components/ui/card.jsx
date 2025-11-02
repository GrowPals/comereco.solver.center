
import React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ className, interactive = false, accentColor = 'primary', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 relative overflow-hidden',
      'before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:scale-x-0 before:transition-transform before:duration-300',
      accentColor === 'primary' && 'before:bg-gradient-primary',
      accentColor === 'accent' && 'before:bg-gradient-accent',
      accentColor === 'success' && 'before:bg-gradient-success',
      'after:absolute after:inset-0 after:bg-gradient-to-br after:from-slate-50/0 after:via-slate-50/0 after:to-slate-50/30 after:opacity-0 after:transition-opacity after:duration-300 after:pointer-events-none',
      interactive && 'hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 hover:before:scale-x-100 hover:after:opacity-100 cursor-pointer',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, as: Component = 'h3', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight text-[#0A0D14]', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[#7E8899]', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
