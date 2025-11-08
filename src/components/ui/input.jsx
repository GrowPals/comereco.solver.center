import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, icon, error, success, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="relative w-full group">
      {icon && (
        <div
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200",
            isFocused ? "text-primary" : "text-muted-foreground",
            error && "text-coral-500",
            success && "text-mint-500"
          )}
        >
          {React.cloneElement(icon, { className: "h-5 w-5" })}
        </div>
      )}
      <input
        type={type}
        className={cn(
          // Base - sin sombras, solo borde suave
          "flex h-12 w-full rounded-xl border bg-background px-4 py-3 text-base transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          // Focus - cambio de borde sin glow
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Hover
          "hover:border-primary/40",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Icon padding
          icon ? "pl-12" : "px-4",
          // Estados
          error && "border-coral-500 focus-visible:ring-coral-200",
          success && "border-mint-500 focus-visible:ring-mint-200",
          !error && !success && "border-border",
          className
        )}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-coral-600 dark:text-coral-400 animate-fadeIn">
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
        <p className="mt-2 flex items-center gap-1.5 text-sm text-mint-600 dark:text-mint-400 animate-fadeIn">
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
