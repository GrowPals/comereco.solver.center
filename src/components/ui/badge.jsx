
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--primary-00)] text-[var(--primary-60)]',
        secondary: 'border-transparent bg-[var(--neutral-10)] text-[var(--neutral-60)]',

        success: 'bg-[var(--success-00)] text-[var(--success-text)] border-[var(--success-border)]',
        warning: 'bg-[var(--warning-00)] text-[var(--warning-text)] border-[var(--warning-border)]',
        danger: 'bg-[var(--danger-00)] text-[var(--danger-text)] border-[var(--danger-border)]',
        info: 'bg-[var(--info-00)] text-[var(--info-text)] border-[var(--info-border)]',

        muted: 'bg-[var(--neutral-10)] text-[var(--neutral-60)] border-[var(--neutral-20)]',
        outline: 'text-[var(--neutral-100)] border-[var(--neutral-10)]',
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
