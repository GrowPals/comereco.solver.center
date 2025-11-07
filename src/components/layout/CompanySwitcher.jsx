import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
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
      <div className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground">
        <Building className="h-4 w-4 animate-pulse" />
        Cargando empresas...
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
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
        <Building className="h-4 w-4 text-muted-foreground" />
        {companyName}
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

  // Variante de ícono para móvil
  if (variant === 'icon') {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className={cn(
                  'relative h-11 w-11 overflow-visible rounded-full border border-border bg-[var(--surface-contrast)] shadow-none hover:bg-[var(--surface-muted)]',
                  'transition-all duration-300',
                  isChanging && 'ring-2 ring-primary-400/50 ring-offset-2 ring-offset-background'
                )}
                aria-label="Selector de empresa"
              >
                <Building
                  className={cn(
                    'h-5 w-5 text-primary-600 transition-transform duration-300',
                    isChanging && 'scale-110'
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cambiar empresa</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Seleccionar Empresa</DialogTitle>
              <DialogDescription>
                Empresa actual: <span className="font-semibold text-foreground">{activeCompanyName}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Select value={selectValue} onValueChange={handleChange}>
                <SelectTrigger className="w-full">
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
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Variante default para desktop
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 transition-all duration-300',
      isChanging && 'ring-2 ring-primary-400/50 ring-offset-2 ring-offset-background'
    )}>
      <Building
        className={cn(
          'h-4 w-4 text-primary-600 transition-transform duration-300',
          isChanging && 'scale-110'
        )}
      />
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
