import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const buildDefaultValues = (rule) => ({
    projectId: rule?.project_id ?? 'general',
    minStock: rule?.min_stock ?? 0,
    reorderQuantity: rule?.reorder_quantity ?? 1,
    isActive: (rule?.status ?? 'active') === 'active',
    notes: rule?.notes ?? '',
    preferredVendor: rule?.preferred_vendor ?? '',
    preferredWarehouse: rule?.preferred_warehouse ?? ''
});

const numberInputClass = 'w-full rounded-xl border border-slate-300 px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none';

export const RestockRuleForm = ({
    rule,
    projects = [],
    onSubmit,
    onCancel,
    isSubmitting,
    layout = 'vertical'
}) => {
    const defaultValues = useMemo(() => buildDefaultValues(rule), [rule]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        reset,
        watch
    } = useForm({
        defaultValues
    });

    useEffect(() => {
        reset(buildDefaultValues(rule));
    }, [rule, reset]);

    const isActive = watch('isActive');

    const submitHandler = (values) => {
        if (!onSubmit) return;

        onSubmit({
            ...values,
            projectId: values.projectId === 'general' ? null : values.projectId,
            status: values.isActive ? 'active' : 'paused'
        });
    };

    const projectOptions = useMemo(() => [
        { id: 'general', name: 'Regla general (todos los proyectos)' },
        ...projects.map((project) => ({ id: project.id, name: project.name }))
    ], [projects]);

    return (
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
            <div className={cn(
                'grid gap-5',
                layout === 'horizontal' ? 'md:grid-cols-2' : 'grid-cols-1'
            )}>
                <div className="space-y-2">
                    <Label htmlFor="projectId">Alcance de la regla</Label>
                    <Controller
                        control={control}
                        name="projectId"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un proyecto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id}>
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="minStock">Stock mínimo</Label>
                    <Input
                        id="minStock"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        className={numberInputClass}
                        {...register('minStock', {
                            required: 'Define un stock mínimo.',
                            valueAsNumber: true,
                            min: {
                                value: 0,
                                message: 'No puede ser menor a 0.'
                            }
                        })}
                    />
                    {errors.minStock && (
                        <p className="text-sm text-red-500">{errors.minStock.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="reorderQuantity">Cantidad a solicitar</Label>
                    <Input
                        id="reorderQuantity"
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        className={numberInputClass}
                        {...register('reorderQuantity', {
                            required: 'Indica cuántas unidades se deben pedir.',
                            valueAsNumber: true,
                            min: {
                                value: 1,
                                message: 'Debe ser al menos 1.'
                            }
                        })}
                    />
                    {errors.reorderQuantity && (
                        <p className="text-sm text-red-500">{errors.reorderQuantity.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status" className="flex items-center justify-between">
                        Estado de la regla
                        <Controller
                            control={control}
                            name="isActive"
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    aria-label={field.value ? 'Regla activa' : 'Regla pausada'}
                                />
                            )}
                        />
                    </Label>
                    <p className="text-sm text-slate-500">
                        {isActive
                            ? 'Cuando el stock llegue al mínimo se generará una alerta para n8n.'
                            : 'La regla está pausada y no generará alertas.'}
                    </p>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="preferredVendor">Proveedor sugerido (opcional)</Label>
                    <Input
                        id="preferredVendor"
                        type="text"
                        placeholder="Nombre o referencia del proveedor"
                        {...register('preferredVendor')}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="preferredWarehouse">Almacén sugerido (opcional)</Label>
                    <Input
                        id="preferredWarehouse"
                        type="text"
                        placeholder="Ubicación o código de almacén"
                        {...register('preferredWarehouse')}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notas internas (opcional)</Label>
                <Textarea
                    id="notes"
                    rows={4}
                    placeholder="Explica por qué se necesita esta regla o instrucciones adicionales."
                    {...register('notes')}
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 pt-2">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar regla'}
                </Button>
            </div>
        </form>
    );
};

export default RestockRuleForm;

