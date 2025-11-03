import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from "date-fns"
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getMyProjects } from '@/services/projectService';

const categories = ['Tecnología', 'Oficina', 'Mobiliario', 'Seguridad', 'Limpieza', 'Marketing', 'Operaciones'];

const GeneralDataStep = () => {
    const { register, formState: { errors }, watch, setValue, control } = useFormContext();
    const requiredDate = watch('requiredDate');

    // Fetch projects from API instead of mockdata
    const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
        queryKey: ['myProjects'],
        queryFn: getMyProjects,
        staleTime: 60000, // 1 minuto
    });

    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="title">Título de la Requisición *</Label>
                <Input
                    id="title"
                    placeholder="Ej: Material de Oficina para Q4"
                    {...register('title', { required: 'El título es obligatorio' })}
                />
                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>
            
            <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                    id="description"
                    placeholder="Describe brevemente el propósito de esta requisición..."
                    {...register('description')}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <Label htmlFor="category">Categoría *</Label>
                    <select
                        id="category"
                        {...register('category', { required: 'La categoría es obligatoria' })}
                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">Selecciona una categoría...</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                </div>

                <div>
                    <Label>Prioridad *</Label>
                    <RadioGroup defaultValue="Normal" onValueChange={(value) => setValue('priority', value)} className="flex items-center space-x-4 pt-3">
                      {['Normal', 'Alta', 'Urgente'].map(p => (
                        <div key={p} className="flex items-center space-x-2">
                           <RadioGroupItem value={p} id={`priority-${p}`} />
                           <Label htmlFor={`priority-${p}`}>{p}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <Label htmlFor="requiredDate">Fecha Requerida *</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal h-12",
                                !requiredDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {requiredDate ? format(requiredDate, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={requiredDate}
                                onSelect={(date) => setValue('requiredDate', date, { shouldValidate: true })}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {errors.requiredDate && <p className="text-sm text-destructive mt-1">La fecha es obligatoria</p>}
                </div>
                
                <div>
                    <Label htmlFor="costCenter">Centro de Costos (Opcional)</Label>
                    <select
                        id="costCenter"
                        {...register('costCenter')}
                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-base ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoadingProjects}
                    >
                        <option value="">
                            {isLoadingProjects ? 'Cargando proyectos...' : 'Selecciona un proyecto...'}
                        </option>
                        {projects.map(proj => (
                            <option key={proj.id} value={proj.id}>
                                {proj.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

        </div>
    );
};

export default GeneralDataStep;