import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const EmptyState = ({ icon, title, description, buttonText, onButtonClick, actionButton, message }) => {
  // Instanciar el componente del icono si es un componente
  const IconComponent = icon;
  const iconElement = IconComponent && typeof IconComponent !== 'string' ? (
    <IconComponent className="w-16 h-16 text-slate-400" aria-hidden="true" />
  ) : null;

  // Usar message si description no está disponible (para compatibilidad)
  const displayDescription = description || message;

  return (
    <div className="text-center p-12 animate-fadeIn">
      <div className="flex justify-center mb-6">
        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-md">
          {iconElement}
        </div>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-3">{title}</h2>
      <p className="text-base text-slate-600 max-w-md mx-auto leading-relaxed">{displayDescription}</p>
      {actionButton && (
        <div className="mt-8">
          {actionButton}
        </div>
      )}
      {buttonText && onButtonClick && (
        <Button
          onClick={onButtonClick}
          variant="secondary"
          className="mt-8 rounded-xl shadow-lg hover:shadow-xl"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;