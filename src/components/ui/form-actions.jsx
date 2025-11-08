import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * FormActions - Sticky action buttons container for forms
 *
 * Features:
 * - Sticky to bottom on mobile
 * - Responsive layout (column on mobile, row on desktop)
 * - Shadow and backdrop blur for better visibility
 * - Safe area support for mobile devices
 */
const FormActions = ({
  children,
  sticky = true,
  className,
  primaryAction,
  secondaryAction,
  cancelAction
}) => {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-3 border-t border-border/80 bg-card/95 px-4 py-4 backdrop-blur-sm sm:flex-row sm:justify-between sm:px-6',
        sticky && 'fixed bottom-0 left-0 right-0 z-30 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.4)] sm:sticky',
        // Safe area padding for mobile devices with notches
        sticky && 'pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4',
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            {cancelAction && (
              <Button
                type="button"
                variant="ghost"
                onClick={cancelAction.onClick}
                disabled={cancelAction.disabled}
                className="w-full sm:w-auto"
              >
                {cancelAction.label || 'Cancelar'}
              </Button>
            )}
            {secondaryAction && (
              <Button
                type="button"
                variant="outline"
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                className="w-full sm:w-auto"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
          {primaryAction && (
            <Button
              type={primaryAction.type || 'submit'}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              isLoading={primaryAction.isLoading}
              className="w-full sm:w-auto sm:min-w-[120px]"
            >
              {primaryAction.label || 'Guardar'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

FormActions.displayName = "FormActions"

export { FormActions }
