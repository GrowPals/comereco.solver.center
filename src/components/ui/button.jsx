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
        // Default - CTA Primario con glow sutil en dark mode
        default: 'border border-primary-500/30 bg-gradient-primary text-white shadow-button hover:shadow-button-hover rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/8 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border-primary-400/40 dark:bg-[linear-gradient(135deg,rgba(79,140,255,0.95)_0%,rgba(45,99,235,0.92)_100%)] dark:shadow-button dark:hover:shadow-[0_4px_16px_rgba(1,6,18,0.65),0_0_16px_rgba(79,140,255,0.3)]',

        // Primary - CTA Destacado con glow sutil en dark mode
        primary: 'border border-primary-600/35 bg-gradient-primary-intense text-white shadow-button hover:shadow-button-hover rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/8 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border-primary-400/45 dark:bg-[linear-gradient(135deg,rgba(59,130,246,0.96)_0%,rgba(37,99,235,0.93)_100%)] dark:shadow-button dark:hover:shadow-[0_6px_18px_rgba(1,6,18,0.7),0_0_18px_rgba(59,130,246,0.32)]',

        // Accent - ComerECO Green (sin glow innecesario)
        accent: 'border border-emerald-500/30 bg-gradient-accent text-white shadow-button hover:shadow-button-hover rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/8 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border-emerald-400/35 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.92)_0%,rgba(5,150,105,0.88)_100%)] dark:shadow-button dark:hover:shadow-elevated',

        // Success - Sin glow, solo sombras
        success: 'border border-emerald-500/30 bg-gradient-success text-white shadow-button hover:shadow-button-hover rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/8 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border-emerald-400/35 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.9)_0%,rgba(5,150,105,0.86)_100%)] dark:shadow-button dark:hover:shadow-elevated',

        // Destructive - Sin glow excesivo
        destructive: 'border border-red-500/35 bg-gradient-error text-white shadow-button hover:shadow-button-hover rounded-xl before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/8 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity dark:border-red-400/35 dark:bg-[linear-gradient(135deg,rgba(239,68,68,0.92)_0%,rgba(220,38,38,0.88)_100%)] dark:shadow-button dark:hover:shadow-elevated',

        // Outline - Limpio sin efectos sci-fi
        outline: 'border-2 border-primary-500/70 bg-transparent text-primary-600 hover:bg-primary-50 hover:border-primary-600 rounded-xl transition-all dark:text-primary-100 dark:border-primary-400/50 dark:bg-card/40 dark:hover:bg-primary-900/20 dark:hover:border-primary-400/70 dark:hover:text-primary-50',

        // Secondary - Sutil y profesional
        secondary: 'bg-card border border-border text-foreground/85 shadow-sm hover:shadow-md hover:border-border/60 rounded-xl hover:bg-muted/50 dark:border-border dark:bg-card/80 dark:text-foreground dark:hover:bg-card dark:hover:border-border/40',

        // Ghost - Minimalista
        ghost: 'border border-transparent bg-transparent text-foreground/80 hover:bg-muted/50 hover:text-foreground rounded-xl active:bg-primary/10 dark:text-foreground/85 dark:hover:bg-card/50 dark:hover:text-foreground',

        // Link - Simple
        link: 'text-primary-600 underline-offset-4 hover:underline hover:text-primary-700 active:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 px-4 py-2 text-sm rounded-lg',
        lg: 'h-14 px-8 py-4 text-lg rounded-2xl',
        icon: 'h-11 w-11 rounded-xl',
        fab: 'h-14 w-14 rounded-full shadow-button hover:shadow-button-hover hover:scale-105 active:scale-100 dark:shadow-button dark:hover:shadow-[0_6px_18px_rgba(1,6,18,0.7),0_0_18px_rgba(79,140,255,0.3)]',
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
