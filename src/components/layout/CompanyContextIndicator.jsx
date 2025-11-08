import React from 'react';
import { Building2, Globe2 } from 'lucide-react';
import { useCompanyScope } from '@/context/CompanyScopeContext';
import { cn } from '@/lib/utils';

/**
 * CompanyContextIndicator - Indicador persistente y sutil del contexto de empresa
 *
 * Se muestra de forma constante en páginas clave (dashboards, listados) para recordar
 * en qué empresa se está trabajando. Es especialmente útil en sistemas multi-tenant.
 *
 * @param {Object} props
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.showIcon - Mostrar icono (default: true)
 * @param {boolean} props.compact - Versión compacta (default: false)
 */
const CompanyContextIndicator = ({ className, showIcon = true, compact = false }) => {
  const { companies, activeCompanyId, isGlobalView, canViewAllCompanies } = useCompanyScope();

  // Solo mostrar si el usuario puede cambiar de empresa (dev/admin)
  if (!canViewAllCompanies) return null;

  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const companyName = isGlobalView ? 'Todas las empresas' : (activeCompany?.name || 'Sin empresa');

  if (compact) {
    return (
      <div className={cn('company-context-indicator compact', className)}>
        {showIcon && (
          <div className="company-context-indicator-badge">
            {isGlobalView ? (
              <Globe2 className="h-3.5 w-3.5" />
            ) : (
              <Building2 className="h-3.5 w-3.5" />
            )}
          </div>
        )}
        <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
          {companyName}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('company-context-indicator', className)}>
      {showIcon && (
        <div className="company-context-indicator-badge">
          {isGlobalView ? (
            <Globe2 className="h-4 w-4" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Contexto
        </span>
        <span className="text-sm font-semibold text-foreground">
          {companyName}
        </span>
      </div>
    </div>
  );
};

export default CompanyContextIndicator;
