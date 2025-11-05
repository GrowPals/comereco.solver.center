
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200/40 focus:ring-offset-2 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'border-primary-200 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 shadow-sm dark:border-primary-500/40 dark:from-primary-500/20 dark:to-primary-500/5 dark:text-primary-200',
        secondary: 'border-border bg-muted text-foreground/90 shadow-sm dark:border-border dark:bg-card/80 dark:text-foreground/80',

        success: 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200 shadow-sm dark:border-emerald-500/40 dark:from-emerald-500/20 dark:to-emerald-500/5 dark:text-emerald-200',
        warning: 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200 shadow-sm dark:border-amber-500/45 dark:from-amber-500/25 dark:to-amber-500/5 dark:text-amber-200',
        danger: 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 shadow-sm dark:border-red-500/45 dark:from-red-500/20 dark:to-red-500/5 dark:text-red-200',
        destructive: 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 shadow-sm dark:border-red-500/45 dark:from-red-500/20 dark:to-red-500/5 dark:text-red-200',
        info: 'bg-gradient-to-r from-info-light to-info-light/70 text-info-dark border-info-light/70 shadow-sm dark:border-info/40 dark:from-info/25 dark:to-info/10 dark:text-info-light',

        muted: 'bg-muted text-muted-foreground border-border dark:border-border dark:bg-card/70 dark:text-muted-foreground',
        outline: 'text-foreground/90 border-border/80 bg-background hover:bg-muted/60 dark:text-foreground/80 dark:border-border dark:bg-card dark:hover:bg-muted/40/80',
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
