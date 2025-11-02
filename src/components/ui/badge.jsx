
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 shadow-sm',
        secondary: 'border-transparent bg-neutral-100 text-neutral-700 shadow-sm',

        success: 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200 shadow-sm',
        warning: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border-yellow-200 shadow-sm',
        danger: 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 shadow-sm',
        destructive: 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 shadow-sm',
        info: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200 shadow-sm',

        muted: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        outline: 'text-neutral-700 border-neutral-300 bg-white hover:bg-neutral-50',
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
