import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoadingSpinner = ({ size = 'default', className, text }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <Loader2 className={cn(
          "animate-spin text-primary-600",
          sizeClasses[size]
        )} />
        <div className={cn(
          "absolute inset-0 animate-ping opacity-20 text-primary-400",
          sizeClasses[size]
        )}>
          <Loader2 className="w-full h-full" />
        </div>
      </div>

      {text && (
        <p className="text-sm font-medium text-neutral-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export { LoadingSpinner };
