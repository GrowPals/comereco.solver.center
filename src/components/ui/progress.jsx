import React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

const Progress = React.forwardRef(({ className, value, variant = 'default', showLabel = false, ...props }, ref) => {
  // Gradientes pastel - sin sombras
  const variants = {
    default: 'bg-gradient-to-r from-primary/80 to-primary/60',
    success: 'bg-gradient-to-r from-emerald-400/80 to-emerald-300/60 dark:from-emerald-400/70 dark:to-emerald-500/50',
    warning: 'bg-gradient-to-r from-amber-400/80 to-amber-300/60 dark:from-amber-400/70 dark:to-amber-500/50',
    error: 'bg-gradient-to-r from-rose-400/80 to-rose-300/60 dark:from-rose-400/70 dark:to-rose-500/50'
  };

  const labelColors = {
    default: 'text-muted-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-rose-600 dark:text-rose-400'
  };

  return (
    <div className="space-y-2">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          // Base styles - rounded-full, fondo bg-muted, sin sombras
          'relative h-3 w-full overflow-hidden rounded-full bg-muted/30 dark:bg-muted/20',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            // Transición fluida, sin sombras, gradiente pastel
            'h-full w-full flex-1 transition-all duration-500 ease-out rounded-full',
            variants[variant]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>

      {showLabel && (
        <div className={cn(
          "flex justify-between text-xs font-medium",
          labelColors[variant]
        )}>
          <span>Progreso</span>
          <span>{value}%</span>
        </div>
      )}
    </div>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
