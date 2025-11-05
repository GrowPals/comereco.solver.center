import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ClipboardList, PauseCircle, PlayCircle, Settings2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { useToast } from '@/components/ui/useToast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { RestockRuleForm } from '@/components/inventory/RestockRuleForm';
import { useRestockRule, useRestockRuleMutations } from '@/hooks/useRestockRules';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { getAllProjects } from '@/services/projectService';
import { cn } from '@/lib/utils';

const statusCopy = {
    active: {
        label: 'Activa',
        tone: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    },
    paused: {
        label: 'Pausada',
        tone: 'bg-amber-50 text-amber-700 border border-amber-200'
    }
};

const EmptyState = ({ onConfigure, disabled }) => (
    <div className="flex flex-col gap-4 items-start">
        <div className="flex items-center gap-3 text-slate-600">
            <ClipboardList className="w-5 h-5" />
            <p className="text-sm">
                Aún no hay una regla configurada para este producto. Define un stock mínimo y la cantidad a solicitar.
            </p>
        </div>
        <Button onClick={onConfigure} disabled={disabled}>
            Configurar regla
        </Button>
    </div>
);

const RuleStatusRow = ({ label, value }) => (
    <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
    </div>
);

export const ProductRestockRuleSection = ({ product, stock }) => {
    const { canManageRestockRules } = useUserPermissions();
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [selectedScope, setSelectedScope] = useState('general');

    const productId = product?.id;
    const projectIdFilter = selectedScope === 'general' ? null : selectedScope;
    const { data: rule, isLoading: isRuleLoading } = useRestockRule({ productId, projectId: projectIdFilter });
    const { saveRule, toggleRuleStatus, deleteRule, isSaving, isToggling, isDeleting } = useRestockRuleMutations({
        productId,
        projectId: projectIdFilter
    });

    const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['projects', 'restock-rule'],
        queryFn: getAllProjects,
        enabled: canManageRestockRules,
        staleTime: 1000 * 60 * 10,
    });

    const projects = projectsData ?? [];

    const scopeOptions = useMemo(() => (
        [
            { id: 'general', name: 'Regla general' },
            ...projects.map((project) => ({ id: project.id, name: project.name }))
        ]
    ), [projects]);

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
                preferredWarehouse: formValues.preferredWarehouse,
            });
            toast({ title: 'Regla guardada', description: 'Los parámetros de reabastecimiento se actualizaron correctamente.', variant: 'success' });
            setDialogOpen(false);
            setSelectedScope(formValues.projectId === null ? 'general' : formValues.projectId);
        } catch (err) {
            toast({ title: 'No se pudo guardar la regla', description: err.message, variant: 'destructive' });
        }
    };

    const handleToggleStatus = async () => {
        if (!rule) return;
        const nextStatus = rule.status === 'active' ? 'paused' : 'active';
        try {
            await toggleRuleStatus({ ruleId: rule.id, nextStatus });
            toast({
                title: nextStatus === 'active' ? 'Regla activada' : 'Regla pausada',
                description: nextStatus === 'active'
                    ? 'La automatización externa volverá a evaluar este producto.'
                    : 'La automatización externa ignorará este producto hasta reactivarlo.',
                variant: 'success'
            });
        } catch (err) {
            toast({ title: 'No se pudo actualizar el estado', description: err.message, variant: 'destructive' });
        }
    };

    const handleDeleteRule = async () => {
        if (!rule) return;
        try {
            await deleteRule(rule.id);
            toast({ title: 'Regla eliminada', description: 'Puedes crear una nueva cuando lo necesites.', variant: 'success' });
            setDeleteOpen(false);
        } catch (err) {
            toast({ title: 'No se pudo eliminar la regla', description: err.message, variant: 'destructive' });
        }
    };

    const statusStyles = statusCopy[rule?.status ?? 'paused'];

    return (
        <Card className="p-6 border border-slate-200 shadow-sm bg-white">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-slate-500" />
                            Regla de reabastecimiento
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Define el stock mínimo para crear automáticamente una requisición a través de n8n.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {canManageRestockRules && (
                            <Select value={selectedScope} onValueChange={setSelectedScope}>
                                <SelectTrigger className="w-52">
                                    <SelectValue placeholder="Selecciona un proyecto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scopeOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {rule ? (
                            <Badge className={cn('px-3 py-1 text-sm font-medium capitalize', statusStyles?.tone)}>
                                {statusStyles?.label}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="px-3 py-1 text-sm">Sin configurar</Badge>
                        )}
                    </div>
                </div>

                {isRuleLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                ) : rule ? (
                    <div className="space-y-4">
                        {isBelowMinimum && (
                            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-700">Stock actual en nivel crítico</p>
                                    <p className="text-sm text-amber-700/90">
                                        El stock ({stock ?? 0} unidades) está por debajo o igual al mínimo configurado ({rule.min_stock}).
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <RuleStatusRow label="Stock mínimo" value={`${rule.min_stock} unidades`} />
                            <RuleStatusRow label="Cantidad a solicitar" value={`${rule.reorder_quantity} unidades`} />
                            <RuleStatusRow label="Proyecto" value={rule.projects?.name || 'Regla general'} />
                            <RuleStatusRow label="Proveedor sugerido" value={rule.preferred_vendor || '—'} />
                            <RuleStatusRow label="Almacén sugerido" value={rule.preferred_warehouse || '—'} />
                            <RuleStatusRow label="Última actualización" value={new Date(rule.updated_at).toLocaleString('es-MX')} />
                        </div>

                        {rule.notes && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                {rule.notes}
                            </div>
                        )}

                        {canManageRestockRules && (
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            Editar configuración
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Configurar regla de reabastecimiento</DialogTitle>
                                            <DialogDescription>
                                                Ajusta los parámetros que el flujo automático utilizará para generar requisiciones.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <RestockRuleForm
                                            rule={rule}
                                            projects={projects}
                                            onSubmit={handleSaveRule}
                                            onCancel={() => setDialogOpen(false)}
                                            isSubmitting={isSaving}
                                        />
                                        {isLoadingProjects && (
                                            <p className="text-sm text-slate-500 mt-2">Cargando proyectos disponibles...</p>
                                        )}
                                    </DialogContent>
                                </Dialog>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleToggleStatus}
                                    disabled={isToggling}
                                    className="flex items-center gap-2"
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
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    canManageRestockRules ? (
                        <EmptyState
                            onConfigure={() => setDialogOpen(true)}
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="text-sm text-slate-600">
                            No hay una regla de reabastecimiento configurada para este producto.
                        </p>
                    )
                )}

                {canManageRestockRules && !rule && (
                    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Crear regla de reabastecimiento</DialogTitle>
                                <DialogDescription>
                                    Define los límites mínimos y las cantidades sugeridas para automatizar las requisiciones desde n8n.
                                </DialogDescription>
                            </DialogHeader>
                            <RestockRuleForm
                                rule={null}
                                projects={projects}
                                onSubmit={handleSaveRule}
                                onCancel={() => setDialogOpen(false)}
                                isSubmitting={isSaving}
                            />
                            {isLoadingProjects && (
                                <p className="text-sm text-slate-500 mt-2">Cargando proyectos disponibles...</p>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <ConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setDeleteOpen}
                title="Eliminar regla"
                description="Esta acción eliminará la regla de reabastecimiento. n8n dejará de monitorear el stock mínimo para este producto."
                confirmText="Eliminar"
                variant="destructive"
                isLoading={isDeleting}
                onConfirm={handleDeleteRule}
            />
        </Card>
    );
};

export default ProductRestockRuleSection;
