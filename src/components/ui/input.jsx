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
            isFocused ? "text-primary-500" : "text-muted-foreground",
            error && "text-error-500",
            success && "text-success-500"
          )}
        >
          {React.cloneElement(icon, { className: "h-5 w-5" })}
        </div>
      )}
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-primary-300 focus-visible:ring-0 dark:focus-visible:border-primary-500",
          "hover:border-primary-200 dark:hover:border-primary-600",
          "disabled:cursor-not-allowed disabled:bg-muted/20 disabled:opacity-60",
          icon ? "pl-12" : "px-4",
          error && "border-error-300 focus-visible:border-error-400 dark:border-error-500 dark:focus-visible:border-error-400",
          success && "border-success-300 focus-visible:border-success-400 dark:border-success-500 dark:focus-visible:border-success-400",
          className
        )}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-error-600 animate-fade-in dark:text-error-400">
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
        <p className="mt-2 flex items-center gap-1.5 text-sm text-success-600 animate-fade-in dark:text-success-400">
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
