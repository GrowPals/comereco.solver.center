
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
            <div className="container mx-auto max-w-4xl py-8 px-4">
                <h1 className="text-3xl font-bold mb-2">Finalizar Compra</h1>
                <p className="text-muted-foreground mb-8">Revisa tu pedido y completa la información para generar la requisición.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Detalles de Requisición */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><CreditCard /> Detalles de la Requisición</h2>
                            <div className="bg-card p-6 rounded-lg border space-y-4">
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
                             <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Save /> Acciones Adicionales</h2>
                             <div className="bg-card p-6 rounded-lg border">
                                <Button type="button" variant="outline" className="w-full" onClick={() => setTemplateModalOpen(true)} disabled={items.length === 0}>
                                    Guardar como Plantilla
                                </Button>
                             </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Resumen de Pedido */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><ShoppingCart /> Resumen del Pedido</h2>
                        <div className="bg-card p-4 rounded-lg border space-y-3 max-h-96 overflow-y-auto">
                            {items.map(item => (
                                <div key={item.id} className="flex items-center gap-4 text-sm">
                                    <img className="w-14 h-14 rounded-md object-cover" alt={item.name} src={item.image_url || '/placeholder.png'} />
                                    <div className="flex-grow">
                                        <p className="font-semibold line-clamp-1">{item.name}</p>
                                        <p className="text-muted-foreground">Cantidad: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold">${(item.quantity * (item.price || 0)).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-card p-6 rounded-lg border space-y-3 text-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-semibold">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">IVA (16%):</span>
                                <span className="font-semibold">${((total - subtotal) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center font-bold border-t pt-3">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                        <Button type="submit" size="lg" className="w-full" isLoading={createRequisitionMutation.isPending}>
                            Crear Requisición
                        </Button>
                    </div>
                </form>
            </div>
            
            <Dialog open={isTemplateModalOpen} onOpenChange={setTemplateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Guardar como Plantilla</DialogTitle>
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
