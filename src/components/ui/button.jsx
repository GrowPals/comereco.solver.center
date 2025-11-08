import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
  {
    variants: {
      variant: {
        // Primary - Gradiente verde menta
        primary: 'bg-gradient-mint hover:bg-gradient-mint-hover text-white rounded-xl border-0',

        // Secondary - Azul cielo pastel
        secondary: 'bg-gradient-to-r from-sky-100 to-sky-200 hover:from-sky-200 hover:to-sky-300 text-sky-900 rounded-xl border-0 dark:from-sky-900 dark:to-sky-800 dark:hover:from-sky-800 dark:hover:to-sky-700 dark:text-sky-100',

        // Ghost - Transparente con hover
        ghost: 'bg-transparent hover:bg-muted/10 text-foreground rounded-xl border-0',

        // Danger/Destructive - Rojo coral pastel
        danger: 'bg-gradient-coral hover:bg-gradient-coral-hover text-white rounded-xl border-0',

        // Success - Verde menta (igual que primary pero semánticamente diferente)
        success: 'bg-gradient-mint hover:bg-gradient-mint-hover text-white rounded-xl border-0',

        // Warning - Amarillo mostaza
        warning: 'bg-gradient-mustard hover:bg-gradient-mustard-hover text-white rounded-xl border-0',

        // Outline - Sin fondo, solo borde suave
        outline: 'bg-transparent hover:bg-muted/10 text-foreground rounded-xl border border-border',

        // Link - Sin decoraciones
        link: 'text-primary underline-offset-4 hover:underline bg-transparent border-0',
      },
      size: {
        sm: 'h-9 px-4 py-2 text-sm',
        md: 'h-11 px-6 py-3 text-base',
        lg: 'h-14 px-8 py-4 text-lg',
        icon: 'h-11 w-11',
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
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="sr-only">Cargando...</span>
        </>
      )}
      {isSuccess && !isLoading && (
        <>
          <CheckCircle className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Completado</span>
        </>
      )}
      {!isLoading && !isSuccess && children}
    </Comp>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
