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

/**
 * Badge Component - NEW DESIGN SYSTEM
 *
 * Badges con estilo minimalista:
 * - Gradientes pastel sutiles
 * - SIN bordes, SIN sombras
 * - Iconos con colores semánticos pasteles
 * - Tamaño consistente
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium px-3 py-1 rounded-full text-sm transition-all duration-200',
  {
    variants: {
      variant: {
        // Primary - Azul cielo
        default: [
          'bg-gradient-to-br from-neutral-100 to-neutral-200',
          'text-neutral-800',
          'dark:from-neutral-200 dark:to-neutral-300',
          'dark:text-neutral-900',
        ].join(' '),

        // Success - Verde menta
        success: [
          'bg-gradient-to-br from-success-100 to-success-200',
          'text-success-700',
          'dark:from-success-600 dark:to-success-700',
          'dark:text-white',
        ].join(' '),

        // Warning - Amarillo mostaza
        warning: [
          'bg-gradient-to-br from-warning-100 to-warning-200',
          'text-warning-700',
          'dark:from-warning-600 dark:to-warning-700',
          'dark:text-white',
        ].join(' '),

        // Danger - Rojo coral
        danger: [
          'bg-gradient-to-br from-error-100 to-error-200',
          'text-error-700',
          'dark:from-error-600 dark:to-error-700',
          'dark:text-white',
        ].join(' '),

        // Info - Azul cielo
        info: [
          'bg-gradient-to-br from-info-100 to-info-200',
          'text-info-700',
          'dark:from-info-600 dark:to-info-700',
          'dark:text-white',
        ].join(' '),

        // Muted - Gris lavanda
        muted: [
          'bg-gradient-to-br from-neutral-100 to-neutral-200',
          'text-neutral-600',
          'dark:from-neutral-300 dark:to-neutral-400',
          'dark:text-neutral-900',
        ].join(' '),

        // Estados de requisiciones
        ordered: [
          'bg-gradient-to-br from-info-100 to-info-200',
          'text-info-700',
          'dark:from-info-600 dark:to-info-700',
          'dark:text-white',
        ].join(' '),

        approved: [
          'bg-gradient-to-br from-success-100 to-success-200',
          'text-success-700',
          'dark:from-success-600 dark:to-success-700',
          'dark:text-white',
        ].join(' '),

        sent: [
          'bg-gradient-to-br from-warning-100 to-warning-200',
          'text-warning-700',
          'dark:from-warning-600 dark:to-warning-700',
          'dark:text-white',
        ].join(' '),

        rejected: [
          'bg-gradient-to-br from-error-100 to-error-200',
          'text-error-700',
          'dark:from-error-600 dark:to-error-700',
          'dark:text-white',
        ].join(' '),

        draft: [
          'bg-gradient-to-br from-neutral-100 to-neutral-200',
          'text-neutral-700',
          'dark:from-neutral-300 dark:to-neutral-400',
          'dark:text-neutral-900',
        ].join(' '),

        in_process: [
          'bg-gradient-to-br from-info-100 to-info-200',
          'text-info-700',
          'dark:from-info-500 dark:to-info-600',
          'dark:text-white',
        ].join(' '),

        completed: [
          'bg-gradient-to-br from-success-100 to-success-200',
          'text-success-700',
          'dark:from-success-600 dark:to-success-700',
          'dark:text-white',
        ].join(' '),
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
  cancelled: { label: 'Cancelada', variant: 'muted', icon: XCircle },
  in_process: { label: 'En Proceso', variant: 'in_process', icon: Clock },
  en_proceso: { label: 'En Proceso', variant: 'in_process', icon: Clock },
  completed: { label: 'Completada', variant: 'completed', icon: PackageCheck },
  completada: { label: 'Completada', variant: 'completed', icon: PackageCheck },

  // Otros estados
  pending: { label: 'Pendiente', variant: 'warning', icon: Clock },
  in_review: { label: 'En Revisión', variant: 'info', icon: Eye },

  // User statuses
  activo: { label: 'Activo', variant: 'success', icon: CheckCircle },
  inactivo: { label: 'Inactivo', variant: 'muted', icon: XCircle },
};

const Badge = React.forwardRef(
  ({ className, variant, status, children, showIcon = true, ...props }, ref) => {
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
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
