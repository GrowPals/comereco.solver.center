import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Alert Component - Modern Pastel Design System
 *
 * Alertas con gradientes pastel sutiles, sin sombras
 * Usa color de fondo degradado y borde lateral para diferenciar
 */

const alertVariants = cva(
  "relative w-full rounded-xl p-4 border-l-4",
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-r from-slate-100 to-slate-50",
          "dark:from-slate-800/50 dark:to-slate-700/30",
          "border-slate-400 dark:border-slate-500",
          "text-slate-900 dark:text-slate-100"
        ].join(' '),

        warning: [
          "bg-gradient-to-r from-yellow-100 to-yellow-50",
          "dark:from-yellow-500/20 dark:to-yellow-400/10",
          "border-yellow-500 dark:border-yellow-400",
          "text-yellow-900 dark:text-yellow-200"
        ].join(' '),

        error: [
          "bg-gradient-to-r from-red-100 to-red-50",
          "dark:from-red-500/20 dark:to-red-400/10",
          "border-red-500 dark:border-red-400",
          "text-red-900 dark:text-red-200"
        ].join(' '),

        success: [
          "bg-gradient-to-r from-green-100 to-green-50",
          "dark:from-green-500/20 dark:to-green-400/10",
          "border-green-500 dark:border-green-400",
          "text-green-900 dark:text-green-200"
        ].join(' '),

        info: [
          "bg-gradient-to-r from-blue-100 to-blue-50",
          "dark:from-blue-500/20 dark:to-blue-400/10",
          "border-blue-500 dark:border-blue-400",
          "text-blue-900 dark:text-blue-200"
        ].join(' '),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Alert({ className, variant, children, ...props }) {
  return (
    <div className={cn(alertVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export function AlertTitle({ className, ...props }) {
  return (
    <h5 className={cn("font-semibold mb-1.5 tracking-tight text-base", className)} {...props} />
  );
}

export function AlertDescription({ className, ...props }) {
  return (
    <div className={cn("text-sm leading-relaxed opacity-90", className)} {...props} />
  );
}
