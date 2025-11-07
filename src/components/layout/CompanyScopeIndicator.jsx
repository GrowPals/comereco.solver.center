import React, { useState, useEffect } from 'react';
import { Building, Globe, X } from 'lucide-react';
import { useCompanyScope } from '@/context/CompanyScopeContext';
import { cn } from '@/lib/utils';

/**
 * CompanyScopeIndicator - Floating banner that shows active company scope
 *
 * Displays a transient "Mostrando: [company name]" chip when a specific company
 * is selected (not global view). Features clean gradient + crisp edge with
 * solid shadow (no blurry glows).
 */
const CompanyScopeIndicator = () => {
  const { companies, activeCompanyId, isGlobalView } = useCompanyScope();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Get active company name
  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const shouldShow = !isGlobalView && activeCompany && !isDismissed;

  // Animación de entrada/salida
  useEffect(() => {
    if (shouldShow) {
      // Pequeño delay para la animación de entrada
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [shouldShow]);

  // Reset dismissed state when company changes
  useEffect(() => {
    setIsDismissed(false);
  }, [activeCompanyId, isGlobalView]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300); // Wait for exit animation
  };

  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        'fixed left-1/2 top-20 z-30 -translate-x-1/2 transition-all duration-300 lg:top-24',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      )}
    >
      <div className="scope-indicator-banner flex items-center gap-3 px-5 py-3">
        {/* Compact badge icon with clean gradient, no inner shadows */}
        <div className="scope-indicator-badge">
          <Building className="h-4 w-4" />
        </div>

        {/* Typography in Spanish */}
        <div className="flex flex-col">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-primary-600/80 dark:text-primary-300/80">
            Mostrando
          </span>
          <span className="text-sm font-bold text-foreground">
            {activeCompany.name}
          </span>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="ml-2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary-100/50 hover:text-primary-700 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
          aria-label="Cerrar indicador"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CompanyScopeIndicator;
