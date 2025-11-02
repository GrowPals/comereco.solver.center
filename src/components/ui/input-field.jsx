import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const InputField = React.forwardRef(({ 
  label, 
  id, 
  error, 
  helperText,
  required,
  className,
  containerClassName,
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && (
        <Label htmlFor={inputId} className="block">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </Label>
      )}
      <Input
        id={inputId}
        ref={ref}
        className={cn(
          error && 'border-danger focus:ring-danger-500',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-danger mt-1.5">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-sm text-gray-500 mt-1.5">
          {helperText}
        </p>
      )}
    </div>
  );
});
InputField.displayName = 'InputField';

export { InputField };