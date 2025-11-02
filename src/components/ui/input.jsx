
import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--neutral-60)]">
          {React.cloneElement(icon, { className: 'h-5 w-5' })}
        </div>
      )}
      <input
        type={type}
        className={cn(
          'flex h-12 w-full px-4 py-3 rounded-xl bg-white border-2 border-[var(--neutral-10)] text-[var(--neutral-100)] placeholder:text-[var(--neutral-50)] text-sm focus:outline-none focus:border-[var(--primary-50)] focus:ring-4 focus:ring-[var(--primary-00)] disabled:bg-[var(--neutral-10)] disabled:cursor-not-allowed transition-all duration-200',
          icon ? 'pl-12' : 'px-4',
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
