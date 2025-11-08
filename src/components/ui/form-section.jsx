import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * FormSection - Groups related form fields with a header
 *
 * Features:
 * - Clear visual separation between sections
 * - Optional description
 * - Responsive spacing
 * - Icon support
 */
const FormSection = ({
  title,
  description,
  icon,
  children,
  className,
  headerClassName,
  contentClassName
}) => {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className={cn('space-y-1', headerClassName)}>
          {title && (
            <div className="flex items-center gap-2">
              {icon && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {React.cloneElement(icon, { className: "h-4 w-4" })}
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground">
                {title}
              </h3>
            </div>
          )}
          {description && (
            <p className={cn(
              "text-sm text-muted-foreground",
              icon && "ml-10"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
      <div className={cn('space-y-4', contentClassName)}>
        {children}
      </div>
    </section>
  )
}

FormSection.displayName = "FormSection"

/**
 * FormSectionDivider - Visual separator between form sections
 */
const FormSectionDivider = ({ className }) => {
  return (
    <div className={cn('my-8 border-t border-border/50', className)} />
  )
}

FormSectionDivider.displayName = "FormSectionDivider"

export { FormSection, FormSectionDivider }
