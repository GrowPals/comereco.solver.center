import React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

const Progress = React.forwardRef(({ className, value, variant = 'default', showLabel = false, ...props }, ref) => {
  const variants = {
    default: 'bg-gradient-primary',
    success: 'bg-gradient-success',
    warning: 'bg-gradient-warning',
    error: 'bg-gradient-error'
  };

  return (
    <div className="space-y-2">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative h-3 w-full overflow-hidden rounded-full bg-neutral-200',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 transition-all duration-500 ease-out shadow-sm',
            variants[variant]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>

      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-neutral-600">
          <span>Progreso</span>
          <span>{value}%</span>
        </div>
      )}
    </div>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
