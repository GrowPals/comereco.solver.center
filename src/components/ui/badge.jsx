
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
  'inline-flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-xl text-sm transition-all duration-200',
  {
    variants: {
      variant: {
        // Estados con gradientes pastel sutiles
        ordered: 'bg-gradient-to-r from-sky-100 to-sky-200 text-sky-700 dark:from-sky-900/40 dark:to-sky-800/40 dark:text-sky-300',
        approved: 'bg-gradient-to-r from-mint-100 to-mint-200 text-mint-700 dark:from-mint-900/40 dark:to-mint-800/40 dark:text-mint-300',
        sent: 'bg-gradient-to-r from-mustard-100 to-mustard-200 text-mustard-800 dark:from-mustard-900/40 dark:to-mustard-800/40 dark:text-mustard-300',
        rejected: 'bg-gradient-to-r from-coral-100 to-coral-200 text-coral-700 dark:from-coral-900/40 dark:to-coral-800/40 dark:text-coral-300',
        draft: 'bg-gradient-to-r from-lavender-100 to-lavender-200 text-lavender-700 dark:from-lavender-800/40 dark:to-lavender-700/40 dark:text-lavender-300',
        in_process: 'bg-gradient-to-r from-sky-100 to-sky-200 text-sky-700 dark:from-sky-900/40 dark:to-sky-800/40 dark:text-sky-300',
        completed: 'bg-gradient-to-r from-mint-100 to-mint-200 text-mint-700 dark:from-mint-900/40 dark:to-mint-800/40 dark:text-mint-300',

        // Variantes genéricas
        default: 'bg-gradient-to-r from-lavender-100 to-lavender-200 text-lavender-700 dark:from-lavender-800/40 dark:to-lavender-700/40 dark:text-lavender-300',
        success: 'bg-gradient-to-r from-mint-100 to-mint-200 text-mint-700 dark:from-mint-900/40 dark:to-mint-800/40 dark:text-mint-300',
        warning: 'bg-gradient-to-r from-mustard-100 to-mustard-200 text-mustard-800 dark:from-mustard-900/40 dark:to-mustard-800/40 dark:text-mustard-300',
        danger: 'bg-gradient-to-r from-coral-100 to-coral-200 text-coral-700 dark:from-coral-900/40 dark:to-coral-800/40 dark:text-coral-300',
        destructive: 'bg-gradient-to-r from-coral-100 to-coral-200 text-coral-700 dark:from-coral-900/40 dark:to-coral-800/40 dark:text-coral-300',
        info: 'bg-gradient-to-r from-sky-100 to-sky-200 text-sky-700 dark:from-sky-900/40 dark:to-sky-800/40 dark:text-sky-300',
        secondary: 'bg-gradient-to-r from-lavender-100 to-lavender-200 text-lavender-700 dark:from-lavender-800/40 dark:to-lavender-700/40 dark:text-lavender-300',
        muted: 'bg-muted/20 text-muted-foreground',
        outline: 'bg-transparent border border-border text-foreground',
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
        {showIcon && Icon && <Icon className="w-4 h-4" />}
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
