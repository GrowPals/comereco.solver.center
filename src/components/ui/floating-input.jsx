import * as React from "react"
import { cn } from "@/lib/utils"

const FloatingInput = React.forwardRef(({ className, type, label, icon, error, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e) => {
    setIsFocused(false);
    setHasValue(e.target.value !== '');
  };

  const isFloating = isFocused || hasValue || props.value || props.defaultValue;

  return (
    <div className="relative w-full group">
      {icon && (
        <div
          className={cn(
            "pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-neutral-500 transition-colors duration-200 dark:text-neutral-400",
            isFloating && "text-primary-500 dark:text-primary-400",
            error && "text-red-500 dark:text-red-400"
          )}
        >
          {React.cloneElement(icon, { className: "h-5 w-5" })}
        </div>
      )}

      <input
        type={type}
        className={cn(
          "peer flex h-14 w-full rounded-lg border-2 border-border bg-background px-4 pt-6 pb-2 text-base text-foreground transition-all duration-200 placeholder-transparent",
          "focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-200/30",
          "overflow-hidden text-ellipsis ring-offset-background dark:border-border dark:bg-card dark:text-neutral-50",
          "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60 dark:disabled:bg-card",
          icon ? "pl-12 pr-4" : "px-4",
          error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200/30 dark:border-red-600 dark:focus-visible:ring-red-500/25",
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={label}
        {...props}
      />

      {label && (
        <label
          className={cn(
            "pointer-events-none absolute left-4 font-medium text-neutral-600 transition-all duration-200 dark:text-neutral-300",
            icon && "left-12",
            isFloating
              ? "top-2 text-xs text-primary-600 dark:text-primary-300"
              : "top-1/2 -translate-y-1/2 text-base text-neutral-600 dark:text-neutral-300",
            error && isFloating && "text-red-600 dark:text-red-400"
          )}
        >
          {label}
        </label>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600 animate-in slide-in-from-top-1 dark:text-red-400">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
})
FloatingInput.displayName = "FloatingInput"

export { FloatingInput }
