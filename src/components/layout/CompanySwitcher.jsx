import React, { useState, useEffect } from 'react';
import { Building2, Globe2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCompanyScope } from '@/context/CompanyScopeContext';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';

const CompanySwitcher = ({ variant = 'default' }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();
  const {
    companies,
    activeCompanyId,
    isGlobalView,
    canViewAllCompanies,
    setActiveCompanyId,
    toggleGlobalView,
    isLoading,
  } = useCompanyScope();

  // Efecto de animación al cambiar empresa
  useEffect(() => {
    if (activeCompanyId !== null || isGlobalView) {
      setIsChanging(true);
      const timer = setTimeout(() => setIsChanging(false), 600);
      return () => clearTimeout(timer);
    }
  }, [activeCompanyId, isGlobalView]);

  if (!companies.length && isLoading) {
    // En variante icon, no mostrar nada mientras carga
    if (variant === 'icon') return null;

    return (
      <div className="company-switcher-pill opacity-60">
        <div className="company-switcher-badge-icon">
          <Building2 className="icon-sm animate-pulse text-white" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  // Si el usuario no puede ver todas las empresas (no es admin/dev)
  if (!canViewAllCompanies) {
    // En variante icon, no mostrar nada (el selector es solo para admins)
    if (variant === 'icon') return null;

    // En variante default, mostrar la empresa asignada (solo lectura)
    const companyName = companies[0]?.name || 'Empresa no asignada';
    return (
      <div className="company-switcher-pill cursor-default">
        <div className="company-switcher-badge-icon">
          <Building2 className="icon-sm text-white" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Empresa
          </span>
          <span className="truncate text-sm font-bold text-foreground">
            {companyName}
          </span>
        </div>
      </div>
    );
  }

  const handleChange = (value) => {
    const isChangingToGlobal = value === 'all';
    const selectedCompany = companies.find(c => c.id === value);

    if (isChangingToGlobal) {
      toggleGlobalView(true);
      setActiveCompanyId(null);
      toast({
        title: 'Vista Global Activada',
        description: 'Ahora estás viendo datos de todas las empresas.',
        variant: 'success'
      });
    } else {
      toggleGlobalView(false);
      setActiveCompanyId(value);
      toast({
        title: 'Empresa Cambiada',
        description: `Ahora estás viendo: ${selectedCompany?.name || 'la empresa seleccionada'}`,
        variant: 'success'
      });
    }

    // Cerrar el dialog después de seleccionar (solo en variante icon)
    if (variant === 'icon') {
      setIsDialogOpen(false);
    }
  };

  const selectValue = isGlobalView ? 'all' : activeCompanyId || 'all';

  // Obtener el nombre de la empresa activa para mostrar en el dialog
  const activeCompanyName = isGlobalView
    ? 'Todas las empresas'
    : companies.find(c => c.id === activeCompanyId)?.name || 'Selecciona una empresa';

  // Variante de ícono para móvil - Badge visual mejorado
  if (variant === 'icon') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsDialogOpen(true)}
                className={cn(
                  'company-switcher-icon',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                  isChanging && 'ring-2 ring-primary-500/50 ring-offset-2 ring-offset-background'
                )}
                aria-label="Selector de empresa"
              >
                <div className={cn(
                  'company-switcher-badge-icon',
                  isGlobalView && 'company-switcher-badge-icon--global',
                  isChanging && 'scale-110'
                )}>
                  {isGlobalView ? (
                    <Globe2 className={cn('icon-sm text-white transition-transform duration-300', isChanging && 'scale-110')} />
                  ) : (
                    <Building2 className={cn('icon-sm text-white transition-transform duration-300', isChanging && 'scale-110')} />
                  )}
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs font-medium">
                {isGlobalView ? 'Vista global' : activeCompanyName}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-bold">Cambiar Empresa</DialogTitle>
              <DialogDescription className="text-sm">
                Selecciona la empresa que deseas gestionar
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              {/* Vista actual */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className={cn(
                  'company-switcher-badge-icon',
                  isGlobalView && 'company-switcher-badge-icon--global',
                  'w-10 h-10'
                )}>
                  {isGlobalView ? (
                    <Globe2 className="icon-md text-white" />
                  ) : (
                    <Building2 className="icon-md text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Vista actual
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {activeCompanyName}
                  </p>
                </div>
              </div>

              {/* Selector */}
              <Select value={selectValue} onValueChange={handleChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">
                    <div className="flex items-center gap-3 py-1">
                      <div className="company-switcher-badge-icon company-switcher-badge-icon--global">
                        <Globe2 className="icon-sm text-white" />
                      </div>
                      <span className="font-medium">Todas las empresas</span>
                    </div>
                  </SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-3 py-1">
                        <div className="company-switcher-badge-icon">
                          <Building2 className="icon-sm text-white" />
                        </div>
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Variante default para desktop - Diseño limpio y elegante
  return (
    <div
      className={cn(
        'company-switcher-pill group',
        isChanging && 'ring-2 ring-primary-500/50 ring-offset-2 ring-offset-background'
      )}
    >
      {/* Badge visual */}
      <div className={cn(
        'company-switcher-badge-icon',
        isGlobalView && 'company-switcher-badge-icon--global',
        isChanging && 'scale-110'
      )}>
        {isGlobalView ? (
          <Globe2 className="icon-sm text-white" />
        ) : (
          <Building2 className="icon-sm text-white" />
        )}
      </div>

      {/* Selector y label */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {isGlobalView ? 'Vista global' : 'Empresa'}
        </span>
        <Select value={selectValue} onValueChange={handleChange}>
          <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-sm font-bold text-foreground shadow-none hover:text-primary-600 focus:ring-0 focus:ring-offset-0 dark:hover:text-primary-400">
            <SelectValue
              placeholder="Selecciona una empresa"
              className="truncate"
            />
          </SelectTrigger>
          <SelectContent className="max-h-64 min-w-[280px]">
            <SelectItem value="all">
              <div className="flex items-center gap-3 py-1">
                <div className="company-switcher-badge-icon company-switcher-badge-icon--global">
                  <Globe2 className="icon-sm text-white" />
                </div>
                <span className="font-medium">Todas las empresas</span>
              </div>
            </SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-3 py-1">
                  <div className="company-switcher-badge-icon">
                    <Building2 className="icon-sm text-white" />
                  </div>
                  <span className="font-medium">{company.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CompanySwitcher;
