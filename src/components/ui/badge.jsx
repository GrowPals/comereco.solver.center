
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200/40 focus:ring-offset-2 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'border-primary-200 bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 dark:border-primary-400/60 dark:from-primary-500/35 dark:to-primary-500/15 dark:text-primary-100 dark:shadow-[0_16px_40px_rgba(6,16,36,0.4)]',
        secondary: 'border-border bg-muted text-foreground/90 dark:border-border dark:bg-card/80 dark:text-foreground/80 dark:shadow-[0_14px_36px_rgba(6,14,30,0.42)]',

        success: 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200 dark:border-emerald-400/65 dark:from-emerald-500/35 dark:to-emerald-500/15 dark:text-emerald-100 dark:shadow-[0_16px_40px_rgba(6,18,34,0.42)]',
        warning: 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200 dark:border-amber-400/65 dark:from-amber-500/40 dark:to-amber-500/15 dark:text-amber-100 dark:shadow-[0_16px_40px_rgba(16,20,8,0.42)]',
        danger: 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 dark:border-red-400/65 dark:from-red-500/35 dark:to-red-500/15 dark:text-red-100 dark:shadow-[0_16px_40px_rgba(26,10,20,0.45)]',
        destructive: 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 dark:border-red-400/65 dark:from-red-500/35 dark:to-red-500/15 dark:text-red-100 dark:shadow-[0_16px_40px_rgba(26,10,20,0.45)]',
        info: 'bg-gradient-to-r from-info-light to-info-light/70 text-info-dark border-info-light/70 dark:border-info/60 dark:from-info/40 dark:to-info/20 dark:text-info-light dark:shadow-[0_16px_40px_rgba(8,18,42,0.45)]',

        muted: 'bg-muted text-muted-foreground border-border dark:border-border dark:bg-card/70 dark:text-muted-foreground',
        outline: 'text-foreground/90 border-border bg-background hover:bg-muted/60 dark:text-foreground/80 dark:border-border dark:bg-card dark:hover:bg-muted/80',
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
