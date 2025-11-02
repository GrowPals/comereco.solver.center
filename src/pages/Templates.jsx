
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { getTemplates, deleteTemplate, toggleFavorite, createRequisitionFromTemplate } from '@/services/templateService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast.js';
import { Star, Trash2, ShoppingCart, Package, DollarSign, BarChart2, Library, Loader2, ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';

const TemplateCard = ({ template, onUse, onDelete, onToggleFavorite, isUsing }) => {
    // Estimación del total. En un caso real, esto debería venir pre-calculado o unirlo con productos.
    const estimatedTotal = useMemo(() => 
        template.items.reduce((acc, item) => acc + (item.unit_price || 0) * (item.quantity || 0), 0)
    , [template.items]);

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
            <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-primary/20 hover:shadow-lg border-transparent hover:border-primary/30 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 -mt-2 -mr-2" onClick={() => onToggleFavorite(template.id, !template.is_favorite)}>
                            <Star className={`h-5 w-5 transition-all duration-300 ${template.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-300'}`} />
                        </Button>
                    </div>
                    {template.description && <CardDescription className="text-sm pt-1">{template.description}</CardDescription>}
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                     <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="flex items-center gap-2"><Package className="h-4 w-4 text-primary/70" /><span>{template.items.length} productos</span></div>
                        <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary/70" /><span>~${estimatedTotal.toFixed(2)}</span></div>
                        {template.usage_count > 0 && <div className="flex items-center col-span-2 gap-2"><BarChart2 className="h-4 w-4 text-primary/70" /><span>Usado {template.usage_count} {template.usage_count === 1 ? 'vez' : 'veces'}</span></div>}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1 max-h-24 overflow-y-auto">
                        {template.items.slice(0, 5).map(i => <p key={i.product_id} className="truncate text-foreground/80">• {i.quantity}x {i.product_name || `ID: ${i.product_id.substring(0,8)}`}</p>)}
                        {template.items.length > 5 && <p className="text-muted-foreground italic mt-1">...y {template.items.length - 5} más</p>}
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2 !pt-0">
                    <Button className="flex-1 group" onClick={() => onUse(template)} disabled={isUsing}>
                        {isUsing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                        {isUsing ? 'Creando...' : 'Usar Plantilla'}
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="bg-destructive/80 hover:bg-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar plantilla "{template.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer. La plantilla se eliminará permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(template.id, template.name)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default function TemplatesPage() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usingTemplateId, setUsingTemplateId] = useState(null);

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar las plantillas.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleUseTemplate = async (template) => {
        setUsingTemplateId(template.id);
        try {
            const newRequisitionId = await createRequisitionFromTemplate(template.id);
            await loadTemplates(); // Recargar para mostrar contadores actualizados
            toast({
                title: '✅ ¡Requisición Creada!',
                description: `Se creó una nueva requisición desde la plantilla "${template.name}".`,
                action: <Button variant="outline" size="sm" onClick={() => navigate(`/requisitions/${newRequisitionId}`)}>Ver Requisición <ArrowRight className="w-4 h-4 ml-2" /></Button>,
            });
        } catch (error) {
            toast({ title: 'Error al usar plantilla', description: error.message, variant: 'destructive' });
        } finally {
            setUsingTemplateId(null);
        }
    };

    const handleDelete = async (templateId, templateName) => {
        try {
            await deleteTemplate(templateId);
            setTemplates(prev => prev.filter(t => t.id !== templateId));
            toast({ title: `Plantilla "${templateName}" eliminada`, variant: 'info' });
        } catch (error) {
            toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
        }
    };

    const handleToggleFavorite = async (templateId, newIsFavorite) => {
        try {
            await toggleFavorite(templateId, newIsFavorite);
            setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_favorite: newIsFavorite } : t).sort((a,b) => b.is_favorite - a.is_favorite || 0));
        } catch (error) {
            toast({ title: 'Error al actualizar favorito', description: error.message, variant: 'destructive' });
        }
    };
    
    return (
        <>
            <Helmet>
                <title>Mis Plantillas - ComerECO</title>
                <meta name="description" content="Gestiona tus plantillas de pedidos para crear requisiciones de forma rápida y eficiente." />
            </Helmet>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">📋 Mis Plantillas</h1>
                        <p className="text-sm text-muted-foreground">Crea requisiciones rápidamente usando tus plantillas guardadas.</p>
                    </div>
                </div>

                {loading ? (
                     <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg bg-card/50">
                        <Library className="h-16 w-16 text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold">Aún no tienes plantillas</h2>
                        <p className="text-muted-foreground mt-2 max-w-md">Guarda tu carrito como una plantilla después de comprar para reutilizarlo en futuras requisiciones y agilizar tus pedidos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                        {templates.map(t => (
                            <TemplateCard 
                                key={t.id} 
                                template={t} 
                                onUse={handleUseTemplate}
                                onDelete={handleDelete}
                                onToggleFavorite={handleToggleFavorite}
                                isUsing={usingTemplateId === t.id}
                            />
                        ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </>
    );
}
