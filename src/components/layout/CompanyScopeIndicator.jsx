import React, { useEffect, useState } from 'react';
import { Building2, Globe } from 'lucide-react';
import { useCompanyScope } from '@/context/CompanyScopeContext';
import { cn } from '@/lib/utils';

const DISPLAY_DURATION = 1600;

const CompanyScopeIndicator = () => {
  const { activeCompany, isGlobalView, isLoading } = useCompanyScope();
  const [indicator, setIndicator] = useState({ label: '', mode: 'company', visible: false, key: 0 });

  useEffect(() => {
    if (isLoading) return;

    const label = isGlobalView
      ? 'Todas las empresas'
      : activeCompany?.name || 'Empresa seleccionada';

    setIndicator({
      label,
      mode: isGlobalView ? 'global' : 'company',
      visible: true,
      key: Date.now(),
    });
  }, [activeCompany?.id, activeCompany?.name, isGlobalView, isLoading]);

  useEffect(() => {
    if (!indicator.visible) return;

    const timeout = setTimeout(() => {
      setIndicator((prev) => ({ ...prev, visible: false }));
    }, DISPLAY_DURATION);

    return () => clearTimeout(timeout);
  }, [indicator.key, indicator.visible]);

  if (!indicator.label) {
    return null;
  }

  const Icon = indicator.mode === 'global' ? Globe : Building2;

  return (
    <div
      className={cn(
        'pointer-events-none fixed top-24 left-1/2 z-[60] -translate-x-1/2 transform transition-all duration-300',
        indicator.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      )}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-2xl backdrop-blur dark:border-border/60 dark:bg-background/80">
        <Icon className="h-4 w-4 text-primary-500" />
        <span>
          Mostrando: <span className="font-semibold">{indicator.label}</span>
        </span>
      </div>
    </div>
  );
};

CompanyScopeIndicator.displayName = 'CompanyScopeIndicator';

export default CompanyScopeIndicator;
