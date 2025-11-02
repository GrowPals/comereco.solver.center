
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ShoppingCart, CreditCard, MessageSquare, AlertTriangle, Save } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/useToast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createRequisitionFromCart } from '@/services/requisitionService';
import { getMyProjects } from '@/services/projectService';
import EmptyState from '@/components/EmptyState';
import PageLoader from '@/components/PageLoader';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createTemplate } from '@/services/templateService';

const CheckoutPage = () => {
    const { items, subtotal, total, clearCart } = useCart();
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { register, handleSubmit, control, formState: { errors } } = useForm({
        mode: 'onBlur',
        defaultValues: {
            projectId: '',
            comments: ''
        }
    });
    
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');

    const { data: projects, isLoading: isLoadingProjects } = useQuery({
        queryKey: ['myProjects'],
        queryFn: getMyProjects,
    });

    const createRequisitionMutation = useMutation({
        mutationFn: createRequisitionFromCart,
        onSuccess: (data) => {
            toast({
                title: '¡Requisición Creada!',
                description: `Tu requisición ${data.internal_folio} ha sido creada como borrador.`,
                variant: 'success',
            });
            clearCart();
            queryClient.invalidateQueries(['cart']);
            queryClient.invalidateQueries(['requisitions']);
            navigate(`/requisitions/${data.id}`);
        },
        onError: (error) => {
            toast({
                title: 'Error al crear requisición',
                description: error.message || 'No se pudo completar la operación.',
                variant: 'destructive',
            });
        },
    });

    const createTemplateMutation = useMutation({
        mutationFn: createTemplate,
        onSuccess: () => {
            toast({ title: 'Plantilla guardada', description: 'Tu plantilla ha sido creada exitosamente.', variant: 'success' });
            setTemplateModalOpen(false);
            setTemplateName('');
            setTemplateDescription('');
            queryClient.invalidateQueries(['templates']);
        },
        onError: (error) => {
            toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
        }
    });

    const onSubmit = (formData) => {
        if (items.length === 0) {
            toast({ title: 'Carrito vacío', description: 'Agrega productos para crear una requisición.', variant: 'destructive' });
            return;
        }
        createRequisitionMutation.mutate({
            projectId: formData.projectId,
            comments: formData.comments,
            items: items, // Pasar items directamente, el servicio los mapeará correctamente
        });
    };
    
    const handleSaveTemplate = () => {
        if (!templateName) {
            toast({ title: 'Nombre requerido', description: 'Por favor, dale un nombre a tu plantilla.', variant: 'destructive'});
            return;
        }
        const templateItems = items.map(item => ({ product_id: item.id, quantity: item.quantity }));
        createTemplateMutation.mutate({
            name: templateName,
            description: templateDescription,
            items: templateItems,
            project_id: null,
        });
    };

    if (isLoadingProjects) return <PageLoader />;
    if (items.length === 0 && !createRequisitionMutation.isSuccess) {
        return (
            <div className="h-screen -mt-20">
                <EmptyState
                    icon={ShoppingCart}
                    title="Tu carrito está vacío"
                    description="Parece que no has agregado productos. ¡Explora el catálogo para empezar!"
                    actionButton={<Button onClick={() => navigate('/catalog')}>Ir al Catálogo</Button>}
                />
            </div>
        );
    }

    return (
        <>
            <Helmet><title>Finalizar Compra - ComerECO</title></Helmet>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <header className="pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-md">
                                <ShoppingCart className="h-7 w-7 text-blue-600" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                                    Finalizar <span className="bg-gradient-primary bg-clip-text text-transparent">Compra</span>
                                </h1>
                                <p className="text-base sm:text-lg text-slate-600 mt-1">
                                    Revisa tu pedido y completa la información para generar la requisición
                                </p>
                            </div>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Detalles de Requisición */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Detalles de la Requisición</h2>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md space-y-4">
                                <div>
                                    <Label htmlFor="projectId" className={errors.projectId ? 'text-destructive' : ''}>Proyecto</Label>
                                    <Select name="projectId" control={control} onValueChange={(value) => {
                                        const { onChange } = register('projectId', { required: 'Debes seleccionar un proyecto' });
                                        onChange({ target: { value } });
                                    }}>
                                        <SelectTrigger id="projectId" className={errors.projectId ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Selecciona un proyecto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects?.length > 0 ? (
                                                projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                                            ) : (
                                                <div className="p-4 text-sm text-center text-muted-foreground">No perteneces a ningún proyecto.</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.projectId && <p className="mt-1 text-sm text-destructive flex items-center gap-1"><AlertTriangle size={14} />{errors.projectId.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="comments">Comentarios (Opcional)</Label>
                                    <Textarea id="comments" {...register('comments')} placeholder="Instrucciones especiales, justificación, etc." />
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                    <Save className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Acciones Adicionales</h2>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                    onClick={() => setTemplateModalOpen(true)}
                                    disabled={items.length === 0}
                                >
                                    Guardar como Plantilla
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Resumen de Pedido */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Resumen del Pedido</h2>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md space-y-3 max-h-96 overflow-y-auto">
                            {items.map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                                    <img className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow-sm" alt={item.name} src={item.image_url || '/placeholder.png'} />
                                    <div className="flex-grow">
                                        <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                                        <p className="text-sm text-slate-600">Cantidad: <span className="font-semibold">{item.quantity}</span></p>
                                    </div>
                                    <p className="font-bold text-lg text-slate-900">${(item.quantity * (item.price || 0)).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-200 space-y-3">
                            <div className="flex justify-between items-center text-base">
                                <span className="text-slate-700 font-medium">Subtotal:</span>
                                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base">
                                <span className="text-slate-700 font-medium">IVA (16%):</span>
                                <span className="font-bold text-slate-900">${((total - subtotal) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold border-t-2 border-blue-300 pt-3">
                                <span className="text-slate-900">Total:</span>
                                <span className="text-3xl bg-gradient-primary bg-clip-text text-transparent">${total.toFixed(2)}</span>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full shadow-lg hover:shadow-xl"
                            isLoading={createRequisitionMutation.isPending}
                        >
                            Crear Requisición
                        </Button>
                    </div>
                    </form>
                </div>
            </div>

            <Dialog open={isTemplateModalOpen} onOpenChange={setTemplateModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Guardar como Plantilla</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                            <Input id="template-name" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Ej: Suministros de oficina mensuales"/>
                        </div>
                        <div>
                            <Label htmlFor="template-desc">Descripción (Opcional)</Label>
                            <Textarea id="template-desc" value={templateDescription} onChange={e => setTemplateDescription(e.target.value)} placeholder="Contenido de esta plantilla..."/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTemplateModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveTemplate} isLoading={createTemplateMutation.isPending}>Guardar Plantilla</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CheckoutPage;
