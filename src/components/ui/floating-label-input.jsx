import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * FloatingLabelInput - Input con label flotante que se eleva al focus o cuando hay valor
 *
 * Características:
 * - Label animado que flota hacia arriba al focus o cuando hay valor
 * - Estados de error y success con colores semánticos
 * - Soporte para iconos
 * - Transiciones suaves
 * - Accesibilidad completa
 */
const FloatingLabelInput = React.forwardRef(({
  className,
  type,
  icon,
  error,
  success,
  label,
  id,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const isFloating = isFocused || hasValue;

  // Generar ID único si no se proporciona
  const inputId = id || React.useId();

  return (
    <div className="relative w-full group">
      {/* Input */}
      <div className="relative">
        {icon && (
          <div
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200",
              isFocused ? "scale-110 text-primary-600 dark:text-primary-400" : "text-muted-foreground",
              error && "text-red-500 dark:text-red-400",
              success && "text-green-500 dark:text-green-400"
            )}
          >
            {React.cloneElement(icon, { className: "h-5 w-5" })}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={cn(
            "peer flex h-14 w-full rounded-xl border border-border/80 bg-[var(--surface-contrast)] px-4 pt-5 pb-1 text-base text-foreground shadow-xs ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent",
            "focus-visible:outline-none focus-visible:border-primary-500 focus-visible:shadow-[var(--focus-glow)] focus-visible:ring-0 dark:focus-visible:border-[rgba(124,188,255,0.7)]",
            "hover:border-neutral-300 dark:hover:border-[rgba(120,186,255,0.5)]",
            "dark:border-[rgba(90,150,230,0.35)] dark:bg-[#0f1a2d] dark:text-neutral-50",
            "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-60 dark:disabled:bg-[rgba(16,32,60,0.8)]",
            icon ? "pl-12" : "px-4",
            error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200/30 focus-visible:shadow-none dark:border-red-600 dark:focus-visible:ring-red-500/25",
            success && "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-200/30 dark:border-green-500 dark:focus-visible:ring-green-500/25",
            className
          )}
          ref={ref}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={label || ""}
          aria-label={label}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : success ? `${inputId}-success` : undefined}
          {...props}
        />

        {/* Label Flotante */}
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none",
            icon && "left-12",
            isFloating
              ? "top-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400"
              : "top-1/2 -translate-y-1/2 text-base text-muted-foreground",
            error && isFloating && "text-red-600 dark:text-red-400",
            success && isFloating && "text-green-600 dark:text-green-400",
            props.disabled && "opacity-60"
          )}
        >
          {label}
        </label>
      </div>

      {/* Barra animada de focus */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 h-0.5 bg-primary-500/80 transition-all duration-300 dark:bg-primary-400/70",
          isFocused ? "w-full opacity-100" : "w-0 opacity-0",
          error && "bg-red-500/80 dark:bg-red-400/70",
          success && "bg-green-500/80 dark:bg-green-400/70"
        )}
      />

      {/* Mensaje de error */}
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-2 flex items-center gap-1.5 text-sm text-red-600 animate-in slide-in-from-top-1 dark:text-red-400"
          role="alert"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Mensaje de success */}
      {success && (
        <p
          id={`${inputId}-success`}
          className="mt-2 flex items-center gap-1.5 text-sm text-green-600 animate-in slide-in-from-top-1 dark:text-green-400"
          role="status"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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
FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput }
