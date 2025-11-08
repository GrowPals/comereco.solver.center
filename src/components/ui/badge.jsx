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
 * Badge Component - Modern Pastel Design System
 *
 * Badges con gradientes pastel sutiles, sin sombras ni bordes
 * Usa color y contraste para diferenciar estados
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-xl text-sm transition-all duration-200',
  {
    variants: {
      variant: {
        // Estados de requisiciones - con gradientes pastel
        ordered: [
          'bg-gradient-to-r from-blue-200 to-blue-300',
          'text-blue-900',
          'dark:from-blue-400/30 dark:to-blue-500/30',
          'dark:text-blue-200'
        ].join(' '),

        approved: [
          'bg-gradient-to-r from-green-200 to-green-300',
          'text-green-900',
          'dark:from-green-400/30 dark:to-green-500/30',
          'dark:text-green-200'
        ].join(' '),

        sent: [
          'bg-gradient-to-r from-yellow-200 to-yellow-300',
          'text-yellow-900',
          'dark:from-yellow-400/30 dark:to-yellow-500/30',
          'dark:text-yellow-200'
        ].join(' '),

        rejected: [
          'bg-gradient-to-r from-red-200 to-red-300',
          'text-red-900',
          'dark:from-red-400/30 dark:to-red-500/30',
          'dark:text-red-200'
        ].join(' '),

        draft: [
          'bg-gradient-to-r from-slate-200 to-slate-300',
          'text-slate-700',
          'dark:from-slate-600/30 dark:to-slate-700/30',
          'dark:text-slate-200'
        ].join(' '),

        in_process: [
          'bg-gradient-to-r from-cyan-200 to-cyan-300',
          'text-cyan-900',
          'dark:from-cyan-400/30 dark:to-cyan-500/30',
          'dark:text-cyan-200'
        ].join(' '),

        completed: [
          'bg-gradient-to-r from-violet-200 to-violet-300',
          'text-violet-900',
          'dark:from-violet-400/30 dark:to-violet-500/30',
          'dark:text-violet-200'
        ].join(' '),

        // Variantes genéricas
        default: [
          'bg-gradient-neutral',
          'text-foreground',
        ].join(' '),

        success: [
          'bg-gradient-success',
          'text-white',
          'dark:text-slate-900'
        ].join(' '),

        warning: [
          'bg-gradient-warning',
          'text-yellow-900',
          'dark:text-yellow-950'
        ].join(' '),

        danger: [
          'bg-gradient-error',
          'text-white',
          'dark:text-slate-900'
        ].join(' '),

        info: [
          'bg-gradient-primary',
          'text-white',
          'dark:text-slate-900'
        ].join(' '),

        secondary: [
          'bg-gradient-neutral',
          'text-foreground',
        ].join(' '),

        muted: [
          'bg-muted/50',
          'text-muted-foreground',
        ].join(' '),

        outline: [
          'border-2 border-slate-300 dark:border-slate-600',
          'bg-transparent',
          'text-foreground',
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
        {showIcon && Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
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
