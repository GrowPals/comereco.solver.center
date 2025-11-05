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
            isFocused ? "scale-110 text-primary-600" : "text-neutral-500",
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
          "flex h-12 w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base text-foreground ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 dark:border-border dark:bg-card dark:text-neutral-50 dark:placeholder:text-neutral-400",
          "focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-200/40 dark:focus-visible:ring-primary-500/25",
          "hover:border-neutral-300 dark:hover:border-border",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60 dark:disabled:bg-card",
          icon ? "pl-12" : "px-4",
          error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200/30 focus-visible:shadow-none dark:border-red-600 dark:focus-visible:ring-red-500/25",
          success && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-200/30 dark:border-green-500 dark:focus-visible:ring-green-500/25",
          className
        )}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 h-0.5 bg-primary-500/80 transition-all duration-300 dark:bg-primary-400/70",
          isFocused ? "w-full opacity-100" : "w-0 opacity-0"
        )}
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 animate-in slide-in-from-top-1 dark:text-red-400">
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
        <p className="mt-2 flex items-center gap-1.5 text-sm text-green-600 animate-in slide-in-from-top-1 dark:text-green-400">
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
