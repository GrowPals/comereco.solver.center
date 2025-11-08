import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

/**
 * FormField - Mobile-first form field with floating label
 *
 * Features:
 * - Floating label animation
 * - Full-width on mobile
 * - Error/success states
 * - Helper text support
 * - Icon support
 */
const FormField = React.forwardRef(({
  id,
  name,
  label,
  type = "text",
  placeholder,
  error,
  success,
  helperText,
  required = false,
  disabled = false,
  className,
  containerClassName,
  icon,
  multiline = false,
  rows = 3,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(Boolean(value))

  const inputId = id || name
  const isFloating = isFocused || hasValue || placeholder

  React.useEffect(() => {
    setHasValue(Boolean(value))
  }, [value])

  const handleFocus = (e) => {
    setIsFocused(true)
    props.onFocus?.(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    setHasValue(Boolean(e.target.value))
    props.onBlur?.(e)
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className={cn('relative w-full', containerClassName)}>
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute left-4 z-10 text-muted-foreground transition-all duration-200",
            isFloating ? "top-5" : "top-1/2 -translate-y-1/2",
            isFocused && "text-primary-600 dark:text-primary-400",
            error && "text-destructive",
            success && "text-success"
          )}>
            {React.cloneElement(icon, { className: "h-5 w-5" })}
          </div>
        )}

        {label && (
          <Label
            htmlFor={inputId}
            className={cn(
              "absolute left-4 z-10 cursor-text transition-all duration-200 ease-out origin-left pointer-events-none",
              isFloating
                ? "top-2 text-xs font-medium text-muted-foreground scale-90"
                : "top-1/2 -translate-y-1/2 text-base text-foreground/70",
              icon && (isFloating ? "left-12" : "left-12"),
              isFocused && "text-primary-600 dark:text-primary-400",
              error && "text-destructive",
              disabled && "text-muted-foreground/50"
            )}
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}

        <InputComponent
          id={inputId}
          name={name}
          type={type}
          ref={ref}
          value={value}
          disabled={disabled}
          placeholder={isFloating ? placeholder : ""}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={multiline ? rows : undefined}
          className={cn(
            "w-full transition-all duration-200",
            label && (isFloating ? "pt-6 pb-2" : "py-3"),
            icon && "pl-12",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
            success && "border-success focus-visible:border-success focus-visible:ring-success",
            multiline ? "min-h-[80px] resize-y" : "h-14",
            className
          )}
          {...props}
        />
      </div>

      {(error || helperText) && (
        <div className="mt-1.5 px-1">
          {error && (
            <p className="text-sm text-destructive flex items-start gap-1">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </p>
          )}
          {!error && helperText && (
            <p className="text-sm text-muted-foreground">{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
})

FormField.displayName = "FormField"

export { FormField }
