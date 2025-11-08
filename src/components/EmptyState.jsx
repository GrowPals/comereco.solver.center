import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconWrapper } from '@/components/ui/icon-wrapper';

const EmptyState = ({ icon, title, description, buttonText, onButtonClick, actionButton, message }) => {
  const renderIcon = () => {
    if (!icon || typeof icon === 'string') return null;

    if (React.isValidElement(icon)) {
      return (
        <IconWrapper
          icon={icon.type}
          size={icon.props.size ?? '2xl'}
          variant={icon.props.variant ?? 'glass'}
          tone={icon.props.tone}
          glow={icon.props.glow ?? true}
          className={cn('empty-state-icon shadow-soft-lg', icon.props.wrapperClassName)}
          iconClassName={icon.props.className}
        />
      );
    }

    return (
      <IconWrapper
        icon={icon}
        size="2xl"
        variant="glass"
        glow
        className="empty-state-icon shadow-soft-lg"
      />
    );
  };

  const displayDescription = description || message;
  const iconElement = renderIcon();

  return (
    <div className="animate-fadeIn p-12 text-center">
      <div className="mb-6 flex justify-center">
        {iconElement ?? (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted/60 shadow-md dark:bg-card/70" />
        )}
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
