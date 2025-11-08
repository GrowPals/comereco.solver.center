
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
  'inline-flex items-center gap-1.5 font-medium px-3 py-1 rounded-full text-sm transition-colors duration-200',
  {
    variants: {
      variant: {
        // Estados de requisiciones - mejorado contraste WCAG AA en modo dark
        ordered: 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        sent: 'bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
        rejected: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300',
        draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200',
        in_process: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
        completed: 'bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',

        // Variantes genéricas - mejorado contraste
        default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
        success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        warning: 'bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
        danger: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300',
        destructive: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300',
        info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200',
        muted: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
        outline: 'bg-transparent text-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const statusConfig = {
  // Estados de requisiciones con iconos para mejor accesibilidad
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
