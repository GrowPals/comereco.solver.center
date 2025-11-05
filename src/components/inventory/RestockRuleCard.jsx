import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RestockRuleForm } from '@/components/inventory/RestockRuleForm';
import { useRestockRuleMutations } from '@/hooks/useRestockRules';
import { useToast } from '@/components/ui/useToast';
import { PauseCircle, PlayCircle, PencilLine, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_BADGES = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  paused: 'border-amber-200 bg-amber-50 text-amber-700'
};

const useRuleCardController = (rule, projects) => {
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const projectList = Array.isArray(projects) ? projects : [];

  const {
    saveRule,
    toggleRuleStatus,
    deleteRule,
    isSaving,
    isToggling,
    isDeleting
  } = useRestockRuleMutations({ productId: rule.product_id, projectId: rule.project_id ?? null });

  const projectName = rule.projects?.name || 'Regla general';
  const statusBadge = STATUS_BADGES[rule.status ?? 'paused'];

  const handleSubmit = async (values) => {
    try {
      await saveRule({
        id: rule.id,
        productId: rule.product_id,
        projectId: values.projectId,
        minStock: values.minStock,
        reorderQuantity: values.reorderQuantity,
        status: values.status,
        notes: values.notes,
        preferredVendor: values.preferredVendor,
        preferredWarehouse: values.preferredWarehouse
      });
      toast({ title: 'Regla guardada', description: 'Los cambios se guardaron correctamente.', variant: 'success' });
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'No se pudo actualizar la regla', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      await toggleRuleStatus({ ruleId: rule.id, nextStatus });
      toast({
        title: nextStatus === 'active' ? 'Regla activada' : 'Regla pausada',
        description:
          nextStatus === 'active'
            ? 'La automatización volverá a evaluar este producto.'
            : 'La regla permanecerá en pausa hasta reactivarla.',
        variant: 'success'
      });
    } catch (error) {
      toast({ title: 'No se pudo actualizar el estado', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRule(rule.id);
      toast({ title: 'Regla eliminada', description: 'El producto dejará de monitorearse automáticamente.', variant: 'success' });
      setDeleteOpen(false);
    } catch (error) {
      toast({ title: 'No se pudo eliminar la regla', description: error.message, variant: 'destructive' });
    }
  };

  return {
    isDialogOpen,
    setDialogOpen,
    isDeleteOpen,
    setDeleteOpen,
    isSaving,
    isToggling,
    isDeleting,
    handleSubmit,
    handleToggleStatus,
    handleDelete,
    projectName,
    statusBadge,
    projects: projectList
  };
};

export const RestockRuleCard = ({ rule, projects }) => {
  const navigate = useNavigate();
  const controller = useRuleCardController(rule, projects);
  const product = rule.products || {};
  const updatedAt = useMemo(
    () =>
      new Date(rule.updated_at).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    [rule.updated_at]
  );

  return (
    <div className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="line-clamp-2 text-[15px] font-semibold leading-tight text-slate-900 sm:text-lg">
              {product.name || 'Producto sin nombre'}
            </p>
            <p className="truncate text-sm font-medium text-slate-500" title={controller.projectName}>
              {controller.projectName}
            </p>
          </div>
          <Badge className={cn('border px-3 py-1 text-xs font-semibold uppercase tracking-wide', controller.statusBadge)}>
            {rule.status === 'active' ? 'Activa' : 'Pausada'}
          </Badge>
        </div>

        {!!rule.notes && (
          <p className="line-clamp-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            {rule.notes}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <Button className="h-11 w-full rounded-2xl text-sm font-semibold" onClick={() => controller.setDialogOpen(true)}>
          <PencilLine className="mr-2 h-4 w-4" /> Editar regla
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-2xl text-sm font-semibold"
            onClick={controller.handleToggleStatus}
            disabled={controller.isToggling}
          >
            {rule.status === 'active' ? (
              <span className="flex items-center justify-center gap-1">
                <PauseCircle className="h-4 w-4" /> Pausar
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <PlayCircle className="h-4 w-4" /> Activar
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className="h-10 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => controller.setDeleteOpen(true)}
          >
            <span className="flex items-center justify-center gap-1">
              <Trash2 className="h-4 w-4" /> Eliminar
            </span>
          </Button>
        </div>

        <Button
          variant="outline"
          className="h-10 w-full rounded-2xl border-slate-300 text-sm font-semibold text-slate-700 hover:border-slate-400"
          onClick={() => navigate(`/producto/${rule.product_id}`)}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver producto
        </Button>

        <p className="text-[11px] text-slate-500">Última actualización {updatedAt}</p>
      </div>

      <Dialog open={controller.isDialogOpen} onOpenChange={controller.setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar regla de reabastecimiento</DialogTitle>
            <DialogDescription>
              Ajusta los parámetros que controlan el stock mínimo y la cantidad a solicitar para este producto.
            </DialogDescription>
          </DialogHeader>
          <RestockRuleForm
            rule={rule}
            projects={controller.projects}
            onSubmit={controller.handleSubmit}
            onCancel={() => controller.setDialogOpen(false)}
            isSubmitting={controller.isSaving}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={controller.isDeleteOpen}
        onOpenChange={controller.setDeleteOpen}
        title="Eliminar regla"
        description="Esta acción eliminará la regla y el producto dejará de monitorearse automáticamente."
        confirmText="Eliminar"
        variant="destructive"
        isLoading={controller.isDeleting}
        onConfirm={controller.handleDelete}
      />
    </div>
  );
};

export const EmptyRulesPlaceholder = () => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 py-16 px-6 text-center">
    <PencilLine className="h-8 w-8 text-slate-400" />
    <h3 className="text-lg font-semibold text-slate-900">Sin reglas configuradas</h3>
    <p className="max-w-sm text-sm text-slate-600">
      Usa “Editar” desde la tarjeta de cada producto o ingresa a la ficha para crear la primera regla de reabastecimiento.
    </p>
  </div>
);
