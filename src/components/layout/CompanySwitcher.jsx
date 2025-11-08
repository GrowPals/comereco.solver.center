import React, { useState, useEffect } from 'react';
import { Building2, Globe2, ChevronDown } from 'lucide-react';
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
    if (variant === 'icon') return null;

    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
        <Building2 className="h-5 w-5 animate-pulse text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  // Si el usuario no puede ver todas las empresas (no es admin/dev)
  if (!canViewAllCompanies) {
    if (variant === 'icon') return null;

    const companyName = companies[0]?.name || 'Empresa no asignada';
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
        <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <div className="flex flex-col">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Empresa
          </span>
          <span className="text-sm font-bold text-foreground">
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
        title: '🌍 Vista Global Activada',
        description: 'Mostrando datos de todas las empresas.',
        variant: 'success',
        duration: 3000
      });
    } else {
      toggleGlobalView(false);
      setActiveCompanyId(value);
      toast({
        title: '🏢 Contexto de Empresa Cambiado',
        description: `Ahora trabajas en: ${selectedCompany?.name || 'la empresa seleccionada'}.`,
        variant: 'success',
        duration: 3000
      });
    }

    if (variant === 'icon') {
      setIsDialogOpen(false);
    }
  };

  const selectValue = isGlobalView ? 'all' : activeCompanyId || 'all';

  const activeCompanyName = isGlobalView
    ? 'Todas las empresas'
    : companies.find(c => c.id === activeCompanyId)?.name || 'Selecciona una empresa';

  // Variante de ícono para móvil
  if (variant === 'icon') {
    const MobileIcon = isGlobalView ? Globe2 : Building2;

    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsDialogOpen(true)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 transition-all duration-200',
                  'hover:bg-muted/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                  isChanging && 'scale-105 ring-2 ring-primary-500/50'
                )}
                aria-label="Selector de empresa"
              >
                <MobileIcon className={cn(
                  'h-5 w-5 transition-all duration-300',
                  isGlobalView ? 'text-sky-600 dark:text-sky-400' : 'text-primary-600 dark:text-primary-400'
                )} />
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
                <MobileIcon className={cn(
                  'h-6 w-6',
                  isGlobalView ? 'text-sky-600 dark:text-sky-400' : 'text-primary-600 dark:text-primary-400'
                )} />
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
                      <Globe2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      <span className="font-medium">Todas las empresas</span>
                    </div>
                  </SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-3 py-1">
                        <Building2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
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

  // Variante default para desktop - diseño simple y limpio
  const Icon = isGlobalView ? Globe2 : Building2;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2 transition-all duration-200',
        'hover:bg-muted/50',
        isChanging && 'ring-2 ring-primary-500/50 ring-offset-2 ring-offset-background'
      )}
    >
      <Icon className={cn(
        'h-5 w-5 shrink-0 transition-all duration-300',
        isGlobalView ? 'text-sky-600 dark:text-sky-400' : 'text-primary-600 dark:text-primary-400',
        isChanging && 'scale-110'
      )} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {isGlobalView ? 'Vista global' : 'Empresa'}
        </span>
        <Select value={selectValue} onValueChange={handleChange}>
          <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-sm font-bold text-foreground shadow-none hover:text-primary-600 focus:ring-0 focus:ring-offset-0 dark:hover:text-primary-400">
            <div className="flex items-center gap-2">
              <SelectValue placeholder="Selecciona una empresa" />
              <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-64 min-w-[280px]">
            <SelectItem value="all">
              <div className="flex items-center gap-3 py-1">
                <Globe2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="font-medium">Todas las empresas</span>
              </div>
            </SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-3 py-1">
                  <Building2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
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
