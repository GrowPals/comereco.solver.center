
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200/40 focus:ring-offset-2 ring-offset-background',
  {
    variants: {
      variant: {
        // Colores sólidos limpios - sin gradientes innecesarios
        default: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-400/50 dark:bg-primary-500/20 dark:text-primary-100',
        secondary: 'border-border bg-muted text-foreground/90 dark:border-border dark:bg-card/80 dark:text-foreground/85',

        success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:border-emerald-400/50 dark:bg-emerald-500/20 dark:text-emerald-100',
        warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-100',
        danger: 'bg-red-50 text-red-700 border-red-200 dark:border-red-400/50 dark:bg-red-500/20 dark:text-red-100',
        destructive: 'bg-red-50 text-red-700 border-red-200 dark:border-red-400/50 dark:bg-red-500/20 dark:text-red-100',
        info: 'bg-blue-50 text-blue-700 border-blue-200 dark:border-blue-400/50 dark:bg-blue-500/20 dark:text-blue-100',

        muted: 'bg-muted text-muted-foreground border-border dark:border-border dark:bg-card/70 dark:text-muted-foreground',
        outline: 'text-foreground/90 border-border bg-transparent hover:bg-muted/60 dark:text-foreground/85 dark:border-border dark:bg-transparent dark:hover:bg-card/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const statusConfig = {
  approved: { label: 'Aprobado', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
  rejected: { label: 'Rechazado', variant: 'danger' },
  in_review: { label: 'En Revisión', variant: 'info' },
  borrador: { label: 'Borrador', variant: 'muted' },
  // User statuses
  activo: { label: 'Activo', variant: 'success' },
  inactivo: { label: 'Inactivo', variant: 'muted' },
};

const Badge = React.forwardRef(({ className, variant, status, children, ...props }, ref) => {
  const config = status ? statusConfig[status] : null;

  if (config) {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant: config.variant }), className)}
        {...props}
      >
        {config.label}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
});

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
