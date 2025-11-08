import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle } from 'lucide-react';

/**
 * Button Component - Modern Pastel Design System
 *
 * Sistema de botones minimalista sin sombras, sin bordes duros
 * Usa gradientes pastel funcionales y colores para diferenciar
 * Compatible con dark/light mode
 */

const buttonVariants = cva(
  // Base styles - Clean, modern, accessible
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // Primary - Azul cielo degradado pastel
        primary: [
          'bg-gradient-primary text-white',
          'hover:opacity-90 hover:scale-[1.02]',
          'active:scale-[0.98]',
          'focus-visible:ring-blue-400',
          'dark:text-slate-900',
        ].join(' '),

        // Secondary - Gris lavanda sutil
        secondary: [
          'bg-gradient-neutral text-foreground',
          'hover:opacity-90 hover:scale-[1.02]',
          'active:scale-[0.98]',
          'focus-visible:ring-slate-400',
        ].join(' '),

        // Ghost - Transparente minimalista
        ghost: [
          'bg-transparent text-foreground',
          'hover:bg-muted/50',
          'active:bg-muted',
          'focus-visible:ring-slate-400',
        ].join(' '),

        // Danger - Rojo coral pastel
        danger: [
          'bg-gradient-error text-white',
          'hover:opacity-90 hover:scale-[1.02]',
          'active:scale-[0.98]',
          'focus-visible:ring-red-400',
          'dark:text-slate-900',
        ].join(' '),

        // Success - Verde menta pastel
        success: [
          'bg-gradient-success text-white',
          'hover:opacity-90 hover:scale-[1.02]',
          'active:scale-[0.98]',
          'focus-visible:ring-green-400',
          'dark:text-slate-900',
        ].join(' '),

        // Outline - Borde limpio sin relleno
        outline: [
          'border-2 bg-transparent text-foreground',
          'border-slate-300 dark:border-slate-600',
          'hover:bg-muted/30',
          'active:bg-muted/50',
          'focus-visible:ring-slate-400',
        ].join(' '),

        // Link - Simple texto
        link: [
          'text-blue-500 dark:text-blue-400',
          'hover:text-blue-600 dark:hover:text-blue-300',
          'hover:underline underline-offset-4',
          'focus-visible:ring-blue-400',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-lg gap-1.5',
        md: 'h-11 px-6 text-base rounded-xl gap-2',
        lg: 'h-14 px-8 text-lg rounded-xl gap-2.5',
        icon: 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, isLoading, isSuccess, children, icon, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        aria-disabled={isLoading || props.disabled}
        {...props}
      >
        {/* Loading state */}
        {isLoading && (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span className="sr-only">Cargando...</span>
          </>
        )}

        {/* Success state */}
        {isSuccess && !isLoading && (
          <>
            <CheckCircle className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Completado</span>
          </>
        )}

        {/* Icon (optional left icon) */}
        {icon && !isLoading && !isSuccess && (
          <span className="w-5 h-5 flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Content */}
        {!isLoading && !isSuccess && children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
