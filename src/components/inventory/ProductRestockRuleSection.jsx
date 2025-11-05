import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RestockRuleForm } from '@/components/inventory/RestockRuleForm';
import { useRestockRule, useRestockRuleMutations } from '@/hooks/useRestockRules';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useToast } from '@/components/ui/useToast';
import { getAllProjects } from '@/services/projectService';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const STATUS_BADGES = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  paused: 'border-amber-200 bg-amber-50 text-amber-700'
};

export const ProductRestockRuleSection = ({ product, stock }) => {
  const { canManageRestockRules } = useUserPermissions();
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState('general');

  const productId = product?.id;
  const projectIdFilter = selectedScope === 'general' ? null : selectedScope;

  const { data: rule, isLoading } = useRestockRule({ productId, projectId: projectIdFilter });
  const {
    saveRule,
    toggleRuleStatus,
    deleteRule,
    isSaving,
    isToggling,
    isDeleting
  } = useRestockRuleMutations({ productId, projectId: projectIdFilter });

  const { data: projectsData = [] } = useQuery({
    queryKey: ['projects', 'product-restock'],
    queryFn: getAllProjects,
    enabled: canManageRestockRules,
    staleTime: 1000 * 60 * 10
  });

  const projects = Array.isArray(projectsData) ? projectsData : [];
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

  const formattedUpdatedAt = useMemo(() => {
    if (!rule?.updated_at) return null;
    return new Date(rule.updated_at).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [rule?.updated_at]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('es-MX'), []);

  const metrics = useMemo(() => {
    if (!rule) return [];

    const items = [
      {
        label: 'Alcance',
        value: rule.projects?.name || 'Regla general'
      },
      {
        label: 'Stock mínimo',
        value: `${numberFormatter.format(rule.min_stock ?? 0)} u`
      },
      {
        label: 'Cantidad a solicitar',
        value: `${numberFormatter.format(rule.reorder_quantity ?? 0)} u`
      }
    ];

    if (Number.isFinite(stock)) {
      items.push({
        label: 'Stock actual',
        value: `${numberFormatter.format(stock)} u`,
        tone: isBelowMinimum ? 'warning' : 'default'
      });
    }

    return items;
  }, [isBelowMinimum, numberFormatter, rule, stock]);

  const handleSave = async (values) => {
    try {
      await saveRule({
        id: rule?.id,
        productId,
        projectId: values.projectId,
        minStock: values.minStock,
        reorderQuantity: values.reorderQuantity,
        status: values.status,
        notes: values.notes,
        preferredVendor: values.preferredVendor,
        preferredWarehouse: values.preferredWarehouse
      });
      toast({ title: 'Regla guardada', description: 'Los parámetros se actualizaron correctamente.', variant: 'success' });
      setDialogOpen(false);
      setSelectedScope(values.projectId === null ? 'general' : values.projectId);
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
            : 'La regla permanecerá en pausa hasta reactivarla.',
        variant: 'success'
      });
    } catch (error) {
      toast({ title: 'No se pudo actualizar el estado', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!rule) return;
    try {
      await deleteRule(rule.id);
      toast({ title: 'Regla eliminada', description: 'El producto dejará de monitorearse automáticamente.', variant: 'success' });
      setDeleteOpen(false);
      setSelectedScope('general');
    } catch (error) {
      toast({ title: 'No se pudo eliminar la regla', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <section id="restock-rule" className="mt-20">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-slate-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Settings2 className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Automatización</span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Panel de reabastecimiento</h2>
            <p className="text-sm text-slate-600">
              Revisa y ajusta la regla automática de este producto sin salir de la ficha.
            </p>
          </div>

          {rule && (
            <Badge className={cn('self-start border px-4 py-1 text-xs font-semibold uppercase tracking-wide', STATUS_BADGES[rule.status])}>
              {rule.status === 'active' ? 'Regla activa' : 'Regla pausada'}
            </Badge>
          )}
        </header>

        {canManageRestockRules && scopeOptions.length > 1 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-sm">
              <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Alcance</label>
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger className="mt-2 h-11 w-full rounded-2xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-700">
                  <SelectValue placeholder="Selecciona alcance" />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-3xl" />
        ) : rule ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={cn(
                    'rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm',
                    metric.tone === 'warning' && 'border-amber-200 bg-amber-50/80 shadow-none'
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                  <p className={cn('mt-1 text-lg font-semibold text-slate-900', metric.tone === 'warning' && 'text-amber-700')}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            {rule.notes && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {rule.notes}
              </div>
            )}

            {isBelowMinimum && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-700">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <p>El stock actual ({Number.isFinite(stock) ? numberFormatter.format(stock) : 0} u) está en o por debajo del mínimo configurado.</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-2xl px-5"
                onClick={handleToggleStatus}
                disabled={isToggling}
              >
                {rule.status === 'active' ? 'Pausar regla' : 'Activar regla'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-11 rounded-2xl px-5 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
              >
                Eliminar
              </Button>
              <Button size="sm" className="h-11 rounded-2xl px-6" onClick={() => setDialogOpen(true)}>
                Editar
              </Button>
            </div>

            {formattedUpdatedAt && (
              <p className="text-[11px] text-slate-500">Última actualización {formattedUpdatedAt}</p>
            )}
          </div>
        ) : canManageRestockRules ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            <p className="text-sm text-slate-600">
              Aún no hay una regla configurada para este producto. Define el alcance, stock mínimo y cantidad recomendada para automatizar el reabastecimiento.
            </p>
            <Button className="mt-4 rounded-2xl px-6" onClick={() => setDialogOpen(true)}>
              Crear regla
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No hay reglas configuradas para este producto. Solicita a un supervisor que cree una regla si deseas activar la automatización.
          </p>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{rule ? 'Editar regla de reabastecimiento' : 'Crear regla de reabastecimiento'}</DialogTitle>
              <DialogDescription>
                Define el stock mínimo, la cantidad a solicitar y el alcance de la regla.
              </DialogDescription>
            </DialogHeader>
            <RestockRuleForm
              rule={rule}
              projects={projects}
              onSubmit={handleSave}
              onCancel={() => setDialogOpen(false)}
              isSubmitting={isSaving}
            />
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setDeleteOpen}
          title="Eliminar regla"
          description="Esta acción eliminará la regla y el producto dejará de monitorearse automáticamente."
          confirmText="Eliminar"
          variant="destructive"
          isLoading={isDeleting}
          onConfirm={handleDelete}
        />
      </div>
    </section>
  );
};

export default ProductRestockRuleSection;
