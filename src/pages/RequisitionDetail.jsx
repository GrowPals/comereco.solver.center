
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, User, Calendar, Hash, DollarSign, FileText, Loader2, AlertTriangle, CheckCircle, GitBranch } from 'lucide-react';
import { getRequisitionById } from '@/services/requisitionService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Timeline from '@/components/Timeline';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const businessStatusStyles = {
  draft: 'border-slate-300 bg-slate-50 text-slate-600',
  submitted: 'border-blue-300 bg-blue-50 text-blue-700',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-300 bg-red-50 text-red-700',
  ordered: 'border-indigo-300 bg-indigo-50 text-indigo-700',
  cancelled: 'border-gray-300 bg-gray-50 text-gray-600',
  default: 'border-gray-300 bg-gray-50 text-gray-600'
};

const integrationStatusStyles = {
  draft: 'bg-gray-100 text-gray-600',
  pending_sync: 'bg-yellow-100 text-yellow-800',
  syncing: 'bg-blue-100 text-blue-800 animate-pulse',
  synced: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-600'
};

const DetailSkeleton = () => (
    <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-64 rounded-md" />
                <Skeleton className="h-4 w-48 rounded-md" />
            </div>
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
    </div>
)

const RequisitionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [requisition, setRequisition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comments, setComments] = useState([]); // Placeholder para futuros comentarios

    useEffect(() => {
        const fetchRequisition = async () => {
            setLoading(true);
            try {
                const data = await getRequisitionById(id);
                if (data) {
                    setRequisition(data);
                } else {
                    setError("No se encontró la requisición o no tienes permiso para verla.");
                }
            } catch (err) {
                setError("Ocurrió un error al cargar la requisición.");
            } finally {
                setLoading(false);
            }
        };
        fetchRequisition();
    }, [id]);

    if (loading) return <DetailSkeleton />;

    if (error) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center h-[60vh]">
                <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Error al cargar</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
                <Button onClick={() => navigate('/requisitions')} className="mt-6">Volver a la lista</Button>
            </div>
        );
    }
    
    const statusInfo = businessStatusStyles[requisition.business_status] || businessStatusStyles.default;
    const integrationStatusInfo = integrationStatusStyles[requisition.integration_status] || integrationStatusStyles.default;

    return (
        <>
            <Helmet><title>Detalle de Requisición {requisition.internal_folio} - ComerECO</title></Helmet>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Requisición: {requisition.internal_folio}</h1>
                        <div className="flex items-center gap-4 mt-1">
                             <Badge variant="outline" className={cn('capitalize', statusInfo)}>
                                {requisition.business_status.replace(/_/g, ' ')}
                            </Badge>
                             <Badge variant="secondary" className={cn('capitalize', integrationStatusInfo)}>
                                <GitBranch className="w-3 h-3 mr-1.5" />
                                {requisition.integration_status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader className="p-6 pb-2">
                        <CardTitle className="text-xl">Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 pt-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-muted-foreground flex items-center gap-2"><User size={14}/>Solicitante</p>
                            <p className="font-semibold">{requisition.requester.full_name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground flex items-center gap-2"><Calendar size={14}/>Fecha de Creación</p>
                            <p className="font-semibold">{format(parseISO(requisition.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-muted-foreground flex items-center gap-2"><FileText size={14}/>Compañía</p>
                            <p className="font-semibold">{requisition.company.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground flex items-center gap-2"><DollarSign size={14}/>Monto Total</p>
                            <p className="font-bold text-lg text-primary">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(requisition.total_amount)}</p>
                        </div>
                        {requisition.comments && (
                            <div className="space-y-1 col-span-full">
                                <p className="text-muted-foreground flex items-center gap-2">Comentarios</p>
                                <p className="font-semibold p-3 bg-muted/50 rounded-md">{requisition.comments}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg font-semibold">Productos ({requisition.items.length})</AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-4">
                               {requisition.items.map(item => (
                                   <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                                       <div className="flex items-center gap-4">
                                            <img alt={item.product.name} className="w-16 h-16 object-cover rounded-xl bg-slate-200" src={item.product.image_url || "/placeholder.png"} />
                                            <div>
                                                <p className="font-semibold">{item.product.name}</p>
                                                <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                                            </div>
                                       </div>
                                       <div className="text-right">
                                           <p className="font-semibold">{item.quantity} x {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.unit_price)}</p>
                                           <p className="text-sm text-muted-foreground">Subtotal: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.subtotal)}</p>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg font-semibold">Timeline de Aprobación</AccordionTrigger>
                        <AccordionContent>
                            <Card className="border-none shadow-none"><CardContent className="p-2"><CheckCircle className="text-green-500 w-8 h-8 mr-4"/> Timeline no implementado</CardContent></Card>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-lg font-semibold">Comentarios ({comments.length})</AccordionTrigger>
                        <AccordionContent>
                           <Card className="border-none shadow-none"><CardContent className="p-2"><CheckCircle className="text-green-500 w-8 h-8 mr-4"/> Comentarios no implementado</CardContent></Card>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </div>
        </>
    );
};

export default RequisitionDetail;
