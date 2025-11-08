import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Clock,
  Eye,
  PackageCheck
} from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full text-sm transition-colors duration-200',
  {
    variants: {
      variant: {
        // Primary - Azul Pastel
        primary: 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300',

        // Secondary - Púrpura Pastel
        secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-300',

        // Accent - Rosa Pastel
        accent: 'bg-accent-100 text-accent-600 dark:bg-accent-500/20 dark:text-accent-300',

        // Success - Verde Menta Pastel
        success: 'bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-300',
        approved: 'bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-300',

        // Warning - Amarillo Pastel
        warning: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300',
        sent: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300',

        // Danger/Error - Coral Pastel
        danger: 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300',
        destructive: 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300',
        rejected: 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-300',

        // Info - Azul Cielo Pastel
        info: 'bg-info-100 text-info-700 dark:bg-info-500/20 dark:text-info-300',
        ordered: 'bg-info-100 text-info-700 dark:bg-info-500/20 dark:text-info-300',
        in_review: 'bg-info-100 text-info-700 dark:bg-info-500/20 dark:text-info-300',

        // Neutral/Muted
        default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700/60 dark:text-neutral-300',
        muted: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700/60 dark:text-neutral-300',
        draft: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700/60 dark:text-neutral-300',
        cancelled: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700/60 dark:text-neutral-300',

        // Process states - Cyan Pastel
        in_process: 'bg-info-100 text-info-700 dark:bg-info-500/20 dark:text-info-300',
        completed: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/20 dark:text-secondary-300',

        // Outline
        outline: 'border-2 border-neutral-300 bg-transparent text-neutral-700 dark:border-neutral-600 dark:text-neutral-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const statusConfig = {
  // Estados de requisiciones con iconos
  ordered: { label: 'Ordenada', variant: 'ordered', icon: ShoppingCart },
  approved: { label: 'Aprobada', variant: 'approved', icon: CheckCircle },
  sent: { label: 'Enviada', variant: 'sent', icon: Send },
  submitted: { label: 'Enviada', variant: 'sent', icon: Send },
  rejected: { label: 'Rechazada', variant: 'rejected', icon: XCircle },
  draft: { label: 'Borrador', variant: 'draft', icon: FileText },
  borrador: { label: 'Borrador', variant: 'draft', icon: FileText },
  cancelled: { label: 'Cancelada', variant: 'cancelled', icon: XCircle },
  in_process: { label: 'En Proceso', variant: 'in_process', icon: Clock },
  en_proceso: { label: 'En Proceso', variant: 'in_process', icon: Clock },
  completed: { label: 'Completada', variant: 'completed', icon: PackageCheck },
  completada: { label: 'Completada', variant: 'completed', icon: PackageCheck },

  // Otros estados
  pending: { label: 'Pendiente', variant: 'warning', icon: Clock },
  in_review: { label: 'En Revisión', variant: 'in_review', icon: Eye },

  // User statuses
  activo: { label: 'Activo', variant: 'success', icon: CheckCircle },
  inactivo: { label: 'Inactivo', variant: 'muted', icon: XCircle },
};

const Badge = React.forwardRef(({ className, variant, status, children, showIcon = true, ...props }, ref) => {
  const config = status ? statusConfig[status] : null;

  if (config) {
    const Icon = config.icon;
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant: config.variant }), className)}
        {...props}
      >
        {showIcon && Icon && <Icon className="w-3.5 h-3.5" />}
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
