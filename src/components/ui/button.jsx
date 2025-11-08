import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle } from 'lucide-react';

/**
 * Button Component - NEW DESIGN SYSTEM
 *
 * Sistema de botones moderno y minimalista con:
 * - Gradientes pastel funcionales (no colores sólidos)
 * - SIN sombras, SIN bordes duros
 * - Diferenciación por color y contraste
 * - Animaciones sutiles y fluidas
 * - Excelente soporte dark/light mode
 */

const buttonVariants = cva(
  // Base classes - Sin sombras, animaciones fluidas
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed rounded-xl active:scale-[0.97]',
  {
    variants: {
      variant: {
        // Primary - Gradiente azul cielo pastel
        primary: [
          'bg-gradient-to-br from-info-400 to-info-500',
          'text-white',
          'hover:from-info-500 hover:to-info-600',
          'dark:from-info-500 dark:to-info-600',
          'dark:hover:from-info-400 dark:hover:to-info-500',
        ].join(' '),

        // Secondary - Fondo muted con gradiente sutil
        secondary: [
          'bg-gradient-to-br from-neutral-100 to-neutral-200',
          'text-neutral-900',
          'hover:from-neutral-200 hover:to-neutral-300',
          'dark:from-neutral-200 dark:to-neutral-300',
          'dark:text-neutral-900',
          'dark:hover:from-neutral-300 dark:hover:to-neutral-400',
        ].join(' '),

        // Ghost - Transparente, hover con fondo sutil
        ghost: [
          'bg-transparent',
          'text-foreground',
          'hover:bg-muted',
          'dark:hover:bg-neutral-200',
        ].join(' '),

        // Success - Verde menta pastel
        success: [
          'bg-gradient-to-br from-success-400 to-success-500',
          'text-white',
          'hover:from-success-500 hover:to-success-600',
          'dark:from-success-500 dark:to-success-600',
          'dark:hover:from-success-400 dark:hover:to-success-500',
        ].join(' '),

        // Danger/Error - Rojo coral pastel
        danger: [
          'bg-gradient-to-br from-error-400 to-error-500',
          'text-white',
          'hover:from-error-500 hover:to-error-600',
          'dark:from-error-500 dark:to-error-600',
          'dark:hover:from-error-400 dark:hover:to-error-500',
        ].join(' '),

        // Warning - Amarillo mostaza pastel
        warning: [
          'bg-gradient-to-br from-warning-400 to-warning-500',
          'text-white',
          'hover:from-warning-500 hover:to-warning-600',
          'dark:from-warning-500 dark:to-warning-600',
          'dark:hover:from-warning-400 dark:hover:to-warning-500',
        ].join(' '),

        // Outline - Borde de color, fondo transparente
        outline: [
          'bg-transparent',
          'border-2 border-primary-400',
          'text-primary-600',
          'hover:bg-primary-50',
          'dark:border-primary-500',
          'dark:text-primary-400',
          'dark:hover:bg-primary-900/20',
        ].join(' '),

        // Link - Texto simple con underline
        link: [
          'bg-transparent',
          'text-primary-600',
          'underline-offset-4',
          'hover:underline',
          'dark:text-primary-400',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-lg',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg rounded-2xl',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Button = React.forwardRef(
  ({
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
            <span className="sr-only">Completado</span>
          </>
        )}
        {!isLoading && children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
