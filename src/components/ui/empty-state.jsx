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
  // Instanciar el componente del icono si existe
  const ActionIcon = action?.icon;
  
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      {Icon && (
        <div className="icon-badge mb-6 flex h-20 w-20 items-center justify-center text-primary-600 dark:text-primary-100">
          <Icon className="h-10 w-10" />
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
          {ActionIcon && <ActionIcon className="mr-2 h-5 w-5" />}
          {action.label}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };
