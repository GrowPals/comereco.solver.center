import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const EmptyState = ({ icon, title, description, buttonText, onButtonClick }) => {
  return (
    <div className="text-center p-8 bg-card rounded-lg shadow-sm border border-dashed animate-fadeIn">
      <div className="text-muted-foreground flex justify-center mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-bold mt-4 text-foreground">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">{description}</p>
      {buttonText && onButtonClick && (
        <Button 
          onClick={onButtonClick} 
          variant="secondary" 
          className="mt-6 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;