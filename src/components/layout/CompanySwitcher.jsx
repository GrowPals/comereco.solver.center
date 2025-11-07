import React, { useState, useEffect } from 'react';
import { Building, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
      <div className="flex items-center gap-3 rounded-full border border-primary-200/50 bg-white/80 px-4 py-2.5 text-sm text-primary-600 shadow-sm dark:border-primary-500/30 dark:bg-[rgba(20,33,61,0.85)]">
        <div className="company-badge-icon">
          <Building className="h-4 w-4 animate-pulse" />
        </div>
        <span className="font-medium">Cargando...</span>
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
      <div className="flex min-w-[260px] max-w-[300px] items-center gap-3 rounded-full border border-primary-200/50 bg-white/80 px-4 py-2.5 shadow-sm dark:border-primary-500/30 dark:bg-[rgba(20,33,61,0.85)]">
        <div className="company-badge-icon">
          <Building className="h-4 w-4" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-primary-600/70 dark:text-primary-300/70">
            Empresa activa
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

  // Variante de ícono para móvil - Solo mostrar el badge icon (más legible que un punto)
  if (variant === 'icon') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsDialogOpen(true)}
                className={cn(
                  'company-badge-icon',
                  'h-11 w-11 cursor-pointer transition-all duration-300',
                  isChanging && 'ring-2 ring-primary-400/50 ring-offset-2 ring-offset-background dark:ring-cyan-400/60'
                )}
                aria-label="Selector de empresa"
              >
                {isGlobalView ? (
                  <Globe className={cn('h-5 w-5 transition-transform duration-300', isChanging && 'scale-110')} />
                ) : (
                  <Building className={cn('h-5 w-5 transition-transform duration-300', isChanging && 'scale-110')} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">
                {isGlobalView ? 'Vista global' : activeCompanyName}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Seleccionar Empresa</DialogTitle>
              <DialogDescription className="text-sm">
                Vista actual: <span className="font-semibold text-foreground">{activeCompanyName}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Select value={selectValue} onValueChange={handleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Todas las empresas</span>
                    </div>
                  </SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{company.name}</span>
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

  // Variante default para desktop - Pill design con gradient badge
  return (
    <div
      className={cn(
        'flex min-w-[260px] max-w-[300px] items-center gap-3 rounded-full border border-primary-200/50 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-300',
        'dark:border-primary-500/30 dark:bg-[rgba(20,33,61,0.85)]',
        isChanging && 'ring-2 ring-primary-400/50 ring-offset-2 ring-offset-background dark:ring-cyan-400/60'
      )}
    >
      <div className={cn('company-badge-icon', isChanging && 'scale-110')}>
        {isGlobalView ? (
          <Globe className="h-4 w-4 transition-transform duration-300" />
        ) : (
          <Building className="h-4 w-4 transition-transform duration-300" />
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-primary-600/70 dark:text-primary-300/70">
          {isGlobalView ? 'Vista global' : 'Empresa activa'}
        </span>
        <Select value={selectValue} onValueChange={handleChange}>
          <SelectTrigger className="h-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 focus:ring-offset-0">
            <SelectValue
              placeholder="Selecciona una empresa"
              className="truncate text-sm font-bold text-foreground"
            />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Todas las empresas</span>
              </div>
            </SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{company.name}</span>
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
