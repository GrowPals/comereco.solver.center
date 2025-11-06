import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden active:scale-[0.98] dark:ring-offset-background',
  {
    variants: {
      variant: {
        // Primary - Professional Blue
        default: 'border border-primary-500/40 bg-gradient-primary text-white shadow-button hover:shadow-glow-primary hover:-translate-y-0.5 active:translate-y-0 active:shadow-button rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border dark:border-[#2a4c88] dark:bg-[linear-gradient(135deg,rgba(46,120,255,0.92)_0%,rgba(25,70,210,0.88)_100%)] dark:shadow-[0_0_26px_rgba(64,150,255,0.45)] dark:hover:shadow-[0_0_42px_rgba(94,186,255,0.6)]',

        // Intense gradient for CTAs
        primary: 'border border-primary-600/45 bg-gradient-primary-intense text-white shadow-button hover:shadow-glow-primary hover:-translate-y-0.5 active:translate-y-0 active:shadow-button rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border dark:border-[#3260a8] dark:bg-[linear-gradient(135deg,rgba(50,132,255,0.95)_0%,rgba(28,88,220,0.9)_100%)] dark:shadow-[0_0_30px_rgba(70,160,255,0.5)] dark:hover:shadow-[0_0_46px_rgba(108,200,255,0.66)]',

        // Accent - ComerECO Green (for success/approve actions)
        accent: 'border border-emerald-400/40 bg-gradient-accent text-white shadow-accent hover:shadow-glow-accent hover:-translate-y-0.5 active:translate-y-0 rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border dark:border-emerald-200/35 dark:bg-[linear-gradient(135deg,rgba(0,201,118,0.85)_0%,rgba(0,150,82,0.78)_100%)] dark:shadow-[0_0_22px_rgba(0,200,119,0.32)] dark:hover:shadow-[0_0_34px_rgba(48,237,158,0.48)]',

        // Success with green gradient
        success: 'border border-emerald-400/40 bg-gradient-success text-white shadow-accent hover:shadow-glow-success hover:-translate-y-0.5 active:translate-y-0 rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border dark:border-emerald-200/35 dark:bg-[linear-gradient(135deg,rgba(0,210,112,0.82)_0%,rgba(0,170,88,0.76)_100%)] dark:shadow-[0_0_22px_rgba(0,210,120,0.32)] dark:hover:shadow-[0_0_34px_rgba(40,240,150,0.48)]',

        // Destructive with gradient
        destructive: 'border border-red-400/45 bg-gradient-error text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-glow-error hover:-translate-y-0.5 active:translate-y-0 rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border dark:border-red-300/30 dark:bg-[linear-gradient(135deg,rgba(239,68,68,0.85)_0%,rgba(200,40,40,0.78)_100%)] dark:shadow-[0_0_24px_rgba(255,100,100,0.34)] dark:hover:shadow-[0_0_36px_rgba(255,120,120,0.52)]',

        // Outline with border
        outline: 'border-2 border-primary-500 bg-transparent text-primary-600 hover:bg-gradient-primary hover:text-white hover:shadow-glow-primary hover:border-transparent rounded-xl transition-all dark:text-primary-100 dark:border-[rgba(124,188,255,0.55)] dark:bg-[rgba(12,28,52,0.45)] dark:hover:bg-[linear-gradient(135deg,rgba(52,130,255,0.42)_0%,rgba(32,96,230,0.38)_100%)] dark:hover:text-white dark:shadow-[0_0_16px_rgba(90,170,255,0.35)] dark:hover:shadow-[0_0_28px_rgba(120,210,255,0.45)]',

        // Secondary with subtle gradient
        secondary: 'bg-card border-2 border-border text-foreground/80 shadow-sm hover:shadow-md hover:border-border/80 hover:-translate-y-0.5 active:translate-y-0 rounded-xl hover:bg-muted/70 dark:border-[#21385f] dark:bg-[linear-gradient(135deg,rgba(12,26,48,0.85)_0%,rgba(10,20,38,0.78)_100%)] dark:text-primary-100 dark:shadow-[0_0_18px_rgba(40,80,160,0.28)] dark:hover:border-[#4a78c8] dark:hover:bg-[linear-gradient(135deg,rgba(18,38,70,0.95)_0%,rgba(14,30,54,0.9)_100%)] dark:hover:shadow-[0_0_28px_rgba(74,148,255,0.45)]',

        // Ghost
        ghost: 'border border-border/70 bg-[var(--surface-contrast)] text-foreground/80 shadow-sm hover:bg-[var(--surface-muted)] hover:text-foreground rounded-xl active:bg-primary/10 dark:border-[#213c68] dark:text-primary-100 dark:bg-[rgba(14,28,52,0.85)] dark:hover:bg-[rgba(24,46,86,0.85)] dark:active:bg-[rgba(34,72,130,0.75)] dark:hover:text-white',

        // Link
        link: 'text-primary-600 underline-offset-4 hover:underline hover:text-primary-700 active:text-primary-800',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 px-4 py-2 text-sm rounded-lg',
        lg: 'h-14 px-8 py-4 text-lg rounded-2xl',
        icon: 'h-11 w-11 rounded-xl',
        fab: 'h-14 w-14 rounded-full shadow-button hover:shadow-glow-primary hover:scale-110 active:scale-100',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, isLoading, isSuccess, children, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size, className }),
        isSuccess && 'bg-success hover:bg-success/90'
      )}
      ref={ref}
      disabled={isLoading || props.disabled}
      aria-disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Cargando...</span>
        </>
      )}
      {isSuccess && !isLoading && (
        <>
          <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Completado</span>
        </>
      )}
      {!isLoading && !isSuccess && children}
    </Comp>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
