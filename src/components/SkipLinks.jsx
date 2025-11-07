/**
 * Skip Links Component
 * Permite a usuarios de teclado saltar al contenido principal
 */
import React from 'react';
import { cn } from '@/lib/utils';

const SkipLinks = () => {
  return (
    <div className="skip-links">
      <a 
        href="#main-content" 
        className={cn(
          "skip-link",
          "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4",
          "focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500",
          "focus:text-white focus:rounded-md focus:shadow-soft-md",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        )}
      >
        Saltar al contenido principal
      </a>
      <a
        href="#navigation"
        className={cn(
          "skip-link",
          "sr-only focus:not-sr-only focus:absolute focus:top-16 focus:left-4",
          "focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500",
          "focus:text-white focus:rounded-md focus:shadow-soft-md",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        )}
      >
        Saltar a navegación
      </a>
    </div>
  );
};

export default SkipLinks;

