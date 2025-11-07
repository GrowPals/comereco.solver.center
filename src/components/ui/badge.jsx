
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center font-medium px-3 py-1 rounded-full text-sm transition-colors duration-200',
  {
    variants: {
      variant: {
        // Estados de requisiciones - sin bordes, fondos sutiles
        ordered: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
        approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        sent: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
        rejected: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
        draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',

        // Variantes genéricas
        default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
        success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        warning: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
        danger: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
        destructive: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
        info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
        secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
        muted: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',
        outline: 'bg-transparent text-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const statusConfig = {
  // Estados de requisiciones
  ordered: { label: 'Ordenada', variant: 'ordered' },
  approved: { label: 'Aprobada', variant: 'approved' },
  sent: { label: 'Enviada', variant: 'sent' },
  submitted: { label: 'Enviada', variant: 'sent' },
  rejected: { label: 'Rechazada', variant: 'rejected' },
  draft: { label: 'Borrador', variant: 'draft' },
  borrador: { label: 'Borrador', variant: 'draft' },
  cancelled: { label: 'Cancelada', variant: 'muted' },

  // Otros estados
  pending: { label: 'Pendiente', variant: 'warning' },
  in_review: { label: 'En Revisión', variant: 'info' },

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
