import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, icon, error, success, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="relative w-full group">
      {icon && (
        <div
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
            isFocused ? "text-primary" : "text-muted-foreground",
            error && "text-rose-400",
            success && "text-emerald-400"
          )}
        >
          {React.cloneElement(icon, { className: "h-5 w-5" })}
        </div>
      )}
      <input
        type={type}
        className={cn(
          // Base styles - sin sombras
          "flex h-12 w-full rounded-xl bg-muted/10 px-4 py-3 text-base text-foreground transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",

          // Border pastel
          "border-2 border-muted-foreground/20",

          // Focus states - sin glow, solo ring con color primary
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20",

          // Hover state
          "hover:border-muted-foreground/30",

          // Dark mode
          "dark:bg-muted/5 dark:border-muted-foreground/15",
          "dark:focus-visible:border-primary dark:focus-visible:ring-primary/10",
          "dark:hover:border-muted-foreground/25",

          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-muted-foreground/20",

          // Icon padding
          icon ? "pl-12" : "px-4",

          // Error state - color pastel
          error && "border-rose-400/60 bg-rose-50/50 focus-visible:border-rose-400 focus-visible:ring-rose-400/20 dark:bg-rose-950/20 dark:border-rose-400/40",

          // Success state - color pastel
          success && "border-emerald-400/60 bg-emerald-50/50 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20 dark:bg-emerald-950/20 dark:border-emerald-400/40",

          className
        )}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-rose-600 animate-in slide-in-from-top-1 dark:text-rose-400">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {success && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600 animate-in slide-in-from-top-1 dark:text-emerald-400">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {success}
        </p>
      )}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
