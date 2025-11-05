import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  PauseCircle,
  PlayCircle,
  Trash2,
  PencilLine,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
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
import { useRestockRuleMutations } from '@/hooks/useRestockRules';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';

const statusStyles = {
  active: {
    label: 'Activa',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  },
  paused: {
    label: 'Pausada',
    className: 'bg-amber-50 text-amber-700 border border-amber-200'
  }
};

const useRestockRowController = (rule, projects) => {
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const {
    saveRule,
    toggleRuleStatus,
    deleteRule,
    isSaving,
    isToggling,
    isDeleting
  } = useRestockRuleMutations({ productId: rule.product_id, projectId: rule.project_id ?? null });

  const projectName = rule.projects?.name || 'Regla general';
  const statusTokens = statusStyles[rule.status ?? 'paused'];

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
      toast({ title: 'Regla actualizada', description: 'Los cambios se guardaron correctamente.', variant: 'success' });
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'No se pudo actualizar la regla', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggle = async () => {
    const nextStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      await toggleRuleStatus({ ruleId: rule.id, nextStatus });
      toast({
        title: nextStatus === 'active' ? 'Regla activada' : 'Regla pausada',
        description: nextStatus === 'active'
          ? 'El flujo automatizado volverá a monitorear este producto.'
          : 'La automatización ignorará este producto hasta reactivarlo.',
        variant: 'success'
      });
    } catch (error) {
      toast({ title: 'No se pudo actualizar el estado', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRule(rule.id);
      toast({ title: 'Regla eliminada', description: 'Puedes configurarla nuevamente cuando lo necesites.', variant: 'success' });
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
    handleToggle,
    handleDelete,
    projects,
    statusTokens,
    projectName
  };
};

export const RestockRuleDesktopRow = ({ rule, projects }) => {
  const controller = useRestockRowController(rule, projects);
  const product = rule.products || {};

  return (
    <TableRow className="hover:bg-slate-50/70">
      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-slate-900">{product.name}</span>
          <span className="text-xs text-slate-500">SKU: {product.sku}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={cn('px-3 py-1 text-xs font-medium capitalize', controller.statusTokens.className)}>
          {controller.statusTokens.label}
        </Badge>
      </TableCell>
      <TableCell className="font-semibold">{rule.min_stock}</TableCell>
      <TableCell className="font-semibold">{rule.reorder_quantity}</TableCell>
      <TableCell>{controller.projectName}</TableCell>
      <TableCell>{product.category || '—'}</TableCell>
      <TableCell>{Number.isFinite(product.stock) ? product.stock : '—'}</TableCell>
      <TableCell className="whitespace-nowrap text-xs text-slate-500">
        {new Date(rule.updated_at).toLocaleString('es-MX')}
      </TableCell>
      <TableCell className="min-w-[260px]">
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={controller.isDialogOpen} onOpenChange={controller.setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <PencilLine className="w-4 h-4" /> Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar regla de reabastecimiento</DialogTitle>
                <DialogDescription>
                  Ajusta los parámetros que usará la automatización para generar requisiciones.
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

          <Button
            variant="ghost"
            size="sm"
            onClick={controller.handleToggle}
            disabled={controller.isToggling}
            className="flex items-center gap-1"
          >
            {rule.status === 'active' ? (
              <>
                <PauseCircle className="w-4 h-4" /> Pausar
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" /> Activar
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
            onClick={() => controller.setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link to={`/producto/${rule.product_id}`} className="flex items-center gap-1">
              Ver producto
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <ConfirmDialog
          open={controller.isDeleteOpen}
          onOpenChange={controller.setDeleteOpen}
          title="Eliminar regla"
          description="Esta acción eliminará la regla y la automatización externa dejará de monitorear este producto."
          confirmText="Eliminar"
          variant="destructive"
          isLoading={controller.isDeleting}
          onConfirm={controller.handleDelete}
        />
      </TableCell>
    </TableRow>
  );
};

export const RestockRuleMobileCard = ({ rule, projects }) => {
  const controller = useRestockRowController(rule, projects);
  const product = rule.products || {};

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 leading-tight">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">SKU: {product.sku}</p>
        </div>
        <Badge className={cn('px-3 py-1 text-xs font-medium capitalize', controller.statusTokens.className)}>
          {controller.statusTokens.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Metric label="Stock mínimo" value={`${rule.min_stock} u`} />
        <Metric label="Solicitar" value={`${rule.reorder_quantity} u`} />
        <Metric label="Proyecto" value={controller.projectName} />
        <Metric label="Stock actual" value={Number.isFinite(product.stock) ? `${product.stock} u` : '—'} />
      </div>

      {rule.notes && (
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl p-3">
          {rule.notes}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Dialog open={controller.isDialogOpen} onOpenChange={controller.setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1" size="sm">
              <PencilLine className="w-4 h-4" /> Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar regla de reabastecimiento</DialogTitle>
              <DialogDescription>
                Ajusta la regla para este producto.
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

        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={controller.handleToggle}
          disabled={controller.isToggling}
        >
          {rule.status === 'active' ? 'Pausar' : 'Activar'}
        </Button>

        <Button variant="ghost" size="sm" asChild className="flex-1">
          <Link to={`/producto/${rule.product_id}`} className="flex items-center justify-center gap-1">
            Ver
            <ExternalLink className="w-4 h-4" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => controller.setDeleteOpen(true)}
        >
          Eliminar
        </Button>
      </div>

      <p className="text-[11px] text-slate-500">
        Última actualización {new Date(rule.updated_at).toLocaleString('es-MX')}
      </p>

      <ConfirmDialog
        open={controller.isDeleteOpen}
        onOpenChange={controller.setDeleteOpen}
        title="Eliminar regla"
        description="Esta acción eliminará la regla actual."
        confirmText="Eliminar"
        variant="destructive"
        isLoading={controller.isDeleting}
        onConfirm={controller.handleDelete}
      />
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2">
    <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

export const EmptyRulesPlaceholder = () => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 py-16 text-center">
    <BadgeCheck className="w-10 h-10 text-slate-400" />
    <h3 className="mt-4 text-lg font-semibold text-slate-900">Sin reglas configuradas</h3>
    <p className="mt-2 max-w-sm text-sm text-slate-600">
      Usa el botón “Crear regla” para definir los mínimos de stock y la cantidad a solicitar para cada producto.
    </p>
  </div>
);

