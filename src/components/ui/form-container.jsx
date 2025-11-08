import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * FormContainer - Main container for mobile-first forms
 *
 * Features:
 * - Mobile-optimized layout
 * - Responsive padding and spacing
 * - Optional card styling
 * - Handles scroll behavior for sticky footers
 */
const FormContainer = ({
  children,
  onSubmit,
  className,
  variant = "default", // "default" | "card" | "flat"
  maxWidth = "2xl", // "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  hasStickyFooter = false
}) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full"
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        variant === "card" && 'surface-card border border-border shadow-soft-lg',
        variant === "default" && 'space-y-6',
        hasStickyFooter && 'flex min-h-screen flex-col sm:min-h-0',
        className
      )}
    >
      {children}
    </form>
  )
}

FormContainer.displayName = "FormContainer"

/**
 * FormContent - Content area for form fields
 * Use with FormContainer when you have sticky actions
 */
const FormContent = ({
  children,
  className,
  padding = true
}) => {
  return (
    <div
      className={cn(
        'flex-1 space-y-6 overflow-y-auto',
        padding && 'px-4 py-6 sm:px-6 sm:py-8',
        className
      )}
    >
      {children}
    </div>
  )
}

FormContent.displayName = "FormContent"

/**
 * FormHeader - Header section for forms
 */
const FormHeader = ({
  title,
  description,
  icon,
  children,
  className
}) => {
  return (
    <div className={cn('space-y-2 border-b border-border/50 px-4 py-6 sm:px-6', className)}>
      {children || (
        <>
          {icon && (
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {React.cloneElement(icon, { className: "h-6 w-6" })}
            </div>
          )}
          {title && (
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </>
      )}
    </div>
  )
}

FormHeader.displayName = "FormHeader"

/**
 * FormGrid - Responsive grid for form fields
 */
const FormGrid = ({
  children,
  columns = 2, // 1 | 2 | 3
  className
}) => {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  }

  return (
    <div className={cn(
      'grid gap-4 sm:gap-6',
      columnClasses[columns],
      className
    )}>
      {children}
    </div>
  )
}

FormGrid.displayName = "FormGrid"

export { FormContainer, FormContent, FormHeader, FormGrid }
