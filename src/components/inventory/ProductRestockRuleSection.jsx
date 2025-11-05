import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  ClipboardCheck,
  GaugeCircle,
  PauseCircle,
  PlayCircle,
  Settings2,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RestockRuleForm } from '@/components/inventory/RestockRuleForm';
import { useRestockRule, useRestockRuleMutations } from '@/hooks/useRestockRules';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useToast } from '@/components/ui/useToast';
import { getAllProjects } from '@/services/projectService';
import { cn } from '@/lib/utils';

const STATUS_TOKENS = {
  active: {
    label: 'Regla activa',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  },
  paused: {
    label: 'Regla pausada',
    className: 'bg-amber-50 text-amber-700 border border-amber-200'
  }
};

export const ProductRestockRuleSection = ({ product, stock }) => {
  const { canManageRestockRules } = useUserPermissions();
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState('general');

  const productId = product?.id;
  const projectIdFilter = selectedScope === 'general' ? null : selectedScope;

  const { data: rule, isLoading: isRuleLoading } = useRestockRule({ productId, projectId: projectIdFilter });
  const {
    saveRule,
    toggleRuleStatus,
    deleteRule,
    isSaving,
    isToggling,
    isDeleting
  } = useRestockRuleMutations({ productId, projectId: projectIdFilter });

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects', 'product-restock'],
    queryFn: getAllProjects,
    enabled: canManageRestockRules,
    staleTime: 1000 * 60 * 10
  });

  const projects = projectsData ?? [];

  const scopeOptions = useMemo(
    () => [{ id: 'general', name: 'Regla general' }, ...projects.map((project) => ({ id: project.id, name: project.name }))],
    [projects]
  );

  useEffect(() => {
    if (selectedScope !== 'general' && !scopeOptions.find((scope) => scope.id === selectedScope)) {
      setSelectedScope('general');
    }
  }, [scopeOptions, selectedScope]);

  const isBelowMinimum = useMemo(() => {
    if (!rule || rule.status !== 'active') return false;
    if (!Number.isFinite(stock)) return false;
    return stock <= rule.min_stock;
  }, [rule, stock]);

  const handleSaveRule = async (formValues) => {
    try {
      await saveRule({
        id: rule?.id,
        productId,
        projectId: formValues.projectId,
        minStock: formValues.minStock,
        reorderQuantity: formValues.reorderQuantity,
        status: formValues.status,
        notes: formValues.notes,
        preferredVendor: formValues.preferredVendor,
        preferredWarehouse: formValues.preferredWarehouse
      });
      toast({
        title: 'Regla guardada',
        description: 'La configuración de reabastecimiento se actualizó correctamente.',
        variant: 'success'
      });
      setDialogOpen(false);
      setSelectedScope(formValues.projectId === null ? 'general' : formValues.projectId);
    } catch (error) {
      toast({ title: 'No se pudo guardar la regla', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async () => {
    if (!rule) return;
    const nextStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      await toggleRuleStatus({ ruleId: rule.id, nextStatus });
      toast({
        title: nextStatus === 'active' ? 'Regla activada' : 'Regla pausada',
        description:
          nextStatus === 'active'
            ? 'La automatización volverá a monitorear este producto.'
            : 'La regla permanecerá inactiva hasta que la reactives.',
        variant: 'success'
      });
    } catch (error) {
      toast({ title: 'No se pudo actualizar el estado', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteRule = async () => {
    if (!rule) return;
    try {
      await deleteRule(rule.id);
      toast({ title: 'Regla eliminada', description: 'Puedes crear una nueva cuando la necesites.', variant: 'success' });
      setDeleteOpen(false);
      setSelectedScope('general');
    } catch (error) {
      toast({ title: 'No se pudo eliminar la regla', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <section id="restock-rule" className="mt-16">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                  <Settings2 className="h-5 w-5 text-slate-600" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Automatización</p>
                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Regla de reabastecimiento</h2>
                </div>
              </div>
              <p className="text-sm text-slate-600 max-w-xl">
                Define el stock mínimo y la cantidad a solicitar para que la automatización externa (n8n) genere
                requisiciones cuando este producto llegue a niveles críticos.
              </p>
            </div>

            {canManageRestockRules && scopeOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Alcance</p>
                <div className="flex flex-wrap gap-2">
                  {scopeOptions.map((option) => {
                    const isActive = selectedScope === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedScope(option.id)}
                        className={cn(
                          'rounded-full border px-4 py-2 text-sm font-medium transition-all',
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        )}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isRuleLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-3xl" />
                ))}
              </div>
            ) : rule ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={cn('px-4 py-1 text-sm font-semibold uppercase tracking-wide', STATUS_TOKENS[rule.status]?.className)}>
                    {STATUS_TOKENS[rule.status]?.label}
                  </Badge>
                  <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    <Activity className="h-4 w-4" /> Última actualización {new Date(rule.updated_at).toLocaleString('es-MX')}
                  </span>
                </div>

                {isBelowMinimum && (
                  <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-700">Stock en nivel crítico</p>
                      <p className="text-sm text-amber-700/90">
                        Quedan {stock ?? 0} unidades y el mínimo configurado es {rule.min_stock}. La automatización debería
                        generar una requisición en la próxima ejecución.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <MetricCard icon={GaugeCircle} label="Stock mínimo" value={`${rule.min_stock} unidades`} />
                  <MetricCard icon={ClipboardCheck} label="Cantidad a solicitar" value={`${rule.reorder_quantity} unidades`} />
                  <MetricCard label="Proveedor sugerido" value={rule.preferred_vendor || 'Sin definir'} />
                  <MetricCard label="Almacén sugerido" value={rule.preferred_warehouse || 'Sin definir'} />
                </div>

                {rule.notes && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Notas internas</p>
                    <p className="mt-2 text-sm text-slate-700">{rule.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState onConfigure={() => setDialogOpen(true)} disabled={!canManageRestockRules} />
            )}
          </div>

          <aside className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-5">
            <h3 className="text-sm font-semibold text-slate-900">Acciones rápidas</h3>
            <p className="text-xs text-slate-600">
              Ajusta la configuración de reabastecimiento sin salir de la página del producto.
            </p>

            {canManageRestockRules ? (
              <>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full">
                      Configurar regla
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{rule ? 'Editar regla de reabastecimiento' : 'Crear regla de reabastecimiento'}</DialogTitle>
                      <DialogDescription>
                        Define el stock mínimo, la cantidad a solicitar y el alcance de la regla para este producto.
                      </DialogDescription>
                    </DialogHeader>
                    <RestockRuleForm
                      rule={rule}
                      projects={projects}
                      onSubmit={handleSaveRule}
                      onCancel={() => setDialogOpen(false)}
                      isSubmitting={isSaving}
                    />
                    {isLoadingProjects && <p className="text-xs text-slate-500">Cargando proyectos disponibles...</p>}
                  </DialogContent>
                </Dialog>

                {rule && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-2"
                    onClick={handleToggleStatus}
                    disabled={isToggling}
                  >
                    {rule.status === 'active' ? (
                      <>
                        <PauseCircle className="h-4 w-4" /> Pausar regla
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" /> Activar regla
                      </>
                    )}
                  </Button>
                )}

                {rule && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </Button>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Contacta a un administrador para configurar el reabastecimiento automático de este producto.
              </p>
            )}

            <ConfirmDialog
              open={isDeleteOpen}
              onOpenChange={setDeleteOpen}
              title="Eliminar regla"
              description="Esta acción eliminará la regla actual y la automatización dejará de monitorear este producto."
              confirmText="Eliminar"
              variant="destructive"
              isLoading={isDeleting}
              onConfirm={handleDeleteRule}
            />
          </aside>
        </div>
      </div>
    </section>
  );
};

const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
      {Icon ? <Icon className="h-5 w-5 text-slate-600" /> : <GaugeCircle className="h-5 w-5 text-slate-600" />}
    </span>
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  </div>
);

const EmptyState = ({ onConfigure, disabled }) => (
  <div className="flex flex-col gap-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6">
    <div className="flex items-center gap-3 text-slate-600">
      <ClipboardCheck className="h-5 w-5" />
      <p className="text-sm">
        Aún no hay una regla configurada para este producto. Define un stock mínimo y la cantidad a solicitar para que la
        automatización pueda ejecutarse.
      </p>
    </div>
    <Button onClick={onConfigure} disabled={disabled} className="w-fit">
      Crear regla
    </Button>
  </div>
);

