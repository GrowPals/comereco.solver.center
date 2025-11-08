import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl p-4 border-l-4",
  {
    variants: {
      variant: {
        default: "bg-neutral-100 border-neutral-300 text-neutral-900 dark:bg-neutral-800/50 dark:border-neutral-600 dark:text-neutral-100",

        warning: "bg-warning-100 border-warning-400 text-warning-900 dark:bg-warning-500/20 dark:border-warning-500 dark:text-warning-200",

        error: "bg-error-100 border-error-400 text-error-900 dark:bg-error-500/20 dark:border-error-500 dark:text-error-200",

        success: "bg-success-100 border-success-400 text-success-900 dark:bg-success-500/20 dark:border-success-500 dark:text-success-200",

        info: "bg-info-100 border-info-400 text-info-900 dark:bg-info-500/20 dark:border-info-500 dark:text-info-200",
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
    <h5 className={cn("font-semibold mb-1 tracking-tight", className)} {...props} />
  );
}

export function AlertDescription({ className, ...props }) {
  return (
    <div className={cn("text-sm opacity-90", className)} {...props} />
  );
}
