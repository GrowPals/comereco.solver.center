import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
  {
    variants: {
      variant: {
        // Primary - Gradiente Azul Pastel
        primary: 'bg-gradient-to-r from-primary-200 to-primary-300 text-primary-foreground hover:from-primary-300 hover:to-primary-400 dark:from-primary-500 dark:to-primary-600 dark:hover:from-primary-400 dark:hover:to-primary-500',

        // Secondary - Gradiente Púrpura Pastel
        secondary: 'bg-gradient-to-r from-secondary-200 to-secondary-300 text-secondary-foreground hover:from-secondary-300 hover:to-secondary-400 dark:from-secondary-500 dark:to-secondary-600 dark:hover:from-secondary-400 dark:hover:to-secondary-500',

        // Accent - Gradiente Rosa Pastel
        accent: 'bg-gradient-to-r from-accent-200 to-accent-300 text-accent-foreground hover:from-accent-300 hover:to-accent-400 dark:from-accent-500 dark:to-accent-600 dark:hover:from-accent-400 dark:hover:to-accent-500',

        // Success - Gradiente Verde Menta Pastel
        success: 'bg-gradient-to-r from-success-200 to-success-300 text-success-foreground hover:from-success-300 hover:to-success-400 dark:from-success-500 dark:to-success-600 dark:hover:from-success-400 dark:hover:to-success-500',

        // Danger - Gradiente Coral Pastel
        danger: 'bg-gradient-to-r from-error-200 to-error-300 text-error-foreground hover:from-error-300 hover:to-error-400 dark:from-error-500 dark:to-error-600 dark:hover:from-error-400 dark:hover:to-error-500',

        // Warning - Gradiente Amarillo Pastel
        warning: 'bg-gradient-to-r from-warning-200 to-warning-300 text-warning-foreground hover:from-warning-300 hover:to-warning-400 dark:from-warning-500 dark:to-warning-600 dark:hover:from-warning-400 dark:hover:to-warning-500',

        // Ghost - Sin fondo, solo texto
        ghost: 'bg-transparent text-foreground hover:bg-muted/20 dark:hover:bg-muted/10',

        // Outline - Solo borde pastel
        outline: 'border-2 border-primary-300 bg-transparent text-primary-600 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-500/10',

        // Link - Estilo de enlace
        link: 'text-primary-600 underline-offset-4 hover:underline dark:text-primary-400',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-lg',
        md: 'h-11 px-6 text-base rounded-xl',
        lg: 'h-14 px-8 text-lg rounded-xl',
        icon: 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Button = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  isLoading,
  isSuccess,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={isLoading || props.disabled}
      aria-disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Cargando...</span>
        </>
      )}
      {isSuccess && !isLoading && (
        <>
          <CheckCircle className="h-4 w-4" aria-hidden="true" />
        </>
      )}
      {!isLoading && children}
    </Comp>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
