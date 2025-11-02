import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      {Icon && (
        <div className="mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm">
          <Icon className="w-10 h-10 text-primary-600" />
        </div>
      )}

      {title && (
        <h3 className="text-xl font-bold text-neutral-900 mb-2">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-sm text-neutral-600 max-w-md mb-6">
          {description}
        </p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          size="lg"
          className="shadow-button hover:shadow-button-hover"
        >
          {action.icon && <action.icon className="mr-2 h-5 w-5" />}
          {action.label}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };
