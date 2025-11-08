import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_ICON_CLASSES = 'h-10 w-10 text-primary-500 dark:text-primary-200';

const EmptyState = ({ icon, title, description, buttonText, onButtonClick, actionButton, message }) => {
  const renderIcon = () => {
    if (!icon || typeof icon === 'string') return null;

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: cn(DEFAULT_ICON_CLASSES, icon.props.className),
      });
    }

    const IconComponent = icon;
    return <IconComponent className={DEFAULT_ICON_CLASSES} aria-hidden="true" />;
  };

  const displayDescription = description || message;
  const iconElement = renderIcon();

  return (
    <div className="space-y-4 text-center">
      {iconElement && (
        <div className="flex justify-center">
          {iconElement}
        </div>
      )}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground" role="heading" aria-level="2">{title}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{displayDescription}</p>
      </div>
      {actionButton && (
        <div className="pt-2">
          {actionButton}
        </div>
      )}
      {buttonText && onButtonClick && (
        <Button
          onClick={onButtonClick}
          variant="secondary"
          className="mt-2 rounded-xl"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" aria-hidden="true" /> {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
