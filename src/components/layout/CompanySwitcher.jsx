import React from 'react';
import { Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyScope } from '@/context/CompanyScopeContext';

const CompanySwitcher = () => {
  const {
    companies,
    activeCompanyId,
    isGlobalView,
    canViewAllCompanies,
    setActiveCompanyId,
    toggleGlobalView,
    isLoading,
  } = useCompanyScope();

  if (!companies.length && isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground">
        <Building className="h-4 w-4 animate-pulse" />
        Cargando empresas...
      </div>
    );
  }

  if (!canViewAllCompanies) {
    const companyName = companies[0]?.name || 'Empresa no asignada';
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
        <Building className="h-4 w-4 text-muted-foreground" />
        {companyName}
      </div>
    );
  }

  const handleChange = (value) => {
    if (value === 'all') {
      toggleGlobalView(true);
      setActiveCompanyId(null);
      return;
    }
    toggleGlobalView(false);
    setActiveCompanyId(value);
  };

  const selectValue = isGlobalView ? 'all' : activeCompanyId || 'all';

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
      <Building className="h-4 w-4 text-primary-600" />
      <Select value={selectValue} onValueChange={handleChange}>
        <SelectTrigger className="border-0 bg-transparent px-0 text-sm font-medium">
          <SelectValue placeholder="Selecciona una empresa" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <SelectItem value="all">Todas las empresas</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySwitcher;
