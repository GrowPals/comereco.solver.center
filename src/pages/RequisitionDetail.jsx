
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Check, X, Send, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/useToast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import PageLoader from '@/components/PageLoader';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useRequisitionDetails } from '@/hooks/useRequisitions';
import { useRequisitionActions } from '@/hooks/useRequisitionActions';
import logger from '@/utils/logger';


const RequisitionDetail = () => {
    const { id: requisitionId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useSupabaseAuth();
    const { canApproveRequisitions } = useUserPermissions();
    
    const { data: requisition, isLoading, isError, refetch } = useRequisitionDetails(requisitionId);
    const { submit, isSubmitting, approve, isApproving, reject, isRejecting } = useRequisitionActions();

    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (isError) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la requisición.' });
            navigate('/requisitions');
        }
    }, [isError, navigate, toast]);
    
    useEffect(() => {
        if (!requisitionId) return;
        
        const channel = supabase
            .channel(`requisition-detail:${requisitionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'requisitions',
                filter: `id=eq.${requisitionId}`
            }, (payload) => {
                toast({ title: "Requisición actualizada", description: "El estado de la requisición ha cambiado."});
                refetch();
            })
            .subscribe((status) => {
                if(status === 'SUBSCRIBED') {
                    logger.info(`Subscribed to requisition channel: ${requisitionId}`);
                }
            });
        
        return () => {
            supabase.removeChannel(channel).catch(err => logger.error("Error unsubscribing", err));
        };
    }, [requisitionId, toast, refetch]);

    const handleReject = () => {
        if (!rejectionReason) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes proporcionar un motivo.' });
            return;
        }
        reject({ requisitionId, reason: rejectionReason });
    };

    const isOwner = user && requisition && user.id === requisition.created_by;
    const actionLoading = isSubmitting || isApproving || isRejecting;

    if (isLoading) return <PageLoader />;
    if (!requisition) return <div className="p-8 text-center">Requisición no encontrada.</div>;

    const { internal_folio, created_at, business_status, requester, items, total_amount, comments } = requisition;

    const statusConfig = {
        draft: { text: 'Borrador', color: 'bg-gray-500' },
        submitted: { text: 'Enviada', color: 'bg-blue-500' },
        approved: { text: 'Aprobada', color: 'bg-green-500' },
        rejected: { text: 'Rechazada', color: 'bg-red-500' },
        ordered: { text: 'Ordenada', color: 'bg-purple-500' },
        cancelled: { text: 'Cancelada', color: 'bg-gray-700' },
    };

    const currentStatus = statusConfig[business_status] || { text: business_status, color: 'bg-gray-400' };

    return (
        <>
            <Helmet><title>Detalle de Requisición {internal_folio} - ComerECO</title></Helmet>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <header className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Requisición {internal_folio}</h1>
                            <p className="text-sm text-muted-foreground">
                                Creada por {requester?.full_name || 'Desconocido'} el {format(new Date(created_at), 'dd MMM, yyyy', { locale: es })}
                            </p>
                        </div>
                    </div>
                     <Badge className={`${currentStatus.color} text-white`}>{currentStatus.text}</Badge>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={20}/>Ítems de la Requisición</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="divide-y divide-border">
                                    {items.map((item, index) => (
                                        <li key={item.product?.sku || index} className="py-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{item.product?.name || 'Producto no encontrado'}</p>
                                                <p className="text-sm text-muted-foreground">SKU: {item.product?.sku || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{item.quantity} x ${parseFloat(item.unit_price).toFixed(2)}</p>
                                                <p className="text-sm text-muted-foreground">= ${parseFloat(item.subtotal).toFixed(2)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <Separator className="my-4" />
                                <div className="flex justify-end">
                                    <div className="text-right">
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="text-2xl font-bold">${parseFloat(total_amount).toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {comments && (
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare size={20}/>Comentarios</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comments}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {isOwner && business_status === 'draft' && (
                                    <Button className="w-full" onClick={() => submit(requisitionId)} disabled={actionLoading}>
                                        <Send className="mr-2 h-4 w-4" /> Enviar para Aprobación
                                    </Button>
                                )}
                                {canApproveRequisitions && business_status === 'submitted' && (
                                    <>
                                        <Button className="w-full" variant="secondary" onClick={() => approve(requisitionId)} disabled={actionLoading}>
                                            <Check className="mr-2 h-4 w-4" /> Aprobar
                                        </Button>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className="w-full" variant="destructive" disabled={actionLoading}><X className="mr-2 h-4 w-4" /> Rechazar</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Rechazar Requisición</DialogTitle>
                                                    <DialogDescription>Por favor, especifica el motivo del rechazo.</DialogDescription>
                                                </DialogHeader>
                                                <Textarea placeholder="Motivo del rechazo..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                                                <DialogFooter>
                                                    <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || actionLoading}>Confirmar Rechazo</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                )}
                                { (actionLoading) && <PageLoader />}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RequisitionDetail;
