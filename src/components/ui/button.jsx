import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden active:scale-[0.98]',
  {
    variants: {
      variant: {
        // Primary with gradient and glow effect
        default: 'bg-gradient-primary text-white shadow-button hover:shadow-glow-primary hover:-translate-y-0.5 active:translate-y-0 active:shadow-button rounded-lg before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',

        // Intense gradient for CTAs
        primary: 'bg-gradient-primary-intense text-white shadow-button hover:shadow-glow-primary hover:-translate-y-0.5 active:translate-y-0 active:shadow-button rounded-lg before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',

        // Destructive with gradient
        destructive: 'bg-gradient-error text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-glow-error hover:-translate-y-0.5 active:translate-y-0 rounded-lg before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',

        // Success with gradient
        success: 'bg-gradient-success text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-glow-success hover:-translate-y-0.5 active:translate-y-0 rounded-lg before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',

        // Outline with border
        outline: 'border-2 border-primary-500 bg-transparent text-primary-600 hover:bg-gradient-primary hover:text-white hover:shadow-glow-primary hover:border-transparent rounded-lg transition-all',

        // Secondary with subtle gradient
        secondary: 'bg-gradient-surface text-neutral-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 rounded-lg',

        // Ghost
        ghost: 'hover:bg-neutral-100 hover:text-neutral-900 rounded-lg active:bg-neutral-200',

        // Link
        link: 'text-primary-600 underline-offset-4 hover:underline hover:text-primary-700 active:text-primary-800',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 px-4 py-2 text-sm rounded-md',
        lg: 'h-14 px-8 py-4 text-lg rounded-xl',
        icon: 'h-11 w-11 rounded-lg',
        fab: 'h-14 w-14 rounded-full shadow-button hover:shadow-glow-primary hover:scale-110 active:scale-100',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={isLoading || props.disabled}
      aria-disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Comp>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
