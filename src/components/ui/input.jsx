import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Input Component - Modern Pastel Design System
 *
 * Inputs limpios sin sombras, con transiciones suaves
 * Usa color y contraste para estados de foco/error/success
 */

const Input = React.forwardRef(({ className, type, icon, error, success, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="relative w-full group">
      {icon && (
        <div
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200",
            isFocused ? "text-blue-500 dark:text-blue-400" : "text-muted-foreground",
            error && "text-red-500 dark:text-red-400",
            success && "text-green-500 dark:text-green-400"
          )}
        >
          {React.cloneElement(icon, { className: "h-5 w-5" })}
        </div>
      )}

      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-12 w-full rounded-xl",
          "px-4 py-3 text-base",
          "bg-muted/30 backdrop-blur-sm",
          "border-2 border-border",
          "text-foreground placeholder:text-muted-foreground",
          // Transitions
          "transition-all duration-200",
          // Focus state - sin sombras, solo color
          "focus-visible:outline-none",
          "focus-visible:border-blue-400 dark:focus-visible:border-blue-500",
          "focus-visible:bg-card/50",
          // Hover state
          "hover:border-slate-300 dark:hover:border-slate-600",
          "hover:bg-muted/40",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Icon spacing
          icon ? "pl-12" : "px-4",
          // Error state
          error && [
            "border-red-400 dark:border-red-500",
            "focus-visible:border-red-500 dark:focus-visible:border-red-400",
          ].join(' '),
          // Success state
          success && [
            "border-green-400 dark:border-green-500",
            "focus-visible:border-green-500 dark:focus-visible:border-green-400",
          ].join(' '),
          className
        )}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {/* Error message */}
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 animate-fade-in">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Success message */}
      {success && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-fade-in">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
