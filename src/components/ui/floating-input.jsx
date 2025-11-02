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
        <div className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-200 pointer-events-none z-10",
          isFloating && "text-primary-500"
        )}>
          {React.cloneElement(icon, { className: 'h-5 w-5' })}
        </div>
      )}

      <input
        type={type}
        className={cn(
          "peer flex h-14 w-full rounded-lg border-2 border-neutral-200 bg-white px-4 pt-6 pb-2 text-base text-slate-900 transition-all duration-200",
          "focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-200/30 focus-visible:shadow-glow-primary",
          "placeholder-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50",
          icon ? "pl-12" : "px-4",
          error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200/30",
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
            "absolute left-4 transition-all duration-200 pointer-events-none",
            "text-neutral-500 font-medium",
            icon && "left-12",
            isFloating
              ? "top-2 text-xs text-primary-600"
              : "top-1/2 -translate-y-1/2 text-base",
            error && isFloating && "text-red-600"
          )}
        >
          {label}
        </label>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 animate-in slide-in-from-top-1">
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
