import { cva } from "class-variance-authority";
import React from 'react';
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg p-4",
  {
    variants: {
      variant: {
        default: "bg-slate-50 text-slate-900 dark:bg-slate-800 dark:text-slate-100",

        warning: cn(
          "bg-amber-50 dark:bg-amber-900/15",
          "border-l-4 border-amber-400 dark:border-amber-500",
          "text-amber-900 dark:text-amber-200"
        ),

        error: cn(
          "bg-red-50 dark:bg-red-900/15",
          "border-l-4 border-red-400 dark:border-red-500",
          "text-red-900 dark:text-red-200"
        ),

        success: cn(
          "bg-emerald-50 dark:bg-emerald-900/15",
          "border-l-4 border-emerald-400 dark:border-emerald-500",
          "text-emerald-900 dark:text-emerald-200"
        ),

        info: cn(
          "bg-blue-50 dark:bg-blue-900/15",
          "border-l-4 border-blue-400 dark:border-blue-500",
          "text-blue-900 dark:text-blue-200"
        ),
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
