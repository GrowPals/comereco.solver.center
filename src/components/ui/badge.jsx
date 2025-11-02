
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-blue-200 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 shadow-sm',
        secondary: 'border-slate-200 bg-slate-100 text-slate-700 shadow-sm',

        success: 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
        warning: 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200 shadow-sm',
        danger: 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 shadow-sm',
        destructive: 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 shadow-sm',
        info: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200 shadow-sm',

        muted: 'bg-slate-100 text-slate-600 border-slate-200',
        outline: 'text-slate-700 border-slate-300 bg-white hover:bg-slate-50',
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
