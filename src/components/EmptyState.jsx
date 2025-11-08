import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const baseIconClasses = 'h-16 w-16 text-muted-foreground';

const EmptyState = ({ icon, title, description, buttonText, onButtonClick, actionButton, message }) => {
  const IconComponent = typeof icon === 'string' ? null : icon;

  let iconElement = null;

  if (React.isValidElement(icon)) {
    iconElement = React.cloneElement(icon, {
      className: cn(baseIconClasses, icon.props.className),
      'aria-hidden': true,
    });
  } else if (IconComponent) {
    iconElement = <IconComponent className={baseIconClasses} aria-hidden="true" />;
  }

  // Usar message si description no está disponible (para compatibilidad)
  const displayDescription = description || message;

  return (
    <div className="animate-fadeIn p-12 text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted/60 shadow-md dark:bg-card/70">
          {iconElement}
        </div>
      </div>
      <h2 className="mb-3 heading-3" role="heading" aria-level="2">{title}</h2>
      <p className="mx-auto max-w-md text-secondary">{displayDescription}</p>
      {actionButton && (
        <div className="mt-8">
          {actionButton}
        </div>
      )}
      {buttonText && onButtonClick && (
        <Button
          onClick={onButtonClick}
          variant="secondary"
          className="mt-8 rounded-xl shadow-soft-md hover:shadow-soft-lg"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
