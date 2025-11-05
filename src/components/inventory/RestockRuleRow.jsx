import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PauseCircle, PlayCircle, ExternalLink, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RestockRuleForm } from '@/components/inventory/RestockRuleForm';
import { useRestockRuleMutations } from '@/hooks/useRestockRules';
import { useToast } from '@/components/ui/useToast';
import { cn } from '@/lib/utils';

const statusVariant = {
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    paused: 'bg-amber-50 text-amber-700 border border-amber-200'
};

const getProjectName = (rule) => rule?.projects?.name ?? 'General';

export const RestockRuleRow = ({ rule, projects }) => {
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);

    const ruleProjectId = useMemo(() => rule.project_id ?? null, [rule.project_id]);
    const { saveRule, toggleRuleStatus, deleteRule, isSaving, isToggling, isDeleting } = useRestockRuleMutations({
        productId: rule.product_id,
        projectId: ruleProjectId
    });

    const product = rule.products || {};
    const status = rule.status ?? 'paused';

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
        } catch (err) {
            toast({ title: 'No se pudo actualizar la regla', description: err.message, variant: 'destructive' });
        }
    };

    const handleToggle = async () => {
        const nextStatus = status === 'active' ? 'paused' : 'active';
        try {
            await toggleRuleStatus({ ruleId: rule.id, nextStatus });
            toast({
                title: nextStatus === 'active' ? 'Regla activada' : 'Regla pausada',
                description: nextStatus === 'active'
                    ? 'El flujo de automatización volverá a monitorear este producto.'
                    : 'El flujo externo ignorará este producto por ahora.',
                variant: 'success'
            });
        } catch (err) {
            toast({ title: 'No se pudo actualizar el estado', description: err.message, variant: 'destructive' });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteRule(rule.id);
            toast({ title: 'Regla eliminada', description: 'La automatización dejará de monitorear este producto.', variant: 'success' });
            setDeleteOpen(false);
        } catch (err) {
            toast({ title: 'No se pudo eliminar la regla', description: err.message, variant: 'destructive' });
        }
    };

    const projectName = getProjectName(rule);

    return (
        <>
            <TableRow className="hidden lg:table-row">
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-slate-900">{product.name}</span>
                        <span className="text-xs text-slate-500">SKU: {product.sku}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge className={cn('px-3 py-1 text-xs font-medium capitalize', statusVariant[status])}>
                        {status === 'active' ? 'Activa' : 'Pausada'}
                    </Badge>
                </TableCell>
                <TableCell className="font-semibold">{rule.min_stock}</TableCell>
                <TableCell className="font-semibold">{rule.reorder_quantity}</TableCell>
                <TableCell>{projectName}</TableCell>
                <TableCell>{product.category || '—'}</TableCell>
                <TableCell>{Number.isFinite(product.stock) ? product.stock : '—'}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-slate-500">
                    {new Date(rule.updated_at).toLocaleString('es-MX')}
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDialogOpen(true)}
                            className="hover:bg-slate-100"
                            aria-label="Editar regla"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggle}
                            disabled={isToggling}
                            className="hover:bg-slate-100"
                            aria-label={status === 'active' ? 'Pausar regla' : 'Activar regla'}
                        >
                            {status === 'active' ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteOpen(true)}
                            aria-label="Eliminar regla"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link to={`/producto/${rule.product_id}`} className="flex items-center gap-1">
                                Ver producto
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            <div className="lg:hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">SKU: {product.sku}</p>
                    </div>
                    <Badge className={cn('px-3 py-1 text-xs font-medium capitalize', statusVariant[status])}>
                        {status === 'active' ? 'Activa' : 'Pausada'}
                    </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-slate-500">Stock mínimo</span>
                        <p className="font-semibold">{rule.min_stock}</p>
                    </div>
                    <div>
                        <span className="text-slate-500">Solicitar</span>
                        <p className="font-semibold">{rule.reorder_quantity}</p>
                    </div>
                    <div>
                        <span className="text-slate-500">Proyecto</span>
                        <p className="font-semibold">{projectName}</p>
                    </div>
                    <div>
                        <span className="text-slate-500">Stock actual</span>
                        <p className="font-semibold">{Number.isFinite(product.stock) ? product.stock : '—'}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="flex-1">
                        Editar
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to={`/producto/${rule.product_id}`} className="flex items-center justify-center gap-1">
                            Ver
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggle}
                        disabled={isToggling}
                        className="flex-1"
                    >
                        {status === 'active' ? 'Pausar' : 'Activar'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteOpen(true)}
                    >
                        Eliminar
                    </Button>
                </div>
                <p className="text-xs text-slate-500">
                    Última actualización: {new Date(rule.updated_at).toLocaleString('es-MX')}
                </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar regla de reabastecimiento</DialogTitle>
                        <DialogDescription>
                            Ajusta los parámetros que usarán los flujos automatizados para este producto.
                        </DialogDescription>
                    </DialogHeader>
                    <RestockRuleForm
                        rule={rule}
                        projects={projects}
                        onSubmit={handleSubmit}
                        onCancel={() => setDialogOpen(false)}
                        isSubmitting={isSaving}
                    />
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setDeleteOpen}
                title="Eliminar regla"
                description="Esta acción eliminará la regla y la automatización externa dejará de monitorear este producto."
                confirmText="Eliminar"
                variant="destructive"
                isLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </>
    );
};

export default RestockRuleRow;

