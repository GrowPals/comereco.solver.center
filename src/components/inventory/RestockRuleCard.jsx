import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RestockRuleForm } from '@/components/inventory/RestockRuleForm';
import { useRestockRuleMutations } from '@/hooks/useRestockRules';
import { useToast } from '@/components/ui/use-toast';
import { PauseCircle, PlayCircle, PencilLine, Trash2, ExternalLink, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="surface-card group flex h-full flex-col rounded-3xl p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="line-clamp-2 text-[15px] font-semibold leading-tight text-foreground sm:text-lg">
              {product.name || 'Producto sin nombre'}
            </p>
            <p className="truncate text-sm font-medium text-muted-foreground" title={controller.projectName}>
              {controller.projectName}
            </p>
          </div>
          <Badge
            className={cn('surface-chip px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground dark:text-foreground',
              rule.status === 'active' ? 'border-green-400/60 text-emerald-600 dark:text-emerald-200' : 'border-amber-400/60 text-amber-500 dark:text-amber-200')}
          >
            {rule.status === 'active' ? 'Activa' : 'Pausada'}
          </Badge>
        </div>

        {!!rule.notes && (
          <p className="surface-card line-clamp-2 rounded-2xl p-3 text-xs text-muted-foreground/90 dark:text-primary-100">{/* using surface-card ensures same palette */}
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
            variant="ghost"
            className={cn(
              "h-10 rounded-2xl text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5",
              rule.status === 'active'
                ? "bg-surface-secondary/65 text-primary-50"
                : "bg-accent text-surface-primary"
            )}
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
          className="h-10 rounded-2xl text-sm font-semibold text-error transition-all duration-200 hover:bg-[rgba(239,83,80,0.18)] hover:-translate-y-0.5"
          onClick={() => controller.setDeleteOpen(true)}
        >
          <span className="flex items-center justify-center gap-1">
            <Trash2 className="h-4 w-4" /> Eliminar
          </span>
          </Button>
        </div>

        <Button
          variant="outline"
          className="h-10 w-full rounded-2xl border-border text-sm font-semibold text-foreground transition-colors hover:border-primary-400 hover:text-primary-500 dark:border-border"
          onClick={() => navigate(`/products/${rule.product_id}`)}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver producto
        </Button>

        <p className="text-[11px] text-muted-foreground">Última actualización {updatedAt}</p>
      </div>

      <Dialog open={controller.isDialogOpen} onOpenChange={controller.setDialogOpen}>
        <DialogContent className="sm:max-w-2xl surface-panel">
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
  <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 bg-muted/60 py-16 px-6 text-center dark:border-border dark:bg-card/50">
    <PencilLine className="h-8 w-8 text-muted-foreground" />
    <h3 className="text-lg font-semibold text-foreground">Sin reglas configuradas</h3>
    <p className="max-w-sm text-sm text-muted-foreground">
      Usa “Editar” desde la tarjeta de cada producto o ingresa a la ficha para crear la primera regla de reabastecimiento.
    </p>
  </div>
);
