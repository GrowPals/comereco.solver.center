
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { ShoppingCart, CreditCard, MessageSquare, AlertTriangle, Save } from 'lucide-react';
import { useCart } from '@/context/CartContext';
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
import PageContainer from '@/components/layout/PageContainer';
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
            <PageContainer>
                <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
                    {/* Header */}
                    <header className="border-b border-border pb-5 sm:pb-6 dark:border-border">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm sm:h-14 sm:w-14 dark:from-primary-500/15 dark:to-primary-600/10">
                                <ShoppingCart className="h-6 w-6 text-primary-500 sm:h-7 sm:w-7" aria-hidden="true" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                                    Finalizar <span className="bg-gradient-primary bg-clip-text text-transparent">Compra</span>
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                                    Revisa tu pedido y completa la información para generar la requisición
                                </p>
                            </div>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Detalles de Requisición */}
                    <div className="space-y-6">
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/15 dark:to-primary-600/10">
                                    <CreditCard className="h-5 w-5 text-primary-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Detalles de la Requisición</h2>
                            </div>
                            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-md dark:border-border dark:bg-card">
                                <div>
                                    <Label htmlFor="projectId" className={errors.projectId ? 'text-destructive' : ''}>Proyecto *</Label>
                                    <Controller
                                        name="projectId"
                                        control={control}
                                        rules={{ required: 'Debes seleccionar un proyecto' }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
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
                                        )}
                                    />
                                    {errors.projectId && <p className="mt-1 text-sm text-destructive flex items-center gap-1"><AlertTriangle size={14} />{errors.projectId.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="comments">Comentarios (Opcional)</Label>
                                    <Textarea id="comments" {...register('comments')} placeholder="Instrucciones especiales, justificación, etc." />
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/15 dark:to-primary-600/10">
                                    <Save className="h-5 w-5 text-primary-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-foreground">Acciones Adicionales</h2>
                            </div>
                            <div className="rounded-2xl border border-border bg-card p-6 shadow-md dark:border-border dark:bg-card">
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
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-500/15 dark:to-primary-600/10">
                                <ShoppingCart className="h-5 w-5 text-primary-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Resumen del Pedido</h2>
                        </div>
                        <div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card/95 p-5 shadow-md dark:border-border dark:bg-card/85">
                            {items.map(item => (
                                <div key={item.id} className="flex items-center gap-4 rounded-xl border border-border bg-muted/60 p-3 transition-colors hover:bg-muted/80 dark:border-border dark:bg-card/60 dark:hover:bg-muted/40/70">
                                    <img className="h-16 w-16 rounded-lg border-2 border-white object-cover shadow-sm dark:border-border" alt={item.name} src={item.image_url || '/placeholder.png'} />
                                    <div className="flex-grow">
                                        <p className="line-clamp-1 font-bold text-foreground">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Cantidad: <span className="font-semibold text-foreground">{item.quantity}</span>
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-foreground">${(item.quantity * (item.price || 0)).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-50 to-primary-100 p-6 dark:border-primary/30 dark:from-primary-500/15 dark:to-primary-600/15">
                            <div className="flex items-center justify-between text-base">
                                <span className="font-medium text-muted-foreground">Subtotal:</span>
                                <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-base">
                                <span className="font-medium text-muted-foreground">IVA (16%):</span>
                                <span className="font-bold text-foreground">${((total - subtotal) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-primary-300/70 pt-3 text-xl font-bold dark:border-primary/40">
                                <span className="text-foreground">Total:</span>
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
            </PageContainer>

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
