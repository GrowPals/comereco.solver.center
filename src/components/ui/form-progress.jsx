import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

/**
 * FormProgress - Visual progress indicator for multi-step forms
 *
 * Features:
 * - Mobile-optimized horizontal stepper
 * - Shows completed, current, and upcoming steps
 * - Smooth animations
 * - Responsive text visibility
 */
const FormProgress = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar background */}
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-5 h-0.5 w-full bg-border/50" />

        {/* Progress fill */}
        <div
          className="absolute top-5 h-0.5 bg-primary-500 transition-all duration-500 ease-out"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep
            const isUpcoming = index > currentStep

            return (
              <div
                key={step.id || index}
                className="flex flex-col items-center gap-2"
              >
                {/* Step circle */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isCompleted && 'border-primary-500 bg-primary-500 text-white',
                    isCurrent && 'border-primary-500 bg-white text-primary-600 shadow-[0_0_0_4px_rgba(124,188,255,0.2)] dark:bg-card dark:shadow-[0_0_0_4px_rgba(124,188,255,0.15)]',
                    isUpcoming && 'border-border/50 bg-card text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step label - Hidden on mobile for middle steps */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors sm:text-sm',
                      (isCurrent || isCompleted) && 'text-foreground',
                      isUpcoming && 'text-muted-foreground',
                      // Hide middle step labels on mobile
                      index !== 0 && index !== steps.length - 1 && 'hidden sm:block'
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="mt-0.5 hidden text-xs text-muted-foreground md:block">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Current step indicator */}
      <div className="mt-6 flex items-center justify-center gap-2 sm:hidden">
        <span className="text-sm font-medium text-foreground">
          Paso {currentStep + 1} de {steps.length}:
        </span>
        <span className="text-sm text-muted-foreground">
          {steps[currentStep]?.label}
        </span>
      </div>
    </div>
  )
}

FormProgress.displayName = "FormProgress"

/**
 * FormProgressDots - Compact dot-based progress indicator
 * Alternative to FormProgress for simpler forms
 */
const FormProgressDots = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCurrent = index === currentStep
        const isCompleted = index < currentStep

        return (
          <button
            key={step.id || index}
            type="button"
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              isCurrent && 'w-8 bg-primary-500',
              isCompleted && 'w-2 bg-primary-500/60',
              !isCurrent && !isCompleted && 'w-2 bg-border/50'
            )}
            aria-label={`Paso ${index + 1}: ${step.label}`}
            aria-current={isCurrent ? 'step' : undefined}
          />
        )
      })}
    </div>
  )
}

FormProgressDots.displayName = "FormProgressDots"

export { FormProgress, FormProgressDots }
