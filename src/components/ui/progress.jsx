import React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

/**
 * Progress Component - Modern Pastel Design System
 *
 * Barras de progreso con gradientes pastel sutiles, sin sombras
 * Colores semánticos para diferentes contextos
 */

const Progress = React.forwardRef(
  ({ className, value, variant = 'default', showLabel = false, label, ...props }, ref) => {
    const variants = {
      default: 'bg-gradient-primary',
      success: 'bg-gradient-success',
      warning: 'bg-gradient-warning',
      error: 'bg-gradient-error',
    };

    return (
      <div className="space-y-2">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            'relative h-3 w-full overflow-hidden rounded-full',
            'bg-muted/40',
            'border border-border/50',
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              'h-full w-full flex-1',
              'transition-all duration-500 ease-out',
              'rounded-full',
              variants[variant]
            )}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
          />
        </ProgressPrimitive.Root>

        {showLabel && (
          <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
            <span>{label || 'Progreso'}</span>
            <span className="font-semibold text-foreground">{value}%</span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
