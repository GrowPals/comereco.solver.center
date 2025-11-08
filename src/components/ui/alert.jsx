import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl p-4",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-lavender-100 to-lavender-200 text-lavender-900 dark:from-lavender-900/40 dark:to-lavender-800/40 dark:text-lavender-100",

        warning: "bg-gradient-to-r from-mustard-100 to-mustard-200 text-mustard-900 dark:from-mustard-900/40 dark:to-mustard-800/40 dark:text-mustard-100",

        error: "bg-gradient-to-r from-coral-100 to-coral-200 text-coral-900 dark:from-coral-900/40 dark:to-coral-800/40 dark:text-coral-100",

        success: "bg-gradient-to-r from-mint-100 to-mint-200 text-mint-900 dark:from-mint-900/40 dark:to-mint-800/40 dark:text-mint-100",

        info: "bg-gradient-to-r from-sky-100 to-sky-200 text-sky-900 dark:from-sky-900/40 dark:to-sky-800/40 dark:text-sky-100",
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
